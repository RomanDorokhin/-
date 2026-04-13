// === ГЛОБАЛЬНОЕ СОСТОЯНИЕ ===
let canvas, ctx;
let P, E, running = false;
let items = [], hazards = [], explosions = [], fx = [], graves = [];
let itemT = 0, hazT = 0, aiT = 0, last = -1;
let crashed = false;
let frameCount = 0;

// === STATE MACHINE ===
const S = {
  ECONOMY: 'economy',
  LOCK: 'lock',
  BATTLE_INIT: 'battle_init',
  BATTLE: 'battle',
  RESOLVE: 'resolve',
  ROUND_END: 'round_end',
};
let state = S.ECONOMY;
let stateTimer = 0;
let econTimer = 60000;
const ECON_DURATION = 60000;

// === БОЙ ===
let roundNum = 1;
let playerArmy = [];
let enemyArmy = [];
let playerBaseHP = 500;
let enemyBaseHP = 500;
const BASE_HP_MAX = 500;
const BASE_POWER = 10;
let infantryTimer = 0;
let baseTimer = 0;
let winner = null;

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

function mkBattleUnit(col, row, isP, level = 1) {
  return {
    col, row, isP, level,
    hp: 30 + level * 10,
    maxHp: 30 + level * 10,
    power: BASE_POWER * level,
    range: 3,
    alive: true,
  };
}

function addFx(x, y, txt, col, life) {
  fx.push({ x, y, txt, col, life, ml: life });
}
