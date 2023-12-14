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
var audioFileUrl = '../sounds/amChord.wav';


function playAudio(data) {
    console.log("isconfirmed" + isConfirm)
    var canvas = document.getElementById("plotting_canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (data != null) {
        if (data.x <= canvas.width / 2) {
            playAudioLoop(audioFileUrl);
            console.log("ich bin links");
        }
        else {
            console.log("ich bin Rechts");
        }
    }
}


// Function to load an audio file and play it in a loop
function playAudioLoop(url) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioElement = new Audio(url);
    const source = audioContext.createMediaElementSource(audioElement);
    const gainNode = audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    audioElement.loop = true;
    audioElement.play();
}
// Function to stop the audio playback
function stopAudio() {
    if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
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
