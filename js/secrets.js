window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const C = OMS.constants;
  const S = OMS.state;
  const R = OMS.refs;
  const registry = new Map(C.SECRET_DEFS.map((def) => [def.id, def]));
  const HINT_INTERVAL_MS = 16000;
  const HINT_COOLDOWN_MS = 9000;
  let hintTimer = 0;
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
    const total = getTotalSecrets();
    const unlocked = getUnlockedCount();
    if (R.secretCounter) {
      R.secretCounter.textContent = `СЕКРЕТЫ: ${unlocked}/${total}`;
    }
    if (R.backpackProgress) {
      R.backpackProgress.textContent = `НАЙДЕНО: ${unlocked} ИЗ ${total}`;
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
    C.SECRET_DEFS.forEach((def) => {
      const unlocked = S.unlockedSecrets.has(def.id);
      const card = document.createElement('article');
      card.className = `secret-card ${unlocked ? 'unlocked' : 'locked'}`;

      const title = document.createElement('h4');
      title.className = 'secret-card-title';
      title.textContent = unlocked ? def.title : '???';

      const hint = document.createElement('p');
      hint.className = 'secret-card-hint';
      hint.textContent = `Подсказка: ${def.hint}`;

      const description = document.createElement('p');
      description.className = 'secret-card-description';
      description.textContent = unlocked ? def.description : 'Секрет еще не раскрыт.';

      card.appendChild(title);
      card.appendChild(hint);
      card.appendChild(description);

      if (unlocked && def.category === 'interactive' && def.action) {
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

  function getContextHintRule() {
    const unlocked = getUnlockedCount();
    if (!S.introAccepted) return 'ПОДСКАЗКА: сначала запусти охоту на стартовом экране.';
    if (S.currentPhase < 2) return 'ПОДСКАЗКА: движение запускает активный сеанс.';
    if (unlocked === 0) return 'ПОДСКАЗКА: начни с первой ячейки в сетке.';
    if (S.cellClickCount < 10) return 'ПОДСКАЗКА: тестируй разные каналы и ритм кликов.';
    if (!S.unlockedSecrets.has('forbidden_button')) return 'ПОДСКАЗКА: запретная кнопка может быть частью маршрута.';
    if (!S.unlockedSecrets.has('casino')) return 'ПОДСКАЗКА: среди каналов есть особый спонсорский след.';
    if (!S.unlockedSecrets.has('konami')) return 'ПОДСКАЗКА: старые комбинации клавиш иногда работают.';
    if (!S.unlockedSecrets.has('console_access')) return 'ПОДСКАЗКА: сервисный режим открывается отдельной клавишей.';
    if (!S.unlockedSecrets.has('godzilla') && S.tokyoClicks > 0) return 'ПОДСКАЗКА: TOKYO реагирует на настойчивость.';
    if (!S.unlockedSecrets.has('emergency_exit')) return 'ПОДСКАЗКА: аварийные горячие клавиши доступны в сеансе.';
    return '';
  }

  function getNextHint() {
    const contextual = getContextHintRule();
    if (contextual) return contextual;
    const next = C.SECRET_DEFS.find((def) => !S.unlockedSecrets.has(def.id));
    if (!next) return 'ПОДСКАЗКА: ВСЕ СЕКРЕТЫ ИЗ ТЕКУЩЕЙ ВЕРСИИ НАЙДЕНЫ.';
    return `ПОДСКАЗКА: ${next.hint}`;
  }

  function showHint() {
    if (S.currentPhase < 1) return;
    queueHint(getNextHint());
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
    clearInterval(hintTimer);
    hintTimer = setInterval(showHint, HINT_INTERVAL_MS);
    setTimeout(showHint, 1200);
  }

  OMS.secrets = {
    init,
    unlockSecret,
    isUnlocked(secretId) {
      return S.unlockedSecrets.has(secretId);
    },
    showHint,
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
