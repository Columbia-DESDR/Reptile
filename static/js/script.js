console.log("FLASK VARIABLES", FLASK_VARIABLES);

const YEAR_START = FLASK_VARIABLES.start
const YEAR_LENGTH = FLASK_VARIABLES.length

// url to this page (and infer server address)
const url = window.location.origin + '/';

// margin.right_short is for no lengend
let margin = { top: 10, right: 100, bottom: 100, left: 60, right_short: 20 },
    height = 600 - margin.top - margin.bottom;

function GetHeatMap(schema) {
    var x, text;
    // Get the value of the input field with id="numb"
    const data = {
        'filename': schema.filename,
        'hiearchy': schema.hiearchy,
        'hierchy_values': schema.hierchy_values,
        'categorical': schema.categorical,
        'numerical': schema.numerical,
        'aggragation': schema.aggragation,
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
    var x, text;
    // Get the value of the input field with id="numb"
    const data = {
        'filename': schema.filename,
        'hiearchy': schema.hiearchy,
        'hierchy_values': schema.hierchy_values,
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

class Visualization {
    // option for vis
    // and link to other vis
    constructor(svg_id, options) {
        this.svg = d3.select(svg_id)
        this.options = options
        this.explanable = true

    }
    registerLinks(links) {
        this.links = links
    }
    plot() {

    }
    highlight() {

    }
    propogate(schema) {
        // highlight other vis linked
        this.links.forEach(vis => vis.highlight(schema, this.explanable));
    }
    propogateClear() {
        // highlight other vis linked
        this.links.forEach(vis => vis.clear());
    }
    clear() {

    }
}

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

// options needs to specify the color 
// specified by an array of two element [start, end]
// {
//     color: ["#cc6600","#fff3e6"],
// }
class HeatMap extends Visualization {
    // plot HeatMap given the schema
    plot(schema) {
        this.propogateClear()
        this.schema = schema
        this.process(LocalData.getData(schema.categorical[0]))
    }
    process(data) {

        // get all the names as x
        let x_column = [...new Set(data.map(d => d[this.schema.categorical[0]]))].sort()

        // generate all the years (hard coded)
        let y_column = Array.from({ length: YEAR_LENGTH }, (x, i) => i + YEAR_START)

        // generate color according to option
        let Color = d3.scaleLinear()
            .range(this.options.color)
            .domain([0, 8])

        //for the legend
        let key = [0, 1, 2, 3, 4, 5, 6, 7, 8]
        let size = 15


        let spec = {
            data: data,
            encoding: {
                x: { range: x_column, field: this.schema.categorical[0] },
                y: { range: y_column, field: this.schema.categorical[1] },
                rect: { color: Color, field: this.schema.aggragation[0] }
            },
            legend: {
                size: size,
                key: key
            },
            tooltip: {
                mouseover: heatmap_tooptip_mouseover
            },
            svg: this.svg
        };
        this.spec = spec
        this.render(this.spec)
    }
    clear() {
        this.svg.select("g").remove()
    }
    render(spec) {
        let width = spec.encoding.x.range.length * 15;
        this.clear()

        let s = spec.svg.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        if ("legend" in spec) {
            // Add one dot in the legend for each name.
            let dots = s.selectAll("#mydots")
                .data(spec.legend.key)
            dots.exit().remove()
            dots.enter()
                .append("rect").merge(dots)
                .attr("x", width + 20)
                .attr("y", function (d, i) { return 100 + i * (spec.legend.size + 5) })
                .attr("width", spec.legend.size)
                .attr("height", spec.legend.size)
                .style("fill", function (d) {
                    return spec.encoding.rect.color(d)
                })
                .attr("id", "mydots")

            // Add one dot in the legend for each name.
            let labels = s.selectAll("#mylabels").data(spec.legend.key)
            labels.exit().remove()
            labels.enter()
                .append("text").merge(labels)
                .attr("x", width + 40)
                .attr("y", function (d, i) { return 100 + i * (spec.legend.size + 5) + (spec.legend.size / 2) })
                .text(function (d) { return d })
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .attr("id", "mylabels")
        }

        // Build y scales and axis:
        let y = d3.scaleBand()
            .range([height, 0])
            .domain(spec.encoding.y.range)
            .padding(0.01);

        s.select("#y_axis").remove()
        s.append("g")
            .attr("id", "y_axis")
            .call(d3.axisLeft(y));

        // Build X scales and axis:
        let x = d3.scaleBand()
            .range([0, width])
            .domain(spec.encoding.x.range)
            .padding(0.01);

        s.select("#x_axis").remove()
        s.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("id", "x_axis")
            // .attr('transform', 'rotate(45 -10 10)')
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // this in d3 refers to html element
        let callerClass = this;
        let rectangle = s.selectAll(".heatmap_rect").data(spec.data)
        rectangle.exit().remove()
        rectangle.enter()
            .append("rect").merge(rectangle)
            .attr("x", function (d) { return x(d[spec.encoding.x.field]) })
            .attr("y", function (d) { return y(d[spec.encoding.y.field]) })
            .classed("heatmap_rect", true)
            // no space allowed in the id
            .attr("id", function (d) { return ("i" + d[spec.encoding.x.field] + " " + d[spec.encoding.y.field]).replace(/ /g, "_") })
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("opacity", 1)
            .classed("highlight", false)
            .style("fill", function (d) {
                if (d[spec.encoding.rect.field] == 0)
                    return "#FFFFFF"
                else
                    return spec.encoding.rect.color(d[spec.encoding.rect.field])
            })
            .on("mouseover", spec.tooltip.mouseover)
            .on("mousemove", function () { return tooltipdiv.style("top", (event.pageY) + "px").style("left", (event.pageX) + "px"); })
            .on("mouseout", function () { return tooltipdiv.style("opacity", 0); })
            .on("click", function (d) {
                callerClass.highlight(d, callerClass.explanable)
                callerClass.propogate(d)
            })
    }
    highlight(schema) {
        this.cancelHighlight()
        this.svg.select("#" + ("i" + schema[this.spec.encoding.x.field] + " " + schema[this.spec.encoding.y.field]).replace(/ /g, "_"))
            .moveToFront()
            .classed("highlight", true)
    }
    cancelHighlight() {
        // console.log(this.svg)
        this.svg.selectAll(".heatmap_rect").classed("highlight", false);
    }
    data(schema) {
        let selected_d
        this.svg.select("#" + ("i" + schema[this.spec.encoding.x.field] + " " + schema[this.spec.encoding.y.field]).replace(/ /g, "_"))
            .each((d) => { selected_d = d })
        return selected_d
    }
}

class CountrySatelliteHeatMap extends HeatMap {
    constructor(svg_id, options) {
        super(svg_id, options)
        this.explanable = false
    }
    // when plot, need to first get satellite data
    // when put sate, first filter values
    plot({ schema, level = "" }) {
        // deep copy schema since we are going to change it
        // can pass nothing when changing satellite
        if(schema){
            this.schema = JSON.parse(JSON.stringify(schema))
        }
        
        // if level is ""
        if(level == ""){
            level = "Region"
        }
        let sate = d3.select("#" + level +"Sate").property("value")

        this.schema.filename = SateToFile[sate]
        console.log(this.schema)
        GetHeatMap(this.schema).then(d=>{
            // filter out 
            // d = d.filter((e)=> m1.spec.encoding.x.range.includes(e[nextLevel(level)]))
            console.log(d)
            this.process(d)
        })
    }
}

class RegionSatelliteHeatMap extends HeatMap {
    constructor(svg_id, options) {
        super(svg_id, options)
        this.explanable = false
    }
    // when plot, need to first get satellite data
    // when put sate, first filter values
    plot(schema) {
        // deep copy schema since we are going to change it
        // can pass nothing when changing satellite
        if(schema){
            this.schema = JSON.parse(JSON.stringify(schema))
        }
        
        let level = "Region"
        let sate = d3.select("#" + level +"Sate").property("value")

        this.schema.filename = SateToFile[sate]
        console.log(this.schema)
        GetHeatMap(this.schema).then(d=>{
            // filter out 
            d = d.filter((e)=> m2.spec.encoding.x.range.includes(e[nextLevel(level)]))
            
            this.process(d)
        })
    }
}

class DistrictSatelliteHeatMap extends HeatMap {
    constructor(svg_id, options) {
        super(svg_id, options)
        this.explanable = false
    }

    // when plot, need to first get satellite data
    // when put sate, first filter values
    plot(schema) {  }

    process(data) {  }

    // for now, don't do anything
    highlight(schema) {}
}

class ScatterPlot extends Visualization {
    // plot HeatMap given the schema
    plot(schema, value) {
        this.schema = schema
        this.value
        this.process(LocalData.getData(schema.categorical[0], schema.categorical[0], value))
    }

    process(data) {
        // generate all the years (hard coded)
        let y_column = Array.from({ length: YEAR_LENGTH }, (x, i) => i + YEAR_START)

        //for the legend
        let key = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        let size = 15

        let spec = {
            data: data,
            encoding: {
                y: { range: y_column, field: this.schema.categorical[1] },
            },
            tooltip: {
                mouseover: heatmap_tooptip_mouseover
            },
            svg: this.svg
        };
        this.spec = spec
        this.render(this.spec)
    }

    clear() {
        this.svg.select("g").remove()
    }

    render(spec) {
        let width = 200;
        this.clear()
        let s = spec.svg.attr("width", width + margin.left + margin.right_short)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Build y scales and axis:
        let y = d3.scaleLinear()
            .range([height, 0])
            // hard code this part for year we need some padding
            .domain([1989.5, 2023.5])
        // .domain(spec.encoding.y.range)

        s.select("#y_axis").remove()
        s.append("g")
            .attr("id", "y_axis")
            .call(d3.axisLeft(y).ticks(YEAR_LENGTH).tickFormat(d3.format("d")));

        s.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 20) + ")")
            .style("text-anchor", "middle")
            .text("Mean");

        // Build X scales and axis:
        let x = d3.scaleLinear()
            .domain([-1, 11])
            .range([0, width]);

        s.select("#x_axis").remove()
        s.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("id", "x_axis")
            // .attr('transform', 'rotate(45 -10 10)')
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        // http://bl.ocks.org/dustinlarimer/5888271
        // marker
        let marks = [{ name: 'stub', path: 'M 0,0 m -1,-5 L 1,-5 L 1,5 L -1,5 Z', viewbox: '-1 -5 2 10' }]
        let defs = s.append('svg:defs')
        defs.selectAll('marker')
            .data(marks)
            .enter()
            .append('svg:marker')
            .attr('id', function (d) { return 'marker_' + d.name })
            .attr('markerHeight', 5)
            .attr('markerWidth', 5)
            .attr('markerUnits', 'strokeWidth')
            .attr('orient', 'auto')
            .attr('refX', 0)
            .attr('refY', 0)
            .attr('viewBox', function (d) { return d.viewbox })
            .append('svg:path')
            .attr('d', function (d) { return d.path })


        let callerClass = this;
        let line = s.selectAll(".line").remove()
        s.selectAll(".line").data(spec.data).enter()
            .append('path')
            .attr('d', function (d) { return d3.line()([[x(d["mean"] - d["std"]), y(d["year"])], [x(d["mean"] + d["std"]), y(d["year"])]]) })
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .classed("dot", false)
            .classed("line", true)
            .attr('marker-start', 'url(#marker_stub)')
            .attr('marker-end', 'url(#marker_stub)')
            .attr("id", function (d) { return "a" + d["year"] })
            .on("mouseover", spec.tooltip.mouseover)
            .on("mousemove", function () { return tooltipdiv.style("top", (event.pageY) + "px").style("left", (event.pageX) + "px"); })
            .on("mouseout", function () { return tooltipdiv.style("opacity", 0); })
            .on("click", function (d) {
                callerClass.highlight(d)
                callerClass.propogate(d)
            })

        let dot = s.selectAll(".dot").remove()
        s.selectAll(".dot").data(spec.data).enter()
            .append("circle")
            .attr("cx", function (d) { return x(d["mean"]) })
            .attr("cy", function (d) { return y(d["year"]) })
            .attr("r", 3)
            // need class because we want to first know what to remove
            .classed("dot", true)
            .classed("line", false)
            .attr('fill', function (d) { if (d["mean"] === null) { return 'none' } return "grey" })
            // id can't start with num
            .attr("id", function (d) { return "a" + d["year"] })
            .on("mouseover", spec.tooltip.mouseover)
            .on("mousemove", function () { return tooltipdiv.style("top", (event.pageY) + "px").style("left", (event.pageX) + "px"); })
            .on("mouseout", function () { return tooltipdiv.style("opacity", 0); })
            .on("click", function (d) {
                callerClass.highlight(d)
                callerClass.propogate(d)
            })
    }
    // line and dot are identified by year
    highlight(schema) {
        // console.log(schema)
        if (this.schema == null) {
            this.schema = LocalData.getSchema(getLevel(schema))
            this.plot(this.schema, schema[this.schema.categorical[0]])
        }
        else if (schema[this.schema.categorical[0]] != this.value) {
            this.plot(this.schema, schema[this.schema.categorical[0]])
        }

        this.cancelHighlight()
        this.svg.selectAll("#" + "a" + schema["year"])
            .moveToFront()
            .classed("highlight", true)
    }

    cancelHighlight() {
        this.svg.selectAll(".dot").classed("highlight", false);
        this.svg.selectAll(".line").classed("highlight", false);
    }
}

class BarChart extends Visualization {
    // plot HeatMap given the schema
    plot(schema, value) {
        this.schema = schema
        this.process(LocalData.getData(schema.categorical[0], schema.categorical[0], value))
    }

    process(data) {
        // generate all the years (hard coded)
        let y_column = Array.from({ length: YEAR_LENGTH }, (x, i) => i + YEAR_START)

        //for the legend
        let key = [1, 2, 3, 4, 5, 6, 7, 8]
        let size = 15

        // generate color according to option
        let Color = d3.scaleLinear()
            .range(this.options.color)
            .domain([0, 8])

        let spec = {
            data: data,
            encoding: {
                y: { range: y_column, field: this.schema.categorical[1] },
                rect: { color: Color, field: this.schema.aggragation[0] }
            },
            tooltip: {
                mouseover: heatmap_tooptip_mouseover
            },
            svg: this.svg
        };
        this.spec = spec
        this.render(this.spec)
    }
    clear() {
        this.svg.select("g").remove()
    }
    render(spec) {
        let width = 200;
        this.clear()
        let s = spec.svg.attr("width", width + margin.left + margin.right_short)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // Build y scales and axis:
        let y = d3.scaleBand()
            .range([height, 0])
            .domain(spec.encoding.y.range)
            .padding(0.01);

        s.select("#y_axis").remove()
        s.append("g")
            .attr("id", "y_axis")
            .call(d3.axisLeft(y));

        let maxCount = 0;
        spec.data.forEach(d => maxCount = Math.max(maxCount, d["count"]));

        // Build X scales and axis:
        let x = d3.scaleLinear()
            .domain([0, maxCount])
            .range([0, width]);

        s.select("#x_axis").remove()
        s.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("id", "x_axis")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

        s.append("text")
            .attr("transform",
                "translate(" + (width / 2) + " ," +
                (height + margin.top + 30) + ")")
            .style("text-anchor", "middle")
            .text("Count");


        let callerClass = this;
        s.selectAll(".bar").remove()
        s.selectAll(".bar").data(spec.data).enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function (d) { return y(d["year"]) })
            .classed("bar", true)
            .attr("id", function (d) { return "a" + d["year"] })
            .attr("width", function (d) { return x(d["count"]) })
            .attr("height", y.bandwidth())
            .style("opacity", 1)
            .style("fill", function (d) {
                if (d[spec.encoding.rect.field] == null)
                    return "#FFFFFF"
                else
                    return spec.encoding.rect.color(d[spec.encoding.rect.field])
            })
            .style("stroke-width", 0.5)
            // stroke with max color value
            .style("stroke", spec.encoding.rect.color(8))
            .on("mouseover", spec.tooltip.mouseover)
            .on("mousemove", function () { return tooltipdiv.style("top", (event.pageY) + "px").style("left", (event.pageX) + "px"); })
            .on("mouseout", function () { return tooltipdiv.style("opacity", 0); })
            .on("click", function (d) {
                callerClass.highlight(d)
                callerClass.propogate(d)
            })
    }
    // bar are identified by year
    highlight(schema) {

        if (this.schema == null) {
            this.schema = LocalData.getSchema(getLevel(schema))
            this.plot(this.schema, schema[this.schema.categorical[0]])
        }
        else if (schema[this.schema.categorical[0]] != this.value) {
            this.plot(this.schema, schema[this.schema.categorical[0]])
        }
        this.cancelHighlight()
        this.svg.select("#" + "a" + schema["year"])
            .moveToFront()
            .classed("highlight", true)
    }

    cancelHighlight() {
        this.svg.selectAll(".bar").classed("highlight", false);
    }
}

