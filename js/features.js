window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;
  const sponsorTrail = [];
  const MAX_SPONSOR_TRAIL = 20;
  const casinoAds = [
    { name: 'КАЗИНО', text: 'ВЫИГРАЙ МИЛЛИОН! 100% БОНУС! ТЫ СЛЕДУЮЩИЙ ПОБЕДИТЕЛЬ!', color: '#ff0' },
    { name: 'КАЗИНО', text: 'ДЖЕКПОТ $1,000,000! РЕГИСТРИРУЙСЯ СЕЙЧАС! ТОЛЬКО СЕГОДНЯ!', color: '#f80' },
    { name: 'КАЗИНО', text: 'БЕСПЛАТНЫЕ СПИНЫ! ИГРАЙ БЕСПЛАТНО! ВЫВОДИ ДЕНЬГИ!', color: '#0ff' },
    { name: 'КАЗИНО', text: 'VIP СТАТУС СРАЗУ! БЕЗ ДЕПОЗИТА! БОНУС 500%!', color: '#ff4' },
    { name: 'КАЗИНО', text: 'СОРВИ КУШ! СЛОТЫ 24/7! МГНОВЕННЫЙ ВЫВОД!', color: '#f0f' },
  ];
  const slotSymbols = ['🍒', '7️⃣', '💎', '⭐', '🔔', '🍋', '💰', '🎰', '👑', '🃏'];

  function clearQuestCellMark(cell) {
    if (!cell) return;
    const mark = cell.querySelector('.quest-target');
    if (mark) mark.remove();
  }

