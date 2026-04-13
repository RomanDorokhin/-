// === ФАЗА 3: МОРСКОЙ БОЙ ===

function navalLayout() {
  return placementLayout(); // та же геометрия что и расстановка
}

function startNaval() {
  state = S.NAVAL;
  navalTurn = NAVAL_TURN.PLAYER;
  navalTurnTimer = 0;
  addFx(CW / 2, CH / 2 - 30, '⚔ МОРСКОЙ БОЙ ⚔', '#FF6644', 1800);
}

function handleNavalClick(mx, my) {
  if (navalTurn !== NAVAL_TURN.PLAYER) return;
  const L = navalLayout();
  // Клик по сетке врага
  if (mx >= L.enemyX && mx < L.enemyX + L.gridPx && my >= L.y && my < L.y + L.gridPx) {
    const col = Math.floor((mx - L.enemyX) / L.cellSize);
    const row = Math.floor((my - L.y) / L.cellSize);
    if (col < 0 || col >= GRID || row < 0 || row >= GRID) return;
    if (playerShots[row][col] !== 0) return; // уже стреляли сюда

    const hit = enemyGrid[row][col] === 1;
    playerShots[row][col] = hit ? 2 : 1;
    if (hit) {
      enemyGrid[row][col] = 0;
      addFx(L.enemyX + col * L.cellSize + L.cellSize / 2, L.y + row * L.cellSize, '💥', '#FF4400', 900);
    } else {
      addFx(L.enemyX + col * L.cellSize + L.cellSize / 2, L.y + row * L.cellSize, '·', '#888', 600);
    }

    if (checkNavalVictory()) return;

    navalTurn = NAVAL_TURN.ENEMY;
    navalTurnTimer = ENEMY_SHOT_DELAY;
  }
}

function updateNaval(dt) {
  if (navalTurn === NAVAL_TURN.ENEMY) {
    navalTurnTimer -= dt;
    if (navalTurnTimer <= 0) {
      enemyShoot();
      if (!checkNavalVictory()) navalTurn = NAVAL_TURN.PLAYER;
    }
  }
}

function enemyShoot() {
  // Простой ИИ: если есть попадание рядом с неисследованным — добиваем
  let target = null;

  // 1. Ищем попадание в прошлом ходе и добиваем соседей
  outer:
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (enemyShots[r][c] === 2) {
        const nbrs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of nbrs) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) continue;
          if (enemyShots[nr][nc] === 0) {
            target = { row: nr, col: nc };
            break outer;
          }
        }
      }
    }
  }

  // 2. Иначе — случайная неисследованная клетка
  if (!target) {
    const empty = [];
    for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) {
      if (enemyShots[r][c] === 0) empty.push({ row: r, col: c });
    }
    if (empty.length === 0) return;
    target = empty[Math.floor(Math.random() * empty.length)];
  }

  const hit = playerGrid[target.row][target.col] === 1;
  enemyShots[target.row][target.col] = hit ? 2 : 1;
  if (hit) {
    playerGrid[target.row][target.col] = 0;
    const L = navalLayout();
    addFx(L.playerX + target.col * L.cellSize + L.cellSize / 2, L.y + target.row * L.cellSize, '💥', '#FF4400', 900);
  }
}

function checkNavalVictory() {
  const enemyLeft = countSoldiers(enemyGrid);
  const playerLeft = countSoldiers(playerGrid);
  if (enemyLeft === 0) {
    winner = 'player';
    state = S.ROUND_END;
    stateTimer = 2800;
    addFx(CW / 2, CH / 2, '🏆 ПОБЕДА В РАУНДЕ', '#FFD700', 2500);
    return true;
  }
  if (playerLeft === 0) {
    winner = 'enemy';
    state = S.ROUND_END;
    stateTimer = 2800;
    addFx(CW / 2, CH / 2, '☠ ПОРАЖЕНИЕ', '#FF3333', 2500);
    return true;
  }
  return false;
}
