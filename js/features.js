window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;
  const sponsorTrail = [];
  const MAX_SPONSOR_TRAIL = 20;
  const INAGENT_START_TRANSITION_MS = 720;
  const signalAds = [
    { name: 'АРКАДА', text: 'ТЕСТ СИГНАЛА. СОБЕРИ ТРИ СИМВОЛА И ПОСМОТРИ РЕАКЦИЮ СИСТЕМЫ.', color: '#ff0' },
    { name: 'АРКАДА', text: 'ПРОВЕРКА КАНАЛА. НАЖМИ И ЗАПУСТИ КОРОТКИЙ ЦИКЛ ОТКЛИКА.', color: '#f80' },
    { name: 'АРКАДА', text: 'СВЕТОВОЙ МОДУЛЬ АКТИВЕН. ПРОКРУТИ БАРАБАНЫ И НАБЛЮДАЙ ЗА РИТМОМ.', color: '#0ff' },
    { name: 'АРКАДА', text: 'ВНУТРЕННИЙ АВТОМАТ. НИКАКИХ СТАВОК, ТОЛЬКО УЗОРЫ И СИМВОЛЫ.', color: '#ff4' },
    { name: 'АРКАДА', text: 'СЛУЖЕБНЫЙ РЕЖИМ. СОВПАДЕНИЯ ВЫЗЫВАЮТ ВИЗУАЛЬНУЮ ВСПЫШКУ.', color: '#f0f' },
  ];
  const slotSymbols = ['◇', '○', '△', '☆', '□', '✦', '◈', '◎', '◉', '◌'];

  function clearQuestCellMark(cell) {
    if (!cell) return;
    const mark = cell.querySelector('.quest-target');
    if (mark) mark.remove();
  }

