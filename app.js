// Applied ML exam practice — IT 5504.
// MCQ bank: reads EXAM_BANK (questions.js). Essay mode: reads EXAM_ESSAYS (essays.js).
// Figures come from chart-render.js. No build step, no network calls.

const TOPIC_META = {
  "ml-foundations": "ML Foundations & Linear Regression",
  "logistic-regression": "Logistic Regression",
  "svm": "Support Vector Machines",
  "knn": "K-Nearest Neighbors",
  "ensembles": "Decision Trees, Random Forest, Boosting & XGBoost",
  "clustering": "Clustering (K-Means, Hierarchical, DBSCAN)",
  "bayesian-naive-bayes": "Bayesian Learning & Naive Bayes",
  "evaluation-and-general": "Evaluation Metrics, Graph Reading & General ML",
  "explainable-ai": "Explainable AI: SHAP & LIME",
  "mlops": "MLOps & Deployment",
};
const ORDER = Object.keys(TOPIC_META);
const LETTERS = ["A", "B", "C", "D", "E", "F"];

const STORAGE_KEY = "aml-exam-style-mcq-bank-stats-v1";
const ESSAY_KEY = "aml-exam-essays-v1";

function loadJson(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private window / blocked storage */ }
}

let stats = loadJson(STORAGE_KEY);

function recordAnswer(qid, correct) {
  const s = stats[qid] || { seen: 0, correct: 0 };
  s.seen += 1;
  if (correct) s.correct += 1;
  s.lastCorrect = correct;
  stats[qid] = s;
  saveJson(STORAGE_KEY, stats);
}

const $ = (id) => document.getElementById(id);

// ---------- Tabs ----------

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => { b.classList.toggle("active", b === btn); b.setAttribute("aria-selected", b === btn); });
    $("tab-mcq").hidden = btn.dataset.tab !== "mcq";
    $("tab-essay").hidden = btn.dataset.tab !== "essay";
    if (btn.dataset.tab === "essay") renderEssayList();
    try { localStorage.setItem("aml-tab", btn.dataset.tab); } catch (e) { /* ignore */ }
  });
});

// ---------- Setup screen ----------

const topicGrid = $("topic-grid");
const countSelect = $("count-select");
const modeSelect = $("mode-select");
const kindSelect = $("kind-select");
const prioritizeMissed = $("prioritize-missed");

const topicsPresent = [...new Set(EXAM_BANK.map((q) => q.topic))];
topicsPresent.sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
const isVisual = (q) => !!(q.chart || q.table);

function topicAccuracy(topic) {
  let seen = 0, correct = 0;
  EXAM_BANK.forEach((q) => {
    if (q.topic !== topic) return;
    const s = stats[q.id];
    if (s) { seen += s.seen; correct += s.correct; }
  });
  return { seen, correct };
}

function renderTopicGrid() {
  const checked = new Set(selectedTopics());
  const first = topicGrid.children.length === 0;
  topicGrid.innerHTML = "";
  topicsPresent.forEach((topic) => {
    const count = EXAM_BANK.filter((q) => q.topic === topic).length;
    const acc = topicAccuracy(topic);
    const pct = acc.seen > 0 ? Math.round((100 * acc.correct) / acc.seen) : null;
    const label = document.createElement("label");
    label.className = "topic-card";
    label.innerHTML = `
      <input type="checkbox" value="${topic}" ${first || checked.has(topic) ? "checked" : ""}>
      <span style="flex:1">
        <span class="name">${TOPIC_META[topic] || topic}</span>
        <span class="stats">${count} questions${pct !== null ? ` · ${pct}% correct so far` : " · not attempted yet"}</span>
        ${pct !== null ? `<span class="meter"><i style="width:${pct}%"></i></span>` : ""}
      </span>`;
    topicGrid.appendChild(label);
  });
}

