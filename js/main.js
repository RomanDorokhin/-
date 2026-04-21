(() => {
  const OMS = window.OMS;
  const refs = OMS.refs;
  const state = OMS.state;
  const visit = OMS.visit;
  const constants = OMS.constants;
  const helpers = OMS.utils;
  const INTRO_STORAGE_KEY = 'oms_intro_seen';

  function updateSessionTick() {
    state.sessionSeconds += 1;
    refs.progressTop.style.width = `${Math.min(state.sessionSeconds / constants.SESSION_LIMIT_SECONDS * 100, 100)}%`;
    refs.sessionTime.innerHTML = `SESSION<br>${helpers.formatSession(state.sessionSeconds)}`;

    if (state.currentPhase >= 1) {
      state.countdownSec -= 1;
      if (state.countdownSec <= 0) {
        state.countdownSec = constants.DAY_SECONDS - 1;
        OMS.effects.triggerGlitch(1800);
        setTimeout(() => OMS.phases.showCatPhase(), 1000);
      }
      refs.countdown.textContent = `СЕАНС ИСТЕКАЕТ: ${helpers.formatTime(state.countdownSec)}`;
    }

    if (state.currentPhase === 2 && state.sessionSeconds === constants.SESSION_LIMIT_SECONDS) {
      OMS.phases.goToPhase3Gameover();
    }
  }

  function updatePresence() {
    if (state.currentPhase < 2) return;
    const drift = Math.floor(Math.random() * 40) - 15;
    if (state.basePresence === undefined) {
      state.basePresence = 1000 + Math.floor(Math.random() * 337);
      state.presenceVal = state.basePresence;
    }
    state.presenceVal = Math.max(800, state.basePresence + Math.floor(state.sessionSeconds * 1.5) + drift);
    refs.presenceCounter.textContent = state.presenceVal.toLocaleString('ru');
  }

  function updateIdle() {
    const idleSeconds = (Date.now() - state.lastActivity) / 1000;
    if (idleSeconds > 15 && state.currentPhase >= 1 && !state.idleShowing) {
      state.idleShowing = true;
      refs.idleMsg.style.opacity = '1';
    } else if (idleSeconds < 2 && state.idleShowing) {
      state.idleShowing = false;
      refs.idleMsg.style.opacity = '0';
    }
  }

  function updateSeenProgress() {
    if (state.currentPhase !== 2) return;
    const idle = (Date.now() - state.lastActivity) / 1000;
    if (idle < 30 && !document.hidden) {
      state.activeSeconds = Math.min(state.activeSeconds + 1, constants.TOTAL_NEEDED_SECONDS);
      try { localStorage.setItem('oms_active', String(state.activeSeconds)); } catch (e) {}
    }
      state.seenPct = helpers.getSeenPct();
  }

  function maybeRandomGridPulse() {
    if (state.currentPhase !== 2) return;
    const cells = refs.noiseGrid.querySelectorAll('.noise-cell');
    if (!cells.length) return;
    const randomCell = Math.floor(Math.random() * constants.GRID_COUNT);
    const cell = cells[randomCell];
    if (cell && !state.activeCells.has(randomCell)) {
      cell.style.background = 'rgba(0,255,65,0.15)';
      setTimeout(() => { cell.style.background = ''; }, 200);
    }
  }

  function maybeStatusPulse() {
    if (state.currentPhase < 1) return;
    const msgs = [
      'СВЯЗЬ УСТАНОВЛЕНА',
      'ВХОДЯЩИЙ СИГНАЛ',
      'ДАННЫЕ ПОЛУЧЕНЫ',
      'АУТЕНТИФИКАЦИЯ',
      'ШИФРОВАНИЕ...',
      'УЗЕЛ НАЙДЕН',
      'УТЕЧКА ПАМЯТИ',
      'АНОМАЛИЯ ОБНАРУЖЕНА',
    ];
    refs.statusLine.textContent = `SYSTEM: ${msgs[Math.floor(Math.random() * msgs.length)]}`;
    refs.statusLine.style.opacity = '1';
    setTimeout(() => { refs.statusLine.style.opacity = '0'; }, 2000);
  }

  function initVisitData() {
    try {
      const saved = localStorage.getItem('oms_v2');
      if (saved) visit.data = JSON.parse(saved);
    } catch (e) {}
    visit.data.count += 1;
    try { localStorage.setItem('oms_v2', JSON.stringify(visit.data)); } catch (e) {}
  }

  function initPersistentState() {
    try {
      state.catchCount = parseInt(localStorage.getItem('oms_catch') || '0', 10);
    } catch (e) {}
    try {
      const savedActive = parseInt(localStorage.getItem('oms_active') || '0', 10);
      state.activeSeconds = Number.isFinite(savedActive) ? savedActive : 0;
      if (state.activeSeconds > 0) state.seenPct = helpers.getSeenPct();
    } catch (e) {}
    try {
      const savedVol = localStorage.getItem('oms_vol');
      if (savedVol !== null) {
        refs.volSlider.value = savedVol;
        state.currentVolume = parseInt(savedVol, 10) / 100;
      }
    } catch (e) {}
    try {
      state.introAccepted = localStorage.getItem(INTRO_STORAGE_KEY) === '1';
    } catch (e) {
      state.introAccepted = false;
    }
  }

  function hideIntroOverlay() {
    if (!refs.introOverlay) return;
    refs.introOverlay.classList.add('hidden');
    refs.introOverlay.setAttribute('aria-hidden', 'true');
  }

  function showIntroOverlay() {
    if (!refs.introOverlay) return;
    refs.introOverlay.classList.remove('hidden');
    refs.introOverlay.setAttribute('aria-hidden', 'false');
  }

  function initIntroFlow() {
    if (!refs.introStartBtn) return;
    if (state.introAccepted) {
      hideIntroOverlay();
    } else {
      showIntroOverlay();
    }
    refs.introStartBtn.addEventListener('click', () => {
      state.introAccepted = true;
      try { localStorage.setItem(INTRO_STORAGE_KEY, '1'); } catch (e) {}
      hideIntroOverlay();
      OMS.effects.triggerGlitch(260);
      OMS.audioApi.playGlitchSound();
      refs.statusLine.textContent = 'СЕАНС РАСКРЫТИЯ СЕКРЕТОВ АКТИВЕН';
      refs.statusLine.style.opacity = '1';
      setTimeout(() => { refs.statusLine.style.opacity = '0'; }, 2200);
      if (OMS.secrets) OMS.secrets.showHint();
    });
  }

  function showVisitBadge() {
    const m = Math.floor(visit.data.totalSeconds / 60).toString().padStart(2, '0');
    const s = (visit.data.totalSeconds % 60).toString().padStart(2, '0');
    refs.visitBadge.innerHTML = `ВИЗИТ #${visit.data.count}<br>ИТОГО: ${m}:${s}`;
    refs.visitBadge.style.opacity = '1';
  }

  function bindGlobalVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(state.rafId);
        if (OMS.audio.ctx && !state.isMuted) {
          try { OMS.audio.ctx.suspend(); } catch (e) {}
        }
      } else {
        state.rafId = requestAnimationFrame(OMS.visuals.renderFrame);
        if (OMS.audio.ctx && !state.isMuted) {
          try { OMS.audio.ctx.resume(); } catch (e) {}
        }
      }
    });
  }

  function bindResize() {
    window.addEventListener('resize', () => {
      OMS.visuals.resizeCanvas();
      if (state.currentPhase === 2) OMS.phases.positionBtn();
    });
  }

  function bindBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      visit.data.totalSeconds += state.sessionSeconds;
      try { localStorage.setItem('oms_v2', JSON.stringify(visit.data)); } catch (e) {}
      if (window._bcChannel) {
        try { window._bcChannel.close(); } catch (e) {}
      }
    });
  }

  function initBroadcastChannel() {
    try {
      const bc = new BroadcastChannel('oms_tabs');
      bc.postMessage({ type: 'join', ts: Date.now() });
      bc.onmessage = (event) => {
        if (event.data.type === 'join' && state.currentPhase >= 1) {
          OMS.effects.triggerGlitch(450);
          refs.statusLine.textContent = 'ОБНАРУЖЕНА ВТОРАЯ ВКЛАДКА. МЫ ВСЁ ВИДИМ.';
          refs.statusLine.style.opacity = '1';
          setTimeout(() => { refs.statusLine.style.opacity = '0'; }, 3600);
        }
      };
      window._bcChannel = bc;
    } catch (e) {}
  }

  function initManifestAndPwa() {
    const manifestData = {
      name: 'ONE MILLION SECONDS',
      short_name: '1M SEC',
      start_url: './',
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#000000',
      icons: [{
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'%3E%3Crect width='192' height='192' fill='%23000'/%3E%3Ctext x='50%25' y='55%25' font-size='80' text-anchor='middle' dominant-baseline='middle' fill='%2300ff41' font-family='monospace'%3E%E2%88%9E%3C/text%3E%3C/svg%3E",
        sizes: '192x192',
        type: 'image/svg+xml',
      }],
    };
    try {
      const blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
      document.getElementById('pwa-manifest').href = URL.createObjectURL(blob);
    } catch (e) {}

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      state.deferredPrompt = event;
      if (state.currentPhase >= 1) {
        setTimeout(() => { refs.pwaBanner.style.display = 'flex'; }, 5000);
      }
    });

    refs.pwaInstallBtn.addEventListener('click', async () => {
      if (!state.deferredPrompt) return;
      state.deferredPrompt.prompt();
      await state.deferredPrompt.userChoice;
      state.deferredPrompt = null;
      refs.pwaBanner.style.display = 'none';
    });
  }

  function initTimers() {
    setInterval(updateSessionTick, 1000);
    setInterval(updatePresence, 4000);
    setInterval(updateIdle, 1000);
    setInterval(updateSeenProgress, 1000);
    setInterval(maybeStatusPulse, 5000);
    setInterval(maybeRandomGridPulse, 300);
  }

  function initBannedState() {
    try {
      const until = parseInt(localStorage.getItem('oms_ban_until') || '0', 10);
      if (until && Date.now() < until) {
        window.__banned = true;
        OMS.phases.showBanScreen(until);
      } else {
        window.__banned = false;
      }
    } catch (e) {
      window.__banned = false;
    }
  }

  function exposePublicApi() {
    window.toggleMute = OMS.audioApi.toggleMute;
    window.resetFromCat = OMS.phases.resetFromCat;
    window.resetToPhase1 = OMS.phases.resetToPhase1;
    window.showCatPhase = OMS.phases.showCatPhase;
    window.openNews = OMS.features.openNews;
    window.tutNext = () => OMS.features.tutNext();
    window.toggleBackpack = OMS.secrets.toggleBackpack;
    OMS.main = { showVisitBadge, toggleSecretConsole };
  }

  function logBanner() {
    console.log('%cWELCOME TO ONE MILLION SECONDS', 'color:#00ff41; font-size:20px; font-family:monospace');
    console.log('%cYOU FOUND THE CONSOLE. YOU CANNOT ESCAPE.', 'color:#ff0033; font-size:12px; font-family:monospace');
    console.log(`%cVISIT #${visit.data.count}`, 'color:#ffaa00; font-size:14px; font-family:monospace');
    console.log(`%cСАУНДСКЕЙП: ${constants.SOUND_NAMES[OMS.audio.soundMode]}`, 'color:#ffaa00; font-size:12px; font-family:monospace');
  }

  function init() {
    initPersistentState();
    initVisitData();
    initIntroFlow();
    initManifestAndPwa();
    initBroadcastChannel();
    bindGlobalVisibilityHandlers();
    bindResize();
    bindBeforeUnload();
    OMS.visuals.initVisualSystems();
    OMS.grid.buildNoiseGrid();
    OMS.features.injectSponsorCell();
    OMS.secrets.init();
    OMS.audioApi.setupAudioUi();
    OMS.events.setupInputHandlers();
    OMS.features.setupPassiveFeatures();
    initTimers();
    initBannedState();
    exposePublicApi();
    logBanner();
    state.rafId = requestAnimationFrame(OMS.visuals.renderFrame);
  }

  function toggleSecretConsole() {
    const existing = document.getElementById('secret-console');
    if (existing) { existing.remove(); return; }
    const el = document.createElement('div');
    el.id = 'secret-console';
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:220px;background:rgba(0,0,0,0.97);border-top:1px solid rgba(0,255,65,0.3);z-index:600;font-family:\"Share Tech Mono\",monospace;font-size:11px;color:#00ff41;padding:10px;overflow-y:auto;letter-spacing:0.1em;';
    let nm = 'UNKNOWN';
    try { nm = localStorage.getItem('oms_name') || 'UNKNOWN'; } catch (e) {}
    el.innerHTML = `
      <div style="color:rgba(0,255,65,0.4);margin-bottom:8px;">┌─ SYSTEM CONSOLE v2.0 ─────────────────────────────┐</div>
      <div>> ИДЕНТИФИКАТОР: ${nm}</div>
      <div>> ВИЗИТОВ: ${OMS.visit.data.count}</div>
      <div>> АКТИВНОЕ ВРЕМЯ: ${Math.floor(state.activeSeconds / 60)} мин ${state.activeSeconds % 60} сек</div>
      <div>> БАН АКТИВЕН: ${window.__banned ? 'ДА' : 'НЕТ'}</div>
      <div>> САУНДСКЕЙП: ${constants.SOUND_NAMES[OMS.audio.soundMode]}</div>
      <div>> РАЗРЕШЕНИЕ: ${window.innerWidth}×${window.innerHeight}</div>
      <div>> КЛИКИ ПО TOKYO: ${state.tokyoClicks}</div>
      <div style="margin-top:8px;color:rgba(0,255,65,0.3);">└─────────────────────────────────────────────────────┘</div>
      <div style="color:rgba(0,255,65,0.2);margin-top:4px;">[ ~ / ё — закрыть ]</div>
    `;
    document.body.appendChild(el);
    OMS.secrets.unlockSecret('console_access', { source: 'hotkey_console' });
  }

  init();
})();
