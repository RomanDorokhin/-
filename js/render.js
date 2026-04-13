// === ОТРИСОВКА ===

function render() {
  frameCount++;
  ctx.fillStyle = '#020804'; ctx.fillRect(0, 0, CW, CH);
  drawBases();
  drawField();

  if (state === S.ECONOMY || state === S.LOCK) {
    drawItems();
    drawHazards();
  }

  drawExplosions();

  if (state === S.ECONOMY || state === S.LOCK) {
    drawUnits();
  }

  if (state === S.BATTLE_INIT || state === S.BATTLE || state === S.RESOLVE || state === S.ROUND_END) {
    drawArmies();
    drawBattleHUD();
  }

  drawFX();
  drawVignette();
  drawTimer();
  drawHUD();
  drawPhaseOverlay();
}

function drawTimer() {
  // Таймер раунда вверху по центру
  const cx = CW / 2;
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(cx - 70, 4, 140, 22);
  ctx.fillStyle = '#C8A000'; ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('РАУНД ' + roundNum, cx, 14);
  if (state === S.ECONOMY) {
    const sec = Math.max(0, Math.ceil(econTimer / 1000));
    ctx.fillStyle = sec <= 10 ? '#FF4444' : sec <= 20 ? '#FFAA00' : '#88FF44';
    ctx.font = 'bold 13px Courier New';
    ctx.fillText('⏱ ' + sec + 'с', cx, 24);
  } else {
    let label = '';
    if (state === S.LOCK) label = 'ПОДГОТОВКА';
    else if (state === S.BATTLE_INIT) label = 'РАССТАНОВКА';
    else if (state === S.BATTLE) label = '⚔ БОЙ';
    else if (state === S.RESOLVE) label = winner === 'player' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ';
    else if (state === S.ROUND_END) label = 'СЛЕД. РАУНД...';
    ctx.fillStyle = '#FFAA00'; ctx.font = 'bold 11px Courier New';
    ctx.fillText(label, cx, 24);
  }
}

function drawBases() {
  const pw = BASE_C * CELL, ew = BASE_C * CELL, ex = (BASE_C + FIELD_C) * CELL;
  const gl = ctx.createLinearGradient(0, 0, pw, 0);
  gl.addColorStop(0, '#030B04'); gl.addColorStop(1, '#071508');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, pw, CH);
  const gr = ctx.createLinearGradient(ex, 0, ex + ew, 0);
  gr.addColorStop(0, '#0E0505'); gr.addColorStop(1, '#060303');
  ctx.fillStyle = gr; ctx.fillRect(ex, 0, ew, CH);

  // Стены
  ctx.fillStyle = '#1C380E'; ctx.fillRect(pw - 10, 0, 10, CH);
  ctx.fillStyle = '#341010'; ctx.fillRect(ex, 0, 10, CH);

  // Двери (открыты в Фазе 1)
  if (state === S.ECONOMY) {
    const d0 = DOOR[0] * CELL, dH = DOOR.length * CELL;
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 480);
    ctx.fillStyle = '#050E04'; ctx.fillRect(pw - 10, d0, 10, dH);
    ctx.strokeStyle = `rgba(60,200,40,${0.4 + 0.3 * pulse})`; ctx.lineWidth = 2;
    ctx.strokeRect(pw - 9, d0 + 1, 7, dH - 2);
    ctx.fillStyle = '#100505'; ctx.fillRect(ex, d0, 10, dH);
    ctx.strokeStyle = `rgba(200,50,50,0.45)`;
    ctx.strokeRect(ex + 1, d0 + 1, 7, dH - 2);
  }

  // Заголовки баз
  ctx.fillStyle = '#325A22'; ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('▌ ТВОЯ БАЗА ▐', pw / 2, 44);
  ctx.fillStyle = '#5A2020';
  ctx.fillText('▌ ВРАГ ▐', ex + ew / 2, 44);

  // Ресурсы
  ctx.fillStyle = '#4A7830'; ctx.font = '8px Courier New'; ctx.fillText('РЕСУРСЫ', pw / 2, 64);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px Courier New'; ctx.fillText(P ? P.res : 0, pw / 2, 88);
  if (P && P.carry > 0) { ctx.fillStyle = '#88CC44'; ctx.font = '8px Courier New'; ctx.fillText('+' + P.carry + ' рюкзак', pw / 2, 102); }

  // Бойцы
  ctx.fillStyle = '#4A7830'; ctx.font = '8px Courier New'; ctx.fillText('ОТРЯД', pw / 2, 122);
  ctx.fillStyle = '#8AB870'; ctx.font = 'bold 10px Courier New';
  ctx.fillText((P ? P.soldiers : 0) + ' бойцов', pw / 2, 136);

  // HP базы игрока (всегда видим)
  drawBaseHP(pw / 2, CH - 70, playerBaseHP, BASE_HP_MAX, '#88DD44', 'БАЗА');

  // Враг
  ctx.fillStyle = 'rgba(90,30,30,.7)'; ctx.font = '8px Courier New';
  ctx.fillText('РЕСУРСЫ', ex + ew / 2, 64);
  ctx.fillStyle = '#FF6040'; ctx.font = 'bold 22px Courier New';
  ctx.fillText(E ? E.res : 0, ex + ew / 2, 88);
  ctx.fillStyle = 'rgba(90,30,30,.7)'; ctx.font = '8px Courier New';
  ctx.fillText('ОТРЯД', ex + ew / 2, 122);
  ctx.fillStyle = '#DD8870'; ctx.font = 'bold 10px Courier New';
  ctx.fillText((E ? E.soldiers : 0), ex + ew / 2, 136);

  drawBaseHP(ex + ew / 2, CH - 70, enemyBaseHP, BASE_HP_MAX, '#DD4444', 'БАЗА');

  // Подсказки
  ctx.fillStyle = '#2A4018'; ctx.font = '7px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('WASD — движение', pw / 2, CH - 24);
  ctx.fillText('R — рестарт', pw / 2, CH - 12);
}

