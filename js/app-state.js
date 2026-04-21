window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;

  OMS.refs = {
    canvas: document.getElementById('canvas'),
    noiseCanvas: document.getElementById('noise'),
    waveCanvas: document.getElementById('wave-canvas'),
    noiseGrid: document.getElementById('noise-grid'),
    escapeBtn: document.getElementById('escape-btn'),
    statusLine: document.getElementById('status-line'),
    countdown: document.getElementById('countdown'),
    visitorId: document.getElementById('visitor-id'),
    tooltip: document.getElementById('tooltip'),
    progressTop: document.getElementById('progress-top'),
    waveform: document.getElementById('waveform'),
    sessionTime: document.getElementById('session-time'),
    coords: document.getElementById('coords'),
    idleMsg: document.getElementById('idle-msg'),
    catAscii: document.getElementById('cat-ascii'),
    catTimer: document.getElementById('cat-timer'),
    globalPresence: document.getElementById('global-presence'),
    presenceCounter: document.getElementById('presence-counter'),
    glitchOverlay: document.getElementById('glitch-overlay'),
    volWrap: document.getElementById('vol-wrap'),
    volSlider: document.getElementById('vol-slider'),
    muteBtn: document.getElementById('mute-btn'),
    pwaBanner: document.getElementById('pwa-banner'),
    pwaInstallBtn: document.getElementById('pwa-install-btn'),
    visitBadge: document.getElementById('visit-badge'),
    emergencyExit: document.getElementById('emergency-exit'),
    emergencyDesktop: document.getElementById('ee-desktop'),
    emergencyTint: document.getElementById('ee-tint'),
    mobileTutorial: document.getElementById('mobile-tutorial'),
    tutorialText: document.getElementById('tut-text'),
    tutorialButton: document.getElementById('tut-btn'),
    wtfMsg: document.getElementById('wtf-msg'),
  };

  OMS.constants = {
    TOTAL_NEEDED_SECONDS: 86400,
    GRID_COUNT: 100,
    SESSION_LIMIT_SECONDS: 900,
    DAY_SECONDS: 86400,
    SOUND_MODES: ['underwater', 'forest', 'space', 'machine', 'dream', 'void'],
    SOUND_NAMES: {
      underwater: 'ПОДВОДНЫЙ',
      forest: 'ЛЕСНОЙ',
      space: 'КОСМОС',
      machine: 'МЕХАНИКА',
      dream: 'СОН',
      void: 'ПУСТОТА',
    },
    LOCATIONS: [
      'BALI', 'TOKYO', 'OSLO', 'NYC', 'CAIRO', 'DUBAI', 'SEOUL', 'LONDON', 'RIO', 'MUMBAI',
      'LA', 'PARIS', 'BEIJING', 'SYD', 'BERLIN', 'MIAMI', 'DUBAI', 'REYKJAVIK', 'PRAGUE', 'LIMA',
      'LAGOS', 'OSAKA', 'MOSCOW', 'ZURICH', 'BOSTON', 'SINGAS', 'ISTANBUL', 'JAKARTA', 'MANILA', 'LVIV',
      'HANOI', 'ACCRA', 'NAIROBI', 'BRUSSELS', 'WIEN', 'ROME', 'ATHENS', 'LIMA', 'BOGOTA', 'DALLAS',
      'HOUSTON', 'PHOENIX', 'DENVER', 'SEATTLE', 'PORTLAND', 'MONTREAL', 'TORONTO', 'BUDAPEST', 'WARSAW', 'RIGA',
      'VILNIUS', 'TALLIN', 'MINSK', 'TBILISI', 'BAKU', 'YEREVAN', 'TASHKENT', 'ALMATY', 'NOVOSIBIRSK', 'YEKATERINBURG',
      'IRKUTSK', 'VLADIVOSTOK', 'MAGADAN', 'MURMANSK', 'ARKHANGELSK', 'SYKTYVKAR', 'ULAN-UDE', 'KYZYL', 'ANADYR', 'PETROPAVL',
      'YAKUTSK', 'KHABAROVSK', 'SAKHALIN', 'KAMCHATKA', 'CHUKOTKA', 'KRASNOYARSK', 'TOMSK', 'TYUMEN', 'OMSK', 'CHELYABINSK',
      'ULYANOVSK', 'VORONEZH', 'PERM', 'SAMARA', 'KAZAN', 'NIZHNY', 'SARATOV', 'VOLGOGRAD', 'KRASNODAR', 'ROSTOV',
      'STAVROPOL', 'MAHACHKALA', 'SOCHI', 'SIMFEROPOL', 'SEVASTOPOL', 'ODESSA', 'KHARKIV', 'DNIPRO', 'DONETSK', 'ZAPORIZHZHYA'
    ],
    KONAMI: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'],
  };

  OMS.state = {
    currentPhase: 0,
    mouseX: 0,
    mouseY: 0,
    mouseVel: 0,
    smoothSpeed: 0,
    lastMX: 0,
    lastMY: 0,
    totalMouseDist: 0,
    sessionSeconds: 0,
    countdownSec: OMS.constants.DAY_SECONDS - 1,
    exploded: false,
    btnX: window.innerWidth / 2,
    btnY: window.innerHeight / 2,
    catchCount: 0,
    activeCells: new Set(),
    seenPct: 2,
    activeSeconds: 0,
    catNextSec: OMS.constants.DAY_SECONDS,
    catInterval: null,
    currentVolume: 0.4,
    isMuted: false,
    isMobile: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
    deferredPrompt: null,
    userCity: '',
    idleShowing: false,
    lastActivity: Date.now(),
    ebatState: '',
    konamiIdx: 0,
    typedBuffer: '',
    typedTimer: null,
    flipped: false,
    lastSpace: 0,
    sponsorGridX: 2,
    sponsorGridY: 4,
    casinoShown: false,
    tokyoClicks: 0,
    godzillaShown: false,
    eeActive: false,
    eeTotalDist: 0,
    rafId: 0,
    startTs: 0,
    lastRandGlitch: 0,
    cellClickCount: 0,
  };

  OMS.audio = {
    ctx: null,
    masterGain: null,
    droneOsc: null,
    soundMode: OMS.constants.SOUND_MODES[Math.floor(Math.random() * OMS.constants.SOUND_MODES.length)],
  };

  OMS.render = {
    gl: null,
    width: 0,
    height: 0,
    program: null,
    uniforms: {},
    wavePhase: 0,
  };

  OMS.visit = {
    data: { count: 0, totalSeconds: 0 },
  };

  OMS.api = {};

  OMS.helpers = {
    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    },
    formatTime(sec) {
      const h = Math.floor(sec / 3600).toString().padStart(2, '0');
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return `${h}:${m}:${s}`;
    },
    formatSession(sec) {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return `00:${m}:${s}`;
    },
    getSeenPct() {
      const p = OMS.state.activeSeconds / OMS.constants.TOTAL_NEEDED_SECONDS * 100;
      return Math.min(99.9, p);
    },
  };

  OMS.utils = OMS.helpers;
})();
