import { Box3, Vector3 } from 'three';
import { yieldToBrowser } from '../utils/yield.js';

// YXZ pitch is evaluated before yaw. A bounded Y/Z envelope avoids scanning
// original vertices during drag; async construction yields between small batches.
function* profile(root,bins){
  root.updateWorldMatrix(true,true);
  const box=new Box3().setFromObject(root),depth=box.max.z-box.min.z;
  const cells=Array.from({length:bins},()=>({y:Infinity,yMax:-Infinity,zMin:Infinity,zMax:-Infinity}));
  const point=new Vector3(),meshes=[];root.traverse(object=>{if(object.geometry?.attributes.position)meshes.push(object);});
  let processed=0;
  for(const object of meshes){
    const positions=object.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);
      const index=depth?Math.min(bins-1,Math.floor((point.z-box.min.z)/depth*bins)):0;
      const item=cells[Math.max(0,index)];item.y=Math.min(item.y,point.y);item.yMax=Math.max(item.yMax,point.y);item.zMin=Math.min(item.zMin,point.z);item.zMax=Math.max(item.zMax,point.z);
      if(++processed%32768===0)yield;
    }
  }
  const points=cells.filter(item=>Number.isFinite(item.y));
  if(!points.length)throw new Error('Empty shoe support profile.');
  return {count:points.length,minY(pitch){
    const cos=Math.cos(pitch),sin=Math.sin(pitch);let min=Infinity;
    for(const point of points)min=Math.min(min,(cos>=0?point.y:point.yMax)*cos-(sin>=0?point.zMax:point.zMin)*sin);
    return min;
  }};
}
export function buildSoleProfile(root,bins=1024){
  const work=profile(root,bins);let step;do{step=work.next();}while(!step.done);return step.value;
}
export async function buildSoleProfileAsync(root,bins=1024,signal){
  const work=profile(root,bins);
  while(true){signal?.throwIfAborted();const step=work.next();if(step.done)return step.value;await yieldToBrowser();}
}
