import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {inflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';

// Extract only verified image files. The source archive is not published in dist.
function crc32(data) {
  let crc=-1;
  for(const b of data) {
    crc^=b;
    for(let k=0;k<8;k++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^-1)>>>0;
}
function archiveImages(path) {
  const zip=readFileSync(path);
  let end=-1;
  for(let p=zip.length-22;p>=Math.max(0,zip.length-65557);p--) {
    if(zip.readUInt32LE(p)===0x06054b50 && p+22+zip.readUInt16LE(p+20)===zip.length){end=p;break;}
  }
  if(end<0)throw Error('Invalid Joane ZIP: end record not found');
  if(zip.readUInt16LE(end+4)!==0 || zip.readUInt16LE(end+6)!==0)throw Error('Multipart ZIP unsupported');
  const count=zip.readUInt16LE(end+10);
  let at=zip.readUInt32LE(end+16),total=0;
  if(count>200 || at===0xffffffff)throw Error('ZIP too large or ZIP64 unsupported');
  const photos=[];
  for(let i=0;i<count;i++) {
    if(at+46>zip.length||zip.readUInt32LE(at)!==0x02014b50)throw Error('Bad ZIP directory');
    const flags=zip.readUInt16LE(at+8),method=zip.readUInt16LE(at+10);
    const checksum=zip.readUInt32LE(at+16),packed=zip.readUInt32LE(at+20),size=zip.readUInt32LE(at+24);
    const nameLength=zip.readUInt16LE(at+28),extra=zip.readUInt16LE(at+30),comment=zip.readUInt16LE(at+32);
    const local=zip.readUInt32LE(at+42);
    const name=zip.subarray(at+46,at+46+nameLength).toString('utf8');
    at+=46+nameLength+extra+comment;
    const filename=name.replaceAll('\\','/').split('/').pop();
    if(name.endsWith('/')||name.includes('__MACOSX/')||!filename||filename.startsWith('.')||!/\.(jpe?g|png|webp)$/i.test(filename))continue;
    if((flags&1)!==0||![0,8].includes(method))throw Error('Unsupported ZIP compression: '+name);
    total+=size;
    if(size>20000000||total>100000000||local+30>zip.length||zip.readUInt32LE(local)!==0x04034b50)throw Error('Invalid or oversized ZIP image: '+name);
    const start=local+30+zip.readUInt16LE(local+26)+zip.readUInt16LE(local+28);
    if(start+packed>zip.length)throw Error('Truncated ZIP image: '+name);
    const raw=zip.subarray(start,start+packed);
    const bytes=method===8?inflateRawSync(raw,{maxOutputLength:20000001}):Buffer.from(raw);
    if(bytes.length!==size||crc32(bytes)!==checksum)throw Error('Corrupted ZIP image: '+name);
    let extension;
    if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)extension='jpg';
    else if(bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))extension='png';
    else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')extension='webp';
    else throw Error('Unrecognized image format: '+name);
    const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
    photos.push({filename,bytes,extension,hash});
  }
  return photos;
}
function slug(text) {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
    .replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45)||'photo';
}
function imageSize(bytes,extension) {
  if(extension==='png'&&bytes.length>24)return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  if(extension==='jpg'){
    let p=2;
    while(p+9<bytes.length){
      if(bytes[p++]!==255)break;
      const marker=bytes[p++];
      if(marker===216||marker===1)continue;
      if(marker===217||marker===218)break;
      const len=bytes.readUInt16BE(p);
      if(len<2||p+len>bytes.length)break;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker))return [bytes.readUInt16BE(p+5),bytes.readUInt16BE(p+3)];
      p+=len;
    }
  }
  return [1200,1600];
}
export function importJoaneArchive(archive='Nailsbtjoanersss.zip',dist='dist') {
  const all=archiveImages(archive);
  const menus=all.filter(f=>/services?/i.test(f.filename)).sort((a,b)=>a.filename.localeCompare(b.filename,undefined,{numeric:true}));
  const pedicures=[...new Map(all.filter(f=>!/services?/i.test(f.filename)).map(f=>[f.hash,f])).values()];
  if(menus.length!==2)throw Error('Expected 2 service images; ZIP contains '+menus.length);
  if(!pedicures.length)throw Error('No pedicure images found in ZIP');
  function save(folder,name,bytes) {
    const file=join(dist,'public','images',folder,name);
    mkdirSync(dirname(file),{recursive:true});
    writeFileSync(file,bytes);
    return '/public/images/'+folder+'/'+name;
  }
  const photos=pedicures.map((photo,i)=>{
    const id='joane-pedicure-'+slug(photo.filename)+'-'+photo.hash.slice(0,8);
    const url=save('pedicures',id+'.'+photo.extension,photo.bytes);
    const [width,height]=imageSize(photo.bytes,photo.extension);
    return {id,category:'pedicures',title:'Pedicure inspiration '+(i+1),alt:'Pedicure design by Joane, look '+(i+1),source:photo.filename,url,width,height};
  });
  appendFileSync(join(dist,'portfolio-data.js'),'\n// New pedicures, imported from Nailsbtjoanersss.zip at build time.\nwindow.PORTFOLIO_PHOTOS.push(...'+JSON.stringify(photos)+');\n');
  // The two service screenshots are used as reference material only.
  // Their verified offerings are editable booking choices in booking-config.js.
  // Do not publish or inject screenshots of the menu into the site.
  console.log('New archive: '+photos.length+' pedicure photos; services use the booking menu.');
  return {pedicures:photos.length,menus:0};
}
