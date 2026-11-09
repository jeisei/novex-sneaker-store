import { startRouter, resolveRoute } from './app/router.js';
import { createShell } from './app/shell.js';
import { createTransitionManager } from './app/transition-manager.js';
import { CART_STORAGE_KEY } from './data/cart.js';
import { mountProduct } from './pages/product.js';
import { mountHome } from './pages/home.js';
import { mountShop } from './pages/shop.js';
import { mountCart } from './pages/cart.js';
import { installScrollBoundaries } from './app/scroll-boundaries.js';
import './styles/base.css';
import './styles/motion.css';

installScrollBoundaries();
const app=document.querySelector('#app');
{
  const shell=createShell(app,resolveRoute(location.hash).page);
  const manager=createTransitionManager({...shell,loadView(node,route,signal,options){
    if(route.page==='home')return mountHome(node,signal,options);
    if(route.page==='shop')return mountShop(node,signal,options);
    if(route.page==='product')return mountProduct(node,route.id,signal,options);
    if(route.page==='cart')return mountCart(node,signal,options);
  }});
  app.novexMotionStats=manager.stats;
  window.addEventListener('novex:cart-change',shell.refresh);
  window.addEventListener('storage',event=>{if(event.key===CART_STORAGE_KEY||event.key===null)shell.refresh();});
  startRouter(manager.navigate);
}
