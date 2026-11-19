"""Test setup: runs every test against a separate test database (TEST_DATABASE_URL)."""
import itertools
import os

# Must be set before app.config is imported: tests never download or run the AI models
os.environ["NLP_ENABLED"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (registers every table on Base.metadata)
from app.config import settings
from app.core.rate_limit import email_limiter, ip_limiter
from app.core.security import create_access_token
from app.database import Base, get_db
from app.main import app
from app.models import User, UserRole

if not settings.TEST_DATABASE_URL:
    raise RuntimeError("Set TEST_DATABASE_URL in backend/.env before running tests")

test_engine = create_engine(settings.TEST_DATABASE_URL, hide_parameters=True)
TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, expire_on_commit=False)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables once before the tests, drop them after."""
    Base.metadata.drop_all(test_engine)  # clean up leftovers from a crashed run
    Base.metadata.create_all(test_engine)
    yield
    Base.metadata.drop_all(test_engine)


@pytest.fixture
def db():
    """A DB session for one test. Afterwards every row is deleted, so each test starts empty."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        # Children before parents (reverse dependency order) so foreign keys are not violated
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()
        session.close()


@pytest.fixture
def make_user(db):
    """make_user(UserRole.counsellor, "Dr. Rao") -> (user, auth headers). Skips the login API."""
    counter = itertools.count()

    def _make(role: UserRole, full_name: str = "Test User") -> tuple[User, dict]:
        user = User(
            email=f"{role.value}{next(counter)}@test.edu",
            password_hash="not-used",
            full_name=full_name,
            role=role,
        )
        db.add(user)
        db.commit()
        return user, {"Authorization": f"Bearer {create_access_token(user.id, role.value)}"}

    return _make


@pytest.fixture
def make_headers(make_user):
    """make_headers(UserRole.student) -> auth headers for a new user with that role."""
    return lambda role: make_user(role)[1]


@pytest.fixture
def client(db):
    """HTTP client whose requests use the test database instead of the real one."""
    app.dependency_overrides[get_db] = lambda: db
    email_limiter.clear()  # every test starts with no failed logins recorded
    ip_limiter.clear()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
