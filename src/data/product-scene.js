import { homeScene } from './home-scene.js';
import { productRenderConfig } from './product-render-config.js';

export const productScene = {
  platform: { ...homeScene.platform, model:'assets/models/product/floating-wall-shelf.glb' },
  views:[
    { id:'side', label:'Side view', yaw:productRenderConfig.model.initialYaw, pitch:productRenderConfig.model.initialPitch },
    { id:'top', label:'Top view', yaw:0, pitch:Math.PI/2 },
    { id:'rear', label:'Rear view', yaw:Math.PI/2, pitch:0 },
    { id:'sole', label:'Sole view', yaw:0, pitch:-Math.PI/2 },
  ],
};
