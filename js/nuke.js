// === ЯДЕРНАЯ УГРОЗА В ФАЗЕ 1 ===
// Планирует NUKE_COUNT ударов с NUKE_START_MS, по одному каждые NUKE_INTERVAL.
// За NUKE_WARN_MS до удара показывается маркер-круг на цели.
// Взрыв бьёт по радиусу NUKE_RADIUS в клетках (Чебышев).

function resetNukes() {
  nukeQueue = [];
  nukeFlying = [];
  nukesFired = 0;
}

function scheduleNukes() {
  // Планируем сразу все удары, привязанные к elapsedMs от начала фазы
  nukeQueue = [];
  for (let i = 0; i < NUKE_COUNT; i++) {
    nukeQueue.push({
      fireAt: NUKE_START_MS + i * NUKE_INTERVAL,
      col: -1, row: -1, // выберем в момент предупреждения
      warned: false,
      detonated: false,
      warnAt: NUKE_START_MS + i * NUKE_INTERVAL - NUKE_WARN_MS,
    });
  }
}

function pickNukeTarget() {
  // Случайная точка в поле (не в базах)
  const col = BASE_C + 1 + Math.floor(Math.random() * (FIELD_C - 2));
  const row = 1 + Math.floor(Math.random() * (ROWS - 2));
  return { col, row };
}

function updateNukes(dt) {
  const elapsed = ECON_DURATION - econTimer;

  nukeQueue.forEach(n => {
    if (!n.warned && elapsed >= n.warnAt) {
      const t = pickNukeTarget();
      n.col = t.col; n.row = t.row;
      n.warned = true;
      addFx(n.col * CELL + CELL / 2, n.row * CELL - 6, '☢', '#FF4400', NUKE_WARN_MS);
    }
    if (n.warned && !n.detonated && elapsed >= n.fireAt) {
      detonateNuke(n);
      n.detonated = true;
      nukesFired++;
    }
  });
  nukeQueue = nukeQueue.filter(n => !n.detonated);
}

function detonateNuke(n) {
  // Большой взрыв
  for (let i = 0; i < 5; i++) {
    explosions.push({
      col: n.col + (Math.random() * 2 - 1),
      row: n.row + (Math.random() * 2 - 1),
      l: 900, ml: 900,
    });
  }
  addFx(n.col * CELL + CELL / 2, n.row * CELL, '☢ BOOM', '#FF3300', 1600);

  // Урон змейкам в радиусе
  [P, E].forEach(u => {
    if (!u || !u.alive || u.mode !== 'snake') return;
    const d = Math.max(Math.abs(u.col - n.col), Math.abs(u.row - n.row));
    if (d <= NUKE_RADIUS) hitWall(u);
  });
}

// Отрисовка предупреждений и "активных" целей
function drawNukeWarnings() {
  nukeQueue.forEach(n => {
    if (!n.warned) return;
    const elapsed = ECON_DURATION - econTimer;
    const remaining = n.fireAt - elapsed;
    if (remaining <= 0) return;
    const t = 1 - remaining / NUKE_WARN_MS;
    const cx = n.col * CELL + CELL / 2;
    const cy = n.row * CELL + CELL / 2;
    const radius = NUKE_RADIUS * CELL;

    // Мигающий круг опасности
    const pulse = 0.5 + 0.5 * Math.sin(frameCount / 3);
    ctx.strokeStyle = `rgba(255,${60 - t * 60},0,${0.4 + 0.5 * pulse})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Крест в центре
    ctx.strokeStyle = `rgba(255,220,0,${0.6 + 0.4 * pulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  });
}
