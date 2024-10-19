from jsonschema import validate

schema = {
    "type": "object",
    "properties": {
        "FEEDBACK_LEVEL": {"type": "string"},
        "PASSWORD": {"type": "number"},
    },
    "required": ["FEEDBACK_LEVEL", "PASSWORD"],
}

def validate_config(config):
    validate(instance=config, schema=schema)
