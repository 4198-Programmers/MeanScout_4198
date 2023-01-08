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
    { "name": "Team collected Game pieces?", "type": "toggle"},

    { "name": "Top", "type": "number", "group": "Auto (Cubes)"},
    { "name": "Middle", "type": "number" },
    { "name": "Bottom", "type": "number" },
    { "name": "Missed", "type": "number" },

    { "name": "Top", "type": "number", "group": "Auto (Cones)"},
    { "name": "Middle", "type": "number" },
    { "name": "Bottom", "type": "number" },
    { "name": "Missed", "type": "number" },


    { "name": "Top", "type": "number", "group": "Teleop (Cubes)"},
    { "name": "Middle", "type": "number" },
    { "name": "Bottom", "type": "number" },
    { "name": "Missed", "type": "number" },

    { "name": "Top", "type": "number", "group": "Teleop (Cones)"},
    { "name": "Middle", "type": "number" },
    { "name": "Bottom", "type": "number" },
    { "name": "Missed", "type": "number" },




    { "name": "Defence played:", "group":"Defense","type": "select", "values": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }, //i want to make this a slider and add more

    { "name": "Team attempts Charge?", "type": "toggle", "group": "Endgame (Climb)" },
    { "name": "Charge balance", "type": "toggle"},
    { "name": "Charge balance time", "type": "timer"},
  
    { "name": "Any robot problems?", "type": "select", "values": ["No Problems", "Solid Light (Disabled)", "No Light (Lost Power)", "Minor Hardware Failure", "Major Hardware Failure"], "group": "Extra" },
    { "name": "Extra Notes", "type": "text", "tip": "Enter extra data here..." },
    { "name": "Drive Team Rating", "type": "text", "tip": "Enter driver data here..." },
    { "name": "Play style summary", "type":"text", "tip":"Sentence or two on play style"}]
};

