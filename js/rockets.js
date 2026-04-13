// === РАКЕТЫ (ФАЗА 2) ===

let rocketTimer = 0;
let rocketCooldown = 10000;
let currentTurn = 'player';      // 'player' | 'enemy'
let rocketTargeting = false;     // ждём клик игрока для запуска
let activeRockets = [];          // летящие ракеты
let ROCKET_DAMAGE = 50;
const ROCKET_RADIUS = 3;

function resetRockets() {
  rocketTimer = 0;
  currentTurn = 'player';
  rocketTargeting = false;
  activeRockets = [];
}

function updateRockets(dt) {
  rocketTimer += dt;

  // Летящие ракеты
  activeRockets.forEach(r => {
    r.progress += dt / r.duration;
    if (r.progress >= 1) {
      r.progress = 1;
      detonateRocket(r);
      r.done = true;
    }
  });
  activeRockets = activeRockets.filter(r => !r.done);

  // Внеочередной выстрел врага (20% шанс каждые 5с когда очередь игрока)
  if (currentTurn === 'player' && !rocketTargeting && rocketTimer > 5000 && Math.random() < 0.0004) {
    fireEnemyRocket();
    rocketTimer = 0;
    return;
  }

  if (rocketTimer >= rocketCooldown) {
    rocketTimer = 0;
    if (currentTurn === 'player') {
      rocketTargeting = true;
      addFx(CW / 2, 60, '🎯 ВЫБЕРИ ЦЕЛЬ КЛИКОМ', '#FFAA00', 3000);
      currentTurn = 'enemy';
    } else {
      fireEnemyRocket();
      currentTurn = 'player';
    }
  }
}

function firePlayerRocket(col, row) {
  activeRockets.push({
    fromCol: 2, fromRow: ROWS >> 1,
    toCol: col, toRow: row,
    progress: 0, duration: 800,
    isP: true, done: false,
  });
  rocketTargeting = false;
}

function fireEnemyRocket() {
  // ИИ цели: центр массы армии игрока (если есть), иначе база
  let tCol, tRow;
  if (playerArmy.length > 0) {
    let sc = 0, sr = 0;
    playerArmy.forEach(u => { sc += u.col; sr += u.row; });
    tCol = Math.round(sc / playerArmy.length);
    tRow = Math.round(sr / playerArmy.length);
  } else {
    tCol = 3; tRow = ROWS >> 1;
  }
  activeRockets.push({
    fromCol: TC - 3, fromRow: ROWS >> 1,
    toCol: tCol, toRow: tRow,
    progress: 0, duration: 800,
    isP: false, done: false,
  });
}

function detonateRocket(r) {
  // AoE урон всем юнитам в радиусе
  const hitUnits = u => {
    if (!u.alive) return;
    const d = Math.abs(u.col - r.toCol) + Math.abs(u.row - r.toRow);
    if (d <= ROCKET_RADIUS) {
      u.hp -= ROCKET_DAMAGE;
      if (u.hp <= 0) u.alive = false;
    }
  };
  playerArmy.forEach(hitUnits);
  enemyArmy.forEach(hitUnits);

  // Большой взрыв + экранная тряска через fx
  for (let i = 0; i < 6; i++) {
    explosions.push({
      col: r.toCol + (Math.random() * 3 - 1.5),
      row: r.toRow + (Math.random() * 3 - 1.5),
      l: 700, ml: 700,
    });
  }
  addFx(r.toCol * CELL + CELL / 2, r.toRow * CELL, '💥 BOOM', '#FF4400', 1500);
}

function handleBattleClick(mx, my) {
  if (state !== S.BATTLE || !rocketTargeting) return false;
  const col = Math.floor(mx / CELL);
  const row = Math.floor(my / CELL);
  if (col >= BASE_C && col < BASE_C + FIELD_C && row >= 0 && row < ROWS) {
    firePlayerRocket(col, row);
    return true;
  }
  return false;
}
