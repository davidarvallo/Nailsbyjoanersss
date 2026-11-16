// Small, accessible navigation enhancements for Joane's private dashboard.
const nav=document.querySelector('.studio-quick-nav');
if(nav){
 const links=Array.from(nav.querySelectorAll('a[href^="#"]'));
 function activate(link){
  links.forEach(item=>{
   const selected=item===link;
   item.classList.toggle('is-active',selected);
   if(selected)item.setAttribute('aria-current','location');
   else item.removeAttribute('aria-current');
  });
 }
 links.forEach(link=>link.addEventListener('click',()=>{
  const id=link.getAttribute('href').slice(1);
  const target=document.getElementById(id);
  if(target?.tagName==='DETAILS')target.open=true;
  activate(link);
 }));
 activate(links[0]);
}
