import {build} from 'esbuild';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
await mkdir('www',{recursive:true});
await mkdir('dist',{recursive:true});
await mkdir('demo',{recursive:true});
await build({entryPoints:['app.js'],bundle:true,outfile:'www/app.js',format:'iife',target:'es2020'});
const html=(await readFile('index.html','utf8')).replace('type="module" ','').replaceAll('href="/style.css"','href="style.css"').replaceAll('src="/app.js"','src="app.js"');
await writeFile('www/index.html',html);
await copyFile('style.css','www/style.css');
const css=await readFile('style.css','utf8');
const js=await readFile('www/app.js','utf8');
const standalone=html.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${css}</style>`);
await writeFile('dist/chagok-demo.html',standalone.replace('<script src="app.js"></script>','').replace('</body>',()=>`<script>${js}</script></body>`));
console.log('Built www/ and dist/chagok-demo.html');

await copyFile('dist/chagok-demo.html','demo/index.html');
