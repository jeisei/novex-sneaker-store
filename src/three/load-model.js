import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { disposeModel } from './dispose.js';

// Serial across viewers, including a parser that finishes after its owner left.
let pending = Promise.resolve();
let workersStarted=false;
function loader(){
  if(!workersStarted&&typeof Worker!=='undefined'){
    workersStarted=true;
    try{MeshoptDecoder.useWorkers(Math.min(2,Math.max(1,(navigator.hardwareConcurrency??2)-1)));}catch{/* Decoder still supports its synchronous fallback. */}
  }
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
}
function serial(task){const result=pending.then(task);pending=result.catch(()=>{});return result;}
export function parseModelBuffer(buffer,url,signal){
  return serial(async()=>{
    signal.throwIfAborted();const gltf=await loader().parseAsync(buffer,new URL('.',url).href);
    if(signal.aborted){disposeModel(gltf.scene);signal.throwIfAborted();}return gltf.scene;
  });
}

export function loadModel(url, signal, onTiming=()=>{}) {
  return serial(async () => {
    signal.throwIfAborted();
    onTiming('fetchStart',performance.now());
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`GLB HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    onTiming('fetchEnd',performance.now());
    signal.throwIfAborted();
    const gltf = await loader().parseAsync(buffer, new URL('.', url).href);
    onTiming('parseEnd',performance.now());
    if (signal.aborted) {
      disposeModel(gltf.scene);
      signal.throwIfAborted();
    }
    return gltf.scene;
  });
}
