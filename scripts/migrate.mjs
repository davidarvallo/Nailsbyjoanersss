import {readFileSync} from 'node:fs';
import {neon} from '@neondatabase/serverless';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL before running this script.');
const sql=neon(process.env.DATABASE_URL);const schema=readFileSync(new URL('../lib/schema.sql',import.meta.url),'utf8');
const statements=[];let current='',dollar=false,quote=false;
for(let i=0;i<schema.length;i++){
 if(!quote&&schema.slice(i,i+2)==='$$'){dollar=!dollar;current+='$$';i++;continue;}
 const c=schema[i];if(!dollar&&c==="'"){if(quote&&schema[i+1]==="'"){current+="''";i++;continue;}quote=!quote;}
 if(c===';'&&!dollar&&!quote){if(current.trim())statements.push(current);current='';}else current+=c;
}
if(current.trim())statements.push(current);
await sql.transaction(statements.map(statement=>sql.query(statement)));
console.log('Booking schema installed.');
