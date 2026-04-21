function showPhase(n) {
  const OMS = window.OMS;
  document.querySelectorAll('.phase').forEach((p, i) => p.classList.toggle('active', i === n));
  OMS.state.currentPhase = n;
}

function formatTime(s) { return window.OMS.helpers.formatTime(s); }
function formatSession(s) { return window.OMS.helpers.formatSession(s); }

function typeVisitorId() {
  const OMS = window.OMS;
  const el = document.getElementById('visitor-id');
  const id = Array.from({ length: 8 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');
  const ping = 10 + Math.floor(Math.random() * 200);
  const node = ['EU-WEST', 'US-EAST', 'ASIA-PAC', 'RU-NORTH'][Math.floor(Math.random() * 4)];
  el.innerHTML = `VISITOR_ID: ${id}<br>NODE: ${node}<br>PING: ${ping}ms`;
  if (OMS && OMS.state && OMS.state.currentPhase >= 1) {
    const sl = OMS.refs.statusLine;
    if (sl) {
      sl.textContent = 'SYSTEM: VISITOR VERIFIED';
      sl.style.opacity = '1';
      setTimeout(() => { sl.style.opacity = '0'; }, 1800);
    }
  }
}

function positionBtn() {
  const OMS = window.OMS;
  const app = OMS.state;
  const escBtn = document.getElementById('escape-btn');
  const bw = escBtn.offsetWidth + 40;
  const bh = escBtn.offsetHeight + 20;
  app.btnX = bw / 2 + Math.random() * Math.max(1, window.innerWidth - bw);
  app.btnY = bh / 2 + Math.random() * Math.max(1, window.innerHeight - bh);
  escBtn.style.left = `${app.btnX - escBtn.offsetWidth / 2}px`;
  escBtn.style.top = `${app.btnY - escBtn.offsetHeight / 2}px`;
}

function goToPhase2() {
  const OMS = window.OMS;
  const app = OMS.state;
  if (app.exploded) return;
  app.exploded = true;
  playExplosionSound();
  triggerExplosion();
  setTimeout(() => {
    showPhase(1);
    document.getElementById('countdown').style.opacity = '1';
    document.getElementById('visitor-id').style.opacity = '1';
    document.getElementById('status-line').style.opacity = '1';
    typeVisitorId();
  }, 600);
  setTimeout(() => {
    showPhase(2);
    document.getElementById('waveform').style.opacity = '1';
    document.getElementById('escape-btn').style.display = 'block';
    document.getElementById('vol-wrap').style.opacity = '0.4';
    document.getElementById('global-presence').style.opacity = '1';
    positionBtn();
    if (typeof showVisitBadge === 'function') showVisitBadge();
  }, 3500);
}

function showBanScreen(until) {
  const OMS = window.OMS;
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
      if (typeof resetToPhase1 === 'function') resetToPhase1();
    }
  }, 1000);
}

function showBanResultOverlay() {
  const OMS = window.OMS;
  const app = OMS.state;
  const pct = OMS.helpers.getSeenPct();
  app.seenPct = pct;
  const phase = document.getElementById('phase4');
  phase.innerHTML = `
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

function goToPhase3_gameover() {
  const OMS = window.OMS;
  const app = OMS.state;
  playExplosionSound();
  triggerGlitch(900);
  const banDuration = Math.max(1, app.catchCount) * 60 * 1000;
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
  const OMS = window.OMS;
  const app = OMS.state;
  document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
  document.getElementById('phase-cat').classList.add('active');
  app.currentPhase = 4;
  document.getElementById('escape-btn').style.display = 'none';
  const catEl = document.getElementById('cat-ascii');
  catEl.textContent = catFrames[0];
  app.catFrame = 0;
  if (app.catInterval) clearInterval(app.catInterval);
  app.catInterval = setInterval(() => {
    app.catFrame = (app.catFrame + 1) % catFrames.length;
    catEl.textContent = catFrames[app.catFrame];
  }, 400);
  app.catNextSec = 86400;
  triggerGlitch(1300);
  playExplosionSound();
}

function resetFromCat() {
  const OMS = window.OMS;
  const app = OMS.state;
  if (app.catInterval) clearInterval(app.catInterval);
  resetToPhase1();
}

function resetToPhase1() {
  const OMS = window.OMS;
  const app = OMS.state;
  app.exploded = false;
  app.currentPhase = 0;
  app.countdownSec = 86399;
  document.querySelectorAll('.noise-cell').forEach(c => c.classList.remove('active', 'flipped'));
  document.getElementById('countdown').style.opacity = '0';
  document.getElementById('visitor-id').style.opacity = '0';
  document.getElementById('waveform').style.opacity = '0';
  document.getElementById('escape-btn').style.display = 'none';
  document.getElementById('status-line').style.opacity = '0';
  document.getElementById('global-presence').style.opacity = '0';
  showPhase(0);
  app.totalMouseDist = 0;
  playGlitchSound();
}
