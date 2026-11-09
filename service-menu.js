import { ADDITIONAL_SERVICES } from './booking-config.js';
const root=document.querySelector('#bookable-service-menu');
if(root){
  const groups=['Acrylic Sets','Fills','Manicures & Overlays'];
  for(const group of groups){
    const items=ADDITIONAL_SERVICES.filter(item=>item.menuGroup===group);
    const section=document.createElement('section');
    section.className='new-service-group';
    const title=document.createElement('h4');
    title.textContent=group;
    section.append(title);
    const list=document.createElement('div');
    list.className='new-service-list';
    for(const service of items){
      const a=document.createElement('a');
      a.className='new-service-row';
      a.href='/book?service='+encodeURIComponent(service.id);
      const name=document.createElement('span');
      name.className='new-service-name';
      name.textContent=service.name;
      const cost=document.createElement('span');
      cost.className='new-service-cost';
      cost.textContent=service.price===null?'Price on request':'$'+service.price;
      const duration=document.createElement('small');
      duration.textContent=service.estimate?'Time estimate: 2 hr':'2 hr';
      const call=document.createElement('span');
      call.className='new-service-book';
      call.textContent='Book ↗';
      const info=document.createElement('span');
      info.className='new-service-info';
      info.append(cost,duration);
      a.append(name,info,call);
      list.append(a);
    }
    section.append(list);
    root.append(section);
  }
}
