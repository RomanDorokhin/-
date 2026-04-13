// === ФАЗА 2: БОЙ ===

// Заморозить экономику, очистить поле
function lockEconomy() {
  items = [];
  hazards = [];
  if (P) { P.tail = []; P.carry = 0; P.mode = 'base'; }
  if (E) { E.tail = []; E.carry = 0; E.mode = 'base'; }
}

// Превратить ресурсы и рекрутов в боевую армию
function buildArmies() {
  playerArmy = [];
  enemyArmy = [];

  // Игрок: количество = soldiers + бонус от ресурсов (1 юнит на 30 res)
  const pCount = Math.max(1, P.soldiers + Math.floor(P.res / 30));
  for (let i = 0; i < pCount; i++) {
    const col = BASE_C + 2 + (i % 3);
    const row = 4 + Math.floor(i / 3);
    if (row < ROWS - 2) playerArmy.push(mkBattleUnit(col, row, true, 1));
  }

  // Враг: масштабируется от номера раунда + от того что собрал
  const eCount = Math.max(1, E.soldiers + Math.floor(E.res / 30) + roundNum);
  for (let i = 0; i < eCount; i++) {
    const col = BASE_C + FIELD_C - 3 - (i % 3);
    const row = 4 + Math.floor(i / 3);
    if (row < ROWS - 2) enemyArmy.push(mkBattleUnit(col, row, false, 1));
  }

  playerBaseHP = BASE_HP_MAX;
  enemyBaseHP = BASE_HP_MAX;
  infantryTimer = 0;
  baseTimer = 0;
  winner = null;
}

// Дистанция между двумя юнитами
function dist(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

// Найти ближайшую цель
function findNearest(unit, enemies) {
  let best = null, bd = 9999;
  enemies.forEach(e => {
    if (!e.alive) return;
    const d = dist(unit, e);
    if (d < bd) { bd = d; best = e; }
  });
  return best;
}

// Шаг к цели
function stepToward(unit, target) {
  const dc = target.col - unit.col;
  const dr = target.row - unit.row;
  if (Math.abs(dc) > Math.abs(dr)) unit.col += Math.sign(dc);
  else if (dr !== 0) unit.row += Math.sign(dr);
  else if (dc !== 0) unit.col += Math.sign(dc);
}

// Тик пехоты — каждую секунду
function updateInfantry(dt) {
  infantryTimer += dt;
  if (infantryTimer < 1000) return;
  infantryTimer = 0;

  // Игрок атакует
  playerArmy.forEach(u => {
    if (!u.alive) return;
    const t = findNearest(u, enemyArmy);
    if (!t) return;
    if (dist(u, t) <= u.range) {
      t.hp -= u.power;
      if (t.hp <= 0) {
        t.alive = false;
        explosions.push({ col: t.col, row: t.row, l: 500, ml: 500 });
      }
    } else {
      stepToward(u, t);
    }
  });

  // Враг атакует
  enemyArmy.forEach(u => {
    if (!u.alive) return;
    const t = findNearest(u, playerArmy);
    if (!t) return;
    if (dist(u, t) <= u.range) {
      t.hp -= u.power;
      if (t.hp <= 0) {
        t.alive = false;
        explosions.push({ col: t.col, row: t.row, l: 500, ml: 500 });
      }
    } else {
      stepToward(u, t);
    }
  });

  // Чистка трупов
  playerArmy = playerArmy.filter(u => u.alive);
  enemyArmy = enemyArmy.filter(u => u.alive);
}

// Тик базы — каждые 2 секунды
function updateBaseExchange(dt) {
  baseTimer += dt;
  if (baseTimer < 2000) return;
  baseTimer = 0;

  playerBaseHP -= enemyArmy.length * 2;
  enemyBaseHP -= playerArmy.length * 2;

  if (playerBaseHP < 0) playerBaseHP = 0;
  if (enemyBaseHP < 0) enemyBaseHP = 0;
}

// Проверка победы
function checkVictory() {
  if (enemyBaseHP <= 0 && winner === null) { winner = 'player'; return true; }
  if (playerBaseHP <= 0 && winner === null) { winner = 'enemy'; return true; }
  // Тупик: обе армии уничтожены и базы целы → ничья по большему HP
  if (playerArmy.length === 0 && enemyArmy.length === 0 && winner === null) {
    winner = playerBaseHP >= enemyBaseHP ? 'player' : 'enemy';
    return true;
  }
  return false;
}

// Подготовка к новому раунду
function startNextRound() {
  roundNum++;
  // Сохраняем накопленные ресурсы и бойцов между раундами
  // (P.res и P.soldiers не сбрасываем — они переносятся)
  state = S.ECONOMY;
  econTimer = ECON_DURATION;
  // Перегенерация поля
  items = []; hazards = [];
  for (let i = 0; i < 18; i++) spawnItem();
  spawnHaz(); spawnHaz();
  // Восстановление позиций
  if (P) { P.col = 2; P.row = ROWS >> 1; P.mode = 'base'; P.tail = []; P.carry = 0; P.alive = true; P.hp = 2; }
  if (E) { E.col = TC - 3; E.row = ROWS >> 1; E.mode = 'base'; E.tail = []; E.carry = 0; E.alive = true; E.hp = 2; }
  playerArmy = [];
  enemyArmy = [];
}
