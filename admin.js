import {SERVICES,TIERS,TIMES,displayTime} from './booking-config.js';
import {dayKey,monthCells,shiftMonth,effectiveStatus,appointmentMetrics,appointmentsForDay,filterAppointments,STUDIO_ZONE} from './admin-dashboard.js';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fullDate=new Intl.DateTimeFormat('en-US',{timeZone:STUDIO_ZONE,weekday:'long',month:'long',day:'numeric',year:'numeric'});
const dateTime=new Intl.DateTimeFormat('en-US',{timeZone:STUDIO_ZONE,weekday:'short',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
const timeOnly=new Intl.DateTimeFormat('en-US',{timeZone:STUDIO_ZONE,hour:'numeric',minute:'2-digit'});
const calendarTitle=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'long',year:'numeric'});
const dateTitle=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',weekday:'long',month:'long',day:'numeric',year:'numeric'});
const serviceName=id=>SERVICES.find(service=>service.id===id)?.name||'Nail appointment';
const tierName=id=>TIERS.find(tier=>tier.id===id)?.name||'No additional nail art';
const statusLabels={pending:'Awaiting approval',confirmed:'Confirmed',blocked:'Time blocked',canceled:'Canceled',declined:'Declined',expired:'Expired'};
const cash=value=>typeof value==='number'?'$'+value:'Confirmed by Joane';
const titleDate=iso=>dateTitle.format(new Date(iso+'T12:00:00Z'));

let bookings=[],dates={},enabled=false,testMode=false;
let selectedDate=dayKey(new Date()),viewMonth=selectedDate.slice(0,7),lastLoaded=null;

