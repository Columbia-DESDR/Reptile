# Reptile
Reptile is a software tool designed to enhance survey data quality by addressing and correcting data errors reported by users.

# Guides

* [Datasets](./datasets/README.md)

# Getting Started
Follow these instructions to set up Reptile on your local machine.

## Prerequisites
Before you begin, ensure you have met the following requirements:
1. Python 3.x installed on your system

## Installing
1. Install dependencies:
   - `pip install -r requirements.txt`
2. Set up flask environment::
   - Windows: `set FLASK_APP=app.py`, `set FLASK_ENV=development`
   - Mac/Linux: `export FLASK_APP=app.py`, `export FLASK_ENV=development`
3. Start the site:
   - `flask run` or `python3 app.py`

## Current Deployments

| Name              | Description | Git Branch | Link |
| :---------------- | :------: | :------: | ----: |
| DRC               |   TODO   | testing | http://ec2-18-117-152-17.us-east-2.compute.amazonaws.com/ |
| Nigeria           |   TODO  | master | http://ec2-18-190-217-53.us-east-2.compute.amazonaws.com:8000/ |

## Configuration

Configuration for a new instance is doing via a config.json file. 
An example config file:

```json
{
    "DEBUG": true,
    "DATA_SOURCES": {
        "FILENAME": "./data/test/DRC_badyears_forzach.csv",
        "SATELLITE_DATA": [
            {
                "NAME": "source_a",
                "PATH": "./data/test/season_a.csv"
            },
            {
                "NAME": "source_b",
                "PATH": "./data/test/season_b.csv"
            },
            {
                "NAME": "source_c",
                "PATH": "./data/test/season_c.csv"
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
```

# Glossary

* **CHIRPS**
    * Climate Hazards Group InfraRed Precipitation with Station data (CHIRPS) is a 35+ year quasi-global rainfall data set. (https://www.chc.ucsb.edu/data/chirps)

# License

Released under MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
