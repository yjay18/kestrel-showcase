export function clipDuration(clip) {
  return clip.frames.reduce((sum,frame)=>sum+frame.duration,0)/(clip.playbackRate??1);
}
export function frameAt(clip,elapsed) {
  const total=clipDuration(clip);
  let time=clip.loop?Math.max(0,elapsed)%total:Math.max(0,Math.min(elapsed,total-.001));
  for(let i=0;i<clip.frames.length;i++) {
    const duration=clip.frames[i].duration/(clip.playbackRate??1);
    if(time<duration)return i;
    time-=duration;
  }
  return clip.frames.length-1;
}
const images=new Map();
export function loadSceneImages(asset,manifest,names) {
  return Promise.all(names.map(name=>{
    const url=asset(`scenes/${manifest.assets[name].image}`);
    if(!images.has(url))images.set(url,new Promise((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Could not load ${name}`));image.src=url;
    }));
    return images.get(url).then(image=>[name,image]);
  })).then(entries=>Object.fromEntries(entries));
}
export function drawCel(context,image,clip,index,x,y,width,height) {
  const frame=clip.frames[index].frame;
  context.drawImage(image,frame.x,frame.y,frame.w,frame.h,x,y,width??frame.w,height??frame.h);
}
