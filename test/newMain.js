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

    //Set up the webgazer video feedback. and audio
    var setup = function () {
        //Set up the main canvas. The main canvas is used to calibrate the webgazer.
        var canvas = document.getElementById("plotting_canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
    };
    setup();

};

let oscillator = null;
let gainNode = null;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const initialVol = 0.001;
const maxFreq = 6000;
const maxVol = 0.02;

function playAudio(data) {
    if (oscillator != null) {
        oscillator.frequency.value = (data.x / WIDTH) * maxFreq;
    }
    if (gainNode != null) {
        gainNode.gain.value = (data.y / HEIGHT) * maxVol;
    }

}

function setAudio() {

    console.log("hallo ich bin hier");
    // create web audio api context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();

    // create Oscillator and gain node
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    // connect oscillator to gain node to speakers
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // set options for the oscillator
    oscillator.detune.value = 100; // value in cents
    oscillator.start(0);

    oscillator.onended = function () {
        console.log('Your tone has now stopped playing!');
    };

    gainNode.gain.value = initialVol;
    gainNode.gain.minValue = initialVol;
    gainNode.gain.maxValue = initialVol;
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