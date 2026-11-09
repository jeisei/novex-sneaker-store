import { assets } from './asset-manifest.js';

// Owner-supplied demo merchandising, NOT verified manufacturer specifications.
// Matched visually against SHOP: row 1 red/mint/blue/pink/graphite;
// row 2 burgundy/navy-white/mocha/black-white/triple-black. Asset IDs stay internal.
const demoCatalog = {
  'vx-001': {
    name: 'Nike Air Max TN Plus — Solar Red', price: 199, brand: 'Nike',
    category: 'Lifestyle / Running Inspired', color: 'Solar Red / Black',
    material: 'Synthetic Leather, Breathable Mesh', outsole: 'Rubber Outsole',
    cushioning: 'Visible Air Cushioning', style: 'Sport / Streetwear', weight: 'Approx. 390 g',
    description: 'A bold expression of streetwear energy. Featuring a striking red upper, sculpted lines and visible air cushioning, the Solar Red combines futuristic aesthetics with everyday comfort.',
    shortDescription: 'Bold design. Maximum presence.',
  },
  'vx-002': {
    name: 'Sculpt Runner — Mint', price: 189,
    category: 'Chunky Lifestyle', color: 'Pastel Mint',
    material: 'Synthetic Leather, Textile', outsole: 'Sculpted EVA / Rubber',
    cushioning: 'Cushioned Foam Midsole', style: 'Avant-Garde / Contemporary', weight: 'Approx. 420 g',
    description: 'A sculptural interpretation of modern footwear. The monochromatic mint finish, exaggerated proportions and fluid detailing create a distinctive contemporary silhouette.',
    shortDescription: 'Sculpted for individuality.',
  },
  'vx-003': {
    name: 'Aero Pulse — Ice Blue', price: 209,
    category: 'Futuristic Lifestyle', color: 'Ice Blue / Cyan',
    material: 'Engineered Mesh, Synthetic Overlays', outsole: 'Textured Rubber',
    cushioning: 'Sculpted Foam Cushioning', style: 'Futuristic / Techwear', weight: 'Approx. 405 g',
    description: 'A futuristic silhouette defined by organic contours, layered textures and an expressive ice-blue palette. Designed to bring a technological edge to everyday styling.',
    shortDescription: 'Future in every detail.',
  },
  'vx-004': {
    name: 'New Balance 1906R — Rose Quartz', price: 195, brand: 'New Balance',
    category: 'Retro Running / Lifestyle', color: 'Rose Quartz / Cream',
    material: 'Mesh, Synthetic Overlays', outsole: 'Rubber Outsole',
    cushioning: 'Cushioned Midsole', style: 'Retro Sport / Casual', weight: 'Approx. 365 g',
    description: 'Retro running aesthetics meet a soft contemporary palette. Layered detailing, breathable mesh and a balanced silhouette make the Rose Quartz a versatile statement piece.',
    shortDescription: 'Retro character. Modern expression.',
  },
  'vx-005': {
    name: 'Salomon XT-6 — Black Graphite', price: 220, brand: 'Salomon',
    category: 'Trail Inspired / Lifestyle', color: 'Black / Graphite Gray',
    material: 'Breathable Mesh, Synthetic Reinforcements', outsole: 'High-Grip Rubber',
    cushioning: 'Cushioned Midsole', style: 'Gorpcore / Technical', weight: 'Approx. 370 g',
    description: 'Technical outdoor aesthetics refined for the modern city. A layered black and graphite upper, structured silhouette and rugged outsole create a versatile trail-inspired look.',
    shortDescription: 'Technical roots. Urban identity.',
  },
  'vx-006': {
    name: 'New Balance 574 — Burgundy Heritage', price: 159, brand: 'New Balance',
    category: 'Classic Lifestyle', color: 'Burgundy / White',
    material: 'Suede, Mesh', outsole: 'Rubber Outsole',
    cushioning: 'Cushioned Foam Midsole', style: 'Retro / Everyday', weight: 'Approx. 340 g',
    description: 'An enduring classic with a rich burgundy finish. Traditional panel construction, contrasting white details and a timeless silhouette deliver understated everyday style.',
    shortDescription: 'A timeless everyday essential.',
  },
  'vx-007': {
    name: 'Balenciaga Triple S — Navy White', price: 349, brand: 'Balenciaga',
    category: 'Luxury / Chunky Sneakers', color: 'White / Navy Blue / Gray',
    material: 'Mesh, Synthetic Leather', outsole: 'Multi-Layer Rubber',
    cushioning: 'Layered Cushioned Sole', style: 'Luxury Streetwear', weight: 'Approx. 650 g',
    description: 'An oversized silhouette with distinctive layered construction. Combining contrasting navy and white panels with a sculptural sole, this design embodies contemporary luxury streetwear.',
    shortDescription: 'Oversized. Unmistakable.',
  },
  'vx-008': {
    name: 'Terra Sculpt — Mocha', price: 189,
    category: 'Contemporary Lifestyle', color: 'Mocha Brown',
    material: 'Synthetic Leather, Textile', outsole: 'Sculpted Rubber / EVA',
    cushioning: 'Cushioned Foam Midsole', style: 'Minimalist / Avant-Garde', weight: 'Approx. 430 g',
    description: 'A bold sculptural silhouette in a deep mocha finish. Rounded proportions, fluid paneling and a monochromatic palette give this sneaker a distinctive architectural character.',
    shortDescription: 'Organic form. Modern attitude.',
  },
  'vx-009': {
    name: 'Contrast Runner — Mono', price: 199,
    category: 'Chunky Lifestyle', color: 'Black / White',
    material: 'Synthetic Leather, Mesh', outsole: 'Rubber Outsole',
    cushioning: 'Cushioned Midsole', style: 'Streetwear / Contemporary', weight: 'Approx. 440 g',
    description: 'A high-contrast statement sneaker featuring layered black-and-white panels, bold proportions and a sculpted outsole. Designed for a modern streetwear wardrobe.',
    shortDescription: 'Contrast defines character.',
  },
  'vx-010': {
    name: 'Nike Air Monarch IV — Triple Black', price: 169, brand: 'Nike',
    category: 'Lifestyle / Training Inspired', color: 'Triple Black',
    material: 'Synthetic Leather, Textile', outsole: 'Durable Rubber',
    cushioning: 'Cushioned Midsole', style: 'Classic Sport / Everyday', weight: 'Approx. 410 g',
    description: 'A timeless all-black silhouette with layered construction and a substantial outsole. Clean, understated and versatile, designed to complement everyday urban outfits.',
    shortDescription: 'All black. Always relevant.',
  },
};

export const products = assets.map(asset => {
  const demo = demoCatalog[asset.id];
  return {
    id: asset.id, code: asset.id.toUpperCase(), label: demo.name, name: demo.name,
    description: demo.description, shortDescription: demo.shortDescription,
    dataStatus: 'demo', asset,
    offer: {
      priceCents: demo.price * 100, currency: 'USD',
      sizes: ['7', '8', '8.5', '9', '9.5', '10', '11'], defaultSize: '9',
      details: {
        brand: demo.brand, category: demo.category, color: demo.color,
        material: demo.material, outsole: demo.outsole, cushioning: demo.cushioning,
        style: demo.style, gender: 'Unisex', weight: demo.weight,
        shipping: asset.id === 'vx-005' ? 'Free worldwide (3–7 business days)' : 'Calculated at checkout',
      },
    },
  };
});

export function getProduct(id) {
  return products.find(product => product.id === id);
}
