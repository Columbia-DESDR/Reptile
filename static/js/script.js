console.log("FLASK VARIABLES", FLASK_VARIABLES);

// ############
// ## COLORS ##
// ############

const WHITE = "#ffffff"

// #####################
// ## FLASK VARIABLES ##
// #####################

const filename = FLASK_VARIABLES.filename
const first_level_name = FLASK_VARIABLES.first_level_name
const second_level_name = FLASK_VARIABLES.second_level_name
const third_level_name = FLASK_VARIABLES.third_level_name
const fourth_level_name = FLASK_VARIABLES.fourth_level_name
const time_name = FLASK_VARIABLES.time_name
const numerical_name = FLASK_VARIABLES.numerical_name
const comment_name = FLASK_VARIABLES.comment_name

const YEAR_START = FLASK_VARIABLES.start
const YEAR_LENGTH = FLASK_VARIABLES.length

const colorFarmers = FLASK_VARIABLES.color_farmers
const colorSatellite = FLASK_VARIABLES.color_satellite

// url to this page (and infer server address)
const url = window.location.origin + '/';

// margin.right_short is for no legend
let margin = { top: 10, right: 100, bottom: 100, left: 60, right_short: 20 },
    height = 600 - margin.top - margin.bottom;

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

let tooltipdiv = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("left", "20px")
    .style("top", "44px");

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


function heatmap_tooptip_mouseover(d) {
    tooltipdiv.style("opacity", .9);
    return tooltipdiv.html(objToStr(d))
}

function objToStr(d) {
    let str = ""
    for (let [key, value] of Object.entries(d)) {
        if (isFloat(value)) {
            str += key + ": " + value.toFixed(2) + "<br/>";
        } else {
            str += key + ": " + value + "<br/>";
        }
    }
    return str
}

let s4 = new ScatterPlot("#v_2", {})
let b4 = new BarChart("#v_3", {color: [WHITE, colorFarmers]})
let e4 = new Explanation("#v_4", [], true, false)
let m4 = new HeatMap("#v_1", {color: [WHITE, colorFarmers]})

s4.registerLinks([b4, e4, m4])
b4.registerLinks([e4, s4, m4])
m4.registerLinks([s4, b4, e4])

let s3 = new ScatterPlot("#d_2", {})
let b3 = new BarChart("#d_3", { color: [WHITE, colorFarmers] })
let e3 = new Explanation("#d_4", [m4], false, true)
let m3 = new HeatMap("#d_1", {color: [WHITE, colorFarmers]})

s3.registerLinks([b3,e3,m3])
b3.registerLinks([e3,s3,m3])
m3.registerLinks([s3,b3,e3])

let s2 = new ScatterPlot("#r_2",{})
let b2 = new BarChart("#r_3", {color:[WHITE, colorFarmers]})
let e2 = new Explanation("#r_4",[m3], true, false)
let m2 = new HeatMap("#r_1", {color:[WHITE, colorFarmers]})

s2.registerLinks([b2,e2,m2])
b2.registerLinks([e2,s2,m2])
m2.registerLinks([s2,b2,e2])

let s1 = new ScatterPlot("#c_2", {})
let b1 = new BarChart("#c_3", { color: [WHITE, colorFarmers] })
let e1 = new Explanation("#c_4", [m2], false, true)
let m1 = new HeatMap("#c_1", {color: [WHITE, colorFarmers]})

s1.registerLinks([b1, e1, m1])
b1.registerLinks([e1, s1, m1])
m1.registerLinks([s1, b1, e1])

let sate1 = null;
if (satellite_data.length > 0) {
    sate1 = new CountrySatelliteHeatMap("#r_6", {color:[WHITE, colorSatellite]})
    sate1.registerLinks([])
}

const CountrySate = satellite_data.map(f => f['NAME'])

const RegionSate = []
const DistrictSate = []

const schemaSate = {
    hierarchy: [first_level_name, second_level_name, third_level_name, fourth_level_name],
    hierarchy_values: [],
    categorical: [first_level_name, 'year'],
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
    hierarchy: [first_level_name, second_level_name, third_level_name, fourth_level_name],
    hierarchy_values: [],
    categorical: [first_level_name, 'year'],
    numerical: ['rank'],
    aggregation: ['mean', 'std', 'count'],
    category: 'year'
}

GetHeatMap(schemaInitial).then(d => {
    LocalData.putData(schemaInitial.categorical[0], d)
    LocalData.putSchema(schemaInitial.categorical[0], schemaInitial)
    m1.plot(schemaInitial)
})

