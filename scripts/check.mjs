import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const dir of ['api','lib','public','scripts'])for(const file of readdirSync(dir))if(/\.(mjs|js)$/.test(file))execFileSync(process.execPath,['--check',`${dir}/${file}`]);
for(const file of ['index.html','book.html','admin.html']){
 const html=readFileSync(`public/${file}`,'utf8');
 for(const [,asset] of html.matchAll(/(?:src|href)="(\/(?:[^"#?]+\.(?:js|css|png|jpg)))"/g))if(!existsSync('public'+asset))throw new Error(`Missing ${asset}`);
}
if(readFileSync('public/index.html','utf8').includes('setmore'))throw new Error('Setmore remains connected');
console.log('JavaScript syntax, linked assets, and Setmore removal verified.');
