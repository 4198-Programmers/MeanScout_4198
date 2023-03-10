if ("serviceWorker" in navigator) {
  window.onload = () => navigator.serviceWorker.register("./sw.js");
}

const menuToggleButton = document.querySelector("#menu-toggle-btn");
const locationText = document.querySelector("#location-text");
const menuDiv = document.querySelector("#menu");
const authPasswd = document.querySelector("#auth-passwd");
const scoutName = document.querySelector("#scout-name");
const locationSelect = document.querySelector("#location-select");
const templateCopyButton = document.querySelector("#template-copy-btn");
const templateEditButton = document.querySelector("#template-edit-btn");
const downloadSelect = document.querySelector("#download-type-sel");
const surveysDownloadButton = document.querySelector("#surveys-download-btn");
const surveysEraseButton = document.querySelector("#surveys-erase-btn");
//const teamDisp = document.querySelector("#disp-team"); //used with static team box

const teamMetricList = document.querySelector("#teams-list");
const teamMetric = document.querySelector("#metric-team");
const matchMetric = document.querySelector("#metric-match");
const absentMetric = document.querySelector("#metric-absent");
const customMetricsDiv = document.querySelector("#metrics-custom");
const surveySaveButton = document.querySelector("#survey-save-btn");
const surveyResetButton = document.querySelector("#survey-reset-btn");

const teamDisp = teamMetric

menuToggleButton.onclick = () => toggleMenu();
locationSelect.onchange = e => setLocation(e.target.value);
templateCopyButton.onclick = () => copyTemplate();
templateEditButton.onclick = () => editTemplate();
surveysDownloadButton.onclick = () => downloadSurveys();
surveysEraseButton.onclick = () => eraseSurveys();
matchMetric.oninput = () => backupSurvey();
authPasswd.oninput = () => backupSurvey();
absentMetric.onclick = () => toggleAbsent();
surveySaveButton.onclick = () => saveSurvey();
surveyResetButton.onclick = () => resetSurvey();

let scoutLocation = "Red 1";
let matchCount = 1;
let isAbsent = false;
let gameMetrics = [];
let serverURL = "https://data.team4198.org:8000";

// If you make a new type, be sure to add it here
const metricTypes = {
  "toggle": ToggleMetric,
  "togglegrid": ToggleMetricGrid,
  "number": NumberMetric,
  "select": SelectMetric,
  "text": TextMetric,
  "rating": RatingMetric,
  "timer": TimerMetric,
  };

// The example template showcases each metric type
/*const exampleTemplate = {
  metrics: [
    { name: "Toggle", type: "toggle", group: "Group" },
    { name: "Number", type: "number" },
    { name: "Select", type: "select", values: ["Value 1", "Value 2", "Value 3"] },
    { name: "Text", type: "text", tip: "Tip" },
    { name: "Rating", type: "rating" },
    { name: "Timer", type: "timer" },
  ]
};*/

const infiniteRechargeSurvey = {
  "metrics": [
    { "name": "Team left community?", "type": "toggle", "group": "Auto (Qualitative)" },
    { "name": "Team collected items?", "type": "toggle"},
    { "name": "Auto Charge station", "type": "select", "values":["No","Docked","Engaged"]},

    { "name": "toggletesting", "type": "togglegrid", "group":"Points" },

    // { "name": "teleopgrid", "type": "togglegrid", "group": "Teleop" },

    // { "name": "Top Cones", "type": "number", "group": "Auto (Cones)"},
    // { "name": "Middle Cones", "type": "number" },
    // { "name": "Bottom Cones", "type": "number" },
    // { "name": "Missed Cones", "type": "number" },

    // { "name": "Top Cube", "type": "number", "group": "Teleop (Cubes)"},
    // { "name": "Middle Cube", "type": "number" },
    // { "name": "Bottom Cube", "type": "number" },
    // { "name": "Missed Cube", "type": "number" },

    // { "name": "Top Cone", "type": "number", "group": "Teleop (Cones)"},
    // { "name": "Middle Cone", "type": "number" },
    // { "name": "Bottom Cone", "type": "number" },
    // { "name": "Missed Cone", "type": "number" },

    { "name": "Defense play Time:", "group":"Defense","type":"timer" }, //i want to make this a slider and add more 
    { "name":"Defensive rating","type":"rating"},

    { "name": "Team attempts Charge?", "type": "toggle", "group": "Endgame (Charger)" },
    { "name": "Charge station", "type": "select", "values":["No","Docked","Engaged"]},
    // { "name":"Links","type":"number"},

    { "name": "Any robot problems?", "type": "select", "values": ["No Problems", "Solid Light (Disabled)", "No Light (Lost Power)", "Minor Hardware Failure", "Major Hardware Failure"], "group": "Extra" },
    { "name": "Extra Notes", "type": "text", "tip": "Enter extra data here..." },
    { "name": "Fouls", "type": "text", "tip":"Enter in if bot was involved with a foul..."},
    { "name": "Drive Team Rating", "type": "text", "tip": "Enter driver data here..." },
    { "name": "Play style summary", "type":"text", "tip":"Sentence or two on play style..."}]
};

