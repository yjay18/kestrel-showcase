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
import {ImageProcessingConfiguration} from '@babylonjs/core/Materials/imageProcessingConfiguration';
import {tourPose} from './tour.js';
import {CubeTexture} from '@babylonjs/core/Materials/Textures/cubeTexture';
import '@babylonjs/loaders/glTF/2.0/glTFLoader';
import '@babylonjs/loaders/glTF/2.0/Extensions/EXT_meshopt_compression';
import '@babylonjs/loaders/glTF/2.0/Extensions/KHR_mesh_quantization';
import {MeshoptCompression} from '@babylonjs/core/Meshes/Compression/meshoptCompression';

export async function createScene({canvas,asset,gsap,ScrollTrigger,isPaused,isReduced,getTheme}) {
  MeshoptCompression.Configuration.decoder.url=asset('meshopt_decoder.js');
  const engine = new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true},false);
  canvas.tabIndex=-1;
  engine.canvasTabIndex=0;
  // Babylon divides canvas dimensions by this value. Use the inverse DPR so
  // Retina displays receive actual detail instead of an enlarged low-res image.
  const resizeRender=()=>engine.setHardwareScalingLevel(1/Math.max(1,Math.min(devicePixelRatio,2)));
  resizeRender();
  const scene=new Scene(engine);
  const camera=new ArcRotateCamera('tour',-1.1,1.2,1.85,new Vector3(0,2.5,0),scene);
  camera.minZ=.03;camera.maxZ=100;camera.fov=.7;camera.lowerRadiusLimit=.8;camera.upperRadiusLimit=12;
  camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
  const fill=new HemisphericLight('softbox',new Vector3(0,1,.5),scene);fill.intensity=.25;fill.groundColor=new Color3(.15,.17,.22);
  const key=new DirectionalLight('key',new Vector3(-.6,-.8,1),scene);key.intensity=2.1;
  const rim=new DirectionalLight('rim',new Vector3(.5,-.4,-1),scene);rim.diffuse=new Color3(.64,.7,.86);rim.intensity=1;
  scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1;
  scene.environmentTexture=CubeTexture.CreateFromPrefilteredData(asset('environment.env'),scene);
  scene.environmentIntensity=.35;
  const model=new TransformNode('kestrel-display',scene);
  model.rotation.y=Math.PI;
  const platformMaterial=new StandardMaterial('platform',scene);platformMaterial.diffuseColor=new Color3(.055,.06,.075);platformMaterial.specularColor=new Color3(.2,.2,.23);
  const platform=MeshBuilder.CreateCylinder('landing-disc',{diameter:3.6,height:.035,tessellation:96},scene);platform.position.y=-.04;platform.material=platformMaterial;
  const ringMaterial=new StandardMaterial('red-inlay',scene);ringMaterial.emissiveColor=Color3.FromHexString('#d83743');ringMaterial.diffuseColor=Color3.FromHexString('#8b1620');
  const ring=MeshBuilder.CreateTorus('landing-inlay',{diameter:3.5,thickness:.009,tessellation:128},scene);ring.position.y=-.014;ring.material=ringMaterial;
  let imported=[];
  try {
    const result=await SceneLoader.ImportMeshAsync('',asset('models/'),'kestrel.glb?texture=4k-original',scene,event=>document.dispatchEvent(new CustomEvent('kestrel-model-progress',{detail:{loaded:event.loaded,total:event.lengthComputable?event.total:0}})),'.glb');
    imported=result.meshes;
    const root=imported[0];root.computeWorldMatrix(true);
    const bounds=root.getHierarchyBoundingVectors(true),size=bounds.max.subtract(bounds.min),centre=bounds.max.add(bounds.min).scale(.5);
    const scale=3.45/size.y;
    root.parent=model;root.scaling.scaleInPlace(scale);
    root.position.set(-centre.x*scale,-bounds.min.y*scale,-centre.z*scale);
    for (const mesh of imported) {
      // Preserve Tripo's base colour, normal and metallic/roughness maps.
      if (mesh.material) {
        mesh.material.backFaceCulling=false;
        for(const texture of mesh.material.getActiveTextures()) {
          texture.anisotropicFilteringLevel=Math.min(16,engine.getCaps().maxAnisotropy||1);
        }
      }
      mesh.isPickable=false;
    }
  } catch (error) {
    document.querySelector('#model-status').textContent='The 3D model could not load. Try the original animation playground below.';
    platform.setEnabled(false);ring.setEnabled(false);document.dispatchEvent(new Event('kestrel-model-error'));
  }
  const mobile=()=>innerWidth<768;
  let progress=0,destination=0,freeOrbit=false;
  const look={x:0,y:0,targetX:0,targetY:0};
  window.addEventListener('pointermove',event=>{
    if(event.isPrimary===false)return;
    look.targetX=Math.max(-1,Math.min(1,event.clientX/innerWidth*2-1));
    look.targetY=Math.max(-1,Math.min(1,event.clientY/innerHeight*2-1));
  },{passive:true});
  const resetLook=()=>{look.targetX=0;look.targetY=0;};
  window.addEventListener('pointerout',event=>{if(!event.relatedTarget)resetLook();});
  window.addEventListener('pointerup',event=>{if(event.pointerType!=='mouse')resetLook();});
  window.addEventListener('pointercancel',resetLook);window.addEventListener('blur',resetLook);
  const timeline=ScrollTrigger.create({trigger:'#story',start:'top top',end:'bottom bottom',onUpdate:self=>{destination=self.progress;},invalidateOnRefresh:true});
  destination=timeline.progress;progress=destination;
  const stage=document.querySelector('#stage');
  ScrollTrigger.create({trigger:'#desktop',start:'top 55%',end:'top top',onUpdate:self=>{stage.style.opacity=String(1-self.progress);},onLeaveBack:()=>stage.style.opacity='1'});
  function theme() {
    const dark=getTheme()==='dark';scene.clearColor=Color4.FromHexString(dark?'#0b0c0fff':'#eceef2ff');
    platformMaterial.diffuseColor=Color3.FromHexString(dark?'#0b0c0f':'#dde1e8');
    // Theme changes the backdrop, not the model's lighting or materials.
  }
  document.addEventListener('kestrel-theme',theme);theme();
  function updateCamera() {
    if (freeOrbit) return;
    // One continuous path; feature sections never restart or stop the camera.
    // Motion preferences remove smoothing and idle movement, retaining scroll navigation.
    const pose=tourPose(progress,mobile());
    // Small live look-around offsets preserve the close framing and delayed reveal.
    const motion=isPaused()||isReduced()?0:1;
    camera.alpha=pose.alpha+look.x*.085*motion;camera.beta=pose.beta+look.y*.045*motion;camera.radius=pose.radius;
    camera.setTarget(Vector3.FromArray(pose.target),false,false,true);
    platform.visibility=pose.reveal;ring.visibility=pose.reveal;
  }
  document.querySelector('#orbit-open').addEventListener('click',()=>{
    freeOrbit=true;document.body.classList.add('orbiting');document.querySelector('#orbit-controls').hidden=false;
    const pose=tourPose(1,mobile());camera.alpha=pose.alpha;camera.setTarget(new Vector3(0,mobile()?1.2:1.7,0),false,false,true);camera.radius=mobile()?8.6:6.4;camera.beta=pose.beta;camera.attachControl(canvas,true);canvas.tabIndex=0;stage.style.opacity='1';
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
  let lastFrame=performance.now();
  engine.runRenderLoop(()=>{
    const now=performance.now(),delta=Math.min(100,now-lastFrame);lastFrame=now;
    progress+=(destination-progress)*(isPaused()||isReduced()?1:1-Math.exp(-delta/160));
    const follow=1-Math.exp(-delta/180);
    look.x+=(look.targetX-look.x)*follow;look.y+=(look.targetY-look.y)*follow;
    if (document.hidden || (!freeOrbit && stage.style.opacity==='0')) return;
    updateCamera();
    // Keep the subject fixed: scrolling alone controls the fly-through.
    scene.render();
  });
  if(imported.length)scene.executeWhenReady(()=>{updateCamera();scene.render();document.body.classList.add('model-ready');document.dispatchEvent(new Event('kestrel-model-ready'));});
  window.addEventListener('resize',()=>{resizeRender();ScrollTrigger.refresh();});
  window.addEventListener('pagehide',()=>{timeline.kill();engine.dispose();},{once:true});
}
