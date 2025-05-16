import helper from "./Helper";
import canvas from "./Canvas";
import simulation from "./Simulation";

class State{
   load()
   {
    helper.showLoadingOverlay();
    
    let projectName = localStorage.getItem("projectName");
    if (projectName !== null) 
    {
        helper.setProjectFolder(projectName);
    }

    let customProjectName = localStorage.getItem('customProjectName')
    if (customProjectName !== null)
    {
        if (customProjectName !== '')
            helper.setProjectName(customProjectName);
    }

    let graphLoadedFromFile = localStorage.getItem('graphFromFile');
    if (graphLoadedFromFile !== null) {
        helper.setGraphLoadedFromFile(graphLoadedFromFile === '0' ? false : true);
    }
    
    let storedData = localStorage.getItem('data');
    if (storedData !== null)
    {
        let data = JSON.parse(storedData);
        simulation.clear()
        simulation.start(data.nodes, data.links, data.linksArr);
    }
    helper.hideLoadingOverlay();
   }
}

let state = new State();
export default state;