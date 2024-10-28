import pytest
from app import app as flask_app

@pytest.fixture
def app():
    return flask_app

def test_get_level_template(client):
    response = client.get("/levelTemplate.html")
    assert response.status_code == 200

def test_get_rec(client):
    response = client.get("/api/getrec")
    assert response.status_code == 200

def test_get_rec_2(client):
    response = client.get("/api/getrec2")
    assert response.status_code == 200