
class Explanation {
    constructor(svg_id, links, allowComplaint, allowSurvey, allowDrillDown) {
        this.svg = d3.select(svg_id)
        this.links = links
        this.allowComplaint = allowComplaint
        this.allowSurvey = allowSurvey
        this.allowDrillDown = allowDrillDown
    }
    highlight(schema, explainable) {
        this.clear()
        this.addDetail(schema, explainable)
    }
    clear() {
        this.svg.selectAll("div").remove()
        this.svg.selectAll("select").remove()
        this.svg.selectAll("input").remove()
    }
    addDetail(data, explainable) {
        console.log(data)
        let agg = ['mean', 'std', 'count']
        let s = this.svg

        let callerClass = this;

        if (this.allowSurvey) {
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
        if (Object.entries(data)[0][0] != fourth_level_name) {
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
        this.links[0].propagate(d)
    }
}