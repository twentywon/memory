import {copyFile,mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
const target='dist/차곡-암기 앱.apk';
await copyFile('android/app/build/outputs/apk/debug/app-debug.apk',target);
console.log(`APK saved: ${target}`);
