class Visualization {
    // option for vis
    // and link to other vis
    constructor(svg_id, options) {
        this.svg = d3.select(svg_id)
        this.options = options
        this.explainable = true
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
        this.links.forEach(vis => vis.highlight(schema, this.explainable));
    }
    propogateClear() {
        // highlight other vis linked
        this.links.forEach(vis => vis.clear());
    }
    clear() {

    }
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
                callerClass.highlight(d, callerClass.explainable)
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
        this.explainable = false
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
        this.explainable = false
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
        this.explainable = false
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

