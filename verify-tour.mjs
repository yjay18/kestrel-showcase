import {tourPose} from './src/tour.js';
import assert from 'node:assert/strict';

// Regression guard for the narrative: continuous orbit, no cuts or early pullback.
for (const mobile of [false,true]) {
  let previous=tourPose(0,mobile);
  for (let i=1;i<=10000;i++) {
    const p=i/10000,pose=tourPose(p,mobile);
    assert(pose.alpha<previous.alpha,'orbit must keep moving in one direction');
    assert(Math.abs(pose.radius-previous.radius)<.02,'camera radius must remain continuous');
    if (p<=.84) assert(pose.radius<2.1,'full-body pullback must wait for the closing reveal');
    for (let axis=0;axis<3;axis++) assert(Math.abs(pose.target[axis]-previous.target[axis])<.003,'camera target must remain continuous');
    previous=pose;
  }
  assert(previous.radius>=7.5,'the ending must reveal the body');
}
console.log('PASS: desktop/mobile orbit continuity and delayed full-body reveal');
