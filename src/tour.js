// A single orbit descends across the armour, with one final full-body pullback.
// Quintic blending joins the reveal without a velocity or acceleration jump.
const blend=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
export function tourPose(progress,mobile=false) {
  const p=Math.max(0,Math.min(1,progress));
  const reveal=blend((p-.84)/.16);
  const alpha=-1.1-2*Math.PI*1.08*p;
  const closeRadius=1.85+.22*Math.sin(2*Math.PI*p);
  const closeY=2.5-.6*p-.9*Math.sin(Math.PI*.9*p);
  const targetX=-.6*Math.cos(6*Math.PI*p);
  return {
    alpha,
    beta:1.2+.16*Math.sin(2*Math.PI*p)*(1-reveal)+.1*reveal,
    radius:closeRadius+(mobile?9.4-closeRadius:7.5-closeRadius)*reveal,
    target:[mobile?0:targetX+(-1.05-targetX)*reveal,closeY+(1.72-closeY)*reveal+(mobile?.85+.45*reveal:0),0],
    reveal,
  };
}
