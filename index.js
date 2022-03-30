if ("serviceWorker" in navigator) {
  window.onload = () => navigator.serviceWorker.register("./sw.js");
}

const menuToggleButton = document.querySelector("#menu-toggle-btn");
const locationText = document.querySelector("#location-text");
const menuDiv = document.querySelector("#menu");
const locationSelect = document.querySelector("#location-select");
const templateCopyButton = document.querySelector("#template-copy-btn");
const templateEditButton = document.querySelector("#template-edit-btn");
const downloadSelect = document.querySelector("#download-type-sel");
const surveysDownloadButton = document.querySelector("#surveys-download-btn");
const surveysEraseButton = document.querySelector("#surveys-erase-btn");
const teamDisp = document.querySelector("#disp-team");
const teamMetricList = document.querySelector("#teams-list");
const matchMetric = document.querySelector("#metric-match");
const absentMetric = document.querySelector("#metric-absent");
const customMetricsDiv = document.querySelector("#metrics-custom");
const surveySaveButton = document.querySelector("#survey-save-btn");
const surveyResetButton = document.querySelector("#survey-reset-btn");

menuToggleButton.onclick = () => toggleMenu();
locationSelect.onchange = e => setLocation(e.target.value);
templateCopyButton.onclick = () => copyTemplate();
templateEditButton.onclick = () => editTemplate();
surveysDownloadButton.onclick = () => downloadSurveys();
surveysEraseButton.onclick = () => eraseSurveys();
matchMetric.oninput = () => backupSurvey();
absentMetric.onclick = () => toggleAbsent();
surveySaveButton.onclick = () => saveSurvey();
surveyResetButton.onclick = () => resetSurvey();

let scoutLocation = "Red 1";
let matchCount = 1;
let isAbsent = false;
let gameMetrics = [];

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
    { "name": "Team left tarmac?", "type": "toggle", "group": "Auto (Qualitative)" },
    { "name": "Team collected balls?", "type": "toggle"},

    { "name": "Top", "type": "number", "group": "Auto (Balls)"},
    { "name": "Bottom", "type": "number" },
    { "name": "Missed", "type": "number" },

    { "name": "Top", "type": "number", "group": "Teleop (Balls)" },
    { "name": "Bottom", "type": "number" },
    { "name": "Missed", "type": "number" },

    { "name": "Safe area usage:", "type": "select", "values": ["None", "A Little", "A Lot"], "group": "Teleop (Qualitative)" },
    { "name": "Defence played:", "type": "select", "values": ["None", "A Little", "A Lot"] },

    { "name": "Bar number reached (0 for none)", "type": "select", "values": ["0", "1", "2", "3", "4"], "group": "Endgame (Climb)" },
    { "name": "Team attempts climbs?", "type": "toggle" },

    { "name": "Extra Notes", "type": "text", "tip": "Enter extra data here...", "group": "Notes" },
    { "name": "Drive Team Rating", "type": "text", "tip": "Enter driver data here...", "group": "Notes" }]


};

const matchListings = [[4238, 6175, 3277, 2450, 8887, 5172], [877, 8188, 2531, 8255, 8586, 5653], [7048, 5913, 4480, 6709, 2883, 3298], [7677, 3293, 3297, 7028, 7235, 4674], [3313, 3130, 4728, 6628, 3630, 876], [8298, 5658, 7858, 3134, 4198, 2508], [3275, 4239, 3300, 5929, 3058, 7038], [6453, 8422, 4539, 2654, 4607, 2538], [6175, 8255, 5172, 6709, 7048, 4360], [8586, 3298, 6628, 2450, 3630, 3313], [877, 876, 7677, 3277, 4480, 2883], [8887, 3297, 8188, 2531, 3130, 3275], [2508, 7028, 4607, 5913, 3300, 7235], [2654, 7858, 3293, 5658, 6453, 3058], [4728, 4238, 4674, 8298, 4239, 5929], [4539, 7038, 4198, 4360, 2538, 5653], [3134, 2883, 3630, 5172, 8422, 8188], [6175, 7028, 3130, 3313, 877, 2508], [3058, 8887, 3277, 8586, 5658, 6709], [4239, 2654, 8255, 876, 2450, 5913], [4607, 5929, 4480, 4198, 8298, 2531], [4728, 8422, 2538, 7038, 7048, 4238], [4674, 3293, 3275, 7858, 5653, 6628], [3300, 3298, 4360, 7677, 4539, 3134], [7235, 3297, 4239, 5172, 6453, 6709], [3630, 2508, 8298, 2654, 2531, 2883], [2450, 5929, 7048, 8887, 876, 5658], [4198, 5913, 3275, 3293, 4728, 877], [7038, 7677, 7028, 3058, 4539, 6175], [5653, 6453, 4238, 3300, 4480, 8586], [3313, 3277, 3134, 3297, 4674, 2538], [4360, 3130, 7858, 7235, 8422, 3298], [8188, 8255, 876, 4198, 4607, 6628], [7048, 7028, 5172, 3275, 877, 8298], [4728, 6709, 8887, 2508, 2654, 6453], [5913, 5653, 7038, 3297, 3134, 4238], [3298, 5658, 2531, 8422, 4674, 3130], [2883, 6628, 2538, 8586, 6175, 5929], [7235, 2450, 8255, 3058, 3313, 3300], [4539, 3277, 4360, 3293, 4480, 8188], [7858, 3630, 4607, 7677, 4239, 8887], [2531, 5172, 876, 7028, 4238, 3298], [2654, 8586, 3130, 3275, 5929, 3134], [6453, 2883, 7038, 4674, 4198, 2450], [3277, 6709, 3293, 8422, 2508, 3300], [6628, 4539, 4239, 7048, 5658, 7235], [2538, 877, 3630, 5653, 4607, 3058], [4480, 8255, 7858, 6175, 3297, 4728], [3313, 8298, 5913, 8188, 7677, 4360], [2508, 5172, 3298, 7038, 8586, 3293], [6709, 7235, 3134, 876, 4238, 2883], [8887, 2654, 4674, 6628, 3300, 877], [2538, 4198, 4239, 4480, 7028, 3297], [4607, 2531, 2450, 4728, 4360, 3275], [5913, 3277, 5929, 4539, 3313, 7858], [7048, 3058, 8422, 3130, 7677, 5653], [5658, 3630, 6175, 8255, 8298, 6453], [8188, 7235, 2654, 7038, 2538, 4480], [3300, 4674, 6709, 5172, 4728, 4198], [2531, 3134, 3293, 4239, 3313, 4607], [8422, 8586, 2883, 5913, 4539, 7028], [5929, 877, 5658, 3630, 4360, 3297], [2450, 7858, 6453, 3130, 8188, 7048], [5653, 3275, 6175, 876, 3298, 3277], [3058, 7677, 2508, 8255, 6628, 4238], [8298, 7038, 4674, 8887, 5913, 8586], [4607, 3300, 5658, 2883, 5172, 3313], [2538, 6709, 2450, 7028, 7858, 2531], [4239, 8188, 4728, 3298, 6175, 877], [5929, 5653, 2508, 6453, 3275, 7677], [4238, 4360, 4198, 3630, 7048, 2654], [4480, 7235, 8887, 8255, 3134, 8422], [3297, 876, 4539, 3293, 8298, 3058], [3130, 6628, 6709, 4607, 7038, 3277], [5658, 3275, 5172, 7858, 2538, 7677], [6175, 3300, 7048, 4674, 8188, 3630], [3313, 8887, 7028, 4480, 5653, 2654], [2883, 3058, 7235, 3298, 4728, 8298], [4238, 3293, 4539, 877, 3130, 8255], [3297, 2508, 8586, 4360, 876, 4239], [3134, 6453, 5913, 3277, 2531, 6628], [4198, 5929, 3313, 6175, 2450, 8422]]

