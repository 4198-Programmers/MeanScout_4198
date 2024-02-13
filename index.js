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
let serverURL = "http://127.0.0.1:8000";

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
        { "name": "Leave Starting Zone?", "type": "toggle", "category": "abilities", "identifier": "auto-leave-starting-zone" },

        { "name": "Scored in Amp", "type": "number", "category": "auto-scoring", "group": "Auto (Notes)", "identifier": "auto-scored-in-amp" },
        { "name": "Missed in Amp", "type": "number", "category": "auto-scoring", "identifier": "auto-missed-in-amp" },
        { "name": "Scored in Speaker", "type": "number", "category": "auto-scoring", "identifier": "auto-scored-in-speaker" },
        { "name": "Missed in Speaker", "type": "number", "category": "auto-scoring", "identifier": "auto-missed-in-speaker" },

        { "name": "Scored in Amp", "type": "number", "category": "teleop-scoring", "group": "Teleop (Qualitative)", "identifier": "teleop-scored-in-amp" },
        { "name": "Missed in Amp", "type": "number", "category": "teleop-scoring", "identifier": "teleop-missed-in-amp" },
        { "name": "Scored in Speaker", "type": "number", "category": "teleop-scoring", "identifier": "teleop-scored-in-speaker" },
        { "name": "Scored in Amplified", "type": "number", "category": "teleop-scoring", "identifier": "teleop-scored-in-amplified" },
        { "name": "Missed in Speaker", "type": "number", "category": "teleop-scoring", "identifier": "teleop-missed-in-speaker" },
        { "name": "Note Scored in Trap", "type": "number", "category": "teleop-scoring", "identifier": "teleop-scored-in-trap" },
        { "name": "Note Missed in Trap", "type": "number", "category": "teleop-scoring", "identifier": "teleop-missed-in-trap" },

        { "name": "Spotlit?", "type": "toggle", "category": "abilities", "group": "Endgame (Qualitative)", "identifier": "teleop-spotlight-2024" },
        { "name": "Stage Level", "type": "select", "category": "abilities", "values": ["None", "Parked", "Onstage", "Harmonized"], "identifier": "teleop-stage-level-2024" },
        { "name": "Can pick up from ground?", "type": "toggle", "category": "abilities", "identifier": "ground-pick-up" },

        { "name": "Defense Skill", "type": "rating", "category": "ratings", "group": "Ratings (Qualitative)", "identifier": "defense-skill" },
        { "name": "Driver Skill", "type": "rating", "category": "ratings", "identifier": "driver-skill" },
        { "name": "Intake Consistency", "type": "rating", "category": "ratings", "identifier": "intake-consistency" },
        { "name": "Speed", "type": "rating", "category": "ratings", "identifier": "speed" },
        { "name": "Stability", "type": "rating", "category": "ratings", "identifier": "stability" },

        { "name": "Notes", "type": "text", "category": "data", "tip": "Fouls, Disabled, etc...", "identifier": "notes" }
    ]
};

