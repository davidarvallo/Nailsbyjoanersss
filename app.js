document.querySelectorAll('[data-booking]').forEach(button=>button.addEventListener('click',()=>location.assign('/book')));
document.querySelectorAll('[data-service]').forEach(button=>button.addEventListener('click',()=>{
 const selection=button.dataset.service;
 const targets={'Acrylic sets':'service=acrylic','Fills & refreshes':'service=fill','Soak-offs & extras':'service=soak','Tier 1 nail art':'tier=tier1','Tier 2 nail art':'tier=tier2','Tier 3 nail art':'tier=tier3','Tier 4 nail art':'tier=tier4'};
 location.assign('/book?'+(targets[selection]||''));
}));
const menu = document.querySelector('#menu');
const navigation = document.querySelector('#mobile-nav');
menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!expanded));menu.setAttribute('aria-label',expanded?'Open navigation':'Close navigation');navigation.hidden=expanded;});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{navigation.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}));
document.querySelector('#year').textContent = new Date().getFullYear();
