'use strict';
const $ = s => document.querySelector(s);
const STOPS = [[0,9,87],[52,76,183],[87,123,193]];
const pal = (t, al = 1) => { const p = t * 2, i = Math.min(1, p | 0), f = p - i, a = STOPS[i], b = STOPS[i + 1]; return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(' ')} / ${al})`; };

/* ---------- Utilitas canvas ---------- */
function fit(cv) {
  const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
  const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0);
  return [r.width, r.height, x];
}

/* =========================================================
   1. PENGURUTAN
   Setiap algoritma adalah generator: yield ['c', i, j] untuk
   perbandingan, ['s', i, j] untuk tukar, ['w', k] untuk tulis.
   ========================================================= */
function* bubble(a) {
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a.length - i - 1; j++) {
      yield ['c', j, j + 1];
      if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; yield ['s', j, j + 1]; }
    }
}
function* selection(a) {
  for (let i = 0; i < a.length; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) { yield ['c', m, j]; if (a[j] < a[m]) m = j; }
    if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; yield ['s', i, m]; }
  }
}
function* insertion(a) {
  for (let i = 1; i < a.length; i++) {
    for (let j = i; j > 0; j--) {
      yield ['c', j - 1, j];
      if (a[j - 1] <= a[j]) break;
      [a[j - 1], a[j]] = [a[j], a[j - 1]]; yield ['s', j - 1, j];
    }
  }
}
function* quick(a, l = 0, h = a.length - 1) {
  if (l >= h) return;
  const p = a[h]; let i = l;
  for (let j = l; j < h; j++) {
    yield ['c', j, h];
    if (a[j] < p) { [a[i], a[j]] = [a[j], a[i]]; yield ['s', i, j]; i++; }
  }
  [a[i], a[h]] = [a[h], a[i]]; yield ['s', i, h];
  yield* quick(a, l, i - 1); yield* quick(a, i + 1, h);
}
function* merge(a, l = 0, h = a.length - 1) {
  if (l >= h) return;
  const m = (l + h) >> 1;
  yield* merge(a, l, m); yield* merge(a, m + 1, h);
  const L = a.slice(l, m + 1), R = a.slice(m + 1, h + 1);
  let i = 0, j = 0, k = l;
  while (i < L.length && j < R.length) {
    yield ['c', l + i, m + 1 + j];
    a[k] = L[i] <= R[j] ? L[i++] : R[j++]; yield ['w', k]; k++;
  }
  while (i < L.length) { a[k] = L[i++]; yield ['w', k]; k++; }
  while (j < R.length) { a[k] = R[j++]; yield ['w', k]; k++; }
}
const ALGOS = {
  bubble: [bubble, 'Bubble sort', 'Membandingkan dua batang bersebelahan dan menukarnya bila urutannya salah. Batang terbesar "menggelembung" ke ujung kanan.', 'O(n²)'],
  selection: [selection, 'Selection sort', 'Mencari nilai terkecil dari bagian yang belum urut, lalu menaruhnya di posisi paling depan.', 'O(n²)'],
  insertion: [insertion, 'Insertion sort', 'Menyisipkan satu per satu data ke posisi yang tepat di bagian kiri yang sudah urut, seperti menyusun kartu.', 'O(n²)'],
  quick: [quick, 'Quick sort', 'Memilih pivot, memisahkan data lebih kecil di kiri dan lebih besar di kanan, lalu mengulang pada tiap sisi.', 'O(n log n) rata-rata'],
  merge: [merge, 'Merge sort', 'Membagi data menjadi dua sampai tinggal satu elemen, lalu menggabungkan kembali secara berurutan.', 'O(n log n)']
};

const sort = { arr: [], gen: null, timer: null, running: false, hl: [], kind: '', mark: -1, c: 0, w: 0 };
const sCv = $('#sortCanvas');

function newData() {
  stopSort();
  const n = +$('#size').value;
  sort.arr = Array.from({ length: n }, () => 5 + Math.floor(Math.random() * 95));
  sort.gen = null; sort.hl = []; sort.mark = -1; sort.c = sort.w = 0;
  showInfo(); drawSort();
}
function showInfo() {
  const [, name, desc, big] = ALGOS[$('#algo').value];
  $('#algoName').textContent = name; $('#algoDesc').textContent = desc; $('#algoBig').textContent = big;
  $('#stC').textContent = sort.c; $('#stW').textContent = sort.w;
}
function drawSort() {
  const [W, H, x] = fit(sCv), n = sort.arr.length, bw = W / n;
  x.clearRect(0, 0, W, H);
  sort.arr.forEach((v, i) => {
    const h = v / 100 * (H - 12);
    let col = pal(v / 100), a = 0.8;
    if (i <= sort.mark) a = 1;
    else if (sort.hl.includes(i)) { col = sort.kind === 'c' ? '#000957' : '#FFEB00'; a = 1; }
    x.globalAlpha = a; x.fillStyle = col;
    x.beginPath(); x.roundRect(i * bw + 1, H - h, Math.max(bw - 2, 1), h, Math.min(4, bw / 2)); x.fill();
    if (a === 1 && i > sort.mark && sort.kind !== 'c') { x.strokeStyle = '#000957'; x.lineWidth = 1.5; x.stroke(); }
  });
  x.globalAlpha = 1;
}
function stopSort() { clearTimeout(sort.timer); sort.running = false; $('#sortRun').textContent = sort.gen ? 'Lanjut' : 'Mulai'; }
function tickSort() {
  if (!sort.running) return;
  const speed = +$('#speed').value, steps = 1 + Math.floor(speed / 40);
  for (let k = 0; k < steps; k++) {
    const r = sort.gen.next();
    if (r.done) return finishSort();
    const [t, i, j] = r.value;
    sort.kind = t; sort.hl = t === 'w' ? [i] : [i, j];
    if (t === 'c') sort.c++; else sort.w++;
  }
  $('#stC').textContent = sort.c; $('#stW').textContent = sort.w;
  beep(sort.arr[sort.hl[0]]);
  drawSort();
  sort.timer = setTimeout(tickSort, Math.max(2, Math.round(600 / speed)));
}
function finishSort() {
  sort.hl = []; sort.gen = null; sort.running = false;
  $('#stC').textContent = sort.c; $('#stW').textContent = sort.w;
  let i = 0;
  const t = setInterval(() => {
    sort.mark = i++; drawSort();
    if (i >= sort.arr.length) { clearInterval(t); $('#sortRun').textContent = 'Ulangi'; }
  }, 10);
}
$('#sortRun').onclick = () => {
  if (sort.running) return stopSort();
  if (!sort.gen) {
    if (sort.mark >= 0) newData();
    sort.gen = ALGOS[$('#algo').value][0](sort.arr);
  }
  sort.running = true; $('#sortRun').textContent = 'Jeda'; tickSort();
};
$('#sortShuffle').onclick = newData;
$('#algo').onchange = newData;
$('#size').oninput = e => { $('#sizeOut').textContent = e.target.value; newData(); };
$('#speed').oninput = e => { $('#speedOut').textContent = e.target.value; };

/* =========================================================
   2. PENCARIAN JALUR (kisi, BFS / DFS / A*)
   ========================================================= */
const COLS = 28, ROWS = 14, gCv = $('#gridCanvas');
const grid = { wall: new Uint8Array(COLS * ROWS), start: [3, 7], end: [24, 7], seen: new Map(), path: [], timer: null, W: 0, cell: 0 };
const key = (c, r) => r * COLS + c;

function drawGrid() {
  const [W, H, x] = fit(gCv), s = W / COLS; grid.cell = s;
  x.clearRect(0, 0, W, H);
  x.strokeStyle = 'rgba(0,9,87,.07)'; x.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) { x.beginPath(); x.moveTo(c * s, 0); x.lineTo(c * s, H); x.stroke(); }
  for (let r = 0; r <= ROWS; r++) { x.beginPath(); x.moveTo(0, r * s); x.lineTo(W, r * s); x.stroke(); }
  const box = (c, r, col, pad = 1) => { x.fillStyle = col; x.beginPath(); x.roundRect(c * s + pad, r * s + pad, s - 2 * pad, s - 2 * pad, 5); x.fill(); };
  grid.seen.forEach((o, k) => box(k % COLS, Math.floor(k / COLS), pal(.3 + Math.min(o / 160, 1) * .7, .7)));
  for (let k = 0; k < grid.wall.length; k++) if (grid.wall[k]) box(k % COLS, Math.floor(k / COLS), '#000957');
  grid.path.forEach(([c, r]) => box(c, r, '#FFEB00', 3));
  const pin = ([c, r], col, t) => {
    x.fillStyle = col; x.beginPath(); x.arc((c + .5) * s, (r + .5) * s, s * .4, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.font = `600 ${s * .45}px Outfit,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(t, (c + .5) * s, (r + .55) * s);
  };
  pin(grid.start, '#344CB7', 'A'); pin(grid.end, '#000957', 'B');
}
function clearTrace() {
  clearTimeout(grid.timer); grid.seen = new Map(); grid.path = [];
  $('#pInfo').textContent = 'Belum ada pencarian.'; $('#pRun').disabled = false;
}
function* search(mode) {
  const [sc, sr] = grid.start, [ec, er] = grid.end;
  const par = new Map([[key(sc, sr), -1]]), g = { [key(sc, sr)]: 0 };
  const h = (c, r) => Math.abs(c - ec) + Math.abs(r - er);
  const open = [[sc, sr]];
  while (open.length) {
    let idx = 0;
    if (mode === 'dfs') idx = open.length - 1;
    else if (mode === 'astar') {
      let best = Infinity;
      open.forEach(([c, r], i) => { const f = g[key(c, r)] + h(c, r); if (f < best) { best = f; idx = i; } });
    }
    const [c, r] = open.splice(idx, 1)[0];
    yield ['v', c, r];
    if (c === ec && r === er) {
      const p = []; let k = key(c, r);
      while (k !== -1) { p.push([k % COLS, Math.floor(k / COLS)]); k = par.get(k); }
      yield ['p', p.reverse()]; return;
    }
    for (const [dc, dr] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nc = c + dc, nr = r + dr, nk = key(nc, nr);
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS || grid.wall[nk] || par.has(nk)) continue;
      par.set(nk, key(c, r)); g[nk] = g[key(c, r)] + 1; open.push([nc, nr]);
    }
  }
  yield ['x'];
}
function runSearch() {
  clearTrace(); $('#pRun').disabled = true;
  const it = search($('#pAlgo').value); let n = 0;
  const step = () => {
    for (let k = 0; k < 2; k++) {
      const { value: v } = it.next();
      if (v[0] === 'v') grid.seen.set(key(v[1], v[2]), n++);
      else if (v[0] === 'p') {
        grid.path = v[1]; drawGrid();
        $('#pInfo').textContent = `Jalur ditemukan: ${v[1].length - 1} langkah, ${grid.seen.size} sel dikunjungi.`;
        $('#pRun').disabled = false; return;
      } else {
        drawGrid(); $('#pInfo').textContent = 'Tidak ada jalur. Buka sebagian dinding lalu coba lagi.';
        $('#pRun').disabled = false; return;
      }
    }
    drawGrid(); grid.timer = setTimeout(step, 16);
  };
  step();
}
let drag = null, paint = 1;
const cellAt = e => {
  const r = gCv.getBoundingClientRect(), s = r.width / COLS;
  return [Math.floor((e.clientX - r.left) / s), Math.floor((e.clientY - r.top) / s)];
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
gCv.addEventListener('pointerdown', e => {
  const p = cellAt(e); if (p[0] < 0 || p[0] >= COLS || p[1] < 0 || p[1] >= ROWS) return;
  gCv.setPointerCapture(e.pointerId); clearTrace();
  if (same(p, grid.start)) drag = 'start';
  else if (same(p, grid.end)) drag = 'end';
  else { drag = 'wall'; paint = grid.wall[key(...p)] ? 0 : 1; grid.wall[key(...p)] = paint; }
  drawGrid();
});
gCv.addEventListener('pointermove', e => {
  if (!drag) return;
  const p = cellAt(e); if (p[0] < 0 || p[0] >= COLS || p[1] < 0 || p[1] >= ROWS) return;
  if (drag === 'wall') { if (!same(p, grid.start) && !same(p, grid.end)) grid.wall[key(...p)] = paint; }
  else if (!grid.wall[key(...p)] && !same(p, drag === 'start' ? grid.end : grid.start)) grid[drag] = p;
  drawGrid();
});
gCv.addEventListener('pointerup', () => { drag = null; });
$('#pRun').onclick = runSearch;
$('#pClear').onclick = () => { clearTrace(); drawGrid(); };
$('#pReset').onclick = () => { clearTrace(); grid.wall.fill(0); drawGrid(); };
$('#pMaze').onclick = () => {
  clearTrace();
  for (let k = 0; k < grid.wall.length; k++) grid.wall[k] = Math.random() < 0.28 ? 1 : 0;
  grid.wall[key(...grid.start)] = grid.wall[key(...grid.end)] = 0; drawGrid();
};

/* =========================================================
   3. EMPAT PILAR (HTML5 drag and drop + fallback ketuk)
   ========================================================= */
const PILAR = [
  ['Dekomposisi', 'Proyek aplikasi kampus dipecah menjadi modul login, jadwal kuliah, dan nilai.'],
  ['Pengenalan pola', 'Kantin selalu ramai pukul 12.00, jadi antrean disiapkan sebelum jam itu.'],
  ['Abstraksi', 'Peta MRT hanya menampilkan stasiun dan jalur, tanpa detail bangunan sekitarnya.'],
  ['Algoritma', 'Menulis langkah berurutan untuk mencari satu nama di daftar yang sudah terurut.']
];
let picked = null;
const shuffle = a => a.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);