//const matchListings = [[2502, 2846, 4664, 2207, 3082, 2450], [2225, 5278, 2606, 8787, 2177, 4632], [2855, 2470, 4663, 4536, 3038, 2549], [3610, 2823, 2513, 7258, 2500, 4215], [3454, 2491, 5434, 7849, 7068, 3206], [2879, 5271, 8234, 2515, 3018, 4225], [4277, 2052, 3630, 4198, 7235, 3278], [5913, 1816, 3407, 4549, 8255, 7019], [2509, 3202, 2498, 2181, 3026, 2518], [9157, 2508, 6709, 5996, 3871, 3007], [3610, 7258, 7850, 4536, 2855, 2225], [7068, 2502, 2823, 4663, 5278, 2450], [2515, 7849, 8787, 2207, 2513, 2177], [2846, 8234, 4198, 5271, 2491, 2549], [3407, 7235, 4632, 3454, 4225, 5913], [3038, 2606, 2509, 3278, 2498, 3082], [2052, 4664, 6709, 7019, 3202, 3018], [2470, 3206, 4549, 3630, 5996, 2508], [3026, 3007, 4215, 2518, 7850, 5434], [8255, 2500, 2181, 2879, 9157, 4277], [3871, 4198, 3610, 7849, 2207, 1816], [2225, 3454, 2515, 2450, 2491, 2502], [3407, 2513, 3278, 5271, 7068, 2855], [8787, 3082, 5913, 2549, 4225, 3202], [7019, 5996, 4536, 2846, 4632, 2498], [2508, 2509, 2518, 5434, 2052, 4663], [3026, 5278, 8234, 3630, 8255, 2879], [2181, 2823, 3018, 1816, 7850, 3038], [3206, 4215, 3871, 7258, 4549, 4664], [3007, 6709, 2177, 4277, 2500, 7235], [2491, 2606, 9157, 3202, 2470, 3610], [2498, 7849, 5996, 3278, 2502, 8787], [2518, 4536, 2515, 4198, 5913, 7068], [4663, 2207, 2225, 2052, 3407, 2879], [2823, 2508, 3082, 4632, 3018, 8255], [5434, 2855, 5278, 4664, 8234, 1816], [2177, 7258, 5271, 3038, 3454, 3007], [2450, 9157, 7235, 7850, 2549, 4549], [4215, 3630, 2470, 2181, 2846, 6709], [3026, 4225, 2513, 4277, 3206, 2606], [7019, 3871, 2502, 2500, 2509, 2491], [5996, 2518, 2879, 2823, 3407, 7849], [3082, 4663, 4632, 8234, 3610, 2515], [8255, 2207, 3454, 3038, 5434, 3202], [1816, 3007, 7258, 2498, 2450, 2052], [2855, 3630, 2846, 5913, 2177, 9157], [3206, 4664, 2181, 2225, 3018, 7235], [3871, 7068, 2549, 2606, 7019, 3026], [2508, 3278, 4225, 6709, 2513, 4536], [5271, 8787, 4277, 4549, 4215, 2509], [7850, 2470, 2500, 5278, 4198, 3454], [2491, 2515, 3082, 5996, 1816, 2052], [2846, 2450, 3202, 4632, 2879, 3038], [3630, 3007, 2498, 3018, 4664, 3407], [7235, 2549, 8255, 3871, 2518, 7258], [2177, 3278, 2181, 2508, 3026, 3610], [2502, 6709, 4549, 2513, 5434, 2606], [5271, 2509, 2207, 5278, 4536, 9157], [8234, 5913, 7850, 2470, 4277, 7849], [2500, 7019, 2823, 2855, 8787, 3206], [7068, 4663, 4225, 4215, 2225, 4198], [2491, 4632, 7258, 3082, 2518, 3630], [4664, 2498, 3454, 2515, 2549, 2508], [2879, 3610, 2846, 2502, 5434, 3007], [3202, 7235, 5996, 2513, 5271, 5278], [4536, 2450, 3407, 8234, 2181, 3871], [6709, 3206, 1816, 2509, 8787, 7850], [8255, 4198, 2052, 4215, 2606, 2855], [3018, 4277, 2177, 9157, 4663, 7019], [3278, 2225, 2470, 2823, 4549, 2207], [4225, 3038, 2500, 5913, 7849, 3026], [3082, 2879, 7068, 7235, 2498, 5271], [2549, 4632, 2513, 3007, 2181, 2491], [5278, 1816, 2515, 2518, 2846, 3206], [8787, 3407, 2508, 7258, 2502, 4198], [4664, 7850, 4663, 2606, 8255, 5996], [3454, 4215, 7019, 9157, 8234, 3278], [2509, 2177, 3871, 4225, 2823, 2470], [5434, 4536, 3630, 3202, 2225, 2500], [7849, 2855, 3018, 2450, 4549, 3026], [3610, 3038, 2207, 7068, 6709, 4277], [3206, 5271, 5913, 2052, 2181, 2502], [7235, 7258, 8787, 4663, 2491, 2846], [4198, 9157, 2518, 2513, 2879, 4664], [3007, 2515, 8255, 2470, 7019, 2509], [2606, 3454, 4536, 1816, 3630, 2823], [2500, 3278, 7849, 2549, 3082, 2225], [7850, 3202, 7068, 2177, 2508, 8234], [4632, 4277, 5434, 2498, 3871, 2855], [3018, 5996, 2450, 2207, 5913, 4215], [4549, 2052, 3038, 4225, 3610, 5278], [6709, 3026, 2491, 3407, 2515, 5271]];
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
            console.log(xhr.responseText);
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

        if (metric.category === "auto-scoring" || metric.category === "teleop-scoring") {
            const categoryKey = metric.category === "auto-scoring" ? "auto-scoring-2024" : "teleop-scoring-2024";
            const identifier = metric.identifier;

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
            formattedJson[metric.category][metric.identifier] = metric.value;
        }
    });

    return JSON.stringify(formattedJson, null, 2);
}

/** Function to call the survey data instead of just writing it all out manually */
function surveyData() {
    return [
        { name: "Team", value: teamMetric.value, category: "1metadata", identifier: "team" },
        { name: "Matchnum", value: matchMetric.value, category: "1metadata", identifier: "match" },
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
