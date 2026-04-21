window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;
  const U = OMS.utils;

  function bindDesktopTrail(clientX, clientY) {
    if (!Array.isArray(OMS.trailPositions)) OMS.trailPositions = [];
    if (!Array.isArray(OMS.trailDots)) OMS.trailDots = [];
    if (!Number.isFinite(OMS.TRAIL_LEN) || OMS.TRAIL_LEN <= 0) OMS.TRAIL_LEN = 0;
    if (!OMS.TRAIL_LEN || OMS.trailDots.length === 0) return;

    OMS.trailPositions.unshift({ x: clientX, y: clientY });
    if (OMS.trailPositions.length > OMS.TRAIL_LEN) OMS.trailPositions.pop();
    OMS.trailDots.forEach((dot, i) => {
      const p = OMS.trailPositions[i];
      if (p && S.currentPhase >= 1) {
        dot.style.left = `${p.x}px`;
        dot.style.top = `${p.y}px`;
        dot.style.opacity = String((1 - i / OMS.TRAIL_LEN) * 0.4);
        dot.style.transform = `scale(${1 - i / OMS.TRAIL_LEN})`;
      } else {
        dot.style.opacity = '0';
      }
    });
  }

  function setupInputHandlers() {
    document.addEventListener('mousemove', e => {
      S.lastActivity = Date.now();
      const controlScale = S.secretSystems.control.controlScale ?? 1;
      const dx = (e.clientX - S.lastMX) * controlScale;
      const dy = e.clientY - S.lastMY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      S.mouseVel = Math.min(dist / 20, 1);
      S.totalMouseDist += dist;
      S.lastMX = S.mouseX = e.clientX;
      S.lastMY = S.mouseY = e.clientY;
      R.coords.innerHTML = `X: ${String(e.clientX).padStart(4, '0')}<br>Y: ${String(e.clientY).padStart(4, '0')}<br>Δ: ${S.mouseVel.toFixed(3)}`;

      if (S.currentPhase === 0 && S.totalMouseDist > 300 && !S.exploded && !window.__banned && S.introAccepted) {
        try { OMS.audioApi.initAudio(); } catch (err) {}
        OMS.phases.goToPhase2();
      }

      bindDesktopTrail(e.clientX, e.clientY);
    });

    document.addEventListener('click', e => {
      OMS.audioApi.initAudio();
      OMS.audioApi.playGlitchSound();
      OMS.effects.triggerGlitch(260);
      OMS.effects.spawnClickRipple(e.clientX, e.clientY);

      const cell = e.target.closest('.noise-cell');
      if (cell && S.currentPhase === 2 && cell.dataset.loc === 'TOKYO') {
        S.tokyoClicks++;
        if (S.tokyoClicks >= 50 && !S.godzillaShown) {
          S.godzillaShown = true;
          OMS.features.showGodzilla();
        }
      }
    });

    R.escapeBtn.addEventListener('mousemove', e => {
      if (S.currentPhase !== 2) return;
      const dx = e.clientX - S.btnX;
      const dy = e.clientY - S.btnY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const angle = Math.atan2(dy, dx) + Math.PI;
        const flee = 160 * (S.secretSystems.control.buttonSpeedMultiplier ?? 1);
        const nextX = U.clamp(S.btnX + Math.cos(angle) * flee, 80, window.innerWidth - 80);
        const nextY = U.clamp(S.btnY + Math.sin(angle) * flee, 80, window.innerHeight - 80);
        if (OMS.phases && OMS.phases.moveBtnToSafePoint) {
          OMS.phases.moveBtnToSafePoint(nextX, nextY);
        } else {
          S.btnX = nextX;
          S.btnY = nextY;
          R.escapeBtn.style.left = `${S.btnX - R.escapeBtn.offsetWidth / 2}px`;
          R.escapeBtn.style.top = `${S.btnY - R.escapeBtn.offsetHeight / 2}px`;
        }
      }
    });

    R.escapeBtn.addEventListener('click', () => {
      S.catchCount++;
      try { localStorage.setItem('oms_catch', String(S.catchCount)); } catch (e) {}
      OMS.features.applyVariableReinforcement();
    });

    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (OMS.secrets) OMS.secrets.markMeaninglessAction('contextmenu');
      const tip = document.createElement('div');
      tip.textContent = '// ЭТО НЕ ПОМОЖЕТ';
      tip.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-family:'Share Tech Mono',monospace;font-size:11px;color:rgba(0,255,65,0.7);background:rgba(0,0,0,0.95);border:1px solid rgba(0,255,65,0.2);padding:6px 14px;pointer-events:none;z-index:400;letter-spacing:0.2em;`;
      document.body.appendChild(tip);
      setTimeout(() => tip.remove(), 1200);
    });

    document.addEventListener('keydown', e => {
      S.lastActivity = Date.now();

      if (S.currentPhase === 2 && S.sponsorQuest.active) {
        const isModifierOnly = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key);
        if (!S.sponsorQuest.ready) {
          if (!isModifierOnly) {
            e.preventDefault();
            OMS.audioApi.initAudio();
            OMS.features.beginSponsorQuestPlay();
          }
          return;
        }

        const isArrowControl = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
        const isSnakeOnlyWasd = ['a', 'A', 'd', 'D', 'w', 'W', 's', 'S', 'ф', 'Ф', 'в', 'В', 'ц', 'Ц', 'ы', 'Ы'].includes(e.key);
        if (isArrowControl || isSnakeOnlyWasd) {
          e.preventDefault();
          OMS.audioApi.initAudio();
          const map = {
            ArrowLeft: [1, 0],
            ArrowRight: [-1, 0],
            ArrowUp: [0, 1],
            ArrowDown: [0, -1],
            a: [1, 0], A: [1, 0], ф: [1, 0], Ф: [1, 0],
            d: [-1, 0], D: [-1, 0], в: [-1, 0], В: [-1, 0],
            w: [0, 1], W: [0, 1], ц: [0, 1], Ц: [0, 1],
            s: [0, -1], S: [0, -1], ы: [0, -1], Ы: [0, -1],
          };
          OMS.features.moveSponsorCell(map[e.key][0], map[e.key][1]);
        } else {
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') {
        OMS.features.toggleEmergencyExit();
        S.ebtState = S.eeActive ? 'e' : '';
        return;
      }
      if (e.key === 'b' || e.key === 'B' || e.key === 'и' || e.key === 'И') {
        if (S.ebtState === 'e') {
          S.ebtState = 'b';
          if (OMS.secrets) OMS.secrets.unlockSecret('ebat_b', { source: 'ebat_sequence' });
          OMS.features.triggerScreamer();
        } else S.ebtState = '';
        return;
      }
      if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        if (S.ebtState === 'b') {
          S.ebtState = 'a';
          if (OMS.secrets) OMS.secrets.unlockSecret('ebat_a', { source: 'ebat_sequence' });
          OMS.features.triggerPhoneMeme();
        } else S.ebtState = '';
        return;
      }
      if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') {
        if (S.ebtState === 'a') {
          S.ebtState = '';
          if (OMS.secrets) OMS.secrets.unlockSecret('ebat_t', { source: 'ebat_sequence' });
          OMS.features.triggerRansheByloLuchshe();
        } else S.ebtState = '';
        return;
      }

      if (e.key === OMS.constants.KONAMI[S.konamiIdx]) {
        S.konamiIdx++;
        if (S.konamiIdx === OMS.constants.KONAMI.length) {
          S.konamiIdx = 0;
          if (OMS.secrets) OMS.secrets.unlockSecret('konami', { source: 'keyboard' });
          OMS.effects.triggerExplosion();
          OMS.effects.triggerGlitch(2800);
          R.statusLine.textContent = 'KONAMI CODE: ПРИНЯТ. ЧТО ТЫ ОЖИДАЛ?';
          R.statusLine.style.opacity = '1';
          setTimeout(() => { R.statusLine.style.opacity = '0'; }, 3500);
        }
      } else {
        S.konamiIdx = 0;
      }

      if (e.key === ' ') {
        if (OMS.secrets) OMS.secrets.markMeaninglessAction('space');
        const now = Date.now();
        if (S.currentPhase >= 1 && now - S.lastSpace < 400) {
          S.flipped = !S.flipped;
          document.body.style.transition = 'transform 0.4s cubic-bezier(0.68,-0.55,0.27,1.55)';
          if (S.secretSystems.control.invertControls) {
            document.body.style.transform = S.flipped ? 'rotate(-180deg)' : 'rotate(0deg)';
          } else {
            document.body.style.transform = S.flipped ? 'rotate(180deg)' : 'rotate(0deg)';
          }
          if (OMS.secrets) OMS.secrets.unlockSecret('double_space', { source: 'double_space' });
          OMS.audioApi.playGlitchSound();
        }
        S.lastSpace = now;
      }

      if ((e.key === '`' || e.key === 'ё' || e.key === '~' || e.key === 'Ё') && S.currentPhase >= 1) {
        if (OMS.secrets) OMS.secrets.unlockSecret('console_access', { source: 'keyboard' });
        OMS.main.toggleSecretConsole();
      }

      if (e.key === 'Enter' && S.currentPhase >= 1) {
        if (OMS.secrets) OMS.secrets.markMeaninglessAction('enter_news');
        const pressNews = [
          'Блогер получил 5 лет за репост картинки',
          'Студента отчислили за пост во ВКонтакте',
          'Пенсионер осуждён за лайк в соцсети',
          'Роскомнадзор заблокировал 500 000 сайтов',
        ];
        const news = pressNews[Math.floor(Math.random() * pressNews.length)];
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-family:\"Share Tech Mono\",monospace;font-size:clamp(12px,2vw,18px);color:#ff0033;background:rgba(0,0,0,0.95);border:1px solid rgba(255,0,51,0.4);padding:16px 28px;max-width:500px;text-align:center;letter-spacing:0.1em;line-height:1.6;z-index:400;pointer-events:none;';
        el.textContent = news;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 500);
        OMS.audioApi.playGlitchSound();
      }

      if (e.key.length === 1 && /[а-яёА-ЯЁa-zA-Z]/i.test(e.key)) {
        S.typedBuffer += e.key;
        clearTimeout(S.typedTimer);
        S.typedTimer = setTimeout(() => {
          const name = S.typedBuffer.trim();
          if (/^[а-яёА-ЯЁa-zA-Z]{3,12}$/.test(name) && S.currentPhase >= 1) {
            const upper = name.toUpperCase();
            try { localStorage.setItem('oms_name', upper); } catch (err) {}
            R.statusLine.textContent = `ИДЕНТИФИКАЦИЯ: ${upper}`;
            R.statusLine.style.opacity = '1';
            setTimeout(() => { R.statusLine.style.opacity = '0'; }, 2800);
          }
          S.typedBuffer = '';
        }, 800);
      }

    });

    if (S.isMobile) {
      R.escapeBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (S.currentPhase !== 2) return;
        const t = e.touches[0];
        if (!t) return;
        const angle = Math.atan2(t.clientY - S.btnY, t.clientX - S.btnX) + Math.PI;
        const flee = 180 * (S.secretSystems.control.buttonSpeedMultiplier ?? 1);
        const nextX = U.clamp(S.btnX + Math.cos(angle) * flee, 60, window.innerWidth - 60);
        const nextY = U.clamp(S.btnY + Math.sin(angle) * flee, 80, window.innerHeight - 120);
        if (OMS.phases && OMS.phases.moveBtnToSafePoint) {
          OMS.phases.moveBtnToSafePoint(nextX, nextY);
        } else {
          S.btnX = nextX;
          S.btnY = nextY;
          R.escapeBtn.style.left = `${S.btnX - R.escapeBtn.offsetWidth / 2}px`;
          R.escapeBtn.style.top = `${S.btnY - R.escapeBtn.offsetHeight / 2}px`;
        }
      }, { passive: false });

      R.escapeBtn.addEventListener('touchend', e => {
        e.preventDefault();
        if (S.currentPhase !== 2) return;
        S.catchCount++;
        try { localStorage.setItem('oms_catch', String(S.catchCount)); } catch (err) {}
        OMS.features.applyVariableReinforcement();
      }, { passive: false });

      document.addEventListener('touchmove', e => {
        const t = e.touches[0];
        if (!t) return;
        const controlScale = S.secretSystems.control.controlScale ?? 1;
        const dx = (t.clientX - S.lastMX) * controlScale;
        const dy = t.clientY - S.lastMY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        S.mouseVel = Math.min(dist / 20, 1.0);
        S.totalMouseDist += dist;
        S.lastMX = S.mouseX = t.clientX;
        S.lastMY = S.mouseY = t.clientY;
        S.lastActivity = Date.now();
        if (S.currentPhase === 0 && S.totalMouseDist > 150 && !S.exploded && S.introAccepted) {
          try { OMS.audioApi.initAudio(); } catch (err) {}
          OMS.phases.goToPhase2();
        }
      }, { passive: true });
    }
  }

  OMS.events = {
    setupInputHandlers,
  };
})();
