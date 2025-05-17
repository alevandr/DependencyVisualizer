import canvas  from "./Canvas";
import helper from "./Helper";

class Simulation
{
  start(nodes, links, linksArr)
  {
    canvas.width = document.getElementById('graph').offsetWidth;
    canvas.height = document.getElementById('graph').offsetHeight;
    canvas.color = d3.scaleOrdinal(d3.schemeCategory10);

    canvas.nodes = d3.sort(nodes, (d) => d.group);
    canvas.links = links;
    canvas.linksArr = linksArr;

    canvas.simulation = d3.forceSimulation(nodes);
    canvas.createSVG();
    canvas.createLinks(links);
    canvas.createNodes(nodes);

    canvas.simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d=>d.id))
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(canvas.width / 2, canvas.height / 2))
    .on("tick", (d) => {
      canvas.link
        .attr("x1", d => d.source.x)
        .attr("x2", d => d.target.x)
        .attr("y1", d => d.source.y)
        .attr("y2", d => d.target.y);

      canvas.node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
    });

    const prefix = helper.longestCommonPrefix(canvas.nodes);
    helper.setProjectFolder(prefix);
    const customName = helper.getProjectName()
    if (customName)
      helper.setProjectName(customName)

    helper.shortNames = new Map();
    for (const node of canvas.nodes)
    {
      helper.shortNames.set(helper.removePrefix(prefix, node.name), node.name)
    }
    let options = '';
    for (const name of helper.shortNames)
    {
      options += `<option>${name[0]}</option>`; // value="${node.name}"
    }
    let nodesNames = document.getElementById('all-nodes-names');
    nodesNames.innerHTML = options;
  }
  clear()
  {
    if (!canvas.nodes)
      return;
    canvas.nodes.length = 0;
    canvas.links.length = 0;
    canvas.linksArr = 0;
    d3.select("svg").selectAll("*").remove();

    if (helper.shortNames)
    {
      helper.shortNames.clear();
      let nodesNames = document.getElementById('all-nodes-names');
      nodesNames.innerHTML = '';
    }
    if(helper.pathNodes)
    {
      helper.pathNodes.length = 0;
    }
    if(helper.mutuallyLinkedNodes)
    {
      helper.mutuallyLinkedNodes.length = 0;
    }
    helper.setSourceNodeName('');
    helper.setDestinationNodeName('');
    helper.setProjectFolder('');
  }
}

let simulation = new Simulation();
export default simulation;