function clearQuestMarks(cells = document.querySelectorAll('.noise-cell')) {
  cells.forEach((cell) => clearQuestCellMark(cell));
}

  function clearSponsorClickBindings(cell) {
    if (!cell) return;
    if (cell._sponsorClickHandler) {
      cell.removeEventListener('click', cell._sponsorClickHandler);
      cell._sponsorClickHandler = null;
    }
    if (cell._sponsorTapState) {
      cell._sponsorTapState.lastTap = 0;
    }
  }

  function bindSponsorDoubleClick(cell) {
    if (!cell) return;
    if (!cell._sponsorTapState) cell._sponsorTapState = { lastTap: 0 };
    if (cell._sponsorClickHandler) return;
    const handler = () => {
      const now = Date.now();
      const state = cell._sponsorTapState;
      if (now - state.lastTap < 420) showSignalArcade();
      state.lastTap = now;
    };
    cell._sponsorClickHandler = handler;
    cell.addEventListener('click', handler);
  }

  function clearSponsorQuestUi() {
    clearSponsorQuestWarning();
    const panel = document.getElementById('sponsor-quest-panel');
    if (panel) panel.remove();
    document.body.classList.remove('snake-mode');
  }

  function restoreCellLabel(cell) {
    if (!cell) return;
    const lbl = cell.querySelector('.cell-label');
    if (lbl) lbl.textContent = cell.dataset.loc || '';
  }

  function clearSponsorTrail() {
    while (sponsorTrail.length) {
      const trail = sponsorTrail.pop();
      if (trail && trail.el && trail.el.parentNode) trail.el.parentNode.removeChild(trail.el);
    }
  }

  const INAGENT_CELL = 40;
  const INAGENT_COLS = 12;
  const INAGENT_ROWS = 10;
  const INAGENT_LEVELS = [
    {
      map: [
        '############',
        '#..........#',
        '#.##.##....#',
        '#.#..#.....#',
        '#.#..#######',
        '#..........#',
        '##.####.#.##',
        '#......#...#',
        '#.######...#',
        '############',
      ],
      secret: { r: 2, c: 11 },
      hiddenPassages: [{ r: 8, c: 2, entry: 'left' }],
      guards: [{ r: 6, c: 7 }],
      switches: [{ r: 5, c: 5, doors: [{ r: 4, c: 8 }] }],
      pickups: [
        { r: 7, c: 2, kind: 'phase' },
        { r: 5, c: 3, kind: 'mine' },
      ],
      flamers: [
        { r: 3, c: 9, dir: 'left', len: 2, period: 5, on: 2, phase: 0 },
      ],
      plans: null,
      exit: null,
    },
    {
      map: [
        '############',
        '#..#.......#',
        '#..#.#####.#',
        '#..#.......#',
        '#..#######.#',
        '#..........#',
        '#.########.#',
        '#..........#',
        '###.######.#',
        '############',
      ],
      secret: { r: 1, c: 11 },
      guards: [{ r: 5, c: 6 }, { r: 7, c: 3 }],
      switches: [{ r: 7, c: 8, doors: [{ r: 4, c: 6 }] }],
      pickups: [
        { r: 5, c: 2, kind: 'mine' },
        { r: 7, c: 6, kind: 'emp' },
      ],
      flamers: [
        { r: 3, c: 2, dir: 'right', len: 2, period: 6, on: 2, phase: 1 },
      ],
      plans: null,
      exit: null,
    },
    {
      map: [
        '############',
        '#.#.......##',
        '#.#.#####.##',
        '#.#.#.....##',
        '#.#.#.###.##',
        '#...#.#....#',
        '#####.#.##.#',
        '#.....#....#',
        '#.#####.##.#',
        '############',
      ],
      secret: { r: 3, c: 11 },
      guards: [{ r: 7, c: 4 }, { r: 7, c: 7 }, { r: 7, c: 1 }],
      switches: [{ r: 5, c: 9, doors: [{ r: 3, c: 10 }] }],
      pickups: [
        { r: 1, c: 9, kind: 'mine' },
        { r: 7, c: 2, kind: 'mine' },
        { r: 5, c: 1, kind: 'medkit' },
        { r: 1, c: 8, kind: 'emp' },
      ],
      flamers: [],
      plans: null,
      exit: null,
    },
    {
      map: [
        '############',
        '#..........#',
        '####.#####.#',
        '#..#.....#.#',
        '#..#.###.#.#',
        '#..#.#.#.#.#',
        '#....#.#...#',
        '#.####.#####',
        '#..........#',
        '############',
      ],
      secret: { r: 2, c: 11 },
      guards: [{ r: 1, c: 6 }, { r: 5, c: 4 }, { r: 7, c: 6 }, { r: 3, c: 8 }],
      switches: [{ r: 3, c: 6, doors: [{ r: 4, c: 6 }] }],
      pickups: [
        { r: 8, c: 3, kind: 'mine' },
        { r: 1, c: 9, kind: 'emp' },
        { r: 6, c: 3, kind: 'medkit' },
      ],
      flamers: [],
      plans: null,
      exit: null,
    },
    {
      map: [
        '############',
        '#..........#',
        '#.##.####.##',
        '#.#........#',
        '#.#.######.#',
        '#..........#',
        '##.######.##',
        '#..........#',
        '#.########.#',
        '############',
      ],
      secret: null,
      guards: [{ r: 1, c: 9 }, { r: 5, c: 6 }],
      switches: [{ r: 5, c: 4, doors: [{ r: 4, c: 8 }] }],
      pickups: [
        { r: 5, c: 8, kind: 'mine' },
        { r: 7, c: 2, kind: 'emp' },
        { r: 1, c: 2, kind: 'medkit' },
        { r: 3, c: 10, kind: 'phase' },
      ],
      flamers: [],
      plans: { r: 3, c: 9 },
      exit: { r: 7, c: 10 },
    },
  ];

  function inagentLevel() {
    return INAGENT_LEVELS[S.inagent.level];
  }

  function setInagentScreen(mode) {
    if (R.inagentStartScreen) R.inagentStartScreen.classList.toggle('active', mode === 'intro');
    if (R.inagentEndScreen) R.inagentEndScreen.classList.toggle('active', mode === 'end');
    if (R.inagentTransScreen) R.inagentTransScreen.classList.toggle('active', mode === 'trans');
    if (R.inagentHost) R.inagentHost.dataset.screen = mode || 'play';
  }

  function setInagentFieldState({ mode = false, launching = false, playing = false } = {}) {
    const targets = [R.phase3MainField, R.phase3Top];
    targets.forEach((target) => {
      if (!target) return;
      target.classList.toggle('inagent-mode', mode);
      target.classList.toggle('inagent-launching', mode && launching);
      target.classList.toggle('inagent-playing', mode && playing);
    });
  }

  function closeInagent({ silent = false } = {}) {
    if (!S.inagent.open) return;
    S.inagent.open = false;
    S.inagent.state = 'intro';
    if (S.inagent.transitionTimer) {
      clearTimeout(S.inagent.transitionTimer);
      S.inagent.transitionTimer = null;
    }
    S.inagent.phaseActive = false;
    if (R.inagentHost) {
      R.inagentHost.classList.remove('active');
      R.inagentHost.classList.remove('inagent-transform-in');
      R.inagentHost.classList.remove('inagent-intro-open');
      R.inagentHost.classList.remove('inagent-start-armed');
      R.inagentHost.setAttribute('aria-hidden', 'true');
    }
    if (R.noiseGrid) R.noiseGrid.classList.remove('inagent-transform-out');
    document.body.classList.remove('inagent-mode');
    setInagentFieldState();
    setInagentScreen('intro');
    if (!silent) setSnakeStatus('ИНАГЕНТ ЗАКРЫТ', 1200);
  }

  function validateInagentLevels() {
    const issues = [];
    INAGENT_LEVELS.forEach((level, levelIdx) => {
      if (!Array.isArray(level.map) || level.map.length !== INAGENT_ROWS) {
        issues.push(`Сектор ${levelIdx + 1}: карта должна содержать ${INAGENT_ROWS} строк.`);
        return;
      }
      level.map.forEach((row, rowIdx) => {
        if (typeof row !== 'string' || row.length !== INAGENT_COLS) {
          issues.push(`Сектор ${levelIdx + 1}: строка ${rowIdx + 1} должна содержать ${INAGENT_COLS} клеток.`);
        }
      });
      const seenPickups = new Set();
      const ensureInside = (node, label) => {
        if (!node) return;
        if (
          node.r < 0 || node.r >= INAGENT_ROWS ||
          node.c < 0 || node.c >= INAGENT_COLS
        ) {
          issues.push(`Сектор ${levelIdx + 1}: ${label} выходит за границы карты.`);
          return;
        }
        const row = level.map[node.r];
        if (!row) return;
        if (row[node.c] === '#' && !(label.startsWith('дверь') || label.startsWith('секрет'))) {
          issues.push(`Сектор ${levelIdx + 1}: ${label} стоит внутри стены (${node.r}, ${node.c}).`);
        }
      };
      ensureInside(level.secret, 'секрет');
      (level.hiddenPassages || []).forEach((passage, passageIdx) => {
        if (
          passage.r < 0 || passage.r >= INAGENT_ROWS ||
          passage.c < 0 || passage.c >= INAGENT_COLS
        ) {
          issues.push(`Сектор ${levelIdx + 1}: тайный проход ${passageIdx + 1} выходит за границы карты.`);
          return;
        }
        const row = level.map[passage.r];
        if (row && row[passage.c] !== '#') {
          issues.push(`Сектор ${levelIdx + 1}: тайный проход ${passageIdx + 1} должен быть спрятан в стене.`);
        }
        if (passage.entry && !['left', 'right', 'up', 'down'].includes(passage.entry)) {
          issues.push(`Сектор ${levelIdx + 1}: тайный проход ${passageIdx + 1} имеет неверное направление входа.`);
        }
      });
      ensureInside(level.plans, 'планы');
      ensureInside(level.exit, 'выход');
      (level.guards || []).forEach((guard, guardIdx) => ensureInside(guard, `охранник ${guardIdx + 1}`));
      (level.switches || []).forEach((switchNode, switchIdx) => {
        ensureInside(switchNode, `пульт ${switchIdx + 1}`);
        (switchNode.doors || []).forEach((door, doorIdx) => {
          if (
            door.r < 0 || door.r >= INAGENT_ROWS ||
            door.c < 0 || door.c >= INAGENT_COLS
          ) {
            issues.push(`Сектор ${levelIdx + 1}: дверь ${switchIdx + 1}.${doorIdx + 1} выходит за границы карты.`);
            return;
          }
          const row = level.map[door.r];
          if (row && row[door.c] !== '#') {
            issues.push(`Сектор ${levelIdx + 1}: дверь ${switchIdx + 1}.${doorIdx + 1} должна открывать стену.`);
          }
        });
      });
      (Array.isArray(level.pickups) ? level.pickups : []).forEach((pickup, pickupIdx) => {
        ensureInside(pickup, `пикап ${pickupIdx + 1}`);
        const key = `${pickup.r}:${pickup.c}:${pickup.kind}`;
        if (seenPickups.has(key)) {
          issues.push(`Сектор ${levelIdx + 1}: дублирующийся пикап ${pickup.kind} в (${pickup.r}, ${pickup.c}).`);
        }
        seenPickups.add(key);
      });
      (level.flamers || []).forEach((flamer, flamerIdx) => {
        ensureInside(flamer, `огнемёт ${flamerIdx + 1}`);
        if (!['left', 'right', 'up', 'down'].includes(flamer.dir)) {
          issues.push(`Сектор ${levelIdx + 1}: огнемёт ${flamerIdx + 1} имеет неверное направление.`);
        }
        if ((flamer.len || 0) <= 0) {
          issues.push(`Сектор ${levelIdx + 1}: у огнемёта ${flamerIdx + 1} должна быть длина луча > 0.`);
        }
      });
      const startRow = level.map[1];
      if (!startRow || startRow[1] === '#') {
        issues.push(`Сектор ${levelIdx + 1}: стартовая клетка (1,1) должна быть проходимой.`);
      }
    });
    if (issues.length) {
      console.warn('[InAgent] level validation issues:\n' + issues.map((issue) => `- ${issue}`).join('\n'));
    }
    return issues;
  }

  function inagentIsSecret(r, c) {
    const secret = inagentLevel().secret;
    return !!secret && secret.r === r && secret.c === c;
  }

  function inagentHiddenPassageAt(r, c) {
    const hiddenPassages = inagentLevel().hiddenPassages || [];
    return hiddenPassages.find((passage) => passage.r === r && passage.c === c) || null;
  }

  function inagentIsHiddenPassage(r, c) {
    return !!inagentHiddenPassageAt(r, c);
  }

  function inagentHiddenPassageAllowsEntry(passage, fromR, fromC) {
    if (!passage) return false;
    const entry = passage.entry || 'left';
    if (entry === 'left') return fromR === passage.r && fromC === passage.c - 1;
    if (entry === 'right') return fromR === passage.r && fromC === passage.c + 1;
    if (entry === 'up') return fromR === passage.r - 1 && fromC === passage.c;
    if (entry === 'down') return fromR === passage.r + 1 && fromC === passage.c;
    return false;
  }

  function inagentHiddenPassageExitTarget(passage) {
    if (!passage) return null;
    const entry = passage.entry || 'left';
    if (entry === 'left') return { r: passage.r, c: passage.c - 1 };
    if (entry === 'right') return { r: passage.r, c: passage.c + 1 };
    if (entry === 'up') return { r: passage.r - 1, c: passage.c };
    if (entry === 'down') return { r: passage.r + 1, c: passage.c };
    return null;
  }

  function inagentOutOfBounds(r, c) {
    return r < 0 || r >= INAGENT_ROWS || c < 0 || c >= INAGENT_COLS;
  }

  function inagentWall(r, c) {
    if (inagentIsSecret(r, c)) return false;
    if (inagentOutOfBounds(r, c)) return true;
    if (inagentIsHiddenPassage(r, c)) return true;
    if (S.inagent.openDoors.some((door) => door.r === r && door.c === c)) return false;
    const row = inagentLevel().map[r];
    return !row || row[c] === '#';
  }

  function inagentSwitchAt(r, c) {
    const switches = inagentLevel().switches || [];
    return switches.find((entry) => entry.r === r && entry.c === c) || null;
  }

  function inagentCellKey(r, c) {
    return `${r}:${c}`;
  }

  function inagentPickups() {
    const lvl = inagentLevel();
    if (Array.isArray(lvl.pickups) && lvl.pickups.length) return lvl.pickups;
    if (lvl.pickup) return [lvl.pickup];
    return [];
  }

  function inagentPickupKey(pickup) {
    return `${pickup.r}:${pickup.c}:${pickup.kind}`;
  }

  function inagentPickupAvailable(pickup) {
    return !S.inagent.collectedPickups.has(inagentPickupKey(pickup));
  }

  function inagentPickupAt(r, c) {
    return inagentPickups().find((pickup) => (
      pickup.r === r &&
      pickup.c === c &&
      inagentPickupAvailable(pickup)
    )) || null;
  }

  function inagentSolidWall(r, c) {
    if (inagentOutOfBounds(r, c)) return true;
    const row = inagentLevel().map[r];
    return !row || row[c] === '#';
  }

  function inagentFlameCellsForTick(tick = S.inagent.flamerTick) {
    const lvl = inagentLevel();
    const flamers = lvl.flamers || [];
    const cells = [];
    const set = new Set();
    flamers.forEach((flamer) => {
      const period = Math.max(1, flamer.period || 4);
      const on = Math.max(0, Math.min(period, flamer.on || 2));
      const phase = ((tick + (flamer.phase || 0)) % period + period) % period;
      if (phase >= on) return;
      const dirMap = {
        left: [0, -1],
        right: [0, 1],
        up: [-1, 0],
        down: [1, 0],
      };
      const vec = dirMap[flamer.dir] || [0, 0];
      let rr = flamer.r;
      let cc = flamer.c;
      for (let i = 0; i < (flamer.len || 0); i += 1) {
        rr += vec[0];
        cc += vec[1];
        if (inagentOutOfBounds(rr, cc)) break;
        const doorOpen = S.inagent.openDoors.some((door) => door.r === rr && door.c === cc);
        if (!doorOpen && inagentSolidWall(rr, cc)) break;
        const key = inagentCellKey(rr, cc);
        if (set.has(key)) continue;
        set.add(key);
        cells.push({ r: rr, c: cc });
      }
    });
    return { cells, set };
  }

  function inagentGoalText(level = inagentLevel()) {
    if (level.exit) {
      return S.inagent.hasPlans
        ? 'ЦЕЛЬ: ДОЙТИ ДО EXIT'
        : 'ЦЕЛЬ: НАЙТИ ПЛАНЫ И ДОБРАТЬСЯ ДО EXIT';
    }
    return level.switches && level.switches.length
      ? 'ЦЕЛЬ: ОБОЙТИ ОХРАНУ, АКТИВИРОВАТЬ SW И НАЙТИ ТАЙНЫЙ ПРОХОД'
      : 'ЦЕЛЬ: ОБОЙТИ ОХРАНУ И НАЙТИ ТАЙНЫЙ ПРОХОД';
  }

  function inagentInventoryText() {
    return [
      `HP ${S.inagent.lives}/${S.inagent.maxLives}`,
      `PH ${S.inagent.phaseCharges}${S.inagent.phaseActive ? ' [ГОТОВО]' : ''}`,
      `MN ${S.inagent.mineCharges}`,
      `EMP ${S.inagent.empCharges}`,
    ].join(' // ');
  }

  function inagentStatusText(level = inagentLevel()) {
    const parts = [
      `ОХРАНА ${S.inagent.guards.length}`,
      `МИНЫ НА ПОЛЕ ${S.inagent.mines.length}`,
    ];
    if (S.inagent.guardsFrozen > 0) parts.push(`ОГЛУШЕНИЕ ${S.inagent.guardsFrozen}`);
    if (S.inagent.openDoors.length) parts.push(`ДВЕРЬ ${S.inagent.doorTimer}`);
    if ((level.flamers || []).length) parts.push(`ОГОНЬ ${level.flamers.length}`);
    return parts.join(' // ');
  }

  function inagentActionHint(level = inagentLevel(), pickupsLeft = inagentPickups().filter(inagentPickupAvailable)) {
    if (S.inagent.flashTimer > 0) return S.inagent.flashMsg;
    if (S.inagent.phaseActive) return 'ФАЗА ВЗВЕДЕНА — СЛЕДУЮЩИЙ ШАГ МОЖНО СДЕЛАТЬ СКВОЗЬ СТЕНУ';
    if (S.inagent.guardsFrozen > 0) return 'EMP АКТИВЕН — ОХРАНА ВРЕМЕННО НЕ ДВИГАЕТСЯ';
    if (pickupsLeft.length) {
      return 'ПОДБЕРИ РЕСУРСЫ: Q — ФАЗА // M — ПОСТАВИТЬ МИНУ // E — EMP';
    }
    if (level.exit) {
      return S.inagent.hasPlans ? 'ПЛАНЫ У ТЕБЯ — ИДИ К EXIT' : 'СОБЕРИ ПЛАНЫ, ЗАТЕМ ИЩИ EXIT';
    }
    return level.switches && level.switches.length
      ? 'ИЩИ ПУЛЬТ SW И СМОТРИ, КАКАЯ СТЕНА ОТКРОЕТСЯ'
      : 'СЕКТОР ЧИСТЫЙ — ОСМОТРИ СТЕНЫ И НАЙДИ ТАЙНЫЙ ПРОХОД';
  }

  function updateInagentHud() {
    if (
      !R.inagentHudSector ||
      !R.inagentHudMoves ||
      !R.inagentHudGoal ||
      !R.inagentHudResources ||
      !R.inagentHudState ||
      !R.inagentMsg
    ) return;
    const lvl = inagentLevel();
    const pickupsLeft = inagentPickups().filter(inagentPickupAvailable);
    R.inagentHudSector.textContent = `СЕКТОР: ${S.inagent.level + 1}/${INAGENT_LEVELS.length}`;
    R.inagentHudMoves.textContent = `ХОД: ${S.inagent.moves}`;
    R.inagentHudGoal.textContent = inagentGoalText(lvl);
    R.inagentHudResources.textContent = inagentInventoryText();
    R.inagentHudState.textContent = inagentStatusText(lvl);
    R.inagentMsg.textContent = inagentActionHint(lvl, pickupsLeft);
    R.inagentMsg.style.color = S.inagent.flashTimer > 0 ? '#ffcc00' : '#7ee6ff';
  }

  function getInagentRevealProgress() {
    if (!S.inagent.open) return 1;
    if (!S.inagent.introRevealMs) return 1;
    const elapsed = Date.now() - S.inagent.introStartedAt;
    return Math.max(0, Math.min(1, elapsed / S.inagent.introRevealMs));
  }

  function getInagentSpawnFactor(kind, row, col) {
    const progress = getInagentRevealProgress();
    if (progress >= 1) return 1;
    const kindDelay = {
      player: 0.5,
      guard: 0.58,
      pickup: 0.62,
      plans: 0.65,
      exit: 0.7,
      switch: 0.52,
      flame: 0.55,
      mine: 0.6,
    }[kind] || 0.58;
    const radialDelay = ((row + col) / (INAGENT_ROWS + INAGENT_COLS)) * 0.22;
    const local = (progress - kindDelay - radialDelay) / 0.22;
    return Math.max(0, Math.min(1, local));
  }

  function drawInagentPulseNode(ctx, x, y, radius, fillStyle, label, labelColor = '#000', scale = 1, alpha = 1) {
    const safeScale = Math.max(0, scale);
    if (safeScale <= 0) return;
    const pulse = 0.84 + (1 - safeScale) * 0.18;
    ctx.save();
    ctx.translate(x + INAGENT_CELL / 2, y + INAGENT_CELL / 2);
    ctx.scale(safeScale * pulse, safeScale * pulse);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(label, 0, 1);
    ctx.restore();
  }

  function drawInagent() {
    if (!R.inagentCanvas) return;
    const ctx = R.inagentCanvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, R.inagentCanvas.width, R.inagentCanvas.height);
    const lvl = inagentLevel();
    const activeFlames = inagentFlameCellsForTick();
    const secretPulse = 0.5 + 0.5 * Math.sin(Date.now() / 900);
    const switchPulse = 0.5 + 0.5 * Math.sin(Date.now() / 420);
    const revealProgress = getInagentRevealProgress();
    const revealFrontier = Math.floor(INAGENT_COLS * revealProgress);
    for (let r = 0; r < INAGENT_ROWS; r++) {
      for (let c = 0; c < INAGENT_COLS; c++) {
        const x = c * INAGENT_CELL;
        const y = r * INAGENT_CELL;
        const row = lvl.map[r];
        const doorOpen = S.inagent.openDoors.some((door) => door.r === r && door.c === c);
        const switchNode = inagentSwitchAt(r, c);
        const isWallCell = !row || row[c] === '#';
        const isHiddenPassage = inagentIsHiddenPassage(r, c);
        const cellDelay = ((c / INAGENT_COLS) * 0.58) + ((r / INAGENT_ROWS) * 0.14);
        const cellProgress = Math.max(0, Math.min(1, (revealProgress - cellDelay) / 0.25));
        if (revealProgress < 1 && c > revealFrontier + 1 && cellProgress <= 0) {
          ctx.fillStyle = '#050505';
          ctx.strokeStyle = 'rgba(200,255,0,0.03)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, INAGENT_CELL - 1, INAGENT_CELL - 1);
          continue;
        }
        if ((isWallCell && !doorOpen) || inagentIsSecret(r, c)) {
          ctx.fillStyle = `rgba(13,26,5,${0.12 + cellProgress * 0.88})`;
          ctx.fillRect(x, y, INAGENT_CELL, INAGENT_CELL);
          ctx.strokeStyle = `rgba(200,255,0,${0.03 + cellProgress * 0.09})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, INAGENT_CELL - 1, INAGENT_CELL - 1);
          ctx.strokeStyle = `rgba(200,255,0,${0.01 + cellProgress * 0.04})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + INAGENT_CELL, y + INAGENT_CELL);
          ctx.moveTo(x + INAGENT_CELL, y);
          ctx.lineTo(x, y + INAGENT_CELL);
          ctx.stroke();
          if (inagentIsSecret(r, c)) {
            ctx.fillStyle = `rgba(200,255,0,${(0.016 + secretPulse * 0.03) * cellProgress})`;
            ctx.fillRect(x + 1, y + 1, INAGENT_CELL - 2, INAGENT_CELL - 2);
            ctx.strokeStyle = `rgba(200,255,0,${(0.03 + secretPulse * 0.06) * cellProgress})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 7.5, y + 7.5, INAGENT_CELL - 15, INAGENT_CELL - 15);
          } else if (isHiddenPassage) {
            const passageGlow = 0.22 + secretPulse * 0.18;
            ctx.strokeStyle = `rgba(126,230,255,${passageGlow * cellProgress})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + INAGENT_CELL * 0.24, y + INAGENT_CELL * 0.18);
            ctx.lineTo(x + INAGENT_CELL * 0.76, y + INAGENT_CELL * 0.18);
            ctx.moveTo(x + INAGENT_CELL * 0.18, y + INAGENT_CELL * 0.28);
            ctx.lineTo(x + INAGENT_CELL * 0.18, y + INAGENT_CELL * 0.76);
            ctx.stroke();
            ctx.fillStyle = `rgba(126,230,255,${(0.03 + secretPulse * 0.035) * cellProgress})`;
            ctx.fillRect(x + 8, y + 8, INAGENT_CELL - 16, INAGENT_CELL - 16);
          }
        } else {
          ctx.fillStyle = `rgba(8,8,8,${0.15 + cellProgress * 0.85})`;
          ctx.fillRect(x, y, INAGENT_CELL, INAGENT_CELL);
          ctx.strokeStyle = `rgba(200,255,0,${0.008 + cellProgress * 0.03})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, INAGENT_CELL - 1, INAGENT_CELL - 1);
          if (doorOpen) {
            ctx.fillStyle = `rgba(126,230,255,${0.08 * cellProgress})`;
            ctx.fillRect(x + 1, y + 1, INAGENT_CELL - 2, INAGENT_CELL - 2);
            ctx.strokeStyle = `rgba(126,230,255,${0.3 * cellProgress})`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 8.5, y + 8.5, INAGENT_CELL - 17, INAGENT_CELL - 17);
          }
        }

        const switchFactor = getInagentSpawnFactor('switch', r, c);
        if (switchNode && switchFactor > 0) {
          ctx.fillStyle = `rgba(126,230,255,${(0.16 + switchPulse * 0.18) * switchFactor})`;
          ctx.fillRect(x + 10, y + 10, INAGENT_CELL - 20, INAGENT_CELL - 20);
          ctx.strokeStyle = `rgba(126,230,255,${(0.34 + switchPulse * 0.26) * switchFactor})`;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x + 10.5, y + 10.5, INAGENT_CELL - 21, INAGENT_CELL - 21);
          ctx.fillStyle = '#7ee6ff';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('SW', x + INAGENT_CELL / 2, y + INAGENT_CELL / 2 + 1);
        }

        const flameFactor = getInagentSpawnFactor('flame', r, c);
        if (activeFlames.set.has(inagentCellKey(r, c)) && flameFactor > 0) {
          ctx.fillStyle = `rgba(255,80,10,${0.22 * flameFactor})`;
          ctx.fillRect(x + 1, y + 1, INAGENT_CELL - 2, INAGENT_CELL - 2);
          ctx.strokeStyle = `rgba(255,120,30,${0.7 * flameFactor})`;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(x + 5.5, y + 5.5, INAGENT_CELL - 11, INAGENT_CELL - 11);
          ctx.fillStyle = '#ffb347';
          ctx.font = 'bold 8px monospace';
          ctx.fillText('F', x + INAGENT_CELL / 2, y + INAGENT_CELL / 2 + 1);
        }

      }
    }

    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (lvl.plans && !S.inagent.hasPlans) {
      const plansFactor = getInagentSpawnFactor('plans', lvl.plans.r, lvl.plans.c);
      if (plansFactor > 0) {
        const x = lvl.plans.c * INAGENT_CELL;
        const y = lvl.plans.r * INAGENT_CELL;
        ctx.fillStyle = `rgba(255,204,0,${plansFactor})`;
        ctx.beginPath();
        ctx.arc(x + INAGENT_CELL / 2, y + INAGENT_CELL / 2, INAGENT_CELL * (0.14 + plansFactor * 0.14), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(0,0,0,${plansFactor})`;
        ctx.fillText('?', x + INAGENT_CELL / 2, y + INAGENT_CELL / 2 + 1);
      }
    }

    inagentPickups().filter(inagentPickupAvailable).forEach((pickup) => {
      const pickupFactor = getInagentSpawnFactor('pickup', pickup.r, pickup.c);
      if (pickupFactor <= 0) return;
      const x = pickup.c * INAGENT_CELL;
      const y = pickup.r * INAGENT_CELL;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 380);
      const styleByKind = {
        phase: { glow: '#7ee6ff', icon: 'PH', bg: '#02141a' },
        mine: { glow: '#ff8a65', icon: 'MN', bg: '#1e0a02' },
        emp: { glow: '#9fa8ff', icon: 'EM', bg: '#090b1a' },
        medkit: { glow: '#73ff9f', icon: 'HP', bg: '#031407' },
      };
      const style = styleByKind[pickup.kind] || styleByKind.phase;
      ctx.fillStyle = `rgba(${pickup.kind === 'mine' ? '255,138,101' : pickup.kind === 'emp' ? '159,168,255' : pickup.kind === 'medkit' ? '115,255,159' : '126,230,255'},${(0.18 + pulse * 0.2) * pickupFactor})`;
      ctx.beginPath();
      ctx.arc(x + INAGENT_CELL / 2, y + INAGENT_CELL / 2, INAGENT_CELL * (0.1 + pickupFactor * 0.14), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${pickup.kind === 'mine' ? '255,138,101' : pickup.kind === 'emp' ? '159,168,255' : pickup.kind === 'medkit' ? '115,255,159' : '126,230,255'},${(0.25 + pulse * 0.35) * pickupFactor})`;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 9.5, y + 9.5, INAGENT_CELL - 19, INAGENT_CELL - 19);
      ctx.fillStyle = `rgba(${style.bg === '#02141a' ? '2,20,26' : style.bg === '#1e0a02' ? '30,10,2' : style.bg === '#090b1a' ? '9,11,26' : '3,20,7'},${pickupFactor})`;
      ctx.font = 'bold 8px monospace';
      ctx.fillText(style.icon, x + INAGENT_CELL / 2, y + INAGENT_CELL / 2 + 1);
    });

    if (lvl.exit) {
      const exitFactor = getInagentSpawnFactor('exit', lvl.exit.r, lvl.exit.c);
      if (exitFactor > 0) {
        const ex = lvl.exit.c * INAGENT_CELL;
        const ey = lvl.exit.r * INAGENT_CELL;
        const exitColor = S.inagent.hasPlans ? '#c8ff00' : '#c8ff0033';
        ctx.globalAlpha = exitFactor;
        ctx.strokeStyle = exitColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(ex + 6, ey + 6, INAGENT_CELL - 12, INAGENT_CELL - 12);
        ctx.fillStyle = exitColor;
        ctx.font = 'bold 10px monospace';
        ctx.fillText('EXIT', ex + INAGENT_CELL / 2, ey + INAGENT_CELL / 2 + 1);
        ctx.globalAlpha = 1;
      }
    }

    S.inagent.mines.forEach((mine) => {
      const mineFactor = getInagentSpawnFactor('mine', mine.r, mine.c);
      if (mineFactor <= 0) return;
      const mx = mine.c * INAGENT_CELL;
      const my = mine.r * INAGENT_CELL;
      ctx.fillStyle = `rgba(255,70,40,${0.22 * mineFactor})`;
      ctx.fillRect(mx + 11, my + 11, INAGENT_CELL - 22, INAGENT_CELL - 22);
      ctx.strokeStyle = `rgba(255,120,70,${0.75 * mineFactor})`;
      ctx.lineWidth = 1.1;
      ctx.strokeRect(mx + 11.5, my + 11.5, INAGENT_CELL - 23, INAGENT_CELL - 23);
      ctx.fillStyle = `rgba(255,154,122,${mineFactor})`;
      ctx.font = 'bold 9px monospace';
      ctx.fillText('✹', mx + INAGENT_CELL / 2, my + INAGENT_CELL / 2 + 1);
    });

    S.inagent.guards.forEach((guard) => {
      const x = guard.c * INAGENT_CELL;
      const y = guard.r * INAGENT_CELL;
      const guardFactor = getInagentSpawnFactor('guard', guard.r, guard.c);
      drawInagentPulseNode(
        ctx,
        x,
        y,
        INAGENT_CELL * 0.3,
        S.inagent.guardsFrozen > 0 ? '#7aa0ff' : '#ff3030',
        'G',
        '#000',
        guardFactor,
      );
    });

    const px = S.inagent.player.c * INAGENT_CELL;
    const py = S.inagent.player.r * INAGENT_CELL;
    const playerInHiddenPassage = inagentIsHiddenPassage(S.inagent.player.r, S.inagent.player.c);
    const playerFactor = getInagentSpawnFactor('player', S.inagent.player.r, S.inagent.player.c);
    if (playerInHiddenPassage) {
      ctx.fillStyle = 'rgba(18,28,36,0.42)';
      ctx.fillRect(px + 6, py + 6, INAGENT_CELL - 12, INAGENT_CELL - 12);
      ctx.strokeStyle = 'rgba(126,230,255,0.36)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 8.5, py + 8.5, INAGENT_CELL - 17, INAGENT_CELL - 17);
    }
    drawInagentPulseNode(
      ctx,
      px,
      py,
      INAGENT_CELL * 0.3,
      playerInHiddenPassage ? '#8ff0ff' : (S.inagent.phaseActive ? '#7ee6ff' : '#c8ff00'),
      'P',
      '#000',
      playerFactor,
      playerInHiddenPassage ? 0.58 : 1,
    );
  }

  function flashInagent(msg) {
    S.inagent.flashMsg = msg;
    S.inagent.flashTimer = 10;
  }

  function moveInagentGuard(guard) {
    if (S.inagent.decoyTarget) {
      const dr = S.inagent.decoyTarget.r - guard.r;
      const dc = S.inagent.decoyTarget.c - guard.c;
      const options = Math.abs(dr) >= Math.abs(dc)
        ? [[Math.sign(dr), 0], [0, Math.sign(dc)]]
        : [[0, Math.sign(dc)], [Math.sign(dr), 0]];
      for (const [mr, mc] of options) {
        if (mr === 0 && mc === 0) continue;
        if (!inagentWall(guard.r + mr, guard.c + mc)) {
          guard.r += mr;
          guard.c += mc;
          return;
        }
      }
    }
    const dr = S.inagent.player.r - guard.r;
    const dc = S.inagent.player.c - guard.c;
    const options = Math.abs(dr) >= Math.abs(dc)
      ? [[Math.sign(dr), 0], [0, Math.sign(dc)]]
      : [[0, Math.sign(dc)], [Math.sign(dr), 0]];
    for (const [mr, mc] of options) {
      if (mr === 0 && mc === 0) continue;
      if (!inagentWall(guard.r + mr, guard.c + mc)) {
        guard.r += mr;
        guard.c += mc;
        return;
      }
    }
  }

  function inagentHit() {
    return S.inagent.guards.some((guard) => guard.r === S.inagent.player.r && guard.c === S.inagent.player.c);
  }

  function inagentCrossed(prevPlayer, nextPlayer, prevGuardMap, nextGuards) {
    return nextGuards.some((guard) => {
      const prev = prevGuardMap.get(guard.id);
      if (!prev) return false;
      return (
        guard.r === prevPlayer.r &&
        guard.c === prevPlayer.c &&
        prev.r === nextPlayer.r &&
        prev.c === nextPlayer.c
      );
    });
  }

  function tickInagentDoorState() {
    if (S.inagent.doorTimer > 0) {
      S.inagent.doorTimer -= 1;
      if (S.inagent.doorTimer <= 0) {
        S.inagent.openDoors = [];
        S.inagent.decoyTarget = null;
      }
    }
  }

  function activateInagentSwitch(switchNode) {
    if (!switchNode) return;
    S.inagent.openDoors = (switchNode.doors || []).map((door) => ({ ...door }));
    S.inagent.doorTimer = 5;
    S.inagent.decoyTarget = { r: switchNode.r, c: switchNode.c };
    flashInagent('ПУЛЬТ АКТИВЕН — ДВЕРЬ ОТКРЫТА, ОХРАНА ОТВЛЕЧЕНА');
  }

  function activateInagentPhase() {
    if (S.inagent.phaseActive) {
      flashInagent('ФАЗОВЫЙ ШАГ УЖЕ ВЗВЕДЕН');
      return true;
    }
    if (S.inagent.phaseCharges <= 0) {
      flashInagent('ФАЗОВЫЙ МОДУЛЬ ПУСТ');
      return true;
    }
    S.inagent.phaseCharges -= 1;
    S.inagent.phaseActive = true;
    flashInagent('ФАЗА ВКЛЮЧЕНА — СЛЕДУЮЩИЙ ШАГ СКВОЗЬ ПРЕГРАДЫ');
    drawInagent();
    updateInagentHud();
    return true;
  }

  function activateInagentMine() {
    if (S.inagent.mineCharges <= 0) {
      flashInagent('МИН НЕТ');
      return true;
    }
    const tileOccupiedByMine = S.inagent.mines.some((mine) => (
      mine.r === S.inagent.player.r && mine.c === S.inagent.player.c
    ));
    if (tileOccupiedByMine) {
      flashInagent('МИНА УЖЕ ЛЕЖИТ ПОД НОГАМИ');
      drawInagent();
      updateInagentHud();
      return true;
    }
    if (S.inagent.phaseActive) {
      flashInagent('СНАЧАЛА ПОТРАТЬ ФАЗУ ИЛИ СНИМИ ЕЁ ХОДОМ');
      drawInagent();
      updateInagentHud();
      return true;
    }
    S.inagent.mineCharges -= 1;
    S.inagent.mines.push({ r: S.inagent.player.r, c: S.inagent.player.c });
    flashInagent('МИНА УСТАНОВЛЕНА — ЛЮБОЙ, КТО ВСТУПИТ, ПОДОРВЁТСЯ');
    stepInagent(0, 0, { isAction: true });
    return true;
  }

  function activateInagentEmp() {
    if (S.inagent.empCharges <= 0) {
      flashInagent('EMP ПУСТ');
      return true;
    }
    S.inagent.empCharges -= 1;
    S.inagent.guardsFrozen = Math.max(S.inagent.guardsFrozen, 2);
    flashInagent('EMP ИМПУЛЬС — ОХРАНА ЗАМОРОЖЕНА');
    stepInagent(0, 0, { isAction: true });
    return true;
  }

  function applyInagentPickup(pickup) {
    if (!pickup) return;
    S.inagent.collectedPickups.add(inagentPickupKey(pickup));
    if (pickup.kind === 'phase') {
      S.inagent.phaseCharges += 1;
      S.inagent.phaseCollected = true;
      flashInagent('ФАЗОВЫЙ МОДУЛЬ НАЙДЕН — НАЖМИ Q');
      return;
    }
    if (pickup.kind === 'mine') {
      S.inagent.mineCharges += 1;
      flashInagent('ПОЛУЧЕНА МИНА — M ЧТОБЫ УСТАНОВИТЬ');
      return;
    }
    if (pickup.kind === 'emp') {
      S.inagent.empCharges += 1;
      flashInagent('ПОЛУЧЕН EMP — E ЧТОБЫ ЗАМОРОЗИТЬ ОХРАНУ');
      return;
    }
    if (pickup.kind === 'medkit') {
      const prev = S.inagent.lives;
      S.inagent.lives = Math.min(S.inagent.maxLives, S.inagent.lives + 1);
      flashInagent(S.inagent.lives > prev ? 'МЕД-ПАКЕТ: +1 ЖИЗНЬ' : 'МЕД-ПАКЕТ: ЗДОРОВЬЕ ПОЛНОЕ');
    }
  }

  function resolveInagentMines() {
    if (!S.inagent.mines.length) return { guardDetonations: 0, playerDetonated: false };
    const mineMap = new Map(S.inagent.mines.map((mine) => [inagentCellKey(mine.r, mine.c), mine]));
    const survivors = [];
    let guardDetonations = 0;
    S.inagent.guards.forEach((guard) => {
      const key = inagentCellKey(guard.r, guard.c);
      if (mineMap.has(key)) {
        mineMap.delete(key);
        guardDetonations += 1;
      } else {
        survivors.push(guard);
      }
    });
    const playerKey = inagentCellKey(S.inagent.player.r, S.inagent.player.c);
    const playerDetonated = mineMap.has(playerKey);
    if (playerDetonated) mineMap.delete(playerKey);
    if (!guardDetonations && !playerDetonated) {
      return { guardDetonations: 0, playerDetonated: false };
    }
    S.inagent.guards = survivors;
    S.inagent.mines = Array.from(mineMap.values());
    return { guardDetonations, playerDetonated };
  }

  function resolveInagentFlames() {
    const activeFlames = inagentFlameCellsForTick();
    if (!activeFlames.set.size) return { playerBurned: false, guardsBurned: 0 };
    const survivors = [];
    let guardsBurned = 0;
    S.inagent.guards.forEach((guard) => {
      if (activeFlames.set.has(inagentCellKey(guard.r, guard.c))) {
        guardsBurned += 1;
      } else {
        survivors.push(guard);
      }
    });
    S.inagent.guards = survivors;
    return {
      playerBurned: activeFlames.set.has(inagentCellKey(S.inagent.player.r, S.inagent.player.c)),
      guardsBurned,
    };
  }

  function showInagentTransition(nextLevel) {
    S.inagent.state = 'trans';
    setInagentScreen('trans');
    if (R.inagentTransText) {
      R.inagentTransText.innerHTML = `СЕКТОР ${nextLevel} ПРОЙДЕН<br><span style="color:#c8ff0055;font-size:11px">ТЫ ПРОНИКАЕШЬ ГЛУБЖЕ В ЗАМОК...</span><br><span style="color:#c8ff0033;font-size:10px">СЕКТОР ${nextLevel + 1} / ${INAGENT_LEVELS.length}</span>`;
    }
    if (S.inagent.transitionTimer) clearTimeout(S.inagent.transitionTimer);
    S.inagent.transitionTimer = setTimeout(() => {
      S.inagent.transitionTimer = null;
      if (!S.inagent.open) return;
      initInagent(nextLevel);
    }, 1800);
  }

  function showInagentEnd(won) {
    S.inagent.state = won ? 'win' : 'dead';
    drawInagent();
    setInagentScreen('end');
    if (R.inagentEndTitle) {
      R.inagentEndTitle.textContent = won ? 'ПОБЕГ УДАЛСЯ' : 'ПОЙМАЛИ';
      R.inagentEndTitle.style.color = won ? '#c8ff00' : '#ff3030';
    }
    if (R.inagentEndMoves) R.inagentEndMoves.textContent = `ВСЕГО ХОДОВ: ${S.inagent.moves}`;
    if (won) {
      if (OMS.secrets) OMS.secrets.unlockSecret('inagent', { source: 'inagent_escape' });
      setSnakeStatus('ИНАГЕНТ ПРОЙДЕН // СЕКРЕТ СОХРАНЕН', 1800);
    }
  }

  function resetInagentLevelState(level = S.inagent.level, options = {}) {
    S.inagent.level = level;
    S.inagent.player = { r: 1, c: 1 };
    S.inagent.guards = inagentLevel().guards.map((guard, idx) => ({ ...guard, id: `L${level}-G${idx}` }));
    S.inagent.hasPlans = false;
    S.inagent.moves = 0;
    S.inagent.state = 'play';
    S.inagent.flashMsg = '';
    S.inagent.flashTimer = 0;
    S.inagent.openDoors = [];
    S.inagent.doorTimer = 0;
    S.inagent.decoyTarget = null;
    S.inagent.phaseActive = false;
    S.inagent.mines = [];
    S.inagent.guardsFrozen = 0;
    S.inagent.flamerTick = 0;
    if (!options.keepPickups) S.inagent.collectedPickups = new Set();
  }

  function initInagent(level = 0) {
    resetInagentLevelState(level);
    if (level === 0) {
      S.inagent.phaseCharges = 0;
      S.inagent.phaseCollected = false;
      S.inagent.mineCharges = 0;
      S.inagent.empCharges = 0;
      S.inagent.maxLives = 3;
      S.inagent.lives = S.inagent.maxLives;
    }
    S.inagent.introStartedAt = 0;
    S.inagent.introRevealMs = 0;
    setInagentScreen(null);
    drawInagent();
    updateInagentHud();
  }

  function playInagentReveal() {
    S.inagent.introStartedAt = Date.now();
    S.inagent.introRevealMs = 920;
    const tick = () => {
      if (!S.inagent.open || !S.inagent.introRevealMs) return;
      drawInagent();
      if (getInagentRevealProgress() >= 1) {
        S.inagent.introStartedAt = 0;
        S.inagent.introRevealMs = 0;
        drawInagent();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function handleInagentLifeLoss() {
    S.inagent.lives -= 1;
    if (S.inagent.lives <= 0) {
      S.inagent.lives = 0;
      showInagentEnd(false);
      updateInagentHud();
      return;
    }
    const left = S.inagent.lives;
    const resourceSnapshot = {
      phaseCharges: S.inagent.phaseCharges,
      phaseCollected: S.inagent.phaseCollected,
      mineCharges: S.inagent.mineCharges,
      empCharges: S.inagent.empCharges,
      collectedPickups: new Set(S.inagent.collectedPickups),
    };
    resetInagentLevelState(S.inagent.level, { keepPickups: true });
    S.inagent.phaseCharges = resourceSnapshot.phaseCharges;
    S.inagent.phaseCollected = resourceSnapshot.phaseCollected;
    S.inagent.mineCharges = resourceSnapshot.mineCharges;
    S.inagent.empCharges = resourceSnapshot.empCharges;
    S.inagent.collectedPickups = resourceSnapshot.collectedPickups;
    flashInagent(`ТЕБЯ ЗАМЕТИЛИ // -1 ЖИЗНЬ // ОСТАЛОСЬ: ${left}`);
    drawInagent();
    updateInagentHud();
  }

  function stepInagent(dr, dc, options = {}) {
    if (!S.inagent.open || S.inagent.state !== 'play') return;
    const isAction = options.isAction === true;
    const prevPlayer = { ...S.inagent.player };
    const phaseStep = !isAction && S.inagent.phaseActive;
    let nr = S.inagent.player.r;
    let nc = S.inagent.player.c;
    let phaseOverlapGuardIds = new Set();
    if (!isAction) {
      nr = S.inagent.player.r + dr;
      nc = S.inagent.player.c + dc;
      if (inagentIsSecret(nr, nc)) {
        S.inagent.phaseActive = false;
        S.inagent.moves += 1;
        updateInagentHud();
        showInagentTransition(S.inagent.level + 1);
        return;
      }
      if (inagentOutOfBounds(nr, nc)) return;
      const currentHiddenPassage = inagentHiddenPassageAt(S.inagent.player.r, S.inagent.player.c);
      const targetHiddenPassage = inagentHiddenPassageAt(nr, nc);
      if (currentHiddenPassage && !targetHiddenPassage) {
        const exitTarget = inagentHiddenPassageExitTarget(currentHiddenPassage);
        if (!exitTarget || exitTarget.r !== nr || exitTarget.c !== nc) return;
      }
      if (targetHiddenPassage && !inagentHiddenPassageAllowsEntry(targetHiddenPassage, S.inagent.player.r, S.inagent.player.c)) {
        return;
      }
      if (!phaseStep && !targetHiddenPassage && inagentWall(nr, nc)) return;
      if (phaseStep) {
        phaseOverlapGuardIds = new Set(
          S.inagent.guards
            .filter((guard) => guard.r === nr && guard.c === nc)
            .map((guard) => guard.id),
        );
      }
      S.inagent.phaseActive = false;
      S.inagent.player.r = nr;
      S.inagent.player.c = nc;
    } else {
      nr = S.inagent.player.r;
      nc = S.inagent.player.c;
    }
    S.inagent.moves += 1;

    const lvl = inagentLevel();
    const prevGuardMap = new Map(S.inagent.guards.map((guard) => [guard.id, { r: guard.r, c: guard.c }]));
    const switchNode = inagentSwitchAt(nr, nc);
    const pickup = inagentPickupAt(nr, nc);
    if (pickup) applyInagentPickup(pickup);
    if (!isAction && lvl.plans && !S.inagent.hasPlans && nr === lvl.plans.r && nc === lvl.plans.c) {
      S.inagent.hasPlans = true;
      flashInagent('ПЛАНЫ ПОЛУЧЕНЫ — БЕГИ К ВЫХОДУ!');
    }
    if (switchNode && !isAction) activateInagentSwitch(switchNode);
    if (lvl.exit && S.inagent.hasPlans && nr === lvl.exit.r && nc === lvl.exit.c) {
      showInagentEnd(true);
      updateInagentHud();
      return;
    }

    tickInagentDoorState();
    S.inagent.flamerTick += 1;
    const guardsFrozenNow = S.inagent.guardsFrozen > 0;
    if (!guardsFrozenNow) {
      if (phaseOverlapGuardIds.size) {
        S.inagent.guards.forEach((guard) => {
          if (!phaseOverlapGuardIds.has(guard.id)) return;
          guard.r = prevPlayer.r;
          guard.c = prevPlayer.c;
        });
      }
      S.inagent.guards.forEach((guard) => {
        if (phaseOverlapGuardIds.has(guard.id)) return;
        moveInagentGuard(guard);
      });
    }

    const mineResult = resolveInagentMines();
    const flameResult = resolveInagentFlames({ phaseStep });
    if (mineResult.guardDetonations) flashInagent(`МИНА СРАБОТАЛА // -${mineResult.guardDetonations} ОХРАНЫ`);
    if (flameResult.guardsBurned) flashInagent(`ОГНЕМЕТ // -${flameResult.guardsBurned} ОХРАНЫ`);
    if (S.inagent.guardsFrozen > 0) S.inagent.guardsFrozen -= 1;

    const caught = !phaseStep && (inagentHit() || inagentCrossed(prevPlayer, S.inagent.player, prevGuardMap, S.inagent.guards));
    if (mineResult.playerDetonated || flameResult.playerBurned || caught) {
      if (mineResult.playerDetonated) flashInagent('ТЫ НАСТУПИЛ НА МИНУ');
      if (flameResult.playerBurned && !mineResult.playerDetonated) flashInagent('ОГНЕМЕТ ЗАДЕЛ ТЕБЯ');
      if (caught && !flameResult.playerBurned && !mineResult.playerDetonated) flashInagent('ОХРАНА ПЕРЕХВАТИЛА ТЕБЯ');
      handleInagentLifeLoss();
      return;
    }

    if (!S.inagent.guards.length && S.inagent.flashTimer <= 0) {
      flashInagent('СЕКТОР ЗАЧИЩЕН — ИЩИ ТАЙНЫЙ ПРОХОД');
    }

    if (S.inagent.flashTimer > 0) S.inagent.flashTimer -= 1;
    drawInagent();
    updateInagentHud();
  }

  function openInagentMode() {
    if (S.currentPhase < 1 || S.lifetimeLimitReached || !R.inagentHost) return;
    S.inagent.open = true;
    R.inagentHost.classList.add('active');
    R.inagentHost.classList.remove('inagent-transform-in');
    R.inagentHost.classList.remove('inagent-start-armed');
    R.inagentHost.classList.add('inagent-intro-open');
    R.inagentHost.setAttribute('aria-hidden', 'false');
    document.body.classList.add('inagent-mode');
    setInagentFieldState({ mode: true });
    if (R.noiseGrid) R.noiseGrid.classList.remove('inagent-transform-out');
    initInagent(0);
    S.inagent.state = 'intro';
    setInagentScreen('intro');
    setSnakeStatus('СЕКРЕТНЫЙ РЕЖИМ // ИНАГЕНТ', 1800);
  }

  function startInagentFromIntro() {
    if (!S.inagent.open || !R.inagentHost || S.inagent.state === 'launching') return;
    S.inagent.state = 'launching';
    if (S.inagent.transitionTimer) clearTimeout(S.inagent.transitionTimer);
    R.inagentHost.classList.add('inagent-start-armed');
    R.inagentHost.dataset.screen = 'play';
    setInagentFieldState({ mode: true, launching: true });
    if (R.noiseGrid) R.noiseGrid.classList.add('inagent-transform-out');
    R.inagentHost.classList.add('inagent-transform-in');
    S.inagent.transitionTimer = setTimeout(() => {
      S.inagent.transitionTimer = null;
      if (!S.inagent.open) return;
      if (R.noiseGrid) R.noiseGrid.classList.remove('inagent-transform-out');
      setInagentFieldState({ mode: true, playing: true });
      R.inagentHost.classList.remove('inagent-transform-in');
      R.inagentHost.classList.remove('inagent-start-armed');
      R.inagentHost.classList.remove('inagent-intro-open');
      initInagent(0);
      setInagentScreen(null);
      playInagentReveal();
    }, INAGENT_START_TRANSITION_MS);
  }

  function toggleInagentMode() {
    if (S.inagent.open) {
      closeInagent();
      return;
    }
    openInagentMode();
  }

  function handleInagentKey(event) {
    if (!S.inagent.open) return false;
    if (event.key === 'b' || event.key === 'B' || event.key === 'и' || event.key === 'И') {
      event.preventDefault();
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeInagent();
      return true;
    }
    if (S.inagent.state === 'intro') {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        startInagentFromIntro();
        return true;
      }
      event.preventDefault();
      return true;
    }
    if (S.inagent.state === 'launching') {
      event.preventDefault();
      return true;
    }
    if (event.key === 'r' || event.key === 'R' || event.key === 'к' || event.key === 'К') {
      event.preventDefault();
      initInagent(0);
      return true;
    }
    if (event.key === 'q' || event.key === 'Q' || event.key === 'й' || event.key === 'Й') {
      event.preventDefault();
      return activateInagentPhase();
    }
    if (event.key === 'm' || event.key === 'M' || event.key === 'ь' || event.key === 'Ь') {
      event.preventDefault();
      return activateInagentMine();
    }
    if (event.key === 'e' || event.key === 'E' || event.key === 'у' || event.key === 'У') {
      event.preventDefault();
      return activateInagentEmp();
    }
    const move = {
      ArrowUp: [-1, 0], w: [-1, 0], W: [-1, 0], ц: [-1, 0], Ц: [-1, 0],
      ArrowDown: [1, 0], s: [1, 0], S: [1, 0], ы: [1, 0], Ы: [1, 0],
      ArrowLeft: [0, -1], a: [0, -1], A: [0, -1], ф: [0, -1], Ф: [0, -1],
      ArrowRight: [0, 1], d: [0, 1], D: [0, 1], в: [0, 1], В: [0, 1],
    }[event.key];
    if (!move) return false;
    event.preventDefault();
    stepInagent(move[0], move[1]);
    return true;
  }

  function getSnakeBrightness(score = S.sponsorQuest.score) {
    const ratio = Math.max(0, Math.min(1, score / S.sponsorQuest.targetScore));
    return 110 + Math.round(ratio * 145);
  }

  function applySnakeCellVisual(cell, tone, isHead) {
    if (!cell) return;
    const front = cell.querySelector('.cell-front');
    if (!front) return;
    const glow = isHead ? 0.95 : 0.72;
    const bgAlpha = isHead ? 0.34 : 0.22;
    const borderAlpha = isHead ? 0.98 : 0.82;
    front.style.borderColor = `rgba(${tone}, ${tone}, ${tone}, ${borderAlpha})`;
    front.style.background = `rgba(${tone}, ${tone}, ${tone}, ${bgAlpha})`;
    front.style.boxShadow = isHead
      ? `0 0 22px rgba(${tone}, ${tone}, ${tone}, ${glow}), inset 0 0 28px rgba(255,255,255,0.28)`
      : `0 0 12px rgba(${tone}, ${tone}, ${tone}, 0.34), inset 0 0 18px rgba(${tone}, ${tone}, ${tone}, 0.16)`;
  }

  function clearSnakeCellVisual(cell) {
    if (!cell) return;
    const front = cell.querySelector('.cell-front');
    if (!front) return;
    front.style.borderColor = '';
    front.style.background = '';
    front.style.boxShadow = '';
  }

  function setSnakeStatus(text, holdMs = 1200) {
    if (!R.statusLine || S.currentPhase < 1) return;
    R.statusLine.textContent = text;
    R.statusLine.style.opacity = '1';
    clearTimeout(S.sponsorQuest.statusTimer);
    S.sponsorQuest.statusTimer = setTimeout(() => {
      R.statusLine.style.opacity = '0';
    }, holdMs);
  }

  function canQueueSnakeTurn(nextX, nextY) {
    if (nextX === 0 && nextY === 0) return false;
    if (!S.sponsorQuest.ready) return true;
    const bodyLen = S.sponsorQuest.snakeTail.length;
    if (bodyLen <= 1) return true;
    return !(
      nextX === -S.sponsorQuest.directionX &&
      nextY === -S.sponsorQuest.directionY
    );
  }

  function clearSponsorQuestWarning() {
    const warning = document.getElementById('sponsor-quest-warning');
    if (warning) warning.remove();
  }

  function stopSponsorQuestLoop() {
    if (S.sponsorQuest.tickTimer) {
      clearInterval(S.sponsorQuest.tickTimer);
      S.sponsorQuest.tickTimer = null;
    }
  }

  function startSponsorQuestLoop() {
    if (!S.sponsorQuest.active || !S.sponsorQuest.ready || S.sponsorQuest.paused) return;
    if (S.sponsorQuest.tickTimer) return;
    S.sponsorQuest.tickTimer = setInterval(() => {
      tickSnake();
    }, S.sponsorQuest.speedMs || 300);
  }

  function handleSponsorQuestOverlayKey(event) {
    if (!S.sponsorQuest.active || S.sponsorQuest.ready) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const ignored = new Set([
      'Shift',
      'Control',
      'Alt',
      'Meta',
      'CapsLock',
      'Tab',
      'Escape',
    ]);
    if (ignored.has(event.key)) return;
    event.preventDefault();
    beginSponsorQuestPlay();
  }

  function beginSponsorQuestPlay() {
    if (!S.sponsorQuest.active || S.sponsorQuest.ready) return;
    clearSponsorQuestWarning();
    stopSponsorQuestLoop();
    S.sponsorQuest.ready = true;
    S.sponsorQuest.paused = false;
    OMS.audioApi.startSnakeMode();
    startSponsorQuestLoop();
    OMS.audioApi.playSnakeTurnCue();
    setSnakeStatus('РЕЖИМ ЗАПУЩЕН // ИЩИ ДОБЫЧУ', 1800);
  }

  function pauseSponsorQuest() {
    if (!S.sponsorQuest.active || !S.sponsorQuest.ready || S.sponsorQuest.paused) return;
    S.sponsorQuest.paused = true;
    stopSponsorQuestLoop();
  }

  function resumeSponsorQuest() {
    if (!S.sponsorQuest.active || !S.sponsorQuest.ready || !S.sponsorQuest.paused) return;
    if (document.hidden || S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    S.sponsorQuest.paused = false;
    startSponsorQuestLoop();
  }

  function buildSnakeFailureMessage(prefix) {
    const collected = S.sponsorQuest.score;
    const remaining = Math.max(0, S.sponsorQuest.targetScore - collected);
    return `${prefix} // СОБРАНО ${collected}/${S.sponsorQuest.targetScore} // ОСТАЛОСЬ ${remaining}`;
  }

  function finalizeSponsorSecret() {
    const cells = document.querySelectorAll('.noise-cell');
    cells.forEach((cell) => {
      cell.classList.add('snake-complete');
    });
    OMS.audioApi.playSnakeSuccess();
    setSnakeStatus('ВЫ РАСКРЫЛИ СЕКРЕТ. УРА.', 2400);
    clearTimeout(S.sponsorQuest.completeTimer);
    S.sponsorQuest.completeTimer = setTimeout(() => {
      resetSponsorQuest('СЕКРЕТ РАСКРЫТ: ЗМЕЙКА ДОБАВЛЕНА В КОЛЛЕКЦИЮ');
      cells.forEach((cell) => cell.classList.remove('snake-complete'));
      if (OMS.secrets) OMS.secrets.unlockSecret('sponsor_snake', { source: 'sponsor_snake_quest' });
    }, 2200);
  }

  function ensureSponsorQuestUi() {
    let panel = document.getElementById('sponsor-quest-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'sponsor-quest-panel';
    panel.style.cssText = `
      position:fixed;right:20px;bottom:90px;z-index:220;
      border:1px solid rgba(255,170,0,0.55);background:rgba(0,0,0,0.88);
      box-shadow:0 0 16px rgba(255,170,0,0.18);padding:8px 10px;
      min-width:220px;font-family:'Share Tech Mono',monospace;
      color:rgba(255,170,0,0.95);letter-spacing:0.08em;
    `;
    panel.innerHTML = `
      <div style="font-size:10px;opacity:0.9;">СЕКРЕТНЫЙ РЕЖИМ: ЗМЕЙКА</div>
      <div id="sponsor-quest-score" style="font-size:12px;margin-top:4px;">ОЧКИ: 0 / 100</div>
      <button id="sponsor-quest-exit" type="button" style="
        margin-top:8px;font-family:'VT323',monospace;font-size:16px;
        background:#ff0033;color:#fff;border:none;padding:4px 10px;cursor:pointer;letter-spacing:0.15em;">
        ВЫЙТИ ИЗ РЕЖИМА
      </button>
    `;
    document.body.appendChild(panel);
    const exitBtn = document.getElementById('sponsor-quest-exit');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        resetSponsorQuest('РЕЖИМ ЗМЕЙКИ ЗАКРЫТ');
      });
    }
    return panel;
  }

  function updateSponsorQuestUi() {
    if (!S.sponsorQuest.active) {
      clearSponsorQuestUi();
      return;
    }
    ensureSponsorQuestUi();
    const scoreEl = document.getElementById('sponsor-quest-score');
    if (scoreEl) {
      scoreEl.textContent = `ДОБЫЧА: ${S.sponsorQuest.score} / ${S.sponsorQuest.targetScore} // ДЛИНА: ${S.sponsorQuest.snakeTail.length}`;
    }
  }

  function paintQuestTarget(cells) {
    if (!S.sponsorQuest.active) return;
  clearQuestMarks(cells);
    const idx = S.sponsorQuest.objective.y * 10 + S.sponsorQuest.objective.x;
    const cell = cells[idx];
    if (!cell) return;
    const marker = document.createElement('div');
    marker.className = 'quest-target';
    marker.style.cssText = `
      position:absolute; inset:0;
      display:flex; align-items:center; justify-content:center;
      font-size:10px; color:#ff0033; text-shadow:0 0 10px #ff0033;
      pointer-events:none; z-index:6; letter-spacing:0.05em;
    `;
    marker.textContent = '✦';
    cell.appendChild(marker);
  }

  function resetSponsorQuest(reason = '', options = {}) {
    const suppressStatus = options.suppressStatus === true;
    clearTimeout(S.sponsorQuest.startTimer);
    clearTimeout(S.sponsorQuest.completeTimer);
    clearTimeout(S.sponsorQuest.statusTimer);
    clearSponsorQuestWarning();
    document.removeEventListener('keydown', handleSponsorQuestOverlayKey, true);
    S.sponsorQuest.active = false;
    S.sponsorQuest.ready = false;
    S.sponsorQuest.score = 0;
    S.sponsorQuest.snakeTail = [];
    S.sponsorQuest.directionX = 0;
    S.sponsorQuest.directionY = 0;
    S.sponsorQuest.intentX = 0;
    S.sponsorQuest.intentY = 0;
    S.sponsorQuest.paused = false;
    stopSponsorQuestLoop();
    const cells = document.querySelectorAll('.noise-cell');
    clearQuestMarks(cells);
    clearSponsorTrail();
    cells.forEach((cell) => {
      cell.classList.remove('sponsor', 'sponsor-tail', 'sponsor-head', 'snake-complete');
      clearSnakeCellVisual(cell);
      clearSponsorClickBindings(cell);
      restoreCellLabel(cell);
    });
    const baseIdx = 42;
    const baseCell = cells[baseIdx];
    if (baseCell) {
      baseCell.classList.add('sponsor');
      const lbl = baseCell.querySelector('.cell-label');
      if (lbl) lbl.textContent = 'АРКАДА';
      bindSponsorDoubleClick(baseCell);
    }
    S.sponsorGridX = 2;
    S.sponsorGridY = 4;
    OMS.audioApi.stopSnakeMode();
    updateSponsorQuestUi();
    if (reason && !suppressStatus && R.statusLine && S.currentPhase >= 1) {
      R.statusLine.textContent = reason;
      R.statusLine.style.opacity = '1';
      setTimeout(() => { R.statusLine.style.opacity = '0'; }, 1800);
    }
  }

  function startSponsorQuest() {
    const cells = document.querySelectorAll('.noise-cell');
    if (!cells.length || S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    clearSponsorQuestWarning();
    stopSponsorQuestLoop();
    S.sponsorQuest.active = true;
    S.sponsorQuest.ready = false;
    S.sponsorQuest.paused = false;
    S.sponsorQuest.score = 0;
    S.sponsorQuest.snakeTail = [S.sponsorGridY * 10 + S.sponsorGridX];
    S.sponsorQuest.directionX = 0;
    S.sponsorQuest.directionY = 1;
    S.sponsorQuest.intentX = 0;
    S.sponsorQuest.intentY = 1;
    S.sponsorQuest.lastStepAt = Date.now();
    const forbidden = new Set([S.sponsorGridY * 10 + S.sponsorGridX, 42]);
    let ox = 0;
    let oy = 0;
    do {
      ox = Math.floor(Math.random() * 10);
      oy = Math.floor(Math.random() * 10);
    } while (forbidden.has(oy * 10 + ox));
    S.sponsorQuest.objective.x = ox;
    S.sponsorQuest.objective.y = oy;
    document.body.classList.add('snake-mode');
    cells.forEach((cell) => {
      clearSponsorClickBindings(cell);
      cell.classList.remove('sponsor');
    });
    paintQuestTarget(cells);
    renderSnake(cells);
    updateSponsorQuestUi();
    const warning = document.createElement('div');
    warning.id = 'sponsor-quest-warning';
    warning.className = 'snake-start-overlay';
    warning.innerHTML = `
      <div class="snake-start-card">
        <div class="snake-start-kicker">СЕКРЕТНЫЙ РЕЖИМ</div>
        <div class="snake-start-title">ЗМЕЙКА</div>
        <div class="snake-start-copy">
          Чтобы <b>засчитать секрет</b>, съешь <b>15 добычи</b>.<br>
          После каждой добычи змейка растет и становится светлее.
        </div>
        <div class="snake-start-rules">
          <div class="snake-start-rules-title">УПРАВЛЕНИЕ</div>
          <div class="snake-start-rules-copy">
            Стрелки, <b>WASD</b> или свайпы.<br>
            Оно будет странным, придется привыкнуть.
          </div>
        </div>
        <div class="snake-start-actions">
          <button id="sponsor-quest-start" class="snake-start-button" type="button">НАЧАТЬ</button>
          <button id="sponsor-quest-close" class="snake-start-ghost" type="button">ВЫЙТИ ИЗ РЕЖИМА</button>
        </div>
        <div class="snake-start-footnote">
          Секрет добавится в счетчик только после 15 добычи.
        </div>
      </div>
    `;
    document.body.appendChild(warning);
    const startBtn = document.getElementById('sponsor-quest-start');
    if (startBtn) startBtn.addEventListener('click', beginSponsorQuestPlay);
    const closeBtn = document.getElementById('sponsor-quest-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        resetSponsorQuest('РЕЖИМ ЗМЕЙКИ ЗАКРЫТ');
      });
    }
    document.removeEventListener('keydown', handleSponsorQuestOverlayKey, true);
    document.addEventListener('keydown', handleSponsorQuestOverlayKey, true);
    setSnakeStatus('ЗМЕЙКА ГОТОВА // НАЖМИ ЛЮБУЮ КЛАВИШУ ИЛИ КНОПКУ СТАРТА', 3200);
  }

  function renderSnake(cells) {
    const all = cells || document.querySelectorAll('.noise-cell');
    all.forEach((cell) => {
      cell.classList.remove('sponsor', 'sponsor-head', 'sponsor-tail');
      clearSnakeCellVisual(cell);
      restoreCellLabel(cell);
    });
    const body = S.sponsorQuest.snakeTail;
    const tone = getSnakeBrightness();
    const headTone = Math.min(255, tone + 20);
    body.forEach((idx, i) => {
      const cell = all[idx];
      if (!cell) return;
      if (i === body.length - 1) {
        cell.classList.add('sponsor-head');
        applySnakeCellVisual(cell, headTone, true);
      } else {
        cell.classList.add('sponsor-tail');
        const tailTone = Math.max(95, tone - Math.max(0, body.length - i - 1) * 6);
        applySnakeCellVisual(cell, tailTone, false);
      }
      const lbl = cell.querySelector('.cell-label');
      if (lbl) lbl.textContent = i === body.length - 1 ? 'HEAD' : `${i + 1}`;
    });
  }

  function spawnSnakeFood(cells) {
    let ox = 0;
    let oy = 0;
    const occupied = new Set(S.sponsorQuest.snakeTail);
    do {
      ox = Math.floor(Math.random() * 10);
      oy = Math.floor(Math.random() * 10);
    } while (occupied.has(oy * 10 + ox));
    S.sponsorQuest.objective.x = ox;
    S.sponsorQuest.objective.y = oy;
    paintQuestTarget(cells);
  }

  function tickSnake() {
    if (!S.sponsorQuest.active) return;
    if (S.currentPhase !== 2 || S.lifetimeLimitReached) {
      resetSponsorQuest('', { suppressStatus: true });
      return;
    }
    if (!S.sponsorQuest.ready || S.sponsorQuest.paused) return;
    const cells = document.querySelectorAll('.noise-cell');
    if (!cells.length) return;

    if (S.sponsorQuest.intentX !== 0 || S.sponsorQuest.intentY !== 0) {
      const opposite =
        S.sponsorQuest.intentX === -S.sponsorQuest.directionX &&
        S.sponsorQuest.intentY === -S.sponsorQuest.directionY;
      if (!opposite || S.sponsorQuest.snakeTail.length <= 1) {
        S.sponsorQuest.directionX = S.sponsorQuest.intentX;
        S.sponsorQuest.directionY = S.sponsorQuest.intentY;
      }
    }

    const headIdx = S.sponsorQuest.snakeTail[S.sponsorQuest.snakeTail.length - 1];
    const hx = headIdx % 10;
    const hy = Math.floor(headIdx / 10);
    const nx = hx + S.sponsorQuest.directionX;
    const ny = hy + S.sponsorQuest.directionY;

    if (nx < 0 || nx > 9 || ny < 0 || ny > 9) {
      OMS.audioApi.playSnakeFail();
      resetSponsorQuest(buildSnakeFailureMessage('ТЫ ВРЕЗАЛСЯ В КРАЙ'));
      return;
    }

    const nextIdx = ny * 10 + nx;
    if (S.sponsorQuest.snakeTail.includes(nextIdx)) {
      OMS.audioApi.playSnakeFail();
      resetSponsorQuest(buildSnakeFailureMessage('ТЫ ВРЕЗАЛСЯ В ХВОСТ'));
      return;
    }

    S.sponsorQuest.snakeTail.push(nextIdx);
    S.sponsorGridX = nx;
    S.sponsorGridY = ny;
    const foodCell = cells[S.sponsorQuest.objective.y * 10 + S.sponsorQuest.objective.x];
    if (foodCell && !foodCell.querySelector('.quest-target')) {
      paintQuestTarget(cells);
    }
    const hitFood = nx === S.sponsorQuest.objective.x && ny === S.sponsorQuest.objective.y;
    if (hitFood) {
      clearQuestCellMark(foodCell);
      S.sponsorQuest.score += 1;
      OMS.audioApi.playSnakeEat(Math.max(0, S.sponsorQuest.score - 1) / S.sponsorQuest.targetScore);
      setSnakeStatus(`ДОБЫЧА ${S.sponsorQuest.score}/${S.sponsorQuest.targetScore} // ЗМЕЙКА РАСТЁТ`, 900);
      if (S.sponsorQuest.score >= S.sponsorQuest.targetScore) {
        renderSnake(cells);
        updateSponsorQuestUi();
        finalizeSponsorSecret();
        return;
      }
      spawnSnakeFood(cells);
    } else {
      S.sponsorQuest.snakeTail.shift();
    }
    renderSnake(cells);
    updateSponsorQuestUi();
  }

  function showSignalArcade() {
    if (S.signalArcadeShown || S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    S.signalArcadeShown = true;
    const ad = signalAds[Math.floor(Math.random() * signalAds.length)];
    const overlay = document.createElement('div');
    overlay.id = 'signal-arcade-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,0.92); z-index:700;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      gap:16px; font-family:'VT323',monospace; text-align:center; cursor:pointer;
    `;
    overlay.innerHTML = `
      <div style="font-size:clamp(28px,5vw,52px);color:${ad.color};
        text-shadow:0 0 30px ${ad.color};letter-spacing:0.1em;
        animation:arcadePulse 0.4s step-end infinite;">${ad.name}</div>

      <div id="slot-machine" style="
        display:flex; gap:4px; padding:16px 24px;
        background:#111; border:3px solid ${ad.color};
        box-shadow:0 0 40px ${ad.color}, inset 0 0 20px rgba(0,0,0,0.8);
      ">
        <div class="slot-reel" data-reel="0" style="
          width:80px; height:80px; overflow:hidden; position:relative;
          border:2px solid rgba(255,255,255,0.2); background:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:48px;
        ">◇</div>
        <div class="slot-reel" data-reel="1" style="
          width:80px; height:80px; overflow:hidden; position:relative;
          border:2px solid rgba(255,255,255,0.2); background:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:48px;
        ">○</div>
        <div class="slot-reel" data-reel="2" style="
          width:80px; height:80px; overflow:hidden; position:relative;
          border:2px solid rgba(255,255,255,0.2); background:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:48px;
        ">△</div>
      </div>

      <button id="slot-spin-btn" type="button" style="
        font-family:'VT323',monospace; font-size:clamp(20px,3vw,32px);
        background:${ad.color}; color:#000; border:none;
        padding:10px 40px; cursor:pointer; letter-spacing:0.2em;
        box-shadow:0 0 20px ${ad.color};
      ">ЗАПУСТИТЬ</button>

      <div id="slot-result" style="
        font-size:clamp(16px,2.5vw,28px); color:#fff;
        letter-spacing:0.15em; min-height:36px;
      "></div>

      <div style="font-size:clamp(12px,1.8vw,20px);color:rgba(255,255,255,0.4);
        letter-spacing:0.15em;">${ad.text}</div>

      <div style="font-size:clamp(9px,1.2vw,12px);color:rgba(255,255,255,0.15);
        letter-spacing:0.2em;">НАЖМИ ВНЕ ОКНА ЧТОБЫ ЗАКРЫТЬ</div>
    `;
    ensureArcadeStyle();
    const spinBtn = overlay.querySelector('#slot-spin-btn');
    const reels = [...overlay.querySelectorAll('.slot-reel')];
    const resultEl = overlay.querySelector('#slot-result');
    if (spinBtn) {
      spinBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        spinSlots({ spinBtn, reels, resultEl, accentColor: ad.color });
      });
    }
    overlay.addEventListener('click', () => {
      overlay.remove();
      S.signalArcadeShown = false;
    });
    document.body.appendChild(overlay);
    OMS.effects.triggerGlitch(260);
    OMS.audioApi.playGlitchSound();
    if (OMS.secrets) OMS.secrets.unlockSecret('signal_arcade', { source: 'arcade' });
  }

  function ensureArcadeStyle() {
    if (document.getElementById('arcade-style')) return;
    const style = document.createElement('style');
    style.id = 'arcade-style';
    style.textContent = `
      @keyframes arcadePulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
      .slot-reel-spinning { animation: reelBlur 0.1s linear infinite; }
      @keyframes reelBlur { 0%,100%{filter:blur(0)} 50%{filter:blur(2px)} }
    `;
    document.head.appendChild(style);
  }

  function playArcadeSound(type) {
    const A = OMS.audio;
    if (!A.ctx || !A.masterGain) return;
    const t = A.ctx.currentTime;
    if (type === 'spin') {
      const buf = A.ctx.createBuffer(1, A.ctx.sampleRate * 0.04, A.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 300);
      const src = A.ctx.createBufferSource();
      src.buffer = buf;
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.15, t);
      src.connect(g);
      g.connect(A.masterGain);
      src.start();
      return;
    }
    if (type === 'stop') {
      const o = A.ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(180, t);
      o.frequency.linearRampToValueAtTime(80, t + 0.06);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.linearRampToValueAtTime(0, t + 0.08);
      o.connect(g);
      g.connect(A.masterGain);
      o.start();
      o.stop(t + 0.08);
      return;
    }
    if (type === 'coin') {
      [1047, 1319, 1568].forEach((f, i) => {
        const o = A.ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f, t + i * 0.08);
        const g = A.ctx.createGain();
        g.gain.setValueAtTime(0.12, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.2);
        o.connect(g);
        g.connect(A.masterGain);
        o.start();
        o.stop(t + i * 0.08 + 0.2);
      });
      return;
    }
    if (type === 'jackpot') {
      const melody = [523, 659, 784, 659, 784, 1047, 784, 1047, 1319];
      melody.forEach((f, i) => {
        const o = A.ctx.createOscillator();
        o.type = i % 2 === 0 ? 'sine' : 'triangle';
        o.frequency.setValueAtTime(f, t + i * 0.12);
        const g = A.ctx.createGain();
        g.gain.setValueAtTime(0.1, t + i * 0.12);
        g.gain.linearRampToValueAtTime(0, t + i * 0.12 + 0.15);
        o.connect(g);
        g.connect(A.masterGain);
        o.start();
        o.stop(t + i * 0.12 + 0.15);
      });
      return;
    }
    if (type === 'lose') {
      const o = A.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(200, t);
      o.frequency.linearRampToValueAtTime(80, t + 0.4);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.08, t);
      g.gain.linearRampToValueAtTime(0, t + 0.4);
      o.connect(g);
      g.connect(A.masterGain);
      o.start();
      o.stop(t + 0.4);
    }
  }

  function spinSlots({ spinBtn, reels, resultEl, accentColor }) {
    if (!spinBtn || spinBtn.disabled || reels.length !== 3) return;
    spinBtn.disabled = true;
    spinBtn.textContent = '...';
    if (resultEl) resultEl.textContent = '';

    const intervals = reels.map((reel, idx) => setInterval(() => {
      reel.classList.add('slot-reel-spinning');
      reel.textContent = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      playArcadeSound('spin');
    }, 80 + idx * 15));

    const roll = Math.random();
    let final;
    if (roll < 0.05) {
      const s = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      final = [s, s, s];
    } else if (roll < 0.25) {
      const s = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      const other = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      final = Math.random() < 0.5 ? [s, s, other] : [other, s, s];
    } else {
      let a;
      let b;
      let c;
      do { a = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; } while (false);
      do { b = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; } while (b === a);
      do { c = slotSymbols[Math.floor(Math.random() * slotSymbols.length)]; } while (c === a || c === b);
      final = [a, b, c];
    }

    reels.forEach((reel, idx) => {
      setTimeout(() => {
        clearInterval(intervals[idx]);
        reel.classList.remove('slot-reel-spinning');
        reel.textContent = final[idx];
        playArcadeSound('stop');
        if (idx !== 2) return;

        setTimeout(() => {
          const win = final[0] === final[1] && final[1] === final[2];
          const twoMatch = final[0] === final[1] || final[1] === final[2];
          if (win) {
            if (resultEl) {
              resultEl.style.color = accentColor;
              resultEl.textContent = 'ПОЛНОЕ СОВПАДЕНИЕ!';
            }
            playArcadeSound('jackpot');
            OMS.effects.triggerExplosion();
          } else if (twoMatch) {
            if (resultEl) {
              resultEl.style.color = '#fff';
              resultEl.textContent = 'ПОЧТИ СОВПАЛО. ЕЩЁ ЦИКЛ.';
            }
            playArcadeSound('coin');
          } else {
            if (resultEl) {
              resultEl.style.color = 'rgba(255,255,255,0.4)';
              resultEl.textContent = 'НОВЫЙ УЗОР НЕ СОБРАН.';
            }
            playArcadeSound('lose');
          }
          spinBtn.disabled = false;
          spinBtn.textContent = 'ЗАПУСТИТЬ';
        }, 300);
      }, 900 + idx * 700);
    });
  }

  function leaveSponsorTrace(cell) {
    if (!cell) return;
    const star = document.createElement('div');
    star.className = 'sponsor-trace-star';
    star.textContent = '★';
    cell.appendChild(star);
    sponsorTrail.push({ el: star, cell });
    if (sponsorTrail.length > MAX_SPONSOR_TRAIL) {
      const old = sponsorTrail.shift();
      if (old && old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
    }
  }

  function injectSponsorCell() {
    const cells = document.querySelectorAll('.noise-cell');
    const idx = 42;
    const sc = cells[idx];
    if (!sc) return;
    sc.classList.add('sponsor');
    const lbl = sc.querySelector('.cell-label');
    if (lbl) lbl.textContent = 'АРКАДА';
    bindSponsorDoubleClick(sc);
  }

  function moveSponsorCell(dx, dy) {
    if (S.currentPhase !== 2 || S.lifetimeLimitReached) return;
    OMS.audioApi.initAudio();
    const cells = document.querySelectorAll('.noise-cell');
    if (!cells.length) return;

    if (!S.sponsorQuest.active) {
      const oldIdx = S.sponsorGridY * 10 + S.sponsorGridX;
      const oldCell = cells[oldIdx];
      if (oldCell) {
        leaveSponsorTrace(oldCell);
        oldCell.classList.remove('sponsor');
        clearSponsorClickBindings(oldCell);
      }

      S.sponsorGridX = Math.max(0, Math.min(9, S.sponsorGridX + dx));
      S.sponsorGridY = Math.max(0, Math.min(9, S.sponsorGridY + dy));
      const newIdx = S.sponsorGridY * 10 + S.sponsorGridX;
      const newCell = cells[newIdx];
      if (newCell) {
        newCell.classList.add('sponsor');
        const lbl = newCell.querySelector('.cell-label');
        if (lbl) lbl.textContent = 'АРКАДА';
        bindSponsorDoubleClick(newCell);
        OMS.effects.showTooltip('★ СПОНСОР СЕАНСА ★', newCell);
        setTimeout(OMS.effects.hideTooltip, 700);
      }

      startSponsorQuest();
      return;
    }
    if (!S.sponsorQuest.ready) return;
    const reversedX = dx * -1;
    const reversedY = dy * -1;
    if (reversedX === 0 && reversedY === 0) return;
    if (!canQueueSnakeTurn(reversedX, reversedY)) return;
    S.sponsorQuest.intentX = reversedX;
    S.sponsorQuest.intentY = reversedY;
    OMS.audioApi.playSnakeTurnCue();
  }

  function showGodzilla() {
  OMS.effects.triggerGlitch(500);
  OMS.audioApi.playExplosionSound();
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:500;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:VT323,monospace;text-align:center;cursor:pointer;';
  el.innerHTML = `
    <div style="font-size:clamp(10px,1.8vw,16px);color:#ff0033;letter-spacing:0.3em;animation:glitchText 0.5s infinite;">⚠ ЭКСТРЕННОЕ СООБЩЕНИЕ ⚠</div>
    <div style="font-size:clamp(36px,8vw,90px);color:#ff0033;text-shadow:0 0 40px #ff0033;letter-spacing:0.1em;">GODZILLA SIGHTED</div>
    <div style="font-size:clamp(12px,2vw,20px);color:rgba(255,0,51,0.5);letter-spacing:0.2em;">TOKYO — ЭВАКУАЦИЯ НАЧАЛАСЬ</div>
    <div style="font-size:clamp(10px,1.5vw,14px);color:rgba(255,255,255,0.2);letter-spacing:0.3em;">[ НАЖМИ ЧТОБЫ ЗАКРЫТЬ ]</div>
  `;
  el.addEventListener('click', () => {
    el.remove();
    S.godzillaShown = false;
    S.tokyoClicks = 0;
  });
  document.body.appendChild(el);
  if (OMS.secrets) OMS.secrets.unlockSecret('godzilla', { source: 'tokyo_clicks' });
  }

  function triggerScreamer() {
  OMS.audioApi.initAudio();
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:1000;display:flex;align-items:center;justify-content:center;font-family:VT323,monospace;font-size:clamp(100px,25vw,300px);color:#00ff41;text-shadow:0 0 40px #00ff41;';
  overlay.textContent = '3';
  document.body.appendChild(overlay);
  setTimeout(() => { overlay.textContent = '2'; OMS.audioApi.playGlitchSound(); }, 800);
  setTimeout(() => { overlay.textContent = '1'; OMS.audioApi.playGlitchSound(); }, 1600);
  setTimeout(() => {
    overlay.style.background = '#fff';
    overlay.style.color = '#000';
    overlay.style.fontSize = 'clamp(32px,6vw,64px)';
    overlay.textContent = 'МЫ ВСЁ ЗНАЕМ';
    OMS.audioApi.playExplosionSound();
    setTimeout(() => overlay.remove(), 1000);
  }, 2400);
  }

  function triggerPhoneMeme() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:VT323,monospace;cursor:pointer;gap:12px;';
  el.innerHTML = `
    <div style="font-size:clamp(20px,4vw,46px);color:#00ff41;letter-spacing:0.08em;">ВОЗЬМИ ТЕЛЕФОН ДЕТКА</div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:clamp(12px,2vw,20px);color:rgba(0,255,65,0.5);">[ нажми чтобы закрыть ]</div>
  `;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
  }

  function triggerRansheByloLuchshe() {
  OMS.effects.triggerExplosion();
  OMS.audioApi.playExplosionSound();
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;background:#000;z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;cursor:pointer;';
  el.innerHTML = `
    <div style="font-family:VT323,monospace;font-size:clamp(36px,8vw,100px);color:#ffaa00;text-shadow:0 0 30px #ffaa00;letter-spacing:0.05em;text-align:center;line-height:1.1;">РАНЬШЕ<br>БЫЛО<br>ЛУЧШЕ</div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:clamp(11px,1.8vw,18px);color:rgba(255,170,0,0.5);letter-spacing:0.2em;text-align:center;line-height:1.8;">ИНТЕРНЕТ БЫЛ СВОБОДНЫМ<br>САЙТЫ НЕ БЛОКИРОВАЛИ</div>
    <div style="font-family:VT323,monospace;font-size:clamp(14px,2vw,22px);color:rgba(255,170,0,0.3);letter-spacing:0.3em;">[ нажми чтобы закрыть ]</div>
  `;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  }

  function showAccusationMsg(line1, line2, color = '#00ff41', onDone = null) {
  document.querySelectorAll('.accusation-msg').forEach(e => e.remove());
  const el = document.createElement('div');
  el.className = 'accusation-msg';
  el.innerHTML = `<span class="acc-line1" style="color:${color};text-shadow:0 0 20px ${color}">${line1}</span>${line2 ? `<br><span class="acc-line2" style="color:${color};opacity:0.6">${line2}</span>` : ''}`;
  const DURATION = 1600;
  el.style.cssText = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'VT323', monospace;
    text-align: center;
    z-index: 300;
    pointer-events: none;
    animation: accIn ${DURATION}ms ease forwards;
    line-height: 1.1;
  `;
  if (!document.getElementById('acc-style')) {
    const s = document.createElement('style');
    s.id = 'acc-style';
    s.textContent = `
      @keyframes accIn {
        0%   { opacity:0; transform:translate(-50%,-50%) scale(1.3); filter:blur(6px); }
        20%  { opacity:1; transform:translate(-50%,-50%) scale(1);   filter:blur(0); }
        70%  { opacity:1; transform:translate(-50%,-50%) scale(1); }
        100% { opacity:0; transform:translate(-50%,-50%) scale(0.95); }
      }
      .acc-line1 {
        font-size: clamp(36px, 7vw, 90px);
        letter-spacing: 0.05em;
        display: block;
      }
      .acc-line2 {
        font-size: clamp(20px, 4vw, 52px);
        letter-spacing: 0.1em;
        display: block;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(s);
  }
  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
    if (onDone) onDone();
  }, DURATION);
  }

  function applyVariableReinforcement() {
  const rewards = [['ХОРОШО', ''], ['МОЛОДЕЦ', ''], ['ПРИНЯТО', '']];
  const punishments = [
    ['ТЕБЕ ЖЕ СКАЗАЛИ', 'НЕ НАЖИМАТЬ'],
    ['ТЫ СЕРЬЁЗНО?', ''],
    ['МЫ ВСЁ ВИДЕЛИ', ''],
    ['ЗАЧЕМ', ''],
  ];
  const roll = Math.random();

  if (roll < 0.25) {
    const r = rewards[Math.floor(Math.random() * rewards.length)];
    showAccusationMsg(r[0], r[1], '#00ff41', () => {
      OMS.phases.positionBtn();
      R.escapeBtn.style.display = 'block';
    });
  } else if (roll < 0.75) {
    const p = punishments[Math.floor(Math.random() * punishments.length)];
    OMS.effects.triggerGlitch(240);
    showAccusationMsg(p[0], p[1], '#00ff41', () => {
      OMS.phases.positionBtn();
      R.escapeBtn.style.display = 'block';
    });
  } else {
    S.pendingForbiddenSecret = true;
    S.lastBanReason = 'forbidden_button';
    try { localStorage.setItem(OMS.constants.PENDING_FORBIDDEN_SECRET_KEY, '1'); } catch (e) {}
    try { localStorage.setItem(OMS.constants.BAN_REASON_KEY, 'forbidden_button'); } catch (e) {}
    R.escapeBtn.style.display = 'none';
    OMS.effects.triggerGlitch(500);
    OMS.audioApi.playExplosionSound();
    showAccusationMsg('ТЫ ПРОИГРАЛ', '', '#00ff41', () => OMS.phases.goToPhase3Gameover('forbidden_button'));
  }
  }

  function openNews(entryId) {
  const archiveEntries = {
    'archive-alpha': 'АРХИВ АЛЬФА\nЛОКАЛЬНОЕ ОБНОВЛЕНИЕ ЗАВЕРШЕНО.\nВНЕШНИЕ ПОДКЛЮЧЕНИЯ НЕ ТРЕБУЮТСЯ.',
    'archive-beta': 'АРХИВ БЕТА\nСЕТКА ШУМОВ ГОТОВА К НОВОМУ СЕАНСУ.\nДОСТУПНЫ ТОЛЬКО ВНУТРЕННИЕ КАНАЛЫ.',
    'archive-gamma': 'АРХИВ ГАММА\nВИЗУАЛЬНЫЙ МОДУЛЬ СТАБИЛЕН.\nСИГНАЛЫ СОХРАНЕНЫ В ПАМЯТИ БРАУЗЕРА.',
    'archive-delta': 'АРХИВ ДЕЛЬТА\nКОЛЛЕКЦИЯ СЕКРЕТОВ ОБНОВЛЕНА.\nИСТОРИЯ СЕАНСА ОСТАЛАСЬ ЛОКАЛЬНОЙ.',
    'archive-epsilon': 'АРХИВ ЭПСИЛОН\nШУМ ОЧИЩЕН.\nРЕЗЕРВНЫЕ ПОДСКАЗКИ ПОДГОТОВЛЕНЫ.',
    'archive-zeta': 'АРХИВ ЗЕТА\nБЕЗОПАСНЫЙ РЕЖИМ АКТИВЕН.\nВНЕШНИЕ ССЫЛКИ ОТКЛЮЧЕНЫ.',
    'archive-eta': 'АРХИВ ЭТА\nНАБЛЮДАТЕЛЬНАЯ ПАНЕЛЬ ЗАКРЫТА.\nИСПОЛЬЗУЙ E ДЛЯ ВОЗВРАТА.',
  };
  const tip = document.createElement('div');
  tip.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    font-family:'VT323',monospace;font-size:clamp(16px,2.5vw,28px);
    color:#fff;background:#111;padding:16px 24px;z-index:1000;
    border:2px solid rgba(255,255,255,0.2);text-align:center;letter-spacing:0.08em;
    line-height:1.5;white-space:pre-line;
  `;
  tip.textContent = archiveEntries[entryId] || 'ЛОКАЛЬНАЯ ЗАМЕТКА НЕДОСТУПНА';
  tip.addEventListener('click', () => tip.remove());
  document.body.appendChild(tip);
  setTimeout(() => {
    if (tip.parentNode) tip.remove();
  }, 2200);
  }

  function toggleEmergencyExit() {
    S.eeActive = !S.eeActive;
    if (S.eeActive) {
      S.eeTotalDist = 0;
      R.emergencyExit.classList.add('active');
      if (OMS.audio.ctx && OMS.audio.masterGain) OMS.audio.masterGain.gain.linearRampToValueAtTime(0, OMS.audio.ctx.currentTime + 0.2);
      if (OMS.secrets) OMS.secrets.unlockSecret('emergency_exit', { source: 'hotkey' });
    } else {
      R.emergencyExit.classList.remove('active');
      R.emergencyTint.style.opacity = '0';
      if (OMS.audio.ctx && OMS.audio.masterGain && !S.isMuted) OMS.audio.masterGain.gain.linearRampToValueAtTime(S.currentVolume, OMS.audio.ctx.currentTime + 0.2);
      OMS.effects.triggerGlitch(350);
    }
  }

  function setupPassiveFeatures() {
    const tutShown = (() => { try { return localStorage.getItem('oms_tut'); } catch (e) { return null; } })();
    if (S.isMobile && !tutShown && R.mobileTutorial) {
      const steps = [
        { icon: '👆', text: 'СВАЙПАЙ ПО ЯЧЕЙКАМ\\nЧТОБЫ ОТКРЫТЬ ИХ' },
        { icon: '🔍', text: 'КАЖДАЯ ЯЧЕЙКА\\nСКРЫВАЕТ ЧТО-ТО' },
        { icon: '⚠️', text: 'ОСТОРОЖНО\\nМЫ НАБЛЮДАЕМ\\nЗА КАЖДЫМ ДЕЙСТВИЕМ' },
      ];
      let i = 0;
      const iconEl = R.mobileTutorial.querySelector('.tut-icon');
      const update = () => {
        const st = steps[i];
        if (iconEl) iconEl.textContent = st.icon;
        if (R.tutorialText) R.tutorialText.textContent = st.text;
        if (R.tutorialButton) R.tutorialButton.textContent = i < steps.length - 1 ? 'ДАЛЕЕ' : 'НАЧАТЬ';
      };
      OMS.features.tutNext = () => {
        i += 1;
        if (i >= steps.length) {
          R.mobileTutorial.style.display = 'none';
          try { localStorage.setItem('oms_tut', '1'); } catch (e) {}
        } else {
          update();
        }
      };
      setTimeout(() => {
        R.mobileTutorial.style.display = 'flex';
        update();
      }, 1500);
    } else {
      OMS.features.tutNext = () => {};
    }

    R.emergencyDesktop.addEventListener('mousemove', e => {
      if (!S.eeActive) return;
      const rect = R.emergencyDesktop.getBoundingClientRect();
      const px = `${((e.clientX - rect.left) / rect.width * 100).toFixed(1)}%`;
      const py = `${((e.clientY - rect.top) / rect.height * 100).toFixed(1)}%`;
      R.emergencyDesktop.style.setProperty('--mx', px);
      R.emergencyDesktop.style.setProperty('--my', py);
      const dx = e.clientX - S.lastMX;
      const dy = e.clientY - S.lastMY;
      S.eeTotalDist += Math.sqrt(dx * dx + dy * dy);
      const bleed = Math.min(S.eeTotalDist / 2000, 0.85);
      R.emergencyTint.style.opacity = String(bleed);
      if (bleed >= 0.85) setTimeout(() => { if (S.eeActive) toggleEmergencyExit(); }, 400);
    });

    if (R.inagentStartBtn) {
      R.inagentStartBtn.addEventListener('click', () => {
        startInagentFromIntro();
      });
    }
    if (R.inagentRestartBtn) {
      R.inagentRestartBtn.addEventListener('click', () => {
        initInagent(0);
      });
    }
    if (R.inagentCloseBtn) {
      R.inagentCloseBtn.addEventListener('click', () => {
        closeInagent();
      });
    }
  }

  window.addEventListener('oms:phase-reset', () => {
    if (S.sponsorQuest.active) {
      resetSponsorQuest('', { suppressStatus: true });
    } else {
      clearSponsorQuestUi();
    }
  });

  OMS.features = {
    showSignalArcade,
    beginSponsorQuestPlay,
    moveSponsorCell,
    pauseSponsorQuest,
    resumeSponsorQuest,
    resetSponsorQuest,
    showGodzilla,
    triggerScreamer,
    triggerPhoneMeme,
    triggerRansheByloLuchshe,
    openInagent: openInagentMode,
    openInagentMode,
    toggleInagentMode,
    closeInagent,
    handleInagentKey,
    showAccusationMsg,
    applyVariableReinforcement,
    openNews,
    toggleEmergencyExit,
    setupPassiveFeatures,
    injectSponsorCell,
    tutNext: () => {},
  };
})();
