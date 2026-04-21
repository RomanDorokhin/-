window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const C = OMS.constants;
  const S = OMS.state;
  const R = OMS.refs;
  const registry = new Map(C.SECRET_DEFS.map((def) => [def.id, def]));
  const HINT_COOLDOWN_MS = 9000;
  let statusResetTimer = 0;

  function readProgress() {
    try {
      const raw = localStorage.getItem(C.SECRET_STORAGE_KEY);
      if (!raw) return { unlocked: [], discoveredAt: {}, sources: {} };
      const parsed = JSON.parse(raw);
      return {
        unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
        discoveredAt: parsed.discoveredAt && typeof parsed.discoveredAt === 'object' ? parsed.discoveredAt : {},
        sources: parsed.sources && typeof parsed.sources === 'object' ? parsed.sources : {},
      };
    } catch (e) {
      return { unlocked: [], discoveredAt: {}, sources: {} };
    }
  }

  function persistProgress() {
    try {
      localStorage.setItem(C.SECRET_STORAGE_KEY, JSON.stringify(S.secretProgress));
    } catch (e) {}
  }

  function getTotalSecrets() {
    return C.SECRET_DEFS.length;
  }

  function getUnlockedCount() {
    return S.unlockedSecrets.size;
  }

  function updateCounter() {
    const unlocked = getUnlockedCount();
    if (R.secretCounter) {
      R.secretCounter.textContent = `СЕКРЕТЫ: ${unlocked}`;
    }
    if (R.backpackProgress) {
      R.backpackProgress.textContent = `НАЙДЕНО: ${unlocked}`;
    }
  }

  function updateBackpackBadge() {
    if (!R.backpackBtn) return;
    if (S.newSecretCount > 0) {
      R.backpackBtn.setAttribute('data-badge', String(S.newSecretCount));
    } else {
      R.backpackBtn.removeAttribute('data-badge');
    }
  }

  function triggerSecretAction(action) {
    if (action === 'casino' && OMS.features) OMS.features.showCasinoAd();
    if (action === 'console' && OMS.main) OMS.main.toggleSecretConsole();
  }

  function renderBackpack() {
    if (!R.backpackGrid) return;
    R.backpackGrid.innerHTML = '';
    const unlockedDefs = C.SECRET_DEFS.filter((def) => S.unlockedSecrets.has(def.id));

    if (!unlockedDefs.length) {
      const emptyCard = document.createElement('article');
      emptyCard.className = 'secret-card locked';
      emptyCard.innerHTML = `
        <h4 class="secret-card-title">ПУСТО</h4>
        <p class="secret-card-description">Ты пока ничего не нашел. Коллекция откроется по мере открытий.</p>
      `;
      R.backpackGrid.appendChild(emptyCard);
      return;
    }

    unlockedDefs.forEach((def) => {
      const card = document.createElement('article');
      card.className = `secret-card unlocked ${def.category === 'interactive' ? 'interactive' : 'achievement'}`;

      const title = document.createElement('h4');
      title.className = 'secret-card-title';
      title.textContent = def.title;

      const description = document.createElement('p');
      description.className = 'secret-card-description';
      description.textContent = def.description;

      card.appendChild(title);
      card.appendChild(description);

      const kind = document.createElement('p');
      kind.className = 'secret-card-kind';
      kind.textContent = def.category === 'interactive' ? 'ИНТЕРАКТИВНЫЙ СЕКРЕТ' : 'ЗАФИКСИРОВАНО В КОЛЛЕКЦИИ';
      card.appendChild(kind);

      if (def.category === 'interactive' && def.action) {
        const actionBtn = document.createElement('button');
        actionBtn.className = 'secret-action-btn';
        actionBtn.type = 'button';
        actionBtn.dataset.action = def.action;
        actionBtn.textContent = 'ОТКРЫТЬ';
        card.appendChild(actionBtn);
      }

      R.backpackGrid.appendChild(card);
    });
  }

  function flashStatusLine(text) {
    if (!R.statusLine || S.currentPhase < 1) return;
    clearTimeout(statusResetTimer);
    S.statusHoldUntil = Date.now() + 2200;
    R.statusLine.textContent = text;
    R.statusLine.style.opacity = '1';
    statusResetTimer = setTimeout(() => {
      R.statusLine.style.opacity = '0';
    }, 2200);
  }

  function queueHint(text) {
    if (!text || text === S.lastHintText) return;
    const now = Date.now();
    if (now - S.lastHintAt < HINT_COOLDOWN_MS) return;
    S.lastHintText = text;
    S.lastHintAt = now;
    flashStatusLine(text);
  }

  function getNoiseHint() {
    const unlockCount = getUnlockedCount();
    const poolEarly = [
      'ШУМ: иногда запрет и есть маршрут.',
      'ШУМ: повтор одного действия может сдвинуть фазу.',
      'ШУМ: не все входы открываются курсором.',
    ];
    const poolMid = [
      'ШУМ: часть маршрутов реагирует на клавиши.',
      'ШУМ: странное поведение интерфейса не всегда ошибка.',
      'ШУМ: некоторые каналы проверяют настойчивость.',
    ];
    const poolLate = [
      'ШУМ: ищи короткие комбинации, не только одиночные действия.',
      'ШУМ: сервисные символы иногда полезнее меню.',
      'ШУМ: самый простой шаг чаще всего пропускают.',
    ];
    const poolDone = [
      'ШУМ: в этой сборке ты снял все текущие сигналы.',
    ];
    const pool = unlockCount >= getTotalSecrets()
      ? poolDone
      : unlockCount < 2
      ? poolEarly
      : unlockCount < 6
      ? poolMid
      : poolLate;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function showHint() {
    if (S.currentPhase < 1) return;
    queueHint(getNoiseHint());
  }

  function markMeaninglessAction(kind = 'noise') {
    if (S.currentPhase < 1) return;
    S.noiseActionCount += 1;
    const threshold = kind === 'enter_news' ? 3 : 4;
    if (S.noiseActionCount < threshold) return;
    S.noiseActionCount = 0;
    showHint();
  }

  function unlockSecret(secretId, meta = {}) {
    const def = registry.get(secretId);
    if (!def || S.unlockedSecrets.has(secretId)) return false;
    S.unlockedSecrets.add(secretId);
    S.newSecretCount += 1;
    S.secretProgress.unlocked = Array.from(S.unlockedSecrets);
    S.secretProgress.discoveredAt[secretId] = Date.now();
    if (meta.source) S.secretProgress.sources[secretId] = meta.source;
    persistProgress();
    updateCounter();
    updateBackpackBadge();
    renderBackpack();
    S.lastHintText = '';
    flashStatusLine(`СЕКРЕТ ОТКРЫТ: ${def.title}`);
    return true;
  }

  function openBackpack() {
    if (!R.backpackModal) return;
    R.backpackModal.classList.add('open');
    R.backpackModal.setAttribute('aria-hidden', 'false');
    S.newSecretCount = 0;
    updateBackpackBadge();
    renderBackpack();
  }

  function closeBackpack() {
    if (!R.backpackModal) return;
    R.backpackModal.classList.remove('open');
    R.backpackModal.setAttribute('aria-hidden', 'true');
  }

  function toggleBackpack() {
    if (!R.backpackModal) return;
    if (R.backpackModal.classList.contains('open')) closeBackpack();
    else openBackpack();
  }

  function bindUi() {
    if (R.backpackBtn) {
      R.backpackBtn.addEventListener('click', toggleBackpack);
    }
    if (R.backpackClose) {
      R.backpackClose.addEventListener('click', closeBackpack);
    }
    if (R.backpackModal) {
      R.backpackModal.addEventListener('click', (event) => {
        if (event.target === R.backpackModal) closeBackpack();
      });
    }
    if (R.backpackGrid) {
      R.backpackGrid.addEventListener('click', (event) => {
        const actionBtn = event.target.closest('.secret-action-btn');
        if (!actionBtn) return;
        triggerSecretAction(actionBtn.dataset.action);
      });
    }
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeBackpack();
      if ((event.key === 'i' || event.key === 'I' || event.key === 'ш' || event.key === 'Ш') && S.currentPhase >= 1) {
        toggleBackpack();
      }
    });
  }

  function init() {
    S.secretProgress = readProgress();
    S.unlockedSecrets = new Set(
      S.secretProgress.unlocked.filter((secretId) => registry.has(secretId)),
    );
    S.secretProgress.unlocked = Array.from(S.unlockedSecrets);
    updateCounter();
    updateBackpackBadge();
    renderBackpack();
    bindUi();
  }

  OMS.secrets = {
    init,
    unlockSecret,
    isUnlocked(secretId) {
      return S.unlockedSecrets.has(secretId);
    },
    showHint,
    markMeaninglessAction,
    openBackpack,
    closeBackpack,
    toggleBackpack,
    renderBackpack,
    getProgress() {
      return {
        unlocked: getUnlockedCount(),
        total: getTotalSecrets(),
      };
    },
  };
})();
