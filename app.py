import flask
from flask import request, jsonify, Response, json, render_template
import db
import os
import readcsv
df = None

app = flask.Flask(__name__,static_url_path='')
app.config["DEBUG"] = True

# # Create some test data for our catalog in the form of a list of dictionaries.
# books = [
#     {'id': 0,
#      'title': 'A Fire Upon the Deep',
#      'author': 'Vernor Vinge',
#      'first_sentence': 'The coldsleep itself was dreamless.',
#      'year_published': '1992'},
#     {'id': 1,
#      'title': 'The Ones Who Walk Away From Omelas',
#      'author': 'Ursula K. Le Guin',
#      'first_sentence': 'With a clamor of bells that set the swallows soaring, the Festival of Summer came to the city Omelas, bright-towered by the sea.',
#      'published': '1973'},
#     {'id': 2,
#      'title': 'Dhalgren',
#      'author': 'Samuel R. Delany',
#      'first_sentence': 'to wound the autumnal city.',
#      'published': '1975'}
# ]


@app.route('/', methods=['GET'])
def home():
    return  app.send_static_file('heatmap.html')


@app.route('/satellite', methods=['GET'])
def sate():
    return  app.send_static_file('heatmap copy.html')

# # A route to return all of the available entries in our catalog.
# @app.route('/api/v1/resources/books/all', methods=['GET'])
# def api_all():
#     data = {
#         'hello'  : 'world',
#         'number' : 3
#     }
#     js = json.dumps(data)
#     resp = Response(js, status=200, mimetype='application/json')
#     resp.headers['Access-Control-Allow-Origin'] = '*'
#     return resp

@app.route('/api/db', methods=['POST'])
def api_db():
    try:
        df = db.query_db(request.json['sql'])
        js = json.dumps(df.dtypes.to_json())
        print(df)
        print(js)
        # print(js)
        resp = Response(js, status=200, mimetype='application/json')
        return resp
    except Exception as e:
        resp = Response(status=400)
        
        return resp

data_cache = dict()
 
@app.route('/api/summary', methods=['POST'])
def api_summary():
    try:
        # print(request.json)
        filename = request.json['filename']
        hiearchy = request.json['hiearchy']
        if 'category' in request.json:
            category = request.json['category']
        else:
            category = None
        # print((tuple(filename), tuple(hiearchy)))
        # data_cache[(filename, tuple(hiearchy))] = 'hi'
        if (filename, tuple(hiearchy),category) in data_cache:
            # print("Cached!")
            d = data_cache[(filename, tuple(hiearchy),category)]
        else:
            d = readcsv.HierachyData(filename,hiearchy)
            if not category is None:
                d.categorize_attribute(category)
            data_cache[(filename, tuple(hiearchy),category)] = d
        js = json.dumps(d.get_summary())
        # print(js)
        resp = Response(js, status=200, mimetype='application/json')
        return resp
    except Exception as e:
        print(e)
        resp = Response(status=400)
        return resp

@app.route('/api/heatmapdata', methods=['POST'])
def api_heatmapdata():
    try:
        filename = request.json['filename']
        hiearchy = request.json['hiearchy']
        hierchy_values = request.json['hierchy_values']
        categorical = request.json['categorical']
        numerical = request.json['numerical']
        aggragation = request.json['aggragation']
        if 'category' in request.json:
            category = request.json['category']
        else:
            category = None
        # print((tuple(filename), tuple(hiearchy)))
        # data_cache[(filename, tuple(hiearchy))] = 'hi'
        if (filename, tuple(hiearchy),category) in data_cache:
            # print("Cached!")
            d = data_cache[(filename, tuple(hiearchy),category)]
        else:
            d = readcsv.HierachyData(filename,hiearchy)
            if not category is None:
                d.categorize_attribute(category)
            data_cache[(filename, tuple(hiearchy),category)] = d
        result = d.get_heatmap_data(hierchy_values,\
            categorical,numerical,aggragation)
        # print(result)
        # print(d.get_heatmap_data(['Tigray','Emba-Alaje'],['Village','year'],['rank'],'mean'))
        js = json.dumps(result)
        # print(js)
        resp = Response(js, status=200, mimetype='application/json')
        return resp
    except Exception as e:
        print(e)
        resp = Response(status=400)
        return resp