function drawBaseHP(cx, cy, hp, maxHp, color, label) {
  const w = 70, h = 8;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - w / 2, cy, w, h);
  const pct = Math.max(0, hp / maxHp);
  ctx.fillStyle = color;
  ctx.fillRect(cx - w / 2 + 1, cy + 1, (w - 2) * pct, h - 2);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 0.5;
  ctx.strokeRect(cx - w / 2, cy, w, h);
  ctx.fillStyle = '#aaa'; ctx.font = '8px Courier New'; ctx.textAlign = 'center';
  ctx.fillText(label + ' ' + Math.ceil(hp) + '/' + maxHp, cx, cy - 3);
}

function drawField() {
  const fxPx = BASE_C * CELL;
  ctx.fillStyle = '#07100A'; ctx.fillRect(fxPx, 0, FIELD_C * CELL, CH);
  ctx.strokeStyle = 'rgba(22,45,11,.28)'; ctx.lineWidth = .5;
  for (let c = BASE_C; c <= BASE_C + FIELD_C; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, CH); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(fxPx, r * CELL); ctx.lineTo(fxPx + FIELD_C * CELL, r * CELL); ctx.stroke();
  }
}

function drawItems() {
  items.forEach(it => {
    const px = it.col * CELL, py = it.row * CELL, cx = px + CELL / 2, cy = py + CELL / 2;
    if (it.t === 'supply') {
      ctx.fillStyle = '#6A5428'; ctx.fillRect(px + 6, py + 8, CELL - 12, CELL - 14);
      ctx.fillStyle = '#CCE8A0'; ctx.font = 'bold 7px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('+' + it.v, cx, py + CELL - 1);
    } else if (it.t === 'crate') {
      ctx.fillStyle = '#6A4A18'; ctx.fillRect(px + 3, py + 10, CELL - 6, CELL - 14);
      ctx.fillStyle = '#FFD700'; ctx.fillRect(px + 5, py + 8, 4, 3);
      ctx.fillStyle = '#FFEE88'; ctx.font = 'bold 8px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('+' + it.v, cx, py + CELL);
    } else if (it.t === 'medkit') {
      ctx.fillStyle = '#D8D0C0'; ctx.fillRect(px + 5, py + 9, CELL - 10, CELL - 14);
      ctx.fillStyle = '#DD1818'; ctx.fillRect(cx - 4, cy, 8, 3); ctx.fillRect(cx - 1, cy - 3, 3, 9);
    } else if (it.t === 'recruit') {
      ctx.fillStyle = '#4A6A28'; ctx.fillRect(cx - 4, py + 12, 8, 8);
      ctx.fillStyle = '#C89870'; ctx.fillRect(cx - 3, py + 6, 6, 6);
      ctx.fillStyle = '#88FF88'; ctx.font = 'bold 7px Courier New'; ctx.textAlign = 'center';
      ctx.fillText('рекрут', cx, py + CELL);
    }
  });
}

