// Inline SVG renderers for question figures. No libraries, no network.
//   renderTable(table)  -> HTML table for {headers, rows}
//   renderChart(chart)  -> <figure> for the MCQ bank's {type: bar|roc|pr|bias_variance}
//   renderPlot(spec)    -> <figure> for essay figures: axes + lines/curves/scatter

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderTable(table) {
  const head = table.headers.map((h) => `<th>${escHtml(h)}</th>`).join("");
  const body = table.rows
    .map((r) => "<tr>" + r.map((c, i) => (i === 0 && table.headers[0] === "" ? `<th>${escHtml(c)}</th>` : `<td>${escHtml(c)}</td>`)).join("") + "</tr>")
    .join("");
  const cap = table.caption ? `<caption>${escHtml(table.caption)}</caption>` : "";
  return `<div class="q-table-wrap"><table class="q-data-table">${cap}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

// ---------- generic plot ----------

function niceTicks(lo, hi, target) {
  const span = hi - lo;
  const raw = span / (target || 5);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

// spec: {xlim:[a,b], ylim:[a,b], xlabel, ylabel, caption, width, height, xticks, yticks,
//        series:[{kind:"line", points:[[x,y]...] | fn, dash, color, label, width},
//                {kind:"scatter", points:[[x,y,label?]...], marker:"o"|"x"|"s"|"+", color, label},
//                {kind:"hline"|"vline", at, dash, color, label},
//                {kind:"text", x, y, text, color, anchor}]}
function renderPlot(spec) {
  const W = spec.width || 420, H = spec.height || 300;
  const m = { l: 48, r: 14, t: 12, b: 40 };
  const [x0, x1] = spec.xlim, [y0, y1] = spec.ylim;
  const sx = (x) => m.l + ((x - x0) / (x1 - x0)) * (W - m.l - m.r);
  const sy = (y) => H - m.b - ((y - y0) / (y1 - y0)) * (H - m.t - m.b);
  const clip = `clip-${Math.random().toString(36).slice(2, 8)}`;
  let g = `<defs><clipPath id="${clip}"><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/></clipPath></defs>`;

  const xt = spec.xticks || niceTicks(x0, x1, 8);
  const yt = spec.yticks || niceTicks(y0, y1, 6);
  xt.forEach((v) => {
    g += `<line class="grid" x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${H - m.b}"/>`;
    g += `<text class="tick" x="${sx(v)}" y="${H - m.b + 14}" text-anchor="middle">${v}</text>`;
  });
  yt.forEach((v) => {
    g += `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${sy(v)}" y2="${sy(v)}"/>`;
    g += `<text class="tick" x="${m.l - 6}" y="${sy(v) + 3}" text-anchor="end">${v}</text>`;
  });
  if (x0 < 0 && x1 > 0) g += `<line class="zero" x1="${sx(0)}" x2="${sx(0)}" y1="${m.t}" y2="${H - m.b}"/>`;
  if (y0 < 0 && y1 > 0) g += `<line class="zero" x1="${m.l}" x2="${W - m.r}" y1="${sy(0)}" y2="${sy(0)}"/>`;
  g += `<rect class="frame" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/>`;

  const legend = [];
  let body = "";
  (spec.series || []).forEach((s, idx) => {
    const color = s.color || `var(--series-${(idx % 4) + 1})`;
    const dash = s.dash ? ` stroke-dasharray="${s.dash === true ? "6 4" : s.dash}"` : "";
    if (s.kind === "line") {
      let pts = s.points;
      if (!pts && s.fn) {
        pts = [];
        const lo = s.from !== undefined ? s.from : x0, hi = s.to !== undefined ? s.to : x1;
        for (let i = 0; i <= 120; i++) { const x = lo + ((hi - lo) * i) / 120; pts.push([x, s.fn(x)]); }
      }
      const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join("");
      body += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${s.width || 2.2}"${dash} stroke-linejoin="round" stroke-linecap="round"/>`;
    } else if (s.kind === "hline" || s.kind === "vline") {
      body += s.kind === "hline"
        ? `<line x1="${m.l}" x2="${W - m.r}" y1="${sy(s.at)}" y2="${sy(s.at)}" stroke="${color}" stroke-width="1.6"${dash}/>`
        : `<line x1="${sx(s.at)}" x2="${sx(s.at)}" y1="${m.t}" y2="${H - m.b}" stroke="${color}" stroke-width="1.6"${dash}/>`;
    } else if (s.kind === "scatter") {
      s.points.forEach((p) => {
        const cx = sx(p[0]), cy = sy(p[1]), r = s.size || 5;
        if (s.marker === "x") body += `<path d="M${cx - r},${cy - r}L${cx + r},${cy + r}M${cx - r},${cy + r}L${cx + r},${cy - r}" stroke="${color}" stroke-width="2.2"/>`;
        else if (s.marker === "+") body += `<path d="M${cx - r},${cy}L${cx + r},${cy}M${cx},${cy - r}L${cx},${cy + r}" stroke="${color}" stroke-width="2.4"/>`;
        else if (s.marker === "s") body += `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="${color}"/>`;
        else if (s.marker === "ring") body += `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="${color}" stroke-width="1.8"/>`;
        else body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
        if (p[2]) body += `<text class="pt-label" x="${cx + 8}" y="${cy - 7}">${escHtml(p[2])}</text>`;
      });
    } else if (s.kind === "text") {
      body += `<text class="pt-label" x="${sx(s.x)}" y="${sy(s.y)}" text-anchor="${s.anchor || "start"}" fill="${color}">${escHtml(s.text)}</text>`;
    }
    if (s.label) legend.push({ color, label: s.label, kind: s.kind, marker: s.marker, dash: !!s.dash });
  });
  g += `<g clip-path="url(#${clip})">${body}</g>`;
  if (spec.xlabel) g += `<text class="axis-label" x="${(m.l + W - m.r) / 2}" y="${H - 6}" text-anchor="middle">${escHtml(spec.xlabel)}</text>`;
  if (spec.ylabel) g += `<text class="axis-label" transform="translate(13 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">${escHtml(spec.ylabel)}</text>`;

  const legendHtml = legend.length
    ? `<div class="legend">${legend.map((l) => {
        const sym = l.marker === "x" || l.marker === "+"
          ? `<b style="color:${l.color}">${l.marker === "x" ? "×" : "+"}</b>`
          : l.marker === "ring" ? `<i class="dot" style="background:none;border:1.5px solid ${l.color}"></i>`
          : `<i style="background:${l.color}" class="${l.kind === "scatter" ? "dot" : l.dash ? "dash" : "bar"}"></i>`;
        return `<span>${sym}${escHtml(l.label)}</span>`;
      }).join("")}</div>`
    : "";
  const cap = spec.caption ? `<figcaption>${escHtml(spec.caption)}</figcaption>` : "";
  return `<figure class="q-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escHtml(spec.caption || "figure")}">${g}</svg>${legendHtml}${cap}</figure>`;
}

