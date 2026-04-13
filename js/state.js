// === ГЛОБАЛЬНОЕ СОСТОЯНИЕ ===
let canvas, ctx;
let P, E, running = false;
let items = [], hazards = [], explosions = [], fx = [], graves = [];
let itemT = 0, hazT = 0, aiT = 0, last = -1;
let crashed = false;
let frameCount = 0;

// Создание юнита
function mkUnit(isP) {
  return {
    col: isP ? 2 : TC - 3,
    row: ROWS >> 1,
    tail: [],
    dir: { dc: isP ? 1 : -1, dr: 0 },
    nxt: { dc: isP ? 1 : -1, dr: 0 },
    vdc: 0, vdr: 0,
    mode: 'base',
    hp: 2,
    carry: 0,
    res: 0,
    soldiers: 0,
    snT: 0, mvT: 0,
    alive: true, respT: 0, isP,
  };
}

// FX-сообщение
function addFx(x, y, txt, col, life) {
  fx.push({ x, y, txt, col, life, ml: life });
}
