export const TIME_ZONE = 'America/Los_Angeles';
export const LOCATIONS = ['San Bernardino', 'San Jacinto'];
export const TIMES = ['06:00', '08:30', '11:30', '14:30', '17:00', '19:30'];
export const SERVICES = [
  {id:'acrylic',name:'Acrylic full set',duration:150},
  {id:'fill',name:'Fill — Joane’s work only',duration:150},
  {id:'soak',name:'Soak-off',duration:150}
];
export const TIERS = [
  {id:'none',name:'Solid gel color',price:'Included'},
  {id:'tier1',name:'Tier 1 · The subtle touch',price:'$10'},
  {id:'tier2',name:'Tier 2 · Simple expression',price:'$10'},
  {id:'tier3',name:'Tier 3 · Art in the details',price:'$25–35'},
  {id:'tier4',name:'Tier 4 · Your statement set',price:'$40+'}
];
export function durationFor(service,tier,removal=false){
  const base=SERVICES.find(s=>s.id===service);
  if(!base || !TIERS.some(t=>t.id===tier)) throw new Error('Choose a valid service and nail-art tier.');
  // Conservative starting allocation; Joane can change the duration on a request.
  return base.duration + ((tier==='tier4'||removal)&&service!=='soak'?30:0);
}
export function dateInLA(date=new Date()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
}
export function localInstant(date,time){
  const guess=new Date(`${date}T${time}:00Z`);
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:TIME_ZONE,timeZoneName:'longOffset'}).formatToParts(guess);
  const offset=parts.find(p=>p.type==='timeZoneName').value.replace('GMT','');
  return new Date(`${date}T${time}:00${offset}`);
}
export function monthLimit(now=new Date()){
  const [y,m,d]=dateInLA(now).split('-').map(Number);
  const last=new Date(Date.UTC(y,m+1,0)).getUTCDate();
  return `${m===12?y+1:y}-${String(m===12?1:m+1).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`;
}
export function validateSlot(date,time,now=new Date()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!TIMES.includes(time)) throw new Error('Choose a listed appointment time.');
  const check=new Date(`${date}T12:00:00Z`);
  if(Number.isNaN(check.valueOf())||check.toISOString().slice(0,10)!==date) throw new Error('Choose a valid date.');
  const day=check.getUTCDay();
  if(day<2 || (day===6&&time==='19:30')) throw new Error('Appointments are Tuesday–Saturday, with no 7:30 PM Saturday visits.');
  if(date>monthLimit(now)||date<dateInLA(now)) throw new Error('Appointments open up to one month ahead.');
  const start=localInstant(date,time);
  if(start-now<86400000) throw new Error('Book at least 24 hours ahead. Text Joane for same-day requests.');
  return start;
}
export function holdExpiry(now=new Date()){
  const today=dateInLA(now);const tomorrow=new Date(`${today}T12:00:00Z`);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
  return localInstant(tomorrow.toISOString().slice(0,10),'00:00');
}
export function displayTime(time){const [h,m]=time.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;}
