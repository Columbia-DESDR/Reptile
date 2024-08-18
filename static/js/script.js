console.log("FLASK VARIABLES", FLASK_VARIABLES);

// url to this page (and infer server address)
const url = window.location.origin + '/';

// const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
const alphabet = ['c', 'r', 'd', 'v']

// ############
// ## COLORS ##
// ############

const WHITE = "#ffffff"

// #####################
// ## FLASK VARIABLES ##
// #####################

const filename = FLASK_VARIABLES.filename
const hierarchy = FLASK_VARIABLES.hierarchy
const feedback_level = FLASK_VARIABLES.feedback_level

const time_name = FLASK_VARIABLES.time_name
const numerical_name = FLASK_VARIABLES.numerical_name
const comment_name = FLASK_VARIABLES.comment_name

const YEAR_START = FLASK_VARIABLES.start
const YEAR_LENGTH = FLASK_VARIABLES.length

const colorFarmers = FLASK_VARIABLES.color_farmers
const colorSatellite = FLASK_VARIABLES.color_satellite

// ################
// ## LOCAL DATA ##
// ################

class DataStorage {
    constructor() {
        this.data = {}
        this.schema = {}
        this.sate = {}
    }
    putData(level, data) {
        this.data[level] = data
    }
    putSate(sate, data) {
        this.sate[sate] = data
    }
    putSchema(level, data) {
        this.schema[level] = data
    }
    getData(level) {
        return this.data[level]
    }
    getSchema(level) {
        return this.schema[level]
    }
    getData(level, field, value) {
        return this.data[level].filter((d) => d[field] === value);
    }
    getSate(sate) {
        return this.sate[sate]
    }
}

let LocalData = new DataStorage()

// ###############
// ## RENDERING ##
// ###############

$(document).ready(function(){    
    $.get('levelTemplate.html', (response) => {
        hierarchy.forEach((level, idx) => {
            if (idx == 0) {
                return
            }

            const view = {
                this_level_name: level,
                above_level_name: hierarchy[idx-1],
                letter: alphabet[idx],
                is_last: idx == (hierarchy.length - 1)
            }

            var output = Mustache.render(response, view);    
            $('#levels-container').append(output);    
        })
    
        renderDataViews();
    })
});

const renderDataViews = () => {
    const heatMaps = []

    let heatMapUnderneath = null;
    let isLast = true;

    hierarchy.toReversed().forEach((level, idx) => {
        const thisLetter = alphabet.toReversed()[idx];

        const isFeedbackLevel = feedback_level == level;

        const explanationLinks = heatMapUnderneath ? [heatMapUnderneath] : [];

        const scatterPlot = new ScatterPlot(`#${thisLetter}_2`, {})
        const barChart = new BarChart(`#${thisLetter}_3`, {color: [WHITE, colorFarmers]})
        const explanation = new Explanation(`#${thisLetter}_4`, explanationLinks, isFeedbackLevel, !isLast)
        const heatMap = new HeatMap(`#${thisLetter}_1`, {color: [WHITE, colorFarmers]})
        
        scatterPlot.registerLinks([barChart, explanation, heatMap])
        barChart.registerLinks([explanation, scatterPlot, heatMap])
        heatMap.registerLinks([scatterPlot, barChart, explanation])
        
        heatMaps.unshift(heatMap)

        heatMapUnderneath = heatMap;
        isLast = false;
    })

    let satelliteHeatMap = null;
    if (satellite_data.length > 0) {
        satelliteHeatMap = new CountrySatelliteHeatMap("#svg-satellite", {color:[WHITE, colorSatellite]})
        satelliteHeatMap.registerLinks([])
    }

    GetHeatMap(schemaInitial).then(d => {
        LocalData.putData(schemaInitial.categorical[0], d)
        LocalData.putSchema(schemaInitial.categorical[0], schemaInitial)
        const m1 = heatMaps[0]
        m1.plot(schemaInitial)
    })
    
    if (satelliteHeatMap) {
        d3.select("#CountrySate").on("change", function() {
            satelliteHeatMap.plot({ schema: schemaSate, level: "Country" })
            })
        satelliteHeatMap.plot({ schema: schemaSate, level: "Country" })
    }
}


function GetHeatMap(schema) {
    const data = {
        'filename': schema.filename,
        'hierarchy': schema.hierarchy,
        'hierarchy_values': schema.hierarchy_values,
        'categorical': schema.categorical,
        'numerical': schema.numerical,
        'aggregation': schema.aggregation,
        'category': schema.category,
        'time': Date().toLocaleString()
    };
    const other_params = {
        headers: { "content-type": "application/json; charset=UTF-8" },
        body: JSON.stringify(data),
        method: "POST",
        mode: "cors"
    };
    return fetch(url + "api/heatmapdata", other_params)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Could not reach the API: " + response.statusText);
            }
        }).then(function (data) {
            obj = JSON.parse(data)
            console.log(obj)
            // we don't need rank here
            obj.forEach(element => {
                if (element["mean"] > 0) {
                    element["mean"] = 9 - element["mean"]
                }

                delete element["rank"]
            });
            return obj
        })
}

// special method for village sate because only village attribute
function GetData2(schema) {
    const data = {
        'filename': schema.filename,
        'hierarchy': schema.hierarchy,
        'hierarchy_values': schema.hierarchy_values,
    };
    const other_params = {
        headers: { "content-type": "application/json; charset=UTF-8" },
        body: JSON.stringify(data),
        method: "POST",
        mode: "cors"
    };

    return fetch(url + "api/data2", other_params)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Could not reach the API: " + response.statusText);
            }
        }).then(function (data) {
            obj = JSON.parse(data)
            return obj
        })
}

const CountrySate = satellite_data.map(f => f['NAME'])

const RegionSate = []
const DistrictSate = []

const schemaSate = {
    hierarchy: hierarchy,
    hierarchy_values: [],
    categorical: [hierarchy[0], 'year'],
    numerical: ['drought_rank'],
    aggregation: ['mean', 'std', 'count'],
    category: 'year'
}

d3.select("#CountrySate")
    .selectAll('option')
    .data(CountrySate)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; })

d3.select("#RegionSate")
    .selectAll('option')
    .data(RegionSate)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; }) 

d3.select("#DistrictSate")
    .selectAll('option')
    .data(DistrictSate)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; }) 

let schemaInitial = {
    filename: filename,
    hierarchy: hierarchy,
    hierarchy_values: [],
    categorical: [hierarchy[0], 'year'],
    numerical: ['rank'],
    aggregation: ['mean', 'std', 'count'],
    category: 'year'
}

function range(start, stop, count) {
    step = (stop - start) / count
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof count == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; result.length < count; i += step) {
        result.push(i.toFixed(2))
    }

    return result;
};

// For element overlap
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

// from data, return the level
// which is assumed to be the first key
function getLevel(schema) {
    return Object.keys(schema)[0]
}

function nextLevel(currLevel) {
    const currLevelIndex = hierarchy.indexOf(currLevel)
    return hierarchy[currLevelIndex + 1]
}

function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

function hideBelow(level) {
    const levelIndex = hierarchy.indexOf(level)
    hideLevel(hierarchy[levelIndex + 1])
}

function hideLevel(level) {
    d3.select("#" + level + "Start").style("display", "none").style("overflow", "hidden")
}

function showLevel(level) {
    d3.select("#" + level + "Start").style("display", "block").style("overflow", "visible")
}

function hideComp(level) {
    d3.select("#" + level + "CompBox").style("display", "none").style("overflow", "hidden")
}

function showComp(level) {
    d3.select("#" + level + "CompBox").style("display", "block").style("overflow", "visible")
}