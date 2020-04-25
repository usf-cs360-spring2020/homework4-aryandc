d3.csv("fire_department_calls_for_service.csv").then(drawTree);

function drawTree(data) {

    console.log("\n\nTREE JAVASCRIPT STARTS!!!!\n\n");

    svg_height = 500;
    svg_width = 960;
    diameter = Math.min(svg_width, svg_height);
    pad =14;
    r = 5;

    let nest = d3.nest()
        .key(function(d) {
            return d["City"];
        })
        .key(function(d) {
            return d["Call Type Group"];
        })
        .key(function(d) {
            return d["Call Type"];
        })
        .key(function(d) {
            return d["Supervisor District"];
        })
        .rollup(function(v) {
            return v.length;
        })
        .entries(data);

    console.log('nest', nest);

    let hierarchial_data = d3.hierarchy(nest[0], function(d) {
        return d.values;
    });
    root = nest[0];

    console.log('root', root);

    color = d3.scaleSequential([hierarchial_data.height, 0], d3.interpolateViridis);


    hierarchial_data.sort(function(a,b) {
        return b.height - a.height || b.count - a.count;
    });

    hierarchial_data.sum(d => d.value);

    let hierarchial_layout = d3.treemap().padding(r)
        .size([(svg_width / 2 - pad) + 200, svg_height - 2 * pad]);

    hierarchial_layout(hierarchial_data);

    let svg = d3.select("body").select("svg#tree")
      .style("width", svg_width)
      .style("height", svg_height + 10);

    let plot = svg.append("g")
      .attr("id", "plot")
      .attr("transform", translate(pad, pad));

    let rects = plot.selectAll('rect')
        .data(hierarchial_data.descendants())
        .enter()
        .append('rect')
        .attr('x', function(d) {return d.x0;})
        .attr('y', function(d) {return d.y0;})
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("id", function(d) { return d.data.name; })
        .attr("class", "node")
        .style("fill", function(d) {return color(d.depth)});
        
    events(plot, rects, false);
    drawLegend(svg);
}