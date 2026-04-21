window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;
  const U = OMS.utils;

  function showPhase(n) {
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
    S.btnX = bw / 2 + Math.random() * Math.max(1, window.innerWidth - bw);
    S.btnY = bh / 2 + Math.random() * Math.max(1, window.innerHeight - bh);
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
    OMS.audioApi.playExplosionSound();
    OMS.effects.triggerExplosion();
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

  function showBanScreen(until) {
    showPhase(3);
    const old = document.getElementById('ban-screen');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'ban-screen';
    el.style.cssText = 'position:fixed;inset:0;background:#000;z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:VT323,monospace;text-align:center;padding:20px;';
    el.innerHTML = `
      <div style="font-size:clamp(36px,8vw,90px);color:#ff0033;text-shadow:0 0 30px #ff0033;letter-spacing:0.05em;">ТЫ ЗАБАНЕН</div>
      <div id="ban-countdown" style="font-size:clamp(28px,6vw,70px);color:#00ff41;letter-spacing:0.2em;"></div>
      <div style="font-size:clamp(11px,2vw,18px);color:rgba(0,255,65,0.35);letter-spacing:0.2em;">ПОДОЖДИ ИЛИ НАЖМИ R</div>
    `;
    document.body.appendChild(el);
    const tick = setInterval(() => {
      const left = Math.max(0, until - Date.now());
      const m = Math.floor(left / 60000).toString().padStart(2, '0');
      const s = Math.floor((left % 60000) / 1000).toString().padStart(2, '0');
      const cd = document.getElementById('ban-countdown');
      if (cd) cd.textContent = `${m}:${s}`;
      if (left <= 0) {
        clearInterval(tick);
        try { localStorage.removeItem('oms_ban_until'); } catch (e) {}
        el.remove();
        resetToPhase1();
      }
    }, 1000);
  }

  function goToPhase3Gameover() {
    OMS.audioApi.playExplosionSound();
    OMS.effects.triggerGlitch(900);
    const banDuration = Math.max(1, S.catchCount) * 60 * 1000;
    const banUntil = Date.now() + banDuration;
    try { localStorage.setItem('oms_ban_until', String(banUntil)); } catch (e) {}
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
    showPhase(0);
    S.totalMouseDist = 0;
    OMS.audioApi.playGlitchSound();
  }

  OMS.phases = {
    showPhase,
    typeVisitorId,
    positionBtn,
    goToPhase2,
    showBanScreen,
    showBanResultOverlay,
    goToPhase3Gameover,
    showCatPhase,
    resetFromCat,
    resetToPhase1,
  };
})();
