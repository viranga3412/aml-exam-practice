// Theory guide: short concept cards (key points, formula, exam trap) with animated SVG
// diagrams. Every MCQ subtopic maps to one card via SUBTOPIC_THEORY; essays via ESSAY_THEORY.
// Animations are plain functions t (seconds) -> SVG markup for a 320x180 viewBox, redrawn
// by a small requestAnimationFrame loop only while visible.

// ---------------------------------------------------------------- svg helpers
const TW = 320, TH = 180;
const C1 = "var(--series-1)", C2 = "var(--series-2)", C3 = "var(--series-3)", C4 = "var(--series-4)";
const INK = "var(--ink)", MUT = "var(--muted)", RUL = "var(--rule)", GOOD = "var(--good)", BAD = "var(--bad)";
const f1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
const f2 = (v) => v.toFixed(2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, s) => a + (b - a) * s;
const ease = (s) => { s = clamp(s, 0, 1); return s * s * (3 - 2 * s); };
const cyc = (t, p) => (t % p) / p;
const wave = (t, p) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / p); // 0..1..0

function L(x1, y1, x2, y2, s = INK, w = 1.5, dash) { return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""} stroke-linecap="round"/>`; }
function Cc(x, y, r, fill, stroke, sw = 1.5, op = 1) { return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill || "none"}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}${op < 1 ? ` opacity="${op}"` : ""}/>`; }
function T(x, y, s, o = {}) { return `<text x="${x}" y="${y}" font-size="${o.size || 10}" fill="${o.fill || INK}" text-anchor="${o.anchor || "start"}"${o.bold ? ' font-weight="700"' : ""}>${s}</text>`; }
function P(pts, s = INK, w = 2, o = {}) {
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("") + (o.close ? "Z" : "");
  return `<path d="${d}" fill="${o.fill || "none"}" stroke="${s}" stroke-width="${w}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ""}${o.op ? ` opacity="${o.op}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
}
function R(x, y, w, h, fill, o = {}) { return `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${o.rx || 0}" fill="${fill}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 1.5}"` : ""}${o.op !== undefined ? ` opacity="${o.op}"` : ""}/>`; }
function X(x, y, r, s, w = 2) { return `<path d="M${x - r},${y - r}L${x + r},${y + r}M${x - r},${y + r}L${x + r},${y - r}" stroke="${s}" stroke-width="${w}"/>`; }
function fnPath(fn, x0, x1, sx, sy, n = 80) { const pts = []; for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; pts.push([sx(x), sy(fn(x))]); } return pts; }
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r()); }
function Phi(z) { const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2); return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y); }
function frame(x0, y0, x1, y1) { return L(x0, y1, x1, y1, MUT, 1) + L(x0, y0, x0, y1, MUT, 1); }

// ---------------------------------------------------------------- precomputed data
const KM = (() => {
  const r = rng(7), pts = [];
  [[70, 60], [210, 50], [150, 135]].forEach(([cx, cy]) => { for (let i = 0; i < 12; i++) pts.push([cx + gauss(r) * 18, cy + gauss(r) * 14]); });
  let cents = [[40, 150], [60, 140], [290, 40]];
  const iters = [];
  for (let k = 0; k < 8; k++) {
    const asg = pts.map((p) => { let b = 0, bd = 1e9; cents.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2; if (d < bd) { bd = d; b = j; } }); return b; });
    const next = cents.map((c, j) => { const m = pts.filter((_, i) => asg[i] === j); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : c; });
    iters.push({ cents, asg, next });
    if (next.every((c, j) => Math.hypot(c[0] - cents[j][0], c[1] - cents[j][1]) < 0.5)) break;
    cents = next;
  }
  return { pts, iters };
})();

const DB = (() => {
  const r = rng(11), pts = [];
  for (let i = 0; i < 16; i++) pts.push([80 + gauss(r) * 16, 80 + gauss(r) * 16]);
  for (let i = 0; i < 14; i++) { const a = r() * Math.PI; pts.push([200 + Math.cos(a) * 60 + gauss(r) * 5, 120 - Math.sin(a) * 50 + gauss(r) * 5]); }
  pts.push([150, 30], [290, 160], [30, 160], [160, 160]);
  const eps = 24, minPts = 4;
  const nb = pts.map((p) => pts.map((q, j) => (Math.hypot(p[0] - q[0], p[1] - q[1]) <= eps ? j : -1)).filter((j) => j >= 0));
  const core = nb.map((n) => n.length >= minPts);
  const kind = pts.map((_, i) => (core[i] ? "core" : nb[i].some((j) => core[j]) ? "border" : "noise"));
  const lab = new Array(pts.length).fill(-1); let c = 0;
  pts.forEach((_, i) => { if (!core[i] || lab[i] >= 0) return; const st = [i]; lab[i] = c; while (st.length) { const u = st.pop(); if (!core[u]) continue; nb[u].forEach((v) => { if (lab[v] < 0) { lab[v] = c; st.push(v); } }); } c++; });
  return { pts, eps, kind, lab };
})();

const KNN = (() => {
  const r = rng(3), pts = [];
  for (let i = 0; i < 11; i++) pts.push([160 + gauss(r) * 55 - 35, 90 + gauss(r) * 35, 0]);
  for (let i = 0; i < 11; i++) pts.push([160 + gauss(r) * 55 + 40, 90 + gauss(r) * 35, 1]);
  const q = [168, 92];
  const order = pts.map((p, i) => [Math.hypot(p[0] - q[0], p[1] - q[1]), i]).sort((a, b) => a[0] - b[0]);
  return { pts, q, order };
})();

const BOOST = (() => {
  const xs = [], ys = [];
  for (let i = 0; i < 20; i++) { const x = 0.25 + i * 0.5; xs.push(x); ys.push(Math.sin(x * 0.8) * 2 + 0.3 * Math.cos(x * 3)); }
  const eta = 0.5, rounds = [];
  let F = xs.map(() => ys.reduce((a, b) => a + b, 0) / ys.length);
  rounds.push(F.slice());
  for (let m = 0; m < 10; m++) {
    const res = ys.map((y, i) => y - F[i]);
    let best = null;
    for (let s = 1; s < xs.length; s++) {
      const lm = res.slice(0, s).reduce((a, b) => a + b, 0) / s, rm = res.slice(s).reduce((a, b) => a + b, 0) / (xs.length - s);
      const err = res.reduce((a, rr, i) => a + (rr - (i < s ? lm : rm)) ** 2, 0);
      if (!best || err < best.err) best = { s, lm, rm, err };
    }
    F = F.map((f, i) => f + eta * (i < best.s ? best.lm : best.rm));
    rounds.push(F.slice());
  }
  return { xs, ys, rounds };
})();

const TREE = (() => {
  const r = rng(21), pts = [];
  for (let i = 0; i < 40; i++) { const u = r() * 10, v = r() * 10; const blue = (u > 5 && v > 3) || (u <= 5 && v > 7); pts.push([u, v, blue ? 0 : 1]); }
  const gini = (set) => { if (!set.length) return 0; const p = set.filter((q) => q[2] === 0).length / set.length; return 1 - p * p - (1 - p) * (1 - p); };
  return { pts, gini };
})();

const BAG = (() => { const r = rng(5); return [0, 1, 2].map(() => Array.from({ length: 8 }, () => Math.floor(r() * 8))); })();

const LIME = (() => {
  const r = rng(9), s = [];
  for (let i = 0; i < 40; i++) s.push([7 + gauss(r) * 1.5, 6.2 + gauss(r) * 1.5]);
  return s;
})();

// ---------------------------------------------------------------- animations
const ANIMS = {
  sigmoid(t) {
    const sx = (z) => 30 + ((z + 6) / 12) * 270, sy = (p) => 150 - p * 120;
    const z = 5 * Math.sin(t * 0.9), p = 1 / (1 + Math.exp(-z)), cls = p >= 0.5;
    return frame(30, 25, 300, 150) + L(30, sy(0.5), 300, sy(0.5), MUT, 1, "4 3") + T(302, sy(0.5) + 3, "0.5", { fill: MUT, size: 9 }) +
      P(fnPath((v) => 1 / (1 + Math.exp(-v)), -6, 6, sx, sy), C1, 2.5) +
      L(sx(z), sy(p), sx(z), 150, MUT, 1, "2 2") + Cc(sx(z), sy(p), 6, cls ? GOOD : C2) +
      T(36, 18, `z = w·x + b = ${f1(z)}`, { bold: true }) + T(170, 18, `σ(z) = ${f2(p)} → class ${cls ? 1 : 0}`, { bold: true, fill: cls ? GOOD : C2 }) +
      T(300, 166, "z", { anchor: "end", fill: MUT }) + T(16, 30, "p", { fill: MUT }) + T(165, 174, "σ(z) = 1 / (1 + e⁻ᶻ) squashes any score into (0, 1)", { anchor: "middle", size: 9, fill: MUT });
  },

  gd(t) {
    const sx = (w) => 160 + w * 45, sy = (J) => 160 - J * 14;
    const ws = [-2.9]; for (let i = 0; i < 12; i++) ws.push(ws[i] * 0.7);
    const per = 0.75, k = Math.floor(t / per) % 15, s = ease((t % per) / per * 1.4);
    const kk = Math.min(k, 11), w = k >= 12 ? ws[12] : lerp(ws[kk], ws[kk + 1], s);
    let g = P(fnPath((v) => v * v, -3.1, 3.1, sx, sy), C1, 2.5) + L(20, 160, 300, 160, MUT, 1);
    for (let i = 0; i <= Math.min(k, 12); i++) g += Cc(sx(ws[i]), sy(ws[i] ** 2), 3, C2, null, 0, 0.45);
    const slope = 2 * w;
    g += L(sx(w - 0.6), sy(w * w - 0.6 * slope), sx(w + 0.6), sy(w * w + 0.6 * slope), C3, 1.5);
    g += Cc(sx(w), sy(w * w), 7, C2);
    return g + T(16, 18, `step ${Math.min(k, 12)}:  w = ${f2(w)},  J(w) = ${f2(w * w)},  slope = ${f2(slope)}`, { bold: true }) +
      T(16, 33, "w := w − α · dJ/dw   (move against the slope)", { fill: MUT }) + T(sx(0), 174, "minimum", { anchor: "middle", fill: MUT, size: 9 });
  },

  lr(t) {
    const panels = [["α too small", 0.93, C3], ["α just right", 0.45, GOOD], ["α too big", -1.15, BAD]];
    const k = Math.floor(t / 0.6) % 12;
    let g = "";
    panels.forEach(([name, fac, col], pi) => {
      const ox = 10 + pi * 104, sx = (w) => ox + 50 + w * 15, sy = (J) => 150 - J * 10;
      g += P(fnPath((v) => v * v, -3.2, 3.2, sx, sy), MUT, 1.5);
      let w = -2.6; const trail = [[sx(w), sy(w * w)]];
      for (let i = 0; i < k; i++) { w = clamp(w * fac, -3, 3); trail.push([sx(w), sy(w * w)]); }
      g += P(trail, col, 1.5, { op: 0.7 }) + trail.map((p) => Cc(p[0], p[1], 2.5, col)).join("") + Cc(trail[trail.length - 1][0], trail[trail.length - 1][1], 5, col);
      g += T(ox + 50, 168, name, { anchor: "middle", bold: true, fill: col });
    });
    return g + T(160, 16, "Same start, different learning rates", { anchor: "middle", bold: true }) + T(160, 30, "slow crawl  ·  smooth convergence  ·  overshoot / diverge", { anchor: "middle", fill: MUT, size: 9 });
  },

  margin(t) {
    const sx = (u) => 30 + u * 26, sy = (v) => 172 - v * 15.5;
    const A = [[5, 7], [7, 5], [8, 8], [9, 6], [6, 9], [9, 9]], B = [[4, 4], [3, 5], [2, 2], [1, 4], [3, 1], [1, 1]];
    const sv = [[5, 7], [7, 5], [4, 4], [3, 5]];
    const s = ease(cyc(t, 5) * 2.2), m = 2 * s;
    const band = [[sx(0), sy(10 + m)], [sx(10), sy(m)], [sx(10), sy(-m)], [sx(0), sy(10 - m)]].map((p) => [p[0], clamp(p[1], 10, 172)]);
    let g = P(band, "none", 0, { fill: "var(--accent-soft)", close: true });
    g += L(sx(0), sy(10), sx(10), sy(0), INK, 2) + L(sx(2), sy(10), sx(10), sy(2), C1, 1.3, "5 4") + L(sx(0), sy(8), sx(8), sy(0), C2, 1.3, "5 4");
    A.forEach(([u, v]) => (g += `<path d="M${sx(u) - 5},${sy(v)}h10M${sx(u)},${sy(v) - 5}v10" stroke="${C1}" stroke-width="2.4"/>`));
    B.forEach(([u, v]) => (g += Cc(sx(u), sy(v), 4.5, C2)));
    const pr = 9 + 3 * Math.sin(t * 4);
    sv.forEach(([u, v]) => (g += Cc(sx(u), sy(v), pr, null, "var(--warn)", 1.6)));
    return g + T(200, 165, "support vectors (ringed) alone fix the line", { size: 9, fill: MUT, anchor: "middle" }) +
      T(8, 14, "Widest street between the classes", { bold: true }) + T(8, 27, "margin width = 2 / ‖w‖  → maximise it = minimise ‖w‖²", { fill: MUT, size: 9 });
  },

  softmargin(t) {
    const sx = (u) => 30 + u * 26, sy = (v) => 172 - v * 15.5;
    const A = [[6, 7], [7, 6], [8, 8], [5, 8], [8, 6.5]], B = [[2, 3], [3, 4], [4, 3.5], [1, 5], [2, 1.5]], out = [4.2, 4.4];
    const s = wave(t, 7), k = lerp(10, 8.05, s), m = lerp(2.5, 0.55, s);
    const C = Math.pow(10, lerp(-1, 2, s));
    const line = (c) => [[sx(0), sy(c)], [sx(c), sy(0)]].map((p) => p);
    let g = P([[sx(0), sy(k + m)], [sx(k + m), sy(0)], [sx(k - m), sy(0)], [sx(0), sy(k - m)]], "none", 0, { fill: "var(--accent-soft)", close: true });
    const [a, b] = line(k); g += L(a[0], a[1], b[0], b[1], INK, 2);
    const [c1, c2] = line(k + m); g += L(c1[0], c1[1], c2[0], c2[1], C1, 1.2, "5 4");
    const [d1, d2] = line(k - m); g += L(d1[0], d1[1], d2[0], d2[1], C2, 1.2, "5 4");
    A.concat([out]).forEach(([u, v]) => (g += `<path d="M${sx(u) - 5},${sy(v)}h10M${sx(u)},${sy(v) - 5}v10" stroke="${C1}" stroke-width="2.4"/>`));
    g += Cc(sx(out[0]), sy(out[1]), 10, null, BAD, 1.4) + T(sx(out[0]) + 12, sy(out[1]) + 18, "noisy point", { size: 9, fill: BAD });
    B.forEach(([u, v]) => (g += Cc(sx(u), sy(v), 4.5, C2)));
    return g + T(8, 14, `C = ${C < 1 ? f2(C) : Math.round(C)}`, { bold: true, size: 12 }) +
      T(8, 28, s < 0.5 ? "small C → wide margin, allows violations (soft)" : "large C → narrow margin, fits every point (overfit risk)", { fill: s < 0.5 ? GOOD : BAD, size: 9.5 });
  },

  kernel(t) {
    const sx = (x) => 160 + x * 40, sy = (y) => 160 - y * 10.5;
    const A = [-3.2, -2.6, -2, 2, 2.6, 3.2], B = [-1, -0.5, 0, 0.5, 1];
    const ph = cyc(t, 7), lift = ease((ph - 0.2) / 0.3), sep = ease((ph - 0.6) / 0.15);
    let g = L(20, sy(0), 300, sy(0), MUT, 1);
    if (lift > 0) g += P(fnPath((x) => x * x * lift, -3.4, 3.4, sx, sy), MUT, 1, { dash: "3 3" });
    if (sep > 0) g += L(20, sy(2.5), lerp(20, 300, sep), sy(2.5), GOOD, 2.5);
    A.forEach((x) => (g += `<path d="M${sx(x) - 5},${sy(x * x * lift)}h10M${sx(x)},${sy(x * x * lift) - 5}v10" stroke="${C1}" stroke-width="2.4"/>`));
    B.forEach((x) => (g += Cc(sx(x), sy(x * x * lift), 4.5, C2)));
    const msg = ph < 0.2 ? "1-D input: no single threshold separates + from ●" : ph < 0.6 ? "map φ(x) = (x, x²): lift every point" : "now a straight line separates them";
    return g + T(10, 16, msg, { bold: true }) + T(10, 30, "Kernel trick: K(x, x′) = φ(x)·φ(x′) without computing φ", { fill: MUT, size: 9 });
  },

  gamma(t) {
    const P0 = [[-3, 1], [-2.2, 1], [-1, -1], [0, 1], [0.8, -1], [2, -1], [2.8, 1]];
    const s = wave(t, 8), gm = Math.pow(10, lerp(-1, 1.1, s));
    const f = (x) => P0.reduce((a, [xi, yi]) => a + yi * Math.exp(-gm * (x - xi) ** 2), 0);
    const sx = (x) => 160 + x * 42, sy = (y) => 95 - y * 30;
    let g = "";
    for (let px = 20; px < 300; px += 4) { const v = f((px - 160) / 42); g += R(px, 128, 4, 10, v >= 0 ? C1 : C2, { op: 0.75 }); }
    g += L(20, sy(0), 300, sy(0), MUT, 1, "3 3") + P(fnPath(f, -3.4, 3.4, sx, sy, 160), INK, 2);
    P0.forEach(([x, y]) => (g += y > 0 ? `<path d="M${sx(x) - 5},${sy(y)}h10M${sx(x)},${sy(y) - 5}v10" stroke="${C1}" stroke-width="2.4"/>` : Cc(sx(x), sy(y), 4.5, C2)));
    return g + T(10, 16, `γ = ${f2(gm)}`, { bold: true, size: 12 }) +
      T(10, 30, s < 0.45 ? "small γ: each point influences far → smooth (underfit)" : "large γ: tiny bumps around each point → overfit", { size: 9.5, fill: s < 0.45 ? C3 : BAD }) +
      T(20, 152, "decision regions (sign of f):", { size: 9, fill: MUT }) + T(160, 170, "RBF: K(x, x′) = exp(−γ‖x − x′‖²)", { anchor: "middle", size: 9, fill: MUT });
  },

  knn(t) {
    const Ks = [1, 3, 5, 7], seg = 2.2, i = Math.floor(t / seg) % 4, K = Ks[i], grow = ease((t % seg) / 0.7);
    const rad = (KNN.order[K - 1][0] + 4) * grow;
    const nbr = new Set(KNN.order.slice(0, K).map((o) => o[1]));
    let g = Cc(KNN.q[0], KNN.q[1], rad, "var(--accent-soft)", INK, 1.2);
    KNN.pts.forEach((p, j) => {
      const on = nbr.has(j) && grow > 0.95;
      g += p[2] ? Cc(p[0], p[1], on ? 5.5 : 4, C2) : `<path d="M${p[0] - 5},${p[1]}h10M${p[0]},${p[1] - 5}v10" stroke="${C1}" stroke-width="${on ? 3.2 : 2}"/>`;
    });
    g += `<path d="M${KNN.q[0]},${KNN.q[1] - 8}l2.4,5.6l6,.4l-4.6,3.9l1.5,5.9l-5.3,-3.2l-5.3,3.2l1.5,-5.9l-4.6,-3.9l6,-.4z" fill="var(--warn)"/>`;
    const blue = [...nbr].filter((j) => !KNN.pts[j][2]).length, or = K - blue;
    return g + T(8, 16, `K = ${K}`, { bold: true, size: 13 }) +
      (grow > 0.95 ? T(8, 31, `${blue} + vs ${or} ● → predict ${blue > or ? "+" : "●"}`, { bold: true, fill: blue > or ? C1 : C2 }) : "") +
      T(312, 174, "no training: just store data, vote at query time", { anchor: "end", size: 9, fill: MUT });
  },

  curse(t) {
    const s = wave(t, 8), d = Math.round(Math.pow(10, lerp(0, 2, s))), e = Math.pow(0.1, 1 / d);
    let g = R(30, 70, 260, 22, RUL, { rx: 4 }) + R(30, 70, 260 * e, 22, e > 0.7 ? BAD : C1, { rx: 4 }) + T(30 + 260 * e - 4, 85, `${Math.round(e * 100)}%`, { anchor: "end", bold: true, fill: "#fff" });
    const ratio = 1 - 1 / Math.sqrt(d);
    g += R(30, 128, 260, 14, RUL, { rx: 4 }) + R(30, 128, 260 * ratio, 14, C4, { rx: 4 });
    return T(10, 18, `dimensions d = ${d}`, { bold: true, size: 13 }) +
      T(30, 62, "edge length needed to capture 10% of the data  =  0.1^(1/d)", { size: 9.5, fill: MUT }) + g +
      T(30, 121, "nearest ≈ farthest: distances lose contrast as d grows", { size: 9.5, fill: MUT }) +
      T(160, 168, "→ neighbours stop being near. Use PCA / feature selection.", { anchor: "middle", size: 9.5, bold: true });
  },

  kmeans(t) {
    const n = KM.iters.length, per = 1.4, total = n * per + 1.6, tt = t % total, k = Math.min(n - 1, Math.floor(tt / per)), s = ease(((tt % per) / per - 0.35) / 0.65);
    const it = KM.iters[k], cols = [C1, C2, C3];
    const cents = tt >= n * per ? KM.iters[n - 1].next : it.cents.map((c, j) => [lerp(c[0], it.next[j][0], s), lerp(c[1], it.next[j][1], s)]);
    let g = "";
    KM.pts.forEach((p, i) => (g += Cc(p[0], p[1], 3.6, cols[it.asg[i]], null, 0, 0.85)));
    cents.forEach((c, j) => (g += X(c[0], c[1], 7, cols[j], 3.5) + Cc(c[0], c[1], 10, null, INK, 1)));
    return g + T(8, 16, `iteration ${k + 1}: assign to nearest centroid → move centroid to mean`, { size: 9.5, bold: true }) +
      T(8, 174, "minimise inertia  Σ ‖x − μ_c‖²   (K chosen up front)", { size: 9, fill: MUT });
  },

  dbscan(t) {
    const n = DB.pts.length, step = Math.floor(t * 4) % (n + 10), cols = [C1, C3, C4];
    let g = "";
    DB.pts.forEach((p, i) => {
      if (i >= step) { g += Cc(p[0], p[1], 3.5, RUL); return; }
      const k = DB.kind[i];
      if (k === "noise") g += X(p[0], p[1], 3.5, BAD, 1.8);
      else if (k === "core") g += Cc(p[0], p[1], 4, cols[DB.lab[i] % 3]);
      else g += Cc(p[0], p[1], 4, null, cols[DB.lab[i] % 3], 1.8);
    });
    if (step < n) { const p = DB.pts[step]; g += Cc(p[0], p[1], DB.eps, "var(--accent-soft)", INK, 1, 0.9) + Cc(p[0], p[1], 2, INK); }
    return g + T(8, 16, "ε-circle around each point: ≥ minPts neighbours → core", { bold: true, size: 9.5 }) +
      T(8, 174, "● core   ○ border (near a core)   ✕ noise — no K needed, any shape", { size: 9, fill: MUT });
  },

  hier(t) {
    const xs = [30, 70, 130, 170, 250, 290], base = 150, hy = (h) => base - h * 3.2;
    const merges = [[[0], [1], 10], [[2], [3], 10], [[4], [5], 12], [[0, 1], [2, 3], 22], [[0, 1, 2, 3], [4, 5], 36]];
    const per = 0.9, shown = Math.min(5, Math.floor((t % 9) / per)), cut = shown >= 5 ? hy(lerp(38, 8, wave(t - 4.5, 4.5))) : null;
    const pos = (grp) => grp.reduce((a, i) => a + xs[i], 0) / grp.length;
    const top = {}; xs.forEach((_, i) => (top[i] = base));
    let g = "";
    merges.slice(0, shown).forEach(([a, b, h]) => {
      const ya = Math.min(...a.map((i) => top[i])), yb = Math.min(...b.map((i) => top[i]));
      const xa = pos(a), xb = pos(b), y = hy(h);
      g += P([[xa, ya], [xa, y], [xb, y], [xb, yb]], C1, 2);
      a.concat(b).forEach((i) => (top[i] = y));
    });
    xs.forEach((x, i) => (g += Cc(x, base + 8, 5, C2) + T(x, base + 24, String.fromCharCode(65 + i), { anchor: "middle", size: 9, fill: MUT })));
    if (cut !== null) {
      const hcut = (base - cut) / 3.2, k = 6 - merges.filter((m) => m[2] < hcut).length;
      g += L(15, cut, 305, cut, BAD, 1.5, "6 4") + T(305, cut + 13, `cut → ${k} clusters`, { anchor: "end", fill: BAD, bold: true, size: 9.5 });
    }
    return g + T(8, 16, "Agglomerative: repeatedly merge the two closest clusters", { bold: true, size: 9.5 }) + T(8, 29, "height = linkage distance; cut the dendrogram to pick K", { size: 9, fill: MUT });
  },

  biasvar(t) {
    const sx = (c) => 30 + c * 270, sy = (e) => 150 - e * 115;
    const bias = (c) => 0.75 * (1 - c) ** 2 + 0.02, vari = (c) => 0.7 * c ** 2.2 + 0.01, noise = 0.08, tot = (c) => bias(c) + vari(c) + noise, train = (c) => 0.8 * (1 - c) ** 1.6 + 0.02;
    const c = lerp(0.05, 0.95, wave(t, 8));
    let g = frame(30, 20, 300, 150) + P(fnPath(train, 0, 1, sx, sy), C1, 2) + P(fnPath(tot, 0, 1, sx, sy), C2, 2.5) + P(fnPath(bias, 0, 1, sx, sy), C3, 1.3, { dash: "4 3" }) + P(fnPath(vari, 0, 1, sx, sy), C4, 1.3, { dash: "4 3" });
    g += L(sx(c), 20, sx(c), 150, MUT, 1, "2 2") + Cc(sx(c), sy(tot(c)), 5, C2) + Cc(sx(c), sy(train(c)), 4, C1);
    const zone = c < 0.38 ? ["underfit: high bias", C3] : c < 0.62 ? ["sweet spot", GOOD] : ["overfit: high variance", BAD];
    return g + T(clamp(sx(c), 80, 250), 14, zone[0], { anchor: "middle", bold: true, fill: zone[1] }) +
      T(300, 166, "model complexity →", { anchor: "end", size: 9, fill: MUT }) +
      T(34, 174, "— train   — test   - - bias²   - - variance", { size: 9, fill: MUT });
  },

  fit(t) {
    const xs = [0.5, 1.2, 1.9, 2.6, 3.3, 4.0, 4.7, 5.4], truth = (x) => 0.35 * (x - 3) ** 2 + 1, nz = [0.35, -0.3, 0.25, -0.2, 0.3, -0.35, 0.2, -0.25];
    const pts = xs.map((x, i) => [x, truth(x) + nz[i]]);
    const over = (x) => { let i = xs.findIndex((v) => v > x); if (i <= 0) i = i === 0 ? 1 : xs.length - 1; const s = (x - xs[i - 1]) / (xs[i] - xs[i - 1]); return pts[i - 1][1] * (1 - s) + pts[i][1] * s + 0.9 * Math.sin(Math.PI * s) * (i % 2 ? 1 : -1); };
    const fns = [(x) => 0.18 * x + 1.4, truth, over], labs = [["degree 1 — underfit (high bias)", C3], ["degree 2 — good fit", GOOD], ["high degree — overfit (high variance)", BAD]];
    const per = 2.6, k = Math.floor(t / per) % 3, s = ease(((t % per) / per) * 2.5), prev = fns[(k + 2) % 3];
    const sx = (x) => 25 + x * 50, sy = (y) => 160 - y * 26;
    let g = frame(25, 20, 305, 160) + P(fnPath((x) => lerp(prev(x), fns[k](x), s), 0.3, 5.6, sx, sy, 120), C1, 2.5);
    pts.forEach((p) => (g += Cc(sx(p[0]), sy(p[1]), 4.5, C2)));
    return g + T(10, 15, labs[k][0], { bold: true, fill: labs[k][1] }) + T(315, 174, "overfit: tiny train error, wild between points", { anchor: "end", size: 9, fill: MUT });
  },

  tree(t) {
    const sx = (u) => 30 + u * 17, sy = (v) => 170 - v * 15;
    const k = Math.min(3, Math.floor((t % 8.5) / 1.8));
    let g = "";
    const region = (u0, u1, v0, v1) => { const set = TREE.pts.filter((p) => p[0] >= u0 && p[0] < u1 && p[1] >= v0 && p[1] < v1); const b = set.filter((p) => !p[2]).length; return set.length ? (b >= set.length - b ? C1 : C2) : RUL; };
    const regs = k === 0 ? [[0, 10, 0, 10]] : k === 1 ? [[0, 5, 0, 10], [5, 10, 0, 10]] : k === 2 ? [[0, 5, 0, 10], [5, 10, 0, 3], [5, 10, 3, 10]] : [[0, 5, 0, 7], [0, 5, 7, 10], [5, 10, 0, 3], [5, 10, 3, 10]];
    regs.forEach(([a, b, c, d]) => (g += R(sx(a), sy(d), sx(b) - sx(a), sy(c) - sy(d), region(a, b, c, d), { op: 0.15 })));
    if (k >= 1) g += L(sx(5), sy(0), sx(5), sy(10), INK, 2);
    if (k >= 2) g += L(sx(5), sy(3), sx(10), sy(3), INK, 2);
    if (k >= 3) g += L(sx(0), sy(7), sx(5), sy(7), INK, 2);
    TREE.pts.forEach((p) => (g += p[2] ? Cc(sx(p[0]), sy(p[1]), 3.5, C2) : `<path d="M${sx(p[0]) - 4},${sy(p[1])}h8M${sx(p[0])},${sy(p[1]) - 4}v8" stroke="${C1}" stroke-width="2"/>`));
    const wg = regs.reduce((a, [u0, u1, v0, v1]) => { const set = TREE.pts.filter((p) => p[0] >= u0 && p[0] < u1 && p[1] >= v0 && p[1] < v1); return a + (set.length / TREE.pts.length) * TREE.gini(set); }, 0);
    const rules = ["root: all data", "split 1: x₁ ≤ 5 ?", "split 2: x₂ ≤ 3 ?", "split 3: x₂ ≤ 7 ?"];
    return g + T(212, 30, `depth ${k}`, { bold: true, size: 12 }) + T(212, 46, rules[k], { size: 9.5 }) + T(212, 66, `weighted Gini = ${f2(wg)}`, { bold: true, fill: wg < 0.05 ? GOOD : INK }) +
      T(212, 84, "Gini = 1 − Σ pₖ²", { size: 9, fill: MUT }) + T(212, 98, "pick the split that", { size: 9, fill: MUT }) + T(212, 110, "lowers impurity most", { size: 9, fill: MUT }) +
      T(212, 132, "deeper → purer leaves", { size: 9, fill: BAD }) + T(212, 144, "but overfits (prune!)", { size: 9, fill: BAD });
  },

  bagging(t) {
    const cols = [C1, C2, C3, C4, "#e64980", "#15aabf", "#fab005", "#868e96"];
    const step = Math.floor(t * 4) % 40;
    let g = T(8, 16, "Original data (8 rows)", { bold: true, size: 9.5 });
    for (let i = 0; i < 8; i++) g += R(20 + i * 22, 22, 18, 18, cols[i], { rx: 3 }) + T(29 + i * 22, 35, i + 1, { anchor: "middle", size: 9, fill: "#fff", bold: true });
    BAG.forEach((row, r) => {
      const y = 62 + r * 30;
      g += T(8, y + 13, `B${r + 1}`, { bold: true, size: 9.5 });
      row.forEach((v, i) => { if (r * 8 + i < step) g += R(30 + i * 22, y, 18, 18, cols[v], { rx: 3 }) + T(39 + i * 22, y + 13, v + 1, { anchor: "middle", size: 9, fill: "#fff", bold: true }); });
      if (step >= r * 8 + 8) { const oob = [...Array(8).keys()].filter((i) => !row.includes(i)).map((i) => i + 1); g += T(212, y + 13, `OOB: ${oob.join(", ") || "–"}`, { size: 9.5, fill: MUT }); }
    });
    if (step >= 26) g += T(160, 168, "train one tree per sample → average / majority vote ↓ variance", { anchor: "middle", bold: true, size: 9.5, fill: GOOD });
    return g + T(312, 16, "sample WITH replacement", { anchor: "end", size: 9, fill: MUT });
  },

  boosting(t) {
    const B = BOOST, sx = (x) => 22 + x * 28, sy = (y) => 95 - y * 30;
    const m = Math.floor(t / 1.1) % (B.rounds.length + 2), mm = Math.min(m, B.rounds.length - 1), F = B.rounds[mm];
    let g = L(20, sy(0), 305, sy(0), RUL, 1);
    B.xs.forEach((x, i) => (g += L(sx(x), sy(B.ys[i]), sx(x), sy(F[i]), BAD, 1.2, "2 2")));
    const step = []; B.xs.forEach((x, i) => { step.push([sx(x - 0.25), sy(F[i])], [sx(x + 0.25), sy(F[i])]); });
    g += P(step, C1, 2.5);
    B.xs.forEach((x, i) => (g += Cc(sx(x), sy(B.ys[i]), 3.5, C2)));
    const mse = B.ys.reduce((a, y, i) => a + (y - F[i]) ** 2, 0) / B.ys.length;
    return g + T(8, 16, `round ${mm}: fit a small tree to the residuals (red), add η × it`, { bold: true, size: 9.5 }) +
      T(8, 172, `training MSE = ${f2(mse)}`, { bold: true, fill: mse < 0.1 ? GOOD : INK }) + T(8, 30, "sequential: each learner fixes the last one's errors", { size: 9, fill: MUT });
  },

  confusion(t) {
    const TP = 40, FP = 10, FN = 20, TN = 130, k = Math.floor(t / 2.4) % 4;
    const hi = [["TP", "TN"], ["TP", "FP"], ["TP", "FN"], ["TP", "FP", "FN"]][k];
    const cells = { TP: [60, 50, TP], FN: [140, 50, FN], FP: [60, 100, FP], TN: [140, 100, TN] };
    let g = T(100, 26, "Predicted +", { anchor: "middle", size: 9, fill: MUT }) + T(180, 26, "Predicted −", { anchor: "middle", size: 9, fill: MUT }) + T(52, 79, "Actual +", { anchor: "end", size: 9, fill: MUT }) + T(52, 129, "Actual −", { anchor: "end", size: 9, fill: MUT });
    Object.entries(cells).forEach(([n, [x, y, v]]) => { const on = hi.includes(n); g += R(x, y, 76, 46, on ? (n === "TP" || n === "TN" ? GOOD : BAD) : "var(--surface-2)", { rx: 6, op: on ? 0.9 : 1 }) + T(x + 38, y + 20, n, { anchor: "middle", size: 9, fill: on ? "#fff" : MUT, bold: true }) + T(x + 38, y + 37, v, { anchor: "middle", size: 13, fill: on ? "#fff" : INK, bold: true }); });
    const P_ = TP / (TP + FP), R_ = TP / (TP + FN);
    const lines = [["Accuracy", "(TP+TN) / all", `${TP + TN}/200 = ${f2((TP + TN) / 200)}`], ["Precision", "TP / (TP+FP)", `40/50 = ${f2(P_)}`], ["Recall", "TP / (TP+FN)", `40/60 = ${f2(R_)}`], ["F1", "2PR / (P+R)", `= ${f2((2 * P_ * R_) / (P_ + R_))}`]][k];
    const hint = [["misleading when", "classes are imbalanced"], ["of predicted +,", "how many are real?"], ["of real +,", "how many did we catch?"], ["harmonic mean", "of P and R"]][k];
    return g + T(228, 60, lines[0], { bold: true, size: 13 }) + T(228, 78, lines[1], { size: 10 }) + T(228, 96, lines[2], { bold: true, size: 11, fill: C1 }) + T(228, 116, hint[0], { size: 8.5, fill: MUT }) + T(228, 127, hint[1], { size: 8.5, fill: MUT }) +
      T(160, 168, "FP = false alarm (Type I) · FN = missed case (Type II)", { anchor: "middle", size: 9, fill: MUT });
  },

  roc(t) {
    const th = lerp(-3, 3, wave(t, 8)), tpr = 1 - Phi(th - 1), fpr = 1 - Phi(th + 1);
    const sx = (x) => 10 + ((x + 4) / 8) * 150, sy = (y) => 140 - y * 260, pdf = (x, m) => Math.exp(-((x - m) ** 2) / 2) / 2.5066;
    let g = P(fnPath((x) => pdf(x, -1), -4, 4, sx, sy), C2, 2) + P(fnPath((x) => pdf(x, 1), -4, 4, sx, sy), C1, 2);
    const shade = (m, col) => P([[sx(th), sy(0)], ...fnPath((x) => pdf(x, m), th, 4, sx, sy, 30), [sx(4), sy(0)]], "none", 0, { fill: col, op: 0.3, close: true });
    g += shade(-1, C2) + shade(1, C1) + L(sx(th), 30, sx(th), 140, INK, 1.5) + L(10, 140, 160, 140, MUT, 1) + T(sx(th), 26, "threshold", { anchor: "middle", size: 9 });
    g += T(40, 156, "negatives", { fill: C2, size: 9 }) + T(105, 156, "positives", { fill: C1, size: 9 });
    const rx = (x) => 190 + x * 120, ry = (y) => 150 - y * 120;
    g += frame(190, 30, 310, 150) + L(rx(0), ry(0), rx(1), ry(1), MUT, 1, "4 3");
    g += P(fnPath((s) => 1 - Phi(s - 1), 4, -4, (s) => rx(1 - Phi(s + 1)), ry, 80), C1, 2.5);
    g += Cc(rx(fpr), ry(tpr), 6, "var(--warn)");
    return g + T(312, 14, `TPR ${f2(tpr)} · FPR ${f2(fpr)}`, { bold: true, size: 9.5, anchor: "end", fill: "var(--warn)" }) + T(250, 163, "FPR →", { anchor: "middle", size: 9, fill: MUT }) + T(178, 90, "TPR", { anchor: "middle", size: 9, fill: MUT }) +
      T(8, 14, "Slide the threshold →", { bold: true, size: 9.5 }) + T(250, 176, "AUC 0.5 = random, 1 = perfect", { anchor: "middle", size: 8.5, fill: MUT });
  },

  drift(t) {
    const ph = cyc(t, 10);
    if (ph < 0.5) {
      const s = ease(ph * 2.4), mu = 1.8 * s, sx = (x) => 30 + ((x + 3.5) / 7.5) * 270, sy = (y) => 150 - y * 260;
      const pdf = (x, m) => Math.exp(-((x - m) ** 2) / 2) / 2.5066;
      return frame(30, 30, 300, 150) + P(fnPath((x) => pdf(x, 0), -3.5, 4, sx, sy), MUT, 2, { dash: "5 4" }) + P(fnPath((x) => pdf(x, mu), -3.5, 4, sx, sy), C2, 2.5) +
        T(10, 16, "DATA drift (covariate shift): P(X) changes", { bold: true }) + T(sx(0), 30, "training", { anchor: "middle", fill: MUT, size: 9 }) + T(sx(mu), 44, "live", { anchor: "middle", fill: C2, size: 9, bold: true }) +
        T(165, 172, `detect with PSI / KS-test on inputs · shift = ${f1(mu)}σ`, { anchor: "middle", size: 9, fill: MUT });
    }
    const s = ease((ph - 0.5) * 2.4), ang = lerp(0, 0.9, s), r = rng(4);
    let g = "";
    const cx = 160, cy = 95, dx = Math.cos(ang + Math.PI / 4), dy = Math.sin(ang + Math.PI / 4);
    for (let i = 0; i < 26; i++) { const x = 40 + r() * 240, y = 30 + r() * 130, lab = (x - cx) * dy - (y - cy) * dx > 0; g += lab ? Cc(x, y, 4, C1) : Cc(x, y, 4, C2); }
    g += L(cx - dx * 150, cy - dy * 150, cx + dx * 150, cy + dy * 150, INK, 2);
    return g + T(10, 16, "CONCEPT drift: P(y | X) changes", { bold: true }) + T(10, 29, "same inputs, the right answer moves (e.g. fraud tactics change)", { size: 9, fill: MUT }) +
      T(160, 174, "detect via falling accuracy once labels arrive → retrain", { anchor: "middle", size: 9, fill: MUT });
  },

  retrain(t) {
    const day = lerp(0, 28, cyc(t, 9)), sx = (d) => 30 + d * 9.6, sy = (e) => 150 - e * 100;
    const cal = (d) => (d < 10 ? 0.15 : d < 14 ? 0.75 : 0.17), trig = (d) => (d < 10 ? 0.15 : d < 11.5 ? 0.75 : 0.16);
    let g = frame(30, 30, 300, 150);
    [7, 14, 21, 28].forEach((d) => (g += L(sx(d), 150, sx(d), 34, MUT, 1, "2 3") + T(sx(d), 162, `retrain`, { anchor: "middle", size: 8, fill: MUT })));
    g += R(sx(10), 30, sx(14) - sx(10), 120, BAD, { op: 0.08 }) + T(sx(10) + 2, 42, "sudden drift (day 10)", { size: 8.5, fill: BAD });
    const pts = (fn) => { const a = []; for (let d = 0; d <= day; d += 0.25) a.push([sx(d), sy(fn(d))]); return a; };
    g += P(pts(cal), C2, 2.5) + P(pts(trig), C1, 2.5, { dash: "6 3" });
    if (day > 11.5) g += `<path d="M${sx(11.5)},${sy(0.8)}l3,6l6,.5l-4.5,4l1.5,6l-6,-3.2l-6,3.2l1.5,-6l-4.5,-4l6,-.5z" fill="var(--warn)"/>` + T(sx(11.5) + 9, sy(0.86), "monitor alert → retrain", { size: 8.5, fill: C1, bold: true });
    g += L(sx(day), 30, sx(day), 150, INK, 1);
    return g + T(8, 14, `day ${Math.floor(day)}`, { bold: true, size: 11 }) + T(80, 14, "— calendar (every Sunday)", { fill: C2, size: 9, bold: true }) + T(205, 14, "- - drift-triggered", { fill: C1, size: 9, bold: true }) +
      T(10, 92, "error", { size: 9, fill: MUT }) + T(165, 176, "calendar: retrains when nothing changed, reacts late to sudden drift", { anchor: "middle", size: 8.5, fill: MUT });
  },

  pipeline(t) {
    const boxes = [["Data", 40, 50], ["Validate", 120, 50], ["Train", 200, 50], ["Evaluate", 280, 50], ["Quality gate", 280, 120], ["Deploy", 200, 120], ["Monitor", 120, 120], ["Drift?", 40, 120]];
    const k = Math.floor(t / 0.8) % boxes.length, s = ease((t % 0.8) / 0.8);
    let g = "";
    boxes.forEach(([n, x, y], i) => { const on = i === k; g += R(x - 34, y - 15, 68, 30, on ? C1 : "var(--surface-2)", { rx: 7, stroke: on ? C1 : RUL }) + T(x, y + 4, n, { anchor: "middle", size: 9.5, bold: true, fill: on ? "#fff" : INK }); });
    for (let i = 0; i < boxes.length; i++) { const a = boxes[i], b = boxes[(i + 1) % boxes.length]; g += L(a[1] + (b[1] - a[1]) * 0.45, a[2] + (b[2] - a[2]) * 0.45, a[1] + (b[1] - a[1]) * 0.55, a[2] + (b[2] - a[2]) * 0.55, MUT, 2); }
    const a = boxes[k], b = boxes[(k + 1) % boxes.length];
    g += Cc(lerp(a[1], b[1], s), lerp(a[2], b[2], s), 5, "var(--warn)");
    const notes = ["versioned dataset (DVC)", "schema / range checks", "tracked run: params, code, data (MLflow)", "hold-out metrics vs baseline", "new model must beat current one", "CI/CD, canary / shadow rollout", "latency, input stats, accuracy", "PSI / accuracy drop → retrain"];
    return g + T(160, 16, "Production ML loop (MLOps)", { anchor: "middle", bold: true }) + T(160, 170, notes[k], { anchor: "middle", size: 9.5, fill: C1, bold: true });
  },

  cv(t) {
    const k = Math.floor(t / 1.3) % 6, scores = [0.82, 0.79, 0.85, 0.8, 0.84];
    let g = T(8, 16, "5-fold cross-validation (on the TRAINING data only)", { bold: true, size: 9.5 });
    for (let r = 0; r < 5; r++) {
      const y = 30 + r * 22, on = r <= Math.min(k, 4);
      for (let i = 0; i < 5; i++) g += R(20 + i * 42, y, 38, 16, !on ? "var(--surface-2)" : i === r ? C2 : C1, { rx: 3, op: on ? 0.85 : 1 });
      if (on) g += T(238, y + 12, `fold ${r + 1}: ${scores[r]}`, { size: 9.5 });
    }
    g += R(20, 148, 206, 14, RUL, { rx: 3 }) + T(123, 159, "final TEST set: touch once at the very end", { anchor: "middle", size: 8.5, bold: true });
    if (k >= 4) g += T(238, 148, `mean = ${f2(scores.reduce((a, b) => a + b) / 5)}`, { bold: true, fill: GOOD });
    return g + T(312, 176, "orange = validation fold, blue = train folds", { anchor: "end", size: 8.5, fill: MUT });
  },

  leakage(t) {
    const s = cyc(t, 4);
    let g = T(8, 16, "✗ LEAKY: fit scaler / select features on ALL data, then split", { bold: true, size: 9.5, fill: BAD });
    g += R(20, 26, 180, 22, C1, { rx: 4, op: 0.8 }) + R(200, 26, 60, 22, C2, { rx: 4, op: 0.8 }) + T(110, 41, "train", { anchor: "middle", fill: "#fff", bold: true, size: 9 }) + T(230, 41, "test", { anchor: "middle", fill: "#fff", bold: true, size: 9 });
    g += R(80, 62, 120, 20, "var(--surface-2)", { rx: 4, stroke: BAD }) + T(140, 76, "scaler.fit(ALL)", { anchor: "middle", size: 9 });
    g += L(230, 48, lerp(230, 200, s), lerp(48, 62, s), BAD, 2) + T(206, 76, "test info leaks in!", { size: 9, fill: BAD, bold: true });
    g += T(8, 106, "✓ CORRECT: split first, fit on train, transform test", { bold: true, size: 9.5, fill: GOOD });
    g += R(20, 116, 180, 22, C1, { rx: 4, op: 0.8 }) + R(200, 116, 60, 22, C2, { rx: 4, op: 0.8 }) + T(110, 131, "train", { anchor: "middle", fill: "#fff", bold: true, size: 9 }) + T(230, 131, "test", { anchor: "middle", fill: "#fff", bold: true, size: 9 });
    g += R(60, 148, 110, 18, "var(--surface-2)", { rx: 4, stroke: GOOD }) + T(115, 161, "fit(train) only", { anchor: "middle", size: 9 }) + L(110, 138, 110, 148, GOOD, 2) + L(lerp(170, 230, s), 157, 230, 157, GOOD, 1.5, "3 3") + T(236, 160, "transform(test)", { size: 9, fill: GOOD });
    return g;
  },

  distance(t) {
    const sx = (u) => 20 + u * 34, sy = (v) => 160 - v * 26, A = [0.5, 0.5], B = [4.5, 3.5];
    const s = ease(cyc(t, 5) * 1.6);
    let g = "";
    for (let i = 0; i <= 5; i++) g += L(sx(i), sy(0), sx(i), sy(5), RUL, 1) + L(sx(0), sy(i), sx(5), sy(i), RUL, 1);
    const corner = [B[0], A[1]], seg1 = Math.min(1, s * 2), seg2 = clamp(s * 2 - 1, 0, 1);
    g += L(sx(A[0]), sy(A[1]), sx(lerp(A[0], corner[0], seg1)), sy(A[1]), C2, 3) + (seg2 > 0 ? L(sx(corner[0]), sy(corner[1]), sx(corner[0]), sy(lerp(corner[1], B[1], seg2)), C2, 3) : "");
    g += L(sx(A[0]), sy(A[1]), sx(lerp(A[0], B[0], s)), sy(lerp(A[1], B[1], s)), C1, 3);
    g += Cc(sx(A[0]), sy(A[1]), 5, INK) + Cc(sx(B[0]), sy(B[1]), 5, INK) + T(sx(A[0]) - 8, sy(A[1]) + 14, "A", { bold: true }) + T(sx(B[0]) + 6, sy(B[1]) - 6, "B", { bold: true });
    return g + T(8, 16, "Δx = 4, Δy = 3", { bold: true }) + T(212, 60, "Euclidean (L2)", { fill: C1, bold: true, size: 9.5 }) + T(212, 73, "√(4² + 3²) = 5", { size: 9.5 }) +
      T(212, 100, "Manhattan (L1)", { fill: C2, bold: true, size: 9.5 }) + T(212, 113, "|4| + |3| = 7", { size: 9.5 }) + T(212, 140, "Cosine: angle only,", { size: 9, fill: MUT }) + T(212, 152, "ignores length (text)", { size: 9, fill: MUT });
  },

  scaling(t) {
    const s = ease(wave(t, 8) * 1.3), b = lerp(15, 1, s), cx = 150, cy = 95, su = 110, sv = 110;
    let g = "";
    [0.15, 0.4, 0.8, 1.3].forEach((c) => (g += `<ellipse cx="${cx}" cy="${cy}" rx="${Math.sqrt(c) * su}" ry="${Math.sqrt(c / b) * sv}" fill="none" stroke="${RUL}" stroke-width="1.3"/>`));
    let u = -1.15, v = 0.28 * (b > 2 ? 1 : 2.4); const pts = [[cx + u * su, cy - v * sv]];
    for (let i = 0; i < 22; i++) { u *= 1 - 2 * 0.06; v *= 1 - 2 * 0.06 * b; pts.push([cx + u * su, cy - v * sv]); }
    g += P(pts, C2, 2) + pts.map((p) => Cc(p[0], p[1], 2.4, C2)).join("") + Cc(cx, cy, 4, GOOD);
    return g + T(8, 16, s < 0.5 ? "Unscaled features: stretched bowl → zig-zag, slow" : "Standardised features: round bowl → straight to the minimum", { bold: true, size: 9.5, fill: s < 0.5 ? BAD : GOOD }) +
      T(8, 174, "z = (x − μ) / σ  or  min-max to [0, 1]. Fit on TRAIN only.", { size: 9, fill: MUT }) + T(312, 30, "also: distances in KNN / SVM", { anchor: "end", size: 9, fill: MUT }) + T(312, 42, "dominated by big-range features", { anchor: "end", size: 9, fill: MUT });
  },

  odds(t) {
    const p = lerp(0.05, 0.95, wave(t, 8)), o = p / (1 - p), lo = Math.log(o);
    const line = (y, lab, x0, x1, v, txt, col) => L(40, y, 290, y, RUL, 3) + T(10, y + 4, lab, { size: 9.5, bold: true }) + T(40, y + 16, x0, { size: 8.5, fill: MUT }) + T(290, y + 16, x1, { size: 8.5, fill: MUT, anchor: "end" }) + Cc(40 + clamp(v, 0, 1) * 250, y, 6.5, col) + T(40 + clamp(v, 0, 1) * 250, y - 10, txt, { anchor: "middle", bold: true, size: 10, fill: col });
    return T(8, 16, "probability → odds → log-odds (what the linear part predicts)", { bold: true, size: 9.5 }) +
      line(50, "p", "0", "1", p, f2(p), C1) + line(95, "odds", "0", "19", o / 19, f2(o), C2) + line(140, "logit", "−3", "+3", (lo + 3) / 6, f2(lo), C3) +
      T(160, 172, "odds = p/(1−p);  log-odds = w·x + b;  one unit of xⱼ multiplies odds by e^wⱼ", { anchor: "middle", size: 8.5, fill: MUT });
  },

  xent(t) {
    const p = lerp(0.03, 0.97, wave(t, 7)), sx = (q) => 40 + q * 250, sy = (l) => 150 - (l / 3.6) * 120;
    let g = frame(40, 25, 290, 150) + P(fnPath((q) => -Math.log(q), 0.028, 1, sx, sy), C1, 2.5) + P(fnPath((q) => -Math.log(1 - q), 0, 0.972, sx, sy), C2, 2.5);
    g += L(sx(p), 25, sx(p), 150, MUT, 1, "2 2") + Cc(sx(p), sy(-Math.log(p)), 5.5, C1) + Cc(sx(p), sy(-Math.log(1 - p)), 5.5, C2);
    return g + T(8, 16, `predicted p = ${f2(p)}`, { bold: true }) + T(150, 16, `if y=1: loss ${f2(-Math.log(p))}`, { fill: C1, bold: true, size: 9.5 }) + T(240, 16, `if y=0: ${f2(-Math.log(1 - p))}`, { fill: C2, bold: true, size: 9.5 }) +
      T(290, 166, "p →", { anchor: "end", size: 9, fill: MUT }) + T(165, 176, "L = −[y log p + (1−y) log(1−p)]: confident & wrong = huge loss", { anchor: "middle", size: 8.5, fill: MUT });
  },

  l1l2(t) {
    const s = ease(cyc(t, 6) * 1.5), cpt = [0.6, 2.2], sc = 30;
    const panel = (ox, isL1) => {
      const m = (u, v) => [ox + u * sc, 130 - v * sc];
      let g = L(ox - 55, 130, ox + 55, 130, RUL, 1) + L(ox, 30, ox, 165, RUL, 1);
      g += isL1 ? P([m(1, 0), m(0, 1), m(-1, 0), m(0, -1)], C1, 2, { close: true, fill: "var(--accent-soft)" }) : Cc(ox, 130, sc, "var(--accent-soft)", C1, 2);
      const touch = isL1 ? 1.342 : 1.28, r = touch * s, c = m(cpt[0], cpt[1]);
      [0.35, 0.7].forEach((f) => (g += Cc(c[0], c[1], r * f * sc, null, C2, 1, 0.5)));
      g += Cc(c[0], c[1], r * sc, null, C2, 2) + Cc(c[0], c[1], 3, C2);
      if (s > 0.98) { const tp = isL1 ? m(0, 1) : m(0.263, 0.965); g += Cc(tp[0], tp[1], 5.5, "var(--warn)"); }
      return g;
    };
    return panel(80, true) + panel(240, false) + T(80, 14, "L1 (lasso): diamond", { anchor: "middle", bold: true }) + T(240, 14, "L2 (ridge): circle", { anchor: "middle", bold: true }) +
      (s > 0.98 ? T(80, 176, "hits a corner → w₁ = 0 (sparse)", { anchor: "middle", size: 9, fill: GOOD, bold: true }) + T(240, 176, "touches smoothly → small, non-zero", { anchor: "middle", size: 9, fill: C1, bold: true }) : T(160, 176, "loss contours grow until they touch the constraint", { anchor: "middle", size: 9, fill: MUT }));
  },

  shap(t) {
    const feats = [["base E[f(x)]", 0.3, 0], ["late payments = 3", 0.25, 1], ["income = low", 0.2, 1], ["debt ratio = 0.2", -0.12, 1], ["age = 45", 0.05, 1]];
    const sx = (v) => 130 + v * 220, k = Math.floor(t / 0.9) % (feats.length + 3);
    let g = L(sx(0), 22, sx(0), 150, RUL, 1) + L(sx(0.5), 22, sx(0.5), 150, RUL, 1, "2 3") + T(sx(0.5), 162, "0.5", { anchor: "middle", size: 8.5, fill: MUT }) + T(sx(0), 162, "0", { anchor: "middle", size: 8.5, fill: MUT });
    let cur = 0;
    feats.forEach(([n, v, isF], i) => {
      const y = 26 + i * 22, start = isF ? cur : 0, end = isF ? cur + v : v;
      if (i <= k) {
        g += T(124, y + 12, n, { anchor: "end", size: 9 });
        g += R(sx(Math.min(start, end)), y, Math.abs(sx(end) - sx(start)), 16, !isF ? MUT : v > 0 ? BAD : C1, { rx: 3, op: 0.85 });
        g += T(sx(Math.max(start, end)) + 4, y + 12, isF ? (v > 0 ? "+" : "") + f2(v) : f2(v), { size: 9, bold: true });
      }
      cur = end;
    });
    if (k >= feats.length) g += T(124, 150, "f(x) = 0.68", { anchor: "end", size: 10, bold: true, fill: BAD }) + L(sx(0.68), 22, sx(0.68), 145, BAD, 2);
    return g + T(8, 176, "SHAP values add up exactly: base + Σ φⱼ = prediction (red ↑ risk, blue ↓)", { size: 8.5, fill: MUT });
  },

  lime(t) {
    const sx = (u) => 20 + u * 28, sy = (v) => 170 - v * 15.5, n = Math.floor(cyc(t, 7) * 60), inst = [7, 6.2];
    const inside = (u, v) => (u - 5) ** 2 + (v - 5) ** 2 < 9;
    let g = Cc(sx(5), sy(5), 3 * 28, "var(--accent-soft)", C1, 1.5) + T(sx(5), sy(5), "black box says ●", { anchor: "middle", size: 9, fill: C1 });
    LIME.slice(0, Math.min(n, 40)).forEach(([u, v]) => { const w = Math.exp(-((u - inst[0]) ** 2 + (v - inst[1]) ** 2) / 2); g += Cc(sx(u), sy(v), 1.5 + 4 * w, inside(u, v) ? C1 : C2, null, 0, 0.75); });
    if (n > 44) { const nx = (inst[0] - 5) / Math.hypot(inst[0] - 5, inst[1] - 5), ny = (inst[1] - 5) / Math.hypot(inst[0] - 5, inst[1] - 5), px = 5 + nx * 3, py = 5 + ny * 3; g += L(sx(px - ny * 2.5), sy(py + nx * 2.5), sx(px + ny * 2.5), sy(py - nx * 2.5), GOOD, 3); }
    g += `<path d="M${sx(inst[0])},${sy(inst[1]) - 9}l2.6,6l6.4,.5l-4.9,4.2l1.6,6.3l-5.7,-3.4l-5.7,3.4l1.6,-6.3l-4.9,-4.2l6.4,-.5z" fill="var(--warn)"/>`;
    const msg = n <= 40 ? "1. perturb samples around the instance ★, ask the black box" : n <= 44 ? "2. weight samples by closeness (bigger = closer)" : "3. fit a simple linear model locally → explanation";
    return g + T(8, 16, msg, { bold: true, size: 9.5 }) + T(312, 176, "faithful locally, not globally", { anchor: "end", size: 9, fill: MUT });
  },

  bayes(t) {
    const k = Math.floor(t / 2.2) % 4;
    let g = "";
    for (let i = 0; i < 200; i++) {
      const x = 16 + (i % 20) * 9, y = 36 + Math.floor(i / 20) * 11;
      const sick = i < 2, fp = i >= 2 && i < 12;
      let fill = RUL;
      if (k >= 1 && sick) fill = BAD;
      if (k >= 2 && fp) fill = C2;
      if (k >= 3 && !(sick || fp)) fill = "var(--surface-2)";
      g += Cc(x, y, 3.6, fill);
    }
    const txt = [["1000 people", "each dot = 5 people"], ["prior: 1% sick = 10", "test catches 90% → 9"], ["990 healthy, 5% false +", "≈ 49.5 false alarms"], ["P(sick | +) = 9 / 58.5", "≈ 15% only!"]][k];
    return g + T(8, 18, "Bayes: P(A|B) = P(B|A) P(A) / P(B)", { bold: true }) +
      T(200, 70, `step ${k + 1}`, { size: 9, fill: MUT }) + T(200, 86, txt[0], { size: 9.5, bold: true }) + T(200, 101, txt[1], { size: 9.5, fill: k === 3 ? BAD : MUT, bold: k === 3 }) +
      R(8, 147, 8, 8, BAD) + T(20, 155, "sick", { size: 9, fill: MUT }) + R(50, 147, 8, 8, C2) + T(62, 155, "healthy but tested +", { size: 9, fill: MUT }) +
      T(8, 172, "posterior ∝ likelihood × prior: a rare prior keeps it low", { size: 9, fill: MUT });
  },

  laplace(t) {
    const words = ["free", "win", "meeting", "prize"], cnt = [5, 3, 0, 2], s = ease((cyc(t, 6) - 0.45) / 0.25);
    let g = "";
    words.forEach((w, i) => {
      const p0 = cnt[i] / 10, p1 = (cnt[i] + 1) / 14, p = lerp(p0, p1, s), x = 40 + i * 66, h = p * 170;
      g += R(x, 140 - h, 40, h, i === 2 ? (p === 0 ? BAD : GOOD) : C1, { rx: 3 }) + T(x + 20, 154, w, { anchor: "middle", size: 9.5 }) + T(x + 20, 136 - h, f2(p), { anchor: "middle", size: 9.5, bold: true });
    });
    g += L(30, 140, 300, 140, MUT, 1);
    return g + T(8, 16, s < 0.5 ? "P(word | spam) = count / total  → 'meeting' gets 0" : "Laplace: (count + 1) / (total + |V|)", { bold: true, size: 10, fill: s < 0.5 ? BAD : GOOD }) +
      T(8, 30, s < 0.5 ? "one zero factor makes the whole product 0!" : "no zeros, ranking preserved", { size: 9, fill: MUT }) + T(160, 172, "|V| = vocabulary size = 4 here", { anchor: "middle", size: 9, fill: MUT });
  },
};

// ---------------------------------------------------------------- theory cards
const THEORY = {
  // ML foundations
  "ml-taxonomy": { title: "What ML is & its types", anim: "fit", points: ["<b>Supervised</b>: labelled (x, y) → regression (number) or classification (class).", "<b>Unsupervised</b>: no labels → clustering, dimensionality reduction.", "<b>Reinforcement</b>: agent learns from rewards.", "Mitchell: a program learns from experience E on task T if performance P improves with E."], trap: "Predicting a <i>number</i> is regression even if it's called a “score”; predicting a category is classification." },
  "linreg": { title: "Linear regression", anim: "gd", points: ["Model: ŷ = w₀ + w₁x₁ + … + wₙxₙ = wᵀx.", "Fit by minimising squared error (OLS). OLS = MLE when errors are i.i.d. Gaussian.", "Each wⱼ = change in ŷ per unit of xⱼ, others held fixed.", "Assumes linearity, independent errors, constant variance."], formula: "J(w) = (1/2m) Σ (ŷᵢ − yᵢ)²" },
  "cost": { title: "Cost (loss) function", anim: "gd", points: ["Measures how wrong the model is on the training data.", "Regression → MSE (penalises big errors more) or MAE (robust to outliers).", "Classification → cross-entropy (log loss).", "Training = finding parameters that minimise the cost."], formula: "MSE = (1/m) Σ (ŷᵢ − yᵢ)²", trap: "MSE is convex for linear regression → one global minimum." },
  "gd": { title: "Gradient descent", anim: "gd", points: ["Start somewhere, step <b>against</b> the gradient (downhill).", "Step size = learning rate α × slope; steps shrink near the minimum.", "Stop when the cost stops decreasing (convergence).", "Works for any differentiable loss; no matrix inversion."], formula: "w := w − α · ∂J/∂w" },
  "gd-variants": { title: "Batch vs mini-batch vs stochastic GD", anim: "gd", points: ["<b>Batch</b>: whole dataset per step → smooth but slow on big data.", "<b>Stochastic (SGD)</b>: 1 example per step → fast, noisy, can escape shallow minima.", "<b>Mini-batch</b>: 32–512 examples → best of both, uses GPU vectorisation.", "Epoch = one full pass over the data."], trap: "Noisy SGD loss curve going up and down is normal; judge the trend." },
  "lr": { title: "Learning rate & convergence", anim: "lr", points: ["α too small → very slow convergence.", "α too large → overshoots, cost oscillates or <b>increases</b> (diverges).", "Diagnose with a plot of cost vs iterations: it should fall every iteration (batch GD).", "Fix divergence by lowering α; feature scaling also helps."], trap: "Cost increasing over iterations ⇒ α is too large (not “need more iterations”)." },
  "feature-scaling": { title: "Feature scaling", anim: "scaling", points: ["Standardise z = (x − μ)/σ, or min-max to [0, 1].", "Gradient descent converges much faster on round contours.", "<b>Distance-based</b> models (KNN, SVM, K-means) need it, otherwise large-range features dominate.", "Tree models (RF, XGBoost) do <b>not</b> need scaling (splits are thresholds)."], trap: "Fit the scaler on the TRAINING set only, then transform test — else data leakage." },
  "poly": { title: "Feature engineering & polynomial regression", anim: "fit", points: ["Add x², x³, x₁x₂ … so a linear model fits curves.", "Still “linear regression” — linear in the weights.", "Higher degree → more flexible → overfitting risk.", "Scale features: x³ has a huge range."], trap: "Higher-degree polynomial always lowers TRAINING error, not test error." },
  "normal-eq": { title: "Vectorisation & normal equation", anim: "gd", points: ["Closed form: w = (XᵀX)⁻¹Xᵀy, no α, no iterations.", "Cost ≈ O(n³) in number of features → slow for large n; GD scales better.", "XᵀX not invertible if features are redundant/collinear or n > m → drop features or regularise (ridge).", "Vectorised code (matrix ops) is far faster than loops."], formula: "w = (XᵀX)⁻¹ Xᵀ y" },
  "bias-variance": { title: "Bias–variance trade-off", anim: "biasvar", points: ["<b>Bias</b>: error from too-simple assumptions → underfit (train & test error both high).", "<b>Variance</b>: sensitivity to the training sample → overfit (train low, test high).", "Total error = bias² + variance + irreducible noise.", "More data reduces variance, not bias."], trap: "Big gap train ≪ test = high variance. Both high and close = high bias." },
  "overfitting": { title: "Overfitting & underfitting", anim: "fit", points: ["Overfit: memorises noise, low train error, high test error.", "Fix overfit: more data, regularisation, simpler model, fewer features, early stopping, pruning, dropout.", "Underfit: too simple; fix with more features / more complex model / less regularisation.", "Always judge on validation/test data."], trap: "Adding more data does not fix underfitting." },
  "regularization": { title: "Regularisation (L1 / L2, λ and C)", anim: "l1l2", points: ["Add a penalty on weight size to the loss → simpler model, less overfitting.", "<b>L2 / ridge</b>: λΣw² → shrinks all weights, none to zero; handles collinearity.", "<b>L1 / lasso</b>: λΣ|w| → drives some weights to exactly 0 → feature selection.", "Bigger λ = stronger penalty. In sklearn <b>C = 1/λ</b> → smaller C = stronger regularisation.", "Choose λ / C by cross-validation."], formula: "J = loss + λ Σ wⱼ²  (L2)   or  + λ Σ |wⱼ|  (L1)", trap: "Large C in LogisticRegression/SVM = WEAK regularisation (overfit risk)." },
  // Logistic regression
  "sigmoid": { title: "Sigmoid & logistic regression", anim: "sigmoid", points: ["Computes z = wᵀx + b, then p = σ(z) ∈ (0, 1) = P(y = 1 | x).", "Classify with a threshold (default 0.5 ⇔ z ≥ 0).", "Linear regression is bad for classes: outputs outside [0,1] and outliers shift the line.", "Raising the threshold → fewer positives → precision ↑, recall ↓."], formula: "σ(z) = 1 / (1 + e^(−z))" },
  "decision-boundary": { title: "Decision boundary", anim: "sigmoid", points: ["Boundary where p = 0.5 ⇔ wᵀx + b = 0 → a straight line/plane.", "Non-linear boundaries need engineered features (x², x₁x₂) or another model.", "Weights set the orientation; bias shifts it.", "Changing the threshold moves the boundary in parallel."] },
  "odds": { title: "Odds, log-odds & interpreting weights", anim: "odds", points: ["odds = p / (1 − p); log-odds (logit) = wᵀx + b is linear.", "Increasing xⱼ by 1 adds wⱼ to log-odds → multiplies the odds by e^wⱼ.", "wⱼ > 0 raises the probability, wⱼ < 0 lowers it.", "Odds ratio between two groups = e^(coefficient of the group indicator)."], trap: "e^w multiplies the ODDS, not the probability." },
  "xent": { title: "Cross-entropy (log loss) & training", anim: "xent", points: ["Loss = −[y log p + (1 − y) log(1 − p)] — convex for logistic regression.", "Penalises confident wrong predictions very heavily.", "MSE + sigmoid would be non-convex → we use log loss.", "Gradient: ∂J/∂w = (1/m) Σ (pᵢ − yᵢ) xᵢ — same form as linear regression.", "Solvers: lbfgs (default), liblinear (small data, L1), saga (large data, L1)."], formula: "J = −(1/m) Σ [y log p + (1−y) log(1−p)]" },
  "multiclass": { title: "Multiclass extensions", anim: "sigmoid", points: ["<b>One-vs-Rest (OvR)</b>: K binary classifiers, pick highest score.", "<b>Softmax / multinomial</b>: one model, probabilities sum to 1.", "<b>One-vs-One (OvO)</b>: K(K−1)/2 pairwise classifiers, majority vote (used by SVC).", "Metrics: macro (equal per class) vs weighted averaging."], formula: "softmax: pₖ = e^zₖ / Σ e^zⱼ" },
  "multicollinearity": { title: "Multicollinearity", anim: "l1l2", points: ["Highly correlated features → unstable, large, sign-flipping coefficients.", "Predictions may still be fine; interpretation is unreliable.", "Detect: correlation matrix, VIF > 5–10.", "Fix: drop one feature, combine (PCA), or L2 regularisation."] },
  "code-reading": { title: "Reading scikit-learn code", anim: "leakage", points: ["<code>Pipeline([('scaler', StandardScaler()), ('clf', LogisticRegression())])</code> fits the scaler only on each training fold → no leakage.", "<code>train_test_split(..., stratify=y)</code> keeps class ratios in both splits (vital for imbalance).", "<code>tn, fp, fn, tp = confusion_matrix(y, ŷ).ravel()</code> — rows = actual, cols = predicted, negative class first.", "<code>fit</code> on train, <code>transform/predict</code> on test. Calling <code>fit</code> on test is a bug."] },
  // SVM
  "svm-margin": { title: "Max margin & support vectors", anim: "margin", points: ["SVM finds the separating hyperplane with the <b>widest margin</b>.", "Margin width = 2/‖w‖ → maximise margin ⇔ minimise ½‖w‖².", "Only the closest points (support vectors) define the boundary; others can move freely.", "Constraint: yᵢ(wᵀxᵢ + b) ≥ 1."], trap: "Removing a non-support vector changes nothing; removing a support vector can only keep or widen the margin." },
  "svm-soft": { title: "Soft margin & C", anim: "softmargin", points: ["Slack ξᵢ lets points sit inside the margin or be misclassified.", "Minimise ½‖w‖² + C Σ ξᵢ.", "<b>Large C</b>: few violations → narrow margin → can overfit noise.", "<b>Small C</b>: wider margin, tolerates errors → may underfit.", "Tune C (and γ) with cross-validation."], trap: "Overfitting SVM → DECREASE C (and/or γ)." },
  "svm-kernel": { title: "Kernel trick", anim: "kernel", points: ["Map data to a higher-dimensional space where it becomes linearly separable.", "Kernel K(x, x′) = φ(x)·φ(x′) computes the dot product without building φ.", "Linear: text / many features. Polynomial: interactions of degree d. RBF: default for non-linear data.", "A linear boundary in feature space = curved boundary in input space."], formula: "RBF: K(x, x′) = exp(−γ ‖x − x′‖²)" },
  "svm-gamma": { title: "The γ (gamma) parameter", anim: "gamma", points: ["γ controls how far one training point's influence reaches (RBF).", "<b>Small γ</b>: wide influence, smooth boundary → underfit risk.", "<b>Large γ</b>: tiny influence radius, islands around points → overfit.", "Tune γ and C together (grid search)."], trap: "Train accuracy 100%, test poor with RBF → γ too large." },
  "svm-scaling": { title: "Why SVM needs feature scaling", anim: "scaling", points: ["Margin and RBF use distances → a feature in thousands swamps one in [0, 1].", "Standardise before SVM, inside a Pipeline.", "Unscaled data also makes the solver slow to converge.", "Trees don't need it; SVM, KNN, K-means, logistic (with regularisation) do."] },
  "svm-multiclass": { title: "Multiclass SVM", anim: "margin", points: ["SVM is binary by nature.", "<b>OvO</b> (sklearn SVC default): K(K−1)/2 classifiers, vote.", "<b>OvR</b>: K classifiers (LinearSVC default).", "No native probabilities — needs Platt scaling (probability=True)."] },
  "svm-cost": { title: "SVM cost, scalability & when to use it", anim: "margin", points: ["Kernel SVM training ≈ O(n²)–O(n³) → slow beyond ~100k rows.", "Great for small/medium data, many features (text, genes), clear margins.", "Big data → LinearSVC / SGDClassifier, or tree ensembles for tabular data.", "Prediction cost grows with number of support vectors."], trap: "Millions of rows + RBF SVM = bad choice." },
  // KNN
  "knn-basics": { title: "KNN: lazy, instance-based learning", anim: "knn", points: ["No training: store the data; at prediction find the K nearest points.", "Classification → majority vote; regression → average of neighbours.", "Non-parametric: flexible boundaries, no assumptions about the data shape.", "Weak points: slow prediction, memory, sensitive to scaling, irrelevant features and high dimensions."] },
  "knn-k": { title: "Choosing K", anim: "knn", points: ["<b>Small K</b> (K = 1): jagged boundary, sensitive to noise → high variance / overfit.", "<b>Large K</b>: smooth boundary, ignores local structure → high bias / underfit.", "Pick K with cross-validation; use odd K for binary to avoid ties.", "Rule of thumb start: K ≈ √n."], trap: "K = 1 always gives 100% TRAINING accuracy — meaningless." },
  "knn-distance": { title: "Distance metrics", anim: "distance", points: ["Euclidean (L2): straight line, default.", "Manhattan (L1): sum of absolute differences, more robust in high dimensions / grid-like data.", "Minkowski generalises both (p = 1 or 2).", "Cosine: angle between vectors → text / embeddings. Hamming: categorical/binary."] },
  "knn-weighted": { title: "Weighted KNN", anim: "knn", points: ["Closer neighbours get more say: weight = 1/d (or 1/d²).", "Reduces the effect of choosing K too large.", "Helps when classes are unevenly dense.", "sklearn: weights='distance'."] },
  "knn-cost": { title: "KNN prediction cost", anim: "knn", points: ["Training O(1); prediction O(n·d) per query (compare with every point).", "Speed-ups: KD-tree / Ball-tree (low d), approximate NN (FAISS, Annoy).", "Memory: must keep the whole training set.", "Bad fit for low-latency apps with huge datasets."] },
  "curse": { title: "Curse of dimensionality", anim: "curse", points: ["As features grow, data becomes sparse and distances become similar.", "“Nearest” neighbours are no longer near → KNN/distance models degrade.", "Need exponentially more data to cover the space.", "Fix: feature selection, PCA, domain knowledge."] },
  // Ensembles
  "tree-split": { title: "Decision-tree splitting criteria", anim: "tree", points: ["Pick the split that maximises impurity decrease (information gain).", "<b>Gini</b> = 1 − Σ pₖ² (0 = pure). <b>Entropy</b> = −Σ pₖ log₂ pₖ.", "Regression trees: minimise variance / MSE in the children.", "Greedy, top-down; axis-aligned splits."], formula: "Gain = I(parent) − Σ (nₖ/n) I(childₖ)", trap: "50/50 node: Gini = 0.5, entropy = 1. Pure node: both 0." },
  "tree-overfit": { title: "Overfitting in single trees", anim: "tree", points: ["A fully grown tree can make one leaf per point → memorises noise.", "Control with max_depth, min_samples_leaf, min_samples_split, pruning (ccp_alpha).", "Single trees are high-variance: small data changes → very different tree.", "Ensembles (bagging/RF) average that variance away."] },
  "ensemble-basics": { title: "Ensembles: bagging vs boosting vs stacking", anim: "bagging", points: ["<b>Bagging</b>: parallel models on bootstrap samples, average → ↓ variance (Random Forest).", "<b>Boosting</b>: sequential models, each fixes previous errors → ↓ bias (AdaBoost, GBM, XGBoost).", "<b>Stacking</b>: different model types, a meta-model learns to combine their predictions.", "Ensembles work best when base models are diverse and better than chance."], trap: "Bagging ↓ variance; boosting ↓ bias (and can overfit noisy data)." },
  "bagging": { title: "Bagging & out-of-bag error", anim: "bagging", points: ["Bootstrap: sample n rows <b>with replacement</b> → ≈ 63% unique rows per sample.", "Train a model per sample, average / vote.", "≈ 37% rows left out of each sample = out-of-bag (OOB).", "OOB error: predict each row using only trees that didn't see it → free validation estimate."], formula: "P(row not chosen) = (1 − 1/n)ⁿ ≈ 0.368" },
  "random-forest": { title: "Random Forest", anim: "bagging", points: ["Bagging of trees + <b>random subset of features at each split</b> (max_features ≈ √p).", "Feature randomness de-correlates trees → averaging removes more variance.", "More trees never overfits more, just costs time.", "Robust, little tuning, no scaling needed, gives feature importance."], trap: "Increasing n_estimators doesn't cause overfitting; deep trees + few features per split is the RF design." },
  "boosting": { title: "Boosting", anim: "boosting", points: ["Train weak learners (shallow trees) <b>sequentially</b>.", "AdaBoost: increase weights of misclassified points.", "Gradient boosting: each new tree fits the <b>residuals</b> (negative gradient) of the current ensemble.", "Learning rate η shrinks each step; more trees + small η usually better.", "Sensitive to noisy labels/outliers; can overfit → early stopping."] },
  "xgboost": { title: "XGBoost specifics", anim: "boosting", points: ["Gradient boosting + <b>regularised objective</b> (L1/L2 on leaf weights, γ per leaf).", "Second-order (gradient + Hessian) optimisation.", "Handles missing values natively (learns default direction).", "Fast: parallel split finding, histogram method, column subsampling, early stopping.", "Key params: n_estimators, learning_rate (eta), max_depth, subsample, colsample_bytree, lambda, alpha."], trap: "Lower learning_rate needs MORE trees." },
  "stacking": { title: "Stacking", anim: "bagging", points: ["Level-0: diverse models (e.g. RF, SVM, logistic).", "Level-1 meta-learner trained on their <b>out-of-fold</b> predictions.", "Using in-sample predictions to train the meta-model = leakage/overfit.", "Usually a simple meta-model (logistic/linear regression)."] },
  "feature-importance": { title: "Feature importance", anim: "shap", points: ["Impurity (Gini) importance: total impurity decrease from splits on a feature — fast but biased to high-cardinality features.", "Permutation importance: drop in score when a feature is shuffled — more reliable.", "SHAP gives per-prediction, signed contributions.", "One feature with overwhelming importance (e.g. ID, timestamp) → suspect <b>data leakage</b>."], trap: "Importance ≠ causation; correlated features split importance between them." },
  "tree-selection": { title: "Choosing tree ensembles", anim: "boosting", points: ["Tabular data, mixed types, non-linear interactions → RF / XGBoost usually beat neural nets.", "No scaling needed; robust to different units and outliers in features.", "RF: strong baseline, little tuning. XGBoost: often top accuracy with tuning.", "Need interpretability → a single shallow tree or add SHAP."] },
  // Clustering
  "clustering-basics": { title: "Clustering & choosing an algorithm", anim: "kmeans", points: ["Unsupervised grouping by similarity; no labels.", "<b>K-means</b>: spherical, similar-size clusters, K known, big data.", "<b>Hierarchical</b>: small data, want a dendrogram / no fixed K.", "<b>DBSCAN</b>: arbitrary shapes, noise/outliers, K unknown.", "Evaluate: silhouette score, elbow (inertia), domain sense."] },
  "kmeans": { title: "K-means", anim: "kmeans", points: ["Repeat: assign each point to the nearest centroid → move centroid to the mean.", "Minimises within-cluster sum of squares (inertia); converges to a local minimum.", "Choose K: elbow method, silhouette. Use k-means++ init and several restarts.", "Weaknesses: needs K, assumes round equal clusters, sensitive to outliers & scaling."], formula: "min Σₖ Σ_{x∈Cₖ} ‖x − μₖ‖²", trap: "K-means fails on moons / rings / very different densities → DBSCAN." },
  "hierarchical": { title: "Hierarchical clustering & linkage", anim: "hier", points: ["Agglomerative (bottom-up): start with every point alone, merge closest pair. Divisive = top-down.", "Dendrogram: merge height = distance; cut horizontally to get K clusters.", "<b>Single</b> linkage: min distance → chaining, long clusters.", "<b>Complete</b>: max distance → compact. <b>Average</b>: mean. <b>Ward</b>: minimise variance increase (like K-means).", "O(n²) memory → small/medium data."] },
  "dbscan": { title: "DBSCAN", anim: "dbscan", points: ["Parameters: ε (radius) and minPts.", "<b>Core</b>: ≥ minPts within ε. <b>Border</b>: within ε of a core. <b>Noise</b>: neither.", "Finds arbitrary shapes, detects outliers, no K needed.", "Struggles when clusters have very <b>different densities</b> (one ε can't fit all) → HDBSCAN/OPTICS.", "Choose ε with a k-distance plot."], trap: "Too small ε → everything noise. Too large ε → one big cluster." },
  // Bayesian
  "bayes-theorem": { title: "Bayes' theorem", anim: "bayes", points: ["Posterior = likelihood × prior / evidence.", "Update beliefs with data.", "Rare conditions: even accurate tests give many false positives (base-rate effect).", "P(B) = Σ P(B|Aᵢ)P(Aᵢ) (law of total probability)."], formula: "P(A|B) = P(B|A) P(A) / P(B)" },
  "map-mle": { title: "MLE vs MAP", anim: "bayes", points: ["<b>MLE</b>: θ that maximises P(data | θ) — data only.", "<b>MAP</b>: maximises P(θ | data) ∝ P(data|θ) P(θ) — adds a prior.", "Gaussian prior on weights ⇔ L2 regularisation; Laplace prior ⇔ L1.", "With lots of data MAP → MLE; with little data the prior matters."], formula: "θ_MAP = argmax P(D|θ) P(θ)" },
  "naive-bayes": { title: "Naive Bayes", anim: "laplace", points: ["Assumes features are <b>conditionally independent</b> given the class.", "P(y | x) ∝ P(y) Π P(xⱼ | y) — predict the class with the largest value.", "<b>Gaussian</b> NB: continuous features. <b>Multinomial</b>: word counts. <b>Bernoulli</b>: word present/absent.", "Very fast, good for text/spam, works with little data; probabilities are poorly calibrated.", "Use log-probabilities to avoid underflow."], trap: "The independence assumption is usually false, yet classification still works well." },
  "laplace": { title: "Zero probability & Laplace smoothing", anim: "laplace", points: ["A word never seen with a class → P = 0 → whole product = 0.", "Add-α (Laplace, α = 1): (count + 1) / (total + |V|).", "Keeps every probability > 0 without changing rankings much.", "|V| = number of distinct words (vocabulary)."], formula: "P(w|c) = (count(w,c) + 1) / (Σ count(c) + |V|)" },
  "bayes-limits": { title: "Difficulties & limits of Bayesian methods", anim: "bayes", points: ["Choosing a prior is subjective; a bad prior biases results.", "Posterior often has no closed form → MCMC / variational inference (expensive).", "Need many probabilities → lots of data for full Bayes nets.", "Naive Bayes fails when features are strongly dependent (e.g. duplicated features double-count)."] },
  // Evaluation
  "confusion": { title: "Confusion matrix & metrics", anim: "confusion", points: ["<b>Precision</b> = TP/(TP+FP): when we say +, how often right? Use when FP is costly (spam filter).", "<b>Recall</b> = TP/(TP+FN): how many real + we catch. Use when FN is costly (disease, fraud).", "F1 = 2PR/(P+R). Specificity = TN/(TN+FP).", "Accuracy misleads on imbalanced data (always-negative can score 99%)."], trap: "Read the axes! sklearn: rows = actual, columns = predicted." },
  "roc": { title: "ROC & AUC", anim: "roc", points: ["Plots TPR (recall) vs FPR for every threshold.", "AUC = probability a random positive is ranked above a random negative.", "AUC 0.5 = diagonal = random; 1.0 = perfect. Curve above/left = better.", "Threshold-independent; can look too good on heavy imbalance."] },
  "pr-curve": { title: "Precision–Recall curve", anim: "confusion", points: ["Plots precision vs recall across thresholds.", "Better than ROC for <b>rare positive</b> classes — FPR stays tiny because TN is huge.", "Baseline = positive rate (not 0.5).", "Sharp precision drop as recall rises → model can only find the easy positives."] },
  "cv": { title: "Train / validation / test & cross-validation", anim: "cv", points: ["Train: fit. Validation: tune hyperparameters / select model. Test: final unbiased estimate, used once.", "k-fold CV: rotate the validation fold; average scores.", "<b>Stratified</b> splits keep class ratios (imbalanced data).", "Time series: split by time (train on past, test on future), never shuffle.", "Group data (same patient) → GroupKFold to avoid the same entity in train and test."], trap: "Tuning on the test set makes the test score optimistic." },
  "leakage": { title: "Data leakage & preprocessing order", anim: "leakage", points: ["Leakage: information unavailable at prediction time sneaks into training.", "Split FIRST, then fit scaler / imputer / feature selection on train only (use a Pipeline).", "Target leakage: a feature that is a consequence of the label (e.g. “refund_issued” to predict fraud).", "Too-good-to-be-true scores or one dominant feature → suspect leakage."] },
  "imbalance": { title: "Imbalanced data", anim: "confusion", points: ["Use precision, recall, F1, PR-AUC — not accuracy.", "Resample: oversample minority (SMOTE), undersample majority — on TRAIN only.", "class_weight='balanced' / cost-sensitive loss.", "Move the decision threshold; stratify splits."] },
  "metric-choice": { title: "Choosing the right metric", anim: "confusion", points: ["Missing a positive is costly (cancer, fraud) → <b>recall</b>.", "False alarms are costly (spam to inbox, legal action) → <b>precision</b>.", "Need balance → F1. Ranking quality → ROC-AUC / PR-AUC.", "Regression: MAE (robust), RMSE (punishes big errors), R²."] },
  "ml-general": { title: "General ML exam ideas", anim: "biasvar", points: ["Irreducible error (noise) remains even for the perfect model.", "Validation set = tune; test set = report.", "Tabular + non-linear + messy → tree ensembles; need explanations → add SHAP/LIME or simpler models.", "No free lunch: no model is best for every problem — compare with CV."] },
  // XAI
  "xai-why": { title: "Why explainability & the black-box problem", anim: "shap", points: ["Complex models (deep nets, ensembles) are accurate but opaque.", "Needed for trust, debugging, fairness/bias detection, regulation (GDPR “right to explanation”), safety-critical domains.", "Global explanation: how the model behaves overall. Local: why THIS prediction.", "Intrinsically interpretable (linear, small tree) vs post-hoc (SHAP, LIME)."] },
  "shapley": { title: "Shapley values & axioms", anim: "shap", points: ["From cooperative game theory: features = players, prediction = payout.", "φⱼ = feature j's average marginal contribution over all orderings/coalitions.", "<b>Efficiency</b>: Σφⱼ = f(x) − E[f(x)]. <b>Symmetry</b>: equal contributors get equal φ. <b>Dummy</b>: no effect → φ = 0. <b>Additivity</b>.", "Exact computation is exponential (2ⁿ coalitions) → approximations (KernelSHAP, TreeSHAP)."] },
  "shap-plots": { title: "Reading SHAP plots", anim: "shap", points: ["<b>Waterfall/force</b>: one prediction; bars push from base value to output (red ↑, blue ↓).", "<b>Summary (beeswarm)</b>: each dot = one row; x = SHAP value, colour = feature value; sorted by importance.", "<b>Bar</b>: mean |SHAP| = global importance.", "<b>Dependence</b>: SHAP vs feature value → shape of the effect and interactions."], trap: "High feature value (red) on the right ⇒ high values INCREASE the prediction." },
  "lime": { title: "LIME", anim: "lime", points: ["Local Interpretable Model-agnostic Explanations.", "Perturb the instance, query the black box, weight samples by proximity, fit a simple (linear) surrogate.", "Surrogate weights = local explanation.", "Limits: unstable (different runs → different explanations), depends on kernel width & perturbation scheme, only locally faithful."] },
  "shap-vs-lime": { title: "SHAP vs LIME", anim: "lime", points: ["SHAP: game-theory guarantees (consistency, additivity), local + global, slower (fast for trees with TreeSHAP).", "LIME: fast, intuitive, model-agnostic, but unstable and no guarantees.", "Use SHAP for audits/regulation and global insight; LIME for quick local checks.", "Use both to cross-check; disagreement is a warning sign."] },
  // MLOps
  "drift": { title: "Data drift vs concept drift", anim: "drift", points: ["<b>Data drift</b>: input distribution P(X) changes (new customer mix, new sensor).", "<b>Concept drift</b>: relationship P(y|X) changes (fraud tactics, COVID behaviour).", "Detect data drift without labels: PSI, KS-test, KL divergence.", "Detect concept drift with labels: falling accuracy / rising error.", "Response: alert → investigate → retrain → validate → redeploy."] },
  "retraining": { title: "Retraining triggers & strategy", anim: "retrain", points: ["<b>Scheduled</b> (calendar): simple, predictable; but retrains when nothing changed and reacts late to sudden drift.", "<b>Trigger-based</b>: retrain on drift / performance-drop alerts → timely, needs monitoring.", "Often combined: schedule + drift triggers.", "Every new model passes a <b>quality gate</b> (beat the current model on validation) before deployment."] },
  "monitoring": { title: "Production monitoring", anim: "pipeline", points: ["System: latency, throughput, errors, resource use.", "Data: missing values, schema, input distributions (drift).", "Model: prediction distribution, accuracy once labels arrive, fairness.", "Alerts with thresholds; dashboards (Evidently, Prometheus/Grafana)."] },
  "cicd": { title: "CI/CD for ML", anim: "pipeline", points: ["CI: test code AND data (schema, unit tests) + model checks on every commit.", "CD: automated, reproducible deployment (Docker, GitHub Actions).", "Safe rollouts: canary, shadow, blue-green, A/B; quick rollback.", "CT (continuous training): pipeline retrains automatically on triggers."] },
  "tracking": { title: "Experiment tracking & versioning", anim: "pipeline", points: ["Log params, metrics, code version, data version, artifacts for every run (MLflow, W&B).", "Version data (DVC) and models (model registry: staging → production).", "Goal: reproducibility, comparison, rollback, audit trail.", "Fix random seeds; record environment (requirements, Docker image)."] },
  "pipeline-design": { title: "End-to-end ML pipeline", anim: "pipeline", points: ["Ingest → validate → preprocess → train → evaluate → quality gate → deploy → monitor → retrain.", "Missing validation gate → a worse model can go live.", "Missing monitoring → silent failure from drift.", "Preprocessing must be identical in training and serving (training/serving skew)."] },
  "split-strategy": { title: "Train/test split strategy", anim: "cv", points: ["Random split only if rows are i.i.d.", "Time-ordered data → time-based split (no future info in training).", "Imbalanced → stratified split.", "Repeated entities (users, patients) → group split."] },
};

const SUBTOPIC_THEORY = {
  "ML taxonomy & definitions": "ml-taxonomy", "Linear regression model & notation": "linreg", "Cost function": "cost", "Gradient descent mechanics": "gd",
  "Batch, mini-batch & stochastic gradient descent": "gd-variants", "Learning rate & convergence diagnostics": "lr", "Feature scaling & normalization": "feature-scaling",
  "Feature engineering & polynomial regression": "poly", "Multiple features, vectorization & normal equation": "normal-eq", "Bias-variance tradeoff": "bias-variance",
  "Overfitting & underfitting": "overfitting", "Regularization basics": "regularization",
  "Binary classification framing": "sigmoid", "Sigmoid function": "sigmoid", "Why not linear regression": "sigmoid", "Decision boundary": "decision-boundary",
  "Probabilistic interpretation and odds": "odds", "Cross-entropy loss": "xent", "Gradient descent for logistic regression": "xent", "Solvers and optimization": "xent",
  "Multiclass extensions": "multiclass", "Multicollinearity and coefficient stability": "multicollinearity", "Overfitting and underfitting": "overfitting",
  "Regularization (L1 vs L2)": "regularization", "Regularization (lambda/C)": "regularization", "Evaluation metrics": "confusion", "Code reading": "code-reading",
  "Max-margin intuition & support vectors": "svm-margin", "Soft margin & the C parameter": "svm-soft", "Overfitting risk in SVM": "svm-soft", "Kernel trick (linear/polynomial/RBF)": "svm-kernel",
  "The gamma parameter": "svm-gamma", "Why feature scaling matters for SVM": "svm-scaling", "Multiclass SVM extension": "svm-multiclass",
  "Computational cost and scalability": "svm-cost", "Choosing SVM for a given dataset shape": "svm-cost",
  "Lazy / instance-based learning": "knn-basics", "Classification vs regression with KNN": "knn-basics", "Real-world applications": "knn-basics", "Strengths and weaknesses vs parametric models": "knn-basics",
  "Choosing K and bias-variance tradeoff": "knn-k", "Distance metrics": "knn-distance", "Weighted KNN": "knn-weighted", "Computational cost at prediction time": "knn-cost",
  "Curse of dimensionality": "curse", "Feature scaling": "feature-scaling",
  "Tree splitting criteria": "tree-split", "Overfitting in single trees": "tree-overfit", "Ensemble fundamentals review": "ensemble-basics", "Bagging vs boosting vs stacking": "ensemble-basics",
  "Bagging fundamentals": "bagging", "Out-of-bag error": "bagging", "Random forest mechanism": "random-forest", "Boosting concept": "boosting", "XGBoost specifics": "xgboost",
  "Stacking": "stacking", "Feature importance": "feature-importance", "Model selection for tree ensembles": "tree-selection",
  "Clustering fundamentals": "clustering-basics", "Clustering algorithm comparison and scenario selection": "clustering-basics", "K-means: objective and mechanics": "kmeans",
  "K-means: limitations and practical considerations": "kmeans", "Hierarchical clustering: agglomerative, divisive, and dendrograms": "hierarchical", "Hierarchical clustering: linkage methods": "hierarchical",
  "DBSCAN: core concepts and parameters": "dbscan", "DBSCAN: density variation and noise handling": "dbscan",
  "Bayes' Theorem Fundamentals": "bayes-theorem", "MAP vs MLE": "map-mle", "Naive Bayes Conditional Independence Assumption": "naive-bayes", "Naive Bayes Variants (Gaussian/Multinomial/Bernoulli)": "naive-bayes",
  "Naive Bayes for Text Classification": "naive-bayes", "Zero-Probability Problem and Laplace Smoothing": "laplace", "Difficulties with Bayesian Methods": "bayes-limits", "Real-World Application and Limitations": "bayes-limits",
  "Confusion-matrix calculations": "confusion", "Choosing the right metric": "metric-choice", "ROC curve reading": "roc", "Precision-Recall curve reading": "pr-curve",
  "Bias-variance curve reading": "bias-variance", "Cross-validation and data splits": "cv", "Data leakage and preprocessing order": "leakage", "Handling imbalanced data": "imbalance",
  "Feature-importance chart reading": "feature-importance", "General ML knowledge": "ml-general",
  "Why Explainability Matters": "xai-why", "The Black-Box Problem": "xai-why", "Shapley Values and Game-Theoretic Foundations": "shapley", "Shapley Value Axioms": "shapley",
  "SHAP Plot Interpretation": "shap-plots", "LIME Local Surrogate Mechanics": "lime", "LIME Practical Application and Limitations": "lime", "SHAP vs LIME Comparison and Combined Use": "shap-vs-lime",
  "Data drift vs concept drift": "drift", "Retraining triggers and strategy": "retraining", "Production monitoring": "monitoring", "CI/CD for ML": "cicd",
  "Experiment tracking and versioning": "tracking", "End-to-end pipeline design and diagnosis": "pipeline-design", "Data leakage and pipeline hygiene": "leakage", "Train/test splitting strategy": "split-strategy",
};

const ESSAY_THEORY = {
  "pq-logreg-spam": ["sigmoid", "confusion"], "pq-2021-q2c": ["odds"], "pq-svm-kernel": ["svm-kernel", "svm-margin"], "pq-2021-q3": ["svm-margin", "svm-soft"],
  "pq-experiments": ["regularization", "leakage", "cv", "imbalance"], "pq-2021-q1-tf": ["overfitting", "regularization", "normal-eq"], "pq-2021-q2ab": ["gd", "map-mle"],
  "pq-2021-q4": ["poly", "regularization"], "pq-2021-q2d": ["bayes-theorem", "map-mle"],
};

const THEORY_TOPIC = {}; // card key -> topic of the first subtopic that uses it (for grouping in the Theory tab)

// ---------------------------------------------------------------- rendering & animation loop
function theoryCardHtml(key, opts = {}) {
  const c = THEORY[key];
  if (!c) return "";
  return `<div class="theory-card${opts.compact ? " compact" : ""}" data-key="${key}">
    ${c.anim ? `<svg class="anim" data-anim="${c.anim}" viewBox="0 0 ${TW} ${TH}" role="img" aria-label="${c.title} animation"></svg>` : ""}
    <div class="theory-text">
      ${opts.hideTitle ? "" : `<h4>${c.title}</h4>`}
      <ul>${c.points.map((p) => `<li>${p}</li>`).join("")}</ul>
      ${c.formula ? `<div class="formula">${c.formula}</div>` : ""}
      ${c.trap ? `<div class="trap"><b>Exam trap:</b> ${c.trap}</div>` : ""}
    </div>
  </div>`;
}

const reduceMotion = (() => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } })();
const animStart = performance.now();
let lastDraw = 0;
function animLoop(now) {
  if (now - lastDraw > 33) {
    lastDraw = now;
    const t = reduceMotion ? 3.3 : (now - animStart) / 1000;
    document.querySelectorAll("svg.anim").forEach((el) => {
      if (reduceMotion && el.dataset.drawn) return;
      if (!el.getClientRects().length) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const fn = ANIMS[el.dataset.anim];
      if (fn) { try { el.innerHTML = fn(t); el.dataset.drawn = "1"; } catch (e) { el.innerHTML = ""; } }
    });
  }
  requestAnimationFrame(animLoop);
}
requestAnimationFrame(animLoop);
