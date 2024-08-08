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

            let level_name = second_level_name
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

            let element = document.getElementById(nextLevelData[0] + "Start");

            showLevel(nextLevelData[0])
            hideBelow(nextLevelData[0])

            element.scrollIntoView({ behavior: 'smooth' });
        })
    }
}