window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const { state, audio, constants, refs } = OMS;

  function setGainValue(gainNode, value, fade = 0.12) {
    if (!audio.ctx || !gainNode || !gainNode.gain) return;
    const t = audio.ctx.currentTime;
    gainNode.gain.cancelScheduledValues(t);
    gainNode.gain.setValueAtTime(gainNode.gain.value, t);
    gainNode.gain.linearRampToValueAtTime(value, t + fade);
  }

  function stopSnakeMusic() {
    if (audio.snakePulseGain) setGainValue(audio.snakePulseGain, 0, 0.2);
    if (audio.snakePadGain) setGainValue(audio.snakePadGain, 0, 0.2);
    if (audio.snakeLeadGain) setGainValue(audio.snakeLeadGain, 0, 0.2);
  }

  function ensureSnakeMusic() {
    if (!audio.ctx || !audio.masterGain) return false;
    if (audio.snakeMusicReady) return true;

    audio.snakePulseOsc = audio.ctx.createOscillator();
    audio.snakePulseOsc.type = 'triangle';
    audio.snakePulseOsc.frequency.value = 165;
    audio.snakePulseGain = audio.ctx.createGain();
    audio.snakePulseGain.gain.value = 0;
    audio.snakePulseOsc.connect(audio.snakePulseGain);
    audio.snakePulseGain.connect(audio.masterGain);
    audio.snakePulseOsc.start();

    audio.snakePadOsc = audio.ctx.createOscillator();
    audio.snakePadOsc.type = 'sine';
    audio.snakePadOsc.frequency.value = 220;
    audio.snakePadGain = audio.ctx.createGain();
    audio.snakePadGain.gain.value = 0;
    audio.snakePadOsc.connect(audio.snakePadGain);
    audio.snakePadGain.connect(audio.masterGain);
    audio.snakePadOsc.start();

    audio.snakeLeadOsc = audio.ctx.createOscillator();
    audio.snakeLeadOsc.type = 'sine';
    audio.snakeLeadOsc.frequency.value = 330;
    audio.snakeLeadGain = audio.ctx.createGain();
    audio.snakeLeadGain.gain.value = 0;
    audio.snakeLeadOsc.connect(audio.snakeLeadGain);
    audio.snakeLeadGain.connect(audio.masterGain);
    audio.snakeLeadOsc.start();

    audio.snakeMusicReady = true;
    return true;
  }

  function initAudio() {
    if (audio.ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      audio.ctx = new AudioCtx();
    } catch (e) {
      return false;
    }
    audio.masterGain = audio.ctx.createGain();
    audio.masterGain.gain.value = 0;
    audio.masterGain.connect(audio.ctx.destination);

    const t = audio.ctx.currentTime;
    audio.droneOsc = audio.ctx.createOscillator();
    audio.droneOsc.type = audio.soundMode === 'machine' ? 'sawtooth' : 'sine';
    audio.droneOsc.frequency.value = audio.soundMode === 'space' ? 28 : 55;
    const g = audio.ctx.createGain();
    g.gain.value = 0.08;
    audio.droneGain = g;
    audio.droneOsc.connect(g);
    g.connect(audio.masterGain);
    audio.droneOsc.start();

    if (audio.soundMode !== 'void') {
      const nbuf = audio.ctx.createBuffer(1, audio.ctx.sampleRate * 2, audio.ctx.sampleRate);
      const nd = nbuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.02;
      const nsrc = audio.ctx.createBufferSource();
      nsrc.buffer = nbuf;
      nsrc.loop = true;
      const nf = audio.ctx.createBiquadFilter();
      nf.type = audio.soundMode === 'underwater' ? 'lowpass' : 'bandpass';
      nf.frequency.value = audio.soundMode === 'underwater' ? 280 : 650;
      const ng = audio.ctx.createGain();
      ng.gain.value = 0.02;
      audio.noiseSource = nsrc;
      audio.noiseGain = ng;
      nsrc.connect(nf);
      nf.connect(ng);
      ng.connect(audio.masterGain);
      nsrc.start();
    }

    audio.masterGain.gain.linearRampToValueAtTime(state.currentVolume, t + 1.2);
    return true;
  }

  function playGlitchSound() {
    if (!audio.ctx || !audio.masterGain) return;
    const len = Math.floor(audio.ctx.sampleRate * 0.08);
    const buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
    const src = audio.ctx.createBufferSource();
    src.buffer = buf;
    const g = audio.ctx.createGain();
    g.gain.value = 0.2;
    g.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + 0.08);
    src.connect(g);
    g.connect(audio.masterGain);
    src.start();
  }

  function playExplosionSound() {
    if (!audio.ctx || !audio.masterGain) return;
    const len = Math.floor(audio.ctx.sampleRate * 0.32);
    const buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const tt = i / audio.ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-tt * 8);
    }
    const src = audio.ctx.createBufferSource();
    src.buffer = buf;
    const g = audio.ctx.createGain();
    g.gain.value = 0.6;
    src.connect(g);
    g.connect(audio.masterGain);
    src.start();
  }

  function modulateDrone(freq) {
    if (!audio.ctx || !audio.droneOsc) return;
    if (state.sponsorQuest && state.sponsorQuest.active) return;
    audio.droneOsc.frequency.linearRampToValueAtTime(freq, audio.ctx.currentTime + 0.08);
  }

  function startSnakeMode() {
    if (!audio.ctx || !audio.masterGain) return;
    ensureSnakeMusic();
    if (audio.droneGain) setGainValue(audio.droneGain, 0.018, 0.28);
    if (audio.noiseGain) setGainValue(audio.noiseGain, 0.004, 0.28);
    if (audio.snakePulseGain) setGainValue(audio.snakePulseGain, 0.045, 0.35);
    if (audio.snakePadGain) setGainValue(audio.snakePadGain, 0.03, 0.35);
    if (audio.snakeLeadGain) setGainValue(audio.snakeLeadGain, 0.02, 0.35);
  }

  function stopSnakeMode() {
    if (!audio.ctx || !audio.masterGain) return;
    if (audio.droneGain) setGainValue(audio.droneGain, 0.08, 0.24);
    if (audio.noiseGain) setGainValue(audio.noiseGain, 0.02, 0.24);
    stopSnakeMusic();
  }

  function playSnakeEat(progress = 0) {
    if (!audio.ctx || !audio.masterGain) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440 + progress * 220, t);
    osc.frequency.linearRampToValueAtTime(660 + progress * 300, t + 0.16);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(audio.masterGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  function playSnakeTurnCue() {
    if (!audio.ctx || !audio.masterGain) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(210, t + 0.08);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(audio.masterGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  function playSnakeSuccess() {
    if (!audio.ctx || !audio.masterGain) return;
    const t = audio.ctx.currentTime;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.11);
      gain.gain.setValueAtTime(0.001, t + i * 0.11);
      gain.gain.linearRampToValueAtTime(0.07, t + i * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.11 + 0.22);
      osc.connect(gain);
      gain.connect(audio.masterGain);
      osc.start(t + i * 0.11);
      osc.stop(t + i * 0.11 + 0.24);
    });
  }

  function playSnakeFail() {
    if (!audio.ctx || !audio.masterGain) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(72, t + 0.22);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain);
    gain.connect(audio.masterGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  function toggleMute() {
    state.isMuted = !state.isMuted;
    if (audio.ctx) {
      if (state.isMuted) audio.ctx.suspend();
      else audio.ctx.resume();
    }
    refs.muteBtn.textContent = state.isMuted ? '▶ ЗВУК' : '◼ ЗВУК';
    refs.muteBtn.classList.toggle('muted', state.isMuted);
  }

  function showVolumeControl() {
    refs.volWrap.style.opacity = '0.4';
  }

  function setupAudioUi() {
    try {
      const saved = localStorage.getItem('oms_vol');
      if (saved !== null) {
        refs.volSlider.value = saved;
        state.currentVolume = parseInt(saved, 10) / 100;
      }
    } catch (e) {}

    refs.volSlider.addEventListener('input', () => {
      state.currentVolume = refs.volSlider.value / 100;
      if (audio.ctx && audio.masterGain) {
        if (state.currentVolume === 0 || state.isMuted) {
          audio.ctx.suspend();
        } else {
          audio.ctx.resume();
          audio.masterGain.gain.setValueAtTime(state.currentVolume, audio.ctx.currentTime);
        }
      }
      refs.muteBtn.classList.toggle('muted', state.currentVolume === 0);
      refs.muteBtn.textContent = state.currentVolume === 0 ? '▶ ЗВУК' : '◼ ЗВУК';
      try { localStorage.setItem('oms_vol', refs.volSlider.value); } catch (e) {}
    });
  }

  OMS.audioApi = {
    initAudio,
    playGlitchSound,
    playExplosionSound,
    modulateDrone,
    startSnakeMode,
    stopSnakeMode,
    playSnakeEat,
    playSnakeTurnCue,
    playSnakeSuccess,
    playSnakeFail,
    toggleMute,
    showVolumeControl,
    setupAudioUi,
  };

  console.log(`%cСАУНДСКЕЙП: ${constants.SOUND_NAMES[audio.soundMode]}`, 'color:#ffaa00; font-size:12px; font-family:monospace');
})();
