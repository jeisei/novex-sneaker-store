// A single intent fetch. A real click adopts it; sweeping across cards does not
// create ten downloads or any GLTF parsers/WebGL contexts.
let intent;
export function prefetchModelBytes(url){
  if(intent?.url===url)return intent;
  if(intent&&!intent.claimed)intent.controller.abort();
  const controller=new AbortController(),timings={fetchStart:performance.now()};
  const entry={url,controller,timings,claimed:false};
  entry.promise=fetch(url,{signal:controller.signal,cache:'force-cache'}).then(async response=>{
    if(!response.ok)throw new Error(`GLB HTTP ${response.status}`);
    const buffer=await response.arrayBuffer();timings.fetchEnd=performance.now();return buffer;
  });
  entry.promise.catch(()=>{if(intent===entry)intent=undefined;});intent=entry;return entry;
}
export function cancelModelIntent(url){if(intent&&!intent.claimed&&(!url||intent.url===url)){intent.controller.abort();intent=undefined;}}
export async function modelBytes(url,signal,onTiming){
  const entry=intent?.url===url?intent:prefetchModelBytes(url);entry.claimed=true;
  const abort=()=>entry.controller.abort();signal.addEventListener('abort',abort,{once:true});
  try{
    signal.throwIfAborted();const buffer=await entry.promise;signal.throwIfAborted();
    for(const[key,value]of Object.entries(entry.timings))onTiming(key,value);
    return buffer;
  }finally{signal.removeEventListener('abort',abort);if(intent===entry)intent=undefined;}
}