class Explanation {
    constructor(svg_id, links, allowComplaint, allowsurvey, allowdrillDown) {
        this.svg = d3.select(svg_id)
        this.links = links
        this.allowComplaint = allowComplaint
        this.allowsurvey = allowsurvey
        this.allowdrillDown = allowdrillDown
    }
    highlight(schema, explanable) {
        this.clear()
        this.addDetail(schema, explanable)
    }
    clear() {
        this.svg.selectAll("div").remove()
        this.svg.selectAll("select").remove()
        this.svg.selectAll("input").remove()
    }
    addDetail(data, explanable) {
        console.log(data)
        let agg = ['mean', 'std', 'count']
        let s = this.svg

        let callerClass = this;

        if (this.allowsurvey) {
            let shelf_group = s.append("div")
                .text("Please fill in your name and click on \"submit\" after filling in the form.")
                .classed("note", true)

            let level_name = second_level_name
            let level_data = LocalData.getData(level_name)
            level_data = level_data.filter(sidData => sidData[level_name] == data[level_name])
            
            let worstMap = new Map();
            let causeMap = new Map()
            
            Object.entries(level_data).forEach(function (sidD) {
                // compue the sum based on mean * count
                sidD[1]['sum'] = sidD[1]['mean'] * sidD[1]['count']
                if (sidD[1]['mean'] != 0) {
                    worstMap[9 - sidD[1]['mean']] = sidD[1]['year']
                }
            })

            // sort the level_data based on sum
            level_data.sort(function (a, b) {
                return b['sum'] - a['sum']
            })

            console.log(level_data)

            shelf_group = s.append("div")
                .classed('shelf-group', true)

            let shelf = shelf_group.append("div")
                .classed('shelf', true)

            shelf.append("div")
                .classed('shelf-key', true)
                .text(level_name)

            let select = shelf.append("div")
                .classed('shelf-val', true)
                .append("span")
                .classed('placeholder', true)
                .text(data[level_name])

            // for each level_data
            for (let i = 0; i < level_data.length; i++) {
                // get the Year and Sum
                let year = level_data[i]['year']
                let sum = level_data[i]['sum']

                shelf_group = s.append("div")
                    .classed('shelf-group', true)

                let shelf = shelf_group.append("div")
                    .classed('shelf', true)

                shelf.append("div")
                    .classed('shelf-key', true)
                    .text(year)

                let select = shelf.append("div")
                    .classed('shelf-val', true)
                    .append("span")
                    .classed('placeholder', true)
                    .text(sum)

                shelf_group = s.append("div")
                .classed('shelf-group', true)

                shelf = shelf_group.append("div")
                    .classed('shelf', true)

                select = shelf.append("div")
                    .append("input")
                    .classed('input-comment', true)
                    .attr("value", "your feedback here")
                    .attr("id", "feedback" + year)
            }
            
            // ### NAME
            shelf_group = s.append("div")
                .classed('shelf-group', true)

            shelf = shelf_group.append("div")
                .classed('shelf', true)

            select = shelf.append("div")
                .classed('shelf-val', true)
                .append("input")
                .classed('input-comment', true)
                .attr("value", "your name")
                .attr("id", "worstname")

            // ### PASSWORD
            shelf_group = s.append("div")
                .classed('shelf-group', true)

            shelf = shelf_group.append("div")
                .classed('shelf', true)

            select = shelf.append("div")
                .classed('shelf-val', true)
                .append("input")
                .classed('input-comment', true)
                .attr("value", "your password")
                .attr("id", "password")

            // ### COMMENT
            shelf_group = s.append("div")
                .classed('shelf-group', true)

            shelf = shelf_group.append("div")
                .classed('shelf', true)

            select = shelf.append("div")
                .classed('shelf-val', true)
                .append("input")
                .classed('input-comment', true)
                .attr("value", "your comment")
                .attr("id", "worstcomment")

            // ### DROPDOWN 1
            shelf_group = s.append("div")
                .text("Were the bad years reported for this village similar to other neighboring villages in the woreda?")
                .classed('que-text', true)
            select = s.append("select")
                .attr("id", "q1")
                .classed('subtitle-select', true)
            select.append("option")
                .text("yes")
            select.append("option")
                .text("no")

            // ### DROPDOWN 2
            shelf_group = s.append("div")
                .text("Do you have any reason to believe that some of the bad years reported for this village are erroneous? (e.g. some of the bad years reported were flood years)")
                .classed('que-text', true)
            select = s.append("select")
                .attr("id", "q2")
                .classed('subtitle-select', true)
            select.append("option")
                .text("yes")
            select.append("option")
                .text("no")

            // ### DROPDOWN 3
            shelf_group = s.append("div")
                .text("Did you submit improvements for this village?")
                .classed('que-text', true)
            select = s.append("select")
                .attr("id", "q3")
                .classed('subtitle-select', true)
            select.append("option")
                .text("yes")
            select.append("option")
                .text("no")

            // ### CHECKBOX
            shelf_group = s.append("div")
                .text("I have reviewed the bad years reported for this village to the best of my knowledge and approve their use for index design.")
                .classed('que-text', true)
            select = s.append("input")
                .attr("type", "checkbox")
                .attr("id", "q4")
                
            s.append("div")
                .classed('shelf-group', true)
                .append("div")
                .classed('shelf', true)
                .classed('submit', true)
                .append("span")
                .style("margin", "auto")
                .text("Submit")
                .on('click', function () {
                    submitRec(data[level_name])
                })
        }
        if (this.allowdrillDown) {
            // can also use data enter
            // however some logics are hard to write like staggering shelf and content
            Object.entries(data).forEach(function (attribute) {
                let shelf_group = s.append("div")
                    .classed('shelf-group', true)

                let shelf = shelf_group.append("div")
                    .classed('shelf', true)
                    
                    
                shelf.append("div")
                    .classed('shelf-key', true)
                    .text(attribute[0])

                shelf.append("div")
                    .classed('shelf-val', true)
                    .text(attribute[1])
            })

        }

        // drill down to next level
        if (Object.entries(data)[0][0] != fourth_level_name) {
            s.append("div")
                .classed('shelf-group', true)
                .append("div")
                .classed('shelf', true)
                .classed('submit', true)
                .append("span")
                .text("Drill down")
                .on('click', function () {
                    callerClass.drillDown(Object.entries(data)[0])
                })
        }

    }