function renderAllTimeStat() {
  let seen = 0, correct = 0;
  Object.values(stats).forEach((s) => { seen += s.seen; correct += s.correct; });
  const visual = EXAM_BANK.filter(isVisual).length;
  const pills = [
    `<span class="pill"><b>${EXAM_BANK.length.toLocaleString()}</b> questions</span>`,
    `<span class="pill"><b>${visual}</b> with graphs or tables</span>`,
  ];
  pills.push(seen === 0
    ? `<span class="pill">Not attempted yet</span>`
    : `<span class="pill">All-time <b>${correct}/${seen}</b> (${Math.round((100 * correct) / seen)}%)</span>`);
  $("all-time-stat").innerHTML = pills.join("");
}

$("header-subtitle").textContent =
  "Questions in the style of the real past papers: scenario-driven, with confusion-matrix calculations and graph reading. In instant mode each answer is marked the moment you click it.";

function selectedTopics() {
  return [...topicGrid.querySelectorAll("input:checked")].map((i) => i.value);
}
$("topics-all").addEventListener("click", () => topicGrid.querySelectorAll("input").forEach((i) => (i.checked = true)));
$("topics-none").addEventListener("click", () => topicGrid.querySelectorAll("input").forEach((i) => (i.checked = false)));

renderTopicGrid();
renderAllTimeStat();

// ---------- Session ----------

let session = null;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function newSession(questions) {
  session = { questions, index: 0, answers: new Array(questions.length).fill(null), mode: modeSelect.value, recorded: false };
}

function buildSession() {
  const topics = selectedTopics();
  let pool = EXAM_BANK.filter((q) => topics.includes(q.topic) && (kindSelect.value !== "visual" || isVisual(q)));
  const missed = (q) => stats[q.id] && stats[q.id].lastCorrect === false;
  if (prioritizeMissed.checked) pool = shuffle(pool.filter(missed)).concat(shuffle(pool.filter((q) => !missed(q))));
  else shuffle(pool);
  const wanted = countSelect.value === "all" ? pool.length : Math.min(parseInt(countSelect.value, 10), pool.length);
  newSession(pool.slice(0, wanted));
}

function showScreen(name) {
  $("screen-setup").hidden = name !== "setup";
  $("screen-quiz").hidden = name !== "quiz";
  $("screen-results").hidden = name !== "results";
  window.scrollTo({ top: 0 });
}

$("start-btn").addEventListener("click", () => {
  if (selectedTopics().length === 0) { alert("Pick at least one topic."); return; }
  buildSession();
  if (session.questions.length === 0) { alert("No questions match those settings."); return; }
  showScreen("quiz");
  renderQuestion();
});
$("quit-btn").addEventListener("click", () => finishSession());

// ---------- Quiz screen ----------

const qOptions = $("q-options");
const nextBtn = $("next-btn");
const prevBtn = $("prev-btn");
const verdict = $("verdict");
const explanationBox = $("explanation-box");

const currentQuestion = () => session.questions[session.index];
const isInstant = () => session.mode === "instant";

function liveScore() {
  let answered = 0, correct = 0, streak = 0;
  session.answers.forEach((a, i) => {
    if (a === null) return;
    answered += 1;
    if (a === session.questions[i].correct) correct += 1;
  });
  for (let i = session.answers.length - 1; i >= 0; i--) {
    const a = session.answers[i];
    if (a === null) continue;
    if (a === session.questions[i].correct) streak += 1; else break;
  }
  return { answered, correct, streak };
}

function renderBar() {
  const n = session.questions.length;
  const { answered, correct, streak } = liveScore();
  $("progress-fill").style.width = `${(100 * answered) / n}%`;
  $("quiz-position").textContent = `Question ${session.index + 1} of ${n}`;
  if (isInstant()) {
    const pct = answered ? Math.round((100 * correct) / answered) : 0;
    $("quiz-score").innerHTML = `Score <b>${correct}/${answered}</b>${answered ? ` · ${pct}%` : ""}${streak >= 3 ? `<span class="streak">${streak} in a row</span>` : ""}`;
  } else {
    $("quiz-score").innerHTML = `Answered <b>${answered}/${n}</b>`;
  }
  const dots = $("answer-dots");
  if (n > 120) { dots.innerHTML = ""; return; }
  dots.innerHTML = session.questions.map((q, i) => {
    const a = session.answers[i];
    let cls = a === null ? "" : !isInstant() ? "ans" : a === q.correct ? "ok" : "no";
    if (i === session.index) cls += " cur";
    return `<i class="${cls}"></i>`;
  }).join("");
}

