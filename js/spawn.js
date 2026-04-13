// === СПАВН ПРЕДМЕТОВ И ОПАСНОСТЕЙ ===

function spawnItem() {
  const occ = new Set();
  [P, E].forEach(u => {
    if (u) {
      occ.add(u.col + ',' + u.row);
      u.tail.forEach(t => occ.add(t.col + ',' + t.row));
    }
  });
  items.forEach(i => occ.add(i.col + ',' + i.row));
  hazards.forEach(h => occ.add(h.col + ',' + h.row));

  for (let t = 0; t < 400; t++) {
    const col = BASE_C + 1 + Math.floor(Math.random() * (FIELD_C - 2));
    const row = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (!occ.has(col + ',' + row)) {
      let r = Math.random() * IDEF_TOT, ch = IDEF[0];
      for (const tp of IDEF) { r -= tp.w; if (r <= 0) { ch = tp; break; } }
      items.push({ col, row, t: ch.t, v: ch.v });
      return;
    }
  }
}

function spawnHaz() {
  const occ = new Set();
  [P, E].forEach(u => {
    if (!u) return;
    occ.add(u.col + ',' + u.row);
    u.tail.forEach(t => occ.add(t.col + ',' + t.row));
  });
  items.forEach(i => occ.add(i.col + ',' + i.row));
  hazards.forEach(h => occ.add(h.col + ',' + h.row));

  for (let t = 0; t < 200; t++) {
    const col = BASE_C + 2 + Math.floor(Math.random() * (FIELD_C - 4));
    const row = 2 + Math.floor(Math.random() * (ROWS - 4));
    if (!occ.has(col + ',' + row)) {
      const mT = ri(3500, 6000);
      hazards.push({ col, row, timer: mT, maxT: mT });
      return;
    }
  }
}
