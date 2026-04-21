window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;

  function showCasinoAd() {
    if (S.casinoShown || S.currentPhase !== 2) return;
    S.casinoShown = true;
  const overlay = document.createElement('div');
  overlay.id = 'casino-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:VT323,monospace;text-align:center;cursor:pointer;';
  overlay.innerHTML = `
    <div style="font-size:clamp(28px,5vw,52px);color:#ff0;letter-spacing:0.1em;animation:glitchText 0.5s infinite;">КАЗИНО</div>
    <div style="font-size:clamp(16px,2.5vw,28px);color:#fff;letter-spacing:0.15em;">ВЫИГРАЙ МИЛЛИОН! 100% БОНУС!</div>
    <div style="font-size:clamp(10px,1.4vw,14px);color:rgba(255,255,255,0.25);">[ нажми чтобы закрыть ]</div>
  `;
  overlay.addEventListener('click', () => {
    overlay.remove();
    S.casinoShown = false;
  });
  document.body.appendChild(overlay);
  triggerGlitch(260);
  playGlitchSound();
  }

  function injectSponsorCell() {
    const cells = document.querySelectorAll('.noise-cell');
    const idx = 42;
    const sc = cells[idx];
    if (!sc) return;
    sc.classList.add('sponsor');
    const lbl = sc.querySelector('.cell-label');
    if (lbl) lbl.textContent = 'ПАРА-КЛУБ';
    let lastTap = 0;
    sc.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastTap < 420) showCasinoAd();
      lastTap = now;
    });
  }

  function moveSponsorCell(dx, dy) {
  if (S.currentPhase !== 2) return;
  const cells = document.querySelectorAll('.noise-cell');
  const cols = 10;
  const oldIdx = S.sponsorGridY * cols + S.sponsorGridX;
  if (cells[oldIdx]) cells[oldIdx].classList.remove('sponsor');
  S.sponsorGridX = Math.max(0, Math.min(cols - 1, S.sponsorGridX + dx));
  S.sponsorGridY = Math.max(0, Math.min(9, S.sponsorGridY + dy));
  const newIdx = S.sponsorGridY * cols + S.sponsorGridX;
  const newCell = cells[newIdx];
  if (!newCell) return;
  newCell.classList.add('sponsor');
  const lbl = newCell.querySelector('.cell-label');
  if (lbl) lbl.textContent = 'ПАРА-КЛУБ';
  OMS.effects.showTooltip('★ СПОНСОР СЕАНСА ★', newCell);
  setTimeout(OMS.effects.hideTooltip, 800);
  const atEdge = S.sponsorGridX === 0 || S.sponsorGridX === 9 || S.sponsorGridY === 0 || S.sponsorGridY === 9;
  if (atEdge) showCasinoAd();
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
    R.escapeBtn.style.display = 'none';
    OMS.effects.triggerGlitch(500);
    OMS.audioApi.playExplosionSound();
    showAccusationMsg('ТЫ ПРОИГРАЛ', '', '#00ff41', () => OMS.phases.goToPhase3Gameover());
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

  OMS.features = {
    showCasinoAd,
    moveSponsorCell,
    showGodzilla,
    triggerScreamer,
    triggerPhoneMeme,
    triggerRansheByloLuchshe,
    showAccusationMsg,
    applyVariableReinforcement,
    openNews,
    toggleEmergencyExit,
    setupPassiveFeatures,
    injectSponsorCell: OMS.grid.injectSponsorCell,
    tutNext: () => {},
  };
})();
