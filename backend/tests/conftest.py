"""Test setup: runs every test against a separate test database (TEST_DATABASE_URL)."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (registers every table on Base.metadata)
from app.config import settings
from app.database import Base, get_db
from app.main import app

if not settings.TEST_DATABASE_URL:
    raise RuntimeError("Set TEST_DATABASE_URL in backend/.env before running tests")

test_engine = create_engine(settings.TEST_DATABASE_URL)
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
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """HTTP client whose requests use the test database instead of the real one."""
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
