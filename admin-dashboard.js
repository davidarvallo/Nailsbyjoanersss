// Pure appointment/calendar helpers used by the private studio dashboard.
export const STUDIO_ZONE='America/Los_Angeles';
const partsFormatter=new Intl.DateTimeFormat('en-US',{timeZone:STUDIO_ZONE,year:'numeric',month:'2-digit',day:'2-digit'});
export function dayKey(value){
 const parts=Object.fromEntries(partsFormatter.formatToParts(new Date(value)).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
export function monthCells(month){
 if(!/^\d{4}-\d{2}$/.test(month))throw new Error('Invalid calendar month');
 const [year,number]=month.split('-').map(Number);
 if(number<1||number>12)throw new Error('Invalid calendar month');
 const first=new Date(Date.UTC(year,number-1,1));
 const offset=first.getUTCDay();
 const cells=[];
 for(let i=0;i<42;i++){
  const date=new Date(Date.UTC(year,number-1,1-offset+i));
  cells.push({date:date.toISOString().slice(0,10),day:date.getUTCDate(),inMonth:date.getUTCMonth()===number-1});
 }
 return cells;
}
export function shiftMonth(month,amount){
 const [year,number]=month.split('-').map(Number);
 return new Date(Date.UTC(year,number-1+amount,1)).toISOString().slice(0,7);
}
export function effectiveStatus(b,now=new Date()){
 if(b.status==='pending'&&new Date(b.expires_at)<=now)return 'expired';
 return b.status;
}
export function appointmentMetrics(bookings,now=new Date()){
 const today=dayKey(now),end=new Date(now.getTime()+7*86400000);
 const active=bookings.filter(b=>['pending','confirmed'].includes(effectiveStatus(b,now))&&new Date(b.end_at)>now);
 return {
  pending:active.filter(b=>b.status==='pending').length,
  confirmed:active.filter(b=>b.status==='confirmed').length,
  today:active.filter(b=>dayKey(b.start_at)===today).length,
  week:active.filter(b=>new Date(b.start_at)<end).length
 };
}
export function appointmentsForDay(bookings,date,now=new Date()){
 return bookings.filter(b=>dayKey(b.start_at)===date)
  .sort((a,b)=>new Date(a.start_at)-new Date(b.start_at)||a.id.localeCompare(b.id));
}
export function filterAppointments(bookings,{filter='upcoming',query='',now=new Date()}={}){
 const term=String(query||'').trim().toLowerCase();
 const selected=bookings.filter(b=>{
  const status=effectiveStatus(b,now),future=new Date(b.end_at)>now;
  let included;
  switch(filter){
   case 'pending':included=status==='pending'&&future;break;
   case 'confirmed':included=status==='confirmed';break;
   case 'blocked':included=status==='blocked'&&future;break;
   case 'history':included=!future||['declined','canceled','expired'].includes(status);break;
   case 'all':included=true;break;
   default:included=future&&['pending','confirmed'].includes(status);
  }
  if(!included)return false;
  if(!term)return true;
  const d=b.data||{};
  return [b.id,b.status,d.name,d.phone,d.email,d.notes,d.service,d.location].some(v=>String(v??'').toLowerCase().includes(term));
 });
 const descending=filter==='history'||filter==='all';
 return selected.sort((a,b)=>(descending?new Date(b.start_at)-new Date(a.start_at):new Date(a.start_at)-new Date(b.start_at))||String(a.id).localeCompare(String(b.id)));
}
