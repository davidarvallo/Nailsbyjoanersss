import {db,configured,limit,settings} from '../lib/db.js';
import {hash,randomToken,verifyPassword,session,cookie,requireAdmin,sameOrigin} from '../lib/auth.js';
import {LOCATIONS,TIMES,SERVICES,TIERS,validateSlot,durationFor,holdExpiry,localInstant,dateInLA,monthLimit} from '../public/booking-config.js';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
function clean(value,max=100){if(typeof value!=='string'||value.trim().length>max)fail('Please check your details.');return value.trim();}
function selected(value,list){if(!list.includes(value))fail('Please choose a valid option.');return value;}
function endAt(start,duration){return new Date(start.valueOf()+duration*60000);}
function receipt(b){return {id:b.id,status:b.status,start:b.start_at,end:b.end_at,expires:b.expires_at,deposit:b.data.deposit,location:b.data.location,service:b.data.service,tier:b.data.tier,depositVerified:b.deposit_verified};}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const query=req.query||Object.fromEntries(new URL(req.url,'http://localhost').searchParams);
  if(req.method==='GET'){
   if(query.action==='config'){
    const ready=configured();let config={};if(ready)config=await settings();
    return res.status(200).json({ready,open:ready&&process.env.BOOKING_ENABLED==='true'&&config.open===true,paymentInstructions:config.paymentInstructions||'',dates:config.dates||{},minDate:dateInLA(),maxDate:monthLimit()});
   }
   if(!configured())fail('Booking setup is still in progress. Please text Joane.',503);
   if(query.action==='admin'){
    requireAdmin(req);
    await db().query("UPDATE bookings SET status='expired',updated_at=now() WHERE status='pending' AND expires_at<=now()");
    const rows=await db().query('SELECT * FROM bookings ORDER BY start_at DESC LIMIT 500');
    return res.status(200).json({bookings:rows,settings:await settings(),enabled:process.env.BOOKING_ENABLED==='true'});
   }
   if(query.action==='status'){
    if(!/^[A-Za-z0-9_-]{43}$/.test(query.token||''))fail('Invalid booking link.',404);
    const rows=await db().query('SELECT * FROM bookings WHERE token_hash=$1',[hash(query.token)]);
    if(!rows.length)fail('Booking not found.',404);
    let b=rows[0];if(b.status==='pending'&&new Date(b.expires_at)<=new Date()){await db().query("UPDATE bookings SET status='expired',updated_at=now() WHERE id=$1 AND status='pending' AND expires_at<=now()",[b.id]);const fresh=await db().query('SELECT * FROM bookings WHERE id=$1',[b.id]);b=fresh[0];}
    return res.status(200).json(receipt(b));
   }
   const config=await settings();if(process.env.BOOKING_ENABLED!=='true'||config.open!==true)fail('Online booking is not open yet. Text Joane to request an appointment.',503);
   const location=selected(query.location,LOCATIONS);
   const duration=durationFor(query.service,query.tier,query.removal==='true');
   const date=clean(query.date,10);const dayConfig=config.dates?.[date];
   if(dayConfig==='closed'||(dayConfig&&dayConfig!==location))return res.status(200).json({slots:[],duration});
   const candidates=TIMES.flatMap(time=>{try{const start=validateSlot(date,time);return [{time,start,end:endAt(start,duration)}];}catch{return [];}});
   const occupied=await db().query("SELECT start_at,end_at FROM bookings WHERE status IN ('confirmed','blocked') OR (status='pending' AND expires_at>now())");
   const slots=candidates.filter(c=>!occupied.some(b=>new Date(b.start_at)<c.end&&new Date(b.end_at)>c.start)).map(c=>c.time);
   return res.status(200).json({slots,duration});
  }
  if(req.method!=='POST') {res.setHeader('Allow','GET, POST');fail('Method not allowed.',405);}
  sameOrigin(req);
  if(!configured())fail('Booking setup is still in progress. Please text Joane.',503);
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body!=='object'||JSON.stringify(body).length>10000)fail('Invalid request.');
  const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
  if(body.action==='login'){
   await limit(`login:${hash(ip)}`,8);if(!verifyPassword(body.password))fail('Incorrect password.',401);
   res.setHeader('Set-Cookie',cookie(session()));return res.status(200).json({ok:true});
  }
  if(body.action==='logout'){res.setHeader('Set-Cookie',cookie('',true));return res.status(200).json({ok:true});}
  if(['manage','settings','block'].includes(body.action)){
   requireAdmin(req);
   if(body.action==='settings'){
    const instructions=clean(body.paymentInstructions||'',1200);const dates=body.dates||{};
    if(Object.keys(dates).length>90)fail('Limit calendar overrides to 90 days.');
    for(const [date,loc] of Object.entries(dates)){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||(!LOCATIONS.includes(loc)&&loc!=='closed'))fail('Invalid calendar setting.');}
    if(body.open&&!instructions)fail('Add verified deposit payment instructions before opening bookings.');
    const data={open:body.open===true,paymentInstructions:instructions,dates};
    await db().query('UPDATE booking_settings SET data=$1::jsonb WHERE id=1',[JSON.stringify(data)]);return res.status(200).json({ok:true});
   }
   if(body.action==='block'){
    const start=localInstant(clean(body.date,10),selected(body.time,TIMES));const duration=Number(body.duration);
    if(!Number.isFinite(start.valueOf())||!Number.isInteger(duration)||duration<30||duration>960)fail('Choose a valid time and duration.');
    const result=await db().query('SELECT reserve_booking($1,$2,$3,$4,$5,$6::jsonb,true) AS result',[randomToken().slice(0,12),hash(randomToken()),start.toISOString(),endAt(start,duration).toISOString(),endAt(start,duration).toISOString(),JSON.stringify({note:clean(body.note||'Unavailable',200)})]);
    if(result[0].result!=='ok')fail('This block overlaps an existing appointment.',409);return res.status(200).json({ok:true});
   }
   const operation=selected(body.operation,['confirm','decline','cancel','reschedule']);
   let start=null,end=null,location=null;
   if(operation==='reschedule'){
    // Joane may accommodate same-day requests manually; standard days and start times still apply.
    const date=clean(body.date,10);const time=selected(body.time,TIMES);const check=new Date(`${date}T12:00:00Z`);
    if(!Number.isFinite(check.valueOf())||check.toISOString().slice(0,10)!==date||check.getUTCDay()<2||(check.getUTCDay()===6&&time==='19:30'))fail('Choose a valid appointment day and time.');
    start=localInstant(date,time);location=selected(body.location,LOCATIONS);const duration=Number(body.duration);
    if(start<new Date()||!Number.isInteger(duration)||duration<30||duration>480)fail('Choose a future time and a duration from 30 to 480 minutes.');
    end=endAt(start,duration);
    const calendar=(await settings()).dates?.[date];if(calendar==='closed'||(calendar&&calendar!==location))fail('The location calendar does not allow this visit.');
   }
   if(operation==='confirm'&&body.verified!==true)fail('Verify the deposit before confirming.');
   const result=await db().query('SELECT manage_booking($1,$2,$3,$4,$5) AS result',[clean(body.id,50),operation,start?.toISOString()||null,end?.toISOString()||null,location]);
   if(result[0].result!=='ok')fail(result[0].result==='conflict'?'This time overlaps another appointment.':'This request is no longer available for that action.',409);
   return res.status(200).json({ok:true});
  }
  if(body.action!=='reserve')fail('Unknown request.');
  await limit(`reserve:${hash(ip)}`,6);
  if(body.website)fail('Unable to process this request.');
  const config=await settings();if(process.env.BOOKING_ENABLED!=='true'||config.open!==true)fail('Online booking is not open yet. Text Joane.',503);
  const service=selected(body.service,SERVICES.map(s=>s.id));const tier=selected(body.tier,TIERS.map(t=>t.id));
  const location=selected(body.location,LOCATIONS);const date=clean(body.date,10);const time=selected(body.time,TIMES);const start=validateSlot(date,time);
  const assigned=config.dates?.[date];if(assigned==='closed'||(assigned&&assigned!==location))fail('This location is not available on that date.',409);
  const removal=body.removal===true;const duration=durationFor(service,tier,removal);
  if(service==='soak'&&tier!=='none')fail('Nail-art tiers apply to sets and fills.');
  if(service==='fill'&&body.ownWork!==true)fail('Fills are for Joane’s work only.');
  if(body.acceptPolicies!==true)fail('Please review and accept the booking policies.');
  const name=clean(body.name,100);const phone=clean(body.phone,30);const email=clean(body.email||'',150);
  if(name.length<2||phone.replace(/\D/g,'').length<10||phone.replace(/\D/g,'').length>15||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))fail('Enter a valid name, phone number, and email if provided.');
  const data={service,tier,location,removal,duration,name,phone,email,length:clean(body.length||'',40),shapeChange:body.shapeChange===true,notes:clean(body.notes||'',1000),deposit:time==='06:00'?35:20,policiesVersion:'2026-10-04',acceptPolicies:true};
  const token=randomToken();const id=randomToken().slice(0,12);const expiry=holdExpiry();
  const result=await db().query('SELECT reserve_booking($1,$2,$3,$4,$5,$6::jsonb) AS result',[id,hash(token),start.toISOString(),endAt(start,duration).toISOString(),expiry.toISOString(),JSON.stringify(data)]);
  if(result[0].result!=='ok')fail('That time was just taken. Please choose another slot.',409);
  return res.status(201).json({id,token,status:'pending',deposit:data.deposit,expires:expiry.toISOString(),paymentInstructions:config.paymentInstructions});
 }catch(error){
  const status=error.status||500;
  if(status===500)console.error('Booking request failed:',error.code||error.name);
  return res.status(status).json({error:status===500?'We couldn’t complete this request. Please try again or text Joane.':error.message});
 }
}
