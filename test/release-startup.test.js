import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {JSDOM,VirtualConsole} from 'jsdom';
const root=new URL('../www/',import.meta.url);
test('Android packaged entry renders its home after loading the external head script',async()=>{
 const server=http.createServer(async(req,res)=>{
  const path=req.url==='/'?'index.html':req.url.slice(1);
  if(!['index.html','app.js','style.css'].includes(path)){res.writeHead(404);res.end();return;}
  try{const data=await readFile(new URL(path,root));res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':'text/html');res.end(data);}catch{res.writeHead(500);res.end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
 let dom;
 try{
  dom=await JSDOM.fromURL(`http://127.0.0.1:${server.address().port}/`,{runScripts:'dangerously',resources:'usable',virtualConsole:console});
  if(dom.window.document.readyState!=='complete')await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Packaged startup timed out')),5000);
   dom.window.addEventListener('load',()=>{clearTimeout(timer);resolve();},{once:true});
  });
  const d=dom.window.document;assert.deepEqual(errors,[]);
  assert.equal(d.querySelectorAll('#app [data-topic]').length,3);
  d.querySelector('[data-topic="countries"]').click();d.querySelector('[data-mode="study"]').click();
  assert.equal(d.querySelectorAll('.learning-row').length,195);
 }finally{dom?.window.close();await new Promise(resolve=>server.close(resolve));}
});
