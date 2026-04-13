// === ДВИЖЕНИЕ ЮНИТОВ ===

function moveUnit(u, dt) {
  if (!u.alive) {
    u.respT -= dt;
    if (u.respT <= 0) respawn(u);
    return;
  }

  if (u.mode === 'base') {
    u.mvT += dt;
    if (u.mvT < BASE_SPD) return;
    u.mvT -= BASE_SPD;
    if (u.vdc === 0 && u.vdr === 0) return;

    const nc = u.col + u.vdc;
    const nr = u.row + u.vdr;

    if (u.isP && inPBase(nc, nr)) { u.col = nc; u.row = nr; return; }
    if (!u.isP && inEBase(nc, nr)) { u.col = nc; u.row = nr; return; }

    if (u.isP && nc === P_FIELD_COL && isDoor(nc, nr) && u.vdc === 1) {
      enterSnake(u, nc, nr); return;
    }
    if (!u.isP && nc === E_FIELD_COL && isDoor(nc, nr) && u.vdc === -1) {
      enterSnake(u, nc, nr); return;
    }
  } else {
    u.snT += dt;
    if (u.snT < SNAKE_SPD) return;
    u.snT -= SNAKE_SPD;

    u.dir = { ...u.nxt };
    const nc = u.col + u.dir.dc;
    const nr = u.row + u.dir.dr;

    if (u.isP && inPBase(nc, nr) && isDoor(nc, nr)) { returnBase(u, nc, nr); return; }
    if (!u.isP && inEBase(nc, nr) && isDoor(nc, nr)) { returnBase(u, nc, nr); return; }

    if (!inField(nc, nr)) { hitWall(u); return; }

    u.tail.unshift({ col: u.col, row: u.row });
    const maxLen = Math.max(1, u.soldiers);
    if (u.tail.length > maxLen) u.tail.pop();

    u.col = nc; u.row = nr;

    const ii = items.findIndex(i => i.col === nc && i.row === nr);
    if (ii !== -1) {
      const it = items.splice(ii, 1)[0];
      collect(u, it);
      if (items.length < 14) spawnItem();
    }

    const hi = hazards.findIndex(h => h.col === nc && h.row === nr);
    if (hi !== -1) { hazards.splice(hi, 1); hitWall(u); }
  }
}

function enterSnake(u, nc, nr) {
  u.mode = 'snake';
  u.tail = [];
  u.col = nc; u.row = nr;
  u.dir = { dc: u.isP ? 1 : -1, dr: 0 };
  u.nxt = { ...u.dir };
  u.snT = SNAKE_SPD;
}

function returnBase(u, nc, nr) {
  u.mode = 'base';
  u.col = nc; u.row = nr;
  if (u.carry > 0) {
    u.res += u.carry;
    if (u.isP) addFx(u.col * CELL + CELL / 2, u.row * CELL + CELL / 2, '+' + u.carry + ' 💰', '#FFD700', 2000);
  }
  u.carry = 0; u.hp = 2; u.tail = [];
  u.vdc = 0; u.vdr = 0;
  u.mvT = 0; u.snT = 0;
}

function hitWall(u) {
  if (u.hp === 2) {
    u.carry = 0; u.hp = 1; u.tail = [];
    if (u.isP) addFx(u.col * CELL + CELL / 2, u.row * CELL, '⚠ рюкзак потерян!', '#FF8800', 1500);
  } else {
    u.alive = false; u.carry = 0;
    graves.push({ col: u.col, row: u.row, life: 2500, isP: u.isP });
    u.tail = [];
    u.respT = 2800; u.mode = 'base';
    if (u.isP) addFx(CW / 2, CH / 2, '☠ ГИБЕЛЬ', '#CC1111', 2200);
  }
}

function respawn(u) {
  u.alive = true; u.hp = 2; u.carry = 0; u.tail = [];
  u.col = u.isP ? 2 : TC - 3;
  u.row = ROWS >> 1;
  u.mode = 'base'; u.vdc = 0; u.vdr = 0;
  u.snT = 0; u.mvT = 0;
  u.soldiers = 0;
}

function collect(u, it) {
  if (it.t === 'supply' || it.t === 'crate') {
    u.carry += it.v;
    if (u.isP) addFx(it.col * CELL + CELL / 2, it.row * CELL, '+' + it.v, '#88FF88', 900);
  } else if (it.t === 'medkit') {
    u.hp = 2;
    if (u.isP) addFx(it.col * CELL + CELL / 2, it.row * CELL, '❤ HP', '#FF7777', 900);
  } else if (it.t === 'recruit') {
    u.carry += it.v; u.soldiers++;
    u.tail.push({ col: u.col, row: u.row });
    if (u.isP) addFx(it.col * CELL + CELL / 2, it.row * CELL, '+боец!', '#88FF44', 1100);
  }
}
