"""Create the first admin account (admins cannot sign up through the API).

Run from the backend/ folder with the venv active:
    python -m scripts.create_admin admin@college.edu "Admin Name"
You will be asked for the password, so it never appears in your shell history.
The admin is created in the database from DATABASE_URL in backend/.env.
"""
import argparse
import getpass

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import User, UserRole
from app.services.auth_service import get_user_by_email


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("email")
    parser.add_argument("full_name")
    args = parser.parse_args()

    password = getpass.getpass("Password (8-72 characters): ")
    if not 8 <= len(password) <= 72:
        raise SystemExit("Password must be 8-72 characters.")
    if password != getpass.getpass("Repeat password: "):
        raise SystemExit("Passwords do not match.")

    with SessionLocal() as db:
        if get_user_by_email(db, args.email):
            raise SystemExit(f"A user with email {args.email} already exists.")
        db.add(
            User(
                email=args.email.lower(),
                password_hash=hash_password(password),
                full_name=args.full_name,
                role=UserRole.admin,
            )
        )
        db.commit()
    print(f"Admin {args.email} created.")


if __name__ == "__main__":
    main()
