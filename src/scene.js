import {Engine} from '@babylonjs/core/Engines/engine';
import {Scene} from '@babylonjs/core/scene';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {CubeTexture} from '@babylonjs/core/Materials/Textures/cubeTexture';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import '@babylonjs/loaders/glTF/2.0/Extensions/EXT_texture_webp';
import '@babylonjs/loaders/glTF/2.0/Extensions/EXT_meshopt_compression';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_mesh_quantization';
import {MeshoptCompression} from '@babylonjs/core/Meshes/Compression/meshoptCompression';

export async function createScene({canvas,asset,gsap,ScrollTrigger,isPaused,isReduced,getTheme}) {
  MeshoptCompression.Configuration.decoder.url=asset('meshopt_decoder.js');
  const engine = new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},true);
  canvas.tabIndex=-1;
  engine.canvasTabIndex=0;
  engine.setHardwareScalingLevel(Math.max(1,devicePixelRatio/1.6));
  const scene=new Scene(engine);
  const camera=new ArcRotateCamera('tour',-1.2,1.25,6.9,new Vector3(-.6,1.7,0),scene);
  camera.minZ=.03;camera.maxZ=100;camera.fov=.65;camera.lowerRadiusLimit=2;camera.upperRadiusLimit=12;
  camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
  const fill=new HemisphericLight('softbox',new Vector3(0,1,.5),scene);fill.intensity=1.55;fill.groundColor=new Color3(.15,.17,.22);
  const key=new DirectionalLight('key',new Vector3(-.6,-.8,1),scene);key.intensity=2.7;
  const rim=new DirectionalLight('rim',new Vector3(.5,-.4,-1),scene);rim.diffuse=new Color3(.64,.7,.86);rim.intensity=2;
  scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.exposure=1.15;
  scene.environmentTexture=CubeTexture.CreateFromPrefilteredData(asset('environment.env'),scene);
  scene.environmentIntensity=.8;
  const model=new TransformNode('kestrel-display',scene);
  model.rotation.y=Math.PI;
  const platformMaterial=new StandardMaterial('platform',scene);platformMaterial.diffuseColor=new Color3(.055,.06,.075);platformMaterial.specularColor=new Color3(.2,.2,.23);
  const platform=MeshBuilder.CreateCylinder('landing-disc',{diameter:3.6,height:.035,tessellation:96},scene);platform.position.y=-.04;platform.material=platformMaterial;
  const ringMaterial=new StandardMaterial('red-inlay',scene);ringMaterial.emissiveColor=Color3.FromHexString('#d83743');ringMaterial.diffuseColor=Color3.FromHexString('#8b1620');
  const ring=MeshBuilder.CreateTorus('landing-inlay',{diameter:3.5,thickness:.009,tessellation:128},scene);ring.position.y=-.014;ring.material=ringMaterial;
  const ground=MeshBuilder.CreateGround('floor',{width:200,height:200},scene);ground.position.y=-.061;ground.isVisible=false;const groundMaterial=new StandardMaterial('seamless-ground',scene);groundMaterial.disableLighting=true;ground.material=groundMaterial;
  const portals=new TransformNode('desktop-planes',scene);
  const panelMaterial=new StandardMaterial('window-matte',scene);panelMaterial.diffuseColor=new Color3(.09,.1,.14);panelMaterial.specularColor=new Color3(.2,.2,.25);
  for (const [i,x,y,z,w,h] of [[0,-3.5,1.4,1.2,2.7,1.6],[1,3.2,2,-1.8,3.2,2],[2,-.4,3.9,-2.7,2.9,1.5]]) {
    const plane=MeshBuilder.CreateBox(`window-${i}`,{width:w,height:h,depth:.025},scene);plane.parent=portals;plane.position.set(x,y,z);plane.rotation.y=x*.07;plane.material=panelMaterial;
    const line=MeshBuilder.CreateBox(`window-edge-${i}`,{width:w,height:.01,depth:.03},scene);line.parent=plane;line.position.y=h/2;line.material=ringMaterial;
  }
  const sonar=new TransformNode('sonar',scene);
  const sonarMaterial=new StandardMaterial('sonar-line',scene);sonarMaterial.emissiveColor=Color3.FromHexString('#ad313b');sonarMaterial.alpha=.23;
  for (let i=0;i<5;i++) {
    const r=MeshBuilder.CreateTorus(`sonar-${i}`,{diameter:4+i*.9,thickness:.009,tessellation:128},scene);r.parent=sonar;r.position.y=-.015+i*.01;r.material=sonarMaterial;
  }
  let imported=[];
  try {
    const result=await SceneLoader.ImportMeshAsync('',asset('models/'),'kestrel.glb',scene);
    imported=result.meshes;
    const root=imported[0];root.computeWorldMatrix(true);
    const bounds=root.getHierarchyBoundingVectors(true),size=bounds.max.subtract(bounds.min),centre=bounds.max.add(bounds.min).scale(.5);
    const scale=3.45/size.y;
    root.parent=model;root.scaling.scaleInPlace(scale);
    root.position.set(-centre.x*scale,-bounds.min.y*scale,-centre.z*scale);
    for (const mesh of imported) {
      if (mesh.material) {mesh.material.backFaceCulling=false;if ('metallic' in mesh.material) {mesh.material.metallic=.5;mesh.material.roughness=.55;}}
      mesh.isPickable=false;
    }
    document.body.classList.add('model-ready');
  } catch (error) {
    document.querySelector('#model-status').textContent='The 3D model could not load. Try the original animation playground below.';
    ground.setEnabled(false);platform.setEnabled(false);ring.setEnabled(false);
  }
  const desktopLabel=new DynamicTexture('desktop-lettering',{width:1024,height:512},scene,false);
  const context=desktopLabel.getContext();context.clearRect(0,0,1024,512);context.fillStyle='#a7aab4';context.font='50px sans-serif';context.fillText('A little room for Kestrel.',65,210);desktopLabel.update();
  const labelMaterial=new StandardMaterial('lettering',scene);labelMaterial.diffuseTexture=desktopLabel;labelMaterial.diffuseTexture.hasAlpha=true;labelMaterial.emissiveTexture=desktopLabel;labelMaterial.useAlphaFromDiffuseTexture=true;labelMaterial.backFaceCulling=false;
  const label=MeshBuilder.CreatePlane('desktop-label',{width:3,height:1.5},scene);label.material=labelMaterial;label.parent=portals;label.position.set(3.2,2.1,-1.775);
  const mobile=()=>innerWidth<768;
  const frames=[
    {a:-1.12,b:1.24,r:7.3,t:[-1.25,1.7,0]},
    {a:-2.35,b:1.28,r:5.5,t:[.95,1.35,0]},
    {a:-3.4,b:1.12,r:4.5,t:[-.8,2.2,0]},
    {a:-4.45,b:1.32,r:4.1,t:[.8,2.45,0]},
    {a:-5.65,b:1.34,r:5.7,t:[-.8,1.8,0]},
    {a:-7.28,b:.94,r:10.1,t:[-.8,1.6,0]},
    {a:-7.5,b:1.1,r:11.5,t:[0,1.7,0]},
  ];
  let progress=0,freeOrbit=false;
  const timeline=ScrollTrigger.create({trigger:'#story',start:'top top',end:'bottom top',onUpdate:self=>{progress=self.progress;},invalidateOnRefresh:true});
  const stage=document.querySelector('#stage');
  ScrollTrigger.create({trigger:'#desktop',start:'top bottom',end:'top top',onUpdate:self=>{stage.style.opacity=String(1-self.progress);},onLeaveBack:()=>stage.style.opacity='1'});
  function theme() {
    const dark=getTheme()==='dark';scene.clearColor=Color4.FromHexString(dark?'#0b0c0fff':'#eceef2ff');
    groundMaterial.emissiveColor=Color3.FromHexString(dark?'#0b0c0f':'#eceef2');
    platformMaterial.diffuseColor=Color3.FromHexString(dark?'#0b0c0f':'#dde1e8');
    panelMaterial.diffuseColor=Color3.FromHexString(dark?'#15171d':'#d0d6df');
    fill.intensity=dark?1.55:1.9;
  }
  document.addEventListener('kestrel-theme',theme);theme();
  function updateCamera() {
    if (freeOrbit) return;
    const x=Math.min(progress*6,5.9999),i=Math.floor(x),p=x-i;
    const ease=isReduced()||isPaused()?0:p*p*(3-2*p),a=frames[i],b=frames[i+1];
    camera.alpha=a.a+(b.a-a.a)*ease;camera.beta=a.b+(b.b-a.b)*ease;camera.radius=(a.r+(b.r-a.r)*ease)*(mobile()?1.42:1);
    const target=a.t.map((value,index)=>value+(b.t[index]-value)*ease);
    if (mobile()) {target[0]=0;target[1]+=1.45;camera.beta=1.33;}
    camera.setTarget(Vector3.FromArray(target));
    const framesAway=Math.max(0,Math.min(1,(progress-.08)/.15))*Math.max(0,1-(progress-.34)/.14);
    portals.getChildMeshes().forEach(mesh=>mesh.visibility=framesAway+(progress>.8?.8:0));
    sonar.getChildMeshes().forEach(mesh=>mesh.visibility=progress>.6&&progress<.83?1:0);
  }
  document.querySelector('#orbit-open').addEventListener('click',()=>{
    freeOrbit=true;document.body.classList.add('orbiting');document.querySelector('#orbit-controls').hidden=false;
    camera.target.set(0,1.7,0);camera.radius=6.4;camera.beta=1.3;camera.attachControl(canvas,true);canvas.tabIndex=0;stage.style.opacity='1';
    document.querySelector('#orbit-close').focus();
  });
  function closeOrbit() {
    if (!freeOrbit) return;
    freeOrbit=false;camera.detachControl();canvas.tabIndex=-1;document.body.classList.remove('orbiting');document.querySelector('#orbit-controls').hidden=true;
    document.querySelector('#orbit-open').focus();
  }
  document.querySelector('#orbit-close').addEventListener('click',closeOrbit);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeOrbit();});
  document.querySelectorAll('.navigation a').forEach(link=>link.addEventListener('click',closeOrbit));
  engine.runRenderLoop(()=>{
    if (document.hidden) return;
    updateCamera();
    model.position.y=isPaused()||isReduced()?0:Math.sin(performance.now()*.0007)*.025;
    scene.render();
  });
  window.addEventListener('resize',()=>{engine.resize();ScrollTrigger.refresh();});
  window.addEventListener('pagehide',()=>{timeline.kill();engine.dispose();},{once:true});
}