function drawHazards() {
  hazards.forEach(h => {
    const p = 1 - h.timer / h.maxT;
    const px = h.col * CELL, py = h.row * CELL;
    ctx.strokeStyle = `rgba(255,110,0,${.3 + p * .5})`; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(px + CELL / 2, py + CELL / 2, CELL * .7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = `rgba(255,150,0,${.55 + p * .45})`;
    ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
    ctx.fillText('⚠', px + CELL / 2, py + CELL / 2 + 4);
  });
}

function drawExplosions() {
  explosions.forEach(e => {
    const p = 1 - e.l / e.ml;
    const cx = e.col * CELL + CELL / 2, cy = e.row * CELL + CELL / 2;
    ctx.globalAlpha = 1 - p * 0.2;
    ctx.fillStyle = '#FF8800';
    ctx.beginPath(); ctx.arc(cx, cy, 14 + p * 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFCC22';
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawSoldier(col, row, isHead, isP, damaged) {
  const px = col * CELL, py = row * CELL, cx = px + CELL / 2;
  const bodyCol = isP ? '#4A6A28' : '#5A2828';
  const bodyDk = isP ? '#2E4218' : '#3A1818';
  ctx.fillStyle = bodyDk;
  ctx.fillRect(cx - 5, py + CELL - 8, 3, 6);
  ctx.fillRect(cx + 2, py + CELL - 8, 3, 6);
  ctx.fillStyle = bodyCol;
  ctx.fillRect(cx - 6, py + 12, 12, 10);
  ctx.fillStyle = '#C89870';
  ctx.fillRect(cx - 4, py + 5, 8, 7);
  ctx.fillStyle = isP ? '#3A5418' : '#2A1010';
  ctx.fillRect(cx - 5, py + 3, 10, 4);
  if (isHead) {
    ctx.strokeStyle = isP ? 'rgba(255,220,80,.65)' : 'rgba(255,80,60,.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
  }
  if (damaged) {
    ctx.fillStyle = 'rgba(200,30,20,.35)';
    ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
  }
}

function drawUnits() {
  if (E && E.alive) {
    if (E.mode === 'snake') {
      E.tail.forEach(t => drawSoldier(t.col, t.row, false, false));
      drawSoldier(E.col, E.row, true, false, E.hp < 2);
    } else drawSoldier(E.col, E.row, true, false);
  }
  if (P && P.alive) {
    if (P.mode === 'snake') {
      P.tail.forEach(t => drawSoldier(t.col, t.row, false, true));
      drawSoldier(P.col, P.row, true, true, P.hp < 2);
    } else drawSoldier(P.col, P.row, true, true);
  }
  graves.forEach(g => {
    const a = Math.min(1, g.life / 1500);
    ctx.globalAlpha = a;
    const cx = g.col * CELL + CELL / 2, cy = g.row * CELL + CELL / 2;
    ctx.fillStyle = '#3A2A18';
    ctx.fillRect(cx - 1, cy - 6, 2, 12);
    ctx.fillRect(cx - 5, cy - 2, 10, 2);
    ctx.globalAlpha = 1;
  });
}

// Отрисовка боевых юнитов
function drawArmies() {
  playerArmy.forEach(u => drawBattleUnit(u));
  enemyArmy.forEach(u => drawBattleUnit(u));
}

function drawBattleUnit(u) {
  const px = u.col * CELL, py = u.row * CELL, cx = px + CELL / 2;
  // Тело
  ctx.fillStyle = u.isP ? '#4A6A28' : '#5A2828';
  ctx.fillRect(cx - 6, py + 10, 12, 12);
  // Голова
  ctx.fillStyle = '#C89870';
  ctx.fillRect(cx - 4, py + 4, 8, 6);
  // Каска
  ctx.fillStyle = u.isP ? '#3A5418' : '#2A1010';
  ctx.fillRect(cx - 5, py + 2, 10, 3);
  // Винтовка
  ctx.fillStyle = '#1A1208';
  ctx.fillRect(cx + 5, py + 11, 2, 9);
  // HP-бар
  const w = 16;
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - w / 2, py + CELL - 5, w, 3);
  ctx.fillStyle = u.isP ? '#88DD44' : '#DD4444';
  ctx.fillRect(cx - w / 2 + 1, py + CELL - 4, (w - 2) * (u.hp / u.maxHp), 1);
}

// HUD боя
function drawBattleHUD() {
  // Счётчики армий вверху
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(BASE_C * CELL + 5, 30, FIELD_C * CELL - 10, 16);
  ctx.fillStyle = '#88DD44'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'left';
  ctx.fillText('🟢 ' + playerArmy.length, BASE_C * CELL + 12, 42);
  ctx.fillStyle = '#DD4444'; ctx.textAlign = 'right';
  ctx.fillText(enemyArmy.length + ' 🔴', (BASE_C + FIELD_C) * CELL - 12, 42);
}

function drawFX() {
  fx = fx.filter(f => { f.life -= 16; return f.life > 0; });
  fx.forEach(f => {
    const a = f.life / f.ml; ctx.globalAlpha = a;
    ctx.fillStyle = f.col; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'center';
    ctx.fillText(f.txt, f.x, f.y - (1 - a) * 20); ctx.globalAlpha = 1;
  });
}

function drawVignette() {
  if (state !== S.ECONOMY || !P || !P.alive || P.hp > 1) return;
  const pulse = 0.3 + 0.2 * Math.sin(frameCount / 6);
  const g = ctx.createRadialGradient(CW / 2, CH / 2, Math.min(CW, CH) * 0.3, CW / 2, CH / 2, Math.max(CW, CH) * 0.7);
  g.addColorStop(0, 'rgba(180,20,10,0)');
  g.addColorStop(1, `rgba(140,10,5,${pulse * 0.8})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
}

function drawHUD() {
  if (state !== S.ECONOMY) return;
  if (!P || !P.alive || P.mode !== 'snake') return;
  const fxPx = BASE_C * CELL;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(fxPx + 3, 50, 220, 18);
  ctx.fillStyle = P.carry > 0 ? '#FFD700' : '#3A5A28';
  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left';
  ctx.fillText(P.carry > 0 ? `📦 ${P.carry} — вернись на базу!` : '📦 рюкзак пуст', fxPx + 8, 62);
}

// Большой оверлей фазы (LOCK / BATTLE_INIT / RESOLVE / ROUND_END)
function drawPhaseOverlay() {
  if (state === S.ECONOMY || state === S.BATTLE) return;
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(BASE_C * CELL, CH / 2 - 40, FIELD_C * CELL, 80);
  ctx.textAlign = 'center';
  if (state === S.LOCK) {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 20px Courier New';
    ctx.fillText('⏱ ВРЕМЯ ВЫШЛО', CW / 2, CH / 2 - 5);
    ctx.fillStyle = '#AAA'; ctx.font = '10px Courier New';
    ctx.fillText('подготовка к бою...', CW / 2, CH / 2 + 15);
  } else if (state === S.BATTLE_INIT) {
    ctx.fillStyle = '#FF6644'; ctx.font = 'bold 22px Courier New';
    ctx.fillText('⚔ БОЙ ⚔', CW / 2, CH / 2 + 5);
  } else if (state === S.RESOLVE || state === S.ROUND_END) {
    if (winner === 'player') {
      ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px Courier New';
      ctx.fillText('🏆 ПОБЕДА', CW / 2, CH / 2 - 5);
      ctx.fillStyle = '#AAA'; ctx.font = '10px Courier New';
      ctx.fillText('следующий раунд...', CW / 2, CH / 2 + 15);
    } else {
      ctx.fillStyle = '#FF3333'; ctx.font = 'bold 22px Courier New';
      ctx.fillText('☠ ПОРАЖЕНИЕ', CW / 2, CH / 2 - 5);
      ctx.fillStyle = '#AAA'; ctx.font = '10px Courier New';
      ctx.fillText('перезапуск...', CW / 2, CH / 2 + 15);
    }
  }
}