function renderQuestion() {
  const q = currentQuestion();
  $("q-topic-tag").textContent = TOPIC_META[q.topic] || q.topic;
  $("q-title").textContent = q.q;
  $("q-code").hidden = !q.code;
  $("q-code-text").textContent = q.code || "";
  $("q-extra").innerHTML = (q.table ? renderTable(q.table) : "") + (q.chart ? renderChart(q.chart) : "");

  qOptions.innerHTML = "";
  q.options.forEach((opt, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "q-option";
    b.setAttribute("role", "radio");
    b.innerHTML = `<span class="key">${LETTERS[i]}</span><span class="txt"></span>`;
    b.querySelector(".txt").textContent = opt;
    b.addEventListener("click", () => choose(i));
    qOptions.appendChild(b);
  });

  paintAnswerState(false);
  prevBtn.disabled = session.index === 0;
  nextBtn.textContent = session.index + 1 >= session.questions.length ? "Finish" : "Next →";
  renderBar();
}

function paintAnswerState(justAnswered) {
  const q = currentQuestion();
  const chosen = session.answers[session.index];
  const btns = qOptions.querySelectorAll(".q-option");
  const reveal = isInstant() && chosen !== null;

  btns.forEach((b, i) => {
    b.className = "q-option";
    b.setAttribute("aria-checked", chosen === i);
    if (reveal) {
      b.disabled = true;
      if (i === q.correct) b.classList.add("correct");
      else if (i === chosen) b.classList.add("incorrect");
      else b.classList.add("dim");
      if (justAnswered && (i === chosen)) b.classList.add("just");
    } else if (chosen === i) {
      b.classList.add("chosen");
    }
  });

  if (reveal) {
    const ok = chosen === q.correct;
    verdict.hidden = false;
    verdict.className = `verdict ${ok ? "ok" : "no"}`;
    verdict.textContent = ok ? "✓ Correct" : `✗ Not quite. The answer is ${LETTERS[q.correct]}.`;
    explanationBox.textContent = q.explanation;
    explanationBox.classList.add("show");
  } else {
    verdict.hidden = true;
    explanationBox.classList.remove("show");
    explanationBox.textContent = "";
  }
  nextBtn.disabled = chosen === null;
}

function choose(i) {
  const q = currentQuestion();
  const prev = session.answers[session.index];
  if (isInstant() && prev !== null) return; // instant answers are final
  session.answers[session.index] = i;
  if (isInstant()) recordAnswer(q.id, i === q.correct);
  paintAnswerState(true);
  renderBar();
  if (isInstant()) nextBtn.focus({ preventScroll: true });
}

