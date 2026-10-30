#!/usr/bin/env python3
"""Merge source-by-topic/*.json into questions.js for the exam-style MCQ bank
(1000+ questions, mimicking the real past-exam style, covering every topic
in the course including ones the earlier banks didn't: KNN, clustering,
boosting/XGBoost, MLOps, and calculation/graph-reading questions).

Re-run this any time a source-by-topic/*.json file changes (edit the source
JSON, not questions.js directly -- questions.js is generated).

What it does:
  1. Loads every source-by-topic/*.json, validates each question has exactly 4
     options and correct == 0 (the authoring convention: correct answer always
     written at options[0] pre-shuffle).
  2. Flags (but does not silently keep) any question whose text references
     "slide"/"the notes"/"the lecture"/"according to" -- these must not exist
     in an exam-style bank per the brief.
  3. Drops exact-duplicate questions (same normalized question text within or
     across topics).
  4. Shuffles distractor order per question, then assigns the correct answer's
     final slot via an exact round-robin over 0/1/2/3 so A/B/C/D end up
     correct almost exactly equally often.
  5. Reports a length-bias check and a correct-answer-position balance report.
  6. Writes questions.js as `const EXAM_BANK = [...];`.
"""
import json
import random
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
SRC_DIR = HERE / "source-by-topic"
OUT_FILE = HERE / "questions.js"

random.seed(20261029)

FORBIDDEN_PATTERN = re.compile(r"\bslide\b|\baccording to\b|\bthe notes\b|\bthe lecture\b|\bthe pdf\b", re.I)


def normalize(text: str) -> str:
    return " ".join(text.lower().split())


def dedupe_key(q: dict) -> str:
    key = normalize(q["q"])
    if q.get("table"):
        key += "|table:" + json.dumps(q["table"], sort_keys=True)
    if q.get("chart"):
        key += "|chart:" + json.dumps(q["chart"], sort_keys=True)
    return key


def load_all():
    all_q = []
    per_topic_counts = {}
    flagged = []
    for f in sorted(SRC_DIR.glob("*.json")):
        with open(f, encoding="utf-8") as fh:
            data = json.load(fh)
        bad = [q for q in data if len(q.get("options", [])) != 4 or q.get("correct") != 0]
        if bad:
            print(f"!! {f.name}: {len(bad)} malformed question(s) (need exactly 4 options, correct==0) -- dropping them", file=sys.stderr)
            for b in bad:
                print("   ", b.get("id"), b.get("q", "")[:80], file=sys.stderr)
            data = [q for q in data if q not in bad]
        for q in data:
            if FORBIDDEN_PATTERN.search(q.get("q", "")):
                flagged.append((f.name, q.get("id"), q.get("q", "")[:100]))
        per_topic_counts[f.stem] = len(data)
        all_q.extend(data)
    if flagged:
        print(f"\n!! {len(flagged)} question(s) reference a forbidden meta-source phrase (slide/notes/lecture/pdf/according to):", file=sys.stderr)
        for fname, qid, text in flagged[:30]:
            print(f"    {fname} :: {qid} :: {text}", file=sys.stderr)
        if len(flagged) > 30:
            print(f"    ... and {len(flagged) - 30} more", file=sys.stderr)
    return all_q, per_topic_counts, flagged


def dedupe(all_q):
    seen = set()
    out = []
    dropped = 0
    for q in all_q:
        key = dedupe_key(q)
        if key in seen:
            dropped += 1
            continue
        seen.add(key)
        out.append(q)
    return out, dropped


def rebalance(all_q):
    order = list(range(len(all_q)))
    random.shuffle(order)
    n = len(all_q)
    positions = [i % 4 for i in range(n)]
    random.shuffle(positions)

    final = [None] * n
    for shuffled_rank, orig_idx in enumerate(order):
        q = all_q[orig_idx]
        correct_text = q["options"][0]
        distractors = q["options"][1:]
        d = distractors[:]
        random.shuffle(d)
        target = positions[shuffled_rank]
        new_options = [None, None, None, None]
        new_options[target] = correct_text
        di = 0
        for slot in range(4):
            if new_options[slot] is None:
                new_options[slot] = d[di]
                di += 1
        out_q = dict(q)
        out_q["options"] = new_options
        out_q["correct"] = target
        final[orig_idx] = out_q
    return final


def length_bias_report(all_q):
    by_topic = defaultdict(lambda: [0, 0])
    overall = [0, 0]
    for q in all_q:
        lengths = [len(opt) for opt in q["options"]]
        longest_idx = max(range(4), key=lambda i: lengths[i])
        is_correct = longest_idx == q["correct"]
        by_topic[q["topic"]][0] += int(is_correct)
        by_topic[q["topic"]][1] += 1
        overall[0] += int(is_correct)
        overall[1] += 1
    print("\n--- Length-bias check (chance baseline = 25%) ---")
    for topic, (hit, total) in sorted(by_topic.items()):
        pct = 100 * hit / total if total else 0
        flag = "  <-- FLAG (>35%)" if pct > 35 else ""
        print(f"  {topic:28s} {hit:4d}/{total:4d}  {pct:5.1f}%{flag}")
    pct = 100 * overall[0] / overall[1] if overall[1] else 0
    print(f"  {'OVERALL':28s} {overall[0]:4d}/{overall[1]:4d}  {pct:5.1f}%")


def position_balance_report(all_q):
    c = Counter(q["correct"] for q in all_q)
    print("\n--- Correct-answer position balance ---")
    for i in range(4):
        print(f"  {'ABCD'[i]}: {c.get(i, 0)}")


def main():
    all_q, per_topic_counts, flagged = load_all()
    print("Per-topic raw counts:")
    for t, n in per_topic_counts.items():
        print(f"  {t}: {n}")
    print(f"Total raw: {len(all_q)}")

    all_q, dropped = dedupe(all_q)
    print(f"Dropped {dropped} exact-duplicate question(s). Remaining: {len(all_q)}")

    if len(all_q) < 1000:
        print(f"!! WARNING: only {len(all_q)} questions -- below the 1000 target.", file=sys.stderr)

    balanced = rebalance(all_q)

    position_balance_report(balanced)
    length_bias_report(balanced)

    ids = [q["id"] for q in balanced]
    dup_ids = [i for i, c in Counter(ids).items() if c > 1]
    if dup_ids:
        print(f"\n!! WARNING: duplicate ids found: {dup_ids[:10]}{'...' if len(dup_ids) > 10 else ''}", file=sys.stderr)

    with open(OUT_FILE, "w", encoding="utf-8") as fh:
        fh.write("// Auto-generated by build_bank.py -- do not hand-edit. Edit source-by-topic/*.json and re-run.\n")
        fh.write("const EXAM_BANK = ")
        json.dump(balanced, fh, ensure_ascii=False, indent=1)
        fh.write(";\n")

    print(f"\nWrote {len(balanced)} questions to {OUT_FILE}")
    if flagged:
        print(f"\n!! {len(flagged)} question(s) still contain forbidden meta-source phrasing -- fix the source-by-topic file(s) and re-run.", file=sys.stderr)


if __name__ == "__main__":
    main()