    drillDown(nextLevelData) {
        let curSchema = LocalData.getSchema(nextLevelData[0])
        hideComp(nextLevelData[0])
        // deep copy
        let nextSchema = JSON.parse(JSON.stringify(curSchema));
        nextSchema.categorical[0] = nextLevel(nextLevelData[0])
        nextSchema.hierchy_values.push(nextLevelData[1])
        console.log(nextSchema)
        
        // get comment if it's the last level
        if (nextLevel(nextLevelData[0]) == fourth_level_name) {
            nextSchema.categorical.push(comment_name)
        }

        GetHeatMap(nextSchema).then(d => {
            LocalData.putData(nextSchema.categorical[0], d)
            LocalData.putSchema(nextSchema.categorical[0], nextSchema)
            this.links.forEach(v => v.plot(nextSchema))
            d3.select("#" + nextLevelData[0] + "Name").text(nextLevelData[1])

            let elmnt = document.getElementById(nextLevelData[0] + "Start");

            showLevel(nextLevelData[0])
            hideBelow(nextLevelData[0])

            elmnt.scrollIntoView({ behavior: 'smooth' });
        })
    }

    writeComplain(data, att, tooLarge) {


        let callerClass = this;

        let level = getLevel(data)

        d3.select("#" + getLevel(data) + "Exp")
            .selectAll("div")
            .remove()

        let com_sentence = d3.select("#" + getLevel(data) + "Comp")
            .text("Complaint: " + level + ": ")

        com_sentence.append("b")
            .text(data[level])
        com_sentence.append("text")
            .text(", year: ")
        com_sentence.append("b")
            .text(data["year"])
        com_sentence.append("text")
            .text(", " + att + ": ")
        com_sentence.append("b")
            .text(data[att].toFixed(2))
        com_sentence.append("text")
            .text(" is" + (tooLarge ? " too large" : " too small"))

        let aggOriginal = {}
        aggOriginal["mean"] = data["mean"]
        aggOriginal["std"] = data["std"]
        aggOriginal["count"] = data["count"]

        let schema = {
            'level': getLevel(data),
            'value': data[getLevel(data)],
            'year': data['year'],
            'aggOriginal': aggOriginal,
            'complained_agg': att,
            'com_too_small': !tooLarge
        }

        GetExplanation(schema).then(d => {

            d3.select("#" + getLevel(data) + "CompButton")
                .selectAll("div")
                .remove()

            if (d.length == 0) {
                d3.select("#" + getLevel(data) + "CompButton")
                    .append("div")
                    .style("color", "#0289ae")
                    .text("Sorry, no good explanations found.")
                return
            }
            d3.select("#" + getLevel(data) + "CompButton")
                .selectAll("div")
                .data(d)
                .enter()
                .append("div")
                .classed("shelf-group", true)
                .style("margin-right", "20px")
                .style("max-width", "70px")
                .append("div")
                .classed("shelf", true)
                .classed("explan", true)
                .append("span")
                .style("margin", "auto")
                .text(function (d, i) { return "Explanation " + (i + 1); })
                .on("click", function (d) {
                    callerClass.writeExplain(d, data, att)
                })
        })

    }
    writeExplain(data, dataHigher, att) {
        console.log(data)
        let level = getLevel(data)

        d3.select("#" + getLevel(dataHigher) + "Exp")
            .selectAll("div")
            .remove()

        let exp_sentence = d3.select("#" + getLevel(dataHigher) + "Exp")
            .append("div")
            .text("Explanation: " + level + ": ")

        exp_sentence.append("b")
            .text(data[level])
        exp_sentence.append("text")
            .text(", year: ")
        exp_sentence.append("b")
            .text(data["year"])
        exp_sentence.append("text")
            .text(" should be")

        exp_sentence = d3.select("#" + getLevel(dataHigher) + "Exp")
            .append("div")
        for (var key of Object.keys(data["aggNew"])) {
            exp_sentence.append("text")
                .text(key + ": ")
            exp_sentence.append("b")
                .text(data["aggNew"][key].toFixed(2) + ", ")
        }
        exp_sentence = d3.select("#" + getLevel(dataHigher) + "Exp")
            .append("div")
            .text("After repair,: " + getLevel(dataHigher) + ": ")

        exp_sentence.append("b")
            .text(dataHigher[getLevel(dataHigher)])
        exp_sentence.append("text")
            .text(", year: ")
        exp_sentence.append("b")
            .text(dataHigher["year"])
        exp_sentence.append("text")
            .text(", " + att + " would be: ")
        exp_sentence.append("b")
            .text(data["after"].toFixed(2))

        let d = this.links[0].data(data)
        console.log(d)
        this.links[0].highlight(d)
        this.links[0].propogate(d)
    }
}

