"""Load the default wellness resources from app/data/seed_resources.json.

Does nothing if the resources table already has rows, so it is safe to run twice.
Run from the backend/ folder with the venv active:
    python -m scripts.seed_resources
"""
from app.database import SessionLocal
from app.services.resource import seed_default_resources


def main() -> None:
    with SessionLocal() as db:
        added = seed_default_resources(db)
    print(f"Added {added} resources." if added else "Resources already exist; nothing added.")


if __name__ == "__main__":
    main()
