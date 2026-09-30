import {frameAt,drawCel,loadSceneImages} from './scene-art.js';

export function createFishingLoader(asset,manifestPromise,isPaused) {
  const loader=document.querySelector('#model-loader'),canvas=document.querySelector('#loading-fishing'),context=canvas.getContext('2d');
  const content=[...document.querySelectorAll('.navigation,main,footer,.skip')];content.forEach(element=>element.inert=true);
  let dismissed=false,elapsed=0,last=performance.now(),manifest,images,frameRequest;
  const status=document.querySelector('#loading-status');
  function dismiss() {
    if(dismissed)return;
    dismissed=true;cancelAnimationFrame(frameRequest);loader.hidden=true;document.body.classList.remove('model-loading');content.forEach(element=>element.inert=false);
  }
  document.querySelector('#loading-skip').addEventListener('click',()=>{
    dismiss();history.replaceState(null,'','#desktop');document.querySelector('#desktop').scrollIntoView({behavior:'instant'});
  });
  document.querySelector('#loading-retry').addEventListener('click',()=>location.reload());
  document.addEventListener('kestrel-model-ready',dismiss,{once:true});
  document.addEventListener('kestrel-model-error',()=>{
    status.textContent='The 3D model could not load. The animation viewer is still available.';
    document.querySelector('#loading-retry').hidden=false;
  },{once:true});
  document.addEventListener('kestrel-model-progress',event=>{
    if(dismissed)return;
    const {loaded,total}=event.detail;
    status.textContent=total?`Loading 4K textures · ${Math.floor(loaded/total*100)}%`:`Loading 4K textures · ${(loaded/1000000).toFixed(1)} MB`;
  });
  function draw(now) {
    const delta=Math.min(100,now-last);last=now;
    if(!document.hidden&&!isPaused())elapsed+=delta;
    if(manifest&&images&&!document.hidden) {
      const a=manifest.assets,body=frameAt(a['fish-wait'],elapsed),line=frameAt(a['fishing-segment'],elapsed),bobber=frameAt(a['fishing-bobber'],elapsed);
      context.clearRect(0,0,canvas.width,canvas.height);context.imageSmoothingEnabled=false;
      // Native ledge, silver line tiles and bobber, at the approved seat/rod anchors.
      context.drawImage(images.ledge,0,0,310,160,0,213,310,160);
      const anchor=manifest.fishingAnchors[body],x=20+anchor[0],y=anchor[1],length=170+[0,2,4,1,-1,0][body];
      const tile=a['fishing-segment'].frames[line].frame;
      for(let at=0;at<length;at+=64) {
        const height=Math.min(64,length-at);
        context.drawImage(images['fishing-segment'],tile.x,tile.y,16,height,x-8,y+at,16,height);
      }
      drawCel(context,images['fishing-bobber'],a['fishing-bobber'],bobber,x-32,y+length-17);
      drawCel(context,images['fish-wait'],a['fish-wait'],body,20,0);
    }
    if(!dismissed)frameRequest=requestAnimationFrame(draw);
  }
  manifestPromise.then(async data=>{
    images=await loadSceneImages(asset,data,['fish-wait','fishing-segment','fishing-bobber','ledge']);manifest=data;
  }).catch(()=>{canvas.setAttribute('aria-label','Kestrel is taking a fishing break while the model loads.');});
  frameRequest=requestAnimationFrame(draw);
}
