(() => {
 const dialog = document.querySelector('#booking-policies');
 const trigger = document.querySelector('#open-booking-policies');
 if (!dialog || !trigger) return;
 let previousOverflow;
 trigger.addEventListener('click', () => {
   previousOverflow = document.body.style.overflow;
   dialog.showModal();
   document.body.style.overflow = 'hidden';
 });
 document.querySelector('#close-booking-policies').addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', event => {
   const rect = dialog.getBoundingClientRect();
   if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
 });
 dialog.addEventListener('close', () => {
   document.body.style.overflow = previousOverflow || '';
   trigger.focus({preventScroll:true});
 });
})();