async function api(body){
 const response=await fetch(body?'/api/booking':'/api/booking?action=admin',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
 const data=await response.json().catch(()=>({error:'The server returned an unexpected response.'}));
 if(!response.ok)throw Object.assign(new Error(data.error||'Please try again.'),{status:response.status});
 return data;
}
function message(value){$('#admin-message').textContent=value||'';}
function renderMode(data){
 const mode=$('#studio-mode');
 mode.className='admin-mode'+(testMode?' is-test':enabled&&data.settings?.open?' is-live':'');
 if(testMode){
  mode.innerHTML='<strong>TEST DASHBOARD</strong><span>Practice appointments only. No real deposits or customer bookings are recorded here.</span>';
 }else if(!enabled){
  mode.innerHTML='<strong>Online booking unavailable</strong><span>The Vercel booking flag is off. Existing appointments can still be reviewed.</span>';
 }else if(data.settings?.open===true){
  mode.innerHTML='<strong>Online booking open</strong><span>Customers can request appointments. Confirm them only after verifying their deposits.</span>';
 }else{
  mode.innerHTML='<strong>Online booking paused</strong><span>Customer requests are closed. You can still review appointments and prepare your calendar below.</span>';
 }
}
function renderStats(){
 const m=appointmentMetrics(bookings);
 const values=[
  ['Awaiting approval',m.pending],
  ['Upcoming confirmed',m.confirmed],
  ['Appointments today',m.today],
  ['Next 7 days',m.week]
 ];
 $('#stats').innerHTML=values.map(item=>'<div><strong>'+item[1]+'</strong><span>'+item[0]+'</span></div>').join('');
}
function calendarItems(date){
 return appointmentsForDay(bookings,date).filter(b=>['pending','confirmed','blocked'].includes(effectiveStatus(b)));
}
function renderCalendar(){
 $('#calendar-month').textContent=calendarTitle.format(new Date(viewMonth+'-01T12:00:00Z'));
 const root=$('#calendar-grid');
 root.replaceChildren();
 const today=dayKey(new Date());
 monthCells(viewMonth).forEach(cell=>{
  const active=calendarItems(cell.date);
  const button=document.createElement('button');
  button.type='button';
  button.className=(cell.inMonth?'':'is-other-month ')+(cell.date===selectedDate?'is-selected ':'')+(cell.date===today?'is-today':'');
  button.setAttribute('aria-label',titleDate(cell.date)+(active.length?', '+active.length+' scheduled items':'')+(cell.date===selectedDate?', selected':''));
  button.setAttribute('aria-pressed',String(cell.date===selectedDate));
  const number=document.createElement('span');
  number.className='calendar-number';
  number.textContent=String(cell.day);
  button.append(number);
  if(active.length){
   const dots=document.createElement('span');
   dots.className='calendar-dots';
   ['pending','confirmed','blocked'].forEach(status=>{
    if(active.some(b=>effectiveStatus(b)===status)){
     const dot=document.createElement('i');
     dot.className=status;
     dot.setAttribute('aria-hidden','true');
     dots.append(dot);
    }
   });
   button.append(dots);
   const count=document.createElement('span');
   count.className='calendar-count';
   count.textContent=active.length+(active.length===1?' item':' items');
   button.append(count);
  }
  button.addEventListener('click',()=>{
   selectedDate=cell.date;
   viewMonth=cell.date.slice(0,7);
   renderCalendar();
   renderDay();
  });
  root.append(button);
 });
}
function renderDay(){
 $('#day-heading').textContent=titleDate(selectedDate);
 const root=$('#day-appointments');
 root.replaceChildren();
 const selected=appointmentsForDay(bookings,selectedDate);
 const blockForm=$('#block-form');
 if(blockForm&&!blockForm.elements.date.value)blockForm.elements.date.value=selectedDate;
 if(!selected.length){
  const empty=document.createElement('p');
  empty.className='admin-day-empty';
  empty.textContent='No appointments or blocked times for this date.';
  root.append(empty);
  return;
 }
 selected.forEach(b=>{
  const d=b.data||{},status=effectiveStatus(b);
  const button=document.createElement('button');
  button.type='button';
  button.className='admin-day-appointment';
  const time=document.createElement('span');
  time.textContent=timeOnly.format(new Date(b.start_at));
  const name=document.createElement('strong');
  name.textContent=d.name||d.note||'Time block';
  const detail=document.createElement('small');
  detail.textContent=b.status==='blocked'?'Reserved time':serviceName(d.service);
  const badge=document.createElement('span');
  badge.className='status '+status;
  badge.textContent=statusLabels[status]||status;
  button.append(time,name,detail,badge);
  button.title='View appointment details';
  button.onclick=()=>{
   $('#filter').value='all';
   $('#booking-search').value='';
   renderList();
   const card=Array.from(document.querySelectorAll('.request-card')).find(item=>item.dataset.bookingId===b.id);
   if(card){card.focus({preventScroll:true});card.scrollIntoView({behavior:'smooth',block:'center'});}
  };
  root.append(button);
 });
}
function bookingCard(b){
 const d=b.data||{},status=effectiveStatus(b),card=document.createElement('article');
 card.className='request-card';
 card.dataset.bookingId=b.id;
 card.tabIndex=-1;
 const minutes=Math.round((new Date(b.end_at)-new Date(b.start_at))/60000);
 const name=d.name||d.note||'Time block',label=statusLabels[status]||status;
 const details=[
  '<p><strong>Service:</strong> '+esc(d.service?serviceName(d.service):'Time block')+'</p>',
  '<p><strong>Duration:</strong> '+minutes+' minutes</p>',
  d.service?'<p><strong>Base price:</strong> '+esc(cash(d.servicePrice))+'</p>':'',
  d.service?'<p><strong>Nail art:</strong> '+esc(tierName(d.tier))+'</p>':'',
  d.length?'<p><strong>Length:</strong> '+esc(d.length)+'</p>':'',
  d.pedicure?'<p><strong>Pedicure:</strong> '+esc(serviceName(d.pedicure))+'</p>':'',
  d.removal?'<p><strong>Removal:</strong> Requested</p>':'',
  d.shapeChange?'<p><strong>Shape change:</strong> Requested (+$5)</p>':'',
  d.freestyleDesign?'<p><strong>Design preference:</strong> Freestyle · artist chooses</p>':'',
  d.silentAppointment?'<p><strong>Visit preference:</strong> Silent / minimal conversation</p>':'',
  d.service?'<p><strong>Deposit:</strong> '+esc(cash(d.deposit))+' · '+(b.deposit_verified?'Verified':'Not verified')+'</p>':'',
  d.phone?'<p><strong>Mobile:</strong> '+esc(d.phone)+'</p>':'',
  d.email?'<p><strong>Email:</strong> '+esc(d.email)+'</p>':''
 ].filter(Boolean).join('');
 card.innerHTML='<div class="request-top"><div><h3>'+esc(name)+'</h3><p class="booking-ref">Booking reference: '+esc(b.id)+'</p></div><span class="status '+esc(status)+'">'+esc(label)+'</span></div>'
 +'<p class="admin-when">'+esc(dateTime.format(new Date(b.start_at)))+' Pacific</p>'
 +'<p class="admin-appointment-sub">San Bernardino studio</p>'
 +'<div class="admin-card-grid">'+details+'</div>'
 +(status==='pending'?'<p class="helper">Request hold ends '+esc(dateTime.format(new Date(b.expires_at)))+' Pacific.</p>':'')
 +(d.notes?'<div class="admin-notes"><strong>Client notes</strong><p>'+esc(d.notes)+'</p></div>':'');
 const actions=document.createElement('div');
 actions.className='admin-card-actions';
 if(d.phone){
  const link=document.createElement('a');
  link.className='button outline';
  link.textContent='Text client';
  link.href='sms:'+String(d.phone).replace(/[^+0-9]/g,'');
  actions.append(link);
 }
 if(d.email){
  const link=document.createElement('a');
  link.className='button outline';
  link.textContent='Email client';
  link.href='mailto:'+encodeURIComponent(d.email);
  actions.append(link);
 }
 function actionButton(label,operation){
  const button=document.createElement('button');
  button.type='button';
  button.className='button '+(operation==='confirm'?'gold':'outline');
  button.textContent=label;
  button.addEventListener('click',async()=>{
   const questions={
    confirm:testMode?'Confirm this test appointment? No real payment is required.':'Only confirm after checking Zelle or Apple Pay. Did you personally verify the full deposit was received?',
    decline:'Decline this appointment request and release the time?',
    cancel:status==='confirmed'?'Cancel this confirmed appointment? Remember to contact the client about refunds or rescheduling.':'Release this blocked time?'
   };
   if(!window.confirm(questions[operation]))return;
   button.disabled=true;
   try{
    await api({action:'manage',id:b.id,operation,verified:operation==='confirm'});
    message('Appointment updated. Notify the client using the contact links if needed.');
    await load(true);
   }catch(error){message(error.message);}
   finally{button.disabled=false;}
  });
  actions.append(button);
 }
 if(status==='pending'){
  actionButton(testMode?'Confirm test appointment':'Deposit verified · Confirm','confirm');
  actionButton('Decline request','decline');
 }
 if(['pending','confirmed'].includes(status)){
  const adjust=document.createElement('button');
  adjust.type='button';
  adjust.className='button outline';
  adjust.textContent='Reschedule';
  adjust.onclick=()=>{
   const f=$('#reschedule-form');
   f.elements.id.value=b.id;
   f.elements.date.value=dayKey(b.start_at);
   const fields=new Intl.DateTimeFormat('en-GB',{timeZone:STUDIO_ZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(b.start_at));
   f.elements.time.value=fields;
   f.elements.location.value='San Bernardino';
   f.elements.duration.value=minutes;
   $('#reschedule-error').textContent='';
   $('#reschedule-dialog').showModal();
  };
  actions.append(adjust);
 }
 if(status==='confirmed')actionButton('Cancel appointment','cancel');
 if(status==='blocked')actionButton('Release time block','cancel');
 card.append(actions);
 return card;
}
function renderList(){
 const filter=$('#filter').value,query=$('#booking-search').value;
 const matches=filterAppointments(bookings,{filter,query});
 const root=$('#requests');
 root.replaceChildren();
 $('#list-summary').textContent=matches.length+' '+(matches.length===1?'appointment':'appointments')+' shown'+(lastLoaded?' · Updated '+timeOnly.format(lastLoaded):'')+'.';
 if(!matches.length){
  const empty=document.createElement('p');
  empty.className='notice';
  empty.textContent=bookings.length?'No appointments match this view. Try another filter or search.':'No appointments have been booked yet. New customer requests will appear here after booking opens.';
  root.append(empty);
  return;
 }
 let lastDate='';
 matches.forEach(b=>{
  const key=dayKey(b.start_at);
  if(key!==lastDate){
   const heading=document.createElement('h3');
   heading.className='admin-group-heading';
   heading.textContent=titleDate(key);
   root.append(heading);
   lastDate=key;
  }
  root.append(bookingCard(b));
 });
}
function renderOverrides(){
 const root=$('#overrides');
 root.replaceChildren();
 Object.entries(dates).sort().forEach(([date,loc])=>{
  const p=document.createElement('p');
  p.textContent=date+' · '+(loc==='closed'?'Day off':loc);
  const b=document.createElement('button');
  b.type='button';
  b.textContent='Remove';
  b.onclick=()=>{delete dates[date];renderOverrides();};
  p.append(b);
  root.append(p);
 });
}
function renderAll(){renderStats();renderCalendar();renderDay();renderList();}
async function load(quiet=false){
 try{
  const data=await api();
  bookings=Array.isArray(data.bookings)?data.bookings:[];
  dates=data.settings?.dates||{};
  enabled=data.enabled===true;
  testMode=data.testMode===true;
  lastLoaded=new Date();
  $('#login-form').hidden=true;
  $('#dashboard').hidden=false;
  $('#settings-form').elements.open.checked=data.settings?.open===true;
  $('#settings-form').elements.paymentInstructions.value=data.settings?.paymentInstructions||'';
  renderMode(data);
  renderOverrides();
  renderAll();
  if(!quiet)message('');
 }catch(error){
  if(error.status===401){
   $('#login-form').hidden=false;
   $('#dashboard').hidden=true;
   message('Sign in to see appointments and manage your studio.');
  }else message('Could not refresh appointments: '+error.message);
 }
}
$('#login-form').onsubmit=async event=>{
 event.preventDefault();
 const submit=event.submitter;
 submit.disabled=true;
 try{
  await api({action:'login',password:event.target.elements.password.value});
  event.target.reset();
  await load();
 }catch(error){message(error.message);}
 finally{submit.disabled=false;}
};
$('#filter').addEventListener('change',renderList);
$('#booking-search').addEventListener('input',renderList);
$('#refresh').onclick=()=>load();
$('#logout').onclick=async()=>{
 try{await api({action:'logout'});}catch(error){message(error.message);return;}
 bookings=[];
 $('#dashboard').hidden=true;
 $('#login-form').hidden=false;
 message('Signed out.');
};
$('#calendar-prev').onclick=()=>{viewMonth=shiftMonth(viewMonth,-1);renderCalendar();};
$('#calendar-next').onclick=()=>{viewMonth=shiftMonth(viewMonth,1);renderCalendar();};
$('#calendar-today').onclick=()=>{
 selectedDate=dayKey(new Date());
 viewMonth=selectedDate.slice(0,7);
 renderCalendar();
 renderDay();
};
$('#add-override').onclick=()=>{
 const f=$('#settings-form');
 if(!f.elements.overrideDate.value)return;
 dates[f.elements.overrideDate.value]=f.elements.overrideLocation.value;
 renderOverrides();
};
$('#settings-form').onsubmit=async event=>{
 event.preventDefault();
 try{
  await api({action:'settings',open:event.target.elements.open.checked,paymentInstructions:event.target.elements.paymentInstructions.value,dates});
  await load(true);
  message('Booking settings saved successfully.');
 }catch(error){message(error.message);}
};
['block-times','reschedule-times'].forEach(id=>{
 $('#'+id).innerHTML=TIMES.map(time=>'<option value="'+time+'">'+esc(displayTime(time))+'</option>').join('');
});
$('#block-form').onsubmit=async event=>{
 event.preventDefault();
 try{
  await api({...Object.fromEntries(new FormData(event.target)),action:'block'});
  await load(true);
  message('Time blocked. It is unavailable for new bookings.');
 }catch(error){message(error.message);}
};
$('#reschedule-form').onsubmit=async event=>{
 event.preventDefault();
 try{
  await api({...Object.fromEntries(new FormData(event.target)),action:'manage',operation:'reschedule'});
  $('#reschedule-dialog').close();
  await load(true);
  message('Appointment rescheduled. Notify the client of their new date and time.');
 }catch(error){$('#reschedule-error').textContent=error.message;}
};
$('.close-dialog').onclick=()=>$('#reschedule-dialog').close();
await load();