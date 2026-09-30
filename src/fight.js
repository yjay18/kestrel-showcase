import {fightPose} from './fight-plan.js';
import {frameAt,drawCel,loadSceneImages} from './scene-art.js';

export async function createFightViewer({asset,manifestPromise,isPaused,isShown,resumeMotion}) {
  const canvas=document.querySelector('#fight-canvas'),context=canvas.getContext('2d'),status=document.querySelector('#fight-status');
  const toggle=document.querySelector('#fight-toggle'),scrub=document.querySelector('#fight-scrub'),readout=document.querySelector('#fight-readout');
  let manifest,images,elapsed=0,playing=false,speed=1,last=performance.now(),visible=false;
  const names=['hover','hover-attack','skyline','impact','beam-head','beam-stream','beam-tip','fire-head','fire-stream','fire-tip','dragon-hover','dragon-arrive','dragon-challenge','dragon-fire','dragon-hit','dragon-retreat'];
  try {manifest=await manifestPromise;images=await loadSceneImages(asset,manifest,names);}
  catch {status.textContent='The fight could not load. Reload to retry, or choose another action.';return;}
  status.hidden=true;document.querySelectorAll('#fight-viewer button,#fight-viewer input').forEach(element=>element.disabled=false);
  const a=manifest.assets;context.imageSmoothingEnabled=false;
  const cel=(name,index,x,y,w,h)=>drawCel(context,images[name],a[name],index,x,y,w,h);
  function render() {
    const pose=fightPose(manifest,elapsed),d=pose.dragon,k=pose.kestrel;
    context.clearRect(0,0,1512,800);context.fillStyle='#090b0f';context.fillRect(0,0,1512,800);cel('skyline',0,0,400,1512,400);
    if(pose.beam) {
      const local=pose.beam.time,index=frameAt(a['beam-head'],local),body=frameAt(a[k.clip],local),anchor=manifest.beam.bodyAnchors[body];
      const origin=a['beam-head'].origin,hx=k.x+anchor[0]-origin[0],hy=k.y+anchor[1]-origin[1];
      cel('beam-head',index,hx,hy);
      if(pose.beam.released) {
        const start=hx+a['beam-head'].canvas.width,tile=a['beam-stream'].canvas.width,tip=a['beam-tip'].canvas.width;
        const repeats=Math.max(1,Math.ceil((pose.beam.target-start-tip)/tile));
        for(let i=0;i<repeats;i++)cel('beam-stream',index,start+i*tile,hy);
        cel('beam-tip',index,start+repeats*tile,hy);
      }
    }
    if(pose.fire?.stream) {
      const f=pose.fire,head=a['fire-head'],join=f.mouth[0]-(head.mouthAnchor[0]-head.streamJoinAnchor[0]);
      const tile=a['fire-stream'].canvas.width,repeats=Math.max(1,Math.floor((join-400-120)/tile));
      const top=f.mouth[1]-head.mouthAnchor[1];
      for(let i=0;i<repeats;i++)cel('fire-stream',f.frame,join-(i+1)*tile,top);
      cel('fire-tip',f.frame,join-repeats*tile-a['fire-tip'].streamJoinAnchor[0],top);
    }
    cel(d.clip,d.frame,d.x,d.y);cel(k.clip,frameAt(a[k.clip],k.time),k.x,k.y);
    if(pose.fire) {
      const f=pose.fire,anchor=a['fire-head'].mouthAnchor;cel('fire-head',f.frame,f.mouth[0]-anchor[0],f.mouth[1]-anchor[1]);
    }
    if(pose.impact) {
      const h=pose.impact;cel('impact',frameAt(a.impact,h.time),h.x-h.size/2,h.y-h.size/2,h.size,h.size);
    }
    scrub.value=String(Math.round(elapsed));readout.textContent=`${(elapsed/1000).toFixed(2)} s · ${pose.beat.replaceAll('-',' ')}`;
    canvas.dataset.beat=pose.beat;canvas.dataset.time=String(Math.round(elapsed));
    document.querySelectorAll('[data-fight-beat]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.fightBeat===pose.beat)));
  }
  function playback(value) {playing=value;toggle.textContent=playing?'Pause fight':'Play fight';toggle.setAttribute('aria-pressed',String(playing));if(playing)resumeMotion();}
  document.addEventListener('kestrel-motion',event=>{if(event.detail)playback(false);});
  toggle.addEventListener('click',()=>{if(elapsed>=manifest.fight.durationMs)elapsed=0;playback(!playing);});
  document.querySelector('#fight-replay').addEventListener('click',()=>{elapsed=0;playback(true);render();});
  scrub.addEventListener('input',()=>{elapsed=Number(scrub.value);playback(false);render();});
  document.querySelectorAll('[data-fight-speed]').forEach(button=>button.addEventListener('click',()=>{
    speed=Number(button.dataset.fightSpeed);document.querySelectorAll('[data-fight-speed]').forEach(element=>element.setAttribute('aria-pressed',String(element===button)));
  }));
  document.querySelectorAll('[data-fight-beat]').forEach(button=>button.addEventListener('click',()=>{
    elapsed=manifest.fight.beats.find(beat=>beat.name===button.dataset.fightBeat).startMs;playback(false);render();
  }));
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;}).observe(canvas);
  function tick(now) {
    const delta=Math.min(100,now-last);last=now;
    if(visible&&isShown()&&!document.hidden) {
      if(playing&&!isPaused()) {
        elapsed=Math.min(manifest.fight.durationMs,elapsed+delta*speed);
        if(elapsed===manifest.fight.durationMs)playback(false);
      }
      render();
    }
    requestAnimationFrame(tick);
  }
  render();requestAnimationFrame(tick);
}
