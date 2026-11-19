from fastapi import Depends

from app.core.deps import require_role
from app.core.security import hash_password
from app.main import app
from app.models import StudentProfile, User, UserRole


# Dummy admin-only route, added to the app only while tests run (it is not part of the real API)
@app.get("/api/test/admin-only")
def admin_only(user: User = Depends(require_role(UserRole.admin))):
    return {"ok": True}


STUDENT = {
    "email": "Student@College.edu",
    "password": "secret123",
    "full_name": "Test Student",
    "enrollment_no": "EN001",
    "department": "CSE",
    "year": 3,
    "consent_given": True,
}


def register(client, **overrides):
    return client.post("/api/auth/register", json={**STUDENT, **overrides})


def login_token(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    return response.json()["access_token"]


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_student_with_profile(client, db):
    response = register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "student@college.edu"  # stored lowercase
    assert body["role"] == "student"
    assert "password" not in body and "password_hash" not in body
    assert db.query(StudentProfile).filter_by(user_id=body["id"]).count() == 1


def test_register_requires_consent(client):
    assert register(client, consent_given=False).status_code == 422


def test_register_duplicate_email_returns_409(client):
    register(client)
    # Different letter case is still the same email
    assert register(client, email="STUDENT@college.edu").status_code == 409


def test_login_success(client):
    register(client)
    response = client.post(
        "/api/auth/login", json={"email": "student@college.edu", "password": "secret123"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["role"] == "student"
    assert body["access_token"]


def test_login_wrong_password_and_wrong_email_give_same_error(client):
    register(client)
    wrong_password = client.post(
        "/api/auth/login", json={"email": "student@college.edu", "password": "wrongpass"}
    )
    wrong_email = client.post(
        "/api/auth/login", json={"email": "nobody@college.edu", "password": "secret123"}
    )
    assert wrong_password.status_code == wrong_email.status_code == 401
    assert wrong_password.json() == wrong_email.json()


def test_me_with_token(client):
    register(client)
    token = login_token(client, "student@college.edu", "secret123")
    response = client.get("/api/auth/me", headers=auth_header(token))
    assert response.status_code == 200
    assert response.json()["email"] == "student@college.edu"


def test_me_without_token_returns_401(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_with_bad_token_returns_401(client):
    assert client.get("/api/auth/me", headers=auth_header("not-a-real-token")).status_code == 401


def test_student_cannot_access_admin_route(client):
    register(client)
    token = login_token(client, "student@college.edu", "secret123")
    assert client.get("/api/test/admin-only", headers=auth_header(token)).status_code == 403


def test_admin_can_access_admin_route(client, db):
    # Admins can't self-register, so create one directly (like scripts/create_admin.py does)
    db.add(
        User(
            email="admin@college.edu",
            password_hash=hash_password("adminpass1"),
            full_name="Admin",
            role=UserRole.admin,
        )
    )
    db.commit()
    token = login_token(client, "admin@college.edu", "adminpass1")
    assert client.get("/api/test/admin-only", headers=auth_header(token)).status_code == 200
