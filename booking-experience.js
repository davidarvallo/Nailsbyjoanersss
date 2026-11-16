// Progressive visual enhancements only. The reservation rules and API remain in booking.js.
import './booking.js';

const form=document.querySelector('#booking-form');
const $=selector=>document.querySelector(selector);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
if(form){
 const intro=$('.booking-lead');
 if(intro){
  const facts=document.createElement('div');
  facts.className='booking-intro-facts';
  ['San Bernardino studio','Three easy steps','No charge until you pay Joane'].forEach(copy=>{
   const item=document.createElement('span');item.textContent=copy;facts.append(item);
  });
  intro.after(facts);
 }
 const steps=[
  ['STEP 01 OF 03 · YOUR SERVICE','Select one service, then personalize your nail art and add-ons.'],
  ['STEP 02 OF 03 · YOUR APPOINTMENT','Pick a date and choose an available start time in San Bernardino.'],
  ['STEP 03 OF 03 · FINAL DETAILS','Share your contact information, review the policies, and send your request.']
 ];
 document.querySelectorAll('.form-step[data-step]').forEach(section=>{
  const index=Number(section.dataset.step),heading=section.querySelector('h2'),info=steps[index];
  if(!heading||!info)return;
  const kicker=document.createElement('p');kicker.className='step-kicker';kicker.textContent=info[0];
  const description=document.createElement('p');description.className='step-description';description.textContent=info[1];
  heading.before(kicker);heading.after(description);
 });
 const serviceRoot=$('#services-options');
 if(serviceRoot){
  const groups=Array.from(serviceRoot.querySelectorAll('.service-choice-group'));
  const selected=form.querySelector('input[name="service"]:checked');
  const accordions=[];
  groups.forEach((group,index)=>{
   const label=group.querySelector('legend')?.textContent?.trim()||'Services';
   const count=group.querySelectorAll('input[name="service"]').length;
   const accordion=document.createElement('details');
   accordion.className='service-accordion';
   accordion.open=selected?group.contains(selected):index===0;
   const summary=document.createElement('summary');
   const name=document.createElement('span');name.textContent=label;
   const meta=document.createElement('span');
   meta.className='service-count';
   meta.append(document.createTextNode(count+' '+(count===1?'option':'options')+'  '));
   const arrow=document.createElement('span');
   arrow.className='service-chevron';
   arrow.setAttribute('aria-hidden','true');
   arrow.textContent='⌄';
   meta.append(arrow);
   summary.append(name,meta);
   group.replaceWith(accordion);
   accordion.append(summary,group);
   accordions.push(accordion);
  });
  accordions.forEach(accordion=>accordion.addEventListener('toggle',()=>{
   if(!accordion.open)return;
   accordions.forEach(other=>{if(other!==accordion)other.open=false;});
  }));
 }
 const existingRules=$('.booking-rules');
 if(existingRules){
  const wrapper=document.createElement('details');
  wrapper.className='booking-note-details';
  const summary=document.createElement('summary');
  summary.textContent='Before you book: fill, foreign work and removal rules  +';
  existingRules.replaceWith(wrapper);wrapper.append(summary,existingRules);
 }
 const progress=$('.progress');
 if(progress){
  const indicators=Array.from(progress.querySelectorAll('[data-step-indicator]'));
  indicators.forEach((item,index)=>{
   const label=item.querySelector('span');
   const text=label?.textContent?.trim()||'Step';
   const marker=document.createElement('strong');
   marker.className='step-index';
   marker.textContent=String(index+1).padStart(2,'0');
   const name=document.createElement('span');
   name.className='step-label';
   name.textContent=text;
   item.replaceChildren(marker,name);
  });
  let lastStep=-1;
  const syncProgress=()=>{
   const current=Number(progress.querySelector('li.active')?.dataset.stepIndicator??0);
   if(current===lastStep)return;
   lastStep=current;
   indicators.forEach(item=>{
    const index=Number(item.dataset.stepIndicator);
    item.classList.toggle('complete',index<current);
    if(index===current)item.setAttribute('aria-current','step');
    else item.removeAttribute('aria-current');
   });
  };
  syncProgress();
  const observer=new MutationObserver(syncProgress);
  observer.observe(progress,{attributes:true,subtree:true,attributeFilter:['class']});
  ['#next','#back'].forEach(selector=>{
   $(selector)?.addEventListener('click',()=>{
    window.setTimeout(()=>{
     const box=progress.getBoundingClientRect();
     if(box.top<0||box.top>window.innerHeight*.6){
      progress.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});
     }
    },0);
   });
  });
 }
}
