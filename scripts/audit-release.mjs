import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const sizes=[[320,568],[375,812],[390,844],[430,932],[768,1024],[1024,768],[1366,768],[1672,941],[1920,1080],[2560,1440]];
export default async function audit(page,{base='http://127.0.0.1:4173/',output=fileURLToPath(new URL('../docs/release/',import.meta.url)),models=true,responsive=true}={}) {
  await mkdir(output,{recursive:true});
  const browser=page.context().browser(),checks=[],layout=[],modelResults=[],metrics=[],errors=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  const nativeBefore=await page.evaluate(()=>[innerWidth,innerHeight]);
  const idle=p=>p.waitForFunction(()=>document.querySelector('.site-shell')?.dataset.motion==='idle');
  const fixture=ids=>JSON.stringify({version:1,items:ids.map(id=>({productId:id,size:'9',quantity:1,unitPriceCents:10000,currency:'USD'}))});
  for(const [width,height] of responsive?sizes:[]) {
    const c=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,isMobile:width<=430}),p=await c.newPage(),requests=[];
    p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
    await p.addInitScript(()=>{
      window.releaseMetrics={lcp:0,cls:0,interactions:[]};
      for(const type of ['largest-contentful-paint','layout-shift','event']) {
        try{new PerformanceObserver(list=>{for(const e of list.getEntries()){
          if(type==='largest-contentful-paint')window.releaseMetrics.lcp=e.startTime;
          if(type==='layout-shift'&&!e.hadRecentInput)window.releaseMetrics.cls+=e.value;
          if(type==='event'&&e.interactionId)window.releaseMetrics.interactions.push(e.duration);
        }}).observe({type,buffered:true,durationThreshold:16});}catch{/* Unsupported metric in this browser. */}
      }
    });
    try {
      await p.goto(base);await idle(p);await p.evaluate(()=>document.fonts.ready);
      await p.waitForFunction(()=>window.releaseMetrics.lcp>0,null,{timeout:10000});
      const home=await p.evaluate(()=>{
        const copy=document.querySelector('.home-copy').getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth>innerWidth,images:document.querySelectorAll('.home img,.home-sculpture').length,copy:copy.toJSON(),metrics:window.releaseMetrics,paints:performance.getEntriesByType('paint').map(e=>({name:e.name,ms:e.startTime}))};
      });
      check(!home.overflow,'HOME layout '+width+'x'+height);
      check(home.images===0,'HOME remains text-only '+width);
      check(!requests.some(url=>url.includes('graphite-arches')),'no sculpture download '+width);
      check(!requests.some(url=>/\.glb/.test(url))&&await p.locator('canvas').count()===0,'HOME no GLB/WebGL '+width);
      metrics.push({route:'home',width,height,...home.metrics,paints:home.paints});
      if(width===1920)await p.screenshot({path:path.join(output,'home-desktop.png')});
      if(width===390)await p.screenshot({path:path.join(output,'home-mobile.png'),fullPage:true});
      await p.getByRole('link',{name:'Shop Now',exact:true}).click();await p.mouse.move(0,0);await idle(p);await p.locator('.product-card').last().waitFor();
      check(await p.locator('.product-card').count()===10,'SHOP ten cards '+width);
      check(new Set(requests.filter(url=>/\.glb/.test(url))).size<=1&&await p.locator('canvas').count()===0,'SHOP images with at most one intent preload '+width);
      if(width===1366)await p.screenshot({path:path.join(output,'shop.png')});
      await p.getByRole('button',{name:'Search products',exact:true}).click();await p.locator('#search-query').fill('xt6');
      check(await p.locator('.search-result').count()===1,'search partial name '+width);
      await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('dialog').open);
      check(!await p.locator('dialog').evaluate(e=>e.open),'search Escape restores page '+width);
      await p.evaluate(raw=>localStorage.setItem('novex.cart.v1',raw),fixture(['vx-003','vx-005']));
      await p.locator('[data-cart-link]').click();await idle(p);await p.locator('.cart-item').last().waitFor();
      const footerY=await p.locator('.shop-contact-zone').evaluate(e=>e.getBoundingClientRect().y);
      await p.locator('.cart-item').first().locator('[data-cart-action=increase]').click();
      check(await p.locator('.cart-item').first().locator('.cart-line-total').textContent()==='$418','cart totals '+width);
      check(await p.locator('.shop-contact-zone').evaluate(e=>e.getBoundingClientRect().y)===footerY,'cart stable footer '+width);
      await p.waitForTimeout(50);
      metrics.push({route:'interaction-sample',width,height,...await p.evaluate(()=>window.releaseMetrics)});
      await p.reload();await p.locator('.cart-item').last().waitFor();
      check(await p.locator('.cart-item').first().locator('.cart-quantity span').textContent()==='2','cart reload persists '+width);
      await p.locator('[data-checkout]').click();check(await p.locator('.cart-checkout-status').textContent()==='Checkout coming soon','honest checkout '+width);
      if(width===1366)await p.screenshot({path:path.join(output,'cart.png')});
      for(const route of ['#/product/vx-005','#/cart']) {
        const modelStart=requests.length;
        if(route.includes('product'))await p.route('**/*.glb',r=>r.abort());
        await p.goto(base+route);await idle(p);
        const state=await p.evaluate(()=>{
          const f=document.querySelector('.shop-contact-zone'),r=f.getBoundingClientRect(),panel=document.querySelector('.product-info')?.getBoundingClientRect();
          return {route:location.hash,overflow:document.documentElement.scrollWidth>innerWidth,footer:[r.y,r.bottom],panelBottom:panel?.bottom,wall:getComputedStyle(document.querySelector('.shell-wall')).filter,contacts:document.querySelectorAll('.shop-contact-item[aria-disabled=true]').length};
        });
        check(!state.overflow,'responsive route '+width+' '+route);
        check(state.footer[1]<=height&&state.contacts===3,'shared footer and honest contacts '+width+' '+route);
        check(state.wall==='brightness(0.62) saturate(0.25)','shared wall '+width+' '+route);
        if(width>1050&&route.includes('product'))check(state.panelBottom+24<=state.footer[0],'product scroll clear of footer '+width);
        if(route==='#/cart')check(!requests.slice(modelStart).some(url=>/\.glb/.test(url)),'CART no GLB '+width);
        layout.push({width,height,...state});
      }
    } finally {await c.close();}
    console.log(`Responsive QA: ${width}x${height}`);
  }
  if(models) {
    const c=await browser.newContext({viewport:{width:1366,height:768}}),p=await c.newPage(),requests=[];
    p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(/\.glb/.test(r.url()))requests.push(r.url());});
    try {
      await p.emulateMedia({reducedMotion:'reduce'});
      for(let index=1;index<=10;index++) {
        const id='vx-'+String(index).padStart(3,'0'),start=performance.now(),at=requests.length;
        await p.goto(base+'#/product/'+id);
        await p.waitForFunction(id=>document.querySelector(`.route-stage:not([inert]) .product-page[data-product-id="${id}"] .product-stage[data-interactive]`),id,{timeout:120000});
        await idle(p);
        const readyMs=Math.round(performance.now()-start);
        await p.mouse.move(0,0);await p.waitForFunction(()=>!document.querySelector('.product-stage-viewer')?.productViewerStats?.().motion.frameActive);
        const stats=()=>p.locator('.product-stage-viewer').evaluate(e=>e.productViewerStats());
        const initial=await stats();
        check(initial.assetId===id&&initial.canvasCount===1,'selected 3D model '+id);
        check(requests.slice(at).every(url=>url.endsWith('/'+id+'.glb')||url.endsWith('/floating-wall-shelf.glb')),'only selected model and shared shelf '+id);
        check(await p.locator('.product-thumbnail:not(:disabled)').count()===4,'four real presets '+id);
        for(const view of ['top','rear','sole','side']) {
          await p.locator(`.product-thumbnail[data-view=${view}]`).click();
          await p.waitForFunction(()=>!document.querySelector('.product-stage-viewer').productViewerStats().motion.frameActive);
          const current=await stats();
          check(Math.abs(current.sole-current.plateTop-.0005)<.00001,'sole clearance '+id+' '+view);
          check(JSON.stringify(current.cameraPosition)===JSON.stringify(initial.cameraPosition),'fixed camera '+id+' '+view);
        }
        const canvas=p.locator('.product-stage-viewer canvas');await canvas.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(50);
        check(Math.abs((await stats()).motion.yaw-initial.motion.yaw)>.05,'keyboard rotation '+id);
        await p.keyboard.press('r');await p.waitForFunction(()=>!document.querySelector('.product-stage-viewer').productViewerStats().motion.frameActive);
        check(Math.abs((await stats()).motion.yaw)<.001,'keyboard reset '+id);
        const frames=(await stats()).frames;await p.waitForTimeout(160);check((await stats()).frames===frames,'no idle render loop '+id);
        if(id==='vx-007')check(initial.uv?.repeat?.[0]>16&&initial.uv?.offset?.[0]>0,'Balenciaga UV retained');
        await p.locator('.product-size-choice').filter({has:p.getByRole('radio',{name:'Size 8.5',exact:true})}).click();
        await p.getByRole('button',{name:'Add to Cart',exact:true}).click();
        check(await p.locator('.product-purchase-status').textContent().then(s=>s.includes('8.5')),'add selected size '+id);
        if(id==='vx-005')await p.screenshot({path:path.join(output,'product.png')});
        modelResults.push({id,readyMs,scenarioMs:Math.round(performance.now()-start),triangles:initial.triangles,uv:initial.uv,memory:initial.memory});
        await writeFile(path.join(output,'model-progress.json'),JSON.stringify({models:modelResults,checks,errors},null,2));
        console.log(`3D QA: ${id}`);
      }
      // Real context loss must restore the preview and allow a fresh viewer.
      await p.locator('.product-stage-viewer canvas').evaluate(canvas=>canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      await p.waitForSelector('.product-stage[data-viewer=error]');
      check(await p.getByRole('button',{name:'Retry 3D'}).isVisible(),'context loss exposes recovery');
      await p.getByRole('button',{name:'Retry 3D'}).click();await p.waitForSelector('.product-stage[data-interactive]',{timeout:120000});
      check(await p.locator('canvas').count()===1,'context recovery creates one canvas');
      for(const hash of ['#/shop','#/product/vx-003','#/cart','#/product/vx-007','#/'])await p.evaluate(h=>{location.hash=h;},hash);
      await p.waitForSelector('.home');await idle(p);check(await p.locator('canvas').count()===0,'rapid navigation settles on HOME');
      await p.getByRole('link',{name:'Shop Now',exact:true}).click();await idle(p);await p.goBack();await idle(p);check(await p.locator('.home').count()===1,'browser Back');
      await p.goForward();await idle(p);check(await p.locator('.shop').count()===1,'browser Forward');
    } finally {await c.close();}
    const slow=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),q=await slow.newPage();
    q.on('pageerror',e=>errors.push(e.message));
    try {
      await q.route('**/*.glb',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue().catch(()=>{});});
      await q.goto(base+'#/product/vx-005');await q.locator('.product-add').tap();
      check(await q.locator('.product-purchase-status').textContent().then(t=>t.includes('Added')),'purchase works before slow GLB');
      await q.waitForSelector('.product-stage[data-interactive]',{timeout:120000});
      const canvas=q.locator('.product-stage-viewer canvas');await canvas.scrollIntoViewIfNeeded();const b=await canvas.boundingBox();
      const touch=await slow.newCDPSession(q);
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width*.5,y:b.y+b.height*.4}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+b.width*.65,y:b.y+b.height*.5}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      check(await q.locator('.product-stage-viewer').evaluate(e=>e.productViewerStats().motion.yaw!==0),'emulated touch drag');
      await q.emulateMedia({reducedMotion:'reduce'});await q.locator('.product-thumbnail[data-view=sole]').click();
      check(await q.locator('.product-stage-viewer').evaluate(e=>!e.productViewerStats().motion.animating),'reduced motion preset');
    } finally {await slow.close();}
  }
  check(errors.length===0,'no unhandled browser errors');
  const nativeAfter=await page.evaluate(()=>[innerWidth,innerHeight]);check(JSON.stringify(nativeBefore)===JSON.stringify(nativeAfter),'primary viewport unchanged');
  const report={checks,layout,models:modelResults,metrics,errors,nativeBefore,nativeAfter};
  const name=models?(responsive?'browser-audit.json':'browser-model-audit.json'):'browser-responsive-audit.json';
  await writeFile(path.join(output,name),JSON.stringify(report,null,2)+'\n');
  console.log(`Passed ${checks.length} browser assertions.`);
  return report;
}
