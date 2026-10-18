export const TIME_ZONE = 'America/Los_Angeles';
export const LOCATIONS = ['San Bernardino', 'San Jacinto'];
export const TIMES = ['06:00', '08:30', '11:30', '14:30', '17:00', '19:30'];
export const SERVICES = [
  {id:'acrylic',name:'Full set',duration:150},
  {id:'acrylic-soak',name:'Full set + soak-off',duration:180},
  {id:'pedi1',name:'Tier 1 — Basic Pedicure',duration:45,price:45},
  {id:'pedi2',name:'Tier 2 — Deluxe Pedicure',duration:80,price:60},
  {id:'pedi3',name:'Tier 3 — Heavenly Luxury Pedicure',duration:120,price:85},
  {id:'fall-pedi',name:'Luxury Fall Pedicure + 10 Acrylic Toes',duration:150,price:130,seasonal:true},
  {id:'fill',name:'Fill — Joane’s work only',duration:150},
  {id:'soak',name:'Soak-off',duration:150}
];
export const TIERS = [
  {id:'none',name:'Solid gel color',price:'Included'},
  {id:'tier1',name:'Tier 1 · The subtle touch',price:'$10'},
  {id:'tier2',name:'Tier 2 · Simple expression',price:'$25',description:'More intricate designs such as ombré, animal print, abstract patterns, or hand-painted art using multiple colors, minimal rhinestones, and 3D flowers.'},
  {id:'tier3',name:'Tier 3 · Art in the details',price:'$25–35'},
  {id:'tier4',name:'Tier 4 · Your statement set',price:'$40+'}
];
export const PEDICURES = SERVICES.filter(s=>s.id.startsWith('pedi'));
export function validateSeason(service,date){
 if(service==='fall-pedi' && (date<'2026-10-01'||date>'2026-11-30')) throw new Error('Fall packages are available October 1–November 30, 2026.');
}
export function durationFor(service,tier,removal=false,pedicure=''){

  const base=SERVICES.find(s=>s.id===service);
  if(!base || !TIERS.some(t=>t.id===tier)) throw new Error('Choose a valid service and nail-art tier.');
  const nailService=['acrylic','acrylic-soak','fill'].includes(service);
  if(!nailService && (tier!=='none'||removal||pedicure)) throw new Error('Choose nail art and removal only with a nail set or fill.');
  if(pedicure && !PEDICURES.some(s=>s.id===pedicure)) throw new Error('Choose a valid pedicure.');
  return base.duration + (nailService && service!=='acrylic-soak' && (tier==='tier4'||removal)?30:0) + (PEDICURES.find(s=>s.id===pedicure)?.duration||0);

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