const matchListings = [[2509, 6146, 5929, 4239, 2531, 4207], [8188, 2654, 3313, 4536, 7038, 3691], [7235, 3630, 4226, 6045, 8878, 7858], [4360, 3134, 2470, 3300, 7257, 5658], [2175, 876, 3058, 8887, 877, 6453], [3277, 4238, 8422, 5172, 537, 7677], [2883, 7048, 6628, 3216, 7028, 4607], [5638, 4539, 8255, 3026, 4663, 3293], [4198, 2508, 8586, 3275, 3740, 6045], [3630, 3691, 8878, 876, 3300, 3134], [2531, 7235, 7257, 2654, 2175, 3277], [6628, 7677, 7858, 2509, 2883, 877], [5172, 4226, 8188, 4207, 7048, 4663], [6146, 3216, 3026, 3740, 7038, 4360], [4198, 8422, 4607, 4536, 5658, 2508], [3275, 537, 6453, 4239, 2470, 4539], [5929, 3313, 3293, 4238, 8586, 8887], [7028, 8255, 6045, 5638, 3058, 2531], [877, 6146, 2654, 3630, 5172, 3300], [8188, 4536, 4663, 3740, 6628, 3216], [2508, 7048, 3691, 7235, 4239, 3026], [537, 2509, 7257, 8878, 6453, 3313], [4238, 4539, 7858, 7038, 4207, 3134], [8255, 2470, 2883, 8887, 8422, 876], [5658, 5929, 7677, 5638, 3275, 7028], [8586, 4360, 2175, 4607, 3293, 3058], [4226, 4198, 7048, 3277, 3313, 3630], [7235, 877, 4663, 4536, 7257, 4239], [2883, 8887, 4539, 3691, 2531, 6146], [3740, 6453, 2509, 3300, 8255, 4238], [7028, 2175, 8878, 8422, 4207, 8586], [3058, 5658, 7038, 2508, 6628, 4226], [5638, 8188, 3216, 4607, 3277, 3275], [5172, 6045, 3134, 3026, 537, 876], [3293, 7858, 2470, 5929, 2654, 4198], [3630, 4360, 4536, 7677, 2509, 8586], [7038, 2883, 7028, 3740, 2175, 3300], [7257, 4539, 3691, 6628, 5638, 8422], [3275, 6146, 5172, 4226, 8887, 8255], [3134, 4238, 6453, 8188, 4198, 7235], [7677, 3026, 8878, 3058, 3313, 2470], [2531, 876, 3277, 5658, 4360, 7858], [2508, 5929, 877, 7048, 3216, 537], [4663, 6045, 4607, 4207, 3293, 2654], [7038, 4239, 5638, 3630, 2883, 8586], [6628, 3058, 5172, 6146, 7235, 3740], [4360, 7028, 4226, 2470, 3691, 6453], [3313, 5658, 4198, 8255, 5929, 2175], [3134, 8422, 7257, 6045, 2654, 3216], [4607, 4239, 4238, 7858, 4663, 876], [877, 3300, 537, 3293, 8188, 2531], [8887, 7677, 3277, 2508, 2509, 4539], [8878, 4536, 4207, 3275, 3026, 7048], [3313, 5638, 3740, 7235, 8422, 4360], [5929, 4239, 3134, 4226, 4607, 2883], [8586, 7257, 7028, 8188, 7858, 6146], [8887, 3058, 537, 3300, 3216, 4198], [3293, 876, 3630, 2531, 6628, 3275], [2654, 7038, 3026, 6453, 3277, 7048], [2175, 4238, 4536, 6045, 2508, 2470], [5658, 8878, 2509, 4539, 4663, 5172], [7677, 4207, 877, 3691, 8255, 7235], [7257, 3275, 3293, 3058, 3134, 2883], [6453, 3026, 8188, 8422, 7858, 5929], [876, 2654, 2508, 3313, 7028, 6146], [3630, 4198, 4539, 7048, 5172, 4360], [5658, 6628, 4238, 4239, 8878, 8887], [2509, 4607, 7038, 537, 3691, 6045], [2470, 3740, 4207, 3277, 5638, 877], [3216, 4226, 4536, 2531, 8586, 8255], [6146, 3300, 4663, 2175, 7677, 4198], [2883, 8188, 4239, 8878, 4360, 2654], [6045, 3630, 8887, 6453, 7028, 5658], [8422, 2470, 3275, 877, 3293, 7038], [7858, 3216, 3058, 3691, 3313, 5172], [3026, 2175, 5638, 876, 4226, 2509], [7048, 3740, 2531, 7257, 7677, 4238], [4207, 2508, 8255, 3134, 8586, 6628], [4539, 3277, 3300, 5929, 4607, 4536], [537, 7235, 3313, 4663, 3275, 2883], [3216, 5172, 4239, 2470, 8188, 2175], [2654, 3058, 8422, 4238, 2509, 3630], [3691, 876, 4207, 4198, 7257, 3740], [877, 6045, 6628, 4360, 3277, 5929], [3293, 537, 4226, 7028, 4536, 7677], [8586, 3300, 7235, 4539, 3026, 5658], [4663, 2531, 8878, 7038, 6453, 2508], [7048, 8887, 6146, 7858, 3134, 5638], [8255, 877, 3740, 4607, 3630, 8188]];
// const matchListings = []

