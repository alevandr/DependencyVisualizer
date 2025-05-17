import helper from './Helper';
import canvas from './Canvas';
import simulation from './Simulation';
import state from './State';


const updateGraph = document.getElementById('update-graph');
updateGraph.addEventListener('click', async () => {
  if(!helper.getProjectFolder())
  {
    await helper.selectProjectFolder();
  }
  helper.showLoadingOverlay();
  fetch('update-graph')
  .then(response => response.text())
  .then(dataTxt=> {
    let data = JSON.parse(dataTxt);
    helper.setGraphLoadedFromFile(false);
    simulation.clear();
    simulation.start(data.nodes, data.links, data.linksArr);
    localStorage.setItem('data', dataTxt);
  })
  .catch(error => {
    helper.message('Graph was NOT updated: ' + error);
  })
  .finally(() => {
    helper.hideLoadingOverlay();
  });
});

const highlightPath = document.getElementById('highlight-path');
highlightPath.addEventListener('click', () => 
{
  let sourceNode;
  try 
  {
    let sourceInput = helper.getSourceNodeName();
    sourceNode = canvas.nodes.find(d => 
      d.name == sourceInput);
  }
  catch (error)
  {
    helper.message(error);
    return;
  }

  let destinationNode;
  try 
  {
    let destinationInput = helper.getDestinationNodeName();
    destinationNode = canvas.nodes.find(d => 
      d.name == destinationInput);
  }
  catch (error)
  {
    helper.message(error);
    return;
  }
  if (!sourceNode || !destinationNode)
    return canvas.setDefaultAppearance();

  canvas.highlightPath(sourceNode.id, destinationNode.id);
  let selectedNodes = d3.selectAll('circle')
  .style("fill", (node) => 
    helper.pathNodes.includes(node.id) ? "red" : canvas.color(node.group))
  .style("stroke", (node) => 
    {
      if (helper.pathNodes.includes(node.id))
      {
        if (helper.pathNodes[0] === node.id)
          return "green";
        else if (helper.pathNodes[helper.pathNodes.length - 1] === node.id)
          return "orange";
        else
          return "black";
      }
      else
        return "#fff";
    })
  .style("stroke-width", (node) => 
    helper.pathNodes.includes(node.id) ? "2px" : "1.5");
});

const defaultAppearance = document.getElementById('default-appearance');
defaultAppearance.addEventListener('click', function() 
{
  helper.message("Appearance set to default");
  canvas.setDefaultAppearance();
})

const dropDownButton = document.getElementById('drop-down-button');
dropDownButton.addEventListener('click', () => {
  document.getElementById("drop-down-menu-container").classList.toggle("show");
});

const chagneProjectNameButton = document.getElementById('change-project-name');
chagneProjectNameButton.addEventListener('click', ()=>{
  document.getElementById('new-project-name-input').value = helper.getProjectName();
  document.getElementById('new-project-name-container').style.display = 'block';
});

const applyNewProjectNameButton = document.getElementById('apply-new-project-name');
applyNewProjectNameButton.addEventListener('click', ()=>{
  const name = document.getElementById('new-project-name-input').value;
  helper.setProjectName(name);
  document.getElementById('new-project-name-container').style.display = 'none';
})

const cancelNewProjectNameButton = document.getElementById('cancel-new-project-name');
cancelNewProjectNameButton.addEventListener('click', ()=>{
  document.getElementById('new-project-name-input').value = '';
  document.getElementById('new-project-name-container').style.display = 'none';
})

const getGraphFromFileButton = document.getElementById('get-graph-from-file');
getGraphFromFileButton.addEventListener('click', ()=>{
  helper.showLoadingOverlay();
  fetch('get-graph-from-file')
  .then(response => response.text())
  .then(dataTxt=> {
    let data = JSON.parse(dataTxt);
    helper.setGraphLoadedFromFile(true);
    helper.setProjectName('');
    simulation.clear();
    simulation.start(data.nodes, data.links, data.linksArr);
    localStorage.setItem('data', dataTxt);
  })
  .catch(error => {
    helper.message('No file was choosen');
  })
  .finally(() => {
    helper.hideLoadingOverlay();
  });
});

const selectNewProject = document.getElementById('select-new-project');
selectNewProject.addEventListener('click', async () => {
  await helper.selectProjectFolder()
  updateGraph.click();
});

const clearStorageButton = document.getElementById('clear-storage');
clearStorageButton.addEventListener('click', ()=>{
  localStorage.clear();
})