function clearQuestMarks(cells = document.querySelectorAll('.noise-cell')) {
  cells.forEach((cell) => clearQuestCellMark(cell));
}

  function clearSponsorClickBindings(cell) {
    if (!cell) return;
    if (cell._sponsorClickHandler) {
      cell.removeEventListener('click', cell._sponsorClickHandler);
      cell._sponsorClickHandler = null;
    }
    if (cell._sponsorTapState) {
      cell._sponsorTapState.lastTap = 0;
    }
  }

  function bindSponsorDoubleClick(cell) {
    if (!cell) return;
    if (!cell._sponsorTapState) cell._sponsorTapState = { lastTap: 0 };
    if (cell._sponsorClickHandler) return;
    const handler = () => {
      const now = Date.now();
      const state = cell._sponsorTapState;
      if (now - state.lastTap < 420) showCasinoAd();
      state.lastTap = now;
    };
    cell._sponsorClickHandler = handler;
    cell.addEventListener('click', handler);
  }

  function clearSponsorQuestUi() {
    clearSponsorQuestWarning();
    const panel = document.getElementById('sponsor-quest-panel');
    if (panel) panel.remove();
    document.body.classList.remove('snake-mode');
  }

  function restoreCellLabel(cell) {
    if (!cell) return;
    const lbl = cell.querySelector('.cell-label');
    if (lbl) lbl.textContent = cell.dataset.loc || '';
  }

  function clearSponsorTrail() {
    while (sponsorTrail.length) {
      const trail = sponsorTrail.pop();
      if (trail && trail.el && trail.el.parentNode) trail.el.parentNode.removeChild(trail.el);
    }
  }

  function getSnakeBrightness(score = S.sponsorQuest.score) {
    const ratio = Math.max(0, Math.min(1, score / S.sponsorQuest.targetScore));
    return 110 + Math.round(ratio * 145);
  }

  function applySnakeCellVisual(cell, tone, isHead) {
    if (!cell) return;
    const front = cell.querySelector('.cell-front');
    if (!front) return;
    const glow = isHead ? 0.95 : 0.72;
    const bgAlpha = isHead ? 0.34 : 0.22;
    const borderAlpha = isHead ? 0.98 : 0.82;
    front.style.borderColor = `rgba(${tone}, ${tone}, ${tone}, ${borderAlpha})`;
    front.style.background = `rgba(${tone}, ${tone}, ${tone}, ${bgAlpha})`;
    front.style.boxShadow = isHead
      ? `0 0 22px rgba(${tone}, ${tone}, ${tone}, ${glow}), inset 0 0 28px rgba(255,255,255,0.28)`
      : `0 0 12px rgba(${tone}, ${tone}, ${tone}, 0.34), inset 0 0 18px rgba(${tone}, ${tone}, ${tone}, 0.16)`;
  }

  function clearSnakeCellVisual(cell) {
    if (!cell) return;
    const front = cell.querySelector('.cell-front');
    if (!front) return;
    front.style.borderColor = '';
    front.style.background = '';
    front.style.boxShadow = '';
  }

  function setSnakeStatus(text, holdMs = 1200) {
    if (!R.statusLine || S.currentPhase < 1) return;
    R.statusLine.textContent = text;
    R.statusLine.style.opacity = '1';
    clearTimeout(S.sponsorQuest.statusTimer);
    S.sponsorQuest.statusTimer = setTimeout(() => {
      R.statusLine.style.opacity = '0';
    }, holdMs);
  }

  function canQueueSnakeTurn(nextX, nextY) {
    if (nextX === 0 && nextY === 0) return false;
    if (!S.sponsorQuest.ready) return true;
    const bodyLen = S.sponsorQuest.snakeTail.length;
    if (bodyLen <= 1) return true;
    return !(
      nextX === -S.sponsorQuest.directionX &&
      nextY === -S.sponsorQuest.directionY
    );
  }

  function clearSponsorQuestWarning() {
    const warning = document.getElementById('sponsor-quest-warning');
    if (warning) warning.remove();
  }

  function stopSponsorQuestLoop() {
    if (S.sponsorQuest.tickTimer) {
      clearInterval(S.sponsorQuest.tickTimer);
      S.sponsorQuest.tickTimer = null;
    }
  }

  function startSponsorQuestLoop() {
    if (!S.sponsorQuest.active || !S.sponsorQuest.ready || S.sponsorQuest.paused) return;
    if (S.sponsorQuest.tickTimer) return;
    S.sponsorQuest.tickTimer = setInterval(() => {
      tickSnake();
    }, S.sponsorQuest.speedMs || 300);
  }

  function handleSponsorQuestOverlayKey(event) {
    if (!S.sponsorQuest.active || S.sponsorQuest.ready) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const ignored = new Set([
      'Shift',
      'Control',
      'Alt',
      'Meta',
      'CapsLock',
      'Tab',
      'Escape',
    ]);
    if (ignored.has(event.key)) return;
    event.preventDefault();
    beginSponsorQuestPlay();
  }

  function beginSponsorQuestPlay() {
    if (!S.sponsorQuest.active || S.sponsorQuest.ready) return;
    clearSponsorQuestWarning();
    stopSponsorQuestLoop();
    S.sponsorQuest.ready = true;
    S.sponsorQuest.paused = false;
    OMS.audioApi.startSnakeMode();
    startSponsorQuestLoop();
    OMS.audioApi.playSnakeTurnCue();
    setSnakeStatus('РЕЖИМ ЗАПУЩЕН // ИЩИ ДОБЫЧУ', 1800);
  }

  function pauseSponsorQuest() {
    if (!S.sponsorQuest.active || !S.sponsorQuest.ready || S.sponsorQuest.paused) return;
    S.sponsorQuest.paused = true;
    stopSponsorQuestLoop();
  }

  function resumeSponsorQuest() {
    if (!S.sponsorQuest.active || !S.sponsorQuest.ready || !S.sponsorQuest.paused) return;
    if (document.hidden || S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    S.sponsorQuest.paused = false;
    startSponsorQuestLoop();
  }

  function buildSnakeFailureMessage(prefix) {
    const collected = S.sponsorQuest.score;
    const remaining = Math.max(0, S.sponsorQuest.targetScore - collected);
    return `${prefix} // СОБРАНО ${collected}/${S.sponsorQuest.targetScore} // ОСТАЛОСЬ ${remaining}`;
  }

  function finalizeSponsorSecret() {
    const cells = document.querySelectorAll('.noise-cell');
    cells.forEach((cell) => {
      cell.classList.add('snake-complete');
    });
    OMS.audioApi.playSnakeSuccess();
    setSnakeStatus('ВЫ РАСКРЫЛИ СЕКРЕТ. УРА.', 2400);
    clearTimeout(S.sponsorQuest.completeTimer);
    S.sponsorQuest.completeTimer = setTimeout(() => {
      resetSponsorQuest('СЕКРЕТ РАСКРЫТ: ЗМЕЙКА ДОБАВЛЕНА В КОЛЛЕКЦИЮ');
      cells.forEach((cell) => cell.classList.remove('snake-complete'));
      if (OMS.secrets) OMS.secrets.unlockSecret('sponsor_snake', { source: 'sponsor_snake_quest' });
    }, 2200);
  }

  function ensureSponsorQuestUi() {
    let panel = document.getElementById('sponsor-quest-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'sponsor-quest-panel';
    panel.style.cssText = `
      position:fixed;right:20px;bottom:90px;z-index:220;
      border:1px solid rgba(255,170,0,0.55);background:rgba(0,0,0,0.88);
      box-shadow:0 0 16px rgba(255,170,0,0.18);padding:8px 10px;
      min-width:220px;font-family:'Share Tech Mono',monospace;
      color:rgba(255,170,0,0.95);letter-spacing:0.08em;
    `;
    panel.innerHTML = `
      <div style="font-size:10px;opacity:0.9;">СЕКРЕТНЫЙ РЕЖИМ: ЗМЕЙКА</div>
      <div id="sponsor-quest-score" style="font-size:12px;margin-top:4px;">ОЧКИ: 0 / 100</div>
      <button id="sponsor-quest-exit" type="button" style="
        margin-top:8px;font-family:'VT323',monospace;font-size:16px;
        background:#ff0033;color:#fff;border:none;padding:4px 10px;cursor:pointer;letter-spacing:0.15em;">
        ВЫЙТИ ИЗ РЕЖИМА
      </button>
    `;
    document.body.appendChild(panel);
    const exitBtn = document.getElementById('sponsor-quest-exit');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        resetSponsorQuest('РЕЖИМ ЗМЕЙКИ ЗАКРЫТ');
      });
    }
    return panel;
  }

  function updateSponsorQuestUi() {
    if (!S.sponsorQuest.active) {
      clearSponsorQuestUi();
      return;
    }
    ensureSponsorQuestUi();
    const scoreEl = document.getElementById('sponsor-quest-score');
    if (scoreEl) {
      scoreEl.textContent = `ДОБЫЧА: ${S.sponsorQuest.score} / ${S.sponsorQuest.targetScore} // ДЛИНА: ${S.sponsorQuest.snakeTail.length}`;
    }
  }

  function paintQuestTarget(cells) {
    if (!S.sponsorQuest.active) return;
  clearQuestMarks(cells);
    const idx = S.sponsorQuest.objective.y * 10 + S.sponsorQuest.objective.x;
    const cell = cells[idx];
    if (!cell) return;
    const marker = document.createElement('div');
    marker.className = 'quest-target';
    marker.style.cssText = `
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:center;
      font-size:10px; color:#ff0033; text-shadow:0 0 10px #ff0033;
      pointer-events:none; z-index:6; letter-spacing:0.05em;
    `;
    marker.textContent = '✦';
    cell.appendChild(marker);
  }

  function resetSponsorQuest(reason = '', options = {}) {
    const suppressStatus = options.suppressStatus === true;
    clearTimeout(S.sponsorQuest.startTimer);
    clearTimeout(S.sponsorQuest.completeTimer);
    clearTimeout(S.sponsorQuest.statusTimer);
    clearSponsorQuestWarning();
    document.removeEventListener('keydown', handleSponsorQuestOverlayKey, true);
    S.sponsorQuest.active = false;
    S.sponsorQuest.ready = false;
    S.sponsorQuest.score = 0;
    S.sponsorQuest.snakeTail = [];
    S.sponsorQuest.directionX = 0;
    S.sponsorQuest.directionY = 0;
    S.sponsorQuest.intentX = 0;
    S.sponsorQuest.intentY = 0;
    S.sponsorQuest.paused = false;
    stopSponsorQuestLoop();
    const cells = document.querySelectorAll('.noise-cell');
    clearQuestMarks(cells);
    clearSponsorTrail();
    cells.forEach((cell) => {
      cell.classList.remove('sponsor', 'sponsor-tail', 'sponsor-head', 'snake-complete');
      clearSnakeCellVisual(cell);
      clearSponsorClickBindings(cell);
      restoreCellLabel(cell);
    });
    const baseIdx = 42;
    const baseCell = cells[baseIdx];
    if (baseCell) {
      baseCell.classList.add('sponsor');
      const lbl = baseCell.querySelector('.cell-label');
      if (lbl) lbl.textContent = 'ПАРА-КЛУБ';
      bindSponsorDoubleClick(baseCell);
    }
    S.sponsorGridX = 2;
    S.sponsorGridY = 4;
    OMS.audioApi.stopSnakeMode();
    updateSponsorQuestUi();
    if (reason && !suppressStatus && R.statusLine && S.currentPhase >= 1) {
      R.statusLine.textContent = reason;
      R.statusLine.style.opacity = '1';
      setTimeout(() => { R.statusLine.style.opacity = '0'; }, 1800);
    }
  }

  function startSponsorQuest() {
    const cells = document.querySelectorAll('.noise-cell');
    if (!cells.length || S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    clearSponsorQuestWarning();
    stopSponsorQuestLoop();
    S.sponsorQuest.active = true;
    S.sponsorQuest.ready = false;
    S.sponsorQuest.paused = false;
    S.sponsorQuest.score = 0;
    S.sponsorQuest.snakeTail = [S.sponsorGridY * 10 + S.sponsorGridX];
    S.sponsorQuest.directionX = 0;
    S.sponsorQuest.directionY = 1;
    S.sponsorQuest.intentX = 0;
    S.sponsorQuest.intentY = 1;
    S.sponsorQuest.lastStepAt = Date.now();
    const forbidden = new Set([S.sponsorGridY * 10 + S.sponsorGridX, 42]);
    let ox = 0;
    let oy = 0;
    do {
      ox = Math.floor(Math.random() * 10);
      oy = Math.floor(Math.random() * 10);
    } while (forbidden.has(oy * 10 + ox));
    S.sponsorQuest.objective.x = ox;
    S.sponsorQuest.objective.y = oy;
    document.body.classList.add('snake-mode');
    cells.forEach((cell) => {
      clearSponsorClickBindings(cell);
      cell.classList.remove('sponsor');
    });
    paintQuestTarget(cells);
    renderSnake(cells);
    updateSponsorQuestUi();
    const warning = document.createElement('div');
    warning.id = 'sponsor-quest-warning';
    warning.className = 'snake-start-overlay';
    warning.innerHTML = `
      <div class="snake-start-card">
        <div class="snake-start-kicker">СЕКРЕТНЫЙ РЕЖИМ</div>
        <div class="snake-start-title">ЗМЕЙКА</div>
        <div class="snake-start-copy">
          Чтобы <b>засчитать секрет</b>, съешь <b>15 добычи</b>.<br>
          После каждой добычи змейка растет и становится светлее.
        </div>
        <div class="snake-start-rules">
          <div class="snake-start-rules-title">УПРАВЛЕНИЕ</div>
          <div class="snake-start-rules-copy">
            Стрелки, <b>WASD</b> или свайпы.<br>
            Оно будет странным, придется привыкнуть.
          </div>
        </div>
        <div class="snake-start-actions">
          <button id="sponsor-quest-start" class="snake-start-button" type="button">НАЧАТЬ</button>
          <button id="sponsor-quest-close" class="snake-start-ghost" type="button">ВЫЙТИ ИЗ РЕЖИМА</button>
        </div>
        <div class="snake-start-footnote">
          Секрет добавится в счетчик только после 15 добычи.
        </div>
      </div>
    `;
    document.body.appendChild(warning);
    const startBtn = document.getElementById('sponsor-quest-start');
    if (startBtn) startBtn.addEventListener('click', beginSponsorQuestPlay);
    const closeBtn = document.getElementById('sponsor-quest-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        resetSponsorQuest('РЕЖИМ ЗМЕЙКИ ЗАКРЫТ');
      });
    }
    document.removeEventListener('keydown', handleSponsorQuestOverlayKey, true);
    document.addEventListener('keydown', handleSponsorQuestOverlayKey, true);
    setSnakeStatus('ЗМЕЙКА ГОТОВА // НАЖМИ ЛЮБУЮ КЛАВИШУ ИЛИ КНОПКУ СТАРТА', 3200);
  }

  function renderSnake(cells) {
    const all = cells || document.querySelectorAll('.noise-cell');
    all.forEach((cell) => {
      cell.classList.remove('sponsor', 'sponsor-head', 'sponsor-tail');
      clearSnakeCellVisual(cell);
      restoreCellLabel(cell);
    });
    const body = S.sponsorQuest.snakeTail;
    const tone = getSnakeBrightness();
    const headTone = Math.min(255, tone + 20);
    body.forEach((idx, i) => {
      const cell = all[idx];
      if (!cell) return;
      if (i === body.length - 1) {
        cell.classList.add('sponsor-head');
        applySnakeCellVisual(cell, headTone, true);
      } else {
        cell.classList.add('sponsor-tail');
        const tailTone = Math.max(95, tone - Math.max(0, body.length - i - 1) * 6);
        applySnakeCellVisual(cell, tailTone, false);
      }
      const lbl = cell.querySelector('.cell-label');
      if (lbl) lbl.textContent = i === body.length - 1 ? 'HEAD' : `${i + 1}`;
    });
  }

  function spawnSnakeFood(cells) {
    let ox = 0;
    let oy = 0;
    const occupied = new Set(S.sponsorQuest.snakeTail);
    do {
      ox = Math.floor(Math.random() * 10);
      oy = Math.floor(Math.random() * 10);
    } while (occupied.has(oy * 10 + ox));
    S.sponsorQuest.objective.x = ox;
    S.sponsorQuest.objective.y = oy;
    paintQuestTarget(cells);
  }

  function tickSnake() {
    if (!S.sponsorQuest.active) return;
    if (S.currentPhase !== 2 || S.lifetimeLimitReached) {
      resetSponsorQuest('', { suppressStatus: true });
      return;
    }
    if (!S.sponsorQuest.ready || S.sponsorQuest.paused) return;
    const cells = document.querySelectorAll('.noise-cell');
    if (!cells.length) return;

    if (S.sponsorQuest.intentX !== 0 || S.sponsorQuest.intentY !== 0) {
      const opposite =
        S.sponsorQuest.intentX === -S.sponsorQuest.directionX &&
        S.sponsorQuest.intentY === -S.sponsorQuest.directionY;
      if (!opposite || S.sponsorQuest.snakeTail.length <= 1) {
        S.sponsorQuest.directionX = S.sponsorQuest.intentX;
        S.sponsorQuest.directionY = S.sponsorQuest.intentY;
      }
    }

    const headIdx = S.sponsorQuest.snakeTail[S.sponsorQuest.snakeTail.length - 1];
    const hx = headIdx % 10;
    const hy = Math.floor(headIdx / 10);
    const nx = hx + S.sponsorQuest.directionX;
    const ny = hy + S.sponsorQuest.directionY;

    if (nx < 0 || nx > 9 || ny < 0 || ny > 9) {
      OMS.audioApi.playSnakeFail();
      resetSponsorQuest(buildSnakeFailureMessage('ТЫ ВРЕЗАЛСЯ В КРАЙ'));
      return;
    }

    const nextIdx = ny * 10 + nx;
    if (S.sponsorQuest.snakeTail.includes(nextIdx)) {
      OMS.audioApi.playSnakeFail();
      resetSponsorQuest(buildSnakeFailureMessage('ТЫ ВРЕЗАЛСЯ В ХВОСТ'));
      return;
    }

    S.sponsorQuest.snakeTail.push(nextIdx);
    S.sponsorGridX = nx;
    S.sponsorGridY = ny;
    const foodCell = cells[S.sponsorQuest.objective.y * 10 + S.sponsorQuest.objective.x];
    if (foodCell && !foodCell.querySelector('.quest-target')) {
      paintQuestTarget(cells);
    }
    const hitFood = nx === S.sponsorQuest.objective.x && ny === S.sponsorQuest.objective.y;
    if (hitFood) {
      clearQuestCellMark(foodCell);
      S.sponsorQuest.score += 1;
      OMS.audioApi.playSnakeEat(Math.max(0, S.sponsorQuest.score - 1) / S.sponsorQuest.targetScore);
      setSnakeStatus(`ДОБЫЧА ${S.sponsorQuest.score}/${S.sponsorQuest.targetScore} // ЗМЕЙКА РАСТЁТ`, 900);
      if (S.sponsorQuest.score >= S.sponsorQuest.targetScore) {
        renderSnake(cells);
        updateSponsorQuestUi();
        finalizeSponsorSecret();
        return;
      }
      spawnSnakeFood(cells);
    } else {
      S.sponsorQuest.snakeTail.shift();
    }
    renderSnake(cells);
    updateSponsorQuestUi();
  }

  function showCasinoAd() {
    if (S.casinoShown || S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    S.casinoShown = true;
    const ad = casinoAds[Math.floor(Math.random() * casinoAds.length)];
    const overlay = document.createElement('div');
    overlay.id = 'casino-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:700;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:16px; font-family:'VT323',monospace; text-align:center; cursor:pointer;
    `;
    overlay.innerHTML = `
      <div style="font-size:clamp(28px,5vw,52px);color:${ad.color};
        text-shadow:0 0 30px ${ad.color};letter-spacing:0.1em;
        animation:casinoBlink 0.4s step-end infinite;">${ad.name}</div>

      <div id="slot-machine" style="
        display:flex; gap:4px; padding:16px 24px;
        background:#111; border:3px solid ${ad.color};
        box-shadow:0 0 40px ${ad.color}, inset 0 0 20px rgba(0,0,0,0.8);
      ">
        <div class="slot-reel" data-reel="0" style="
          width:80px; height:80px; overflow:hidden; position:relative;
          border:2px solid rgba(255,255,255,0.2); background:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:48px;
        ">🍒</div>
        <div class="slot-reel" data-reel="1" style="
          width:80px; height:80px; overflow:hidden; position:relative;
          border:2px solid rgba(255,255,255,0.2); background:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:48px;
        ">7️⃣</div>
        <div class="slot-reel" data-reel="2" style="
          width:80px; height:80px; overflow:hidden; position:relative;
          border:2px solid rgba(255,255,255,0.2); background:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:48px;
        ">💎</div>
      </div>

      <button id="slot-spin-btn" type="button" style="
        font-family:'VT323',monospace; font-size:clamp(20px,3vw,32px);
        background:${ad.color}; color:#000; border:none;
        padding:10px 40px; cursor:pointer; letter-spacing:0.2em;
        box-shadow:0 0 20px ${ad.color};
      ">КРУТИТЬ!</button>

      <div id="slot-result" style="
        font-size:clamp(16px,2.5vw,28px); color:#fff;
        letter-spacing:0.15em; min-height:36px;
      "></div>

      <div style="font-size:clamp(12px,1.8vw,20px);color:rgba(255,255,255,0.4);
        letter-spacing:0.15em;">${ad.text}</div>

      <div style="font-size:clamp(9px,1.2vw,12px);color:rgba(255,255,255,0.15);
        letter-spacing:0.2em;">18+ НАЖМИ ВНЕ ОКНА ЧТОБЫ ЗАКРЫТЬ</div>
    `;
    ensureCasinoStyle();
    const spinBtn = overlay.querySelector('#slot-spin-btn');
    const reels = [...overlay.querySelectorAll('.slot-reel')];
    const resultEl = overlay.querySelector('#slot-result');
    if (spinBtn) {
      spinBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        spinSlots({ spinBtn, reels, resultEl, accentColor: ad.color });
      });
    }
    overlay.addEventListener('click', () => {
      overlay.remove();
      S.casinoShown = false;
    });
    document.body.appendChild(overlay);
    OMS.effects.triggerGlitch(260);
    OMS.audioApi.playGlitchSound();
    if (OMS.secrets) OMS.secrets.unlockSecret('casino', { source: 'sponsor' });
  }

  function ensureCasinoStyle() {
    if (document.getElementById('casino-style')) return;
    const style = document.createElement('style');
    style.id = 'casino-style';
    style.textContent = `
      @keyframes casinoBlink { 0%,100%{opacity:1} 50%{opacity:0.7} }
      .slot-reel-spinning { animation: reelBlur 0.1s linear infinite; }
      @keyframes reelBlur { 0%,100%{filter:blur(0)} 50%{filter:blur(2px)} }
    `;
    document.head.appendChild(style);
  }

  function playCasinoSound(type) {
    const A = OMS.audio;
    if (!A.ctx || !A.masterGain) return;
    const t = A.ctx.currentTime;
    if (type === 'spin') {
      const buf = A.ctx.createBuffer(1, A.ctx.sampleRate * 0.04, A.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 300);
      const src = A.ctx.createBufferSource();
      src.buffer = buf;
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.15, t);
      src.connect(g);
      g.connect(A.masterGain);
      src.start();
      return;
    }
    if (type === 'stop') {
      const o = A.ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(180, t);
      o.frequency.linearRampToValueAtTime(80, t + 0.06);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.linearRampToValueAtTime(0, t + 0.08);
      o.connect(g);
      g.connect(A.masterGain);
      o.start();
      o.stop(t + 0.08);
      return;
    }
    if (type === 'coin') {
      [1047, 1319, 1568].forEach((f, i) => {
        const o = A.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t + i * 0.08);
        const g = A.ctx.createGain();
        g.gain.setValueAtTime(0.12, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
        o.connect(g);
        g.connect(A.masterGain);
        o.start();
        o.stop(t + i * 0.08 + 0.2);
      });
      return;
    }
    if (type === 'jackpot') {
      const melody = [523, 659, 784, 659, 784, 1047, 784, 1047, 1319];
      melody.forEach((f, i) => {
        const o = A.ctx.createOscillator();
        o.type = i % 2 === 0 ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(f, t + i * 0.12);
        const g = A.ctx.createGain();
        g.gain.setValueAtTime(0.1, t + i * 0.12);
        g.gain.linearRampToValueAtTime(0, t + i * 0.12 + 0.15);
        o.connect(g);
        g.connect(A.masterGain);
        o.start();
        o.stop(t + i * 0.12 + 0.15);
      });
      return;
    }
    if (type === 'lose') {
      const o = A.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, t);
      o.frequency.linearRampToValueAtTime(80, t + 0.4);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.08, t);
      g.gain.linearRampToValueAtTime(0, t + 0.4);
      o.connect(g);
      g.connect(A.masterGain);
      o.start();
      o.stop(t + 0.4);
    }
  }

  function spinSlots({ spinBtn, reels, resultEl, accentColor }) {
    if (!spinBtn || spinBtn.disabled || reels.length !== 3) return;
    spinBtn.disabled = true;
    spinBtn.textContent = '...';
    if (resultEl) resultEl.textContent = '';

    const intervals = reels.map((reel, idx) => setInterval(() => {
      reel.classList.add('slot-reel-spinning');
      reel.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      playCasinoSound('spin');
    }, 80 + idx * 15));

    const roll = Math.random();
    let final;
    if (roll < 0.05) {
      const s = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      final = [s, s, s];
    } else if (roll < 0.25) {
      const s = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      const other = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      final = Math.random() < 0.5 ? [s, s, other] : [other, s, s];
    } else {
      let a;
      let b;
      let c;
      do { a = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; } while (false);
      do { b = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; } while (b === a);
      do { c = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; } while (c === a || c === b);
      final = [a, b, c];
    }

    reels.forEach((reel, idx) => {
      setTimeout(() => {
        clearInterval(intervals[idx]);
        reel.classList.remove('slot-reel-spinning');
        reel.textContent = final[idx];
        playCasinoSound('stop');
        if (idx !== 2) return;

        setTimeout(() => {
          const win = final[0] === final[1] && final[1] === final[2];
          const twoMatch = final[0] === final[1] || final[1] === final[2];
          if (win) {
            if (resultEl) {
              resultEl.style.color = accentColor;
              resultEl.textContent = 'ДЖЕКПОТ! ТЫ ВЫИГРАЛ!';
            }
            playCasinoSound('jackpot');
            OMS.effects.triggerExplosion();
          } else if (twoMatch) {
            if (resultEl) {
              resultEl.style.color = '#fff';
              resultEl.textContent = 'ПОЧТИ... ЕЩЁ РАЗ!';
            }
            playCasinoSound('coin');
          } else {
            if (resultEl) {
              resultEl.style.color = 'rgba(255,255,255,0.4)';
              resultEl.textContent = 'НЕ ПОВЕЗЛО. КРУТИ ЕЩЁ.';
            }
            playCasinoSound('lose');
          }
          spinBtn.disabled = false;
          spinBtn.textContent = 'КРУТИТЬ!';
        }, 300);
      }, 900 + idx * 700);
    });
  }

  function leaveSponsorTrace(cell) {
    if (!cell) return;
    const star = document.createElement('div');
    star.className = 'sponsor-trace-star';
    star.textContent = '★';
    cell.appendChild(star);
    sponsorTrail.push({ el: star, cell });
    if (sponsorTrail.length > MAX_SPONSOR_TRAIL) {
      const old = sponsorTrail.shift();
      if (old && old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
    }
  }

  function injectSponsorCell() {
    const cells = document.querySelectorAll('.noise-cell');
    const idx = 42;
    const sc = cells[idx];
    if (!sc) return;
    sc.classList.add('sponsor');
    const lbl = sc.querySelector('.cell-label');
    if (lbl) lbl.textContent = 'ПАРА-КЛУБ';
    bindSponsorDoubleClick(sc);
  }

  function moveSponsorCell(dx, dy) {
    if (S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    OMS.audioApi.initAudio();
    const cells = document.querySelectorAll('.noise-cell');
    if (!cells.length) return;

    if (!S.sponsorQuest.active) {
      const oldIdx = S.sponsorGridY * 10 + S.sponsorGridX;
      const oldCell = cells[oldIdx];
      if (oldCell) {
        leaveSponsorTrace(oldCell);
        oldCell.classList.remove('sponsor');
        clearSponsorClickBindings(oldCell);
      }

      S.sponsorGridX = Math.max(0, Math.min(9, S.sponsorGridX + dx));
      S.sponsorGridY = Math.max(0, Math.min(9, S.sponsorGridY + dy));
      const newIdx = S.sponsorGridY * 10 + S.sponsorGridX;
      const newCell = cells[newIdx];
      if (newCell) {
        newCell.classList.add('sponsor');
        const lbl = newCell.querySelector('.cell-label');
        if (lbl) lbl.textContent = 'ПАРА-КЛУБ';
        bindSponsorDoubleClick(newCell);
        OMS.effects.showTooltip('★ СПОНСОР СЕАНСА ★', newCell);
        setTimeout(OMS.effects.hideTooltip, 700);
      }

      startSponsorQuest();
      return;
    }
    if (!S.sponsorQuest.ready) return;
    const reversedX = dx * -1;
    const reversedY = dy * -1;
    if (reversedX === 0 && reversedY === 0) return;
    if (!canQueueSnakeTurn(reversedX, reversedY)) return;
    S.sponsorQuest.intentX = reversedX;
    S.sponsorQuest.intentY = reversedY;
    OMS.audioApi.playSnakeTurnCue();
  }

  function showGodzilla() {
  OMS.effects.triggerGlitch(500);
  OMS.audioApi.playExplosionSound();
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:VT323,monospace;text-align:center;cursor:pointer;';
  el.innerHTML = `
    <div style="font-size:clamp(10px,1.8vw,16px);color:#ff0033;letter-spacing:0.3em;animation:glitchText 0.5s infinite;">⚠ ЭКСТРЕННОЕ СООБЩЕНИЕ ⚠</div>
    <div style="font-size:clamp(36px,8vw,90px);color:#ff0033;text-shadow:0 0 40px #ff0033;letter-spacing:0.1em;">GODZILLA SIGHTED</div>
    <div style="font-size:clamp(12px,2vw,20px);color:rgba(255,0,51,0.5);letter-spacing:0.2em;">TOKYO — ЭВАКУАЦИЯ НАЧАЛАСЬ</div>
    <div style="font-size:clamp(10px,1.5vw,14px);color:rgba(255,255,255,0.2);letter-spacing:0.3em;">[ НАЖМИ ЧТОБЫ ЗАКРЫТЬ ]</div>
  `;
  el.addEventListener('click', () => {
    el.remove();
    S.godzillaShown = false;
    S.tokyoClicks = 0;
  });
  document.body.appendChild(el);
  if (OMS.secrets) OMS.secrets.unlockSecret('godzilla', { source: 'tokyo_clicks' });
  }

  function triggerScreamer() {
  OMS.audioApi.initAudio();
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:1000;display:flex;align-items:center;justify-content:center;font-family:VT323,monospace;font-size:clamp(100px,25vw,300px);color:#00ff41;text-shadow:0 0 40px #00ff41;';
  overlay.textContent = '3';
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.textContent = '2'; OMS.audioApi.playGlitchSound(); }, 800);
  setTimeout(() => { overlay.textContent = '1'; OMS.audioApi.playGlitchSound(); }, 1600);
  setTimeout(() => {
    overlay.style.background = '#fff';
    overlay.style.color = '#000';
    overlay.style.fontSize = 'clamp(32px,6vw,64px)';
    overlay.textContent = 'МЫ ВСЁ ЗНАЕМ';
    OMS.audioApi.playExplosionSound();
    setTimeout(() => overlay.remove(), 1000);
  }, 2400);
  }

  function triggerPhoneMeme() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:VT323,monospace;cursor:pointer;gap:12px;';
  el.innerHTML = `
    <div style="font-size:clamp(20px,4vw,46px);color:#00ff41;letter-spacing:0.08em;">ВОЗЬМИ ТЕЛЕФОН ДЕТКА</div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:clamp(12px,2vw,20px);color:rgba(0,255,65,0.5);">[ нажми чтобы закрыть ]</div>
  `;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
  }

  function triggerRansheByloLuchshe() {
  OMS.effects.triggerExplosion();
  OMS.audioApi.playExplosionSound();
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:#000;z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;cursor:pointer;';
  el.innerHTML = `
    <div style="font-family:VT323,monospace;font-size:clamp(36px,8vw,100px);color:#ffaa00;text-shadow:0 0 30px #ffaa00;letter-spacing:0.05em;text-align:center;line-height:1.1;">РАНЬШЕ<br>БЫЛО<br>ЛУЧШЕ</div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:clamp(11px,1.8vw,18px);color:rgba(255,170,0,0.5);letter-spacing:0.2em;text-align:center;line-height:1.8;">ИНТЕРНЕТ БЫЛ СВОБОДНЫМ<br>САЙТЫ НЕ БЛОКИРОВАЛИ</div>
    <div style="font-family:VT323,monospace;font-size:clamp(14px,2vw,22px);color:rgba(255,170,0,0.3);letter-spacing:0.3em;">[ нажми чтобы закрыть ]</div>
  `;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  }

  function showAccusationMsg(line1, line2, color = '#00ff41', onDone = null) {
  document.querySelectorAll('.accusation-msg').forEach(e => e.remove());
  const el = document.createElement('div');
  el.className = 'accusation-msg';
  el.innerHTML = `<span class="acc-line1" style="color:${color};text-shadow:0 0 20px ${color}">${line1}</span>${line2 ? `<br><span class="acc-line2" style="color:${color};opacity:0.6">${line2}</span>` : ''}`;
  const DURATION = 1600;
  el.style.cssText = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'VT323', monospace;
    text-align: center;
    z-index: 300;
    pointer-events: none;
    animation: accIn ${DURATION}ms ease forwards;
    line-height: 1.1;
  `;
  if (!document.getElementById('acc-style')) {
    const s = document.createElement('style');
    s.id = 'acc-style';
    s.textContent = `
      @keyframes accIn {
        0%   { opacity:0; transform:translate(-50%,-50%) scale(1.3); filter:blur(6px); }
        20%  { opacity:1; transform:translate(-50%,-50%) scale(1);   filter:blur(0); }
        70%  { opacity:1; transform:translate(-50%,-50%) scale(1); }
        100% { opacity:0; transform:translate(-50%,-50%) scale(0.95); }
      }
      .acc-line1 {
        font-size: clamp(36px, 7vw, 90px);
        letter-spacing: 0.05em;
        display: block;
      }
      .acc-line2 {
        font-size: clamp(20px, 4vw, 52px);
        letter-spacing: 0.1em;
        display: block;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(s);
  }
  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
    if (onDone) onDone();
  }, DURATION);
  }

  function applyVariableReinforcement() {
  const rewards = [['ХОРОШО', ''], ['МОЛОДЕЦ', ''], ['ПРИНЯТО', '']];
  const punishments = [
    ['ТЕБЕ ЖЕ СКАЗАЛИ', 'НЕ НАЖИМАТЬ'],
    ['ТЫ СЕРЬЁЗНО?', ''],
    ['МЫ ВСЁ ВИДЕЛИ', ''],
    ['ЗАЧЕМ', ''],
  ];
  const roll = Math.random();

  if (roll < 0.25) {
    const r = rewards[Math.floor(Math.random() * rewards.length)];
    showAccusationMsg(r[0], r[1], '#00ff41', () => {
      OMS.phases.positionBtn();
      R.escapeBtn.style.display = 'block';
    });
  } else if (roll < 0.75) {
    const p = punishments[Math.floor(Math.random() * punishments.length)];
    OMS.effects.triggerGlitch(240);
    showAccusationMsg(p[0], p[1], '#00ff41', () => {
      OMS.phases.positionBtn();
      R.escapeBtn.style.display = 'block';
    });
  } else {
    S.pendingForbiddenSecret = true;
    S.lastBanReason = 'forbidden_button';
    try { localStorage.setItem(OMS.constants.PENDING_FORBIDDEN_SECRET_KEY, '1'); } catch (e) {}
    try { localStorage.setItem(OMS.constants.BAN_REASON_KEY, 'forbidden_button'); } catch (e) {}
    R.escapeBtn.style.display = 'none';
    OMS.effects.triggerGlitch(500);
    OMS.audioApi.playExplosionSound();
    showAccusationMsg('ТЫ ПРОИГРАЛ', '', '#00ff41', () => OMS.phases.goToPhase3Gameover('forbidden_button'));
  }
  }

  function openNews(url) {
  const tip = document.createElement('div');
  tip.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    font-family:'VT323',monospace;font-size:clamp(16px,2.5vw,28px);
    color:#000;background:#fff;padding:12px 24px;z-index:1000;
    border:2px solid #c00;text-align:center;letter-spacing:0.1em;
  `;
  tip.textContent = 'ПЕРЕХОД НА ВНЕШНИЙ РЕСУРС...';
  document.body.appendChild(tip);
  setTimeout(() => {
    tip.remove();
    window.open(url, '_blank');
  }, 700);
  }

  function toggleEmergencyExit() {
    S.eeActive = !S.eeActive;
    if (S.eeActive) {
      S.eeTotalDist = 0;
      R.emergencyExit.classList.add('active');
      if (OMS.audio.ctx && OMS.audio.masterGain) OMS.audio.masterGain.gain.linearRampToValueAtTime(0, OMS.audio.ctx.currentTime + 0.2);
      if (OMS.secrets) OMS.secrets.unlockSecret('emergency_exit', { source: 'hotkey' });
    } else {
      R.emergencyExit.classList.remove('active');
      R.emergencyTint.style.opacity = '0';
      if (OMS.audio.ctx && OMS.audio.masterGain && !S.isMuted) OMS.audio.masterGain.gain.linearRampToValueAtTime(S.currentVolume, OMS.audio.ctx.currentTime + 0.2);
      OMS.effects.triggerGlitch(350);
    }
  }

  function setupPassiveFeatures() {
    const tutShown = (() => { try { return localStorage.getItem('oms_tut'); } catch (e) { return null; } })();
    if (S.isMobile && !tutShown && R.mobileTutorial) {
      const steps = [
        { icon: '👆', text: 'СВАЙПАЙ ПО ЯЧЕЙКАМ\\nЧТОБЫ ОТКРЫТЬ ИХ' },
        { icon: '🔍', text: 'КАЖДАЯ ЯЧЕЙКА\\nСКРЫВАЕТ ЧТО-ТО' },
        { icon: '⚠️', text: 'ОСТОРОЖНО\\nМЫ НАБЛЮДАЕМ\\nЗА КАЖДЫМ ДЕЙСТВИЕМ' },
      ];
      let i = 0;
      const iconEl = R.mobileTutorial.querySelector('.tut-icon');
      const update = () => {
        const st = steps[i];
        if (iconEl) iconEl.textContent = st.icon;
        if (R.tutorialText) R.tutorialText.textContent = st.text;
        if (R.tutorialButton) R.tutorialButton.textContent = i < steps.length - 1 ? 'ДАЛЕЕ' : 'НАЧАТЬ';
      };
      OMS.features.tutNext = () => {
        i += 1;
        if (i >= steps.length) {
          R.mobileTutorial.style.display = 'none';
          try { localStorage.setItem('oms_tut', '1'); } catch (e) {}
        } else {
          update();
        }
      };
      setTimeout(() => {
        R.mobileTutorial.style.display = 'flex';
        update();
      }, 1500);
    } else {
      OMS.features.tutNext = () => {};
    }

    R.emergencyDesktop.addEventListener('mousemove', e => {
      if (!S.eeActive) return;
      const rect = R.emergencyDesktop.getBoundingClientRect();
      const px = `${((e.clientX - rect.left) / rect.width * 100).toFixed(1)}%`;
      const py = `${((e.clientY - rect.top) / rect.height * 100).toFixed(1)}%`;
      R.emergencyDesktop.style.setProperty('--mx', px);
      R.emergencyDesktop.style.setProperty('--my', py);
      const dx = e.clientX - S.lastMX;
      const dy = e.clientY - S.lastMY;
      S.eeTotalDist += Math.sqrt(dx * dx + dy * dy);
      const bleed = Math.min(S.eeTotalDist / 2000, 0.85);
      R.emergencyTint.style.opacity = String(bleed);
      if (bleed >= 0.85) setTimeout(() => { if (S.eeActive) toggleEmergencyExit(); }, 400);
    });
  }

  window.addEventListener('oms:phase-reset', () => {
    if (S.sponsorQuest.active) {
      resetSponsorQuest('', { suppressStatus: true });
    } else {
      clearSponsorQuestUi();
    }
  });

  OMS.features = {
    showCasinoAd,
    beginSponsorQuestPlay,
    moveSponsorCell,
    pauseSponsorQuest,
    resumeSponsorQuest,
    resetSponsorQuest,
    showGodzilla,
    triggerScreamer,
    triggerPhoneMeme,
    triggerRansheByloLuchshe,
    showAccusationMsg,
    applyVariableReinforcement,
    openNews,
    toggleEmergencyExit,
    setupPassiveFeatures,
    injectSponsorCell,
    tutNext: () => {},
  };
})();
