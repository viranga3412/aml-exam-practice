# Applied ML Exam Practice (IT 5504)

A static practice site for IT 5504 Applied Machine Learning:

- **MCQ practice**: 1,118 exam-style questions across 10 topics. In Instant mode each answer is marked the moment you click it. 77 of the questions include graphs or tables.
- **Structured & essay**: past-paper questions with redrawn graphs. A live marking-point check runs as you type, then you compare your answer with the model answer and correct your marks.

There is no build step. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

`questions.js` is generated from `source-by-topic/*.json` by `build_bank.py`. Progress is stored in the browser's localStorage.
