#!/usr/bin/env python3
"""Verify the public site's real native assets and the full-detail Tripo geometry."""
import hashlib, json, struct
from pathlib import Path
ROOT=Path(__file__).resolve().parent
native=ROOT.parent/'art/kestrel/palette-pack-v1'
if native.exists():
    pack=json.loads((native/'pack.json').read_text())
    clips=json.loads((ROOT/'public/assets/sprites/clips.json').read_text())
    for name,clip in clips.items():
        original=pack['clips'][name]
        for field in ('canvas','frames','loop','playbackRate'):
            assert clip[field]==original[field], (name,field)
        for palette,filename in clip['palettes'].items():
            assert (ROOT/'public/assets/sprites'/filename).read_bytes()==(native/original['palettes'][palette]['composite']).read_bytes(), (name,palette)
    print('PASS: all selected native cels, pivots, timings and palettes are byte-identical')
model=ROOT/'public/assets/models/kestrel.glb'
data=model.read_bytes();magic,version,size=struct.unpack_from('<III',data)
assert magic==0x46546c67 and version==2 and size==len(data)
length,kind=struct.unpack_from('<II',data,12);document=json.loads(data[20:20+length])
faces=sum(document['accessors'][primitive['indices']]['count']//3 for mesh in document['meshes'] for primitive in mesh['primitives'])
assert faces==495914,faces
assert document['asset']['generator'].startswith('glTF-Transform') or document['asset']['generator']=='Tripo'
assert not any(name in p.name.lower() for p in (ROOT/'public').rglob('*') for name in ('listening','recording','transcription','tasks.json','keychain'))
assert 'three' not in json.loads((ROOT/'package.json').read_text()).get('dependencies',{})
assert '\u2014' not in (ROOT/'index.html').read_text()
print('PASS: Tripo GLB keeps all 495914 faces; publication tree contains website assets only')

# The website must retain original 4K bytes, not an upscaled 2K copy.
provenance=json.loads((ROOT/'public/assets/provenance.json').read_text())
assert hashlib.sha256(data).hexdigest()==provenance['webGLBSHA256']
binary=data[28+length:]
def image_size(image):
    if image[:8]==b'\x89PNG\r\n\x1a\n':return struct.unpack_from('>II',image,16)
    assert image[:2]==b'\xff\xd8','Expected original PNG/JPEG textures'
    at=2
    while at<len(image):
        if image[at]!=255:at+=1;continue
        while image[at]==255:at+=1
        marker=image[at];at+=1
        if marker in (0xd8,0xd9,0x01) or 0xd0<=marker<=0xd7:continue
        segment=int.from_bytes(image[at:at+2],'big')
        if marker in (0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf):
            height,width=struct.unpack_from('>HH',image,at+3);return width,height
        at+=segment
    raise AssertionError('Texture dimensions missing')
texture_hashes={}
for image in document['images']:
    view=document['bufferViews'][image['bufferView']];offset=view.get('byteOffset',0)
    encoded=binary[offset:offset+view['byteLength']]
    assert image_size(encoded)==(4096,4096),(image['name'],image_size(encoded))
    texture_hashes[image['name']]=hashlib.sha256(encoded).hexdigest()
assert texture_hashes==provenance['originalTextureSHA256']
print('PASS: all three original 4096x4096 textures retained byte-for-byte')

scene=json.loads((ROOT/'public/assets/scenes/manifest.json').read_text())
for name,clip in scene['assets'].items():
    image=ROOT/'public/assets/scenes'/clip['image']
    assert hashlib.sha256(image.read_bytes()).hexdigest()==clip['sha256'],name
    original=ROOT.parent/clip['source']
    if original.exists():assert original.read_bytes()==image.read_bytes(),name
if native.exists():
    dragon=json.loads((ROOT.parent/'art/dragon/ashen-serpent-pack-v1/pack.json').read_text())
    assert scene['fight']==dragon['fight']
    for name,clip in dragon['clips'].items():
        for field in ('canvas','frames','loop','playbackRate'):assert scene['assets'][name][field]==clip[field],(name,field)
    for name in ('hover','hover-attack','fish-wait'):
        for field in ('canvas','frames','loop','playbackRate'):assert scene['assets'][name][field]==pack['clips'][name][field],(name,field)
    assert scene['fishingAnchors']==pack['effects']['fishingLine']['bodyAnchors']['fish-wait']
    assert scene['beam']['bodyAnchors']==pack['effects']['strafeLaser']['bodyAnchors']
print('PASS: fishing/fight sheets, anchors and 24-second timeline preserve approved source assets')