matchMetric.oninput = () => determineTeam(matchMetric.value, scoutLocation);

const exampleTemplate = infiniteRechargeSurvey;

let currentTemplate = JSON.parse(localStorage.template ?? JSON.stringify(exampleTemplate));
loadTemplate(currentTemplate);
setLocation(localStorage.location ?? "Red 1");

if (matchListings.length != 0){
  teamDisp.readOnly = true;
}

if (localStorage.backup) {
  const backup = JSON.parse(localStorage.backup);
  matchCount = backup.find(metric => metric.name == "Match").value;
  authPasswd.value = backup.find(metric => metric.name == "Auth").value;
  matchMetric.value = matchCount;
  scoutName.value = backup.find(metric => metric.name == "tName").value;
  isAbsent = backup.find(metric => metric.name == "Absent").value;
  if (isAbsent) {
    absentMetric.innerHTML = "<i class='square-checked text-icon'></i>Absent";
    customMetricsDiv.classList.toggle("hide");
    refreshIcons(absentMetric);
  }
  gameMetrics.forEach(metric => {
    metric.update(backup.find(m => m.name == metric.name).value);
  });
  if (matchListings.length != 0) {
    teamDisp.value = determineTeam(matchMetric.value, scoutLocation);
  }
}

function determineTeam(matchNo, positionStr) {
  let arrayPos = 0;
  if (matchListings.length != 0) {
    if (matchListings[matchNo - 1] != undefined) {
      if (positionStr[0] == "R") {
        arrayPos = parseInt(positionStr[positionStr.length - 1]) - 1;
      } else {
        arrayPos = parseInt(positionStr[positionStr.length - 1]) + 2;
      }
      teamDisp.value = matchListings[matchNo - 1][arrayPos];
      return(matchListings[matchNo - 1][arrayPos]);
    } else {
      teamDisp.value = "None";
      return "None"
    }
  }
}

function postSurvey(surveyJson){
  newJson = "{\n";
  JSON.stringify(surveyJson.forEach(metric => {
    prettyName = metric.name.toLowerCase().split(/\(|\)|\ |\?/).join("").slice(0, 13);
    if (typeof metric.value == "string") newJson += ('    "' + prettyName + '": "' + metric.value + '",\n');
    else newJson += ('    "' + prettyName + '": ' + JSON.stringify(metric.value) + ',\n');
  }));
  newJson += '    "password": "' + authPasswd.value + '"\n}';
  let xhr = new XMLHttpRequest();
  xhr.open("POST", serverURL + "/scouting");

  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = function () {
    console.log(xhr.status);

    if (xhr.status == 401){
        console.log("Password Failed")
      alert("Authentication failure. Please check password.");
      authPasswd.focus();
      return;
    }

	// Process our return data
	if (xhr.status >= 200 && xhr.status < 300) {
		// Runs when the request is successful
		console.log(xhr.responseText);
    if (xhr.status == 202){
      resetSurvey(false);
    }
    else if (xhr.status == 200) {
        resetSurvey(false)
    }
    else{
      alert("Unknown error occured. Please check your Internet connection.");
      return;
    }
	} else {
		// Runs when it's not
		console.log(xhr.responseText);
	 }
  };
  xhr.send(newJson);


  
}