function goNext() {
  if (session.answers[session.index] === null) return;
  if (session.index + 1 >= session.questions.length) { finishSession(); return; }
  session.index += 1;
  renderQuestion();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

nextBtn.addEventListener("click", goNext);
prevBtn.addEventListener("click", () => {
  if (session.index === 0) return;
  session.index -= 1;
  renderQuestion();
});

document.addEventListener("keydown", (e) => {
  if ($("screen-quiz").hidden || $("tab-mcq").hidden) return;
  if (e.target.matches("input, textarea, select") || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toUpperCase();
  const n = currentQuestion().options.length;
  let idx = -1;
  if (/^[1-9]$/.test(k)) idx = parseInt(k, 10) - 1;
  else if (LETTERS.includes(k)) idx = LETTERS.indexOf(k);
  if (idx >= 0 && idx < n) { e.preventDefault(); choose(idx); return; }
  if (e.key === "Enter" || e.key === "ArrowRight") {
    if (document.activeElement && document.activeElement.classList.contains("q-option")) return;
    e.preventDefault(); goNext();
  }
  if (e.key === "ArrowLeft") { e.preventDefault(); prevBtn.click(); }
});

// ---------- Results ----------

function ringSvg(pct) {
  const r = 38, c = 2 * Math.PI * r;
  const color = pct >= 75 ? "var(--good)" : pct >= 50 ? "var(--warn)" : "var(--bad)";
  return `<svg viewBox="0 0 92 92"><circle cx="46" cy="46" r="${r}" fill="none" stroke="var(--rule)" stroke-width="9"/>
    <circle cx="46" cy="46" r="${r}" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"
      stroke-dasharray="${(c * pct) / 100} ${c}" transform="rotate(-90 46 46)"/>
    <text x="46" y="52" text-anchor="middle" font-size="19" font-weight="700" fill="var(--ink)">${pct}%</text></svg>`;
}

function finishSession() {
  if (!isInstant() && !session.recorded) {
    session.answers.forEach((a, i) => { if (a !== null) recordAnswer(session.questions[i].id, a === session.questions[i].correct); });
    session.recorded = true;
  }
  showScreen("results");

  const { answered, correct } = liveScore();
  const pct = answered ? Math.round((100 * correct) / answered) : 0;
  $("summary-ring").innerHTML = ringSvg(pct);
  $("summary-score").textContent = `${correct} / ${answered} correct`;
  $("summary-line").textContent = answered < session.questions.length
    ? `You stopped early: ${session.questions.length - answered} question(s) left unanswered.`
    : `Session complete across ${new Set(session.questions.map((q) => q.topic)).size} topic area(s).`;

  const byTopic = {};
  session.questions.forEach((q, i) => {
    const a = session.answers[i];
    if (a === null) return;
    const t = (byTopic[q.topic] = byTopic[q.topic] || { seen: 0, correct: 0 });
    t.seen += 1;
    if (a === q.correct) t.correct += 1;
  });
  $("topic-breakdown-body").innerHTML = Object.keys(byTopic)
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map((topic) => {
      const t = byTopic[topic];
      return `<tr><td>${TOPIC_META[topic] || topic}</td><td>${t.correct}/${t.seen}</td><td>${Math.round((100 * t.correct) / t.seen)}%</td></tr>`;
    }).join("");

  const missedList = $("missed-list");
  missedList.innerHTML = "";
  let missedCount = 0;
  session.questions.forEach((q, i) => {
    const a = session.answers[i];
    if (a === null || a === q.correct) return;
    missedCount += 1;
    const div = document.createElement("div");
    div.className = "missed-item";
    div.innerHTML = `
      <div class="q-topic-tag">${TOPIC_META[q.topic] || q.topic}</div>
      <div class="mq">${escHtml(q.q)}</div>
      ${q.code ? `<pre class="m-code"><code>${escHtml(q.code)}</code></pre>` : ""}
      ${q.table ? renderTable(q.table) : ""}${q.chart ? renderChart(q.chart) : ""}
      <div class="your-ans">✗ Your answer: ${escHtml(q.options[a])}</div>
      <div class="right-ans">✓ Correct: ${escHtml(q.options[q.correct])}</div>
      <div class="why">${escHtml(q.explanation)}</div>`;
    missedList.appendChild(div);
  });
  if (missedCount === 0) missedList.innerHTML = '<p class="muted">No missed questions in this set. Nice work.</p>';
  $("retry-missed-btn").hidden = missedCount === 0;
  renderAllTimeStat();
  renderTopicGrid();
}

$("retry-missed-btn").addEventListener("click", () => {
  const retry = session.questions.filter((q, i) => session.answers[i] !== null && session.answers[i] !== q.correct);
  newSession(shuffle(retry.slice()));
  showScreen("quiz");
  renderQuestion();
});
$("restart-btn").addEventListener("click", () => showScreen("setup"));

// =====================================================================
// Essay / structured questions
// =====================================================================

let essayState = loadJson(ESSAY_KEY); // {qid: {drafts:{label:text}, revealed:{label:true}, ticks:{label:[bool]}}}
const essayStateFor = (id) => (essayState[id] = essayState[id] || { drafts: {}, revealed: {}, ticks: {} });

const regexCache = new Map();
function rx(src) {
  if (!regexCache.has(src)) {
    let r = null;
    try { r = new RegExp(src, "i"); } catch (e) { r = null; }
    regexCache.set(src, r);
  }
  return regexCache.get(src);
}
function pointDetected(point, text) {
  if (!text || !point.kw) return false;
  return point.kw.every((group) => group.some((src) => { const r = rx(src); return r && r.test(text); }));
}
const partMarks = (part) => part.points.reduce((s, p) => s + p.marks, 0);
const questionMarks = (q) => q.parts.reduce((s, p) => s + partMarks(p), 0);

function partTicks(q, part) {
  const st = essayStateFor(q.id);
  if (st.ticks[part.label]) return st.ticks[part.label];
  return part.points.map((p) => pointDetected(p, st.drafts[part.label] || ""));
}
function partScore(q, part) {
  const ticks = partTicks(q, part);
  return part.points.reduce((s, p, i) => s + (ticks[i] ? p.marks : 0), 0);
}
function questionProgress(q) {
  const st = essayStateFor(q.id);
  const revealed = q.parts.filter((p) => st.revealed[p.label]);
  const scored = revealed.reduce((s, p) => s + partScore(q, p), 0);
  const possible = revealed.reduce((s, p) => s + partMarks(p), 0);
  return { revealed: revealed.length, scored, possible };
}

function renderEssayList() {
  const list = $("essay-list");
  let totalParts = 0, doneParts = 0, scored = 0, possible = 0;
  list.innerHTML = "";
  EXAM_ESSAYS.forEach((q) => {
    const pr = questionProgress(q);
    totalParts += q.parts.length; doneParts += pr.revealed; scored += pr.scored; possible += pr.possible;
    const b = document.createElement("button");
    b.className = "essay-item";
    b.innerHTML = `<span><span class="src">${escHtml(q.source)} · ${escHtml(TOPIC_META[q.topic] || q.topic)}</span>
      <span class="ttl" style="display:block">${escHtml(q.title)}</span></span>
      <span class="score ${pr.revealed === q.parts.length ? "done" : ""}">${pr.revealed
        ? `${pr.scored}/${pr.possible} marks<br><span style="font-weight:500">${pr.revealed}/${q.parts.length} parts marked</span>`
        : `${questionMarks(q)} marks<br><span style="font-weight:500">${q.parts.length} part${q.parts.length > 1 ? "s" : ""}</span>`}</span>`;
    b.addEventListener("click", () => openEssay(q.id));
    list.appendChild(b);
  });
  $("essay-stat").innerHTML = `<span class="pill"><b>${EXAM_ESSAYS.length}</b> questions · <b>${totalParts}</b> parts</span>
    <span class="pill"><b>${doneParts}</b> parts self-marked</span>
    ${possible ? `<span class="pill">Score so far <b>${scored}/${possible}</b> (${Math.round((100 * scored) / possible)}%)</span>` : ""}`;
}

let saveTimer = null;
function saveEssaysSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveJson(ESSAY_KEY, essayState), 300);
}

