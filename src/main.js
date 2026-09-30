import '@fontsource/ibm-plex-mono/latin-400.css';
import './style.css';
import {createFishingLoader} from './loading.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const $ = (selector) => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
let theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
const base = import.meta.env.BASE_URL;
const asset = (name) => `${base}assets/${name}`;
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  $('#theme-toggle').textContent = theme === 'dark' ? 'Light' : 'Dark';
  $('#theme-toggle').setAttribute('aria-label', `Use ${theme === 'dark' ? 'light' : 'dark'} theme`);
  document.dispatchEvent(new CustomEvent('kestrel-theme', {detail:theme}));
}
$('#theme-toggle').addEventListener('click', () => {theme = theme === 'dark' ? 'light' : 'dark'; applyTheme();});
function applyMotion() {
  $('#motion-toggle').textContent = paused ? 'Resume motion' : 'Pause motion';
  $('#motion-toggle').setAttribute('aria-pressed', String(paused));
  document.dispatchEvent(new CustomEvent('kestrel-motion', {detail:paused}));
}
$('#motion-toggle').addEventListener('click', () => {paused = !paused; applyMotion();});
reduced.addEventListener('change', (event) => {paused = event.matches; applyMotion();});
applyTheme(); applyMotion();
const sceneManifest=fetch(asset('scenes/manifest.json')).then(response=>{
  if(!response.ok)throw new Error('Scene manifest unavailable');
  return response.json();
});
createFishingLoader(asset,sceneManifest,()=>paused);