// ---------- MCQ bank chart types ----------

function renderBarChart(c) {
  const W = 420, rowH = 30, m = { l: 150, r: 46, t: 8, b: 8 };
  const H = m.t + m.b + rowH * c.labels.length;
  const max = Math.max(...c.values);
  let g = "";
  c.labels.forEach((lab, i) => {
    const y = m.t + i * rowH;
    const w = ((W - m.l - m.r) * c.values[i]) / max;
    g += `<text class="tick" x="${m.l - 8}" y="${y + rowH / 2 + 4}" text-anchor="end">${escHtml(lab)}</text>`;
    g += `<rect x="${m.l}" y="${y + 5}" width="${w.toFixed(1)}" height="${rowH - 10}" rx="3" fill="var(--series-1)"/>`;
    g += `<text class="tick" x="${m.l + w + 6}" y="${y + rowH / 2 + 4}">${c.values[i]}</text>`;
  });
  return `<figure class="q-chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escHtml(c.caption || "bar chart")}">${g}</svg>${c.caption ? `<figcaption>${escHtml(c.caption)}</figcaption>` : ""}</figure>`;
}

const ROC_SHAPES = {
  random: (x) => x + 0.02 * Math.sin(9 * x),
  good: (x) => 1 - Math.pow(1 - x, 3),
  excellent: (x) => 1 - Math.pow(1 - x, 12),
  poor: (x) => 1 - Math.pow(1 - x, 1.4),
};

