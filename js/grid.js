window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const C = OMS.constants;
  const R = OMS.refs;

  const flipPositive = ['ТЫ МЕНЯ НАШЁЛ', 'НАЖМИ ЕЩЁ', 'ПРОДОЛЖАЙ', 'СИГНАЛ', 'ЭХО', 'КОНТАКТ', 'СМОТРИ', 'ДА', 'ВЕРНО', 'ТЕПЛО'];
  const flipNegative = ['НЕ ТРАТЬ ВРЕМЯ', 'НЕТ', 'ЗАПИСАНО', 'ОШИБКА', 'ЗАЧЕМ', 'МЫ ВИДИМ', 'ФИЛЬТР', 'НЕВЕРНО', 'СТОП', 'ОПАСНО'];

  function getFlipContent() {
    const roll = Math.random();
    if (roll < 0.08) {
      const opts = ['НЕИЗВЕСТЕН', 'СИГНАЛ', 'КАНАЛ', 'НОДА', 'TRACE'];
      return { text: opts[Math.floor(Math.random() * opts.length)], type: 'red' };
    }
    if (roll < 0.35) return { text: flipNegative[Math.floor(Math.random() * flipNegative.length)], type: 'red' };
    return { text: flipPositive[Math.floor(Math.random() * flipPositive.length)], type: 'green' };
  }

  function onCellClick() {
    S.cellClickCount++;
  }

  function buildNoiseGrid() {
    for (let i = 0; i < C.GRID_COUNT; i++) {
      const cell = document.createElement('div');
      cell.className = 'noise-cell';
      cell.dataset.loc = C.LOCATIONS[i % C.LOCATIONS.length];
      const col = i % 10;
      const row = Math.floor(i / 10);
      cell.style.setProperty('--grid-col', String(col));
      cell.style.setProperty('--grid-row', String(row));
      cell.style.setProperty('--grid-wave', String(Math.abs(col - 4.5) + Math.abs(row - 4.5)));

      const inner = document.createElement('div');
      inner.className = 'cell-inner';
      const front = document.createElement('div');
      front.className = 'cell-front';
      const lbl = document.createElement('div');
      lbl.className = 'cell-label';
      lbl.textContent = C.LOCATIONS[i % C.LOCATIONS.length];
      front.appendChild(lbl);
      const back = document.createElement('div');
      back.className = 'cell-back';
      inner.appendChild(front);
      inner.appendChild(back);
      cell.appendChild(inner);

      cell.addEventListener('click', () => {
        if (S.currentPhase !== 2) return;
        if (S.sponsorQuest.active) return;
        const content = getFlipContent();
        back.textContent = content.text;
        back.className = `cell-back${content.type === 'red' ? ' red' : ''}`;
        cell.classList.add('flipped');
        setTimeout(() => cell.classList.remove('flipped'), 1900);
        onCellClick();
        S.seenPct = Math.min(99, S.seenPct + 0.25);
        if (OMS.secrets && S.cellClickCount === 1) {
          OMS.secrets.unlockSecret('first_cell', { source: 'grid_click' });
        }

        if (OMS.audio.ctx && OMS.audio.masterGain) {
          const o = OMS.audio.ctx.createOscillator();
          const g = OMS.audio.ctx.createGain();
          o.type = content.type === 'red' ? 'sawtooth' : 'sine';
          o.frequency.value = content.type === 'red' ? 190 : 620;
          g.gain.value = 0.05;
          g.gain.linearRampToValueAtTime(0, OMS.audio.ctx.currentTime + 0.25);
          o.connect(g);
          g.connect(OMS.audio.masterGain);
          o.start();
          o.stop(OMS.audio.ctx.currentTime + 0.25);
        }
      });

      cell.addEventListener('mouseenter', () => {
        S.activeCells.add(i);
        cell.classList.add('active');
        if (!S.sponsorQuest.active) {
          OMS.effects.showTooltip(`CHANNEL: ${C.LOCATIONS[i % C.LOCATIONS.length]}`, cell);
          OMS.audioApi.modulateDrone(100 + i * 8);
        }
      });

      cell.addEventListener('mouseleave', () => {
        cell.classList.remove('active');
        S.activeCells.delete(i);
        if (!S.sponsorQuest.active) {
          OMS.effects.hideTooltip();
          OMS.audioApi.modulateDrone(55);
        }
      });

      R.noiseGrid.appendChild(cell);
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
  }

  OMS.grid = {
    buildNoiseGrid,
    injectSponsorCell,
    onCellClick,
  };
})();
