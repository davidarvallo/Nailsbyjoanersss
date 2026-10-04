import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
process.env.NODE_ENV='development';
const {default:handler}=await import('../api/booking.js');
const root=resolve('public');
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg'};
createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/booking'){
  req.query=Object.fromEntries(url.searchParams);let text='';for await(const part of req){text+=part;if(text.length>12000){res.writeHead(413);res.end();return;}}
  try{req.body=text?JSON.parse(text):{};}catch{res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Invalid JSON.'}));return;}
  res.status=code=>{res.statusCode=code;return res;};res.json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};return handler(req,res);
 }
 try{
  let path=resolve(root,'.'+decodeURIComponent(url.pathname));if(!path.startsWith(root+'/')&&path!==root)throw new Error();
  if(path===root)path+='/index.html';else if(!extname(path))path+='.html';
  const file=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(file);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(3000,'0.0.0.0',()=>console.log('Local preview: http://localhost:3000'));