/** Stores the current unsaved survey to `localStorage` */
function backupSurvey() {
  localStorage.backup = JSON.stringify([
    { name: "Team", value: teamMetric.value },
    { name: "Matchnum", value: matchMetric.value },
    { name: "Auth", value: authPasswd.value },
    { name: "Absent", value: isAbsent },
    { name: "Name", value: scoutName.value},
    ...gameMetrics.map(metric => { return { name: metric.name, value: metric.value } })
  ]);
}

/** Toggles the options menu */
function toggleMenu() {
  menuDiv.classList.toggle("hide");
}

/** Toggles whether the team is absent */
function toggleAbsent() {
  customMetricsDiv.classList.toggle("hide");
  absentMetric.innerHTML = `<i class="square-${isAbsent ? "empty" : "checked"} text-icon"></i>Absent`;
  refreshIcons(absentMetric);
  isAbsent = !isAbsent;
  backupSurvey();
}

/** Copies the current template to clipboard */
function copyTemplate() {
  const input = document.createElement("input");
  input.value = JSON.stringify(currentTemplate);
  document.body.append(input);
  input.select();
  input.setSelectionRange(0, input.value.length);
  document.execCommand("copy");
  input.remove();
  alert("Copied template");
}

/** Requests a new template and checks if the template is valid */
function editTemplate() {
  const newPrompt = prompt("Paste new template (you can also 'reset' the template):");
  if (newPrompt) {
    if (newPrompt == "reset") {
      setTemplate();
    } else {
      const newTemplate = JSON.parse(newPrompt);
      let error;
      if (newTemplate.metrics) {
        newTemplate.metrics.forEach(metric => {
          if (!metric.name) error = "Metric has no name";
          if (!Array.isArray(metric.values ?? [])) error = "Metric has invalid values";
          if (!metricTypes.hasOwnProperty(metric.type)) error = "Metric has invalid type";
        });
      } else error = "Template has no metrics";
      if (error) {
        alert(`Could not set template! ${error}`);
        return;
      }
      setTemplate(newTemplate);
    }
  }
}

/**
 * Sets a new template or to example template
 * @param {object} newTemplate An object that contains template data
 */
function setTemplate(newTemplate = exampleTemplate) {
  currentTemplate = JSON.parse(JSON.stringify(newTemplate));
  localStorage.template = JSON.stringify(currentTemplate ?? "");
  loadTemplate(currentTemplate);
  backupSurvey();
  refreshIcons();
}

/**
 * Loads a template into the UI
 * @param {object} newTemplate An object that contains template data
 */
function loadTemplate(newTemplate = exampleTemplate) {
  teamMetricList.innerHTML = "";
  if (newTemplate.teams) {
    newTemplate.teams.forEach(team => {
      teamMetricList.innerHTML += `<option value="${team}">`;
    });
  }
  customMetricsDiv.innerHTML = "";
  gameMetrics = [];
  let metricObject;
  newTemplate.metrics.forEach(metric => {
    metricObject = new metricTypes[metric.type](metric);
    if (metric.group) {
      let groupSpan = document.createElement("span");
      groupSpan.classList.add("group");
      groupSpan.innerHTML = metric.group;
      customMetricsDiv.append(groupSpan);
    }
    customMetricsDiv.append(metricObject.element);
    gameMetrics.push(metricObject);
  });
}

/**
 * Sets a new scout location
 * @param {string} newLocation A string that includes alliance color and robot position
 */
function setLocation(newLocation = "Red 1") {
  scoutLocation = newLocation;
  let newTheme = "red";
  if (/blue/.test(newLocation.toLowerCase())) newTheme = "blue";
  document.documentElement.style.setProperty("--theme-color", `var(--${newTheme})`);
  localStorage.location = newLocation;
  locationText.innerHTML = newLocation;
  locationSelect.value = newLocation;
  if (matchListings.length != 0) teamDisp.value = determineTeam(matchMetric.value, scoutLocation);
  else teamMetric.value = null;
  refreshIcons();
}

