// === МИНЫ И ВЗРЫВЫ ===

function updateHaz(dt) {
  hazards.forEach(h => {
    h.timer -= dt;
    if (h.timer <= 0) {
      explosions.push({ col: h.col, row: h.row, l: 700, ml: 700 });
      [P, E].forEach(u => {
        if (u && u.alive && u.mode === 'snake' && Math.abs(u.col - h.col) <= 1 && Math.abs(u.row - h.row) <= 1)
          hitWall(u);
      });
      h.dead = true;
    }
  });
  hazards = hazards.filter(h => !h.dead);
  explosions = explosions.filter(e => { e.l -= 16; return e.l > 0; });
}
