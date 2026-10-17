(() => {
  'use strict';
  const menu = document.querySelector('.services-nav');
  if (menu) {
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
    document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
    menu.addEventListener('keydown', event => {
      if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
    });
  }
  // Calendar-only promotion visibility; appointment rules remain in booking-config.js.
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p => [p.type,p.value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  if (today < '2026-10-01' || today > '2026-11-30') {
    document.querySelectorAll('#fall-deals,[data-seasonal-link]').forEach(el => { el.hidden = true; });
  }
  const requested = new URLSearchParams(location.search).get('inspiration');
  const photo = (window.PORTFOLIO_PHOTOS || []).find(item => item.id === requested);
  const selected = document.querySelector('#selected-inspiration');
  if (photo && selected) {
    const image = document.querySelector('#selected-inspiration-image');
    image.src = `${photo.base}-400.webp`;
    image.alt = photo.alt;
    document.querySelector('#selected-inspiration-title').textContent = photo.alt;
    selected.hidden = false;
  }
  const input = document.querySelector('#inspiration-files');
  if (!input) return;
  const previews = document.querySelector('#inspiration-previews');
  const status = document.querySelector('#inspiration-status');
  let files = [];
  function clear() {
    files.forEach(item => URL.revokeObjectURL(item.url));
    files = [];
    previews.replaceChildren();
  }
  function render() {
    previews.replaceChildren();
    status.textContent = files.length ? `${files.length} photo${files.length === 1 ? '' : 's'} selected for this preview. Nothing will be sent.` : 'No photos selected.';
    files.forEach((item, index) => {
      const figure = document.createElement('figure');
      figure.className = 'inspiration-preview';
      const image = document.createElement('img');
      image.src = item.url; image.alt = `Your inspiration photo ${index + 1}`; image.width = 160; image.height = 160;
      image.addEventListener('error', () => { status.textContent = 'One photo could not be displayed. Remove it and choose a JPG, PNG, or WebP image.'; });
      const name = document.createElement('figcaption'); name.textContent = item.file.name;
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'inspiration-remove'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove ${item.file.name}`);
      remove.addEventListener('click', () => {
        URL.revokeObjectURL(item.url); files = files.filter(file => file !== item); render(); input.value = ''; input.focus();
      });
      figure.append(image, name, remove); previews.append(figure);
    });
  }
  input.addEventListener('change', () => {
    clear();
    const chosen = [...input.files];
    if (chosen.length > 3) { status.textContent = 'Choose up to 3 inspiration photos.'; input.value = ''; return; }
    if (chosen.some(file => !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      status.textContent = 'Choose JPG, PNG, or WebP photos up to 10 MB each.'; input.value = ''; return;
    }
    files = chosen.map(file => ({file, url:URL.createObjectURL(file)}));
    render();
  });
  window.addEventListener('pagehide', clear);
})();
