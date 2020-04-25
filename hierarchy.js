d3.csv("fire_department_calls_for_service.csv").then(drawChart);

function drawChart(data) {

    svg_height = 500;
    svg_width = 960;
    diameter = Math.min(svg_width, svg_height);
    pad = 14;

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

    // console.log('nested data', nest);

    let hierarchy_data = d3.hierarchy(nest[0], function(d) {
        return d.values;
    });

    root = nest[0];

    hierarchy_data.count()
    hierarchy_data.sum(row => row.value)

    hierarchy_data.sort(function(a, b) {
        return b.height - a.height || b.count - a.count;
    });

    // console.log('hierarchy_data', hierarchy_data);

    let hierarchy_layout = d3.cluster().size([2 * Math.PI, (diameter / 2) - pad]);

    hierarchy_layout(hierarchy_data);

    hierarchy_data.each(function(node) {
        node.theta = node.x;
        node.radial = node.y;

        var point = toCartesian(node.radial, node.theta);
        node.x = point.x;
        node.y = point.y;
    });

    let svg = d3.select('body').select('svg#area')
        .style('width', svg_width)
        .style('height', svg_height);

    let plot = svg.append('g')
        .attr('id', 'plot')
        .attr('transform', translate(svg_width / 2, svg_height / 2));

    let edge_generator = d3.linkRadial()
        .angle(d => d.theta + Math.PI / 2)
        .radius(d => d.radial);

    color = d3.scaleSequential([hierarchy_data.height, 0], d3.interpolateViridis);

    drawLinks(plot.append('g'), hierarchy_data.links(), edge_generator);
    drawNodes(plot.append('g'), hierarchy_data.descendants(), true);

    let legend = svg.append('g')
        .attr('id', "legend")
        .attr('transform', translate(svg_width - 150, svg_height / 8));

    drawLegend(svg);
    // console.log('descend', hierarchy_data.descendants());
}

function toCartesian(r, theta) {
    return {
        x: r * Math.cos(theta),
        y: r * Math.sin(theta)
    };
}

function translate(x, y) {
    return 'translate(' + String(x) + ',' + String(y) + ')';
}

function drawLinks(g, links, generator) {
    let paths = g.selectAll('path')
        .data(links)
        .enter()
        .append('path')
        .attr('d', generator)
        .attr('class', 'link')
}

function drawNodes(g, nodes, raise) {
    let r = 5;
    let circles = g.selectAll('circle')
        .data(nodes, node => node.data.key)
        .enter()
        .append('circle')
            .attr('r', d => d.r ? d.r : r)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('id', d => d.data.key)
            .attr('class', 'node')
            .style('fill', d => color(d.depth));

        console.log('circles', circles)

    events(g, circles, raise);
}

function events(g, selection, raise) {
    
    selection.on('mouseover.highlight', function(d) {
        // https://github.com/d3/d3-hierarchy#node_path
        // returns path from d3.select(this) node to selection.data()[0] root node
        let path = d3.select(this).datum().path(selection.data()[0]);
    
        // select all of the nodes on the shortest path
        let update = selection.data(path, node => node.data.key);
    
        // highlight the selected nodes
        update.classed('selected', true);
    
        if (raise) {
          update.raise();
        }
      });

      selection.on('mouseout.highlight', function(d) {
        let path = d3.select(this).datum().path(selection.data()[0]);
        console.log("PATH", path)
        let update = selection.data(path, node => node.data.key);
        update.classed('selected', false);
      });

    // show tooltip text on mouseover (hover)
    selection.on('mouseover.tooltip', function(d) {
        Tooltip(g, d3.select(this));
        
        console.log('d.data.key', d);
        selection.filter(function(e) {
            return d.data.key !== e.data.key;
        })
            .transition()
            .duration(500)
            .style("opacity", 0.3);
    });

    // remove tooltip text on mouseout
    selection.on('mouseout.tooltip', function(d) {
        g.select("#tooltip").remove();
        selection.transition()
            .duration(500)
            .style("opacity", 1.0);
    });

}

function Tooltip(g, node) {

    let group = g.node().getBBox();
    let nodeBox = node.node().getBBox();

    let dx = nodeBox.width / 2;
    let dy = nodeBox.height / 2;

    let x = nodeBox.x + dx;
    let y = nodeBox.y + dy;

    let node_datum = node.datum();

    let node_name = node_datum.data.key;

    // console.log('node', node);

    format = d3.format(".2~s");
    text = `${node_name} (${format(node_datum.value)} cases)`;

    let tip = g.append('text')
        .text(text)
        .attr('x', x)
        .attr('y', y)
        .attr('dy', -dy - 4)
        .attr('text-anchor', 'middle')
        .attr('id', 'tooltip');

    let tipBox = tip.node().getBBox();

    if (tipBox.x < group.x) {
        tip.attr('text-anchor', 'start');
        tip.attr('dx', -dx); 
    } else if ((tipBox.x + tipBox.width) > (group.x + group.width)) {
        tip.attr('text-anchor', 'end');
        tip.attr('dx', dx);
    }

    if (tipBox.y < group.y) {
        tip.attr('dy', dy + tipBox.height);
    }
}

function drawLegend(svg) {
    svg.append("circle").attr("cx",830).attr("cy",130).attr("r", 6).style("fill","rgb(253, 238, 32)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.9)
    
    svg.append("circle").attr("cx",830).attr("cy",160).attr("r", 6).style("fill", "rgb(48, 172, 102)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.9)

    svg.append("circle").attr("cx",830).attr("cy",190).attr("r", 6).style("fill", "rgb(38, 85, 124)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.9)

    svg.append("circle").attr("cx",830).attr("cy",220).attr("r", 6).style("fill", "rgb(52, 0, 67)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.7)

    svg.append("text").attr("x", 850).attr("y", 130).text("City").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")

    svg.append("text").attr("x", 850).attr("y", 160).text("Call Type Group").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")

    svg.append("text").attr("x", 850).attr("y", 190).text("Call Type").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")

    svg.append("text").attr("x", 850).attr("y", 220).text("Supervisor").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")

    svg.append("text").attr("x", 850).attr("y", 240).text("District").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")
}