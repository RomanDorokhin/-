// === ГЛАВНЫЙ ЦИКЛ И STATE MACHINE v5 ===

function startGame() {
  try {
    document.getElementById('ov').style.display = 'none';
    P = mkUnit(true);
    E = mkUnit(false);
    items = []; hazards = []; explosions = []; fx = []; graves = [];
    itemT = 0; hazT = 8000; aiT = 0;
    roundNum = 1;
    bankedSoldiers = 0;
    winner = null;
    state = S.ECONOMY;
    econTimer = ECON_DURATION;
    stateTimer = 0;
    resetNukes();
    scheduleNukes();
    for (let i = 0; i < 18; i++) spawnItem();
    spawnHaz(); spawnHaz();
    running = true;
    crashed = false;
  } catch (err) {
    alert('startGame error: ' + err.message);
  }
}

function startNextRound() {
  roundNum++;
  // P.res и P.soldiers уже обнулены в initPlacement — они превратились в армию
  // bankedSoldiers сохраняется (перенос излишка)
  items = []; hazards = []; explosions = []; fx = [];
  for (let i = 0; i < 18; i++) spawnItem();
  spawnHaz(); spawnHaz();
  if (P) {
    P.col = 2; P.row = ROWS >> 1; P.mode = 'base';
    P.tail = []; P.carry = 0; P.alive = true; P.hp = 2;
    P.vdc = 0; P.vdr = 0; P.snT = 0; P.mvT = 0;
  }
  if (E) {
    E.col = TC - 3; E.row = ROWS >> 1; E.mode = 'base';
    E.tail = []; E.carry = 0; E.alive = true; E.hp = 2;
    E.vdc = 0; E.vdr = 0; E.snT = 0; E.mvT = 0;
  }
  resetNukes();
  scheduleNukes();
  state = S.ECONOMY;
  econTimer = ECON_DURATION;
  winner = null;
}

// === ОБНОВЛЕНИЕ ПО СОСТОЯНИЯМ ===

function updateEconomy(dt) {
  graves = graves.filter(g => { g.life -= dt; return g.life > 0; });
  itemT -= dt; if (itemT <= 0 && items.length < 14) { spawnItem(); itemT = ri(1800, 3200); }
  hazT -= dt; if (hazT <= 0) { spawnHaz(); hazT = ri(10000, 16000); }
  updateHaz(dt);
  updateNukes(dt);
  handleBaseKeys();
  moveUnit(P, dt);
  moveUnit(E, dt);
  updateAI(dt);
  checkColl();

  econTimer -= dt;
  if (econTimer <= 0) {
    // Если в поле с рюкзаком — засчитываем его (иначе всё сгорит)
    if (P && P.mode === 'snake' && P.carry > 0) { P.res += P.carry; P.carry = 0; }
    if (E && E.mode === 'snake' && E.carry > 0) { E.res += E.carry; E.carry = 0; }
    initPlacement();
    state = S.PLACEMENT;
    addFx(CW / 2, 50, '▶ РАССТАНОВКА', '#FFD700', 1800);
  }
}

function update(dt) {
  if (!P || !E) return;
  explosions = explosions.filter(e => { e.l -= dt; return e.l > 0; });

  switch (state) {
    case S.ECONOMY:   updateEconomy(dt); break;
    case S.PLACEMENT: updatePlacement(dt); break;
    case S.NAVAL:     updateNaval(dt); break;
    case S.ROUND_END:
      stateTimer -= dt;
      if (stateTimer <= 0) {
        if (winner === 'enemy') startGame();
        else startNextRound();
      }
      break;
  }
}

function loop(ts = 0) {
  if (crashed) return;
  try {
    const dt = last < 0 ? 0 : Math.min(ts - last, 80); last = ts;
    if (running) update(dt);
    render();
  } catch (err) {
    crashed = true;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#FF4444'; ctx.font = 'bold 14px Courier New'; ctx.textAlign = 'left';
    ctx.fillText('ERROR: ' + err.message, 20, 40);
    const stack = (err.stack || '').split('\n').slice(0, 8);
    ctx.fillStyle = '#FFAA44'; ctx.font = '10px Courier New';
    stack.forEach((line, i) => ctx.fillText(line.substring(0, 80), 20, 70 + i * 14));
    return;
  }
  requestAnimationFrame(loop);
}

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d');
  canvas.width = CW;
  canvas.height = CH;
  setupInput();
  requestAnimationFrame(loop);
});
