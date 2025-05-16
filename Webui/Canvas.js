import helper from './Helper'

class Canvas
{
  static width;
  static height;
  static color;
  
  static links;
  static linksArr;
  static nodes;

  static link; // confusing with links
  static node; // confusing with nodes

  static simulation;
  static svg;

  createSVG()
  {
    this.svg = d3.selectAll("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .attr("viewBox", [0, 0, this.width, this.height])
      .attr("style", "max-width: 100%; height: auto;");
    this.svg.call(d3.zoom()
    .on("zoom", (event, d) => {
      this.svg.selectAll('g').attr('transform', event.transform);
    }));
    this.svg.on("dblclick.zoom", null);


    this.svg.append("defs").selectAll("marker")
    .data(["end"])
    .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
    .append("path")
      .attr("fill", "#ffffff")
      .attr("d", "M0,-5L10,0L0,5");

    this.svg.append("defs").selectAll("marker")
    .data(["mutuallyLinkedEnd"])
    .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto")
    .append("path")
      .attr("fill", "#000000")
      .attr("d", "M0,-5L10,0L0,5");
    
    this.svg.append("defs").selectAll("marker")
    .data(["mutuallyLinkedStart"])
    .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto-start-reverse")
    .append("path")
      .attr("fill", "#000000")
      .attr("d", "M0,-5L10,0L0,5");
  };

  createLinks(links)
  {
    this.link = this.svg.append("g")
    .style("stroke", "#0c2ef0")
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    for (const link of this.links)
    {
      const mutuallyLinked = this.links.find(l => l.source == link.target && l.target == link.source)
      if(mutuallyLinked)
        helper.mutuallyLinkedNodes.push(mutuallyLinked); // Also dark magic btw
    }

    d3.selectAll("line")
    .data(links)
      .attr("marker-end", (d) => {
        let color = helper.mutuallyLinkedNodes // Also dark magic btw
        .find(l => l.target === d.source && l.source === d.target) 
        ? "url(#mutuallyLinkedEnd)" 
        : "url(#end)";
        return color;
      })
      .attr("marker-start", (d) => {
        let color = helper.mutuallyLinkedNodes // Also dark magic btw
        .find(l => l.target === d.source && l.source === d.target) 
        ? "url(#mutuallyLinkedStart)" 
        : "";
        return color;
      });
  };

  createNodes(nodes)
  {
    this.node = this.svg.append("g")
    .selectAll()
    .data(nodes)
    .join("circle")
      .attr("r", 5)
      .attr("fill", d => this.color(d.group))
      .attr("stroke", d => helper.mutuallyLinkedNodes.find(linkedNodeId => linkedNodeId.source === d.id) ? "#000" : "#fff")
      .attr("stroke-width", 1.5);

    this.node.append("title")
      .text(d => d.name);

    this.node.call(d3.drag()
      .on("start", (event)=>{
        this.simulation.alphaTarget(0.1).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })

      .on("drag", (event)=>{
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })

      .on("end", (event)=>{
        this.simulation.alphaTarget(0).restart();
        event.subject.fx = null;
        event.subject.fy = null;
      }));

      this.node.on('dblclick', (event, d) => {
        helper.setSourceDestination(d.name); // dark magic, try to redo in another way
      })
  };

  findPath(startNodeId, endNodeId)
  {
    let start = this.nodes.find(node => node.id == startNodeId).id;
    let end = this.nodes.find(node => node.id == endNodeId).id;
    
    const visited = new Set();
    const queue = [];
    let path = [];

    path.push(start);
    queue.push(path.slice());

    while (queue.length) 
    {
      path = queue.shift();
      let last = path[path.length-1];

      if (last == end)
      {
        return path;
      }

      for (const neighbor of this.linksArr.find(link => 
        link.source == last).targets)
      {
        if (!visited.has(neighbor))
        {
          let newpath = path.slice();
          newpath.push(neighbor);
          queue.push(newpath);
          visited.add(neighbor);
        }
      }
    }
    return undefined;
  };

  async highlightPath(startNodeId, endNodeId) 
  {
    let path = this.findPath(startNodeId, endNodeId);
    if (path === undefined)
    {
      helper.message('No such path was found.')
      return;
    }
    let pathLinks=[];
    helper.pathNodes = [path[0]];
    for (let i = 0; i < path.length - 1; i++) {
      const source = path[i];
      const target = path[i + 1];
      const link = this.links.find(
        (l) =>
          (l.source.id == source && l.target.id == target) ||
          (l.source.id == target && l.target.id == source)
      );
      if (link) {
        pathLinks.push(link);
        helper.pathNodes.push(target);
      }
    }

    let lines = d3.selectAll("line");
    lines
    .style("stroke", (link) =>
      pathLinks.includes(link) ? "red" : "#ccc"
    ) // TODO: Change marker-end (arrow) color as well
    .filter((link)=>pathLinks.includes(link)).raise();
  };

  setDefaultAppearance()
  {
    d3.selectAll("circle")
    .style("r", 5)
    .style("stroke", d => {return helper.mutuallyLinkedNodes.find(linkedNodeId => linkedNodeId.source.id === d.id) ? "#000" : "#fff"})
    .style("stroke-width", 1.5)
    .style("fill", d => this.color(d.group));

    d3.selectAll("line")
    .style("marker-end", (d) => {
      let color = helper.mutuallyLinkedNodes // Also dark magic btw
      .find(l => l.target === d.source && l.source === d.target) 
      ? "url(#mutuallyLinkedEnd)" 
      : "url(#end)";
      return color;
    })
    .style("marker-start", (d) => {
      let color = helper.mutuallyLinkedNodes // Also dark magic btw
      .find(l => l.target === d.source && l.source === d.target) 
      ? "url(#mutuallyLinkedStart)" 
      : "";
      return color;
    })
    .style("stroke", "#0c2ef0")
    .style("stroke-width", d => Math.sqrt(d.value));
  }
};

let canvas = new Canvas();
export default canvas;