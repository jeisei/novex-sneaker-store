// Used by the live viewer AND the generator (which mounts that exact viewer).
export const productRenderConfig={
  version:1, aspect:3/2,
  model:{longestSide:2,yaw:Math.PI,initialYaw:0,initialPitch:0,clearance:.0005},
  camera:{horizontalSpan:3.06,distance:11.3,position:[.59,1.36,11.2],target:[0,.19,0],near:.1,far:40,
    heightReference:.9,headroomDivisor:33,salomonHeadroomDivisor:30},
  renderer:{antialias:true,alpha:true,powerPreference:'high-performance',maxPixelRatio:1.25,
    outputColorSpace:'SRGBColorSpace',toneMapping:'AgXToneMapping',exposure:.3},
  environment:{blur:.04,intensity:.35},
  hemisphere:{sky:0xffffff,ground:0x49443f,intensity:.55},
  lights:[{position:[-3,4,4],intensity:3,shadow:true},{position:[3,2,4],intensity:.7},{position:[-.8,3,-3],intensity:1.4}],
  shadow:{mapSize:1024,type:'PCFShadowMap',camera:{left:-2.3,right:2.3,top:2.3,bottom:-2.3,near:.1,far:12},bias:-.00015,normalBias:.002,radius:3,
    ground:{size:[5,4],opacity:.28,y:-.108},wall:{size:[5,4],opacity:.16,position:[0,.7,-.5]}},
  platform:{size:[2.6,.105,.9],position:[0,-.0525,0],tint:.55,metalness:.5,roughness:.5},
};
export function productFraming(id,height,aspect=productRenderConfig.aspect){
  const c=productRenderConfig.camera;
  const span=c.horizontalSpan*(id==='vx-005'?1:Math.max(1,height/c.heightReference));
  const headroom=span/(id==='vx-005'?c.salomonHeadroomDivisor:c.headroomDivisor);
  return {span,position:[c.position[0],c.position[1]+headroom,c.position[2]],target:[c.target[0],c.target[1]+headroom,c.target[2]],fov:2*Math.atan(span/(2*c.distance*aspect))*180/Math.PI};
}
