// === ОТРИСОВКА v5 ===

function render() {
  frameCount++;
  ctx.fillStyle = '#020804'; ctx.fillRect(0, 0, CW, CH);

  if (state === S.ECONOMY) {
    drawBases();
    drawField();
    drawItems();
    drawHazards();
    drawNukeWarnings();
    drawExplosions();
    drawUnits();
    drawFX();
    drawVignette();
    drawTimer();
    drawHUD();
  } else if (state === S.PLACEMENT) {
    drawPlacementScreen();
    drawFX();
    drawTimer();
  } else if (state === S.NAVAL) {
    drawNavalScreen();
    drawFX();
    drawTimer();
  } else if (state === S.ROUND_END) {
    drawNavalScreen();
    drawFX();
    drawTimer();
    drawRoundEndOverlay();
  }
}

// ===== ТАЙМЕР / ФАЗА =====

function drawTimer() {
  const cx = CW / 2;
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(cx - 80, 4, 160, 22);
  ctx.fillStyle = '#C8A000'; ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('РАУНД ' + roundNum, cx, 14);

  let label = '', sec = 0, col = '#FFAA00';
  if (state === S.ECONOMY) {
    sec = Math.max(0, Math.ceil(econTimer / 1000));
    col = sec <= 10 ? '#FF4444' : sec <= 20 ? '#FFAA00' : '#88FF44';
    label = 'СБОР ' + sec + 'с';
  } else if (state === S.PLACEMENT) {
    sec = Math.max(0, Math.ceil(placeTimer / 1000));
    col = sec <= 10 ? '#FF4444' : '#FFAA00';
    label = 'РАССТАНОВКА ' + sec + 'с';
  } else if (state === S.NAVAL) {
    label = navalTurn === NAVAL_TURN.PLAYER ? '⚔ ТВОЙ ХОД' : '⚔ ХОД ВРАГА';
    col = navalTurn === NAVAL_TURN.PLAYER ? '#88FF44' : '#FF6644';
  } else if (state === S.ROUND_END) {
    label = winner === 'player' ? '🏆 ПОБЕДА' : '☠ ПОРАЖЕНИЕ';
    col = winner === 'player' ? '#FFD700' : '#FF3333';
  }
  ctx.fillStyle = col; ctx.font = 'bold 11px Courier New';
  ctx.fillText(label, cx, 24);
}

// ===== ФАЗА 1 — сбор =====