function openEssay(id) {
  const q = EXAM_ESSAYS.find((x) => x.id === id);
  const st = essayStateFor(q.id);
  const body = $("essay-body");
  body.innerHTML = `
    <div class="src">${escHtml(q.source)} · ${escHtml(TOPIC_META[q.topic] || q.topic)}</div>
    <h2>${escHtml(q.title)}</h2>
    <div class="stem">${q.stem}</div>
    ${q.table ? renderTable(q.table) : ""}
    ${q.figure ? renderPlot(q.figure) : ""}
    <div id="essay-parts"></div>
    <div class="essay-total" id="essay-total"></div>`;

  const partsEl = body.querySelector("#essay-parts");
  q.parts.forEach((part) => {
    const el = document.createElement("section");
    el.className = "part";
    el.innerHTML = `
      <div class="part-head"><p class="part-q"><span class="lbl">(${escHtml(part.label)})</span> ${part.q}</p><span class="marks-tag">${partMarks(part)} marks</span></div>
      <textarea placeholder="Write your answer here. Show working for calculations."></textarea>
      <div class="live-meter"><span class="bar"><i></i></span><span class="meter-txt"></span></div>
      <div class="part-actions">
        <button class="secondary reveal-btn"></button>
        <button class="ghost clear-btn">Clear answer</button>
      </div>
      <div class="reveal" hidden></div>`;
    partsEl.appendChild(el);

    const ta = el.querySelector("textarea");
    const barFill = el.querySelector(".bar i");
    const meterTxt = el.querySelector(".meter-txt");
    const revealBox = el.querySelector(".reveal");
    const revealBtn = el.querySelector(".reveal-btn");
    ta.value = st.drafts[part.label] || "";

    const updateMeter = () => {
      const text = ta.value;
      const hits = part.points.map((p) => pointDetected(p, text));
      const got = part.points.reduce((s, p, i) => s + (hits[i] ? p.marks : 0), 0);
      const total = partMarks(part);
      barFill.style.width = `${(100 * got) / total}%`;
      barFill.classList.toggle("full", got === total);
      meterTxt.innerHTML = text.trim()
        ? `Live check: <b>${hits.filter(Boolean).length}/${part.points.length}</b> marking points found · about <b>${got}/${total}</b>`
        : "Start typing. The live check updates as you write.";
      return hits;
    };

    const renderReveal = () => {
      const open = !!st.revealed[part.label];
      revealBox.hidden = !open;
      revealBtn.textContent = open ? "Hide model answer" : "Check against model answer";
      if (!open) return;
      const autoHits = part.points.map((p) => pointDetected(p, ta.value));
      const ticks = partTicks(q, part);
      revealBox.innerHTML = `
        <div class="checklist"><h4>Marking scheme: tick what your answer really covers</h4>
          ${part.points.map((p, i) => `<label><input type="checkbox" data-i="${i}" ${ticks[i] ? "checked" : ""}>
            <span>${escHtml(p.text)}${autoHits[i] ? '<span class="auto">found</span>' : ""}</span><span class="pm">${p.marks}</span></label>`).join("")}
          <div class="tot"><span>Your marks</span><span class="tot-val">${partScore(q, part)} / ${partMarks(part)}</span></div>
        </div>
        <div class="model"><h4>Model answer</h4>${part.model}</div>
        ${part.modelFigure ? renderPlot(part.modelFigure) : ""}`;
      revealBox.querySelectorAll(".checklist input").forEach((cb) => {
        cb.addEventListener("change", () => {
          st.ticks[part.label] = [...revealBox.querySelectorAll(".checklist input")].map((c) => c.checked);
          revealBox.querySelector(".tot-val").textContent = `${partScore(q, part)} / ${partMarks(part)}`;
          saveEssaysSoon(); renderEssayTotal(q);
        });
      });
    };

    ta.addEventListener("input", () => {
      st.drafts[part.label] = ta.value;
      if (!st.ticks[part.label] && st.revealed[part.label]) renderReveal();
      updateMeter(); saveEssaysSoon(); renderEssayTotal(q);
    });
    revealBtn.addEventListener("click", () => {
      st.revealed[part.label] = !st.revealed[part.label];
      renderReveal(); saveEssaysSoon(); renderEssayTotal(q);
    });
    el.querySelector(".clear-btn").addEventListener("click", () => {
      if (ta.value && !confirm("Clear your answer for this part?")) return;
      ta.value = ""; st.drafts[part.label] = ""; delete st.ticks[part.label];
      updateMeter(); renderReveal(); saveEssaysSoon(); renderEssayTotal(q);
    });

    updateMeter();
    renderReveal();
  });

  renderEssayTotal(q);
  $("essay-list-screen").hidden = true;
  $("essay-screen").hidden = false;
  window.scrollTo({ top: 0 });
}

function renderEssayTotal(q) {
  const el = $("essay-total");
  if (!el) return;
  const pr = questionProgress(q);
  const total = questionMarks(q);
  el.innerHTML = pr.revealed
    ? `<span>Marked: ${pr.scored} / ${pr.possible} <small>(${pr.revealed} of ${q.parts.length} parts checked)</small></span><span>${total} marks total</span>`
    : `<span>${q.parts.length} part${q.parts.length > 1 ? "s" : ""} · ${total} marks</span><small>Answer each part, then check it against the model answer</small>`;
}

$("essay-back").addEventListener("click", () => {
  $("essay-screen").hidden = true;
  $("essay-list-screen").hidden = false;
  renderEssayList();
});

// Restore last tab
try { if (localStorage.getItem("aml-tab") === "essay") document.querySelector('.tab[data-tab="essay"]').click(); } catch (e) { /* ignore */ }
