const dialog = document.querySelector('#info-dialog');
const title = document.querySelector('#dialog-title');
const copy = document.querySelector('#dialog-copy');
document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click', () => {
  title.textContent = button.dataset.service || 'Booking is coming soon.';
  copy.textContent = button.dataset.service ? 'Service-specific links are coming soon. Use Request an appointment to browse available services in Setmore, or text Joane with a question. No appointment has been reserved.' : 'This is a preview of the new website. Online booking and payment links will be connected after the design is approved. No appointment has been reserved.';
  dialog.showModal();
}));
document.querySelectorAll('.close-dialog,.close-secondary').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', e => { if(e.target === dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close();} });
const menu = document.querySelector('#menu');
const navigation = document.querySelector('#mobile-nav');
menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!expanded));menu.setAttribute('aria-label',expanded?'Open navigation':'Close navigation');navigation.hidden=expanded;});
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{navigation.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}));
document.querySelector('#year').textContent = new Date().getFullYear();
