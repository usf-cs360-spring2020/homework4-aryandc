d3.csv("fire_department_calls_for_service.csv").then(drawPack);

function drawPack(data) {

    console.log("\n\CIRCLE PACKING JAVASCRIPT STARTS!!!!\n\n");

    height = 500;
    width = 960;
    diameter = Math.min(width, height);
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
            return d["Neighborhooods - Analysis Boundaries"];
        })
        .rollup(function(v) {
            return v.length;
        })
        .entries(data);
  
    console.log("nested_data", nest);
  
    let hierarchial_data = d3.hierarchy(nest[0], function(d) {
      return d.values;
    });
    root = nest[0];
  
    color = d3.scaleSequential([hierarchial_data.height, 0], d3.interpolateViridis);
  
  
    // make sure value is set
    hierarchial_data.count();
    hierarchial_data.sum(d => d.value)
  
    hierarchial_data.sort(function(a, b) {
      return b.height - a.height || b.count - a.count;
    });
  
  
    let hierarchial_layout = d3.pack()
      .padding(r)
      .size([diameter - 2 * pad, diameter - 2 * pad]);
  
    hierarchial_layout(hierarchial_data);
  
  
    let svg = d3.select("body").select("svg#packed")
        .style("width", width)
        .style("height", height);
        
    
      let plot = svg.append("g")
        .attr("id", "plot")
        .attr("transform", translate(240, 10));
  
    drawNodes(plot.append("g"), hierarchial_data.descendants(), false);
    legend(svg);

    function legend(svg) {
      svg.append("circle").attr("cx",830).attr("cy",130).attr("r", 6).style("fill","rgb(253, 238, 32)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.9)
      
      svg.append("circle").attr("cx",830).attr("cy",160).attr("r", 6).style("fill", "rgb(48, 172, 102)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.9)
  
      svg.append("circle").attr("cx",830).attr("cy",190).attr("r", 6).style("fill", "rgb(38, 85, 124)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.9)
  
      svg.append("circle").attr("cx",830).attr("cy",220).attr("r", 6).style("fill", "rgb(52, 0, 67)").style("stroke", "rgb(175, 171, 171)").style('opacity', 0.7)
  
      svg.append("text").attr("x", 850).attr("y", 130).text("City").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")
  
      svg.append("text").attr("x", 850).attr("y", 160).text("Call Type Group").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")
  
      svg.append("text").attr("x", 850).attr("y", 190).text("Call Type").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")
  
      svg.append("text").attr("x", 850).attr("y", 220).text("Neighborhood").style("font-size", "15px").style("fill", "#75888a").attr("alignment-baseline","middle")
  
  }
  
  

  
  function translate(x, y) {
      return 'translate(' + String(x) + ',' + String(y) + ')';
  }
  
  function drawNodes(g, nodes, raise) {
    //let r = 5;
    let circles = g.selectAll('circle')
        .data(nodes, node => node.data.key)
        .enter()
        .append('circle')
        .attr('r', d => d.r ? d.r : r)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('id', d => d.data.key)
        .attr('class', 'node')
        .style('fill', d => color(d.depth))
  
    setupEvents(g, circles, raise);
  }
  
  function setupEvents(g, selection, raise) {

    selection.on('mouseover.highlight', function(d) {
      // https://github.com/d3/d3-hierarchy#node_path
      // returns path from d3.select(this) node to selection.data()[0] root node
      let path = d3.select(this).datum().path(selection.data()[0]);
      console.log("PATH", path)
  
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
      let update = selection.data(path, node => node.data.key);
      update.classed('selected', false);
    });
  
    // show tooltip text on mouseover (hover)
    selection.on('mouseover.tooltip', function(d) {
      showTooltip(g, d3.select(this));
      selection.filter(e => (d.data.key !== e.data.key))
            .transition()
            .duration(500)
            .style("opacity", 0.1);
    });
  
    // remove tooltip text on mouseout
    selection.on('mouseout.tooltip', function(d) {
      g.select("#circle-tooltip").remove();
      selection.transition()
            .duration(500)
            .style("opacity", 1.0);
    });
  }
  
  function showTooltip(g, node) {
    let gbox = g.node().getBBox();     // get bounding box of group BEFORE adding text
    let nbox = node.node().getBBox();  // get bounding box of node
  
    // calculate shift amount
    let dx = nbox.width / 2;
    let dy = nbox.height / 2;
  
    // retrieve node attributes (calculate middle point)
    let x = nbox.x + dx;
    let y = nbox.y + dy;
  
    // get data for node
    let datum = node.datum();
  
    // remove "java.base." from the node name
    let name = datum.data.key;
  
    // use node name and total size as tooltip text
    numberFormat = d3.format(".2~s");
    text = `${name} (${numberFormat(datum.value)} cases)`;
  
    // create tooltip
    let tooltip = g.append('text')
      .text(text)
      .attr('x', x)
      .attr('y', y)
      .attr('dy', -dy - 4) 
      .attr('text-anchor', 'middle') 
      .attr('id', 'circle-tooltip');

    let tbox = tooltip.node().getBBox();
  
    if (tbox.x < gbox.x) {
      tooltip.attr('text-anchor', 'start');
      tooltip.attr('dx', -dx);
    } else if ((tbox.x + tbox.width) > (gbox.x + gbox.width)) {
      tooltip.attr('text-anchor', 'end');
      tooltip.attr('dx', dx);
    }

    if (tbox.y < gbox.y) {
      tooltip.attr('dy', dy + tbox.height);
    }
  }
}