const exampleTemplate = infiniteRechargeSurvey;

let currentTemplate = JSON.parse(localStorage.template ?? JSON.stringify(exampleTemplate));
loadTemplate(currentTemplate);
setLocation(localStorage.location ?? "Red 1");

if (localStorage.backup) {
  const backup = JSON.parse(localStorage.backup);
  matchCount = backup.find(metric => metric.name == "Match").value;
  matchMetric.value = matchCount;
  isAbsent = backup.find(metric => metric.name == "Absent").value;
  if (isAbsent) {
    absentMetric.innerHTML = "<i class='square-checked text-icon'></i>Absent";
    customMetricsDiv.classList.toggle("hide");
    refreshIcons(absentMetric);
  }
  gameMetrics.forEach(metric => {
    metric.update(backup.find(m => m.name == metric.name).value);
  });
}

function determineTeam(matchNo, positionStr) {
  let arrayPos = 0;
  if (matchListings[matchNo - 1] != undefined){
    if (positionStr[0] == "R") {
      arrayPos = parseInt(positionStr[positionStr.length - 1]) - 1;
    }
    else {
      arrayPos = parseInt(positionStr[positionStr.length - 1]) + 2;
    }
    teamDisp.innerHTML = matchListings[matchNo - 1][arrayPos];
    return(matchListings[matchNo - 1][arrayPos]);
  } else {
    teamDisp.innerHTML = "None";
    return undefined
  }
}

/** Stores the current unsaved survey to `localStorage` */
function backupSurvey() {
  localStorage.backup = JSON.stringify([
    { name: "Team", value: determineTeam(matchMetric.value, scoutLocation) },
    { name: "Match", value: matchMetric.value },
    { name: "Absent", value: isAbsent },
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
  teamDisp.innerHTML = determineTeam(matchMetric.value, scoutLocation);
  refreshIcons();
}

/** Validates and saves the current survey to `localStorage` */
function saveSurvey() {
  // Matches a 1-4 long sequence of numbers and an optional character
  /*(if (!/^\d{1,4}[A-Z]?$/.test(teamMetric.value)) {
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
  }*/
  // Matches a 1-3 long sequence of numbers
  if (!/\d{1,3}/.test(matchMetric.value)) {
    alert("Invalid match value! Make sure the match value is an integer.");
    matchMetric.focus();
    return;
  }
  if (1 > matchMetric.value || matchMetric.value > matchListings.length ){
    alert("Invalid match value! Make sure the match value is a valid qualifier match.");
    matchMetric.focus();
    return;
  }
  if (!confirm("Save match data?")) return;
  let surveys = JSON.parse(localStorage.surveys ?? "[]");
  surveys.push([
    { name: "Team", value: determineTeam(matchMetric.value, scoutLocation) },
    { name: "Match", value: matchMetric.value },
    { name: "Absent", value: isAbsent },
    ...gameMetrics.map(metric => { return { name: metric.name, value: metric.value } })
  ]);
  localStorage.surveys = JSON.stringify(surveys);
  resetSurvey(false);
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
  teamDisp.innerHTML = determineTeam(matchMetric.value, scoutLocation);
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
