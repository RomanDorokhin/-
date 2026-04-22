window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;
  const U = OMS.utils;

  function showPhase(n) {
    window.dispatchEvent(new CustomEvent('oms:phase-reset', { detail: { nextPhase: n } }));
    document.querySelectorAll('.phase').forEach((p, i) => p.classList.toggle('active', i === n));
    S.currentPhase = n;
  }

  function typeVisitorId() {
    const id = Array.from({ length: 8 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
    const ping = 10 + Math.floor(Math.random() * 200);
    const node = ['EU-WEST', 'US-EAST', 'ASIA-PAC', 'RU-NORTH'][Math.floor(Math.random() * 4)];
    R.visitorId.innerHTML = `VISITOR_ID: ${id}<br>NODE: ${node}<br>PING: ${ping}ms`;
  }

  function positionBtn() {
    const bw = R.escapeBtn.offsetWidth + 40;
    const bh = R.escapeBtn.offsetHeight + 20;
    const gridRect = R.noiseGrid ? R.noiseGrid.getBoundingClientRect() : null;
    const minX = bw / 2;
    const maxX = Math.max(minX, window.innerWidth - bw / 2);
    const minY = bh / 2;
    const maxY = Math.max(minY, window.innerHeight - bh / 2);
    const avoid = gridRect
      ? {
          left: Math.max(minX, gridRect.left - bw / 2 - 24),
          right: Math.min(maxX, gridRect.right + bw / 2 + 24),
          top: Math.max(minY, gridRect.top - bh / 2 - 24),
          bottom: Math.min(maxY, gridRect.bottom + bh / 2 + 24),
        }
      : null;
    let nextX = minX;
    let nextY = minY;
    let placed = false;
    for (let i = 0; i < 24; i++) {
      nextX = minX + Math.random() * Math.max(1, maxX - minX);
      nextY = minY + Math.random() * Math.max(1, maxY - minY);
      if (!avoid || nextX < avoid.left || nextX > avoid.right || nextY < avoid.top || nextY > avoid.bottom) {
        placed = true;
        break;
      }
    }
    if (!placed && avoid) {
      nextX = maxX - 8;
      nextY = Math.min(maxY, avoid.bottom + 40);
    }
    S.btnX = nextX;
    S.btnY = nextY;
    R.escapeBtn.style.left = `${S.btnX - R.escapeBtn.offsetWidth / 2}px`;
    R.escapeBtn.style.top = `${S.btnY - R.escapeBtn.offsetHeight / 2}px`;
  }

  function moveBtnToSafePoint(nextX, nextY) {
    const bw = R.escapeBtn.offsetWidth + 40;
    const bh = R.escapeBtn.offsetHeight + 20;
    const minX = bw / 2;
    const maxX = Math.max(minX, window.innerWidth - bw / 2);
    const minY = bh / 2;
    const maxY = Math.max(minY, window.innerHeight - bh / 2);
    const gridRect = R.noiseGrid ? R.noiseGrid.getBoundingClientRect() : null;
    const clampedX = U.clamp(nextX, minX, maxX);
    const clampedY = U.clamp(nextY, minY, maxY);

    if (
      !gridRect ||
      clampedX < gridRect.left - bw / 2 - 24 ||
      clampedX > gridRect.right + bw / 2 + 24 ||
      clampedY < gridRect.top - bh / 2 - 24 ||
      clampedY > gridRect.bottom + bh / 2 + 24
    ) {
      S.btnX = clampedX;
      S.btnY = clampedY;
    } else {
      const outsideLeft = Math.max(minX, gridRect.left - bw / 2 - 36);
      const outsideRight = Math.min(maxX, gridRect.right + bw / 2 + 36);
      const outsideTop = Math.max(minY, gridRect.top - bh / 2 - 36);
      const outsideBottom = Math.min(maxY, gridRect.bottom + bh / 2 + 36);
      const options = [
        { x: outsideLeft, y: clampedY },
        { x: outsideRight, y: clampedY },
        { x: clampedX, y: outsideTop },
        { x: clampedX, y: outsideBottom },
      ];
      const best = options
        .map((option) => ({
          ...option,
          score: Math.abs(option.x - clampedX) + Math.abs(option.y - clampedY),
        }))
        .sort((a, b) => a.score - b.score)[0];
      S.btnX = best.x;
      S.btnY = best.y;
    }

    R.escapeBtn.style.left = `${S.btnX - R.escapeBtn.offsetWidth / 2}px`;
    R.escapeBtn.style.top = `${S.btnY - R.escapeBtn.offsetHeight / 2}px`;
  }

  function showVisitBadge() {
    const m = Math.floor(OMS.visit.data.totalSeconds / 60).toString().padStart(2, '0');
    const s = (OMS.visit.data.totalSeconds % 60).toString().padStart(2, '0');
    R.visitBadge.innerHTML = `ВИЗИТ #${OMS.visit.data.count}<br>ИТОГО: ${m}:${s}`;
    R.visitBadge.style.opacity = '1';
  }

  function goToPhase2() {
    if (!S.introAccepted) return;
    if (S.exploded) return;
    S.exploded = true;
    if (OMS.secrets) OMS.secrets.unlockSecret('entry_signal', { source: 'phase_transition' });
    try { OMS.audioApi.playExplosionSound(); } catch (e) {}
    try { OMS.effects.triggerExplosion(); } catch (e) {}
    setTimeout(() => {
      showPhase(1);
      R.countdown.style.opacity = '1';
      R.visitorId.style.opacity = '1';
      R.statusLine.style.opacity = '1';
      typeVisitorId();
    }, 600);
    setTimeout(() => {
      showPhase(2);
      R.waveform.style.opacity = '1';
      R.escapeBtn.style.display = 'block';
      OMS.audioApi.showVolumeControl();
      R.globalPresence.style.opacity = '1';
      positionBtn();
      showVisitBadge();
    }, 3500);
  }

  function showBanResultOverlay() {
    const pct = U.getSeenPct();
    S.seenPct = pct;
    R.phase4.innerHTML = `
      <div class="big-text">ACCESS DENIED</div>
      <div class="sub-text">ВЫ ПОПАЛИСЬ НА ЗАПРЕЩЁННОЕ ДЕЙСТВИЕ<br>УРОВЕНЬ ОТСЛЕЖИВАНИЯ: ${pct.toFixed(1)}%</div>
      <div class="progress-bar-wrap">
        <div id="prog-fill" class="progress-fill" style="width:${pct.toFixed(1)}%"></div>
        <div id="prog-label" class="progress-label">${pct.toFixed(1)}%</div>
      </div>
      <button class="return-btn" onclick="resetToPhase1()">ПЕРЕЗАГРУЗИТЬ</button>
      <div id="seen-pct" style="display:none">${pct.toFixed(1)}</div>
    `;
  }

  function persistBanState() {
    try {
      localStorage.setItem(OMS.constants.BAN_REASON_KEY, S.lastBanReason || 'generic');
      localStorage.setItem(
        OMS.constants.PENDING_FORBIDDEN_SECRET_KEY,
        S.pendingForbiddenSecret ? '1' : '0',
      );
    } catch (e) {}
  }

  function clearBanTick() {
    if (S.banTick) {
      clearInterval(S.banTick);
      S.banTick = null;
    }
  }

  function showIdentityScreen(until) {
    const old = document.getElementById('ban-screen');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'ban-screen';
    el.style.cssText = 'position:fixed;inset:0;background:#000;z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;font-family:VT323,monospace;text-align:center;padding:20px;';
    el.innerHTML = `
      <div style="font-size:clamp(36px,8vw,90px);color:#ff0033;text-shadow:0 0 30px #ff0033;letter-spacing:0.05em;animation:glitchText 2s infinite;">ПОДТВЕРЖДЕНИЕ ЛИЧНОСТИ</div>
      <div style="font-size:clamp(13px,2vw,22px);color:rgba(0,255,65,0.5);letter-spacing:0.15em;max-width:500px;line-height:1.6;">
        СИСТЕМА ЗАФИКСИРОВАЛА НАРУШЕНИЕ<br>
        ВВЕДИТЕ ИМЯ ДЛЯ ПРОДОЛЖЕНИЯ
      </div>
      <input id="identity-name" type="text" placeholder="ВВЕДИТЕ ИМЯ" autocomplete="off" style="
        font-family:'VT323',monospace;font-size:clamp(20px,3vw,32px);
        background:#000;border:1px solid rgba(0,255,65,0.4);color:#00ff41;
        padding:10px 20px;letter-spacing:0.2em;outline:none;
        text-transform:uppercase;width:260px;text-align:center;">
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <button id="identity-cam-btn" type="button" style="
          font-family:'VT323',monospace;font-size:clamp(16px,2.5vw,26px);
          background:transparent;border:1px solid rgba(0,255,65,0.4);
          color:#00ff41;padding:10px 24px;cursor:pointer;letter-spacing:0.15em;">
          РАЗРЕШИТЬ КАМЕРУ
        </button>
      </div>
      <div id="identity-error" style="font-size:clamp(11px,1.8vw,16px);color:#ff0033;letter-spacing:0.2em;min-height:20px;"></div>
      <video id="identity-video" autoplay muted playsinline style="display:none;width:180px;height:135px;border:1px solid #00ff41;"></video>
      <div id="ban-countdown" style="font-size:clamp(20px,3vw,32px);color:rgba(0,255,65,0.7);letter-spacing:0.15em;"></div>
    `;
    document.body.appendChild(el);

    const startIdentity = () => {
      const nameEl = document.getElementById('identity-name');
      const errEl = document.getElementById('identity-error');
      const videoEl = document.getElementById('identity-video');
      const name = nameEl ? nameEl.value.trim().toUpperCase() : '';

      if (!name) {
        if (errEl) errEl.textContent = 'ВВЕДИТЕ ИМЯ';
        return;
      }
      try { localStorage.setItem('oms_name', name); } catch (e) {}

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (errEl) errEl.textContent = 'КАМЕРА НЕДОСТУПНА';
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          window._activeStream = stream;
          if (videoEl) {
            videoEl.style.display = 'block';
            videoEl.srcObject = stream;
          }
          if (errEl) errEl.textContent = 'ИДЕНТИФИКАЦИЯ...';
          setTimeout(() => {
            try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
            window._activeStream = null;
            try { localStorage.setItem('oms_identity', '1'); } catch (e) {}
            try { localStorage.removeItem('oms_ban_until'); } catch (e) {}
            clearBanTick();
            const ban = document.getElementById('ban-screen');
            if (ban) ban.remove();
            window.__banned = false;
            showPhase(2);
            if (S.lastBanReason === 'forbidden_button' && S.pendingForbiddenSecret && OMS.secrets) {
              OMS.secrets.unlockSecret('forbidden_button', { source: 'ban_identity_camera' });
            }
            S.pendingForbiddenSecret = false;
            S.lastBanReason = 'generic';
            persistBanState();
            try { localStorage.removeItem('oms_catch'); } catch (e) {}
            S.catchCount = 0;
            if (OMS.secrets) OMS.secrets.recomputeSystems();
            OMS.features.showAccusationMsg(name, 'МЫ ЗНАЕМ КАК ТЫ ВЫГЛЯДИШЬ', '#ff0033');
          }, 2000);
        })
        .catch(() => {
          if (errEl) errEl.textContent = 'НУЖЕН ДОСТУП К КАМЕРЕ';
        });
    };

    const camBtn = document.getElementById('identity-cam-btn');
    const input = document.getElementById('identity-name');
    if (camBtn) camBtn.addEventListener('click', startIdentity);
    if (input) {
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') startIdentity();
      });
    }
  }

  function showBanScreen(until) {
    showPhase(3);
    window.__banned = true;
    showIdentityScreen(until);
    clearBanTick();
    S.banTick = setInterval(() => {
      const left = Math.max(0, until - Date.now());
      const m = Math.floor(left / 60000).toString().padStart(2, '0');
      const s = Math.floor((left % 60000) / 1000).toString().padStart(2, '0');
      const cd = document.getElementById('ban-countdown');
      if (cd) cd.textContent = `БАН: ${m}:${s}`;
      if (left <= 0) {
        clearBanTick();
        try { localStorage.removeItem('oms_ban_until'); } catch (e) {}
        const ban = document.getElementById('ban-screen');
        if (ban) ban.remove();
        window.__banned = false;
        S.pendingForbiddenSecret = false;
        S.lastBanReason = 'generic';
        persistBanState();
        resetToPhase1();
      }
    }, 1000);
  }

  function goToPhase3Gameover(reason = 'generic') {
    OMS.audioApi.playExplosionSound();
    OMS.effects.triggerGlitch(900);
    S.lastBanReason = reason;
    const banDuration = Math.max(1, S.catchCount) * 60 * 1000;
    const banUntil = Date.now() + banDuration;
    try { localStorage.setItem('oms_ban_until', String(banUntil)); } catch (e) {}
    persistBanState();
    setTimeout(() => {
      showPhase(3);
      showBanResultOverlay();
      showBanScreen(banUntil);
    }, 500);
  }

  const catFrames = [
`   /\\_____ /\\
  (  o   o  )
  =( Y  Y )=
   )       (     /|
  (_       _)   / |
    \\ ~~~ /   /  |
     '---'   <   |
              \\  |
               \\_|`,
`   /\\_____ /\\
  (  ^   ^ )
  =( Y  Y )=
   )       (  /|
  (_       _)/  |
    \\ ~~~ / |   |
     '---'  |   |
             \\  |
              \\_|`,
`   /\\_____ /\\
  (  -   - )
  =( Y  Y )=
   )       ( |\\
  (_       _)| \\
    \\ ~~~ / |   \\
     '---'  |    \\
            |    /
            |___/`,
  ];

  function showCatPhase() {
    document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
    R.phaseCat.classList.add('active');
    S.currentPhase = 4;
    R.escapeBtn.style.display = 'none';
    R.catAscii.textContent = catFrames[0];
    S.catFrame = 0;
    if (S.catInterval) clearInterval(S.catInterval);
    S.catInterval = setInterval(() => {
      S.catFrame = (S.catFrame + 1) % catFrames.length;
      R.catAscii.textContent = catFrames[S.catFrame];
    }, 400);
    S.catNextSec = 86400;
    OMS.effects.triggerGlitch(1300);
    OMS.audioApi.playExplosionSound();
    if (OMS.secrets) OMS.secrets.unlockSecret('cat_revelation', { source: 'countdown_zero' });
  }

  function resetFromCat() {
    if (S.catInterval) clearInterval(S.catInterval);
    resetToPhase1();
  }

  function resetToPhase1() {
    S.exploded = false;
    S.currentPhase = 0;
    S.countdownSec = 86399;
    document.querySelectorAll('.noise-cell').forEach(c => c.classList.remove('active', 'flipped'));
    R.countdown.style.opacity = '0';
    R.visitorId.style.opacity = '0';
    R.waveform.style.opacity = '0';
    R.escapeBtn.style.display = 'none';
    R.statusLine.style.opacity = '0';
    R.globalPresence.style.opacity = '0';
    clearBanTick();
    const ban = document.getElementById('ban-screen');
    if (ban) ban.remove();
    S.pendingForbiddenSecret = false;
    S.lastBanReason = 'generic';
    persistBanState();
    showPhase(0);
    S.totalMouseDist = 0;
    OMS.audioApi.playGlitchSound();
  }

  OMS.phases = {
    showPhase,
    typeVisitorId,
    positionBtn,
    moveBtnToSafePoint,
    goToPhase2,
    showBanScreen,
    showBanResultOverlay,
    goToPhase3Gameover,
    showCatPhase,
    resetFromCat,
    resetToPhase1,
  };
})();
