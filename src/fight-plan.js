import {frameAt,clipDuration} from './scene-art.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
// Preserve the approved 1512×800 review field and the native FightPlan staging.
export function fightPose(manifest,elapsed) {
  const a=manifest.assets,f=manifest.fight,c=f.counterShot,t=Math.max(0,Math.min(elapsed,f.durationMs-.001));
  const beat=f.beats.filter(beat=>t>=beat.startMs).at(-1),local=t-beat.startMs;
  let x=850,y=30,clip='dragon-hover',time=local,ky=300;
  const back=c.chargeStartMs+c.durationMs;
  if(t>=c.climbStartMs&&t<c.chargeStartMs)ky+= (c.kestrelTopY-ky)*smooth((t-c.climbStartMs)/c.travelDurationMs);
  else if(t>=c.chargeStartMs&&t<back)ky=c.kestrelTopY;
  else if(t>=back&&t<back+c.travelDurationMs)ky=c.kestrelTopY+(300-c.kestrelTopY)*smooth((t-back)/c.travelDurationMs);
  if(beat.name==='arrival') {
    const length=clipDuration(a['dragon-arrive']),p=Math.min(1,t/length);
    x=1100+(850-1100)*p;y=-260+(30+260)*p;
    clip=t<length?'dragon-arrive':'dragon-hover';time=t<length?t:t-length;
  } else if(beat.name==='challenge'||beat.name==='kestrel-beam') {
    clip='dragon-challenge';time=beat.name==='challenge'?local:clipDuration(a[clip]);
  } else if(beat.name==='dragon-fire') {
    const length=clipDuration(a['dragon-fire']);clip=local<length?'dragon-fire':'dragon-hover';time=local<length?local:local-length;
  } else if(beat.name==='hit')clip='dragon-hit';
  else if(beat.name==='retreat') {
    clip='dragon-retreat';const p=local/(beat.endMs-beat.startMs);x=850+(1320-850)*p;y=30+(-340-30)*p;
  }
  const frame=frameAt(a[clip],time),first=f.beats.find(beat=>beat.name==='kestrel-beam').startMs;
  let beam=null;
  if(t>=first&&t<first+manifest.beam.durationMs)beam={time:t-first,target:x+a['dragon-challenge'].frames.at(-1).hitPoint[0]};
  else if(t>=c.chargeStartMs&&t<c.chargeStartMs+manifest.beam.durationMs)beam={time:t-c.chargeStartMs,target:x+c.dragonContactBodyPoint[0]};
  if(beam)beam.released=beam.time>=manifest.beam.releaseMs;
  const fire=clip==='dragon-fire'?{frame,mouth:[x+a[clip].frames[frame].mouthAnchor[0],y+a[clip].frames[frame].mouthAnchor[1]],stream:local>=manifest.dragonFireReleaseMs&&frame<a[clip].frames.length-1}:null;
  const hit=f.beats.find(beat=>beat.name==='hit').startMs;
  const impact=t>=hit&&t<hit+c.impactDurationMs?{time:t-hit,x:850+c.dragonContactBodyPoint[0],y:30+c.dragonContactBodyPoint[1],size:c.impactSizePx}:null;
  return {time:t,beat:beat.name,dragon:{clip,frame,x,y},kestrel:{clip:beam?'hover-attack':'hover',time:beam?beam.time:t,x:100,y:ky},beam,fire,impact};
}
