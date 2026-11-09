// Geometry is sampled once at navigation boundaries, never inside the RAF loop.
export function frameBounds(frame, rect) {
  if(!frame||!rect||rect.width<=0||rect.height<=0)return null;
  const [left,top,right,bottom]=frame.bounds,[width,height]=frame.canvas;
  return {x:rect.x+left/width*rect.width,y:rect.y+top/height*rect.height,width:(right-left)/width*rect.width,height:(bottom-top)/height*rect.height};
}
export function validRect(rect, width, height) {
  return !!rect&&[rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)&&rect.width>8&&rect.height>8&&rect.y<height&&rect.y+rect.height>0&&rect.x<width&&rect.x+rect.width>0;
}
export function flipTransform(from,to) {
  if(!from||!to||![from.x,from.y,from.width,from.height,to.x,to.y,to.width,to.height].every(Number.isFinite)||Math.min(from.width,from.height,to.width,to.height)<=0)return null;
  return {x:from.x-to.x,y:from.y-to.y,scaleX:from.width/to.width,scaleY:from.height/to.height};
}