function buildQuiz() {
  const bank = $('#bank'), zones = $('#zones');
  bank.innerHTML = zones.innerHTML = ''; $('#qScore').textContent = ''; picked = null;
  shuffle(PILAR).forEach(([name]) => {
    const c = document.createElement('div');
    c.className = 'chip'; c.draggable = true; c.textContent = name; c.tabIndex = 0;
    c.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', name); picked = c; });
    c.addEventListener('click', () => { document.querySelectorAll('.chip').forEach(x => x.classList.remove('sel')); picked = c; c.classList.add('sel'); });
    bank.append(c);
  });
  shuffle(PILAR).forEach(([name, text]) => {
    const z = document.createElement('div');
    z.className = 'zone'; z.dataset.answer = name; z.innerHTML = `<p>${text}</p>`;
    zones.append(z);
  });
  [bank, ...zones.children].forEach(z => {
    z.addEventListener('dragover', e => { e.preventDefault(); z.classList.add('over'); });
    z.addEventListener('dragleave', () => z.classList.remove('over'));
    z.addEventListener('drop', e => { e.preventDefault(); z.classList.remove('over'); place(z); });
    z.addEventListener('click', e => { if (picked && !e.target.classList.contains('chip')) place(z); });
  });
}
function place(zone) {
  if (!picked) return;
  const old = zone.querySelector('.chip');
  if (old && old !== picked) $('#bank').append(old);
  zone.append(picked); picked.classList.remove('sel');
  document.querySelectorAll('.zone').forEach(z => z.classList.remove('ok', 'no'));
  picked = null;
}
$('#qCheck').onclick = () => {
  let ok = 0;
  document.querySelectorAll('.zone').forEach(z => {
    const chip = z.querySelector('.chip'), good = chip && chip.textContent === z.dataset.answer;
    z.classList.toggle('ok', !!good); z.classList.toggle('no', !good); if (good) ok++;
  });
  if (ok === 4) confetti();
  $('#qScore').textContent = ok === 4 ? 'Benar semua. Empat pilar sudah cocok.' : `${ok} dari 4 benar. Periksa zona bergaris merah.`;
};
$('#qReset').onclick = buildQuiz;

