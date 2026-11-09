import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Exercise the production CSP in local production previews as well as Netlify.
const productionHeaders=Object.fromEntries(
  readFileSync(new URL('./public/_headers',import.meta.url),'utf8').split('\n')
    .slice(1,5).map(line=>{const colon=line.indexOf(':');return [line.slice(0,colon).trim(),line.slice(colon+1).trim()];}),
);

export default defineConfig({
  base: './',
  server: { strictPort: true },
  preview: { strictPort: true, headers:productionHeaders },
});
