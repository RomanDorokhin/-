function renderNoise() {
  const id = AppState.noiseCtx.createImageData(512, 512);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.random() * 255;
    id.data[i] = v;
    id.data[i + 1] = v;
    id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  AppState.noiseCtx.putImageData(id, 0, 0);
}

function drawWaveform() {
  AppState.waveCtx.clearRect(0, 0, 400, 40);
  AppState.waveCtx.strokeStyle = 'rgba(0,255,65,0.6)';
  AppState.waveCtx.lineWidth = 1.5;
  AppState.waveCtx.beginPath();
  for (let x = 0; x < 400; x++) {
    const t = x / 400;
    const y = 20 + Math.sin(t * Math.PI * 8 + AppState.wavePhase) * 8
      + Math.sin(t * Math.PI * 13 + AppState.wavePhase * 1.3) * 4
      + (Math.random() - 0.5) * 3;
    if (x === 0) AppState.waveCtx.moveTo(x, y); else AppState.waveCtx.lineTo(x, y);
  }
  AppState.waveCtx.stroke();
  AppState.wavePhase += 0.15;
}

function renderFrame(now) {
  AppState.rafId = requestAnimationFrame(renderFrame);
  const t = (now - AppState.startTime) / 1000;

  const gl = AppState.gl;
  if (gl && AppState.program) {
    AppState.smoothSpeed += (AppState.mouseVel - AppState.smoothSpeed) * 0.05;
    gl.uniform1f(AppState.timeLoc, t);
    gl.uniform2f(AppState.resLoc, AppState.width, AppState.height);
    gl.uniform2f(AppState.mouseLoc, AppState.mouseX, AppState.height - AppState.mouseY);
    gl.uniform1f(AppState.mouseVelLoc, AppState.mouseVel);
    gl.uniform1i(AppState.phaseLoc, AppState.currentPhase);
    if (AppState.speedLoc) gl.uniform1f(AppState.speedLoc, AppState.smoothSpeed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  if (AppState.currentPhase >= 1) drawWaveform();
  AppState.mouseVel *= 0.92;

  if (AppState.currentPhase >= 1 && now - AppState.lastRandGlitch > 8000 + Math.random() * 12000) {
    triggerGlitch(200 + Math.random() * 400);
    AppState.lastRandGlitch = now;
  }
}
