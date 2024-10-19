from jsonschema import validate

schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "number"},
    },
    "required": ["name"],
}

def validate_config(config):
    result = validate(instance=config, schema=schema)
    print(result)