let s4 = new ScatterPlot("#v_2", {})
let b4 = new BarChart("#v_3", { color: ["#ffffff", "#ff0097"] })
let e4 = new Explanation("#v_4", [], false, true, false)
let m4 = new HeatMap("#v_1", { color: ["#ffffff", "#ff0097"] })
s4.registerLinks([b4, e4, m4])
b4.registerLinks([e4, s4, m4])
m4.registerLinks([s4, b4, e4])

let s3 = new ScatterPlot("#d_2", {})
let b3 = new BarChart("#d_3", { color: ["#ffffff", "#ff0097"] })
let e3 = new Explanation("#d_4", [m4], false, false, true)
let m3 = new HeatMap("#d_1", { color: ["#ffffff", "#ff0097"] })

s3.registerLinks([b3,e3,m3])
b3.registerLinks([e3,s3,m3])
m3.registerLinks([s3,b3,e3])

let s2 = new ScatterPlot("#r_2",{})
let b2 = new BarChart("#r_3", {color:["#ffffff","#ff0097"]})

let e2 = new Explanation("#r_4",[m3],true, true, false)
let m2 = new HeatMap("#r_1",{color:["#ffffff","#ff0097"]})

s2.registerLinks([b2,e2,m2])
b2.registerLinks([e2,s2,m2])
m2.registerLinks([s2,b2,e2])