function renderChart(c) {
  if (c.type === "bar") return renderBarChart(c);
  if (c.type === "roc") {
    const series = [{ kind: "line", points: [[0, 0], [1, 1]], dash: true, color: "var(--muted)", label: "Random (AUC = 0.5)" }];
    if (/model a/i.test(c.caption || "")) {
      series.push({ kind: "line", fn: ROC_SHAPES.excellent, from: 0, to: 1, label: "Model A", color: "var(--series-1)" });
      series.push({ kind: "line", fn: ROC_SHAPES.good, from: 0, to: 1, label: "Model B", color: "var(--series-2)" });
    } else {
      series.push({ kind: "line", fn: ROC_SHAPES[c.shape] || ROC_SHAPES.good, from: 0, to: 1, label: "Model", color: "var(--series-1)" });
    }
    return renderPlot({ xlim: [0, 1], ylim: [0, 1], xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], yticks: [0, 0.2, 0.4, 0.6, 0.8, 1], xlabel: "False positive rate", ylabel: "True positive rate", caption: c.caption, series, width: 360, height: 300 });
  }
  if (c.type === "pr") {
    const fn = c.shape === "steep_drop"
      ? (r) => (r < 0.4 ? 0.95 - 0.1 * r : Math.max(0.06, 0.91 - 2.2 * (r - 0.4)))
      : (r) => 0.95 - 0.75 * Math.pow(r, 1.6);
    return renderPlot({ xlim: [0, 1], ylim: [0, 1], xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], yticks: [0, 0.2, 0.4, 0.6, 0.8, 1], xlabel: "Recall", ylabel: "Precision", caption: c.caption, width: 360, height: 300, series: [{ kind: "line", fn, from: 0, to: 1, color: "var(--series-1)" }] });
  }
  if (c.type === "bias_variance") {
    // Captions that describe a fitted curve (not an error curve) get a data-fit picture.
    if (/fit/i.test(c.caption || "") && !/complexity/i.test(c.caption || "")) {
      const xs = [0.5, 1.2, 1.9, 2.6, 3.3, 4.0, 4.7, 5.4];
      const truth = (x) => 0.35 * (x - 3) * (x - 3) + 1;
      const noise = [0.35, -0.3, 0.25, -0.2, 0.3, -0.35, 0.2, -0.25];
      const pts = xs.map((x, i) => [x, truth(x) + noise[i]]);
      let fn;
      if (c.shape === "underfit") fn = (x) => 0.18 * x + 1.4;
      else if (c.shape === "overfit") fn = (x) => { // interpolate exactly through each point with overshoot
        let i = xs.findIndex((v) => v > x); if (i <= 0) i = i === 0 ? 1 : xs.length - 1;
        const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
        return pts[i - 1][1] * (1 - t) + pts[i][1] * t + 0.9 * Math.sin(Math.PI * t) * (i % 2 ? 1 : -1);
      };
      else fn = truth;
      return renderPlot({ xlim: [0, 6], ylim: [0, 5], xlabel: "x", ylabel: "y", caption: c.caption, width: 360, height: 260,
        series: [{ kind: "scatter", points: pts, color: "var(--series-2)", label: "training data" }, { kind: "line", fn, from: 0.3, to: 5.7, color: "var(--series-1)", label: "model" }] });
    }
    const train = { overfit: (x) => 0.9 * Math.exp(-0.5 * x) + 0.03, underfit: (x) => 0.62 - 0.012 * x, good_fit: (x) => 0.9 * Math.exp(-0.45 * x) + 0.1 }[c.shape] || ((x) => 0.9 * Math.exp(-0.5 * x));
    const val = { overfit: (x) => 0.9 * Math.exp(-0.6 * x) + 0.03 * x * x * 0.6 + 0.12, underfit: (x) => 0.68 - 0.01 * x, good_fit: (x) => 0.9 * Math.exp(-0.45 * x) + 0.16 }[c.shape] || ((x) => 0.5);
    return renderPlot({ xlim: [0, 10], ylim: [0, 1], xticks: [0, 2, 4, 6, 8, 10], yticks: [0, 0.2, 0.4, 0.6, 0.8, 1], xlabel: "Model complexity", ylabel: "Error", caption: c.caption, width: 360, height: 280,
      series: [{ kind: "line", fn: train, label: "Training error", color: "var(--series-1)" }, { kind: "line", fn: val, label: "Validation error", color: "var(--series-2)", dash: true }] });
  }
  return "";
}