if (sate1) {
    d3.select("#CountrySate").on("change", function() {
        sate1.plot({ schema: schemaSate, level: "Country" })
        })
    sate1.plot({ schema: schemaSate, level: "Country" })
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

function nextLevel(curLevel) {
    if (curLevel === first_level_name) return second_level_name
    else if (curLevel === second_level_name) return third_level_name
    else if (curLevel === third_level_name) return fourth_level_name
}

function isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

function hideBelow(level) {
    switch (level) {
        case first_level_name:
            hideLevel(second_level_name)
        case second_level_name:
            hideLevel(third_level_name)
    }
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

function submitRec(sidValue) {
    console.log("submit")

    result = {
        "sid": sidValue,
        "1990feedback": d3.select("#feedback1990").property("value"),
        "1992feedback": d3.select("#feedback1992").property("value"),
        "1993feedback": d3.select("#feedback1993").property("value"),
        "1994feedback": d3.select("#feedback1994").property("value"),
        "1995feedback": d3.select("#feedback1995").property("value"),
        "1996feedback": d3.select("#feedback1996").property("value"),
        "1997feedback": d3.select("#feedback1997").property("value"),
        "1998feedback": d3.select("#feedback1998").property("value"),
        "1999feedback": d3.select("#feedback1999").property("value"),
        "2000feedback": d3.select("#feedback2000").property("value"),
        "2001feedback": d3.select("#feedback2001").property("value"),
        "2002feedback": d3.select("#feedback2002").property("value"),
        "2003feedback": d3.select("#feedback2003").property("value"),
        "2004feedback": d3.select("#feedback2004").property("value"),
        "2005feedback": d3.select("#feedback2005").property("value"),
        "2006feedback": d3.select("#feedback2006").property("value"),
        "2007feedback": d3.select("#feedback2007").property("value"),
        "2008feedback": d3.select("#feedback2008").property("value"),
        "2009feedback": d3.select("#feedback2009").property("value"),
        "2010feedback": d3.select("#feedback2010").property("value"),
        "2011feedback": d3.select("#feedback2011").property("value"),
        "2012feedback": d3.select("#feedback2012").property("value"),
        "2013feedback": d3.select("#feedback2013").property("value"),
        "2014feedback": d3.select("#feedback2014").property("value"),
        "2015feedback": d3.select("#feedback2015").property("value"),
        "2016feedback": d3.select("#feedback2016").property("value"),
        "2017feedback": d3.select("#feedback2017").property("value"),
        "2018feedback": d3.select("#feedback2018").property("value"),
        "2019feedback": d3.select("#feedback2019").property("value"),
        "2020feedback": d3.select("#feedback2020").property("value"),
        "2021feedback": d3.select("#feedback2021").property("value"),
        "2022feedback": d3.select("#feedback2022").property("value"),
        "2023feedback": d3.select("#feedback2023").property("value"),

        "q1": d3.select("#q1").property("value"),
        "q2": d3.select("#q2").property("value"),
        "q3": d3.select("#q3").property("value"),
        "q4": d3.select("#q4").property("checked"),
        "name": d3.select("#worstname").property("value"),
        "comment": d3.select("#worstcomment").property("value"),
        "password": d3.select("#password").property("value")
    }

    if (result["name"] == "your name") {
        alert("Please enter your name!")
        return
    }

    if (result["q4"] == false) {
        alert("Please click on the checkbox to verify that \"I have reviewed the bad years reported for this village to the best of my knowledge and approve their use for index design.\"!")
        return
    }

    SendRec(result).then((response) => {
        alert("We have received your submission!")
    })
}

function SendRec(schema) {
    const data = {
        'data': schema
    };
    const other_params = {
        headers: { "content-type": "application/json; charset=UTF-8" },
        body: JSON.stringify(data),
        method: "POST",
        mode: "cors"
    };
    return fetch(url + "api/rec", other_params)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } 
            else if (response.status == 401) {
                alert('Incorrect password!')
            }
            throw new Error("Could not reach the API: " + response.statusText);
        }).then(function (data) {
            return data
        })
}

function SendSub(schema) {
    const data = {
        'geo': user_info,
        'time': Date().toLocaleString(),
        'other': result
    };
    const other_params = {
        headers: { "content-type": "application/json; charset=UTF-8" },
        body: JSON.stringify(data),
        method: "POST",
        mode: "cors"
    };
    return fetch(url + "api/sub", other_params)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Could not reach the API: " + response.statusText);
            }
        }).then(function (data) {
            return data
        })
}

function SendLoad(result = "") {
    const data = {
        'geo': user_info,
        'time': Date().toLocaleString(),
        'other': result
    };
    const other_params = {
        headers: { "content-type": "application/json; charset=UTF-8" },
        body: JSON.stringify(data),
        method: "POST",
        mode: "cors"
    };
    return fetch(url + "api/load", other_params)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Could not reach the API: " + response.statusText);
            }
        }).then(function (data) {
            return data
        })
}
