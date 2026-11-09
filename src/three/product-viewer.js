import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { productModels } from './product-models.js';
import { prepareModel } from './presentation.js';
import { disposeModel } from './dispose.js';
import { createProductControls, orientation } from './product-controls.js';
import { productScene } from '../data/product-scene.js';
import { buildSoleProfileAsync } from './sole-profile.js';
import { entryBounds } from '../animations/entry-bounds.js';
import { productRenderConfig as config, productFraming } from '../data/product-render-config.js';

const soleProfiles=new WeakMap(),tintedMaterials=new WeakSet();
// Explicit enum table keeps Rollup from retaining the entire Three namespace.
const rendererEnums={SRGBColorSpace:THREE.SRGBColorSpace,AgXToneMapping:THREE.AgXToneMapping,PCFShadowMap:THREE.PCFShadowMap};

// One selected shoe, one supplied shelf, one renderer. Diagnostic viewer stays independent.
export async function createProductViewer({container,asset,signal,onViewChange,generateThumbnails=false}) {
  const owner=new AbortController(), scene=new THREE.Scene();
  const timings={start:performance.now()};container.productLoadTimings=timings;
  const stamp=key=>timings[key]=performance.now();
  let disposed=false, renderer, shoe, plate, rotation, floating, controls, resizeObserver;
  let shoeLease,plateLease;
  let environment, pmrem, room, camera, ready=false, frames=0, lastLift=0;
  let sole=.0005, plateTop=0;
  let soleProfile;
  let horizontalSpan=config.camera.horizontalSpan;
  const soleEuler=new THREE.Euler(0,0,0,'YXZ');
  const shadowObjects=[];
  const box=new THREE.Box3();
  const url=path=>new URL(import.meta.env.BASE_URL+path,location.href).href;
  function dispose(){
    if(disposed)return;disposed=true;owner.abort();signal.removeEventListener('abort',dispose);
    controls?.dispose();resizeObserver?.disconnect();
    if(renderer)renderer.domElement.removeEventListener('webglcontextlost',contextLost);
    scene.environment=null;environment?.dispose();pmrem?.dispose();room?.dispose();
    scene.traverse(object=>object.shadow?.dispose());
    shoeLease?.release();plateLease?.release();
    disposeModel(scene);
    // A late load can finish before its group has been attached.
    shoe=plate=undefined;
    renderer?.renderLists.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();
  }
  function contextLost(event){event.preventDefault();if(!disposed){dispose();container.dispatchEvent(new CustomEvent('productviewererror'));}}
  signal.addEventListener('abort',dispose,{once:true});
  function size(){
    const {width,height}=container.getBoundingClientRect();if(!width||!height)return false;
    const current=renderer.getSize(new THREE.Vector2());
    const changed=current.x!==width||current.y!==height;
    if(changed)renderer.setSize(width,height,false);
    camera.aspect=width/height;
    // Keep horizontal framing and camera pose stable; height follows the fixed slot.
    camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(horizontalSpan/(2*config.camera.distance*camera.aspect)));
    camera.updateProjectionMatrix();return changed;
  }
  function placeShoe(lift=0){
    soleEuler.setFromQuaternion(rotation.quaternion,'YXZ');
    const minY=soleProfile.minY(soleEuler.x);
    floating.position.y=-minY+config.model.clearance+lift;floating.updateMatrixWorld(true);sole=floating.position.y+minY;
  }
  function draw(lift=lastLift,force=false){
    if(disposed||!ready||(document.hidden&&!force))return;
    lastLift=lift;placeShoe(lift);renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);frames++;
  }
  function light(position,intensity,shadow=false){
    const source=new THREE.DirectionalLight(0xffffff,intensity);source.position.fromArray(position);
    source.castShadow=shadow;
    if(shadow){source.shadow.mapSize.set(config.shadow.mapSize,config.shadow.mapSize);Object.assign(source.shadow.camera,config.shadow.camera);source.shadow.bias=config.shadow.bias;source.shadow.normalBias=config.shadow.normalBias;source.shadow.radius=config.shadow.radius;}
    scene.add(source);return source;
  }
  try {
    signal.throwIfAborted();
    // Concurrent network requests, serial GLTF parsing. Late leases are always
    // released, even if the owner leaves before the other asset has loaded.
    const acquire=async(path,key)=>{
      const lease=await productModels.acquire(url(path),owner.signal,(phase,value)=>timings[key+phase]=value);
      if(disposed||owner.signal.aborted){lease.release();owner.signal.throwIfAborted();}
      if(key==='shoe')shoeLease=lease;else plateLease=lease;return lease.model;
    };
    const models=await Promise.all([acquire(asset.model,'shoe'),acquire(productScene.platform.model,'shelf')]);
    [shoe,plate]=models;owner.signal.throwIfAborted();
    const normalized=prepareModel(shoe,asset,config.model);
    rotation=new THREE.Group();rotation.add(normalized);
    floating=new THREE.Group();floating.add(rotation);scene.add(floating);
    const framing=productFraming(asset.id,new THREE.Box3().setFromObject(rotation).getSize(new THREE.Vector3()).y);
    horizontalSpan=framing.span;
    soleProfile=soleProfiles.get(shoe)??await buildSoleProfileAsync(rotation,1024,owner.signal);soleProfiles.set(shoe,soleProfile);owner.signal.throwIfAborted();
    rotation.quaternion.copy(orientation(config.model.initialYaw,config.model.initialPitch));
    stamp('modelPrepared');
    shoe.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
    box.setFromObject(plate);const center=box.getCenter(new THREE.Vector3()), dimensions=box.getSize(new THREE.Vector3());
    const centered=new THREE.Group();centered.position.copy(center).negate();centered.add(plate);
    const shelf=new THREE.Group();shelf.scale.set(config.platform.size[0]/dimensions.x,config.platform.size[1]/dimensions.y,config.platform.size[2]/dimensions.z);shelf.add(centered);shelf.position.fromArray(config.platform.position);scene.add(shelf);
    plate.traverse(object=>{
      if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
      for(const material of Array.isArray(object.material)?object.material:[object.material]){
        if(!material||tintedMaterials.has(material))continue;material.color?.multiplyScalar(config.platform.tint);
        if('metalness'in material)material.metalness=config.platform.metalness;if('roughness'in material)material.roughness=config.platform.roughness;
        tintedMaterials.add(material);
      }
    });
    scene.updateMatrixWorld(true);box.setFromObject(shelf);plateTop=box.max.y;
    renderer=new THREE.WebGLRenderer({antialias:config.renderer.antialias,alpha:config.renderer.alpha,powerPreference:config.renderer.powerPreference});
    stamp('rendererCreated');
    renderer.setPixelRatio(Math.min(devicePixelRatio,config.renderer.maxPixelRatio));renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=rendererEnums[config.renderer.outputColorSpace];renderer.toneMapping=rendererEnums[config.renderer.toneMapping];renderer.toneMappingExposure=config.renderer.exposure;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=rendererEnums[config.shadow.type];renderer.shadowMap.autoUpdate=false;
    renderer.domElement.setAttribute('aria-label',`${asset.id.toUpperCase()} interactive 3D sneaker. Drag to rotate; arrow keys to turn; Home or R to reset.`);
    renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;
    renderer.domElement.addEventListener('webglcontextlost',contextLost);
    container.append(renderer.domElement);
    room=new RoomEnvironment();pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(room,config.environment.blur);
    scene.environment=environment.texture;scene.environmentIntensity=config.environment.intensity;room.dispose();room=undefined;pmrem.dispose();pmrem=undefined;
    scene.add(new THREE.HemisphereLight(config.hemisphere.sky,config.hemisphere.ground,config.hemisphere.intensity));
    for(const source of config.lights)light(source.position,source.intensity,source.shadow);
    function shadowMaterial(opacity){
      const material=new THREE.ShadowMaterial({opacity});
      material.onBeforeCompile=shader=>{
        shader.vertexShader=shader.vertexShader.replace('void main() {','varying vec2 vReceiverUv;\nvoid main() {\nvReceiverUv = uv;');
        shader.fragmentShader=shader.fragmentShader.replace('void main() {','varying vec2 vReceiverUv;\nvoid main() {').replace('#include <fog_fragment>','gl_FragColor.a *= 1.0 - smoothstep(0.25, 0.5, length(vReceiverUv - 0.5));\n#include <fog_fragment>');
      };
      return material;
    }
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(...config.shadow.ground.size),shadowMaterial(config.shadow.ground.opacity));
    ground.rotation.x=-Math.PI/2;ground.position.y=config.shadow.ground.y;ground.receiveShadow=true;scene.add(ground);shadowObjects.push(ground);
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(...config.shadow.wall.size),shadowMaterial(config.shadow.wall.opacity));
    wall.position.fromArray(config.shadow.wall.position);wall.receiveShadow=true;scene.add(wall);shadowObjects.push(wall);
    camera=new THREE.PerspectiveCamera(framing.fov,config.aspect,config.camera.near,config.camera.far);camera.position.fromArray(framing.position);camera.lookAt(...framing.target);
    size();
    // Shader compilation alone does not upload geometry. Warm textures, compile,
    // then render a complete frame while the exact static preview stays visible.
    const textures=new Set();scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);});
    stamp('textureUploadStart');
    for(const texture of textures){owner.signal.throwIfAborted();renderer.initTexture(texture);await new Promise(resolve=>setTimeout(resolve,0));}
    stamp('texturesPrepared');stamp('compileStart');await renderer.compileAsync(scene,camera);owner.signal.throwIfAborted();stamp('compiled');
    ready=true;stamp('firstRenderStart');draw(0,true);stamp('firstFrame');
    // Derive all four real previews from this same loaded scene and context.
    const previews={};
    if(generateThumbnails){
    const originalSize=renderer.getSize(new THREE.Vector2());
    const thumbnailCamera=new THREE.OrthographicCamera(-1.2,1.2,.8,-.8,.1,20);
    thumbnailCamera.position.set(.15,.2,6);thumbnailCamera.lookAt(0,0,0);
    shelf.visible=false;shadowObjects.forEach(object=>object.visible=false);renderer.shadowMap.enabled=false;
    renderer.setSize(192,128,false);floating.position.y=0;
    const thumbnail=document.createElement('canvas');thumbnail.width=192;thumbnail.height=128;const ctx=thumbnail.getContext('2d');
    for(const view of productScene.views){
      rotation.quaternion.copy(orientation(view.yaw,view.pitch));renderer.render(scene,thumbnailCamera);
      ctx.clearRect(0,0,192,128);ctx.drawImage(renderer.domElement,0,0,192,128);previews[view.id]=thumbnail.toDataURL('image/png');
    }
    rotation.quaternion.copy(orientation(config.model.initialYaw,config.model.initialPitch));renderer.setSize(originalSize.x,originalSize.y,false);
    shelf.visible=true;shadowObjects.forEach(object=>object.visible=true);renderer.shadowMap.enabled=true;draw();
    }
    const hoverRay=new THREE.Raycaster();
    controls=createProductControls({element:renderer.domElement,pivot:rotation,draw,onViewChange,hitTest(event){
      const rect=renderer.domElement.getBoundingClientRect();
      hoverRay.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
      box.setFromObject(rotation);return hoverRay.ray.intersectsBox(box);
    }});
    // Resizing a canvas clears its drawing buffer. Redraw in this callback,
    // before paint, rather than waiting for a later controls RAF.
    resizeObserver=new ResizeObserver(()=>{if(disposed)return;if(size())draw(lastLift,true);});resizeObserver.observe(container);
    function stats(precise=false){
      const projected=new THREE.Box3();
      if(rotation&&camera&&!disposed){
        if(precise){
          const point=new THREE.Vector3(),matrix=new THREE.Matrix4();
          rotation.traverse(object=>{const positions=object.geometry?.attributes.position;if(!positions)return;matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(object.matrixWorld);for(let i=0;i<positions.count;i++)projected.expandByPoint(point.fromBufferAttribute(positions,i).applyMatrix4(matrix));});
        }else{box.setFromObject(rotation);for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])projected.expandByPoint(new THREE.Vector3(x,y,z).project(camera));}
      }
      let uv=null;if(asset.uvCorrection&&shoe)shoe.traverse(object=>{if(object.material?.map)uv={offset:object.material.map.offset.toArray(),repeat:object.material.map.repeat.toArray()};});
      return {assetId:asset.id,disposed,ready,frames,sole,plateTop,uv,canvasCount:container.querySelectorAll('canvas').length,
        platformMatrix:shelf.matrixWorld.toArray(),cameraPosition:camera.position.toArray(),cameraQuaternion:camera.quaternion.toArray(),
        bounds:disposed?null:{min:projected.min.toArray(),max:projected.max.toArray()},
        memory:renderer?{...renderer.info.memory}:null,triangles:renderer?.info.render.triangles??0,motion:controls?.stats()};
    }
    container.productViewerStats=stats;
    container.productViewerCapture=({width=1536,height=1024}={})=>{
      const original=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio();
      try{
        renderer.setPixelRatio(1);renderer.setSize(width,height,false);camera.aspect=width/height;
        camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(horizontalSpan/(2*config.camera.distance*camera.aspect)));camera.updateProjectionMatrix();
        draw(0,true);return renderer.domElement.toDataURL('image/png');
      }finally{renderer.setPixelRatio(ratio);renderer.setSize(original.x,original.y,false);size();draw(0,true);}
    };
    // Offline transition asset generation only. The normal render recipe,
    // materials/camera and original initial frames stay unchanged.
    if (import.meta.env.DEV) container.productTransitionCapture=()=>{
      const original=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio();
      const lift=lastLift;
      try {
        renderer.setPixelRatio(1);renderer.setSize(1536,1024,false);camera.aspect=1.5;
        camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(horizontalSpan/(2*config.camera.distance*camera.aspect)));camera.updateProjectionMatrix();
        shelf.visible=false;shadowObjects.forEach(object=>object.visible=false);
        draw(0,true);return renderer.domElement.toDataURL('image/png');
      } finally {
        shelf.visible=true;shadowObjects.forEach(object=>object.visible=true);
        renderer.setPixelRatio(ratio);renderer.setSize(original.x,original.y,false);size();draw(lift,true);
      }
    };
    container.productModelCacheStats=()=>productModels.stats();
    stamp('interactive');
    function screenBounds(){
      return entryBounds(stats(true).bounds,renderer.domElement.getBoundingClientRect());
    }
    return {previews,select:controls.select,suspend:controls.suspend,stats,screenBounds,dispose(){dispose();delete container.productViewerStats;delete container.productViewerCapture;delete container.productTransitionCapture;delete container.productModelCacheStats;}};
  }catch(error){dispose();throw error;}
}
