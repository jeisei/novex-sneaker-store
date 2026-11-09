import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/data/products.js';
import { assets } from '../src/data/asset-manifest.js';
import { createCartStore, cartTotalCents } from '../src/data/cart.js';
import { productInfoMarkup } from '../src/components/product-info.js';

// Visual SHOP positions, independently recorded from the owner's supplied brief.
const expected = [
 ['Nike Air Max TN Plus — Solar Red',199,'Solar Red / Black','Approx. 390 g'],
 ['Sculpt Runner — Mint',189,'Pastel Mint','Approx. 420 g'],
 ['Aero Pulse — Ice Blue',209,'Ice Blue / Cyan','Approx. 405 g'],
 ['New Balance 1906R — Rose Quartz',195,'Rose Quartz / Cream','Approx. 365 g'],
 ['Salomon XT-6 — Black Graphite',220,'Black / Graphite Gray','Approx. 370 g'],
 ['New Balance 574 — Burgundy Heritage',159,'Burgundy / White','Approx. 340 g'],
 ['Balenciaga Triple S — Navy White',349,'White / Navy Blue / Gray','Approx. 650 g'],
 ['Terra Sculpt — Mocha',189,'Mocha Brown','Approx. 430 g'],
 ['Contrast Runner — Mono',199,'Black / White','Approx. 440 g'],
 ['Nike Air Monarch IV — Triple Black',169,'Triple Black','Approx. 410 g'],
];

test('catalog follows visual SHOP positions with unchanged assets and owner-supplied demo offers', () => {
 assert.equal(products.length,10);
 products.forEach((p,i)=>{
  assert.equal(p.asset,assets[i]);
  assert.deepEqual([p.name,p.offer.priceCents/100,p.offer.details.color,p.offer.details.weight],expected[i]);
  assert.deepEqual(p.offer.sizes,['7','8','8.5','9','9.5','10','11']);
  assert.equal(p.dataStatus,'demo');
  assert.equal(p.offer.defaultSize,'9');
  for(const key of ['category','material','outsole','cushioning','style','gender']) assert.ok(p.offer.details[key]);
  assert.ok(p.description.length>100&&p.shortDescription.length>0);
  const markup=productInfoMarkup(p);
  assert.ok(markup.includes(p.name)&&markup.includes(p.description));
  assert.ok(markup.includes('not verified manufacturer specifications'));
  assert.ok(!/VX-\d{3}/i.test(markup));
  assert.ok(!markup.includes('Purchasing unavailable'));
  assert.doesNotMatch(p.name, /NOVEX/i);
  assert.doesNotMatch(markup, /NOVEX/i);
  if ([1,2,7,8].includes(i)) assert.equal(p.offer.details.brand, undefined);
  else assert.ok(p.offer.details.brand);
 });
});

test('all ten products persist, merge sizes and calculate their own catalog prices', () => {
 const values=new Map(), storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const store=createCartStore(()=>storage);
 products.forEach(p=>store.add(p.id,'9',2));
 const restored=createCartStore(()=>storage).read();
 assert.equal(restored.length,10);
 assert.equal(cartTotalCents(restored),415400);
 restored.forEach((line,i)=>assert.equal(line.unitPriceCents,expected[i][1]*100));
 store.add(products[0].id,'9',1);store.add(products[0].id,'8.5',1);
 assert.equal(store.read().length,11);
 assert.equal(store.read()[0].quantity,3);
});

test('previously saved Salomon line adopts the new catalog price without rewriting storage on read', () => {
 const original=JSON.stringify({version:1,items:[{productId:'vx-005',size:'9',quantity:2,unitPriceCents:19000,currency:'USD'}]});
 let value=original;
 const store=createCartStore(()=>({getItem:()=>value,setItem:(_,v)=>{value=v;}}));
 assert.equal(store.read()[0].unitPriceCents,22000);
 assert.equal(value,original);
 store.add('vx-001','9',1);
 assert.equal(JSON.parse(value).items[0].unitPriceCents,22000);
});
