import {ShaderMaterial} from '@babylonjs/core/Materials/shaderMaterial';
import {Color4} from '@babylonjs/core/Maths/math.color';

// Original shader inspired by Tripo's viewer presentation; no Tripo shader code
// or assets are copied. The authored metal materials are restored after the scan.
export function createHologramIntro(scene,meshes,camera) {
  const shader=new ShaderMaterial('kestrel-hologram',scene,{
    vertexSource:`precision highp float;
      attribute vec3 position; attribute vec3 normal;
      uniform mat4 world; uniform mat4 worldViewProjection;
      varying vec3 vPosition; varying vec3 vNormal;
      void main(){vPosition=(world*vec4(position,1.0)).xyz;
        vNormal=normalize(mat3(world)*normal);
        gl_Position=worldViewProjection*vec4(position,1.0);}`,
    fragmentSource:`precision highp float;
      uniform float clock; uniform vec3 eye;
      varying vec3 vPosition; varying vec3 vNormal;
      void main(){
        float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(eye-vPosition))),1.7);
        float lines=1.0-smoothstep(.025,.11,abs(fract(vPosition.y*58.0-clock*.4)-.5));
        float scan=exp(-pow((vPosition.y-(3.8-clock*1.8))/.11,2.0));
        float grain=.92+.08*sin(dot(floor(vPosition*180.0),vec3(12.9,78.2,31.4))+floor(clock*12.0));
        vec3 cyan=vec3(.28,.86,.78);
        gl_FragColor=vec4(cyan*(.25+rim*.8+lines*.18+scan*.85)*grain,.18+rim*.64+lines*.1+scan*.3);
      }`,
  },{attributes:['position','normal'],uniforms:['world','worldViewProjection','clock','eye'],needAlphaBlending:true});
  shader.backFaceCulling=false;
  const originals=meshes.filter(mesh=>mesh.material).map(mesh=>[mesh,mesh.material]);
  const panel=document.querySelector('#hologram-splash');
  const content=[...document.querySelectorAll('.navigation,main,footer')];
  let active=false,preview=false,elapsed=0,backdrop;
  function finish() {
    if(!active)return;
    for(const type of ['pointerdown','wheel','keydown'])window.removeEventListener(type,finish,true);
    active=false;for(const [mesh,material] of originals)mesh.material=material;
    scene.clearColor=backdrop;panel.hidden=true;document.body.classList.remove('hologram-start');
    content.forEach(element=>element.inert=false);
  }
  document.querySelector('#hologram-skip').addEventListener('click',finish);
  return {
    async prepare(){if(originals.length)await shader.forceCompilationAsync(originals[0][0]);},
    finish,
    start(options={}){
      if(!originals.length)return;
      finish();active=true;preview=!!options.preview;elapsed=0;backdrop=scene.clearColor.clone();scene.clearColor=Color4.FromHexString('#080e10ff');
      for(const [mesh] of originals)mesh.material=shader;
      if(!preview){
        panel.hidden=false;document.body.classList.add('hologram-start');content.forEach(element=>element.inert=true);
        for(const type of ['pointerdown','wheel','keydown'])window.addEventListener(type,finish,{capture:true,passive:true});
      }
    },
    tick(delta,stop){
      if(!active)return;
      if(!preview&&scrollY>5){finish();return;}
      if(!stop)elapsed+=delta;
      shader.setFloat('clock',(elapsed%2200)/1000);shader.setVector3('eye',camera.position);
    },
  };
}