//const matchListings = [[8878, 6420, 3202, 7028, 2879, 2202], [4536, 3407, 2169, 4229, 7849, 7038], [7257, 2518, 3454, 2513, 4207, 4632], [2530, 525, 8787, 2498, 3082, 2508], [2515, 5299, 2502, 8516, 3023, 3026], [3691, 3277, 5996, 5434, 2846, 3278], [2500, 4664, 5541, 7850, 4778, 3751], [3018, 2470, 4198, 7068, 3630, 2823], [2264, 4624, 3038, 2181, 4539, 3871], [2879, 4207, 525, 2530, 2052, 3407], [7028, 3026, 2515, 7849, 7257, 8787], [3082, 8516, 2846, 3202, 2518, 7038], [5434, 4632, 4536, 3023, 5541, 2498], [4664, 5996, 3278, 3454, 7068, 5299], [2502, 4539, 3018, 3691, 4198, 2202], [2181, 3038, 7850, 2470, 4229, 2508], [2513, 8878, 2823, 2264, 4778, 3277], [2500, 3751, 2052, 4624, 6420, 3630], [2169, 3202, 5434, 3026, 3871, 8787], [2879, 7038, 2846, 7257, 7068, 2498], [5541, 4536, 7028, 3082, 2518, 3018], [3038, 4539, 3691, 5299, 525, 3023], [4664, 4229, 2181, 2823, 2202, 2515], [3630, 5996, 2264, 2530, 4778, 6420], [7850, 2500, 3278, 4198, 7849, 2513], [3277, 3454, 3871, 3407, 8516, 3751], [2470, 4624, 4207, 2508, 8878, 2169], [4632, 2502, 5541, 2052, 3026, 4539], [7038, 5434, 7028, 2879, 5299, 4664], [2181, 2518, 2823, 6420, 3691, 7257], [525, 3278, 4778, 3023, 7850, 4536], [2530, 2515, 7068, 2513, 2500, 3202], [7849, 3751, 2498, 3018, 3038, 8878], [2169, 3871, 3630, 2502, 4207, 3277], [2470, 4632, 8516, 2202, 5996, 3407], [2508, 3454, 4624, 4229, 4198, 3082], [8787, 2052, 4664, 2264, 2846, 2181], [4539, 2515, 2518, 3278, 7038, 2823], [7068, 525, 3691, 3026, 8878, 5541], [6420, 3277, 3023, 4207, 2530, 7849], [3871, 2513, 3751, 2470, 5996, 7028], [4778, 2498, 4229, 4198, 3202, 2502], [8516, 7257, 5299, 4536, 2508, 2052], [2500, 2879, 3038, 3454, 2202, 2169], [3082, 2264, 3407, 3630, 3018, 5434], [7850, 4632, 4624, 2846, 8787, 2515], [8878, 3871, 2470, 3023, 4664, 2530], [5541, 7038, 4207, 5996, 2181, 4198], [7068, 3026, 2513, 6420, 2498, 8516], [7849, 7028, 2508, 3454, 3691, 2502], [2202, 3038, 2052, 4778, 5434, 3082], [3407, 5299, 2846, 2169, 2823, 2500], [3630, 3202, 7850, 7257, 4536, 4539], [2879, 4632, 3018, 4624, 3278, 4229], [2518, 8787, 2264, 525, 3751, 3277], [7028, 2530, 4198, 8516, 7068, 2181], [3454, 2498, 5434, 2515, 2470, 4778], [2846, 2823, 2508, 3871, 5541, 7849], [3082, 2169, 6420, 4539, 7850, 4664], [3202, 3018, 4207, 5299, 3038, 4632], [3407, 4229, 7257, 3278, 2264, 3026], [3277, 2513, 2202, 7038, 525, 4624], [2518, 3691, 3023, 3630, 8787, 2879], [2500, 2502, 4536, 3751, 8878, 5996], [2052, 2823, 2498, 7028, 3454, 7850], [3871, 7068, 4778, 5299, 2181, 7849], [3278, 2515, 8516, 5541, 2169, 2264], [4229, 5434, 4539, 4207, 7257, 2846], [3023, 4198, 4624, 4664, 3202, 3407], [2202, 2530, 3026, 3751, 4536, 2518], [8787, 6420, 7038, 3038, 2502, 2470], [5996, 2508, 2513, 2052, 3630, 8878], [2879, 3277, 3082, 3691, 2500, 4632], [525, 5434, 2181, 3018, 8516, 3454], [2264, 3023, 7257, 7068, 2169, 4198], [3751, 2202, 5299, 2846, 7850, 2530], [3278, 3407, 5541, 6420, 7028, 2502], [2518, 7849, 2470, 4624, 2052, 3202], [2823, 2879, 3026, 3038, 3082, 5996], [3277, 3630, 4229, 2498, 4664, 525], [4536, 4207, 3871, 2515, 2513, 3691], [8787, 2508, 4539, 4778, 3018, 2500], [4632, 7038, 3454, 8878, 2264, 2530], [2502, 7850, 7068, 5434, 4624, 2518], [5996, 3023, 7849, 2202, 3082, 7257], [3751, 2181, 3630, 3202, 3278, 2879], [4198, 2846, 4664, 3026, 4536, 3038], [4207, 8516, 3691, 2498, 2470, 2500], [3018, 2052, 6420, 7038, 3871, 2515], [8787, 4229, 8878, 5299, 5541, 2513], [2823, 7028, 4778, 4632, 2169, 525], [2508, 3407, 2879, 4539, 3277, 7068]]
const matchListings = []

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
  surveyJson.forEach(metric => {
    prettyName = metric.name.toLowerCase().split(/\(|\)|\ |\?/).join("").slice(0, 12);
    if (typeof metric.value == "string") newJson += ('    "' + prettyName + '": "' + metric.value + '",\n');
    else newJson += ('    "' + prettyName + '": ' + metric.value + ',\n');
  });
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
      ...gameMetrics.map(metric => { return { name: metric.name, value: metric.value } })
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
