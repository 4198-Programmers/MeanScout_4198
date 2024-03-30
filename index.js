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

const survey = {
    "metrics": [
        { "name": "Center Line Pick Up?", "type": "toggle", "category": "abilities", "group": "Auto (Qualitative)", "identifier": "auto-center-line-pick-up" },

        { "name": "Amp Scored", "type": "number", "category": "auto-scoring", "group": "Auto (Notes)", "identifier": "auto-scored-in-amp" },
        { "name": "Speaker Scored", "type": "number", "category": "auto-scoring", "identifier": "auto-scored-in-speaker" },
        { "name": "Missed in Amp", "type": "number", "category": "auto-scoring", "identifier": "auto-missed-in-amp" },
        { "name": "Missed in Speaker", "type": "number", "category": "auto-scoring", "identifier": "auto-missed-in-speaker" },

        { "name": "Amp Scored", "type": "number", "category": "teleop-scoring", "group": "Teleop (Qualitative)", "identifier": "teleop-scored-in-amp" },
        { "name": "Speaker Scored", "type": "number", "category": "teleop-scoring", "identifier": "teleop-scored-in-speaker" },
        { "name": "Amplified Scored", "type": "number", "category": "teleop-scoring", "identifier": "teleop-scored-in-amplified" },
        { "name": "Trap Scored", "type": "number", "category": "teleop-scoring", "identifier": "teleop-scored-in-trap" },

        { "name": "Missed in Amp", "type": "number", "category": "teleop-scoring", "identifier": "teleop-missed-in-amp" },
        { "name": "Missed in Speaker", "type": "number", "category": "teleop-scoring", "identifier": "teleop-missed-in-speaker" },
        { "name": "Note Missed in Trap", "type": "number", "category": "teleop-scoring", "identifier": "teleop-missed-in-trap" },

        { "name": "Defense Skill", "type": "rating", "category": "ratings", "group": "Ratings (Qualitative)", "identifier": "defense-skill" },
        { "name": "Driver Skill", "type": "rating", "category": "ratings", "identifier": "driver-skill" },
        { "name": "Intake Consistency", "type": "rating", "category": "ratings", "identifier": "intake-consistency" },
        { "name": "Speed", "type": "rating", "category": "ratings", "identifier": "speed" },
        { "name": "Stability", "type": "rating", "category": "ratings", "identifier": "stability" },

        { "name": "Notes", "type": "text", "category": "data", "tip": "Fouls, Disabled, etc...", "identifier": "notes" }
    ]
};

