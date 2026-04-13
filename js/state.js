// === ГЛОБАЛЬНОЕ СОСТОЯНИЕ v5 ===
let canvas, ctx;
let P, E, running = false;
let items = [], hazards = [], explosions = [], fx = [], graves = [];
let itemT = 0, hazT = 0, aiT = 0, last = -1;
let crashed = false;
let frameCount = 0;

// === STATE MACHINE (v5) ===
const S = {
  ECONOMY:   'economy',    // Фаза 1: змейка + сбор + ядерка
  PLACEMENT: 'placement',  // Фаза 2: расстановка на сетку 10x10
  NAVAL:     'naval',      // Фаза 3: морской бой по ходам
  ROUND_END: 'round_end',  // переход к новому раунду
};
let state = S.ECONOMY;
let stateTimer = 0;

// Фаза 1
const ECON_DURATION = 60000;
let econTimer = ECON_DURATION;

// Фаза 2
const PLACE_DURATION = 60000;
let placeTimer = PLACE_DURATION;

// Раунды
let roundNum = 1;
let winner = null; // 'player' | 'enemy' | null

// Банк переноса бойцов между раундами
let bankedSoldiers = 0;

// === СЕТКИ МОРСКОГО БОЯ ===
const GRID = 10;                    // 10x10
const MAX_SOLDIERS = 25;            // макс бойцов на сетке
let playerGrid = null;              // [row][col] = 0|1 (есть боец / нет)
let enemyGrid  = null;
let playerShots = null;             // выстрелы игрока по enemyGrid: 0=нет, 1=промах, 2=попадание
let enemyShots  = null;             // выстрелы врага по playerGrid
let soldiersToPlace = 0;            // сколько осталось поставить
let placementReady = false;         // игрок нажал "ГОТОВ"
let enemyPlaced = false;            // враг расставил

// Морской бой
const NAVAL_TURN = { PLAYER: 'player', ENEMY: 'enemy' };
let navalTurn = NAVAL_TURN.PLAYER;
let navalTurnTimer = 0;             // задержка между ходами врага
const ENEMY_SHOT_DELAY = 900;

// === ЯДЕРНАЯ УГРОЗА (Фаза 1) ===
let nukeQueue = [];                 // [{time, col, row}] — запланированные удары
let nukeFlying = [];                // [{col,row,progress,duration}] — летящие маркеры
let nukesFired = 0;
const NUKE_START_MS = 20000;        // на 20-й секунде (от начала фазы)
const NUKE_INTERVAL = 5000;
const NUKE_COUNT = 8;
const NUKE_RADIUS = 2;              // радиус взрыва в клетках
const NUKE_WARN_MS = 1800;          // предупреждение до удара

function mkUnit(isP) {
  return {
    col: isP ? 2 : TC - 3,
    row: ROWS >> 1,
    tail: [],
    dir: { dc: isP ? 1 : -1, dr: 0 },
    nxt: { dc: isP ? 1 : -1, dr: 0 },
    vdc: 0, vdr: 0,
    mode: 'base', hp: 2,
    carry: 0, res: 0, soldiers: 0,
    snT: 0, mvT: 0,
    alive: true, respT: 0, isP,
  };
}

function addFx(x, y, txt, col, life) {
  fx.push({ x, y, txt, col, life, ml: life });
}

// Формула: сколько бойцов даёт игроку Фаза 1
function calcSoldiers(u) {
  return u.soldiers + Math.floor(u.res / 25);
}
