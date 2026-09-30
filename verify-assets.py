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
