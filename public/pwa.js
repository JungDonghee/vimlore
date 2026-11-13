/* KIRITSU PWA bootstrap: install prompt + landscape gate. Plain JS, no deps. */
(() => {
  'use strict';
  const doc = document;
  const body = doc.body;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (standalone) body.classList.add('pwa-standalone');

  const install = doc.createElement('button');
  install.id = 'pwa-install';
  install.type = 'button';
  install.setAttribute('aria-label', 'Install KIRITSU');
  install.textContent = 'INSTALL KIRITSU';
  body.append(install);

  const gate = doc.createElement('div');
  gate.id = 'pwa-rotate';
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.innerHTML = `
    <div class="pwa-card">
      <div class="pwa-phone" aria-hidden="true"></div>
      <div class="pwa-kicker">KIRITSU // DISPLAY</div>
      <div class="pwa-title">LANDSCAPE REQUIRED</div>
      <p class="pwa-copy">Rotate your phone. The terminal is a landscape console.</p>
      <div class="pwa-actions">
        <button type="button" class="pwa-btn primary" id="pwa-rotate-btn">ENTER FULLSCREEN LANDSCAPE</button>
        <button type="button" class="pwa-btn" id="pwa-rotate-install">INSTALL APP</button>
      </div>
    </div>`;
  body.append(gate);

  const coarse = window.matchMedia('(pointer: coarse)');
  const portrait = window.matchMedia('(orientation: portrait)');
  const touch = () => coarse.matches || (window.navigator.maxTouchPoints || 0) > 0;
  // A tiny, invisible style tick rebuilds the HUD text layer that Chromium's
  // software compositor can double-paint on a fresh landscape frame.
  const repaintHud = () => {
    for (const sel of ['.title-foot', '.title-help', '.bootlog', '.title-credit']) {
      const el = doc.querySelector(sel);
      if (!el) continue;
      const old = el.style.letterSpacing;
      el.style.letterSpacing = '0.051em';
      requestAnimationFrame(() => { el.style.letterSpacing = old; });
    }
  };
  const sync = () => {
    const gated = touch() && portrait.matches;
    body.classList.toggle('pwa-gated', gated);
    if (gated && !gate.contains(doc.activeElement)) {
      requestAnimationFrame(() => {
        if (body.classList.contains('pwa-gated')) doc.getElementById('pwa-rotate-btn')?.focus({ preventScroll: true });
      });
    }
  };
  sync();
  window.addEventListener('load', () => {
    setTimeout(repaintHud, 120);
    setTimeout(repaintHud, 700);
  });
  if (coarse.addEventListener) coarse.addEventListener('change', sync);
  if (portrait.addEventListener) portrait.addEventListener('change', sync);
  window.addEventListener('resize', sync);

  // A page cannot lock orientation outside fullscreen. Try both; if the browser
  // refuses, the gate still asks the player to rotate the device.
  doc.getElementById('pwa-rotate-btn').addEventListener('click', async () => {
    try {
      if (!doc.fullscreenElement && doc.documentElement.requestFullscreen) {
        await doc.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch {}
    try {
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
    } catch {}
    sync();
  });

  let deferred = null;
  const showInstall = () => {
    if (standalone) return;
    install.classList.add('show');
    doc.getElementById('pwa-rotate-install').classList.add('show');
  };
  const hideInstall = () => {
    install.classList.remove('show');
    doc.getElementById('pwa-rotate-install').classList.remove('show');
  };
  const askInstall = async () => {
    if (!deferred) return;
    const prompt = deferred;
    deferred = null;
    try {
      prompt.prompt();
      await prompt.userChoice;
    } catch {}
    hideInstall();
  };
  install.addEventListener('click', askInstall);
  doc.getElementById('pwa-rotate-install').addEventListener('click', askInstall);
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
    showInstall();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    hideInstall();
    body.classList.add('pwa-installed');
  });

  // While gated, do not let game shortcuts fire underneath the dialog.
  window.addEventListener('keydown', (event) => {
    if (!body.classList.contains('pwa-gated')) return;
    // Stop the game underneath. Do not preventDefault on the gate's own buttons:
    // Enter/Space must still produce their native click action.
    event.stopImmediatePropagation();
    if (!gate.contains(event.target)) event.preventDefault();
  }, true);

  // Vite dev must not keep a stale service worker; production Pages is HTTPS.
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local) && !(local && location.port === '5173')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
})();
