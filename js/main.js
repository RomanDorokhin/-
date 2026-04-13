// === ГЛАВНЫЙ ЦИКЛ ===

function startGame() {
  try {
    document.getElementById('ov').style.display = 'none';
    P = mkUnit(true);
    E = mkUnit(false);
    items = []; hazards = []; explosions = []; fx = []; graves = [];
    itemT = 0; hazT = 8000; aiT = 0;
    for (let i = 0; i < 18; i++) spawnItem();
    spawnHaz(); spawnHaz();
    running = true;
    crashed = false;
  } catch (err) {
    alert('startGame error: ' + err.message + '\n\n' + (err.stack || ''));
  }
}

function update(dt) {
  if (!P || !E) return;
  graves = graves.filter(g => { g.life -= dt; return g.life > 0; });
  itemT -= dt; if (itemT <= 0 && items.length < 14) { spawnItem(); itemT = ri(1800, 3200); }
  hazT -= dt; if (hazT <= 0) { spawnHaz(); hazT = ri(10000, 16000); }
  updateHaz(dt);
  handleBaseKeys();
  moveUnit(P, dt);
  moveUnit(E, dt);
  updateAI(dt);
  checkColl();
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
    return;
  }
  requestAnimationFrame(loop);
}

// === ИНИЦИАЛИЗАЦИЯ ===
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('c');
  ctx = canvas.getContext('2d');
  canvas.width = CW;
  canvas.height = CH;
  setupInput();
  requestAnimationFrame(loop);
});