// Read-only native export metadata; never redraw, interpolate or retime approved cels.
const clips = await fetch(asset('sprites/clips.json')).then(response => {
  if (!response.ok) throw new Error('Animation manifest unavailable');
  return response.json();
});
const sheets = new Map();
function loadSheet(name) {
  if (!sheets.has(name)) sheets.set(name, new Promise((resolve,reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject;
    image.src = asset(`sprites/${name}`);
  }));
  return sheets.get(name);
}
class Sprite {
  constructor(canvas, action, palette) {
    this.canvas = canvas; this.context = canvas.getContext('2d'); this.elapsed = 0; this.visible = false; this.ticket = 0;
    this.pending = [action,palette];
  }
  async set(action, palette) {
    this.pending=null;
    const ticket = ++this.ticket;
    try {
      const image = await loadSheet(clips[action].palettes[palette]);
      if (ticket !== this.ticket) return;
      this.action = action; this.palette = palette; this.image = image; this.clip = clips[action]; this.elapsed = 0;
      this.total = this.clip.frames.reduce((sum, f) => sum + f.duration / this.clip.playbackRate, 0);
      this.draw(0);
    } catch { this.canvas.setAttribute('aria-label','Animation unavailable. Try another action.'); }
  }
  draw(delta) {
    if (!this.image || !this.clip) return;
    if (!paused) this.elapsed += delta;
    let t = this.clip.loop ? this.elapsed % this.total : Math.min(this.elapsed, this.total - .01);
    let frame = this.clip.frames[this.clip.frames.length - 1];
    for (const candidate of this.clip.frames) {
      const duration = candidate.duration / this.clip.playbackRate;
      if (t < duration) {frame = candidate;break;} t -= duration;
    }
    const f = frame.frame, c = this.canvas;
    this.context.clearRect(0,0,c.width,c.height); this.context.imageSmoothingEnabled = false;
    // Place every clip at its native pivot in the common 380-pixel canvas.
    const x = c.width / 2 - this.clip.canvas.pivot[0];
    const y = 340 - this.clip.canvas.pivot[1];
    this.context.drawImage(this.image,f.x,f.y,f.w,f.h,x,y,f.w,f.h);
  }
}
const previews = [...document.querySelectorAll('[data-clip]')].map(canvas => new Sprite(canvas,canvas.dataset.clip,canvas.dataset.palette));
const demo = new Sprite($('#desktop-sprite'),'idle','red');
const sprites = [...previews,demo];
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {const s = sprites.find(sprite => sprite.canvas === entry.target);if (s) {s.visible = entry.isIntersecting;if (s.visible && s.pending) {s.set(...s.pending);s.pending=null;}}}
});
sprites.forEach(s=>observer.observe(s.canvas));
let palette = 'red', selectedAction = 'idle', roaming = true, demoX = 0, drag = null, last = performance.now(), roamingPhase = -1;
const desk = $('.desk-surface');
let fightPromise;
function setAction(action) {
  selectedAction = action;
  document.querySelectorAll('[data-action]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.action === action)));
  const fight=action==='dragon-fight';
  $('#fight-viewer').hidden=!fight;desk.hidden=fight;$('#demo-roam').hidden=fight;
  $('.demo-controls fieldset').hidden=fight;$('#demo-title').textContent=fight?'Kestrel × Ashen Serpent':'Kestrel animation playground';
  if(fight) {
    fightPromise??=import('./fight.js').then(({createFightViewer})=>createFightViewer({asset,manifestPromise:sceneManifest,isPaused:()=>paused,isShown:()=>selectedAction==='dragon-fight',resumeMotion:()=>{paused=false;applyMotion();}})).catch(()=>{$('#fight-status').textContent='The fight could not load. Reload to retry, or choose another action.';});
  } else demo.set(action,palette);
}
function setPalette(value) {
  palette = value;
  document.querySelectorAll('.demo-controls [data-palette]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.palette === value)));
  demo.set(selectedAction,palette);
}
function setRoaming(value) {
  roaming=value; $('#demo-roam').textContent=roaming?'Roaming on':'Roaming off';$('#demo-roam').setAttribute('aria-pressed',String(roaming));
  roamingPhase=-1;if (!roaming) setAction('idle');
}
$('#demo-roam').addEventListener('click',()=>setRoaming(!roaming));
document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{setRoaming(false);setAction(button.dataset.action);}));
document.querySelectorAll('.demo-controls [data-palette]').forEach(button=>button.addEventListener('click',()=>setPalette(button.dataset.palette)));
$('#desktop-sprite').addEventListener('pointerdown',event=>{
  drag={start:event.clientX,x:demoX};setRoaming(false);event.currentTarget.setPointerCapture(event.pointerId);
});
$('#desktop-sprite').addEventListener('pointermove',event=>{
  if (!drag) return;demoX=Math.max(0,Math.min(desk.clientWidth-$('#desktop-sprite').clientWidth,drag.x+event.clientX-drag.start));
  $('#desktop-sprite').style.transform=`translate3d(${demoX}px,0,0)`;
});
$('#desktop-sprite').addEventListener('pointerup',()=>{drag=null;});
$('#desktop-sprite').addEventListener('pointercancel',()=>{drag=null;});
let bubbleTimer;
$('#demo-tasks').addEventListener('change', event=>{
  if (event.target.type!=='checkbox') return;
  event.target.closest('li').classList.toggle('done',event.target.checked);
  if (!event.target.checked) return;
  setRoaming(false);setPalette('pearl');setAction('welcome-back');
  $('#sprite-bubble').hidden=false;$('#sprite-bubble').style.transform=`translateX(${Math.max(0,demoX-15)}px)`;
  clearTimeout(bubbleTimer);bubbleTimer=setTimeout(()=>{$('#sprite-bubble').hidden=true;setPalette('red');setAction('idle');},3500);
});
$('#task-form').addEventListener('submit',event=>{
  event.preventDefault();const input=$('#task-input');const title=input.value.trim();if (!title) return;
  if ($('#demo-tasks').children.length>=8) {input.setCustomValidity('Complete the demo with up to eight tasks.');input.reportValidity();return;}
  const li=document.createElement('li'),label=document.createElement('label'),check=document.createElement('input');
  check.type='checkbox';label.append(check,document.createTextNode(title));li.append(label);$('#demo-tasks').append(li);input.value='';
});
$('#task-input').addEventListener('input',event=>event.target.setCustomValidity(''));
function animateSprites(now) {
  const delta=Math.min(100,now-last);last=now;
  if (!document.hidden) {
    sprites.filter(s=>s.visible).forEach(s=>s.draw(delta));
    if (demo.visible && roaming && !paused && !drag) {
      const cycle=(now/1000)%20, width=desk.clientWidth-$('#desktop-sprite').clientWidth;
      const phase=cycle<8?0:cycle<11?1:cycle<17?2:3;
      if (phase!==roamingPhase) {roamingPhase=phase;setAction(['walk','thrust-up','hover','land'][phase]);}
      const x=cycle<8?cycle/8:cycle<11?1:cycle<17?1-(cycle-11)/6:0;
      demoX=width*x;
      const rise=cycle<8?0:cycle<11?Math.sin((cycle-8)/3*Math.PI/2)*160:cycle<17?160:160*(1-(cycle-17)/3);
      $('#desktop-sprite').style.transform=`translate3d(${demoX}px,${-rise}px,0) scaleX(${phase===2?-1:1})`;
    }
  }
  requestAnimationFrame(animateSprites);
}
requestAnimationFrame(animateSprites);

// The large WebGL runtime is deferred; readable content and native art appear immediately.
const startScene=()=>import('./scene.js').then(({createScene})=>createScene({
  canvas:$('#model-canvas'),asset,gsap,ScrollTrigger,isPaused:()=>paused,isReduced:()=>reduced.matches,getTheme:()=>theme,
})).catch(()=>{$('#model-status').textContent='3D could not load. Kestrel’s original animations are still available below.';document.dispatchEvent(new Event('kestrel-model-error'));});

if ('requestIdleCallback' in window) requestIdleCallback(startScene,{timeout:1500}); else setTimeout(startScene,100);