const showLegendButton = document.getElementById('show-legend');
showLegendButton.addEventListener('click', () => {
  let legend = document.getElementById('graph-legend');
  if (legend.style.display === 'block')
  {
    legend.style.display = 'none';
    legend.innerHTML = ""
  }
  else
  {
    legend.innerHTML += "<span class=\"legendSpan\">Amount of nodes: xxx</span>"
    legend.innerHTML += "<br>"
    legend.innerHTML += "<br>"
    legend.innerHTML += "<span class=\"legendSpan\">Groups:</span>"
    legend.innerHTML += "<ul>"
    legend.innerHTML += "<li><span class=\"legendSpan\">group item 1 - [color]</span></li>"
    legend.innerHTML += "<li><span class=\"legendSpan\">group item 2 - [color]</span></li>"
    legend.innerHTML += "<li><span class=\"legendSpan\">group item 3 - [color]</span></li>"
    legend.innerHTML += "<li><span class=\"legendSpan\">group item 4 - [color]</span></li>"
    legend.innerHTML += "<li><span class=\"legendSpan\">group item 5 - [color]</span></li>"
    legend.innerHTML += "</ul>"
    legend.innerHTML += "<br>"
    legend.innerHTML += "<span class=\"legendSpan\">Selected path:</span>"
    legend.innerHTML += "<ul>"
    legend.innerHTML += "<li><span class=\"legendSpan\">path item 1 - [name]</span></li>"
    legend.innerHTML += "<li><span class=\"legendSpan\">path item 2 - [name]</span></li>"
    legend.innerHTML += "<li><span class=\"legendSpan\">path item 3 - [name]</span></li>"
    legend.innerHTML += "<li><span class=\"legendSpan\">path item 4 - [name]</span></li>"
    legend.innerHTML += "</ul>"
    legend.style.display = 'block';
  }
})

const saveGraphButton = document.getElementById('save-graph');
saveGraphButton.addEventListener('click', async () => {
  fetch('save-graph')
  .then(response => {
    if (response.status === 500) {
      helper.message('File was NOT saved');
    } else {
      helper.message('File was saved');
    }
  })
  .catch(error => {
    helper.message('Error: could not connect to the server');
  });
});

window.onclick = function(e) {
  if (!e.target.matches('.dropDownMenu')) {
  var myDropdown = document.getElementById("drop-down-menu-container");
    if (myDropdown.classList.contains('show')) {
      myDropdown.classList.remove('show');
    }
  }
}

const nodeSourceInput = document.getElementById('node-source');
nodeSourceInput.addEventListener('change', () => {
  helper.setSourceNodeName(nodeSourceInput.value);
})

const nodeDestinationInput = document.getElementById('node-destination');
nodeDestinationInput.addEventListener('change', () => {
  helper.setDestinationNodeName(nodeDestinationInput.value);
})

const clearSource = document.getElementById('clear-source');
clearSource.addEventListener('click', () => {
  helper.setSourceNodeName('')
});
clearSource.addEventListener('mouseover', () => {
  document.getElementById('node-source').style.background = '#D9C5B2';
})
clearSource.addEventListener('mouseout', () => {
  document.getElementById('node-source').style.background = '#FFFFFF';
})

const clearDestination = document.getElementById('clear-destination');
clearDestination.addEventListener('click', () => {
  helper.setDestinationNodeName('')
});
clearDestination.addEventListener('mouseover', () => {
  document.getElementById('node-destination').style.background = '#D9C5B2';
})
clearDestination.addEventListener('mouseout', () => {
  document.getElementById('node-destination').style.background = '#FFFFFF';
})

const clearBoth = document.getElementById('clear-both');
clearBoth.addEventListener('click', () => {
  helper.setSourceNodeName('');
  helper.setDestinationNodeName('');
});
clearBoth.addEventListener('mouseover', () => {
  document.getElementById('node-source').style.background = '#D9C5B2';
  document.getElementById('node-destination').style.background = '#D9C5B2';
})
clearBoth.addEventListener('mouseout', () => {
  document.getElementById('node-source').style.background = '#FFFFFF';
  document.getElementById('node-destination').style.background = '#FFFFFF';
})

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const menu = document.getElementById('context-menu');
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  menu.style.display = 'block';
});

document.addEventListener('click', () => {
  const menu = document.getElementById('context-menu');
  menu.style.display = 'none';
});

const closeMessageButton = document.getElementById('close-message');
closeMessageButton.addEventListener('click', () => {
  helper.closeMessage();
});

function resetGraphDimensions()
{
  let newWidth = window.innerWidth;
  let newHeight = window.innerHeight;

  let topBorder = document.getElementById('sd-bar');
  let graph = document.getElementById('graph');
  let canvasContainer = document.getElementById('canvas-id');
  let calculatedHeight = newHeight - (topBorder.offsetTop + topBorder.offsetHeight);

  graph.style.width = newWidth + 'px';
  graph.style.height = calculatedHeight + 'px';
  canvasContainer.style.width = newWidth + 'px';
  canvasContainer.style.height = calculatedHeight + 'px';

};

window.addEventListener('resize', () => {
  resetGraphDimensions();
});

window.addEventListener('load', () => {
  resetGraphDimensions();
  state.load();
});

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveGraphButton.click();
  }
});