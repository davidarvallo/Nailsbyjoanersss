(() => {
  'use strict';
  const root = document.querySelector('.hero-carousel');
  const photos = window.PORTFOLIO_PHOTOS || [];
  if (!root || photos.length < 2) return;
  const stage = root.querySelector('.hero-carousel-stage');
  let active = root.querySelector('.hero-carousel-photo');
  let buffer = document.createElement('img');
  buffer.className = 'hero-carousel-photo';
  buffer.width = 800; buffer.height = 800; buffer.alt = '';
  buffer.setAttribute('aria-hidden', 'true');
  stage.append(buffer);
  const status = document.querySelector('#hero-carousel-status');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 4500;
  const zooms = new WeakMap();
  function zoomOut(image) {
    zooms.get(image)?.cancel();
    if (motion.matches || !image.animate) return;
    zooms.set(image, image.animate(
      [{transform: 'scale(1.065)'}, {transform: 'scale(1)'}],
      {duration: interval, easing: 'ease-out', fill: 'forwards'}
    ));
  }
  const cache = new Map();
  let index = 0, desired = 0, busy = false, timer;
  let inView = true, ready = false;
  const wrap = value => (value + photos.length) % photos.length;

  function updateControls() {
    root.setAttribute('aria-label', `Joane’s nail art and pedicure portfolio, ${photos.length} photos`);
  }
  function stopTimer() { clearTimeout(timer); timer = undefined; }
  function prepare(target) {
    if (cache.has(target)) return cache.get(target);
    const photo = photos[target];
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async'; image.fetchPriority = 'low';
      image.onload = async () => {
        try { if (image.decode) await image.decode(); } catch { /* Loaded image is usable. */ }
        resolve(image);
      };
      image.onerror = () => { cache.delete(target); reject(new Error('Photo could not be loaded.')); };
      image.sizes = '(max-width: 389px) 72vw, (max-width: 760px) 280px, 420px';
      image.srcset = `${photo.base}-400.webp 400w, ${photo.base}-800.webp 800w`;
      image.src = `${photo.base}-800.webp`;
    });
    cache.set(target, promise);
    // Keep only the current photo and its immediate neighbors referenced in memory.
    const nearby = [index, wrap(index + 1), wrap(index - 1), target];
    for (const key of cache.keys()) if (!nearby.includes(key)) cache.delete(key);
    return promise;
  }
  function schedule(delay = interval) {
    stopTimer();
    const zoom = zooms.get(active);
    if (zoom) {
      if (motion.matches || !inView || document.hidden) zoom.pause();
      else zoom.play();
    }
    if (!ready || motion.matches || !inView || document.hidden || busy) return;
    timer = setTimeout(() => { desired = wrap(index + 1); show(); }, delay);
    prepare(wrap(index + 1)).catch(() => {});
  }
  async function show(manual = false) {

    if (busy) return;
    stopTimer(); busy = true;
    let displayedAt;
    while (desired !== index) {
      const target = desired;
      let loaded;
      try { loaded = await prepare(target); }
      catch {
        desired = index;
        status.textContent = 'This photo could not load. Your current photo is still available; try another photo.';
        break;
      }
      if (target !== desired) continue; // Ignore a superseded rapid click.
      const photo = photos[target];
      buffer.setAttribute('fetchpriority', 'low');
      buffer.decoding = 'async';
      buffer.srcset = loaded.srcset;
      buffer.sizes = loaded.sizes;
      buffer.src = loaded.src;
      buffer.alt = photo.alt;
      buffer.setAttribute('aria-hidden', 'false');
      active.setAttribute('aria-hidden', 'true');
      buffer.classList.add('is-visible'); active.classList.remove('is-visible');
      const previous = active; active = buffer; buffer = previous;
      index = target;
      displayedAt = performance.now();
      zoomOut(active);
      if (manual) status.textContent = `Photo ${index + 1} of ${photos.length}: ${photo.alt}`;
      await new Promise(resolve => setTimeout(resolve, motion.matches ? 0 : 900));
    }
    busy = false;
    // Include the crossfade in the 4.5-second photo-to-photo cadence.
    schedule(displayedAt ? Math.max(0, interval - (performance.now() - displayedAt)) : interval);
  }
  function move(direction) { desired = wrap(desired + direction); show(true); }
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  let touch;
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touch = undefined; return; }
    const first = event.touches[0]; touch = {x:first.clientX, y:first.clientY};
  }, {passive:true});
  stage.addEventListener('touchend', event => {
    if (!touch || !event.changedTouches.length) return;
    const last = event.changedTouches[0];
    const dx = last.clientX - touch.x, dy = last.clientY - touch.y; touch = undefined;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
  }, {passive:true});
  stage.addEventListener('touchcancel', () => { touch = undefined; }, {passive:true});
  document.addEventListener('visibilitychange', () => schedule());
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, {threshold:0.1});
    observer.observe(root);
  }
  motion.addEventListener('change', () => {
    if (motion.matches) {
      zooms.get(active)?.cancel(); zooms.get(buffer)?.cancel();
      zooms.delete(active); zooms.delete(buffer);
    }
    else zoomOut(active);
    schedule();
  });
  function start() { if (ready) return; ready = true; updateControls(); zoomOut(active); schedule(); }
  if (active.complete && active.naturalWidth) start();
  else {
    active.addEventListener('load', start, {once:true});
    active.addEventListener('error', () => { ready = true; desired = 1; show(); }, {once:true});
  }
  updateControls();
  window.addEventListener('pagehide', stopTimer);
  window.addEventListener('pageshow', () => schedule());
})();
