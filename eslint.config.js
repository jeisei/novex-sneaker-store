import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores:['node_modules/**','dist/**','Backups/**','Legacy/**','NOVEX_Render_Test/**','Referense*/**','reports/**','release/**'] },
  js.configs.recommended,
  { files:['src/**/*.js'], languageOptions:{globals:globals.browser}, rules:{'no-unused-vars':['error',{argsIgnorePattern:'^_',caughtErrors:'none'}]} },
  { files:['scripts/**/*.mjs','tests/**/*.js','*.config.js'], languageOptions:{globals:{...globals.node,...globals.browser}}, rules:{'no-unused-vars':['error',{argsIgnorePattern:'^_',caughtErrors:'none'}]} },
  { ignores:['scripts/audit-*.js','scripts/generate-*.js','scripts/measure-*.js','scripts/compare-*.js','scripts/record-*.js'] },
];
