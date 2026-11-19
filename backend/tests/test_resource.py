import pytest

from app.models import UserRole
from app.services.resource import seed_default_resources

BOX_BREATHING = {
    "title": "Box breathing",
    "type": "breathing",
    "tags": ["stress", "anxiety"],
    "body": "Breathe in 4, hold 4, out 4, hold 4.",
}


def test_admin_can_create_update_and_delete(client, make_headers):
    admin = make_headers(UserRole.admin)
    created = client.post("/api/resources", json=BOX_BREATHING, headers=admin)
    assert created.status_code == 201
    resource_id = created.json()["id"]

    updated = client.put(
        f"/api/resources/{resource_id}", json={**BOX_BREATHING, "title": "Square breathing"}, headers=admin
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Square breathing"

    assert client.delete(f"/api/resources/{resource_id}", headers=admin).status_code == 204
    assert client.get("/api/resources", headers=admin).json() == []  # soft-deleted, no longer listed


def test_update_or_delete_missing_resource_returns_404(client, make_headers):
    admin = make_headers(UserRole.admin)
    assert client.put("/api/resources/999", json=BOX_BREATHING, headers=admin).status_code == 404
    assert client.delete("/api/resources/999", headers=admin).status_code == 404


def test_student_cannot_create_update_or_delete(client, make_headers):
    student = make_headers(UserRole.student)
    assert client.post("/api/resources", json=BOX_BREATHING, headers=student).status_code == 403
    assert client.put("/api/resources/1", json=BOX_BREATHING, headers=student).status_code == 403
    assert client.delete("/api/resources/1", headers=student).status_code == 403


@pytest.mark.parametrize(
    "bad",
    [
        {**BOX_BREATHING, "tags": ["happy"]},  # not an allowed tag
        {**BOX_BREATHING, "type": "podcast"},  # not an allowed type
        {**BOX_BREATHING, "body": None},  # no body and no url
        {**BOX_BREATHING, "url": "not a url"},
    ],
)
def test_invalid_resource_is_rejected(client, make_headers, bad):
    assert client.post("/api/resources", json=bad, headers=make_headers(UserRole.admin)).status_code == 422


def test_list_filters_by_type_and_tag(client, db, make_headers):
    assert seed_default_resources(db) == 18
    assert seed_default_resources(db) == 0  # second run adds nothing
    student = make_headers(UserRole.student)

    everything = client.get("/api/resources", headers=student).json()
    assert len(everything) == 18

    breathing = client.get("/api/resources?type=breathing", headers=student).json()
    assert breathing and all(r["type"] == "breathing" for r in breathing)

    crisis = client.get("/api/resources?tag=crisis", headers=student).json()
    assert [r["title"] for r in crisis] == ["Tele-MANAS: free 24x7 mental health helpline"]

    sleep_breathing = client.get("/api/resources?type=breathing&tag=sleep", headers=student).json()
    assert [r["title"] for r in sleep_breathing] == ["4-7-8 breathing"]

    assert client.get("/api/resources?tag=happy", headers=student).status_code == 422


def test_listing_requires_login(client):
    assert client.get("/api/resources").status_code == 401
