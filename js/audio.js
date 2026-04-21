window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const { state, audio, constants, refs } = OMS;

  function initAudio() {
    if (audio.ctx) return;
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    audio.masterGain = audio.ctx.createGain();
    audio.masterGain.gain.value = 0;
    audio.masterGain.connect(audio.ctx.destination);

    const t = audio.ctx.currentTime;
    audio.droneOsc = audio.ctx.createOscillator();
    audio.droneOsc.type = audio.soundMode === 'machine' ? 'sawtooth' : 'sine';
    audio.droneOsc.frequency.value = audio.soundMode === 'space' ? 28 : 55;
    const g = audio.ctx.createGain();
    g.gain.value = 0.08;
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
      nsrc.connect(nf);
      nf.connect(audio.masterGain);
      nsrc.start();
    }

    audio.masterGain.gain.linearRampToValueAtTime(state.currentVolume, t + 1.2);
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
    audio.droneOsc.frequency.linearRampToValueAtTime(freq, audio.ctx.currentTime + 0.08);
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
    toggleMute,
    showVolumeControl,
    setupAudioUi,
  };

  console.log(`%cСАУНДСКЕЙП: ${constants.SOUND_NAMES[audio.soundMode]}`, 'color:#ffaa00; font-size:12px; font-family:monospace');
})();
