import jsonschema.exceptions
import pytest
import jsonschema
from validate_config import validate_config

def get_mock_config():
    return {
        "DATA_SOURCES": {
            "FILENAME": "./datasets/test/DRC_badyears_forzach.csv",
            "SATELLITE_DATA": [
                {
                    "NAME": "source_a",
                    "PATH": "./datasets/test/season_a.csv"
                },
                {
                    "NAME": "source_b",
                    "PATH": "./datasets/test/season_b.csv"
                },
                {
                    "NAME": "source_c",
                    "PATH": "./datasets/test/season_c.csv"
                }
            ]
        },
        "HIERARCHY": ["province", "sector", "village", "survey_id"],
        "FEEDBACK_LEVEL": "sector",
        "TIMESPAN": {
            "START": 1990,
            "END": 2023
        },
        "DISPLAY": {
            "INSTANCE_TITLE": "Africa - Democratic Republic of the Congo",
            "TIME_NAME": "year",
            "NUMERICAL_NAME": "rank",
            "COMMENT_NAME": "comments"
        },
        "COLORS": {
            "FARMERS": "#9F2B68",
            "SATELLITE": ""
        },
        "PASSWORD": "foobar"
    }

def test_validate_mock_config():
    mock_config = get_mock_config()
    validate_config(mock_config)

def test_validate_mock_config_with_no_password_throws_exception():
    mock_config = get_mock_config()
    mock_config['PASSWORD'] = None

    try:
        validate_config(mock_config)
    except jsonschema.exceptions.ValidationError as e:
        print(e)
        assert e == 'foo'

