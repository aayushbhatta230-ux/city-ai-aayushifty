import pytest
from starlette.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "FORGE AI Platform"

def test_create_and_list_projects():
    payload = {
        "name": "Integration Test Project",
        "description": "Test creating project via API",
        "budget_limit_usd": 15.0
    }
    res = client.post("/api/projects", json=payload)
    assert res.status_code == 200
    p = res.json()
    assert p["name"] == payload["name"]
    assert p["budget_limit_usd"] == 15.0

    # List projects
    list_res = client.get("/api/projects")
    assert list_res.status_code == 200
    projects = list_res.json()
    assert any(proj["id"] == p["id"] for proj in projects)

def test_emergency_stop_toggle():
    res = client.post("/api/budget/emergency-stop?active=true")
    assert res.status_code == 200
    assert res.json()["is_emergency_stopped"] is True

    res2 = client.post("/api/budget/emergency-stop?active=false")
    assert res2.status_code == 200
    assert res2.json()["is_emergency_stopped"] is False