function drawBases() {
  const pw = BASE_C * CELL, ew = BASE_C * CELL, ex = (BASE_C + FIELD_C) * CELL;
  const gl = ctx.createLinearGradient(0, 0, pw, 0);
  gl.addColorStop(0, '#030B04'); gl.addColorStop(1, '#071508');
  ctx.fillStyle = gl; ctx.fillRect(0, 0, pw, CH);
  const gr = ctx.createLinearGradient(ex, 0, ex + ew, 0);
  gr.addColorStop(0, '#0E0505'); gr.addColorStop(1, '#060303');
  ctx.fillStyle = gr; ctx.fillRect(ex, 0, ew, CH);

  ctx.fillStyle = '#1C380E'; ctx.fillRect(pw - 10, 0, 10, CH);
  ctx.fillStyle = '#341010'; ctx.fillRect(ex, 0, 10, CH);

  // Двери
  const d0 = DOOR[0] * CELL, dH = DOOR.length * CELL;
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 480);
  ctx.fillStyle = '#050E04'; ctx.fillRect(pw - 10, d0, 10, dH);
  ctx.strokeStyle = `rgba(60,200,40,${0.4 + 0.3 * pulse})`; ctx.lineWidth = 2;
  ctx.strokeRect(pw - 9, d0 + 1, 7, dH - 2);
  ctx.fillStyle = '#100505'; ctx.fillRect(ex, d0, 10, dH);
  ctx.strokeStyle = `rgba(200,50,50,0.45)`;
  ctx.strokeRect(ex + 1, d0 + 1, 7, dH - 2);

  // Заголовки и ресурсы
  ctx.fillStyle = '#325A22'; ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('▌ ТВОЯ БАЗА ▐', pw / 2, 44);
  ctx.fillStyle = '#5A2020';
  ctx.fillText('▌ ВРАГ ▐', ex + ew / 2, 44);

  ctx.fillStyle = '#4A7830'; ctx.font = '8px Courier New'; ctx.fillText('РЕСУРСЫ', pw / 2, 64);
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 22px Courier New'; ctx.fillText(P ? P.res : 0, pw / 2, 88);
  if (P && P.carry > 0) {
    ctx.fillStyle = '#88CC44'; ctx.font = '8px Courier New';
    ctx.fillText('+' + P.carry + ' рюкзак', pw / 2, 102);
  }

  ctx.fillStyle = '#4A7830'; ctx.font = '8px Courier New'; ctx.fillText('РЕКРУТЫ', pw / 2, 122);
  ctx.fillStyle = '#8AB870'; ctx.font = 'bold 10px Courier New';
  ctx.fillText((P ? P.soldiers : 0), pw / 2, 136);

  // Превью армии
  const preview = P ? calcSoldiers(P) + bankedSoldiers : 0;
  ctx.fillStyle = '#4A7830'; ctx.font = '8px Courier New'; ctx.fillText('АРМИЯ В БОЮ', pw / 2, 156);
  ctx.fillStyle = '#FFDD44'; ctx.font = 'bold 12px Courier New';
  ctx.fillText(Math.min(MAX_SOLDIERS, preview) + (preview > MAX_SOLDIERS ? ' (+' + (preview - MAX_SOLDIERS) + ')' : ''), pw / 2, 170);
  if (bankedSoldiers > 0) {
    ctx.fillStyle = '#888'; ctx.font = '7px Courier New';
    ctx.fillText('банк: ' + bankedSoldiers, pw / 2, 182);
  }

  // Враг
  ctx.fillStyle = 'rgba(90,30,30,.7)'; ctx.font = '8px Courier New';
  ctx.fillText('РЕСУРСЫ', ex + ew / 2, 64);
  ctx.fillStyle = '#FF6040'; ctx.font = 'bold 22px Courier New';
  ctx.fillText(E ? E.res : 0, ex + ew / 2, 88);
  ctx.fillStyle = 'rgba(90,30,30,.7)'; ctx.font = '8px Courier New';
  ctx.fillText('РЕКРУТЫ', ex + ew / 2, 122);
  ctx.fillStyle = '#DD8870'; ctx.font = 'bold 10px Courier New';
  ctx.fillText((E ? E.soldiers : 0), ex + ew / 2, 136);

  // Подсказки
  ctx.fillStyle = '#2A4018'; ctx.font = '7px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('WASD — движение', pw / 2, CH - 24);
  ctx.fillText('R — рестарт', pw / 2, CH - 12);
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
  ctx.fillRect(cx - 5, py + 3, 10, 3);
  if (isHead) {
    ctx.strokeStyle = isP ? '#88FF44' : '#FF6644';
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
  if (state !== S.ECONOMY || !P || !P.alive || P.mode !== 'snake') return;
  const fxPx = BASE_C * CELL;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(fxPx + 3, 62, 220, 18);
  ctx.fillStyle = P.carry > 0 ? '#FFD700' : '#3A5A28';
  ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'left';
  ctx.fillText(P.carry > 0 ? `📦 ${P.carry} — вернись на базу!` : '📦 рюкзак пуст', fxPx + 8, 74);
}

// ===== ФАЗА 2 — РАССТАНОВКА =====

function drawPlacementScreen() {
  ctx.fillStyle = '#050A05'; ctx.fillRect(0, 0, CW, CH);

  ctx.fillStyle = '#C8A000'; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('РАССТАВЬ БОЙЦОВ НА СВОЕЙ СЕТКЕ', CW / 2, 50);

  const L = placementLayout();

  // Твоя сетка (открытая)
  drawGrid(L.playerX, L.y, L.cellSize, playerGrid, null, true, 'ТВОЯ СЕТКА', '#88DD44');
  // Вражеская (скрытая — показываем туман)
  drawGrid(L.enemyX, L.y, L.cellSize, null, null, false, 'ВРАГ (закрыта)', '#DD4444');

  // Счётчик
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('Осталось поставить: ' + soldiersToPlace, CW / 2, L.y - 18);

  // Кнопка ГОТОВ
  const bx = CW / 2 - 60, by = L.y + L.gridPx + 14, bw = 120, bh = 26;
  const ready = soldiersToPlace === 0;
  const pulse = 0.5 + 0.5 * Math.sin(frameCount / 6);
  ctx.fillStyle = ready ? `rgba(40,180,60,${0.75 + 0.2 * pulse})` : 'rgba(60,60,60,.7)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = ready ? '#88FF88' : '#555'; ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = ready ? '#FFEE88' : '#999';
  ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('✓ ГОТОВ', CW / 2, by + 17);

  // Подсказка
  ctx.fillStyle = '#555'; ctx.font = '9px Courier New';
  ctx.fillText('клик по клетке — поставить/убрать', CW / 2, by + bh + 16);
}

function drawGrid(x, y, cs, ownGrid, shots, showSoldiers, label, labelColor) {
  // Фон
  ctx.fillStyle = '#0A1408';
  ctx.fillRect(x, y, cs * GRID, cs * GRID);
  // Сетка
  ctx.strokeStyle = '#1C380E'; ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(x + i * cs, y); ctx.lineTo(x + i * cs, y + GRID * cs); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + i * cs); ctx.lineTo(x + GRID * cs, y + i * cs); ctx.stroke();
  }
  // Бойцы
  if (ownGrid && showSoldiers) {
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      if (ownGrid[r][c] === 1) {
        const px = x + c * cs, py = y + r * cs;
        ctx.fillStyle = '#4A6A28';
        ctx.fillRect(px + 4, py + 4, cs - 8, cs - 8);
        ctx.fillStyle = '#C89870';
        ctx.fillRect(px + cs / 2 - 3, py + 5, 6, 5);
      }
    }
  }
  // Лейбл
  ctx.fillStyle = labelColor; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
  ctx.fillText(label, x + GRID * cs / 2, y - 5);
}

