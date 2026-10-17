(() => {
  'use strict';
  const photos = window.PORTFOLIO_PHOTOS || [];
  const grid = document.querySelector('#work-grid');
  const filters = [...document.querySelectorAll('.work-filter')];
  const load = document.querySelector('#work-load');
  const status = document.querySelector('#work-status');
  const dialog = document.querySelector('#work-lightbox');
  const large = document.querySelector('#work-large');
  const caption = document.querySelector('#work-caption');
  const counter = document.querySelector('#work-counter');
  const pageSize = 12;
  let category = 'all';
  let limit = pageSize;
  let activeIndex = 0;
  let opener;
  let viewing = [];
  const selected = () => photos.filter(photo => category === 'all' || photo.category === category);

  function showPhoto() {
    const photo = viewing[activeIndex];
    large.width = photo.width;
    large.height = photo.height;
    large.alt = photo.alt;
    large.src = `${photo.base}-large.webp`;
    caption.textContent = photo.alt;
    document.querySelector("#work-inspiration").href = `/book?inspiration=${encodeURIComponent(photo.id)}`;
    counter.textContent = `${activeIndex + 1} of ${viewing.length} · ${photo.category === 'nails' ? 'Nails' : 'Pedicures'}`;
  }
  function openPhoto(photo, button) {
    opener = button;
    viewing = selected();
    activeIndex = viewing.findIndex(item => item.id === photo.id);
    showPhoto();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    document.querySelector('#work-close').focus();
  }
  function render() {
    const list = selected();
    grid.replaceChildren();
    list.slice(0, limit).forEach(photo => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'work-card';
      button.dataset.photo = photo.id;
      button.setAttribute('aria-label', `View larger: ${photo.alt}`);
      const img = document.createElement('img');
      img.src = `${photo.base}-400.webp`;
      img.srcset = `${photo.base}-400.webp 400w, ${photo.base}-800.webp 800w`;
      img.sizes = '(max-width: 760px) 43vw, (max-width: 1100px) 28vw, 22vw';
      img.width = 800;
      img.height = 800;
      img.alt = photo.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      button.append(img);
      button.addEventListener('click', () => openPhoto(photo, button));
      grid.append(button);
    });
    load.hidden = limit >= list.length;
    status.textContent = `Showing ${Math.min(limit, list.length)} of ${list.length} ${category === 'all' ? 'photos' : category === 'nails' ? 'nail photos' : 'pedicure photos'}. Select a photo for a closer look.`;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    limit = pageSize;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render();
  }));
  load.addEventListener('click', () => {
    const firstNewIndex = limit;
    limit += pageSize;
    render();
    // The old Load More may now be hidden. Move focus to the first new photo.
    grid.children[firstNewIndex]?.focus();
  });
  function move(direction) {
    activeIndex = (activeIndex + direction + viewing.length) % viewing.length;
    showPhoto();
  }
  document.querySelector('#work-prev').addEventListener('click', () => move(-1));
  document.querySelector('#work-next').addEventListener('click', () => move(1));
  document.querySelector('#work-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  // Native dialog provides Escape dismissal and a keyboard focus trap.
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    large.removeAttribute('src');
    opener?.focus();
  });
  render();
  const requested = photos.find(photo => `#${photo.id}` === window.location.hash);
  if (requested) {
    limit = Math.max(pageSize, photos.indexOf(requested) + 1);
    render();
    const button = grid.querySelector(`[data-photo="${requested.id}"]`);
    openPhoto(requested, button);
  }
})();
