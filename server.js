import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files=new Set(['index.html','app.js','data.js','storage.js','learning.js','map-view.js','datasets/region-maps.js','datasets/hanja.js','datasets/regions.js','datasets/elements.js','datasets/idioms.js','style.css','datasets/countries.js','datasets/history.js','datasets/leaders.js','datasets/capitals-ko.js','datasets/leader-catalog.js','datasets/SOURCES.md','datasets/COUNTRIES-LICENSE','datasets/country-sources.json']);
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',md:'text/plain; charset=utf-8',json:'application/json'};
http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=pathname==='/'?'index.html':pathname.slice(1);
 if(!files.has(file)&&!/^assets\/flags\/[a-z]{2}\.svg$/.test(file)){res.writeHead(404);res.end('Not found');return;}
 try{
  const body=await readFile(new URL(file,import.meta.url));
  res.writeHead(200,{'Content-Type':types[file.split('.').pop()]||'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'});res.end(body);
 }catch(err){res.writeHead(err.code==='ENOENT'?404:500);res.end('Unable to load file');}
}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Memory app running on port '+(process.env.PORT||3000)));
