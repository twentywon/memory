import {copyFile,mkdir,readFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const target=`dist/차곡-암기 앱-v${version}.apk`;
await copyFile('android/app/build/outputs/apk/debug/app-debug.apk',target);
console.log(`APK saved: ${target}`);
