// === ИИ ВРАГА И КОЛЛИЗИИ ===

function checkColl() {
  if (!P || !E || !P.alive || !E.alive) return;
  if (P.mode === 'snake' && E.mode === 'snake') {
    if (P.col === E.col && P.row === E.row) { hitWall(P); hitWall(E); return; }
    if (E.tail.some(t => t.col === P.col && t.row === P.row)) { hitWall(P); return; }
    if (P.tail.some(t => t.col === E.col && t.row === E.row)) hitWall(E);
  }
}

function updateAI(dt) {
  aiT += dt;
  if (aiT < 330) return;
  aiT = 0;

  const u = E;
  if (!u.alive) return;

  if (u.mode === 'base') {
    const tc = E_DOOR_COL;
    const tr = (DOOR[0] + DOOR[DOOR.length - 1]) >> 1;
    if (u.row !== tr)    { u.vdc = 0;  u.vdr = Math.sign(tr - u.row); }
    else if (u.col > tc) { u.vdc = -1; u.vdr = 0; }
    else                 { u.vdc = -1; u.vdr = 0; }
  } else {
    if (u.carry > 80) {
      const tr = (DOOR[0] + DOOR[DOOR.length - 1]) >> 1;
      if (u.row !== tr) {
        const nd = { dc: 0, dr: Math.sign(tr - u.row) };
        if (!(nd.dr === -u.dir.dr && u.dir.dr !== 0)) u.nxt = nd;
      } else {
        u.nxt = { dc: 1, dr: 0 };
      }
      return;
    }
    if (!items.length) { u.nxt = { dc: -1, dr: 0 }; return; }

    let best = null, bd = 9999;
    items.forEach(it => {
      const d = Math.abs(it.col - u.col) + Math.abs(it.row - u.row);
      if (d < bd) { bd = d; best = it; }
    });

    const dc = best.col - u.col, dr = best.row - u.row;
    let nd = Math.random() < 0.18
      ? [{ dc: 1, dr: 0 }, { dc: -1, dr: 0 }, { dc: 0, dr: 1 }, { dc: 0, dr: -1 }][Math.floor(Math.random() * 4)]
      : Math.abs(dc) > Math.abs(dr) ? { dc: Math.sign(dc), dr: 0 } : { dc: 0, dr: Math.sign(dr) };

    if (!(nd.dc === -u.dir.dc && u.dir.dc !== 0) && !(nd.dr === -u.dir.dr && u.dir.dr !== 0))
      u.nxt = nd;
  }
}