let s1 = new ScatterPlot("#c_2", {})
let b1 = new BarChart("#c_3", { color: ["#ffffff", "#ff0097"] })

let e1 = new Explanation("#c_4", [m2], true, false, true)
let m1 = new HeatMap("#c_1", { color: ["#ffffff", "#ff0097"] })
let sate1 = new CountrySatelliteHeatMap("#r_6",{color:["#ffffff","#ff0097"]})

s1.registerLinks([b1, e1, m1])
b1.registerLinks([e1, s1, m1])
m1.registerLinks([s1, b1, e1])
sate1.registerLinks([])
let season_a = "./db/season_a.csv"
let season_b = "./db/season_b.csv"

let filename = FLASK_VARIABLES.filename
let first_level_name = FLASK_VARIABLES.first_level_name
let second_level_name = FLASK_VARIABLES.second_level_name
let third_level_name = FLASK_VARIABLES.third_level_name
let fourth_level_name = FLASK_VARIABLES.fourth_level_name
let time_name = FLASK_VARIABLES.time_name
let numerical_name = FLASK_VARIABLES.numerical_name
let comment_name = FLASK_VARIABLES.comment_name

let SateToFile ={
    season_a: season_a,
    season_b: season_b,
}

let CountrySate = ["season_a", "season_b"]
let RegionSate = []
let DistrictSate = []