// const matchListings = [[4360, 8586, 7028, 3134, 9576, 3058], [4536, 6175, 3313, 3275, 3278, 4238], [3871, 2450, 3276, 876, 6453, 5576], [8255, 2883, 5464, 2654, 4674, 877], [6146, 4198, 3042, 2549, 7677, 2177], [7235, 4539, 5172, 8878, 3926, 5929], [3293, 6628, 4239, 9745, 8188, 4181], [2500, 4226, 3755, 2530, 9474, 2508], [3298, 3026, 7257, 5658, 3277, 5638], [7048, 3134, 3313, 3058, 6453, 4663], [3278, 3276, 9576, 7028, 5464, 2177], [6175, 3042, 3871, 877, 3926, 4536], [5172, 2654, 4181, 5576, 8878, 8586], [3755, 2508, 4238, 2450, 4539, 2883], [5638, 2530, 3026, 7677, 4239, 5929], [2549, 6628, 7235, 2500, 3277, 8255], [9474, 3298, 8188, 7257, 4198, 7048], [4674, 9745, 876, 5658, 4360, 3275], [4226, 4663, 5464, 6146, 3293, 2177], [3278, 8878, 5172, 3276, 3042, 6453], [877, 4238, 3058, 9576, 5638, 3926], [6628, 3871, 2654, 3313, 4539, 2530], [4536, 4239, 2549, 3298, 7235, 7048], [8188, 5576, 3026, 2883, 9745, 2500], [8255, 4360, 2508, 4663, 3277, 3293], [4198, 7677, 3134, 3755, 3275, 4674], [4181, 8586, 876, 4226, 6175, 7257], [2450, 9474, 6146, 7028, 5929, 5658], [4239, 3298, 3058, 3042, 5464, 6628], [9576, 2549, 9745, 5172, 3871, 2883], [3926, 2177, 7048, 3313, 3026, 4360], [2530, 3278, 4198, 8878, 4238, 8255], [7677, 2500, 4536, 7257, 876, 4539], [6146, 3134, 3277, 9474, 2654, 6175], [3275, 5576, 2450, 3293, 4226, 7235], [4674, 6453, 7028, 5638, 2508, 4663], [8586, 5658, 8188, 3276, 3755, 877], [3298, 2549, 5929, 4181, 3313, 9576], [4238, 5464, 4360, 7677, 8255, 5172], [8878, 6146, 7257, 3871, 3058, 9745], [3293, 3134, 2530, 3042, 2883, 3926], [6628, 4536, 7028, 3026, 4226, 4198], [4239, 3275, 5638, 8586, 2500, 3276], [3277, 7048, 3278, 4539, 877, 5576], [8188, 4674, 4663, 6175, 5929, 2450], [2177, 7235, 2654, 6453, 3755, 5658], [2508, 4181, 3042, 876, 9576, 9474], [8255, 3313, 3926, 7257, 7028, 7677], [2883, 2530, 4239, 5172, 4536, 6146], [3277, 3026, 3275, 5464, 7048, 8878], [4539, 9745, 4226, 3134, 3276, 4674], [5929, 3293, 6453, 4198, 8586, 6628], [5658, 3058, 6175, 5576, 2549, 2508], [4663, 3871, 877, 4181, 3755, 7235], [2500, 4360, 3298, 2654, 2450, 3278], [9474, 5638, 4238, 8188, 2177, 876], [3313, 7257, 3277, 4226, 3276, 2883], [6453, 9576, 8878, 4536, 3293, 4674], [6175, 4198, 4539, 3026, 5172, 4239], [7048, 6628, 7677, 2508, 5658, 3871], [3926, 4663, 3755, 5464, 5576, 3298], [5929, 2177, 4181, 3134, 3275, 2500], [3042, 2450, 8255, 9745, 5638, 8586], [7235, 876, 3278, 3058, 8188, 6146], [877, 7028, 9474, 2549, 2530, 4360], [2654, 5658, 4226, 4238, 4239, 9576], [2883, 6175, 7677, 6628, 8878, 3298], [3755, 7257, 3293, 7048, 5929, 3026], [5638, 8255, 4536, 5576, 4181, 3134], [7235, 2508, 9745, 8586, 3278, 5464], [2177, 877, 3313, 876, 5172, 2450], [3058, 2500, 2654, 3276, 4663, 4198], [6453, 3926, 4539, 3275, 9474, 2549], [4238, 8188, 3042, 3277, 7028, 3871], [4360, 4674, 5576, 2530, 6146, 6628], [9576, 7048, 3755, 9745, 8255, 6175], [2450, 877, 8878, 4239, 7257, 3134], [5464, 7235, 5658, 4198, 3313, 5638], [4663, 7677, 8586, 3278, 4536, 9474], [3926, 5172, 3275, 2508, 2654, 8188], [4539, 4181, 3277, 2177, 3058, 2530], [4360, 2883, 6453, 5929, 3042, 4226], [3871, 876, 2500, 7028, 3298, 3293], [3026, 4238, 3276, 4674, 6146, 2549]];
const matchListings = []

matchMetric.oninput = () => determineTeam(matchMetric.value, scoutLocation);

const exampleTemplate = survey;

let currentTemplate = JSON.parse(localStorage.template ?? JSON.stringify(exampleTemplate));
loadTemplate(currentTemplate);
setLocation(localStorage.location ?? "Red 1");

if (matchListings.length != 0) {
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
            return (matchListings[matchNo - 1][arrayPos]);
        } else {
            teamDisp.value = "None";
            return "None"
        }
    }
}

function postSurvey(surveyJson) {
    newJson = surveyToJson(surveyJson);

    let xhr = new XMLHttpRequest();
    xhr.open("POST", serverURL + "/api/scouting");

    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-pass-key", authPasswd.value);

    xhr.onload = function () {
        console.log(xhr.status);

        if (xhr.status == 401) {
            console.log("Password Failed")
            alert("Authentication failure. Please check password.");
            authPasswd.focus();
            return;
        }

        // Process our return data
        if (xhr.status >= 200 && xhr.status < 300) {
            // Runs when the request is successful
            console.log(xhr.responseText);
            if (xhr.status == 202) {
                resetSurvey(false);
            }
            else if (xhr.status == 200) {
                resetSurvey(false)
            }
            else {
                alert("Unknown error occured. Please check your Internet connection.");
                return;
            }
        } else {
            // Runs when it's not
            console.log(xhr.responseText)
        }
    };
    xhr.send(newJson);

}

