// === ФАЗА 2: РАССТАНОВКА БОЙЦОВ НА СЕТКЕ 10x10 ===

// Параметры сетки на экране
// Две сетки бок-о-бок по центру канваса, каждая GRID*CELL
function placementLayout() {
  const cellSize = 24;
  const gridPx = GRID * cellSize;
  const gap = 40;
  const total = gridPx * 2 + gap;
  const startX = (CW - total) / 2;
  const y = (CH - gridPx) / 2 + 10;
  return {
    cellSize,
    gridPx,
    playerX: startX,
    enemyX: startX + gridPx + gap,
    y,
  };
}

function initPlacement() {
  // Создаём пустые сетки
  playerGrid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  enemyGrid  = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  playerShots = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  enemyShots  = Array.from({ length: GRID }, () => Array(GRID).fill(0));

  // Сколько бойцов дают игроку
  const earned = calcSoldiers(P) + bankedSoldiers;
  soldiersToPlace = Math.min(MAX_SOLDIERS, earned);
  // Излишек в банк
  bankedSoldiers = Math.max(0, earned - MAX_SOLDIERS);

  // Обнуляем у юнита (ресурсы "потрачены" на армию)
  P.res = 0;
  P.soldiers = 0;

  placementReady = false;
  enemyPlaced = false;

  // Враг сразу расставляет своих
  aiPlaceEnemy();

  placeTimer = PLACE_DURATION;
}

function aiPlaceEnemy() {
  const earned = calcSoldiers(E) + Math.floor(roundNum * 1.5); // небольшой бонус врагу за раунд
  const count = Math.min(MAX_SOLDIERS, Math.max(3, earned));
  let placed = 0;
  let tries = 0;
  while (placed < count && tries < 500) {
    tries++;
    const r = Math.floor(Math.random() * GRID);
    const c = Math.floor(Math.random() * GRID);
    if (enemyGrid[r][c] === 0) {
      enemyGrid[r][c] = 1;
      placed++;
    }
  }
  E.res = 0; E.soldiers = 0;
  enemyPlaced = true;
}

// Клик по сетке игрока — поставить/убрать бойца
function handlePlacementClick(mx, my) {
  const L = placementLayout();
  // Попадание в свою сетку
  if (mx >= L.playerX && mx < L.playerX + L.gridPx && my >= L.y && my < L.y + L.gridPx) {
    const col = Math.floor((mx - L.playerX) / L.cellSize);
    const row = Math.floor((my - L.y) / L.cellSize);
    if (col < 0 || col >= GRID || row < 0 || row >= GRID) return;

    if (playerGrid[row][col] === 1) {
      // Убрать
      playerGrid[row][col] = 0;
      soldiersToPlace++;
    } else if (soldiersToPlace > 0) {
      playerGrid[row][col] = 1;
      soldiersToPlace--;
    }
    return;
  }

  // Кнопка "ГОТОВ"
  const bx = CW / 2 - 60, by = L.y + L.gridPx + 14, bw = 120, bh = 26;
  if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) {
    finishPlacement();
  }
}

function finishPlacement() {
  placementReady = true;
  // Банк: всё что не поставлено — в банк
  bankedSoldiers += soldiersToPlace;
  soldiersToPlace = 0;
}

function updatePlacement(dt) {
  placeTimer -= dt;
  if (placeTimer <= 0 && !placementReady) {
    finishPlacement();
  }
  if (placementReady && enemyPlaced) {
    // Переход в морской бой
    startNaval();
  }
}

function countSoldiers(grid) {
  let n = 0;
  for (let r = 0; r < GRID; r++) for (let c = 0; c < GRID; c++) if (grid[r][c] === 1) n++;
  return n;
}
