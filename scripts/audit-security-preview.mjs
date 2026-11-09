import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export default async function auditSecurity(page,{base='http://127.0.0.1:4174/'}={}) {
  const context=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await context.newPage();
  const errors=[],checks=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await p.addInitScript(()=>{window.cspViolations=[];document.addEventListener('securitypolicyviolation',event=>window.cspViolations.push({directive:event.violatedDirective,uri:event.blockedURI}));});
  try {
    const response=await p.goto(base),headers=response.headers();
    check(headers['content-security-policy']?.includes("'wasm-unsafe-eval'"),'production CSP is served');
    check(headers['x-content-type-options']==='nosniff','nosniff is served');
    await p.locator('.site-logo').click();
    await p.locator('.site-nav a[href="#/shop"]').click();await p.waitForSelector('.product-card');
    await p.locator('.product-card-link[href="#/product/vx-005"]').click();
    await p.waitForFunction(()=>['ready','error'].includes(document.querySelector('.route-stage:not([inert]) .product-stage')?.dataset.viewer),null,{timeout:120000});
    const state=await p.locator('.route-stage:not([inert]) .product-stage').getAttribute('data-viewer');
    check(state==='ready','Meshopt/WebP/worker/GLB load under CSP: '+JSON.stringify(await p.evaluate(()=>window.cspViolations)));
    await p.waitForSelector('.product-stage[data-interactive]');await p.evaluate(()=>document.fonts.ready);
    const reference=JSON.parse(await readFile(new URL('../docs/release/browser-model-audit.json',import.meta.url),'utf8')).models.find(model=>model.id==='vx-005');
    const viewer=await p.locator('.product-stage-viewer').evaluate(e=>({stats:e.productViewerStats(),timings:e.productLoadTimings}));
    check(viewer.stats.memory.textures===reference.memory.textures,'all original textures remain allocated under CSP');
    await p.mouse.move(0,0);await p.waitForTimeout(250);
    await p.screenshot({path:fileURLToPath(new URL('../docs/release/product.png',import.meta.url))});
    await p.getByRole('button',{name:'Increase quantity',exact:true}).click();
    await p.getByRole('button',{name:'Increase quantity',exact:true}).click();
    await p.getByRole('button',{name:'Decrease quantity',exact:true}).click();
    await p.locator('.product-size-choice').filter({has:p.getByRole('radio',{name:'Size 8.5',exact:true})}).click();
    await p.getByRole('button',{name:'Add to Cart',exact:true}).click();
    await p.locator('[data-cart-link]').click();await p.locator('.cart-item').waitFor();
    check(await p.locator('.cart-line-total').textContent()==='$440','product quantity and selected size reach Cart');
    await p.locator('[data-cart-action=increase]').click();check(await p.locator('.cart-line-total').textContent()==='$660','Cart quantity works under CSP');
    await p.locator('.cart-remove').click();check(await p.getByRole('heading',{name:'Your cart is empty',exact:true}).isVisible(),'Cart removal');
    await p.locator('[data-search-open]').click();await p.locator('#search-query').fill('not-a-product');
    check(await p.locator('.search-empty').isVisible(),'search empty state');
    await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('dialog').open);
    const inventory=JSON.parse(await readFile(new URL('./public-assets.json',import.meta.url),'utf8'));
    const models=[];
    for(const file of inventory.files.filter(file=>file.path.endsWith('.glb'))) {
      const head=await p.request.head(new URL(file.path,base).href);
      check(head.status()===200,'public model URL '+file.path);
      check(/model\/gltf-binary|application\/octet-stream/.test(head.headers()['content-type']??''),'GLB MIME '+file.path);
      models.push({path:file.path,status:head.status(),type:head.headers()['content-type'],bytes:Number(head.headers()['content-length'])});
    }
    // Exercise cancellation with normal GSAP motion, independent of GPU speed.
    await p.route('**/*.glb',route=>route.abort());
    for(const hash of ['#/shop','#/product/vx-003','#/shop','#/','#/product/vx-007','#/shop']) {
      await p.evaluate(value=>{location.hash=value;},hash);await p.waitForTimeout(35);
    }
    await p.waitForFunction(()=>document.querySelector('.site-shell').dataset.motion==='idle');
    check(await p.locator('.route-stage:not([inert]) .shop').count()===1,'rapid normal-motion navigation settles on Shop');
    check(await p.locator('.motion-shared,.motion-chrome-ghost').count()===0,'cancelled transitions leave no overlays');
    check(await p.locator('.route-stage:not([inert]) .shop-grid').evaluate(e=>Number(getComputedStyle(e).opacity)===1),'cancelled motion leaves content visible');
    const violations=await p.evaluate(()=>window.cspViolations);
    check(violations.length===0,'no CSP violations: '+JSON.stringify(violations));check(errors.length===0,'no browser errors');
    const report={checks,models,violations,errors,viewer};
    await writeFile(new URL('../docs/release/security-preview.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
    console.log(`Passed ${checks.length} production-header assertions.`);
    return report;
  }finally{await context.close();}
}
