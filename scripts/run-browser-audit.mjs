import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import audit from './audit-release.mjs';
import auditSecurity from './audit-security-preview.mjs';

const base=process.env.NOVEX_TEST_URL??'http://127.0.0.1:4173/';
let server;
try {
  if(!process.env.NOVEX_TEST_URL) {
    try{await fetch(base);}catch{
      server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173'],{stdio:'ignore',windowsHide:true});
      for(let i=0;i<100;i++) {try{await fetch(base);break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}}
    }
  }
  const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage();
    if(process.env.NOVEX_TEST_MODE==='security')await auditSecurity(page,{base});
    else await audit(page,{base,models:process.env.NOVEX_TEST_MODE!=='responsive',responsive:process.env.NOVEX_TEST_MODE!=='models'});
  }finally{await browser.close();}
} finally {server?.kill();}
