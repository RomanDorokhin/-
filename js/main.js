// === ГЛАВНЫЙ ЦИКЛ И STATE MACHINE ===

function startGame() {
  try {
    document.getElementById('ov').style.display = 'none';
    P = mkUnit(true);
    E = mkUnit(false);
    items = []; hazards = []; explosions = []; fx = []; graves = [];
    playerArmy = []; enemyArmy = [];
    itemT = 0; hazT = 8000; aiT = 0;
    roundNum = 1;
    state = S.ECONOMY;
    econTimer = ECON_DURATION;
    stateTimer = 0;
    playerBaseHP = BASE_HP_MAX;
    enemyBaseHP = BASE_HP_MAX;
    for (let i = 0; i < 18; i++) spawnItem();
    spawnHaz(); spawnHaz();
    running = true;
    crashed = false;
  } catch (err) {
    alert('startGame error: ' + err.message);
  }
}

// === ОБНОВЛЕНИЕ ПО СОСТОЯНИЯМ ===

function updateEconomy(dt) {
  graves = graves.filter(g => { g.life -= dt; return g.life > 0; });
  itemT -= dt; if (itemT <= 0 && items.length < 14) { spawnItem(); itemT = ri(1800, 3200); }
  hazT -= dt; if (hazT <= 0) { spawnHaz(); hazT = ri(10000, 16000); }
  updateHaz(dt);
  handleBaseKeys();
  moveUnit(P, dt);
  moveUnit(E, dt);
  updateAI(dt);
  checkColl();

  econTimer -= dt;
  if (econTimer <= 0) {
    state = S.LOCK;
    stateTimer = 1500;
    addFx(CW / 2, CH / 2 - 20, '⏱ ВРЕМЯ ВЫШЛО', '#FFD700', 2000);
    lockEconomy();
  }
}

function updateLock(dt) {
  stateTimer -= dt;
  if (stateTimer <= 0) {
    state = S.BATTLE_INIT;
    stateTimer = 1200;
    buildArmies();
    addFx(CW / 2, CH / 2, '⚔ БОЙ ⚔', '#FF6644', 1800);
  }
}

function updateBattleInit(dt) {
  stateTimer -= dt;
  if (stateTimer <= 0) {
    state = S.BATTLE;
  }
}

function updateBattle(dt) {
  updateInfantry(dt);
  updateBaseExchange(dt);
  // обновление взрывов
  explosions = explosions.filter(e => { e.l -= dt; return e.l > 0; });

  if (checkVictory()) {
    state = S.RESOLVE;
    stateTimer = 2500;
    if (winner === 'player') addFx(CW / 2, CH / 2, '🏆 ПОБЕДА', '#FFD700', 2400);
    else addFx(CW / 2, CH / 2, '☠ ПОРАЖЕНИЕ', '#FF3333', 2400);
  }
}

function updateResolve(dt) {
  stateTimer -= dt;
  explosions = explosions.filter(e => { e.l -= dt; return e.l > 0; });
  if (stateTimer <= 0) {
    state = S.ROUND_END;
    stateTimer = 2000;
  }
}

function updateRoundEnd(dt) {
  stateTimer -= dt;
  if (stateTimer <= 0) {
    if (winner === 'enemy') {
      // Полное поражение → перезапуск с раунда 1
      startGame();
    } else {
      startNextRound();
    }
  }
}

function update(dt) {
  if (!P || !E) return;
  switch (state) {
    case S.ECONOMY:     updateEconomy(dt); break;
    case S.LOCK:        updateLock(dt); break;
    case S.BATTLE_INIT: updateBattleInit(dt); break;
    case S.BATTLE:      updateBattle(dt); break;
    case S.RESOLVE:     updateResolve(dt); break;
    case S.ROUND_END:   updateRoundEnd(dt); break;
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
