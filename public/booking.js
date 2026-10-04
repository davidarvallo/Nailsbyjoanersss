import {SERVICES,TIERS,TIMES,validateSlot,displayTime,durationFor,dateInLA,monthLimit} from './booking-config.js';
const $=s=>document.querySelector(s),form=$('#booking-form');let step=0,chosenTime='',open=false,activeToken='',config={};let slotVersion=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url,options){const r=await fetch(url,options);const data=await r.json();if(!r.ok)throw new Error(data.error||'Please try again.');return data;}
$('#services-options').innerHTML=SERVICES.map((s,i)=>`<label class="choice"><input type="radio" name="service" value="${s.id}" ${i===0?'checked':''}><strong>${s.name}</strong><span>Price quoted by Joane</span></label>`).join('');
$('#tier-options').innerHTML=TIERS.map((t,i)=>`<label class="art-choice"><input type="radio" name="tier" value="${t.id}" ${i===0?'checked':''}><strong>${t.name}</strong><span>${t.price}</span></label>`).join('');
const initial=new URLSearchParams(location.search);if(SERVICES.some(s=>s.id===initial.get('service')))form.elements.service.value=initial.get('service');if(TIERS.some(t=>t.id===initial.get('tier')))form.elements.tier.value=initial.get('tier');
form.elements.date.min=dateInLA();form.elements.date.max=monthLimit();
function values(){return {service:form.elements.service.value,tier:form.elements.tier.value,removal:form.elements.removal.checked,location:form.elements.location.value,date:form.elements.date.value};}
function sync(){
 const v=values();const fill=v.service==='fill',soak=v.service==='soak';$('#fill-check').hidden=!fill;$('#shape-check').hidden=!fill;$('#length-field').hidden=soak;$('#art-field').hidden=soak;$('#removal-check').hidden=soak;
 if(soak){form.elements.tier.value='none';form.elements.removal.checked=false;}
 const data=values();const duration=durationFor(data.service,data.tier,data.removal);const tier=TIERS.find(t=>t.id===data.tier);const deposit=chosenTime==='06:00'?35:20;
 $('#summary').innerHTML=[['Service',SERVICES.find(s=>s.id===data.service).name],['Nail art',tier.id==='none'?'Solid color included':`${tier.name} (${tier.price})`],['Time reserved',`${Math.floor(duration/60)}h ${duration%60||''}${duration%60?'m':''}`],['Location',data.location],['Date',data.date||'To be chosen'],['Time',chosenTime?displayTime(chosenTime):'To be chosen']].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
 $('#deposit-amount').textContent=`$${deposit}`;$('#deposit-note').textContent=deposit===35?'Includes the $15 early appointment fee.':'Applied toward your appointment.';
}
function showStep(n){step=n;document.querySelectorAll('[data-step]').forEach(el=>el.hidden=Number(el.dataset.step)!==step);document.querySelectorAll('[data-step-indicator]').forEach(el=>el.classList.toggle('active',Number(el.dataset.stepIndicator)===step));$('#back').hidden=step===0;$('#next').hidden=step===2;$('#submit-booking').hidden=step!==2;$('#next').textContent=step===0?'Choose a time':'Your details';$('#form-error').textContent='';document.querySelector(`[data-step="${step}"] h2`).setAttribute('tabindex','-1');document.querySelector(`[data-step="${step}"] h2`).focus({preventScroll:true});}
function renderSlots(times){
 times.forEach(time=>{const b=document.createElement('button');b.type='button';b.className='slot';b.textContent=displayTime(time);b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{chosenTime=time;document.querySelectorAll('.slot').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));$('#form-error').textContent='';sync();});$('#slot-options').append(b);});
}
async function loadSlots(){
 chosenTime='';sync();const version=++slotVersion;$('#slot-options').replaceChildren();const v=values();if(!v.date){$('#slot-message').textContent='Choose a date to check availability.';return;}
 if(!open){
  const times=TIMES.filter(time=>{try{validateSlot(v.date,time);return true;}catch{return false;}});
  renderSlots(times);
  $('#slot-message').textContent=times.length?'Standard schedule preview · All times are Pacific. Select a time to explore the form; availability is not verified and no appointment is held.':'No standard online times for this date. Choose Tuesday–Saturday, at least 24 hours ahead and within one month. Text Joane for same-day requests.';
  return;
 }
 $('#slot-message').textContent='Checking availability…';
 try{
  const data=await api(`/api/booking?${new URLSearchParams({...v,action:'availability'})}`);if(version!==slotVersion)return;
  $('#slot-message').textContent=data.slots.length?'Choose a start time. Your request will hold the full appointment duration.':'No online times available for this date and location. Try another date or text Joane.';
  renderSlots(data.slots);
 }catch(error){if(version===slotVersion)$('#slot-message').textContent=error.message;}
}
form.addEventListener('change',e=>{sync();if(['date','location','service','tier','removal'].includes(e.target.name))loadSlots();});
$('#next').addEventListener('click',()=>{const v=values();if(step===0&&v.service==='fill'&&!form.elements.ownWork.checked){$('#form-error').textContent='Fills are for Joane’s sets within 3½ weeks. Select a new set and removal, or text her to discuss.';return;}if(step===1&&!chosenTime){$('#form-error').textContent=open?'Choose an available appointment time first.':'Choose a standard appointment time to continue the preview.';return;}showStep(step+1);});
$('#back').addEventListener('click',()=>showStep(step-1));
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!open||!chosenTime){$('#form-error').textContent='Online booking is not available yet. Please text Joane.';return;}
 const button=$('#submit-booking');button.disabled=true;button.textContent='Sending request…';$('#form-error').textContent='';
 try{
  const body=Object.fromEntries(new FormData(form));['removal','shapeChange','ownWork','acceptPolicies'].forEach(k=>body[k]=form.elements[k].checked);Object.assign(body,{action:'reserve',time:chosenTime});
  const result=await api('/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});activeToken=result.token;history.replaceState(null,'',`/book#${activeToken}`);
  $('#payment-instructions').textContent=result.paymentInstructions;await loadReceipt();
 }catch(error){$('#form-error').textContent=error.message;}finally{button.disabled=false;button.textContent='Send appointment request';}
});
async function loadReceipt(){
 const data=await api(`/api/booking?action=status&token=${encodeURIComponent(activeToken)}`);form.hidden=true;$('.progress').hidden=true;$('#receipt').hidden=false;
 const labels={pending:['AWAITING JOANE’S APPROVAL','Your request is in.','Send your deposit before the hold expires. Joane will review your request and contact you.'],confirmed:['CONFIRMED','See you soon.','Joane has approved your visit and verified your deposit. Contact her directly for changes.'],expired:['HOLD EXPIRED','Your hold has ended.','The unpaid hold has been released. Please request a new time or text Joane.'],declined:['REQUEST DECLINED','Let’s find another time.','Joane couldn’t accept this request. Contact her to discuss another visit.'],canceled:['CANCELED','Your visit was canceled.','If Joane canceled, you can choose a deposit refund or transfer. Contact her to arrange it.']};
 const [status,title,copy]=labels[data.status]||['BOOKING STATUS','Your visit','Contact Joane for details.'];$('#receipt-status').textContent=status;$('#receipt-title').textContent=title;$('#receipt-copy').textContent=copy;
 const date=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',dateStyle:'full',timeStyle:'short'}).format(new Date(data.start));
 $('#receipt-details').innerHTML=`<p><strong>${esc(date)} Pacific</strong></p><p>${esc(data.location)}</p><p>${esc(SERVICES.find(s=>s.id===data.service)?.name||'Nail appointment')}</p><p>Deposit: $${Number(data.deposit)} · Reference ${esc(data.id)}</p>`;
 $('#payment-panel').hidden=data.status!=='pending';$('#expiry-message').textContent=`Hold ends: ${new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',dateStyle:'medium',timeStyle:'short'}).format(new Date(data.expires))} Pacific. Paying alone does not confirm the visit; Joane verifies it.`;
 if(!$('#payment-instructions').textContent)$('#payment-instructions').textContent=config.paymentInstructions||'Text Joane at 909-496-9487 for verified Apple Pay or Zelle instructions.';
 $('#copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);$('#copy-link').textContent='Link copied';}catch{$('#receipt-copy').textContent='Copy the private link from your browser address bar.';}};
}
$('#refresh-status').addEventListener('click',()=>loadReceipt().catch(e=>$('#receipt-copy').textContent=e.message));
sync();
try{config=await api('/api/booking?action=config');open=config.open;form.elements.date.min=config.minDate;form.elements.date.max=config.maxDate;if(!open){$('#setup-message').hidden=false;$('#setup-message').innerHTML='Online booking is being prepared. You can explore the form; no appointment will be held. <a href="sms:+19094969487">Text Joane to request a visit.</a>';$('#submit-booking').disabled=true;}}catch{$('#setup-message').hidden=false;$('#setup-message').textContent='Online booking is unavailable. Text Joane at 909-496-9487.';}
if(form.elements.date.value)await loadSlots();
const fragment=location.hash.slice(1);if(/^[A-Za-z0-9_-]{43}$/.test(fragment)){activeToken=fragment;try{await loadReceipt();}catch(e){$('#setup-message').hidden=false;$('#setup-message').textContent=e.message;}}