/* ---------- Inisialisasi ---------- */
let rz;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { drawSort(); drawGrid(); drawRace(); }, 100); });
newData(); drawGrid(); buildQuiz();

/* =========================================================
   4. TAMBAHAN: suara, gambar data, balapan pencarian, efek
   ========================================================= */
let ac;
function beep(v) {
  if (!$('#snd').checked) return;
  ac = ac || new AudioContext();
  const o = ac.createOscillator(), g = ac.createGain();
  o.frequency.value = 180 + v * 7; g.gain.value = 0.04;
  o.connect(g); g.connect(ac.destination); o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08); o.stop(ac.currentTime + 0.09);
}
sCv.addEventListener('pointermove', e => {
  if (e.buttons !== 1 || sort.running || sort.gen) return;
  const r = sCv.getBoundingClientRect(), i = Math.floor((e.clientX - r.left) / r.width * sort.arr.length);
  if (i < 0 || i >= sort.arr.length) return;
  sort.arr[i] = Math.max(5, Math.min(100, Math.round((1 - (e.clientY - r.top) / r.height) * 100)));
  sort.mark = -1; drawSort();
});

const rc = $('#raceCanvas'), R = { n: 48, t: 0, lin: {}, bin: {}, timer: null };
function raceReset() {
  clearTimeout(R.timer);
  R.lin = { i: -1, done: 0, steps: 0 }; R.bin = { lo: 0, hi: R.n - 1, mid: -1, done: 0, steps: 0 };
  $('#raceInfo').textContent = `Target: nilai ${R.t * 3 + 2} pada indeks ${R.t}. Klik kotak untuk mengganti target.`;
  drawRace();
}
function raceNew() { R.n = +$('#nSearch').value; R.t = Math.floor(Math.random() * R.n); raceReset(); }
function drawRace() {
  const [W, H, x] = fit(rc), cw = W / R.n; x.clearRect(0, 0, W, H);
  [['Linear', R.lin], ['Biner', R.bin]].forEach(([nm, s], L) => {
    const y = L * 92 + 28;
    x.fillStyle = '#4a5578'; x.font = '600 13px Outfit,sans-serif'; x.textAlign = 'left';
    x.fillText(`${nm}: ${s.steps} langkah`, 2, y - 10);
    for (let i = 0; i < R.n; i++) {
      let col = 'rgba(52,76,183,.2)';
      if (L === 0 && i <= s.i) col = pal(i / R.n, .8);
      if (L === 1 && (i < s.lo || i > s.hi)) col = 'rgba(0,9,87,.1)';
      if (L === 0 ? i === s.i : i === s.mid) col = '#000957';
      if (s.done && i === R.t) col = '#FFEB00';
      x.fillStyle = col; x.beginPath(); x.roundRect(i * cw + .5, y, Math.max(cw - 1.5, 1), 52, 3); x.fill();
      if (i === R.t) { x.strokeStyle = '#000957'; x.lineWidth = 2; x.stroke(); }
    }
  });
}
function raceStep() {
  const l = R.lin, b = R.bin;
  if (!l.done) { l.i++; l.steps++; if (l.i === R.t) l.done = 1; }
  if (!b.done) {
    b.mid = (b.lo + b.hi) >> 1; b.steps++;
    if (b.mid === R.t) b.done = 1; else if (b.mid < R.t) b.lo = b.mid + 1; else b.hi = b.mid - 1;
  }
  drawRace();
  if (l.done && b.done) {
    $('#raceInfo').textContent = `Biner selesai dalam ${b.steps} langkah, linear ${l.steps} langkah. Coba tambah jumlah data dan lihat selisihnya melebar.`;
    return;
  }
  R.timer = setTimeout(raceStep, Math.max(40, 5400 / R.n));
}
rc.addEventListener('pointerdown', e => {
  const r = rc.getBoundingClientRect();
  R.t = Math.max(0, Math.min(R.n - 1, Math.floor((e.clientX - r.left) / r.width * R.n))); raceReset();
});
$('#raceRun').onclick = () => { raceReset(); raceStep(); };
$('#raceNew').onclick = raceNew;
$('#nSearch').oninput = e => { $('#nOut').textContent = e.target.value; raceNew(); };
raceNew();

