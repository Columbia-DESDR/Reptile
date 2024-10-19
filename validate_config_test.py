from validate_config import validate_config

def test_validate_config():
    result = validate_config({'id': 1})
    assert result == 'foo'