let schemaSate = {
    hiearchy: [first_level_name, second_level_name, third_level_name, fourth_level_name],
    hierchy_values: [],
    categorical: [first_level_name, 'year'],
    numerical: ['drought_rank'],
    aggragation: ['mean', 'std', 'count'],
    category: 'year'
}

d3.select("#CountrySate")
    .selectAll('option')
    .data(CountrySate)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; })

d3.select("#CountrySate").on("change", function() {
    sate1.plot({ schema: schemaSate, level: "Country" })
    })

d3.select("#RegionSate")
    .selectAll('option')
    .data(RegionSate)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; }) 
    
d3.select("#RegionSate").on("change", function() {
    sate2.plot()
    })

d3.select("#DistrictSate")
    .selectAll('option')
    .data(DistrictSate)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; }) 

d3.select("#DistrictSate").on("change", function() {
    sate3.plot()
    })

let schemaInitial = {
    filename: filename,
    hiearchy: [first_level_name, second_level_name, third_level_name, fourth_level_name],
    hierchy_values: [],
    categorical: [first_level_name, 'year'],
    numerical: ['rank'],
    aggragation: ['mean', 'std', 'count'],
    category: 'year'
}



GetHeatMap(schemaInitial).then(d => {
    LocalData.putData(schemaInitial.categorical[0], d)
    LocalData.putSchema(schemaInitial.categorical[0], schemaInitial)
    m1.plot(schemaInitial)
})

sate1.plot({ schema: schemaSate, level: "Country" })

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


function submitRec(sidvalue) {
    console.log("submit")

    result = {
        "sid": sidvalue,
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
    }


    
    if (result["name"] == "your name") {
        alert("Please enter your name!")
        return
    }

    if (result["q4"] == false) {
        alert("Please click on the checkbox to verify that \"I have reviewed the bad years reported for this village to the best of my knowledge and approve their use for index design.\"!")
        return
    }

    SendRec(result).then(() => {
        alert("We have received your submission!")
    })
}

function SendRec(schema) {
    var x, text;
    // Get the value of the input field with id="numb"
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
            } else {
                throw new Error("Could not reach the API: " + response.statusText);
            }
        }).then(function (data) {
            return data
        })
}

function SendSub(schema) {
    var x, text;
    // Get the value of the input field with id="numb"
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
    var x, text;
    // Get the value of the input field with id="numb"
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
