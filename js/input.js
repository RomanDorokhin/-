// === УПРАВЛЕНИЕ ===

const keys = {};

function setupInput() {
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!P || !P.alive) return;
    if (P.mode === 'snake') {
      const M = {
        ArrowUp: { dc: 0, dr: -1 }, KeyW: { dc: 0, dr: -1 },
        ArrowDown: { dc: 0, dr: 1 }, KeyS: { dc: 0, dr: 1 },
        ArrowLeft: { dc: -1, dr: 0 }, KeyA: { dc: -1, dr: 0 },
        ArrowRight: { dc: 1, dr: 0 }, KeyD: { dc: 1, dr: 0 },
      };
      if (M[e.code]) {
        const d = M[e.code];
        if (!(d.dc === -P.dir.dc && P.dir.dc !== 0) && !(d.dr === -P.dir.dr && P.dir.dr !== 0))
          P.nxt = d;
      }
    }
    if (e.code === 'KeyR') startGame();
  });

  document.addEventListener('keyup', e => keys[e.code] = false);

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * CW;
    const my = (e.clientY - r.top) / r.height * CH;

    // В бою — клик запускает ракету если идёт таргетинг
    if (state === S.BATTLE) {
      handleBattleClick(mx, my);
      return;
    }

    if (!P || !P.alive || P.mode !== 'snake') return;
    const hx = P.col * CELL + CELL / 2, hy = P.row * CELL + CELL / 2;
    const dx = mx - hx, dy = my - hy;
    let nd = Math.abs(dx) > Math.abs(dy) ? { dc: dx > 0 ? 1 : -1, dr: 0 } : { dc: 0, dr: dy > 0 ? 1 : -1 };
    if (!(nd.dc === -P.dir.dc && P.dir.dc !== 0) && !(nd.dr === -P.dir.dr && P.dir.dr !== 0)) P.nxt = nd;
  });
}

function handleBaseKeys() {
  if (!P || !P.alive || P.mode !== 'base') return;
  if (keys['ArrowUp'] || keys['KeyW'])         { P.vdc = 0; P.vdr = -1; }
  else if (keys['ArrowDown'] || keys['KeyS'])  { P.vdc = 0; P.vdr = 1; }
  else if (keys['ArrowLeft'] || keys['KeyA'])  { P.vdc = -1; P.vdr = 0; }
  else if (keys['ArrowRight'] || keys['KeyD']) { P.vdc = 1; P.vdr = 0; }
  else { P.vdc = 0; P.vdr = 0; }
}
