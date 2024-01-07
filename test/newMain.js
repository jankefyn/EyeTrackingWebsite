window.onload = async function () {

    //start the webgazer tracker
    await webgazer.setRegression('ridge') /* currently must set regression and tracker */
        //.setTracker('clmtrackr')
        .setGazeListener(function (data, clock) {
            playAudio(data);
        })
        .saveDataAcrossSessions(true)
        .begin();
    webgazer.showVideoPreview(true) /* shows all video previews */
        .showPredictionPoints(true) /* shows a square every 100 milliseconds where current prediction is */
        .applyKalmanFilter(true); /* Kalman Filter defaults to on. Can be toggled by user. */

    //Set up the webgazer video feedback.
    var setup = function () {

        //Set up the main canvas. The main canvas is used to calibrate the webgazer.
        var canvas = document.getElementById("plotting_canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
    };
    setup();

};

//set sound that needs to be played
var audioLeftTop = "./sounds/amChord.wav";
var audioRightTop = "./sounds/gChord.wav";
var audioRightBot = "./sounds/fChord.wav";
var audioLeftBot = "./sounds/dChord.wav";

var isPlaying = false;
var lastPlayed = "";
var firstAudioPlayed = false;


function playAudio(data) {
    var canvas = document.getElementById("plotting_canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (data != null) {
        if (data.x <= canvas.width / 2) {
            if (data.y > canvas.height / 2) {
                if (!isPlaying && lastPlayed != audioLeftTop) {
                    stopAudioIfPlayed()
                    lastPlayed = audioLeftTop
                    playAudioLoop(audioLeftTop);
                    firstAudioPlayed = true;
                }
            }
            else {
                if (!isPlaying && lastPlayed != audioLeftBot) {
                    stopAudioIfPlayed()
                    lastPlayed = audioLeftBot
                    playAudioLoop(audioLeftBot);
                    firstAudioPlayed = true;
                }
            }
        }
        else {
            if (data.y > canvas.height / 2) {
                if (!isPlaying && lastPlayed != audioRightTop) {
                    stopAudioIfPlayed()
                    playAudioLoop(audioRightTop);
                    firstAudioPlayed = true;
                    lastPlayed = audioRightTop;
                }
            }
            else {
                if (!isPlaying && lastPlayed != audioRightBot) {
                    stopAudioIfPlayed()
                    playAudioLoop(audioRightBot);
                    firstAudioPlayed = true;
                    lastPlayed = audioRightBot;
                }
            }
        }
    }
}

function stopAudioIfPlayed() {
    if (firstAudioPlayed) {
        stopAudio();
    }
}

let audioElement;
let audioContext;

// Function to load an audio file and play it in a loop
function playAudioLoop(url) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioElement = new Audio(url);
    const source = audioContext.createMediaElementSource(audioElement);
    const gainNode = audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    audioElement.loop = true;
    audioElement.play();
}

// Function to stop the audio playback and release resources
function stopAudio() {
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement = null;
        audioContext = null;
    }
}

// Set to true if you want to save the data even if you reload the page.
window.saveDataAcrossSessions = true;

window.onbeforeunload = function () {
    webgazer.end();
}

/**
 * Restart the calibration process by clearing the local storage and reseting the calibration point
 */
function Restart() {
    document.getElementById("Accuracy").innerHTML = "<a>Not yet Calibrated</a>";
    webgazer.clearData();
    ClearCalibration();
    PopUpInstruction();
} 