@app.route('/api/data', methods=['POST'])
def api_data():
    try:
        filename = request.json['filename']
        hiearchy = request.json['hiearchy']
        hierchy_values = request.json['hierchy_values']
        if 'category' in request.json:
            category = request.json['category']
        else:
            category = None
        # print((tuple(filename), tuple(hiearchy)))
        # data_cache[(filename, tuple(hiearchy))] = 'hi'
        if (filename, tuple(hiearchy),category) in data_cache:
            # print("Cached!")
            d = data_cache[(filename, tuple(hiearchy),category)]
        else:
            d = readcsv.HierachyData(filename,hiearchy)
            if not category is None:
                d.categorize_attribute(category)
            data_cache[(filename, tuple(hiearchy),category)] = d
        result = d.get_data(hierchy_values)
        # print(result)
        # print(d.get_heatmap_data(['Tigray','Emba-Alaje'],['Village','year'],['rank'],'mean'))
        js = json.dumps(result)
        # print(js)
        resp = Response(js, status=200, mimetype='application/json')
        return resp
    except Exception as e:
        print(e)
        resp = Response(status=400)
        return resp

explanations = [
    {'name': 'explan', 'type': 'radio', 'display': 'The rank is wrong', 'value': "0"},
    {'name': 'explan', 'type': 'radio', 'display': 'The village is wrong', 'value': "1"},
    {'name': 'explan', 'type': 'radio', 'display': 'Further investigate', 'value': "2"},
    {'name': 'explan', 'type': 'radio', 'display': 'The rank is missing', 'value': "3"},
    {'name': 'explan', 'type': 'radio', 'display': 'Modify the start value', 'value': "4"},
    {'name': 'explan', 'type': 'radio', 'display': 'Modify the end value', 'value': "5"},
    {'name': 'explan', 'type': 'radio', 'display': 'Exchange the start and end value', 'value': "6"},
    {'name': 'explan', 'type': 'radio', 'display': 'Exchange the ranks of two years', 'value': "7"}
    ]

solutions = [
    {'name': 'solution', 'type': 'dropdown', 'display': 'Correct the rank of village: ', 'values': ['1', '2', '3','4','5','6','7','8','9','10'],'val': 0},
    {'name': 'solution', 'type': 'text', 'display': 'Correct the name of village: ', 'val': 1}
]

filename1 = "./db/heatmap_data_lineage.csv"
filename2 = "./db/intitiate_cleaned2.csv"
@app.route('/api/explan', methods=['POST'])
def api_explan():
    try:
        # print(request.json)
        data = {'explan': [],'sol':[]}
        if(request.json['visual']['filename'] == filename1):
            # the null year rectangle
            if(request.json['comp']['rank'] is None):
                data['explan'].append(explanations[1])
                data['explan'].append(explanations[3])    
            else:
                data['explan'].append(explanations[1])
                if(request.json['des']['year'] is not None ):
                    checked = explanations[7].copy()
                    checked['checked'] = 'true'
                    checked['display'] = 'Exchange the ranks of two years' + ": " \
                        + str(request.json['comp']['year'])  + " and " +  str(request.json['des']['year'])
                    data['explan'].append(checked)  

        elif(request.json['visual']['filename'] == filename2):
            data['explan'].append(explanations[4]) 
            data['explan'].append(explanations[5]) 
            data['explan'].append(explanations[6]) 
        if(len(request.json['visual']['hiearchy']) - len(request.json['visual']['hierchy_values']) > 1):
            data['explan'].append(explanations[2]) 
        data['explan'].append({'name': 'submit_button', 'type': 'button', 'display': 'Choose the Explanation', 'onclick': "Solution()"})
        js = json.dumps(data)
        # # print(js)
        resp = Response(js, status=200, mimetype='application/json')
        return resp
    except Exception as e:
        print(e)
        resp = Response(status=400)
        return resp


# just to get around Cors
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


app.run()
