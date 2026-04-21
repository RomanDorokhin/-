window.OMS = window.OMS || {};

(() => {
  const OMS = window.OMS;
  const S = OMS.state;
  const R = OMS.refs;
  const V = OMS.render;

  const gl = R.canvas.getContext('webgl2') || R.canvas.getContext('webgl') || R.canvas.getContext('experimental-webgl');
  const nCtx = R.noiseCanvas.getContext('2d');
  const wCtx = R.waveCanvas.getContext('2d');

  const vsSource = `
    attribute vec2 a_pos;
    void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  const fsSource = `
    precision highp float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform float u_mouseVel;
    uniform int u_phase;
    uniform float u_speed;

    vec2 hash2(vec2 p){
      p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }
    float noise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash2(i+vec2(0,0)),f-vec2(0,0)), dot(hash2(i+vec2(1,0)),f-vec2(1,0)), u.x),
                 mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)), dot(hash2(i+vec2(1,1)),f-vec2(1,1)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for(int i=0;i<5;i++){
        v += a * noise(p);
        p = rot * p * 2.0 + vec2(100.0);
        a *= 0.5;
      }
      return v;
    }
    void main(){
      vec2 uvC = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);
      vec2 mouse = (u_mouse - u_res * 0.5) / min(u_res.x, u_res.y);
      float t = u_time * (0.3 + u_speed * 0.5);
      vec2 toMouse = uvC - mouse;
      float d = length(toMouse);
      float infl = exp(-d * 4.0) * u_mouseVel;
      vec2 q = vec2(fbm(uvC + t), fbm(uvC + vec2(1.7, 9.2)));
      vec2 rr = vec2(fbm(uvC + q * 2.0 + vec2(8.3, 2.8)), fbm(uvC + q * 2.0 + vec2(3.1, 4.2)));
      rr += toMouse * infl * 0.3;
      float f = fbm(uvC + rr);
      vec3 calm = mix(vec3(0.0, 0.04, 0.0), vec3(0.0, 0.9, 0.2), clamp(f * 2.0 + 0.5, 0.0, 1.0));
      vec3 aggr = mix(vec3(0.1, 0.0, 0.0), vec3(1.0, 0.3, 0.0), clamp(f * 2.0 + 0.5, 0.0, 1.0));
      vec3 col = mix(calm, aggr, clamp(u_speed * 1.4, 0.0, 1.0));
      col += vec3(0.0, infl * 0.8, infl * 0.2);
      float vig = 1.0 - smoothstep(0.4, 0.95, length(uvC));
      col *= vig * ((u_phase == 0) ? 1.0 : (u_phase == 1) ? 0.55 : 0.25);
      col += sin(gl_FragCoord.y * 6.28318) * 0.02;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function resizeCanvas() {
    V.width = R.canvas.width = window.innerWidth;
    V.height = R.canvas.height = window.innerHeight;
    if (V.gl) V.gl.viewport(0, 0, V.width, V.height);
  }

  function initGl() {
    if (!gl) return;
    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    V.gl = gl;
    V.program = program;
    V.uniforms.time = gl.getUniformLocation(program, 'u_time');
    V.uniforms.res = gl.getUniformLocation(program, 'u_res');
    V.uniforms.mouse = gl.getUniformLocation(program, 'u_mouse');
    V.uniforms.mouseVel = gl.getUniformLocation(program, 'u_mouseVel');
    V.uniforms.phase = gl.getUniformLocation(program, 'u_phase');
    V.uniforms.speed = gl.getUniformLocation(program, 'u_speed');
  }

  function renderNoise() {
    const id = nCtx.createImageData(512, 512);
    for (let i = 0; i < id.data.length; i += 4) {
      const vv = Math.random() * 255;
      id.data[i] = vv;
      id.data[i + 1] = vv;
      id.data[i + 2] = vv;
      id.data[i + 3] = 255;
    }
    nCtx.putImageData(id, 0, 0);
  }

  function drawWaveform() {
    wCtx.clearRect(0, 0, 400, 40);
    wCtx.strokeStyle = 'rgba(0,255,65,0.6)';
    wCtx.lineWidth = 1.5;
    wCtx.beginPath();
    for (let x = 0; x < 400; x++) {
      const t = x / 400;
      const y = 20 + Math.sin(t * Math.PI * 8 + V.wavePhase) * 8 + Math.sin(t * Math.PI * 13 + V.wavePhase * 1.3) * 4 + (Math.random() - 0.5) * 3;
      if (x === 0) wCtx.moveTo(x, y); else wCtx.lineTo(x, y);
    }
    wCtx.stroke();
    V.wavePhase += 0.15;
  }

  function renderFrame(now) {
    S.rafId = requestAnimationFrame(renderFrame);
    if (!S.startTs) S.startTs = now;
    const t = (now - S.startTs) / 1000;

    if (V.gl && V.program) {
      const controlMod = S.secretSystems.control;
      const worldMod = S.secretSystems.world;
      const speedBoost = controlMod.shaderSpeedBoost;
      const mouseVelScale = controlMod.mouseVelocityScale;
      const phaseOffset = worldMod.shaderPhaseOffset;
      S.smoothSpeed += (S.mouseVel * mouseVelScale - S.smoothSpeed) * 0.05;
      V.gl.uniform1f(V.uniforms.time, t);
      V.gl.uniform2f(V.uniforms.res, V.width, V.height);
      V.gl.uniform2f(V.uniforms.mouse, S.mouseX, V.height - S.mouseY);
      V.gl.uniform1f(V.uniforms.mouseVel, S.mouseVel * mouseVelScale);
      V.gl.uniform1i(V.uniforms.phase, Math.max(0, S.currentPhase + phaseOffset));
      V.gl.uniform1f(V.uniforms.speed, S.smoothSpeed * speedBoost);
      V.gl.drawArrays(V.gl.TRIANGLE_STRIP, 0, 4);
    }

    if (S.currentPhase >= 1) drawWaveform();
    S.mouseVel *= 0.92;

    if (S.currentPhase >= 1 && now - S.lastRandGlitch > 8000 + Math.random() * 12000) {
      OMS.effects.triggerGlitch(200 + Math.random() * 400);
      S.lastRandGlitch = now;
    }
  }

  function initVisualSystems() {
    resizeCanvas();
    initGl();
    setInterval(renderNoise, 80);
    renderNoise();
  }

  OMS.visuals = {
    initVisualSystems,
    resizeCanvas,
    renderFrame,
    drawWaveform,
  };
})();
