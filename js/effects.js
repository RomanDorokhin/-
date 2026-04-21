window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;

  function triggerExplosion() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 160; i++) {
      const pix = document.createElement('div');
      pix.className = 'pixel';
      pix.style.left = `${cx}px`;
      pix.style.top = `${cy}px`;
      pix.style.background = Math.random() > 0.72 ? '#fff' : '#00ff41';
      document.body.appendChild(pix);
      const a = Math.random() * Math.PI * 2;
      const sp = 80 + Math.random() * 360;
      const tx = Math.cos(a) * sp;
      const ty = Math.sin(a) * sp;
      const dur = 350 + Math.random() * 600;
      pix.animate([
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${tx}px,${ty}px)`, opacity: 0 }
      ], { duration: dur, easing: 'ease-out', fill: 'forwards' });
      setTimeout(() => pix.remove(), dur);
    }
  }

  function triggerGlitch(duration = 400) {
    R.glitchOverlay.innerHTML = '';
    R.glitchOverlay.style.opacity = '1';
    for (let i = 0; i < 8; i++) {
      const bar = document.createElement('div');
      bar.className = 'glitch-bar';
      bar.style.height = `${2 + Math.random() * 15}px`;
      bar.style.top = `${Math.random() * 100}%`;
      bar.style.opacity = `${0.3 + Math.random() * 0.5}`;
      bar.style.background = Math.random() > 0.5 ? '#00ff41' : '#fff';
      R.glitchOverlay.appendChild(bar);
    }
    const timer = setInterval(() => {
      R.glitchOverlay.querySelectorAll('.glitch-bar').forEach(b => {
        b.style.top = `${Math.random() * 100}%`;
        b.style.opacity = `${Math.random() * 0.6}`;
      });
      OMS.audioApi.playGlitchSound();
    }, 70);
    setTimeout(() => {
      clearInterval(timer);
      R.glitchOverlay.style.opacity = '0';
      R.glitchOverlay.innerHTML = '';
    }, duration);
  }

  function triggerHeavyGlitch(level = 1) {
    const bars = 8 + Math.floor(level * 10);
    const duration = 350 + Math.floor(level * 500);
    R.glitchOverlay.innerHTML = '';
    R.glitchOverlay.style.opacity = '1';
    for (let i = 0; i < bars; i++) {
      const bar = document.createElement('div');
      bar.className = 'glitch-bar';
      bar.style.height = `${3 + Math.random() * (12 + level * 14)}px`;
      bar.style.top = `${Math.random() * 100}%`;
      bar.style.opacity = `${0.25 + Math.random() * 0.7}`;
      bar.style.background = Math.random() > 0.4 ? '#ff0033' : '#00ff41';
      R.glitchOverlay.appendChild(bar);
    }
    const timer = setInterval(() => {
      R.glitchOverlay.querySelectorAll('.glitch-bar').forEach((b) => {
        b.style.top = `${Math.random() * 100}%`;
        b.style.opacity = `${0.2 + Math.random() * 0.8}`;
        b.style.height = `${2 + Math.random() * (16 + level * 18)}px`;
      });
      OMS.audioApi.playGlitchSound();
    }, Math.max(35, 70 - Math.floor(level * 12)));
    setTimeout(() => {
      clearInterval(timer);
      R.glitchOverlay.style.opacity = '0';
      R.glitchOverlay.innerHTML = '';
    }, duration);
  }

  function showTooltip(text, el) {
    const r = el.getBoundingClientRect();
    R.tooltip.innerHTML = text;
    if (S.isMobile) {
      R.tooltip.style.left = '50%';
      R.tooltip.style.transform = 'translateX(-50%)';
      R.tooltip.style.top = 'auto';
      R.tooltip.style.bottom = `${window.innerHeight * 0.15}px`;
    } else {
      R.tooltip.style.transform = '';
      R.tooltip.style.left = `${r.left}px`;
      R.tooltip.style.top = `${r.top - 56}px`;
      R.tooltip.style.bottom = 'auto';
    }
    R.tooltip.style.opacity = '1';
  }

  function hideTooltip() {
    R.tooltip.style.opacity = '0';
  }

  function spawnClickRipple(x, y) {
    const r = document.createElement('div');
    r.style.cssText = `position:fixed;left:${x - 20}px;top:${y - 20}px;width:40px;height:40px;border:2px solid #00ff41;border-radius:50%;pointer-events:none;z-index:99;`;
    document.body.appendChild(r);
    r.animate([{ transform: 'scale(1)', opacity: 0.8 }, { transform: 'scale(4)', opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => r.remove(), 500);
  }

  OMS.effects = {
    triggerExplosion,
    triggerGlitch,
    triggerHeavyGlitch,
    showTooltip,
    hideTooltip,
    spawnClickRipple,
  };
})();
