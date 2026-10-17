import {readdirSync,cpSync,mkdirSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const dir of ['.','api','lib','scripts'])for(const f of readdirSync(dir))if(/\.(js|mjs)$/.test(f))execFileSync(process.execPath,['--check',`${dir}/${f}`]);
rmSync('dist',{recursive:true,force:true});mkdirSync('dist');
for(const f of readdirSync('.'))if(/\.(html|css|js)$/.test(f))cpSync(f,`dist/${f}`);
for(const dir of ['assets','public'])cpSync(dir,`dist/${dir}`,{recursive:true});
for(const file of readdirSync('dist').filter(f=>f.endsWith('.html'))){
 const html=readFileSync(`dist/${file}`,'utf8');
 for(const [,asset] of html.matchAll(/(?:src|href)="(\/[^"#?]+\.(?:js|css|png|jpg|webp))"/g))if(!existsSync('dist'+asset))throw new Error('Missing asset '+asset);
}
for(const secret of ['api','lib','.env.example','package.json'])if(existsSync(`dist/${secret}`))throw new Error('Server source exposed: '+secret);
console.log('Build passed: syntax, page assets, and server-source isolation.');