function confetti() {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:30';
  c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const x = c.getContext('2d'), P = Array.from({ length: 130 }, () => ({
    x: innerWidth / 2, y: innerHeight * .65, vx: (Math.random() - .5) * 15, vy: -Math.random() * 16 - 4,
    s: 5 + Math.random() * 7, c: Math.random() < .3 ? '#FFEB00' : pal(Math.random()), r: Math.random() * 6
  }));
  let f = 0;
  (function a() {
    x.clearRect(0, 0, c.width, c.height);
    P.forEach(p => { p.vy += .4; p.x += p.vx; p.y += p.vy; p.r += .2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore(); });
    if (++f < 120) requestAnimationFrame(a); else c.remove();
  })();
}

document.querySelectorAll('section.glass').forEach(s => s.addEventListener('pointermove', e => {
  const r = s.getBoundingClientRect();
  s.style.setProperty('--mx', e.clientX - r.left + 'px'); s.style.setProperty('--my', e.clientY - r.top + 'px');
}));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .06 });
document.querySelectorAll('main > section').forEach(s => { s.classList.add('rv'); io.observe(s); });
addEventListener('scroll', () => { $('#prog').style.width = scrollY / (document.documentElement.scrollHeight - innerHeight) * 100 + '%'; }, { passive: true });