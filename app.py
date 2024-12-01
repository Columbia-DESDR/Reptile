import os
import flask
from flask import request, Response, json, render_template, send_file, send_from_directory
import db
import readcsv
import json
import pandas as pd
from io import StringIO

from validate_config import validate_config


app = flask.Flask(__name__, static_url_path='')
app.config.from_file("config.json", load=json.load)
validate_config(app.config)


@app.route('/', methods=['GET'])
def com():
    data_sources = app.config['DATA_SOURCES']
    display = app.config['DISPLAY']
    colors = app.config['COLORS']

    hierarchy = app.config['HIERARCHY']

    color_farmers = colors['FARMERS'] if colors['FARMERS'] else '#079A0D'
    color_satellite = colors['SATELLITE'] if colors['SATELLITE'] else '#077F9A'

    start = app.config['TIMESPAN']['START']
    end = app.config['TIMESPAN']['END']
    length = end - start + 1

    print('app config', app.config)

    return render_template('res.html',
                           instance_title=display['INSTANCE_TITLE'],
                           filename=data_sources['FILENAME'],
                           hierarchy=hierarchy,
                           first_level_name = hierarchy[0],
                           feedback_level=app.config['FEEDBACK_LEVEL'],
                           time_name=display['TIME_NAME'],
                           numerical_name=display['NUMERICAL_NAME'],
                           comment_name=display['COMMENT_NAME'],
                           start=start,
                           end=end,
                           length=length,
                           satellite_data=data_sources['SATELLITE_DATA'],
                           color_farmers=color_farmers,
                           color_satellite=color_satellite)


@app.route('/levelTemplate.html', methods=['GET'])
def get_level_template():
    # TODO this is probably not necessary, and levelTemplate.html can just be imported directly from res.html
    # but since I haven't figured out how to do so, this works for now
    return send_from_directory('templates', 'levelTemplate.html')


# A route to return all of the available entries in our catalog.
@app.route('/api/zones', methods=['GET'])
def api_zones():
    with open("./db/eth_woredas_dd.json") as f:
        data = json.load(f)
    js = json.dumps(data)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


recs = []

logs = []

loads = []


@app.route('/api/getrec', methods=['GET'])
def get_rec():
    arr = readcsv.readsub()
    js = json.dumps(arr)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/getrec2', methods=['GET'])
def get_rec2():
    arr = readcsv.readsub2()
    js = json.dumps(arr)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/getlog', methods=['GET'])
def get_log():
    js = json.dumps(logs)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/getload', methods=['GET'])
def get_load():
    arr = readcsv.readLog()
    js = json.dumps(arr)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/db', methods=['POST'])
def api_db():
    df = db.query_db(request.json['sql'])
    js = json.dumps(df.dtypes.to_json())
    print(df)
    print(js)
    # print(js)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


data_cache = dict()


