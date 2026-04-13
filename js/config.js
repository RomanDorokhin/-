// === КОНСТАНТЫ КАРТЫ ===
const CELL = 30;
const BASE_C = 6;
const FIELD_C = 16;
const ROWS = 18;
const TC = BASE_C + FIELD_C + BASE_C;
const CW = TC * CELL;
const CH = ROWS * CELL;
const DOOR = [7, 8, 9, 10];

// === ЗОНЫ ===
const inPBase = (c, r) => c >= 0 && c < BASE_C && r >= 0 && r < ROWS;
const inEBase = (c, r) => c >= BASE_C + FIELD_C && c < TC && r >= 0 && r < ROWS;
const inField = (c, r) => c >= BASE_C && c < BASE_C + FIELD_C && r >= 0 && r < ROWS;
const isDoor  = (c, r) => DOOR.includes(r);

// === ПРОХОДЫ ===
const P_DOOR_COL  = BASE_C - 1;
const P_FIELD_COL = BASE_C;
const E_DOOR_COL  = BASE_C + FIELD_C;
const E_FIELD_COL = BASE_C + FIELD_C - 1;

// === СКОРОСТИ ===
const BASE_SPD  = 140;
const SNAKE_SPD = 270;

// === АРТЕФАКТЫ ===
const IDEF = [
  { t: 'supply',  w: 5, v: 12 },
  { t: 'crate',   w: 3, v: 35 },
  { t: 'medkit',  w: 2, v: 0  },
  { t: 'recruit', w: 2, v: 20 },
];
const IDEF_TOT = IDEF.reduce((s, t) => s + t.w, 0);

// === УТИЛИТЫ ===
const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
