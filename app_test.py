import pytest
from app import app as flask_app

@pytest.fixture
def app():
    return flask_app

def test_get_templates(client):
    response = client.get("/levelTemplate.html")
    assert response.status_code == 201
