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

class Explanation {
    constructor(svg_id, links, allowSurvey, allowDrillDown) {
        this.svg = d3.select(svg_id)
        this.links = links
        this.allowSurvey = allowSurvey
        this.allowDrillDown = allowDrillDown
    }
    
    highlight(schema) {
        this.clear()
        this.addDetail(schema)
    }

    clear() {
        this.svg.selectAll("div").remove()
        this.svg.selectAll("select").remove()
        this.svg.selectAll("input").remove()
    }

    addDetail(data) {
        console.log(data)
        let s = this.svg

        let callerClass = this;

        if (this.allowSurvey) {
            let shelf_group = s.append("div")
                .text("Please fill in your name and click on \"submit\" after filling in the form.")
                .classed("note", true)

            let level_name = hierarchy[1]
            let level_data = LocalData.getData(level_name)
            level_data = level_data.filter(sidData => sidData[level_name] == data[level_name])
            
            let worstMap = new Map();
            
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
                .text(`Were the bad years reported for this ${feedback_level} similar to other neighboring ${feedback_level}s?`)
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
                .text(`Do you have any reason to believe that some of the bad years reported for this ${feedback_level} are erroneous? (e.g. some of the bad years reported were flood years)`)
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
                .text(`Did you submit improvements for this ${feedback_level}?`)
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
                .text(`I have reviewed the bad years reported for this ${feedback_level} to the best of my knowledge and approve their use for index design.`)
                .classed('que-text', true)
            select = s.append("input")
                .attr("type", "checkbox")
                .attr("id", "q4")
                
            s.append("div")
                .classed('shelf-group', true)
                .append("div")
                .classed('shelf', true)
                .classed('submit', true)
                .on('click', function () {
                    submitRec(data[level_name])
                })
                .append("span")
                .style("margin", "auto")
                .text("Submit")

        }
        if (this.allowDrillDown) {
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
        if (Object.entries(data)[0][0] != hierarchy[3]) {
            s.append("div")
                .classed('shelf-group', true)
                .append("div")
                .classed('shelf', true)
                .classed('submit', true)
                .on('click', function () {
                    callerClass.drillDown(Object.entries(data)[0])
                })
                .append("span")
                .text("Drill down")
        }
    }

    drillDown(nextLevelData) {
        let curSchema = LocalData.getSchema(nextLevelData[0])
        hideComp(nextLevelData[0])
        // deep copy
        let nextSchema = JSON.parse(JSON.stringify(curSchema));
        nextSchema.categorical[0] = nextLevel(nextLevelData[0])
        nextSchema.hierarchy_values.push(nextLevelData[1])
        console.log(nextSchema)
        
        // get comment if it's the last level
        if (nextLevel(nextLevelData[0]) == hierarchy[3]) {
            nextSchema.categorical.push(comment_name)
        }

        GetHeatMap(nextSchema).then(d => {
            LocalData.putData(nextSchema.categorical[0], d)
            LocalData.putSchema(nextSchema.categorical[0], nextSchema)
            this.links.forEach(v => v.plot(nextSchema))
            d3.select("#" + nextLevelData[0] + "Name").text(nextLevelData[1])

            let element = document.getElementById(nextLevelData[0] + "Start");

            showLevel(nextLevelData[0])
            hideBelow(nextLevelData[0])

            element.scrollIntoView({ behavior: 'smooth' });
        })
    }
}