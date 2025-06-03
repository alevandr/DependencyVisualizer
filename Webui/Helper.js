class Helper
{
  static shortNames;
  static pathNodes;
  static mutuallyLinkedNodes;
  static groups;
  #_graphLoadedFromFile;
  #_sourceNodeName;
  #_destinationNodeName;
  #_projectFolder;
  #_projectCustomName;
  constructor()
  {
    this.shortNames = new Map();
    this.pathNodes = [];
    this.mutuallyLinkedNodes = [];
    this.groups = new Map();
    let graphLoadedFromFile = localStorage.getItem('graphFromFile');
    if (graphLoadedFromFile !== null)
    {
      this.setGraphLoadedFromFile(
      graphLoadedFromFile === '0'
      ? false
      : true);
    }
    else {
      this.setGraphLoadedFromFile(false);
    }
  }
  getGraphLoadedFromFile()
  {
    return this.#_graphLoadedFromFile;
  }
  setGraphLoadedFromFile(bValue)
  {
    this.#_graphLoadedFromFile = bValue;

    let saveGraphButton = document.getElementById('save-graph');
    saveGraphButton.disabled = bValue;

    let updateraphButton = document.getElementById('update-graph');
    updateraphButton.disabled = bValue;
    if (bValue)
    {
      if (!saveGraphButton.classList.contains('disabled'));
        saveGraphButton.classList.add('disabled')
      if (!updateraphButton.classList.contains('disabled'));
        updateraphButton.classList.add('disabled')
    }
    else
    {
      if (saveGraphButton.classList.contains('disabled'));
        saveGraphButton.classList.remove('disabled')
      if (updateraphButton.classList.contains('disabled'));
        updateraphButton.classList.remove('disabled')
    }
    localStorage.setItem('graphFromFile', bValue ? '1' : '0');
  }
  getSourceNodeName()
  {
    return this.shortNames.get(this.#_sourceNodeName);
  }
  setSourceNodeName(nodeName)
  {
    this.#_sourceNodeName = nodeName;
    let sourceNodeInput = document.getElementById('node-source');
    sourceNodeInput.value = this.#_sourceNodeName;
  }
  getDestinationNodeName()
  {
    return this.shortNames.get(this.#_destinationNodeName);
  }
  setDestinationNodeName(nodeName)
  {
    this.#_destinationNodeName = nodeName;
    let destinationNodeInput = document.getElementById('node-destination');
    destinationNodeInput.value = this.#_destinationNodeName;
  }
  getProjectFolder()
  {
    return this.#_projectFolder;
  }
  setProjectFolder(projectFolderName)
  {
    this.#_projectFolder = projectFolderName;
    let project = document.getElementById('catalog-name');
    project.textContent = 'Project: ' + projectFolderName;
    localStorage.setItem('projectName', projectFolderName);
  }
  getProjectName()
  {
    if (!this.#_projectCustomName)
      return this.#_projectFolder;
    else
      return this.#_projectCustomName;
  }
  setProjectName(customProjectname)
  {
    this.#_projectCustomName = customProjectname;
    if (customProjectname !== '')
    {
      let project = document.getElementById('catalog-name');
      project.textContent = 'Project: ' + customProjectname;
    }
    localStorage.setItem('customProjectName', customProjectname);
  }
  longestCommonPrefix(nodes)
  {
    if (!nodes || nodes.length === 0) {
      return '';
    }

    let result = '';
    const firstStr = nodes[0].name;
    const firstStrArr = firstStr.split('/');
    for (let i = 0; i < firstStr.length; i++) {
      const currentFolder = firstStrArr[i];
      for (let j = 1; j < nodes.length; j++) {
        const nodeFolder = nodes[j].name.split('/');
        if (i >= nodeFolder.length || nodeFolder[i] !== currentFolder) {
          let sliceArr = firstStrArr.slice(0, i);
          result = sliceArr.join("/");
          return result;
        }
      }
    }
    return result;
  };
  removePrefix(prefix, value)
  {
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
    return value;
  };
  getShortNodeName(fullNodeName)
  {
    const shortName = this.shortNames.keys().find(key => this.shortNames.get(key) === fullNodeName);
    return shortName ? shortName : 'not found';
  }
  setSourceDestination(nodeName)
  {
    let sourceNodeName = this.getSourceNodeName();
    let destinationNodeName = this.getDestinationNodeName();

    if (!sourceNodeName || sourceNodeName.length === 0) {
      this.setSourceNodeName(this.getShortNodeName(nodeName));
      return;
    }
    else if (sourceNodeName === nodeName) {
      this.setSourceNodeName('');
      return;
    }

    if(!destinationNodeName || destinationNodeName.length === 0) {
      this.setDestinationNodeName(this.getShortNodeName(nodeName));
      return;
    } 
    else if(destinationNodeName === nodeName) {
      this.setDestinationNodeName('');
      return;
    } 
  };
  async selectProjectFolder()
  {
    return fetch('select-project-folder')
    .then(response => {
      if (response.status === 200)
        return response.text();
      else
        return this.getProjectFolder();
    })
    .then(projectFolder => {
      if (projectFolder === undefined ||
        (projectFolder === this.getProjectFolder() && projectFolder.size !== 0))
      {
        helper.message('New project was NOT selected');
      }
      else
      {
        this.setProjectFolder(projectFolder);
        this.setProjectName('');
        this.setGraphLoadedFromFile(false);
        document.getElementById('update-graph').click();
      }
    })
    .catch(error => {
      helper.message('Error:', error);
    });
  };

  static intervalId;
  static locked;

  startMessageTask(msg) 
  {
    if (this.locked)
      return;
    let i = 0;
    const msgSpan = document.getElementById('info-message-span');
    const msgBox = document.getElementById('info-message-box'); 
    msgSpan.textContent = msg;
    msgBox.style.right = '1%';
    msgBox.style.bottom = '5%';
    msgBox.style.display = 'block';
    msgBox.style.opacity = 1;
    this.intervalId = setInterval(async () => {
      i++;
      if (i===4)
      {
        msgBox.style.opacity = 0;
      }
      if (i===5)
      {
        msgBox.style.display = 'none';
        msgSpan.textContent = '';
        clearInterval(this.intervalId);
        this.locked = false;
      }
    }, 1000);

    document.addEventListener('stopTask', () => {
      clearInterval(this.intervalId);
      const msgBox = document.getElementById('info-message-box'); 
      msgBox.style.display = 'none';
      msgBox.style.opacity = 1;  
      const msgSpan = document.getElementById('info-message-span');
      msgSpan.textContent = '';
    });
  }

  stopMessageTask()
  {
    document.dispatchEvent(new Event('stopTask'));
  }

  async message(msg)
  {
    this.startMessageTask(msg);
    this.locked = true;
    return;
  }
  closeMessage()
  {
    this.stopMessageTask();
    this.locked = false;
    return;
  }
  showLoadingOverlay()
  {
    let loadingOverlay = document.getElementById('loading-overlay-container');
    loadingOverlay.style.display = 'block';
  }
  hideLoadingOverlay()
  {
    let loadingOverlay = document.getElementById('loading-overlay-container');
    loadingOverlay.style.display = 'none';
  }
  updateLegend()
  {
    let legend = document.getElementById('graph-legend');
    let legendHTML = ''
    legendHTML += `<div class="legendAmountOfFiles"><span class=\"legendAmountOfFilesSpan\">Amount of files: ${this.shortNames.size}</span></div>`
    if(this.groups.size > 0)
    {
      legendHTML += `<div class="legendGroupsSpanContainer"><span class=\"legendGroupsSpan\">Groups:</span></div>`
      legendHTML += `<div class="legendItem">`
      legendHTML += `<ul>`
      let color = d3.scaleOrdinal(d3.schemeCategory10);
      for (const group of this.groups)
      {
        legendHTML += `<li><span class=\"legendSpan\">${group[0]} - ${group[1]}:</span><div class="groupColor" style="background: ${color(group[0])}"><div></li>`
      }
      legendHTML += `</ul>`
      legendHTML += `</div>`
    }
    legendHTML += `<br>`
    if (this.pathNodes.length > 0)
    {
      legendHTML += `<div class="legendPathSpanContainer"><span class=\"legendPathSpan\">Selected path:</span></div>`
      legendHTML += `<div class="legendItem">`
      legendHTML += `<ul>`
      let prefix = this.longestCommonPrefix(this.pathNodes);
      for (const node of this.pathNodes)
      {
        legendHTML += `<li><span class=\"legendSpan\">${this.removePrefix(prefix, node.name)}</span></li>`;
      }
      legendHTML += `</ul>`
      legendHTML += `</div>`
    }
    legend.innerHTML = legendHTML;
  }
  getLegend()
  {
    let legend = document.getElementById('graph-legend');
    if (legend.style.display === 'block')
    {
      legend.style.display = 'none';
      legend.innerHTML = "";
    }
    else
    {
      this.updateLegend();
      legend.style.display = 'block';
    }
  }
};

let helper = new Helper();
export default helper;