/* Dino Quest — canvas runner, progression, quizzes, and tiny synthesized sounds. */
(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const ui = {
    score: $('score'), best: $('highScore'), lives: $('lives'), level: $('level'), status: $('stageStatus'),
    fill: $('progressFill'), progress: $('progressLabel'), tip: $('tip'), start: $('startScreen'), pause: $('pauseScreen'),
    quiz: $('quizScreen'), over: $('gameOverScreen'), toast: $('toast'),
  };
  const W = canvas.width, H = canvas.height, GROUND = 346;
  const tips = ['Little steps make big discoveries.', 'Curiosity is your greatest superpower.', 'Every question takes you farther.', 'You are doing dino-mite!'];
  const state = { mode: 'ready', score: 0, best: Number(localStorage.getItem('dinoQuestBest')) || 0, previousBest: 0, lives: 3, level: 1,
    distance: 0, passed: 0, spawn: 90, frame: 0, last: 0, runs: Number(localStorage.getItem('dinoQuestRuns')) || 0,
    topStage: Number(localStorage.getItem('dinoQuestStage')) || 1, shield: 0, magnet: 0, slow: 0,
    obstacles: [], pickups: [], particles: [], questionPool: [], question: null, sound: true, audio: null, toastTimer: 0 };
  const dino = { x: 125, y: GROUND - 62, w: 58, h: 62, vy: 0, grounded: true, blink: 0 };

  // Adapt the original hand-drawn meadow runner into a dusk-toned world.
  function rounded(x, y, w, h, r, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  }
  function background() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#18243c'); sky.addColorStop(.63, '#263b4b'); sky.addColorStop(1, '#52644c');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const moon = ctx.createRadialGradient(750, 75, 4, 750, 75, 100);
    moon.addColorStop(0, '#e4f7c344'); moon.addColorStop(1, '#e4f7c300'); ctx.fillStyle = moon; ctx.fillRect(645, 0, 210, 190);
    ctx.fillStyle = '#e6edc4'; ctx.beginPath(); ctx.arc(750, 75, 24, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 48; i++) {
      const x = (i * 197 + 31) % W, y = (i * 83 + 18) % 190;
      const twinkle = .35 + (Math.sin(state.frame * .035 + i) + 1) * .25;
      ctx.fillStyle = `rgba(222,244,205,${twinkle})`; ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
    // Distant mountains and layered hills move at different speeds.
    ctx.fillStyle = '#26394a'; ctx.beginPath(); ctx.moveTo(0, 266);
    for (let x = 0; x <= W + 120; x += 120) ctx.lineTo(x - (state.distance * .08 % 120), 165 + ((x / 120) % 2) * 40);
    ctx.lineTo(W, 330); ctx.lineTo(0, 330); ctx.fill();
    ctx.fillStyle = '#344c49'; ctx.beginPath(); ctx.moveTo(0, 294);
    for (let x = 0; x <= W + 100; x += 100) ctx.quadraticCurveTo(x + 45 - state.distance * .16 % 100, 238 + (x % 3) * 9, x + 90 - state.distance * .16 % 100, 294);
    ctx.lineTo(W, 355); ctx.lineTo(0, 355); ctx.fill();
    for (let i = 0; i < 18; i++) {
      const x = ((i * 68 - state.distance * .34) % (W + 90) + W + 90) % (W + 90) - 35;
      const y = 299 + (i % 3) * 11;
      ctx.fillStyle = i % 2 ? '#314d45' : '#3a594a'; ctx.beginPath(); ctx.moveTo(x, y - 40 - i % 4 * 7); ctx.lineTo(x - 18, y + 8); ctx.lineTo(x + 18, y + 8); ctx.fill();
    }
    ctx.fillStyle = '#354a3c'; ctx.fillRect(0, GROUND, W, H - GROUND);
    ctx.fillStyle = '#98cb69'; ctx.fillRect(0, GROUND, W, 4); ctx.fillStyle = '#253c34'; ctx.fillRect(0, GROUND + 4, W, H - GROUND - 4);
    for (let i = 0; i < 58; i++) {
      const x = ((i * 43 - state.distance * .9) % (W + 45) + W + 45) % (W + 45);
      const y = GROUND + 15 + i % 5 * 13;
      ctx.fillStyle = i % 3 ? '#526a42' : '#b3d778'; ctx.fillRect(x, y, 3, 2);
    }
  }
  function drawDino() {
    const { x, y } = dino;
    // Sparkling bubble around the dinosaur shows an active shield.
    if (state.shield > 0) {
      ctx.strokeStyle = `rgba(159,232,255,${.36 + Math.sin(state.frame * .15) * .12})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x + 30, y + 32, 43, 48, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#d17a52'; ctx.beginPath(); ctx.moveTo(x + 12, y + 42); ctx.quadraticCurveTo(x - 12, y + 35, x - 5, y + 55); ctx.quadraticCurveTo(x + 9, y + 58, x + 20, y + 49); ctx.fill();
    rounded(x + 7, y + 25, 42, 34, 14, '#bd6547'); rounded(x + 28, y + 4, 32, 31, 13, '#d17a52');
    ctx.fillStyle = '#efd6a6'; ctx.beginPath(); ctx.ellipse(x + 30, y + 45, 15, 10, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0b864'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 15 + i * 8, y + 26); ctx.lineTo(x + 20 + i * 8, y + 13 + i % 2 * 3); ctx.lineTo(x + 25 + i * 8, y + 27); ctx.fill(); }
    const swing = dino.grounded && state.mode === 'running' ? Math.sin(state.frame * .32) * 4 : 0;
    rounded(x + 14, y + 51, 11, 13 + swing, 5, '#7c4335'); rounded(x + 34, y + 51, 11, 13 - swing, 5, '#7c4335');
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x + 48, y + 17, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#20232a'; ctx.beginPath(); ctx.arc(x + 50, y + 18, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef9f8b'; ctx.beginPath(); ctx.ellipse(x + 39, y + 27, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawObstacle(o) {
    const x = o.x, y = GROUND - o.h;
    if (o.type === 'bird') {
      const flap = Math.sin(state.frame * .35) * 8; ctx.fillStyle = '#aab4c2'; ctx.beginPath(); ctx.ellipse(x + 21, y + 17, 18, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7e8ca1'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 20, y + 17); ctx.lineTo(x + 8, y + 2 + flap); ctx.moveTo(x + 22, y + 17); ctx.lineTo(x + 34, y + 3 - flap); ctx.stroke();
      ctx.fillStyle = '#f5c568'; ctx.beginPath(); ctx.moveTo(x + 35, y + 15); ctx.lineTo(x + 44, y + 18); ctx.lineTo(x + 35, y + 21); ctx.fill();
    } else if (o.type === 'cactus') {
      rounded(x + 10, y + 12, 18, o.h - 12, 6, '#4b9e6c'); rounded(x, y + 26, 12, 18, 5, '#4b9e6c'); rounded(x + 25, y + 34, 12, 15, 5, '#4b9e6c');
      ctx.strokeStyle = '#9dd68a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 18, y + 18); ctx.lineTo(x + 18, y + o.h - 4); ctx.stroke();
    } else if (o.type === 'crystal') {
      ctx.fillStyle = '#a38cff'; ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + 35, y + 24); ctx.lineTo(x + 28, y + o.h); ctx.lineTo(x + 6, y + o.h); ctx.lineTo(x, y + 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d0c5ff'; ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + 20, y + o.h - 2); ctx.lineTo(x + 6, y + o.h); ctx.lineTo(x, y + 24); ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#b6ad9a'; ctx.beginPath(); ctx.moveTo(x, y + o.h); ctx.lineTo(x + 4, y + 13); ctx.lineTo(x + 17, y); ctx.lineTo(x + 34, y + 8); ctx.lineTo(x + 39, y + o.h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e1d7bd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 10, y + 15); ctx.lineTo(x + 18, y + 7); ctx.stroke();
    }
  }
  function drawPickup(p) {
    const bob = Math.sin(state.frame * .12 + p.phase) * 4; const x = p.x, y = p.y + bob;
    ctx.save(); ctx.shadowColor = p.type === 'star' ? '#ffe178' : '#92eaff'; ctx.shadowBlur = 16;
    if (p.type === 'star') {
      ctx.fillStyle = '#ffdc73'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✦', x, y + 9);
    } else {
      ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#d2f9ff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(p.type === 'shield' ? '⬡' : p.type === 'magnet' ? '✧' : '◷', x, y + 5);
    }
    ctx.restore();
  }
  function particles(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3; state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 30 + Math.random() * 15, color, size: 2 + Math.random() * 3 }); }
  }
  function updateParticles(dt) {
    state.particles = state.particles.filter(p => p.life > 0);
    for (const p of state.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .08 * dt; p.life -= dt; ctx.globalAlpha = Math.max(0, p.life / 40); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
    ctx.globalAlpha = 1;
  }
  function collision(a, b) { return a.x + a.w - 11 > b.x + 5 && a.x + 10 < b.x + b.w - 5 && a.y + a.h - 8 > GROUND - b.h + 4 && a.y + 8 < GROUND; }

  function audio() {
    if (!state.sound) return;
    try {
      state.audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (state.audio.state === 'suspended') state.audio.resume();
      return state.audio;
    } catch (_) { return null; }
  }
  function tone(freq, duration = .12, type = 'sine', volume = .045) {
    const ac = audio(); if (!ac) return;
    const osc = ac.createOscillator(), gain = ac.createGain(); osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ac.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ac.currentTime + duration);
    osc.connect(gain); gain.connect(ac.destination); osc.start(); osc.stop(ac.currentTime + duration);
  }
  function setMode(mode) {
    state.mode = mode;
    ui.start.classList.toggle('hidden', mode !== 'ready'); ui.pause.classList.toggle('hidden', mode !== 'paused');
    ui.quiz.classList.toggle('hidden', mode !== 'quiz'); ui.over.classList.toggle('hidden', mode !== 'over');
    ui.status.textContent = ({ ready: 'READY TO EXPLORE', running: 'ON THE RUN', paused: 'QUEST PAUSED', quiz: 'BRAIN BREAK', over: 'QUEST COMPLETE' })[mode];
  }
  function fmt(num) { return String(Math.floor(num)).padStart(5, '0'); }
  function updateHud() {
    ui.score.textContent = fmt(state.score); ui.best.textContent = fmt(state.best);
    ui.lives.textContent = Array.from({ length: 3 }, (_, i) => i < state.lives ? '♥' : '♡').join(' ');
    const names = ['MEADOW', 'CANYON', 'RUINS', 'TUNDRA', 'VOLCANO'];
    ui.level.innerHTML = `${String(state.level).padStart(2, '0')} <em>·</em> ${names[(state.level - 1) % names.length]}`;
    const prog = state.passed % 4; ui.fill.style.width = `${prog / 4 * 100}%`; ui.progress.textContent = `STAGE ${state.level} PROGRESS`;
  }
  function reset() {
    state.previousBest = state.best;
    state.score = 0; state.lives = 3; state.level = 1; state.distance = 0; state.passed = 0; state.spawn = 80;
    state.obstacles = []; state.pickups = []; state.particles = []; state.shield = state.magnet = state.slow = 0;
    dino.y = GROUND - dino.h; dino.vy = 0; dino.grounded = true; state.last = 0;
    state.runs++; localStorage.setItem('dinoQuestRuns', state.runs); setMode('running'); updateHud(); tone(540, .14);
  }
  function jump() {
    if (state.mode === 'ready') { reset(); return; }
    if (state.mode === 'running' && dino.grounded) { dino.vy = -14.3; dino.grounded = false; tone(440, .09, 'triangle'); }
  }
  function addObstacle() {
    const level = state.level, types = level < 2 ? ['cactus', 'rock'] : ['cactus', 'rock', 'crystal', ...(level > 2 ? ['bird'] : [])];
    const type = types[Math.floor(Math.random() * types.length)];
    const h = type === 'bird' ? (Math.random() < .5 ? 64 : 92) : type === 'cactus' ? 53 + Math.min(level * 2, 12) : 38;
    state.obstacles.push({ type, x: W + 24, h, w: type === 'bird' ? 46 : 42, passed: false });
    if (Math.random() < .35) state.pickups.push({ type: 'star', x: W + 180 + Math.random() * 120, y: GROUND - 95 - Math.random() * 60, phase: Math.random() * 6 });
    if (Math.random() < .11) { const type = ['shield', 'magnet', 'slow'][Math.floor(Math.random() * 3)]; state.pickups.push({ type, x: W + 320, y: GROUND - 82, phase: Math.random() * 6 }); }
  }
  function maybeQuiz() {
    if (state.passed && state.passed % 4 === 0) { state.distance = 0; state.question = nextQuestion(); showQuiz(); }
  }
  function nextQuestion() {
    const list = window.DINO_QUESTIONS || [];
    if (!list.length) return { subject: 'MIXED', question: 'Which planet is known as the Red Planet?', choices: ['Mars', 'Venus', 'Jupiter', 'Mercury'], answer: 0 };
    if (!state.questionPool.length) state.questionPool = list.map((_, i) => i).sort(() => Math.random() - .5);
    return list[state.questionPool.pop()];
  }
  function showQuiz() {
    setMode('quiz'); $('quizSubject').textContent = state.question.subject.toUpperCase(); $('questionText').textContent = state.question.question;
    $('answers').innerHTML = '';
    state.question.choices.forEach((choice, i) => {
      const btn = document.createElement('button'); btn.className = 'answer-btn'; btn.textContent = `${String.fromCharCode(65 + i)}.  ${choice}`;
      btn.addEventListener('click', () => answerQuiz(i, btn)); $('answers').append(btn);
    });
  }
  function answerQuiz(index, button) {
    if (state.mode !== 'quiz') return;
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);
    const right = index === state.question.answer;
    if (right) {
      button.classList.add('correct'); state.score += 150; state.level++; state.best = Math.max(state.best, state.score);
      tone(740, .1); setTimeout(() => tone(980, .16), 95); toast('Brilliant! +150 points · Stage unlocked');
    } else {
      button.classList.add('wrong'); document.querySelectorAll('.answer-btn')[state.question.answer].classList.add('correct');
      state.lives--; tone(180, .28, 'sawtooth'); toast(`Not quite! The answer was ${state.question.choices[state.question.answer]}`);
    }
    updateHud(); saveBest();
    setTimeout(() => { if (state.lives <= 0) finish(); else { setMode('running'); state.spawn = 80; state.last = 0; } }, 1150);
  }
  function toast(message) {
    ui.toast.textContent = message; ui.toast.classList.remove('hidden'); clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), 1800);
  }
  function saveBest() {
    if (state.score > state.best) state.best = state.score;
    localStorage.setItem('dinoQuestBest', state.best); localStorage.setItem('dinoQuestStage', Math.max(state.topStage, state.level)); state.topStage = Math.max(state.topStage, state.level); updateHud();
  }
  function finish() {
    setMode('over'); saveBest(); $('finalScore').textContent = `You scored ${state.score.toLocaleString()} points`;
    $('resultBest').textContent = fmt(state.best); $('runsPlayed').textContent = String(state.runs).padStart(2, '0'); $('topStage').textContent = String(state.topStage).padStart(2, '0');
    $('gameOverTitle').textContent = state.score > state.previousBest ? 'New high score!' : 'A great adventure!'; tone(130, .45, 'triangle');
  }
  function pickup(p) {
    if (p.type === 'star') { state.score += 40; particles(p.x, p.y, '#ffe178', 9); tone(880, .08); }
    else { state[p.type] = p.type === 'shield' ? 1 : 520; particles(p.x, p.y, '#9fe8ff', 15); tone(650, .2, 'sine'); toast(`${p.type[0].toUpperCase() + p.type.slice(1)} power activated!`); }
    saveBest();
  }
  function update(dt) {
    const multiplier = state.slow > 0 ? .58 : 1; if (state.slow > 0) state.slow -= dt;
    const speed = Math.min(12.8, 5.1 + state.level * .45 + state.score / 550) * multiplier;
    state.distance += speed * dt; state.score += .16 * dt * state.level; state.best = Math.max(state.best, Math.floor(state.score));
    dino.vy += .68 * dt; dino.y += dino.vy * dt;
    if (dino.y >= GROUND - dino.h) { dino.y = GROUND - dino.h; dino.vy = 0; dino.grounded = true; }
    state.spawn -= dt * multiplier;
    if (state.spawn <= 0) { addObstacle(); state.spawn = Math.max(54, 95 + Math.random() * 42 - state.level * 3) / Math.min(speed / 5, 1.7); }
    state.obstacles.forEach(o => { o.x -= speed * dt; if (!o.passed && o.x + o.w < dino.x) { o.passed = true; state.passed++; maybeQuiz(); } });
    state.obstacles = state.obstacles.filter(o => o.x + o.w > -20);
    state.pickups.forEach(p => { p.x -= speed * dt; if (state.magnet > 0 && p.type === 'star' && p.x < dino.x + 260) p.x += (dino.x + 38 - p.x) * .06; });
    state.pickups = state.pickups.filter(p => p.x > -20);
    for (const p of state.pickups) if (Math.abs(p.x - (dino.x + 30)) < 32 && Math.abs(p.y - (dino.y + 30)) < 35) { pickup(p); p.x = -100; }
    if (state.magnet > 0) state.magnet -= dt;
    for (const o of state.obstacles) if (collision(dino, o)) {
      o.x = -100; if (state.shield) { state.shield = 0; particles(dino.x + 30, dino.y + 30, '#9fe8ff', 22); tone(360, .2); toast('Your star shield saved you!'); }
      else { state.lives--; particles(dino.x + 30, dino.y + 30, '#ff8293', 20); tone(170, .25, 'sawtooth'); if (state.lives <= 0) { finish(); break; } }
    }
    if (Math.floor(state.frame) % 90 === 0) ui.tip.textContent = tips[Math.floor(Math.random() * tips.length)];
    updateHud();
  }
  function render() {
    background(); state.obstacles.forEach(drawObstacle); state.pickups.forEach(drawPickup); drawDino(); updateParticles(1);
    // Gentle speed streaks make the acceleration visible without obscuring play.
    if (state.mode === 'running') { ctx.globalAlpha = .18; ctx.fillStyle = '#d5efc1'; for (let i = 0; i < 5; i++) { const x = (W - (state.distance * (1 + i * .12) % W) + W) % W; ctx.fillRect(x, 112 + i * 38, 22 + i * 7, 1); } ctx.globalAlpha = 1; }
  }
  function loop(t) {
    const dt = state.last ? Math.min((t - state.last) / 16.67, 2) : 1; state.last = t; state.frame += dt;
    if (state.mode === 'running') update(dt);
    render(); requestAnimationFrame(loop);
  }

  $('startBtn').addEventListener('click', reset); $('restartBtn').addEventListener('click', reset); $('restartPauseBtn').addEventListener('click', reset);
  $('resumeBtn').addEventListener('click', () => { setMode('running'); state.last = 0; });
  $('pauseBtn').addEventListener('click', () => { if (state.mode === 'running') setMode('paused'); else if (state.mode === 'paused') { setMode('running'); state.last = 0; } });
  $('soundToggle').addEventListener('click', (e) => { state.sound = !state.sound; e.currentTarget.textContent = state.sound ? '♫' : '♪̸'; e.currentTarget.setAttribute('aria-label', state.sound ? 'Mute sound' : 'Enable sound'); if (state.sound) tone(660); });
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
    if (e.code === 'ArrowDown' && state.mode === 'running' && !dino.grounded) { dino.vy += 4; }
    if (e.code === 'KeyP' || e.code === 'Escape') { if (state.mode === 'running') setMode('paused'); else if (state.mode === 'paused') { setMode('running'); state.last = 0; } }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.mode === 'running') setMode('paused'); });
  updateHud(); ui.best.textContent = fmt(state.best); ui.tip.textContent = tips[Math.floor(Math.random() * tips.length)]; requestAnimationFrame(loop);
})();