/** Validates and saves the current survey to `localStorage` */
function saveSurvey() {
  if (matchListings.length == 0) {
    // Matches a 1-4 long sequence of numbers and an optional character
    if (!/^\d{1,4}[A-Z]?$/.test(teamMetric.value)) {
      alert("Invalid team value! Please enter a 1-9999 digit team number.");
      teamMetric.focus();
      return;
    }
    if (currentTemplate.teams) {
      if (!currentTemplate.teams.some(team => team == teamMetric.value)) {
        alert("Invalid team value! Please enter a 1-9999 digit team number.");
        teamMetric.focus();
        return;
      }
    }

    if (scoutName.value == "") {
        alert("Invalid name value! Please enter your name where it goes.");
        teamMetric.focus();
        return;
    }
    
  }
  // Matches a 1-3 long sequence of numbers
  if (!/\d{1,3}/.test(matchMetric.value)) {
    alert("Invalid match value! Make sure the match value is an integer.");
    matchMetric.focus();
    return;
  }
  if (matchListings.length != 0) {
    if (1 > matchMetric.value || matchMetric.value > matchListings.length) {
      alert("Invalid match value! Make sure the match value is a valid qualifier match.");
      matchMetric.focus();
      return;
    }
  }
  if (authPasswd.value == ""){
    if (!confirm("Save match data OFFLINE?")) return;
    let surveys = JSON.parse(localStorage.surveys ?? "[]");
    surveys.push([
      { name: "Team", value: teamMetric.value },
      { name: "Matchnum", value: matchMetric.value },
      { name: "Absent", value: isAbsent },
      { name: "Location", value: locationSelect.value },
      { name: "Name", value: scoutName.value},
      ...gameMetrics.map(metric => { return { name: metric.name, value: JSON.stringify(metric.value) } })
    ]);
    localStorage.surveys = JSON.stringify(surveys);
    resetSurvey(false);
  }
  else {
    if (!confirm("Save match data online?")) return;
    let surveys = JSON.parse(localStorage.surveys ?? "[]");
    surveys.push([
      { name: "Team", value: teamMetric.value },
      { name: "Matchnum", value: matchMetric.value },
      { name: "Absent", value: isAbsent },
      { name: "Location", value: locationSelect.value },
      { name: "Name", value: scoutName.value},
      ...gameMetrics.map(metric => { return { name: metric.name, value: metric.value } })
    ]);
    postSurvey([
      { name: "Team", value: teamMetric.value },
      { name: "Matchnum", value: matchMetric.value },
      { name: "Absent", value: isAbsent },
      { name: "Location", value: locationSelect.value },
      { name: "Name", value: scoutName.value},
      ...gameMetrics.map(metric => { return { name: metric.name, value: metric.value } })
    ]);
  }
}

/**
 * Resets the current survey
 * @param {boolean} askUser A boolean that represents whether to prompt the user
 */
function resetSurvey(askUser = true) {
  if (askUser) if (prompt("Type 'reset' to reset this match's data.") != "reset") return;
  if (!askUser) {
    matchCount = parseInt(matchMetric.value) + 1;
    matchMetric.value = matchCount;
  }
  if (isAbsent) toggleAbsent();
  gameMetrics.forEach(metric => metric.reset());
  if (matchListings.length != 0) teamDisp.value = determineTeam(matchMetric.value, scoutLocation);
  else teamMetric.value = null;
  refreshIcons();
  localStorage.backup = "";
}

/**
 * Downloads all surveys from `localStorage` either as JSON or CSV
 * @param {boolean} askUser A boolean that represents whether to prompt the user
 */
function downloadSurveys(askUser = true) {
  if (askUser) if (!confirm("Are you sure you would like to export collected data?")) return;
  var fileName = localStorage.location.replace(" ", "_").toLowerCase();
  var today = new Date();
  fileName = fileName + "_" + today.getHours() + "h" + today.getMinutes() + "m";
  const anchor = document.createElement("a");
  anchor.href = "data:text/plain;charset=utf-8,";
  switch (downloadSelect.value) {
    case "JSON":
      anchor.href += encodeURIComponent(localStorage.surveys);
      anchor.download = fileName + ".json";
      break;
    case "CSV":
      let surveys = JSON.parse(localStorage.surveys);
      let csv = "";
      if (surveys) {
        surveys.forEach(survey => {
          let surveyAsCSV = "";
          survey.forEach(metric => {
            if (typeof metric.value == "string") surveyAsCSV += "\"" + metric.value + "\",";
            else surveyAsCSV += metric.value + ",";
          });
          csv += surveyAsCSV + "\n";
        });
      }
      anchor.href += encodeURIComponent(csv);
      anchor.download = fileName + ".csv";
      break;
  }
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

/** Erases all surveys from `localStorage` after prompting the user **/
function eraseSurveys() {
  if (prompt("This deletes all scouting data! Type 'ERASE' to erase saved surveys") == "ERASE"){
    localStorage.surveys = "[]";
  }
}
