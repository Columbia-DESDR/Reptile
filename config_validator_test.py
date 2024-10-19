from config_validator import validate_config

def test_validate_config():
    result = validate_config({'id': 1})
    assert result == 'foo'