// ===== ФАЗА 3 — МОРСКОЙ БОЙ =====

function drawNavalScreen() {
  ctx.fillStyle = '#050A05'; ctx.fillRect(0, 0, CW, CH);

  const L = navalLayout();

  // Заголовок
  ctx.fillStyle = '#C8A000'; ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('МОРСКОЙ БОЙ', CW / 2, 50);

  // Твоя сетка — полностью видна, показываем попадания врага
  drawGrid(L.playerX, L.y, L.cellSize, playerGrid, enemyShots, true, 'ТВОЁ ПОЛЕ', '#88DD44');
  drawShots(L.playerX, L.y, L.cellSize, enemyShots, playerGrid);

  // Вражеская — туман, показываем только твои выстрелы
  drawGrid(L.enemyX, L.y, L.cellSize, null, playerShots, false, 'ПОЛЕ ВРАГА', '#DD4444');
  drawShots(L.enemyX, L.y, L.cellSize, playerShots, null);

  // Счётчики
  ctx.fillStyle = '#88DD44'; ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
  ctx.fillText('осталось: ' + countSoldiers(playerGrid), L.playerX + L.gridPx / 2, L.y + L.gridPx + 18);
  ctx.fillStyle = '#DD4444';
  const enemyCount = countRemainingEnemy();
  ctx.fillText('осталось: ' + enemyCount, L.enemyX + L.gridPx / 2, L.y + L.gridPx + 18);

  // Курсор-подсказка
  if (state === S.NAVAL && navalTurn === NAVAL_TURN.PLAYER) {
    ctx.fillStyle = '#FFDD44'; ctx.font = 'bold 11px Courier New';
    ctx.fillText('🎯 КЛИКНИ ПО ВРАЖЕСКОМУ ПОЛЮ', CW / 2, L.y + L.gridPx + 38);
  } else if (state === S.NAVAL) {
    ctx.fillStyle = '#FF6644'; ctx.font = 'bold 11px Courier New';
    ctx.fillText('...враг прицеливается...', CW / 2, L.y + L.gridPx + 38);
  }
}

function countRemainingEnemy() {
  // Мы знаем только попадания — это клетки где playerShots=2
  // Но "осталось" это неизвестно игроку. Покажем сколько уже убил.
  let hits = 0;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
    if (playerShots[r][c] === 2) hits++;
  }
  return '?' + (hits > 0 ? ' (убил ' + hits + ')' : '');
}

function drawShots(x, y, cs, shots, ownGrid) {
  if (!shots) return;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
    const s = shots[r][c];
    if (s === 0) continue;
    const px = x + c * cs, py = y + r * cs;
    if (s === 1) {
      // промах — серая точка
      ctx.fillStyle = 'rgba(120,120,120,.6)';
      ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
      ctx.fillStyle = '#888';
      ctx.beginPath(); ctx.arc(px + cs / 2, py + cs / 2, 2, 0, Math.PI * 2); ctx.fill();
    } else if (s === 2) {
      // попадание — красный крест
      ctx.fillStyle = 'rgba(200,40,20,.5)';
      ctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
      ctx.strokeStyle = '#FF4400'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 4); ctx.lineTo(px + cs - 4, py + cs - 4);
      ctx.moveTo(px + cs - 4, py + 4); ctx.lineTo(px + 4, py + cs - 4);
      ctx.stroke();
    }
  }
}

function drawRoundEndOverlay() {
  ctx.fillStyle = 'rgba(0,0,0,.7)';
  ctx.fillRect(0, CH / 2 - 50, CW, 100);
  ctx.textAlign = 'center';
  if (winner === 'player') {
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 26px Courier New';
    ctx.fillText('🏆 ПОБЕДА В РАУНДЕ', CW / 2, CH / 2);
    ctx.fillStyle = '#AAA'; ctx.font = '11px Courier New';
    ctx.fillText('следующий раунд...', CW / 2, CH / 2 + 22);
  } else {
    ctx.fillStyle = '#FF3333'; ctx.font = 'bold 26px Courier New';
    ctx.fillText('☠ ПОРАЖЕНИЕ', CW / 2, CH / 2);
    ctx.fillStyle = '#AAA'; ctx.font = '11px Courier New';
    ctx.fillText('перезапуск с первого раунда...', CW / 2, CH / 2 + 22);
  }
}
