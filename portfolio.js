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
  const pageSize = 11;
  const titles = {
    'nude-white-daisy-art':'Soft florals', 'green-black-halloween-art':'After-dark details',
    'bright-red-colorful-charms':'Color & charms', 'turquoise-pink-flowers':'Turquoise blooms',
    'pink-yellow-toe-art':'A pop of sunshine', 'pink-french-pedicure':'Pink French pedi',
    'neon-green-patterns':'Neon energy', 'orange-yellow-floral-art':'Citrus florals',
    'pink-character-details':'Pink with personality', 'pink-floral-french-art':'French & florals',
    'blue-white-character-art':'Blue statement', 'illustrated-character-set':'Character study',
    'burgundy-black-graphic-art':'Burgundy mood', 'deep-blue-character-art':'Deep-blue details',
    'blue-mixed-design-set':'Something blue', 'peach-floral-mixed-art':'Peachy details',
    'brown-nude-pattern-art':'Nude & bold', 'colorful-floral-accents':'Color in bloom',
    'pink-black-french-details':'A darker French', 'pink-striped-french-art':'Pink, with a twist',
    'pastel-flower-charms':'Pastel petals', 'multicolor-floral-set':'Full bloom'
  };
  let previousOverflow = '';
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
    document.querySelector('#work-image-status').hidden = true;
    large.src = `${photo.base}-large.webp`;
    caption.textContent = photo.alt;
    document.querySelector("#work-inspiration").href = `/book?inspiration=${encodeURIComponent(photo.id)}`;
    counter.textContent = `${activeIndex + 1} of ${viewing.length} · ${photo.category === 'nails' ? 'Nails' : 'Pedicures'}`;
  }
  function openPhoto(photo, button, list = selected()) {
    opener = button;
    viewing = list;
    activeIndex = viewing.findIndex(item => item.id === photo.id);
    showPhoto();
    dialog.showModal();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.querySelector('#work-close').focus();
  }
  function render() {
    const list = selected();
    grid.replaceChildren();
    list.slice(0, limit).forEach((photo, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'work-card';
      const featured = category === 'all' && index % pageSize === 0;
      if (featured) button.classList.add('is-featured');
      button.dataset.photo = photo.id;
      button.setAttribute('aria-label', `View larger: ${photo.alt}`);
      const img = document.createElement('img');
      img.src = `${photo.base}-400.webp`;
      img.srcset = `${photo.base}-400.webp 400w, ${photo.base}-800.webp 800w`;
      img.sizes = '(max-width: 760px) 44vw, (max-width: 1400px) 28vw, 400px';
      img.width = 800;
      img.height = 800;
      img.alt = photo.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      const picture = document.createElement('span');
      picture.className = 'lookbook-card-image';
      picture.append(img);
      const details = document.createElement('span');
      details.className = 'lookbook-card-caption';
      const text = document.createElement('span');
      const categoryLabel = document.createElement('small');
      categoryLabel.textContent = photo.category === 'nails' ? 'NAIL ART' : 'PEDICURE';
      const title = document.createElement('strong');
      title.textContent = titles[photo.id] || 'Made by Joane';
      text.append(categoryLabel, title);
      if (featured) {
        const note = document.createElement('span');
        note.className = 'lookbook-feature-copy';
        note.textContent = 'A little inspiration for your next visit. Tap in for the details.';
        text.append(note);
      }
      const arrow = document.createElement('span');
      arrow.className = 'lookbook-card-arrow';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      details.append(text, arrow);
      button.append(picture, details);
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
    document.body.style.overflow = previousOverflow;
    large.removeAttribute('src');
    opener?.focus();
  });
  document.querySelectorAll('[data-filter-count]').forEach(label => {
    const filter = label.dataset.filterCount;
    label.textContent = photos.filter(photo => filter === 'all' || photo.category === filter).length;
  });
  document.querySelectorAll('[data-featured-photo]').forEach(button => {
    const photo = photos.find(item => item.id === button.dataset.featuredPhoto);
    if (photo) button.addEventListener('click', () => openPhoto(photo, button, photos));
  });
  const imageStatus = document.querySelector('#work-image-status');
  large.addEventListener('load', () => { imageStatus.hidden = true; });
  large.addEventListener('error', () => { imageStatus.hidden = false; });
  render();
  function openRequestedPhoto() {
    const requested = photos.find(photo => `#${photo.id}` === window.location.hash);
    if (!requested) return;
    category = 'all';
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === 'all')));
    limit = Math.max(pageSize, photos.indexOf(requested) + 1);
    render();
    const button = grid.querySelector(`[data-photo="${requested.id}"]`);
    if (dialog.open) {
      opener = button;
      viewing = photos;
      activeIndex = photos.indexOf(requested);
      showPhoto();
    } else openPhoto(requested, button);
  }
  window.addEventListener('hashchange', openRequestedPhoto);
  openRequestedPhoto();
})();