function surveyToJson(surveyJson) {
    const formattedJson = {
        data: {
            "auto-scoring-2024": [],
            "teleop-scoring-2024": []
        }
    };

    surveyJson.forEach(metric => {
        if (!formattedJson[metric.category]) {
            switch (metric.category) {
                case "auto-scoring":
                case "teleop-scoring":
                    break;
                default:
                    formattedJson[metric.category] = {};
                    break;
            }
        }
        let identifier = metric.identifier ? metric.identifier : metric.name.toLowerCase().replace(/ /g, "-");
        if (metric.category === "auto-scoring" || metric.category === "teleop-scoring") {
            const categoryKey = metric.category === "auto-scoring" ? "auto-scoring-2024" : "teleop-scoring-2024";

            if (metric.value > 0) {
                switch (identifier) {
                    case "auto-scored-in-amp":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("as"));
                        break;
                    case "auto-missed-in-amp":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("am"));
                        break;
                    case "auto-scored-in-speaker":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("ss"));
                        break;
                    case "auto-missed-in-speaker":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("sm"));
                        break;
                    case "teleop-scored-in-amp":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("as"));
                        break;
                    case "teleop-missed-in-amp":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("am"));
                        break;
                    case "teleop-scored-in-speaker":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("ss"));
                        break;
                    case "teleop-scored-in-amplified":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("sa"));
                        break;
                    case "teleop-missed-in-speaker":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("sm"));
                        break;
                    case "teleop-scored-in-trap":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("ts"));
                        break;
                    case "teleop-missed-in-trap":
                        formattedJson.data[categoryKey].push(...Array(metric.value).fill("tm"));
                        break;
                    default:
                        break;
                }
            }
        } else {
            formattedJson[metric.category][identifier] = metric.value;
        }
    });

    return JSON.stringify(formattedJson, null, 2);
}

/** Function to call the survey data instead of just writing it all out manually */
function surveyData() {
    return [
        { name: "Team", value: teamMetric.value, category: "1metadata", identifier: "1team" },
        { name: "Matchnum", value: matchMetric.value, category: "1metadata", identifier: "2match" },
        { name: "Absent", value: isAbsent, category: "1metadata", identifier: "absent" },
        { name: "Location", value: locationSelect.value, category: "1metadata", identifier: "location" },
        { name: "Name", value: scoutName.value, category: "1metadata", identifier: "name" },
        ...gameMetrics.map(metric => { return { name: metric.name, value: metric.value, category: metric.category, identifier: metric.identifier } })
    ];
}

/** Stores the current unsaved survey to `localStorage` */
function backupSurvey() {
    localStorage.backup = JSON.stringify(surveyData());
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
        // console.log(metricObject)
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
    if (authPasswd.value == "") {
        if (!confirm("Save match data OFFLINE?")) return;
        let surveys = JSON.parse(localStorage.surveys ?? "[]");
        surveys.push(surveyData());
        console.log(surveyToJson(surveyData()))
        localStorage.surveys = JSON.stringify(surveys);
        resetSurvey(false);
    }
    else {
        if (!confirm("Save match data online?")) return;
        let surveys = JSON.parse(localStorage.surveys ?? "[]");
        surveys.push(surveyData());
        postSurvey(surveyData());
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
            surveyJson = JSON.parse(localStorage.surveys);
            console.log(surveyJson);
            if (surveyJson.length == 1) {
                newJson = surveyToJson(surveyJson[0]);
            } else {
                newJson = {entries: []}
                for (i = 0; i < surveyJson.length; i++) {
                    newJson["entries"].push(JSON.parse(surveyToJson(surveyJson[i])));
                }
                newJson = JSON.stringify(newJson, null, 2);
            }

            anchor.href += encodeURIComponent(newJson);
            console.log(newJson);
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
    if (prompt("This deletes all scouting data! Type 'ERASE' to erase saved surveys") == "ERASE") {
        localStorage.surveys = "[]";
    }
}