@app.route('/api/summary', methods=['POST'])
def api_summary():
    print(request.json)
    filename = request.json['filename']
    hierarchy = request.json['hierarchy']
    
    if 'category' in request.json:
        category = request.json['category']
    else:
        category = None

    if (filename, tuple(hierarchy), category) in data_cache:
        d = data_cache[(filename, tuple(hierarchy), category)]
    else:
        d = readcsv.HierachyData(filename, hierarchy)
        if not category is None:
            d.categorize_attribute(category)
        data_cache[(filename, tuple(hierarchy), category)] = d

    js = json.dumps(d.get_summary())
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/summary2', methods=['POST'])
def api_summary2():
    filename = request.json['filename']
    hierarchy = request.json['hierarchy']

    if 'category' in request.json:
        category = request.json['category']
    else:
        category = None

    if (filename, tuple(hierarchy), category) in data_cache:
        d = data_cache[(filename, tuple(hierarchy), category)]
    else:
        d = readcsv.HierachyData(filename, hierarchy)
        if not category is None:
            d.categorize_attribute(category)
        data_cache[(filename, tuple(hierarchy), category)] = d

    js = json.dumps(d.get_summary2())
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/unique', methods=['POST'])
def api_unique():
    filename = request.json['filename']
    hierarchy = request.json['hierarchy']
    hierarchy_values = request.json['hierarchy_values']

    if 'category' in request.json:
        category = request.json['category']
    else:
        category = None

    if (filename, tuple(hierarchy), category) in data_cache:
        d = data_cache[(filename, tuple(hierarchy), category)]
    else:
        d = readcsv.HierachyData(filename, hierarchy)
        if not category is None:
            d.categorize_attribute(category)
        data_cache[(filename, tuple(hierarchy), category)] = d

    js = json.dumps(d.get_unique(hierarchy_values))
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/heatmapdata', methods=['POST'])
def api_heatmapdata():
    rec = request.json
    rec['type'] = 'drilldown'
    loads.append(rec)

    print(request.json)

    filename = request.json['filename'] #TODO
    hierarchy = request.json['hierarchy']
    hierarchy_values = request.json['hierarchy_values']
    categorical = request.json['categorical']
    numerical = request.json['numerical']
    aggregation = request.json['aggregation']
    if 'category' in request.json:
        category = request.json['category']
    else:
        category = None
    if (filename, tuple(hierarchy), category) in data_cache:
        d = data_cache[(filename, tuple(hierarchy), category)]
    else:
        d = readcsv.HierachyData(filename, hierarchy)
        if not category is None:
            d.categorize_attribute(category)
        data_cache[(filename, tuple(hierarchy), category)] = d
    result = d.get_heatmap_data(hierarchy_values,
                                categorical, numerical, aggregation)

    js = json.dumps(result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/data', methods=['POST'])
def api_data():
    filename = request.json['filename']
    hierarchy = request.json['hierarchy']
    hierarchy_values = request.json['hierarchy_values']
    if 'category' in request.json:
        category = request.json['category']
    else:
        category = None

    if (filename, tuple(hierarchy), category) in data_cache:
        d = data_cache[(filename, tuple(hierarchy), category)]
    else:
        d = readcsv.HierachyData(filename, hierarchy)
        if not category is None:
            d.categorize_attribute(category)
        data_cache[(filename, tuple(hierarchy), category)] = d

    result = d.get_data(hierarchy_values)
    js = json.dumps(result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/data2', methods=['POST'])
def api_data2():
    print(request.json)
    filename = request.json['filename']
    hierarchy = request.json['hierarchy']
    hierarchy_values = request.json['hierarchy_values']

    if 'category' in request.json:
        category = request.json['category']
    else:
        category = None
    if (filename, tuple(hierarchy), category) in data_cache:
        d = data_cache[(filename, tuple(hierarchy), category)]
    else:
        d = readcsv.HierachyData(filename, hierarchy)
        if not category is None:
            d.categorize_attribute(category)
        data_cache[(filename, tuple(hierarchy), category)] = d
    result = d.get_data2(hierarchy_values)
    # print(result)
    js = json.dumps(result)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


explanations = [
    {'name': 'explan', 'type': 'radio', 'display': 'The rank is wrong', 'value': "0"},
    {'name': 'explan', 'type': 'radio', 'display': 'The name is wrong', 'value': "1"},
    {'name': 'explan', 'type': 'radio', 'display': 'Drill down', 'value': "2"},
    {'name': 'explan', 'type': 'radio',
        'display': 'The rank is missing', 'value': "3"},
    {'name': 'explan', 'type': 'radio',
        'display': 'Modify the start value', 'value': "4"},
    {'name': 'explan', 'type': 'radio',
        'display': 'Modify the end value', 'value': "5"},
    {'name': 'explan', 'type': 'radio',
        'display': 'Exchange the start and end value', 'value': "6"},
    {'name': 'explan', 'type': 'radio',
        'display': 'Exchange the ranks of two years', 'value': "7"},
    {'name': 'explan', 'type': 'radio', 'display': 'Mean rank should be', 'value': "7"}
]

solutions = [
    {'name': 'solution', 'type': 'dropdown', 'display': 'Correct the rank of village: ',
        'values': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 'val': 0},
    {'name': 'solution', 'type': 'text',
        'display': 'Correct the name of village: ', 'val': 1}
]



@app.route('/api/explan', methods=['POST'])
def api_explan():
    data = {'explan': [], 'sol': []}

    if (request.json['visual']['filename'] == filename1):
        # the null year rectangle
        if (request.json['comp']['rank'] is None):
            data['explan'].append(explanations[1])
            data['explan'].append(explanations[3])
        else:
            data['explan'].append(explanations[1])
            data['explan'].append(explanations[0])
            if ('mean' in request.json['des']):
                checked = explanations[7].copy()
                checked['checked'] = 'true'
                checked['display'] = 'Mean rank should be' + ": " + \
                    str(request.json['des']['mean'])
                data['explan'].append(checked)
            elif ('year' in request.json['des']):
                checked = explanations[7].copy()
                checked['checked'] = 'true'
                checked['display'] = 'Exchange the ranks of two years' + ": " \
                    + str(request.json['comp']['year']) + \
                    " and " + str(request.json['des']['year'])
                data['explan'].append(checked)
    elif (request.json['visual']['filename'] == filename2):
        data['explan'].append(explanations[4])
        data['explan'].append(explanations[5])
        data['explan'].append(explanations[6])

    if (len(request.json['visual']['hierarchy']) - len(request.json['visual']['hierarchy_values']) > 1):
        data['explan'].append(explanations[2])
    data['explan'].append({'name': 'submit_button', 'type': 'button',
                          'display': 'Choose the Explanation', 'onclick': "Solution()"})
    js = json.dumps(data)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/explan2', methods=['POST'])
def api_explan2():
    rec = request.json
    rec['type'] = 'complaint'
    loads.append(rec)

    data = {}
    if (request.json['level'] == "region"):
        data = readcsv.getRegionExplanation(request.json['value'], request.json['year'],
                                            request.json['aggOriginal'], request.json['complained_agg'], request.json['com_too_small'])
    else:
        data = readcsv.getDistrictExplanation(request.json['value'], request.json['year'],
                                              request.json['aggOriginal'], request.json['complained_agg'], request.json['com_too_small'])

    js = json.dumps(data)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/sol', methods=['POST'])
def api_sol():
    print(request.json)
    filename = request.json['visual']['filename']
    hierarchy = request.json['visual']['hierarchy']
    hierarchy_values = request.json['visual']['hierarchy_values']
    categorical = request.json['visual']['categorical']
    numerical = request.json['visual']['numerical']
    aggregation = request.json['visual']['aggregation']

    if 'category' in request.json['visual']:
        category = request.json['visual']['category']
    else:
        category = None
    if (filename, tuple(hierarchy), category) in data_cache:
        d = data_cache[(filename, tuple(hierarchy), category)]
    else:
        d = readcsv.HierachyData(filename, hierarchy)
        if not category is None:
            d.categorize_attribute(category)
        data_cache[(filename, tuple(hierarchy), category)] = d

    year = request.json['des']['year']
    de_mean = request.json['des']['mean']

    data = d.complaint(hierarchy_values, categorical,
                       numerical, aggregation, year, de_mean)
    js = json.dumps(data)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/rec', methods=['POST'])
def api_rec():
    rec = request.json

    password = app.config['PASSWORD'] if 'PASSWORD' in app.config else None

    if not password or ('data' in rec and 'password' in rec['data'] and rec['data']['password'] == password):
        print(rec)
        db.insert_data(rec['data'])
        data = "good"
        js = json.dumps(data)
        resp = Response(js, status=200, mimetype='application/json')
    else:
        data = "wrong password"
        js = json.dumps(data)
        resp = Response(js, status=401, mimetype='application/json')

    return resp


@app.route('/api/load', methods=['POST'])
def api_load():
    rec = request.json
    rec['type'] = 'load'
    loads.append(rec)

    data = "good"
    js = json.dumps(data)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/sub', methods=['POST'])
def api_sub():

    rec = request.json

    rec['type'] = 'submission'
    

    data = "good"
    js = json.dumps(data)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/api/download', methods=['GET'])
def download():
    
    df = db.read_data()
    
    # Create an in-memory text stream
    str_io = StringIO()
    df.to_csv(str_io)

    # Seek to start so the content can be read from the beginning
    str_io.seek(0)

    return Response(
        str_io.getvalue(),
        mimetype='text/csv',
        headers={
            "Content-disposition": 
                 "attachment; filename=feedback.csv"})


@app.route('/api/subzambia', methods=['POST'])
def api_subzambia():

    rec = request.json

    rec['type'] = 'submission'
    print(rec)

    data = "good"
    js = json.dumps(data)
    resp = Response(js, status=200, mimetype='application/json')
    return resp


@app.route('/viewrec', methods=['GET'])
def view_rec():
    return  app.send_static_file('viewrec.html')


# just to get around Cors
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers',
                         'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


if __name__ == "__main__":
    app.run()
