/* Homepage only. No dependency on booking, portfolio, or third-party scripts. */
(() => {
  'use strict';
  const intro = window.studioIntro;
  const overlay = document.getElementById('studio-intro');
  if (!intro || !document.documentElement.classList.contains('intro-active')) {
    overlay?.remove();
    return;
  }
  const logo = overlay.querySelector('[data-intro-logo]');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finish = () => {
    intro.finish();
    clearTimeout(endTimer);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('pagehide', finish);
    motion.removeEventListener('change', finish);
  };
  // Let keyboard users reach the real page immediately without a focus trap.
  const onKey = event => {
    if (event.key === 'Tab' || event.key === 'Escape') finish();
  };
  const endTimer = setTimeout(finish, Math.max(0, 3200 - (performance.now() - intro.started)));
  document.addEventListener('keydown', onKey);
  window.addEventListener('pagehide', finish, { once: true });
  motion.addEventListener('change', finish);
  overlay.addEventListener('animationend', event => {
    if (event.target === overlay) finish();
  });
  logo.addEventListener('error', finish, { once: true });
  logo.addEventListener('load', () => {
    // Never show a broken or partially decoded mark, or start a late reveal.
    if (performance.now() - intro.started > 1200) { finish(); return; }
    overlay.classList.add('is-ready');
  }, { once: true });
  logo.src = logo.dataset.introLogo;
})();
