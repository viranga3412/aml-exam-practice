// Structured / essay questions taken from the real IT 5504 past papers shared in the
// class group (April 2021 paper, and the Q1–Q3 practice set). Figures are redrawn as
// SVG from the original data so they stay sharp.
//
// Each part has marking points. A point is "detected" in the student's answer when every
// group in `kw` has at least one regex that matches (case-insensitive). This gives the
// live coverage meter while typing; the student then confirms marks against the model
// answer, because keyword matching can't judge reasoning on its own.

const SPAM_B0 = -1.489, SPAM_B1 = 0.340; // MLE fit to Kamal's 14 e-mails (matches Figure 01)
const spamCurve = (x) => 1 / (1 + Math.exp(-(SPAM_B0 + SPAM_B1 * x)));

const EXAM_ESSAYS = [
  // ------------------------------------------------------------------ Logistic regression
  {
    id: "pq-logreg-spam",
    source: "Practice set · Question 01",
    topic: "logistic-regression",
    title: "Spam filter from the count of 'x' characters",
    stem: `Kamal is building a spam filter. His hypothesis is that counting the occurrences of the letter ‘x’ in an e-mail is a good indicator of spam. He collects 7 spam and 7 no-spam messages and counts the x's in each:
<ul><li>Spam: [0, 3, 4, 8, 9, 13, 21]</li><li>No-spam: [0, 0, 1, 2, 2, 5, 6]</li></ul>
He trains a logistic regression classifier on the data and plots it against the data (Figure 01).`,
    figure: {
      xlim: [-1, 22], ylim: [-0.05, 1.05], xticks: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22], yticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      xlabel: "Number of x-s", ylabel: "Spam probability", caption: "Figure 01: logistic regression model output", width: 460, height: 320,
      series: [
        { kind: "line", fn: spamCurve, from: -0.5, to: 21.5, color: "var(--series-1)", label: "model P(spam | x)" },
        { kind: "scatter", marker: "x", points: [[0, 1], [3, 1], [4, 1], [8, 1], [9, 1], [13, 1], [21, 1]], color: "var(--series-3)", label: "spam" },
        { kind: "scatter", points: [[0, 0], [0, 0.04], [1, 0], [2, 0], [2, 0.04], [5, 0], [6, 0]], color: "var(--series-2)", label: "no-spam" },
      ],
    },
    parts: [
      {
        label: "a", marks: 5,
        q: "Consider an e-mail with no ‘x’-s. According to the model, what is the probability of this message being spam, and of it not being spam?",
        points: [
          { marks: 3, text: "Reads P(spam | 0 x's) ≈ 0.18 (anything 0.15–0.2) off the curve", kw: [["0?\\.1[5-9]", "0?\\.2\\b", "1[5-9] ?%", "20 ?%"]] },
          { marks: 2, text: "P(not spam) = 1 − P(spam) ≈ 0.82", kw: [["0?\\.8[0-5]", "8[0-5] ?%", "1 ?[-−] ?p"]] },
        ],
        model: `Read the curve at x = 0: <b>P(spam) ≈ 0.18</b>. The two outcomes are complementary, so <b>P(not spam) = 1 − 0.18 ≈ 0.82</b>.`,
      },
      {
        label: "b", marks: 5,
        q: "How many x-s must an e-mail contain to guarantee it is spam?",
        points: [
          { marks: 3, text: "No finite number guarantees it — the sigmoid only approaches 1 asymptotically", kw: [["no (finite )?number", "never", "cannot", "can't", "not possible", "impossible", "no guarantee"], ["1|one|asymptot|approach|never reach"]] },
          { marks: 2, text: "Notes that by ~21 x's the model is ≈ 0.99+ (very likely, still not certain)", kw: [["0?\\.99", "99 ?%", "21", "20"]] },
        ],
        model: `None. The logistic (sigmoid) function σ(z) = 1 / (1 + e<sup>−z</sup>) gets close to 1 but never reaches it for any finite input, so the model never gives a probability of exactly 1. Even at 21 x's it gives P(spam) ≈ 0.997: very likely, but not guaranteed. The data also shows a spam message with 0 x's, so the count alone can never make the decision certain.`,
      },
      {
        label: "c", marks: 10,
        q: "How does a logistic regression model normally turn into a binary classifier? If you turn the model into a classifier in this way, what is its accuracy on the training data?",
        points: [
          { marks: 3, text: "Apply a decision threshold of 0.5 on the predicted probability", kw: [["threshold", "cut-?off", "0?\\.5", "50 ?%"]] },
          { marks: 2, text: "Curve crosses 0.5 at x ≈ 4.4, so predict spam when x ≥ 5", kw: [["4\\.[3-5]", "x ?(>=|≥|>) ?4", "x ?(>=|≥) ?5", "5 or more", "more than 4", "at least 5"]] },
          { marks: 2, text: "Counts errors: spam with 0, 3, 4 missed; no-spam with 5, 6 flagged", kw: [["5", "6"], ["0", "3", "4"]] },
          { marks: 3, text: "Accuracy = 9/14 ≈ 64%", kw: [["9 ?/ ?14", "64(\\.\\d)? ?%", "0?\\.64"]] },
        ],
        model: `Use a <b>threshold of 0.5</b>: predict spam when P(spam | x) ≥ 0.5, otherwise no-spam. The curve crosses 0.5 at about x ≈ 4.4, so the rule is <b>spam if x ≥ 5</b>.
<table class="q-data-table"><tr><th></th><th>Correct</th><th>Wrong</th></tr>
<tr><th>Spam (7)</th><td>8, 9, 13, 21 → 4</td><td>0, 3, 4 → 3 (FN)</td></tr>
<tr><th>No-spam (7)</th><td>0, 0, 1, 2, 2 → 5</td><td>5, 6 → 2 (FP)</td></tr></table>
Accuracy = (4 + 5) / 14 = <b>9/14 ≈ 64.3%</b>.`,
      },
      {
        label: "d", marks: 10,
        q: "It is most important that no no-spam is classified as spam. How can this goal be described in terms of precision and recall? How can the classifier be modified to try to achieve it?",
        points: [
          { marks: 3, text: "Goal = no false positives = maximise precision (precision = 1 for the spam class)", kw: [["precision"], ["high|max|1\\b|100|false positive|fp"]] },
          { marks: 2, text: "Accepts that recall will drop (trade-off)", kw: [["recall"], ["drop|lower|decrease|reduc|trade|sacrific|cost"]] },
          { marks: 3, text: "Raise the threshold above 0.5 — above P(6) ≈ 0.64, i.e. spam only when x ≥ 7", kw: [["raise|increase|higher|move"], ["threshold|cut-?off"]] },
          { marks: 2, text: "Works it through: precision 4/4 = 1, recall 4/7 ≈ 57% (or mentions class weights / cost-sensitive loss)", kw: [["4 ?/ ?7", "57", "4 ?/ ?4", "class weight", "cost"]] },
        ],
        model: `"No no-spam classified as spam" means <b>zero false positives</b> for the spam class, which is <b>precision = TP / (TP + FP) = 1</b>. We accept a lower <b>recall</b> (some spam gets through) in exchange.
<br><br>To get there, <b>raise the decision threshold</b>. The highest-scoring no-spam e-mail has x = 6, with P(spam) ≈ 0.64, so any threshold above that (say 0.7, which means spam only when x ≥ 7) gives:
<ul><li>TP = 4 (8, 9, 13, 21), FP = 0 → <b>precision = 4/4 = 1.0</b></li><li>FN = 3 → <b>recall = 4/7 ≈ 0.57</b></li></ul>
You could also use a cost-sensitive loss or class weights that penalise false positives more heavily.`,
      },
    ],
  },

  {
    id: "pq-2021-q2c",
    source: "April 2021 paper · Question 02 (c)",
    topic: "logistic-regression",
    title: "Odds and a logistic model for an energy-drink commercial study",
    stem: `A study compared two energy-drink commercials. Each participant watched commercials A and B in random order and picked the better one. 140 women and 130 men took part. Commercial A was chosen by 65 women and 67 men.`,
    table: { headers: ["", "Chose A", "Chose B", "Total"], rows: [["Women", 65, 75, 140], ["Men", 67, 63, 130]], caption: "Counts derived from the question" },
    parts: [
      {
        label: "i", marks: 4,
        q: "Find the odds of selecting Commercial A for the men. Do the same for the women.",
        points: [
          { marks: 2, text: "Men: 67/63 ≈ 1.06", kw: [["67 ?/ ?63", "1\\.06"]] },
          { marks: 2, text: "Women: 65/75 ≈ 0.87", kw: [["65 ?/ ?75", "0?\\.86", "0?\\.87", "13 ?/ ?15"]] },
        ],
        model: `Odds = P(A) / P(not A) = (number who chose A) / (number who chose B).
<ul><li>Men: 67 / (130 − 67) = 67 / 63 ≈ <b>1.063</b></li><li>Women: 65 / (140 − 65) = 65 / 75 ≈ <b>0.867</b></li></ul>`,
      },
      {
        label: "ii", marks: 4,
        q: "Find the estimates of the best-fitted logistic model log(odds) = b₀ + b₁X.",
        points: [
          { marks: 1, text: "Defines X (e.g. X = 1 for men, 0 for women)", kw: [["x ?= ?1|x ?= ?0|dummy|indicator|encod"]] },
          { marks: 2, text: "b₀ = ln(65/75) ≈ −0.143", kw: [["-? ?0?\\.14", "ln ?\\(?65 ?/ ?75", "log ?\\(?65 ?/ ?75", "ln ?\\(?0?\\.86", "log ?\\(?0?\\.86"]] },
          { marks: 1, text: "b₁ = ln(odds ratio) = ln(1.227) ≈ 0.205", kw: [["0?\\.20[45]", "0?\\.2\\b", "1\\.22", "odds ratio"]] },
        ],
        model: `Let <b>X = 1 for men, X = 0 for women</b>. With a single binary predictor, the fitted logistic model reproduces the observed log-odds exactly:
<ul><li>Women (X = 0): b₀ = ln(65/75) = ln(0.867) ≈ <b>−0.143</b></li>
<li>Men (X = 1): b₀ + b₁ = ln(67/63) ≈ 0.0616 → b₁ = ln(1.063 / 0.867) = ln(1.227) ≈ <b>0.205</b></li></ul>
So log(odds) = −0.143 + 0.205X. Being male multiplies the odds of choosing A by e<sup>0.205</sup> ≈ 1.23 (this is the odds ratio). If you code women as 1, the signs swap: b₀ ≈ 0.062, b₁ ≈ −0.205.`,
      },
    ],
  },

  // ------------------------------------------------------------------ SVM
  {
    id: "pq-svm-kernel",
    source: "Practice set · Question 03",
    topic: "svm",
    title: "Kernel mapping (x₁, x₂) → (x₁², x₁x₂) and the widest-margin classifier",
    stem: `A two-class classification problem in ℝ² has the training set in Table 01. Consider the nonlinear kernel mapping from input space to a two-dimensional feature space given by <b>(x₁, x₂) → (x₁², x₁x₂)</b>.`,
    table: { headers: ["x₁", "x₂", "Class"], rows: [[-2, -2, "A"], [-2, -1, "A"], [1, 2, "A"], [2, 1, "A"], [-2, 2, "B"], [0, 2, "B"], [0, -1, "B"], [2, -1, "B"]], caption: "Table 01: Input space" },
    parts: [
      {
        label: "a", marks: 5,
        q: "Plot the training patterns in input space and label them by class. Are the two classes linearly separable in this space?",
        points: [
          { marks: 2, text: "Correct plot: A in quadrants I and III, B in quadrants II/IV and on the x₂-axis", kw: [["quadrant|diagonal|plot|xor"]] },
          { marks: 3, text: "States NOT linearly separable, with a reason (XOR-like pattern; hulls overlap)", kw: [["not (linearly )?separable", "non-?(linearly )?separable", "inseparable", "cannot be separated", "can't be separated"]] },
        ],
        model: `Class A sits in quadrants I and III (where x₁x₂ &gt; 0). Class B sits in quadrants II and IV, or on the x₂-axis (where x₁x₂ ≤ 0). This is an XOR-like layout, so the classes are <b>not linearly separable</b>. For example, the segment from A(−2,−2) to A(2,1) crosses x₁ = 0 at (0, −0.5), and that point lies on the segment between B(0,−1) and B(0,2). The convex hulls overlap, so no straight line can separate them.`,
        modelFigure: {
          xlim: [-3, 3], ylim: [-3, 3], xticks: [-3, -2, -1, 0, 1, 2, 3], yticks: [-3, -2, -1, 0, 1, 2, 3], xlabel: "x₁", ylabel: "x₂", caption: "Input space: not linearly separable", width: 340, height: 320,
          series: [
            { kind: "scatter", marker: "+", points: [[-2, -2], [-2, -1], [1, 2], [2, 1]], color: "var(--series-1)", label: "Class A", size: 7 },
            { kind: "scatter", points: [[-2, 2], [0, 2], [0, -1], [2, -1]], color: "var(--series-2)", label: "Class B" },
          ],
        },
      },
      {
        label: "b", marks: 5,
        q: "Plot, separately, the training patterns in feature space and label them by class.",
        points: [
          { marks: 3, text: "Correct mapped points: A → (4,4), (4,2), (1,2), (4,2); B → (4,−4), (0,0), (0,0), (4,−2)", kw: [["\\(?4 ?, ?4\\)?"], ["\\(?1 ?, ?2\\)?"], ["\\(?4 ?, ?-2\\)?|\\(?4 ?, ?−2\\)?"]] },
          { marks: 2, text: "Notes duplicates collapse ((0,2) and (0,−1) both → (0,0); (−2,−1) and (2,1) both → (4,2))", kw: [["same|duplicate|overlap|coincide|both map|collapse"]] },
        ],
        model: `Compute z = (x₁², x₁x₂) for each point:
<table class="q-data-table"><tr><th>Input</th><th>Class</th><th>z₁ = x₁²</th><th>z₂ = x₁x₂</th></tr>
<tr><td>(−2,−2)</td><td>A</td><td>4</td><td>4</td></tr><tr><td>(−2,−1)</td><td>A</td><td>4</td><td>2</td></tr>
<tr><td>(1,2)</td><td>A</td><td>1</td><td>2</td></tr><tr><td>(2,1)</td><td>A</td><td>4</td><td>2</td></tr>
<tr><td>(−2,2)</td><td>B</td><td>4</td><td>−4</td></tr><tr><td>(0,2)</td><td>B</td><td>0</td><td>0</td></tr>
<tr><td>(0,−1)</td><td>B</td><td>0</td><td>0</td></tr><tr><td>(2,−1)</td><td>B</td><td>4</td><td>−2</td></tr></table>
Two B points land on (0,0) and two A points land on (4,2). Every A point now has z₂ ≥ 2 and every B point has z₂ ≤ 0, so the classes are linearly separable in feature space.`,
        modelFigure: {
          xlim: [-1, 5], ylim: [-5, 5], xticks: [-1, 0, 1, 2, 3, 4, 5], yticks: [-4, -2, 0, 2, 4], xlabel: "z₁ = x₁²", ylabel: "z₂ = x₁x₂", caption: "Feature space", width: 340, height: 320,
          series: [
            { kind: "scatter", marker: "+", points: [[4, 4], [4, 2, "×2"], [1, 2]], color: "var(--series-1)", label: "Class A", size: 7 },
            { kind: "scatter", points: [[4, -4], [0, 0, "×2"], [4, -2]], color: "var(--series-2)", label: "Class B" },
          ],
        },
      },
      {
        label: "c", marks: 10,
        q: "Find the widest-margin classifier in feature space: give the equations of the classification boundary and the two margin boundaries, plot them on the feature-space graph, and indicate the support vectors.",
        points: [
          { marks: 2, text: "Identifies the closest pair across classes: A(1,2) and B(0,0), distance √5", kw: [["\\(?1 ?, ?2\\)?"], ["\\(?0 ?, ?0\\)?|origin"]] },
          { marks: 3, text: "Boundary z₁ + 2z₂ = 2.5 (⇔ 0.4z₁ + 0.8z₂ − 1 = 0)", kw: [["2\\.5|5 ?/ ?2|0?\\.4 ?z|0?\\.8 ?z|\\+ ?2 ?z"]] },
          { marks: 2, text: "Margins z₁ + 2z₂ = 5 (class A) and z₁ + 2z₂ = 0 (class B)", kw: [["= ?5\\b"], ["= ?0\\b"]] },
          { marks: 2, text: "Support vectors: (1,2) [from x=(1,2)] and (0,0) [from (0,2), (0,−1)]; (4,−2) also lies on the margin", kw: [["support vector"]] },
          { marks: 1, text: "Margin width 2/‖w‖ = √5 ≈ 2.24 (wider than the horizontal z₂ = 1 line, width 2)", kw: [["√ ?5|sqrt ?\\(?5|2\\.2[34]"]] },
        ],
        model: `The widest margin is set by the closest pair of points across the two convex hulls. That pair is <b>A(1,2)</b> and <b>B(0,0)</b>, at distance √5 ≈ 2.24. (A tempting answer is the horizontal line z₂ = 1, but its margin width is only 2.)
<br><br>The boundary is the perpendicular bisector of that pair. Its normal is w ∝ (1, 2) and it passes through the midpoint (0.5, 1):
<ul><li><b>Decision boundary:</b> z₁ + 2z₂ = 2.5. In canonical form, w = (0.4, 0.8) and b = −1, so 0.4z₁ + 0.8z₂ − 1 = 0.</li>
<li><b>Margin, class A side (w·z + b = +1):</b> z₁ + 2z₂ = 5</li>
<li><b>Margin, class B side (w·z + b = −1):</b> z₁ + 2z₂ = 0</li></ul>
Check: the A points give 12, 8, 5 (all ≥ 5) and the B points give −4, 0, 0 (all ≤ 0), so no point falls inside the margin. Margin width = 2/‖w‖ = 2/√0.8 = √5 ≈ 2.24.
<br><br><b>Support vectors:</b> z = (1,2), from input (1,2), and z = (0,0), from inputs (0,2) and (0,−1). The point z = (4,−2), from input (2,−1), also lies exactly on the B margin, with dual weight α = 0. In input space the boundary is the curve x₁² + 2x₁x₂ = 2.5.`,
        modelFigure: {
          xlim: [-1, 5], ylim: [-5, 5], xticks: [-1, 0, 1, 2, 3, 4, 5], yticks: [-4, -2, 0, 2, 4], xlabel: "z₁ = x₁²", ylabel: "z₂ = x₁x₂", caption: "Max-margin boundary (solid) and margins (dashed); support vectors ringed", width: 360, height: 330,
          series: [
            { kind: "line", fn: (z) => (2.5 - z) / 2, color: "var(--ink)", label: "z₁ + 2z₂ = 2.5" },
            { kind: "line", fn: (z) => (5 - z) / 2, color: "var(--series-1)", dash: true, label: "z₁ + 2z₂ = 5" },
            { kind: "line", fn: (z) => -z / 2, color: "var(--series-2)", dash: true, label: "z₁ + 2z₂ = 0" },
            { kind: "scatter", marker: "+", points: [[4, 4], [4, 2], [1, 2]], color: "var(--series-1)", size: 7 },
            { kind: "scatter", points: [[4, -4], [0, 0], [4, -2]], color: "var(--series-2)" },
            { kind: "scatter", marker: "ring", points: [[1, 2], [0, 0]], color: "var(--warn)", label: "support vectors" },
          ],
        },
      },
      {
        label: "d", marks: 10,
        q: "By comparing the graphs in (a) and (b), discuss whether there is an advantage in applying the kernel transformation for classifying the input space.",
        points: [
          { marks: 3, text: "Yes — non-separable data becomes linearly separable in feature space", kw: [["separable"], ["feature space|after|transform|mapp"]] },
          { marks: 3, text: "A linear boundary in feature space = nonlinear boundary in input space (x₁² + 2x₁x₂ = 2.5)", kw: [["non-?linear|curve|conic|quadratic|hyperbola"]] },
          { marks: 2, text: "Kernel trick: compute K(x,x') = φ(x)·φ(x') without mapping explicitly", kw: [["kernel trick|dot product|inner product|k ?\\(x"]] },
          { marks: 2, text: "Caveats: choosing the right kernel; risk of overfitting; points can collide (information lost)", kw: [["overfit|choice of kernel|choose|collid|lose|lost|cost"]] },
        ],
        model: `<b>Yes, there is an advantage.</b> In input space the classes form an XOR-like pattern that no line can separate. After the mapping, they split cleanly along z₂ = x₁x₂, which is just the sign of the product x₁x₂, and a maximum-margin linear SVM can be trained on them.
<ul><li>A linear boundary in feature space, z₁ + 2z₂ = 2.5, is a <b>nonlinear boundary in input space</b>, x₁² + 2x₁x₂ = 2.5. So the linear SVM learns a curved decision rule.</li>
<li>With the <b>kernel trick</b>, the SVM only needs inner products K(x, x') = φ(x)·φ(x') = x₁²x₁'² + x₁x₂x₁'x₂'. It never has to build the feature vectors explicitly, which is what makes very high-dimensional mappings practical.</li>
<li>Caveats: the right kernel has to be chosen (through cross-validation), and a very flexible kernel can overfit. This map is not one-to-one either: (0,2) and (0,−1) collapse to the same point, so some information is lost. Here that is harmless because both points are class B.</li></ul>`,
      },
    ],
  },

  {
    id: "pq-2021-q3",
    source: "April 2021 paper · Question 03 (b), (c)",
    topic: "svm",
    title: "Maximum-margin hyperplane by hand",
    stem: `Consider the following training data.`,
    table: { headers: ["Class", "x₁", "x₂"], rows: [["+", 1, 1], ["+", 2, 2], ["+", 2, 0], ["−", 0, 0], ["−", 1, 0], ["−", 0, 1]] },
    parts: [
      {
        label: "i", marks: 3,
        q: "Plot the data and check whether it is linearly separable.",
        points: [{ marks: 3, text: "Yes, linearly separable (e.g. by x₁ + x₂ = 1.5)", kw: [["(is |are )?(linearly )?separable", "yes"]] }],
        model: `<b>Yes.</b> Every negative point has x₁ + x₂ ≤ 1 and every positive point has x₁ + x₂ ≥ 2, so for example the line x₁ + x₂ = 1.5 separates them.`,
        modelFigure: {
          xlim: [-0.5, 2.5], ylim: [-0.5, 2.5], xticks: [0, 0.5, 1, 1.5, 2, 2.5], yticks: [0, 0.5, 1, 1.5, 2, 2.5], xlabel: "x₁", ylabel: "x₂", caption: "Maximum-margin hyperplane x₁ + x₂ = 1.5 (solid), margins dashed", width: 340, height: 320,
          series: [
            { kind: "line", fn: (x) => 1.5 - x, color: "var(--ink)", label: "x₁ + x₂ = 1.5" },
            { kind: "line", fn: (x) => 2 - x, color: "var(--series-1)", dash: true },
            { kind: "line", fn: (x) => 1 - x, color: "var(--series-2)", dash: true },
            { kind: "scatter", marker: "+", points: [[1, 1], [2, 2], [2, 0]], color: "var(--series-1)", label: "+", size: 7 },
            { kind: "scatter", points: [[0, 0], [1, 0], [0, 1]], color: "var(--series-2)", label: "−" },
            { kind: "scatter", marker: "ring", points: [[1, 1], [2, 0], [1, 0], [0, 1]], color: "var(--warn)", label: "support vectors" },
          ],
        },
      },
      {
        label: "ii", marks: 5,
        q: "Construct the weight vector of the maximum-margin hyperplane and identify the support vectors.",
        points: [
          { marks: 2, text: "Hyperplane x₁ + x₂ = 1.5", kw: [["1\\.5|3 ?/ ?2"]] },
          { marks: 2, text: "Canonical w = (2, 2), b = −3 (margin 2/‖w‖ = 1/√2 ≈ 0.707)", kw: [["\\(? ?2 ?, ?2 ?\\)?|w ?= ?\\[?2", "b ?= ?-? ?3|−3", "0?\\.707|1 ?/ ?√ ?2"]] },
          { marks: 1, text: "Support vectors (1,1), (2,0), (1,0), (0,1)", kw: [["support"], ["\\(1 ?, ?1\\)"], ["\\(1 ?, ?0\\)|\\(0 ?, ?1\\)"]] },
        ],
        model: `The closest points across the classes are the + points (1,1) and (2,0), which lie on x₁ + x₂ = 2, and the − points (1,0) and (0,1), which lie on x₁ + x₂ = 1. The boundary runs halfway between them: <b>x₁ + x₂ = 1.5</b>.
<br><br>In canonical form we need w·x + b = +1 on the + margin and −1 on the − margin, with w ∝ (1,1). That gives <b>w = (2, 2), b = −3</b>. Check: at (1,1), 2 + 2 − 3 = 1, and at (1,0), 2 − 3 = −1.
<br>Margin width = 2/‖w‖ = 2/(2√2) = <b>1/√2 ≈ 0.707</b>.
<br><b>Support vectors:</b> (1,1), (2,0), (1,0) and (0,1).`,
      },
      {
        label: "iii", marks: 3,
        q: "If you remove one of the support vectors, does the size of the optimal margin decrease, stay the same, or increase?",
        points: [{ marks: 3, text: "Stays the same here (another SV on each side still pins it); in general it can only stay the same or increase", kw: [["same|unchanged|not change|doesn't change|does not change"]] }],
        model: `Here it <b>stays the same</b>. Each side has two support vectors on its margin line, so removing one still leaves a point on that side holding the margin at the same place. For example, after removing (1,1), the point (2,0) still lies on x₁ + x₂ = 2.`,
      },
      {
        label: "iv", marks: 3,
        q: "Is your answer to (iii) true for any dataset? Give a counterexample or a short proof.",
        points: [
          { marks: 1, text: "No — the margin may increase (never decrease)", kw: [["increase|larger|wider|grow"]] },
          { marks: 2, text: "Proof: removing a point removes a constraint, so the feasible set grows and the optimum can't get worse; counterexample: unique SV on one side", kw: [["constraint|feasible|optimi"]] },
        ],
        model: `<b>Not in general.</b> The margin can never <i>decrease</i>, but it can <i>increase</i>.
<br><b>Proof:</b> each training point adds one constraint y<sub>i</sub>(w·x<sub>i</sub> + b) ≥ 1. Removing a point removes a constraint, so the feasible set gets larger, and the minimum of ‖w‖ can only stay the same or go down. That means the margin 2/‖w‖ stays the same or goes up.
<br><b>Counterexample showing it can increase:</b> take + at (2,0) and − at (0,0) and (−1,0). The margin is set by (2,0) and (0,0) and has width 2. Remove (0,0) and the closest − point becomes (−1,0), so the margin grows to 3.`,
      },
      {
        label: "c", marks: 6,
        q: "Is the linear separable (hard-margin) SVM always applicable when there is noise in the training data? If not, how can SVM be modified to deal with noisy data?",
        points: [
          { marks: 2, text: "No — a single noisy/mislabelled point can make the data non-separable or drastically shrink the margin", kw: [["no|not"], ["noise|outlier|mislabel|infeasible|no solution|non-?separable"]] },
          { marks: 2, text: "Soft-margin SVM with slack variables ξᵢ: yᵢ(w·xᵢ + b) ≥ 1 − ξᵢ, ξᵢ ≥ 0", kw: [["soft"], ["slack|ξ|xi"]] },
          { marks: 2, text: "Objective ½‖w‖² + C Σξᵢ; C trades margin width vs training errors (choose by CV)", kw: [["\\bc\\b|penalty|regulari"]] },
        ],
        model: `<b>No.</b> The hard-margin SVM requires every point to satisfy y<sub>i</sub>(w·x<sub>i</sub> + b) ≥ 1. A single mislabelled point or outlier can make the problem <b>infeasible</b> (no separating hyperplane exists). Even when a solution exists, one such point can drag the boundary and shrink the margin a lot.
<br><br><b>Fix: the soft-margin SVM.</b> Add slack variables ξ<sub>i</sub> ≥ 0 and relax the constraints to y<sub>i</sub>(w·x<sub>i</sub> + b) ≥ 1 − ξ<sub>i</sub>. Then minimise ½‖w‖² + C Σξ<sub>i</sub>.
<ul><li>Large C: few violations allowed, so a narrow margin and a risk of overfitting.</li><li>Small C: a wider margin that tolerates noise, with a risk of underfitting.</li></ul>
Choose C by cross-validation. A nonlinear kernel can also help when the noise comes from a curved true boundary.`,
      },
    ],
  },

  // ------------------------------------------------------------------ Evaluation / experimental design
  {
    id: "pq-experiments",
    source: "Practice set · Question 02 (a), (b)",
    topic: "evaluation-and-general",
    title: "Regularisation, and spotting broken experimental setups",
    stem: `Training finds the weights that minimise a loss L, i.e. ŵ = argmax<sub>w</sub>(−L(X, t, w)). In L2 regularisation the objective becomes −L(X, t, w) − α‖w‖².`,
    parts: [
      {
        label: "a", marks: 10,
        q: "(i) Why does one apply regularisation, and what does it achieve? (ii) How is α determined?",
        points: [
          { marks: 3, text: "Prevents overfitting / improves generalisation", kw: [["overfit|generali"]] },
          { marks: 2, text: "Penalises large weights → smoother, lower-variance model (bias–variance trade-off)", kw: [["large weight|small(er)? weight|shrink|penal|variance|complex"]] },
          { marks: 1, text: "Also stabilises ill-conditioned / collinear problems (XᵀX + αI invertible)", kw: [["collinear|invert|ill-?condition|stab|singular"]] },
          { marks: 4, text: "α is a hyperparameter chosen on validation data / cross-validation (grid search) — never on the test set", kw: [["cross-?validation|validation"]] },
        ],
        model: `<b>(i)</b> Regularisation is used to <b>prevent overfitting</b>. The penalty α‖w‖² discourages large weights, which keeps the model smoother and simpler. Variance drops at the cost of a little bias, so the model <b>generalises better</b> to unseen data. It also makes ill-conditioned or collinear problems stable: in ridge regression, XᵀX + αI is always invertible.
<br><b>(ii)</b> α is a <b>hyperparameter</b>, so it is not learned with the weights. Try a grid of values (for example 10⁻⁴ … 10²), measure the error on a <b>validation set or with k-fold cross-validation</b>, and pick the α with the lowest validation error. Then retrain on all the training data with that α and report on the untouched test set. Tuning α on the test set would leak information.`,
      },
      {
        label: "b", marks: 20,
        q: `For each setup, say whether it is OK or problematic, and state all the problems:<br>
(i) A team reports a low <i>training</i> error and claims their method is good.<br>
(ii) A team claims great success with 98% accuracy on a rare-class task (fraud) with 50 positive and 5000 negative examples.<br>
(iii) A team splits into train/test, uses cross-validation on the training data to choose the best parameters, builds the model with those parameters on the training data, and reports the test error.<br>
(iv) A team does feature selection on the <i>full</i> data, then splits into train/test, tries several model settings and reports the <i>best test error</i>.<br>
(v) A project integer-encodes 4 bacteria classes labelled ‘Class A’, ‘Class B’, ‘Class C’; other features include pH and water quality; the model predicts water quality and they claim 65% accuracy is very good.`,
        points: [
          { marks: 4, text: "(i) Problematic: training error says nothing about generalisation — could be overfitting; need held-out/CV error", kw: [["\\(?i\\)?|first"], ["overfit|generali|unseen|test|held"]] },
          { marks: 4, text: "(ii) Problematic: always-negative baseline already gets 5000/5050 ≈ 99%, so 98% is worse than trivial; use precision/recall/F1/PR-AUC", kw: [["99|baseline|majority|trivial|always"], ["precision|recall|f1|pr-?auc|confusion"]] },
          { marks: 4, text: "(iii) OK — correct protocol (tuning only on training data, test used once)", kw: [["ok|correct|fine|valid|proper|no problem"]] },
          { marks: 4, text: "(iv) Problematic: feature selection on full data leaks test info, and picking the best test error over many settings tunes on the test set → optimistic", kw: [["leak|bias|optimistic"]] },
          { marks: 4, text: "(v) Problematic: nominal classes shouldn't be integer-encoded (use one-hot); 4 classes but 3 labels; target (water quality) used as a feature = leakage; 65% needs a baseline", kw: [["one-?hot|nominal|order"], ["leak|target|baseline|4 classes|three|3 labels"]] },
        ],
        model: `<b>(i) Problematic.</b> A low training error only shows the model fits the data it has already seen. It could be heavily overfitting. The team should report error on held-out test data or from cross-validation.
<br><b>(ii) Problematic.</b> A trivial model that always predicts "not fraud" gets 5000/5050 ≈ <b>99.0%</b>, so 98% is <i>worse than the baseline</i>. Accuracy is misleading on imbalanced data. Report the confusion matrix, precision, recall and F1 for the rare class, plus the PR-AUC, and use stratified splits.
<br><b>(iii) OK.</b> This is the correct protocol: hyperparameters are tuned with CV on the training data only, and the test set is used once for the final estimate.
<br><b>(iv) Problematic, for two reasons.</b> (1) Selecting features on the <i>full</i> data lets test-set information leak into the model. Selection must happen inside the training folds. (2) Reporting the <i>best</i> test error across several settings means the test set has been used for model selection, so the estimate is optimistically biased. Use a validation set or nested CV, and touch the test set once.
<br><b>(v) Problematic.</b> (1) Bacteria types are nominal categories. Integer encoding (A=1, B=2, C=3) invents an order and distances that don't exist, so use one-hot encoding instead. (2) The description is inconsistent: it says 4 classes but lists only 3 labels. (3) "Quality of water" is both a feature and the prediction target, which is target leakage. (4) A claim that 65% is very good means nothing without a baseline such as the majority-class rate and per-class metrics. With leakage present, 65% is actually poor.`,
      },
    ],
  },

  // ------------------------------------------------------------------ ML foundations / regression
  {
    id: "pq-2021-q1-tf",
    source: "April 2021 paper · Question 01",
    topic: "ml-foundations",
    title: "True or false — justify your answer",
    stem: `State whether each statement is true or false and justify your answer.`,
    parts: [
      {
        label: "a", marks: 4,
        q: "Non-monotonic numeric attributes will not affect the performance of the linear regression model.",
        points: [
          { marks: 1, text: "False", kw: [["false"]] },
          { marks: 3, text: "Linear model assumes a linear (monotonic) relationship; a U-shaped/non-monotonic effect can't be captured → need transformation, binning or basis functions", kw: [["linear"], ["transform|bin|basis|polynomial|squared|capture|u-?shape|curve"]] },
        ],
        model: `<b>False.</b> Linear regression gives each feature one slope, so the predicted effect of that feature is always monotonic. If the true relationship is non-monotonic (U-shaped, for example), a single slope cannot capture it, and the fit and predictions suffer. Fix it with feature engineering: polynomial or basis-function terms such as x², binning, or splines.`,
      },
      {
        label: "b", marks: 4,
        q: "Blurring an image before processing it through a machine learning model would generate high accuracies when the binary representation of the image is considered.",
        points: [
          { marks: 1, text: "False (not guaranteed)", kw: [["false|not (necessarily|always)|depends"]] },
          { marks: 3, text: "Blurring removes edges/fine detail which binarisation depends on; it can reduce noise, but accuracy depends on the task", kw: [["edge|detail|information|feature"], ["noise|threshold|depend|lose|lost"]] },
        ],
        model: `<b>False, or at best "not necessarily".</b> Blurring is a low-pass filter. It suppresses pixel noise, but it also smears edges and fine detail. When the image is then binarised (thresholded), those softened edges are exactly what gets lost or distorted, so discriminative shape information disappears. Light blurring can help with noisy inputs, but it never guarantees high accuracy, and the effect has to be checked on validation data.`,
      },
      {
        label: "c", marks: 4,
        q: "The problem of overfitting can be overcome using a large amount of data with Bayesian statistics.",
        points: [
          { marks: 1, text: "True (largely)", kw: [["true"]] },
          { marks: 3, text: "More data reduces variance; Bayesian priors act as regularisers (MAP ≈ penalised MLE) and averaging over the posterior avoids committing to one over-fitted parameter set", kw: [["prior|posterior|map|regulari"], ["data|variance|sample"]] },
        ],
        model: `<b>True (largely).</b> More data reduces the variance of the estimates, so overfitting shrinks. The Bayesian approach helps on top of that. The prior acts as a regulariser (a MAP estimate with a Gaussian prior is the same as L2-penalised MLE), and averaging predictions over the posterior avoids committing to a single over-fitted parameter setting. As the data grows, the likelihood dominates the prior. One caveat: overfitting caused by an over-complex model is reduced, not removed, so model complexity still matters.`,
      },
      {
        label: "d", marks: 4,
        q: "Computing maximum likelihood estimators for regression coefficients (closed form) would be more efficient than applying gradient descent when the feature space is very large.",
        points: [
          { marks: 1, text: "False", kw: [["false"]] },
          { marks: 3, text: "Closed form needs (XᵀX)⁻¹: O(d³) time, O(d²) memory — infeasible for large d; gradient descent costs O(nd) per iteration and scales", kw: [["invers|o\\(d|cubic|d\\^?3|d³|matrix"]] },
        ],
        model: `<b>False.</b> The closed-form MLE θ = (XᵀX)⁻¹Xᵀy needs a d × d matrix to be built and inverted, which takes about <b>O(nd² + d³)</b> time and O(d²) memory. That becomes infeasible when d is very large. XᵀX may also be singular. Gradient descent and SGD cost about O(nd) per iteration, never invert a matrix, and scale to large d.`,
      },
      {
        label: "e", marks: 4,
        q: "You observed overfitting in a regression model. The best thing to do to get a non-sparse solution is to use lasso regularisation.",
        points: [
          { marks: 1, text: "False", kw: [["false"]] },
          { marks: 3, text: "Lasso (L1) gives SPARSE solutions (sets coefficients to 0); for a non-sparse solution use ridge (L2)", kw: [["ridge|l2"]] },
        ],
        model: `<b>False.</b> Lasso (the L1 penalty) produces <b>sparse</b> solutions: its corner-shaped constraint region drives many coefficients exactly to zero. To reduce overfitting while keeping a <b>non-sparse</b> solution, use <b>ridge (L2)</b>, which shrinks every coefficient smoothly without zeroing any. Elastic net mixes the two.`,
      },
      {
        label: "f", marks: 5,
        q: "You trained a regression model with Gaussian basis functions. It is very likely to observe highly skewed negative coefficients if you have selected a higher-order polynomial model.",
        points: [
          { marks: 1, text: "False", kw: [["false"]] },
          { marks: 4, text: "An over-complex (overfitted) model gives LARGE-magnitude coefficients of both signs that cancel/oscillate — not specifically negative; regularisation shrinks them", kw: [["large|magnitude|huge|big"], ["both|positive|sign|oscillat|cancel"]] },
        ],
        model: `<b>False.</b> When a model is too complex (high-order polynomial, or many narrow Gaussian basis functions) and overfits, the typical sign is coefficients of <b>very large magnitude with alternating signs</b>. Big positive and big negative terms cancel each other to pass through every training point, and the curve swings wildly in between. Nothing makes the coefficients skew specifically negative. Regularisation (ridge) keeps them small.`,
      },
    ],
  },

  {
    id: "pq-2021-q2ab",
    source: "April 2021 paper · Question 02 (a), (b)",
    topic: "ml-foundations",
    title: "Gradient descent, OLS = MLE, and a geometric-distribution MLE",
    stem: `Answer the following.`,
    parts: [
      {
        label: "a-i", marks: 3,
        q: "Gradient descent is one of the parameter-estimation methods used in linear regression. What are its advantages?",
        points: [
          { marks: 1, text: "No matrix inversion; scales to large d / large n", kw: [["invers|large|scal"]] },
          { marks: 1, text: "Works for losses with no closed form (logistic, neural nets) and with regularisers", kw: [["closed|any loss|general|logistic|neural|non-?linear"]] },
          { marks: 1, text: "Stochastic / mini-batch / online updates; low memory", kw: [["stochastic|sgd|mini-?batch|online|memory|stream"]] },
        ],
        model: `<ul><li>It never inverts XᵀX (an O(d³) step), so it scales to many features and stays usable when XᵀX is singular or ill-conditioned.</li><li>It is general: it works for any differentiable loss that has no closed form, such as logistic regression, neural networks and many regularisers.</li><li>Stochastic or mini-batch variants handle huge or streaming data with little memory and can be updated online.</li></ul>`,
      },
      {
        label: "a-ii", marks: 2,
        q: "In ordinary least squares, under what assumption is θ = (XᵀX)⁻¹Xᵀy (which minimises the RSS) also the maximum-likelihood estimator?",
        points: [{ marks: 2, text: "Errors i.i.d. Gaussian with zero mean and constant variance", kw: [["gaussian|normal"], ["i\\.?i\\.?d|independent|zero mean|constant variance|same variance|homosced"]] }],
        model: `When the errors are <b>i.i.d. Gaussian with zero mean and constant variance</b>, so that y = Xθ + ε with ε ~ N(0, σ²I). The log-likelihood is then −(1/2σ²)·RSS plus a constant, and maximising it is the same as minimising the RSS.`,
      },
      {
        label: "b", marks: 5,
        q: "You have n i.i.d. data points {x₁ … xₙ} from P(x; θ) = θ(1 − θ)^(x−1), where 0 < θ < 1 is unknown. Find the maximum-likelihood estimator for θ.",
        points: [
          { marks: 1, text: "Log-likelihood n ln θ + (Σxᵢ − n) ln(1 − θ)", kw: [["ln|log"], ["sum|σ|Σ|∑"]] },
          { marks: 2, text: "Derivative n/θ − (Σxᵢ − n)/(1 − θ) = 0", kw: [["deriv|d ?/ ?dθ|= ?0|set"]] },
          { marks: 2, text: "θ̂ = n / Σxᵢ = 1 / x̄", kw: [["n ?/ ?(σ|Σ|∑|sum)", "1 ?/ ?(x̄|mean|x bar|xbar)"]] },
        ],
        model: `L(θ) = ∏ θ(1−θ)<sup>xᵢ−1</sup> = θ<sup>n</sup>(1−θ)<sup>Σxᵢ − n</sup>
<br>ℓ(θ) = n ln θ + (Σxᵢ − n) ln(1 − θ)
<br>dℓ/dθ = n/θ − (Σxᵢ − n)/(1 − θ) = 0 ⟹ n(1 − θ) = θ(Σxᵢ − n) ⟹ <b>θ̂ = n / Σxᵢ = 1 / x̄</b>
<br>The second derivative is negative, so this is a maximum. This is the geometric distribution: "the success probability is 1 / (mean number of trials)."`,
      },
      {
        label: "c", marks: 10,
        q: "The Pareto density f(x | x₀, θ) = θ x₀^θ x^(−θ−1), for x ≥ x₀ and θ > 1, is used in economics. Given x₀ > 0 and an i.i.d. sample X₁ … Xₙ, find the MLE of θ.",
        points: [
          { marks: 3, text: "ℓ(θ) = n ln θ + nθ ln x₀ − (θ + 1) Σ ln xᵢ", kw: [["ln|log"], ["x ?₀|x0|x_0"]] },
          { marks: 3, text: "dℓ/dθ = n/θ + n ln x₀ − Σ ln xᵢ = 0", kw: [["n ?/ ?θ|n ?/ ?theta"]] },
          { marks: 4, text: "θ̂ = n / Σ ln(xᵢ / x₀)", kw: [["n ?/ ?(σ|Σ|∑|sum)"], ["x ?₀|x0|x_0"]] },
        ],
        model: `ℓ(θ) = Σ [ln θ + θ ln x₀ − (θ+1) ln xᵢ] = n ln θ + nθ ln x₀ − (θ+1) Σ ln xᵢ
<br>dℓ/dθ = n/θ + n ln x₀ − Σ ln xᵢ = 0
<br>⟹ <b>θ̂ = n / Σᵢ ln(xᵢ / x₀)</b>
<br>d²ℓ/dθ² = −n/θ² &lt; 0, so this is a maximum.`,
      },
    ],
  },

  {
    id: "pq-2021-q4",
    source: "April 2021 paper · Question 04",
    topic: "ml-foundations",
    title: "Linear vs quadratic regression, regularisation choice, and Cauchy noise",
    stem: `We want to predict y from a single feature x using n &gt; 2 data points (yᵢ, xᵢ). Two models are estimated by ordinary least squares:
<br>Model 1: yᵢ = w₀ + w₁xᵢ + εᵢ &nbsp;&nbsp; Model 2: yᵢ = w₀ + w₁xᵢ + w₂xᵢ² + εᵢ
<br>The errors εᵢ are i.i.d. normal with zero mean.`,
    parts: [
      {
        label: "a-i", marks: 4,
        q: "Derive a formula for estimating w₁ in Model 2, assuming w₀ is known. Show your work.",
        points: [
          { marks: 1, text: "Minimise Σ(yᵢ − w₀ − w₁xᵢ − w₂xᵢ²)²", kw: [["minimi|rss|squared|sum"]] },
          { marks: 2, text: "Normal equations from ∂/∂w₁ = 0 and ∂/∂w₂ = 0", kw: [["partial|∂|deriv|normal equation"]] },
          { marks: 1, text: "w₁ = (S₁ᵧ S₄ − S₃ S₂ᵧ) / (S₂S₄ − S₃²)", kw: [["s ?4|σ ?x ?⁴|x\\^?4|x⁴"]] },
        ],
        model: `Let rᵢ = yᵢ − w₀ (known). Minimise E = Σ(rᵢ − w₁xᵢ − w₂xᵢ²)².
<br>∂E/∂w₁ = 0 ⟹ w₁Σxᵢ² + w₂Σxᵢ³ = Σxᵢrᵢ
<br>∂E/∂w₂ = 0 ⟹ w₁Σxᵢ³ + w₂Σxᵢ⁴ = Σxᵢ²rᵢ
<br>Write S<sub>k</sub> = Σxᵢ<sup>k</sup>, S₁ᵣ = Σxᵢrᵢ and S₂ᵣ = Σxᵢ²rᵢ. Solving the 2 × 2 system (Cramer's rule):
<br><b>ŵ₁ = (S₁ᵣ·S₄ − S₃·S₂ᵣ) / (S₂·S₄ − S₃²)</b>
<br>Under Gaussian errors this least-squares solution is also the MLE.`,
      },
      {
        label: "a-ii", marks: 3,
        q: "Will one model fit the training data better than the other, will they fit equally well, or is it impossible to say?",
        points: [{ marks: 3, text: "Model 2 fits training data at least as well (nested: setting w₂ = 0 recovers Model 1), so its training RSS ≤ Model 1's; usually strictly better. Says nothing about test error", kw: [["model 2|second|quadratic"], ["w ?₂ ?= ?0|w2 ?= ?0|nested|special case|at least|≤"]] }],
        model: `<b>Model 2 fits the training data at least as well.</b> The models are nested: setting w₂ = 0 in Model 2 gives back Model 1. OLS minimises the training RSS over a larger set of options, so RSS₂ ≤ RSS₁, and in practice it is almost always strictly smaller. They are equal only if the best ŵ₂ is exactly 0. This says nothing about <i>test</i> error: the extra term can overfit.`,
      },
      {
        label: "b", marks: 7,
        q: "The feature vectors are sparse, so the algebraic solution for the coefficients is hard to find. Describe the regularisation strategies available and which would be most ideal to generate the solution.",
        points: [
          { marks: 2, text: "Ridge (L2): adds λI → XᵀX + λI invertible, closed form exists", kw: [["ridge|l2"]] },
          { marks: 2, text: "Lasso (L1): sparse coefficients / feature selection; no closed form", kw: [["lasso|l1"]] },
          { marks: 1, text: "Elastic net combines both", kw: [["elastic"]] },
          { marks: 2, text: "Recommends ridge (or elastic net) because the problem is XᵀX being singular; λ chosen by CV", kw: [["ridge|elastic"], ["singular|invert|ill|recommend|best|ideal"]] },
        ],
        model: `With sparse features many columns are nearly empty, so <b>XᵀX is singular or ill-conditioned</b> and (XᵀX)⁻¹ does not exist or is unstable.
<ul><li><b>Ridge (L2), penalty λ‖w‖²:</b> θ = (XᵀX + λI)⁻¹Xᵀy. Adding λI makes the matrix invertible for any λ &gt; 0, so a closed-form solution always exists and is stable.</li>
<li><b>Lasso (L1), penalty λ‖w‖₁:</b> drives coefficients to exactly zero (feature selection). It has no closed form and needs coordinate descent.</li>
<li><b>Elastic net:</b> combines L1 and L2, which helps when features are correlated.</li></ul>
<b>Most ideal here: ridge</b>, because it directly fixes the non-invertibility and keeps a closed-form solution. Use elastic net if you also want sparsity. Tune λ by cross-validation.`,
      },
      {
        label: "c", marks: 6,
        q: "The noise is not well modelled by a normal density; instead use the Cauchy density p(x) = (1/βπ) · β² / ((x − α)² + β²). For weights w and m examples (xᵢ, yᵢ), with d-dimensional xᵢ, find an expression for the likelihood p(y | w). State your assumptions.",
        points: [
          { marks: 2, text: "Assumptions: yᵢ = wᵀxᵢ + εᵢ, εᵢ i.i.d. Cauchy(α, β), independent of x", kw: [["i\\.?i\\.?d|independent"]] },
          { marks: 3, text: "p(y|w) = ∏ (1/βπ) β² / ((yᵢ − wᵀxᵢ − α)² + β²)", kw: [["∏|prod|product"], ["y ?ᵢ? ?[-−] ?w|y_i ?- ?w|residual"]] },
          { marks: 1, text: "Log-likelihood: −m ln(βπ) + Σ ln β² − Σ ln((yᵢ − wᵀxᵢ − α)² + β²)", kw: [["log|ln"]] },
        ],
        model: `<b>Assumptions:</b> yᵢ = wᵀxᵢ + εᵢ (append a 1 to xᵢ for the bias term). The noise terms εᵢ are i.i.d. Cauchy(α, β) and independent of xᵢ, so the examples are conditionally independent given w.
<br><br><b>p(y | X, w) = ∏ᵢ₌₁<sup>m</sup> (1/(βπ)) · β² / ((yᵢ − wᵀxᵢ − α)² + β²)</b>
<br><br>log p = −m ln(βπ) + 2m ln β − Σᵢ ln((yᵢ − wᵀxᵢ − α)² + β²)
<br>Maximising this gives a <b>robust</b> regression: each residual's penalty grows only logarithmically, so outliers have far less influence than under squared loss.`,
      },
    ],
  },

  // ------------------------------------------------------------------ Bayesian
  {
    id: "pq-2021-q2d",
    source: "April 2021 paper · Question 02 (d)(i)",
    topic: "bayesian-naive-bayes",
    title: "Steps in the Bayesian learning procedure",
    stem: `Bayesian learning is one of the strategies for learning a model from data.`,
    parts: [
      {
        label: "i", marks: 4,
        q: "Describe the major steps in the Bayesian learning procedure.",
        points: [
          { marks: 1, text: "Specify model / likelihood p(D | θ)", kw: [["likelihood"]] },
          { marks: 1, text: "Choose a prior p(θ) encoding beliefs before seeing data", kw: [["prior"]] },
          { marks: 1, text: "Compute posterior p(θ | D) ∝ p(D | θ) p(θ) via Bayes' rule", kw: [["posterior"], ["bayes|∝|proportional|normali"]] },
          { marks: 1, text: "Predict by MAP or posterior predictive (average over θ); update as data arrives", kw: [["map|predict|predictive|update|integrat|average"]] },
        ],
        model: `<ol><li><b>Model and likelihood:</b> choose p(D | θ), which says how the data are generated given the parameters.</li>
<li><b>Prior:</b> choose p(θ) to express beliefs about θ before seeing data. A conjugate prior (for example Beta for a Bernoulli likelihood) keeps the maths simple.</li>
<li><b>Posterior via Bayes' rule:</b> p(θ | D) = p(D | θ) p(θ) / p(D), where p(D) = ∫p(D|θ)p(θ)dθ.</li>
<li><b>Inference and prediction:</b> use the MAP estimate argmax p(θ | D), or better, the posterior predictive p(x* | D) = ∫p(x* | θ)p(θ | D)dθ.</li>
<li><b>Update:</b> today's posterior becomes the prior when new data arrive.</li></ol>`,
      },
    ],
  },
];
