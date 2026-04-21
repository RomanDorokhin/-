// Visual effects shared across modules
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
    const s = 80 + Math.random() * 360;
    const tx = Math.cos(a) * s;
    const ty = Math.sin(a) * s;
    const dur = 350 + Math.random() * 600;
    pix.animate([
      { transform: 'translate(0,0)', opacity: 1 },
      { transform: `translate(${tx}px,${ty}px)`, opacity: 0 }
    ], { duration: dur, easing: 'ease-out', fill: 'forwards' });
    setTimeout(() => pix.remove(), dur);
  }
}

function triggerGlitch(duration = 400) {
  const glitchOverlay = document.getElementById('glitch-overlay');
  glitchOverlay.innerHTML = '';
  glitchOverlay.style.opacity = '1';
  for (let i = 0; i < 8; i++) {
    const bar = document.createElement('div');
    bar.className = 'glitch-bar';
    bar.style.height = `${2 + Math.random() * 15}px`;
    bar.style.top = `${Math.random() * 100}%`;
    bar.style.opacity = `${0.3 + Math.random() * 0.5}`;
    bar.style.background = Math.random() > 0.5 ? '#00ff41' : '#fff';
    glitchOverlay.appendChild(bar);
  }
  const timer = setInterval(() => {
    glitchOverlay.querySelectorAll('.glitch-bar').forEach(b => {
      b.style.top = `${Math.random() * 100}%`;
      b.style.opacity = `${Math.random() * 0.6}`;
    });
    playGlitchSound();
  }, 70);
  setTimeout(() => {
    clearInterval(timer);
    glitchOverlay.style.opacity = '0';
    glitchOverlay.innerHTML = '';
  }, duration);
}

function showTooltip(text, el) {
  const tooltip = document.getElementById('tooltip');
  const r = el.getBoundingClientRect();
  tooltip.innerHTML = text;
  if (APP_STATE.isMobile) {
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.top = 'auto';
    tooltip.style.bottom = `${window.innerHeight * 0.15}px`;
  } else {
    tooltip.style.transform = '';
    tooltip.style.left = `${r.left}px`;
    tooltip.style.top = `${r.top - 56}px`;
    tooltip.style.bottom = 'auto';
  }
  tooltip.style.opacity = '1';
}

function hideTooltip() {
  document.getElementById('tooltip').style.opacity = '0';
}

window.triggerExplosion = triggerExplosion;
window.triggerGlitch = triggerGlitch;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
