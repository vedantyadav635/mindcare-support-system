"""Measure how well the two models label hand-labelled sentences (for the project report).

CSV columns: text,sentiment,emotion
  sentiment: negative | neutral | positive
  emotion:   anger | disgust | fear | joy | neutral | sadness | surprise

Run from the backend/ folder with the venv active:
    python -m scripts.evaluate_nlp                      (uses scripts/nlp_eval_sample.csv)
    python -m scripts.evaluate_nlp path/to/your.csv
The first run downloads the models (~800 MB).
"""
import csv
import os
import sys
from collections import Counter
from pathlib import Path

os.environ["NLP_ENABLED"] = "true"  # always use the real models here, whatever .env says

from app.services import nlp  # noqa: E402  (must come after setting NLP_ENABLED)

DEFAULT_CSV = Path(__file__).resolve().parent / "nlp_eval_sample.csv"


def report(task: str, rows: list[dict], predictions: list[str]) -> None:
    gold = [row[task].strip().lower() for row in rows]
    correct = sum(g == p for g, p in zip(gold, predictions))
    print(f"\n{task.upper()} accuracy: {correct}/{len(gold)} = {correct / len(gold):.1%}")

    # Per label: how many sentences of that label the model got right (recall)
    totals, hits = Counter(gold), Counter(g for g, p in zip(gold, predictions) if g == p)
    for label in sorted(totals):
        print(f"  {label:<10} {hits[label]:>3}/{totals[label]:<3} correct")

    mistakes = [(row["text"], g, p) for row, g, p in zip(rows, gold, predictions) if g != p]
    if mistakes:
        print("  Mistakes (expected -> predicted):")
        for text, g, p in mistakes:
            print(f"    {g} -> {p}: {text}")


def main() -> None:
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loading models and evaluating {len(rows)} sentences from {csv_path.name} ...")

    nlp.load_models()
    results = [nlp.analyse(row["text"]) for row in rows]

    report("sentiment", rows, [r["sentiment"] for r in results])
    report("emotion", rows, [r["emotion"] for r in results])


if __name__ == "__main__":
    main()
