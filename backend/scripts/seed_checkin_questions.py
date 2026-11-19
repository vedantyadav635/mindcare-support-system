"""Load the default check-in questions from app/data/seed_checkin_questions.json.

Does nothing if the checkin_questions table already has rows, so it is safe to run twice.
Run from the backend/ folder with the venv active:
    python -m scripts.seed_checkin_questions
"""
from app.database import SessionLocal
from app.services.checkin import seed_default_questions


def main() -> None:
    with SessionLocal() as db:
        added = seed_default_questions(db)
    print(f"Added {added} questions." if added else "Questions already exist; nothing added.")


if __name__ == "__main__":
    main()
