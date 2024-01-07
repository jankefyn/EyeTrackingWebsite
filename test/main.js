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


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//new audio
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;

const sounds = ['../test/sounds/amChord.wav', '../test/sounds/dChord.wav', '../test/sounds/fChord.wav', '../test/sounds/gChord.wav'];
const levels = [0, 0, 0, 0];
const loops = [];
const activeLoops = new Set();
let loopStartTime = 0;
const fadeTime = 0.050;



/***************************************************************************/

class Loop {
    constructor(buffer, level = 0) {
        this.buffer = buffer;
        this.amp = decibelToLinear(level);
        this.gain = null;
        this.source = null;
        this.analyser = null;
    }

    start(time, sync = true) {
        const buffer = this.buffer;
        let analyser = this.analyser;
        let offset = 0;

        if (analyser === null) {
            analyser = audioContext.createAnalyser();
            this.analyser = analyser;
            this.analyserArray = new Float32Array(analyser.fftSize);
        }

        const gain = audioContext.createGain();
        gain.connect(audioContext.destination);
        gain.connect(analyser);

        if (sync) {
            // fade in only when starting somewhere in the middle
            gain.gain.value = 0;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(this.amp, time + fadeTime);

            // set offset to loop time
            offset = (time - loopStartTime) % buffer.duration;
        }

        const source = audioContext.createBufferSource();
        source.connect(gain);
        source.buffer = buffer;
        source.loop = true;
        source.start(time, offset);

        this.source = source;
        this.gain = gain;

        activeLoops.add(this);
        this.button.classList.add('active');
    }

    stop(time) {
        this.source.stop(time + fadeTime);
        this.gain.gain.setValueAtTime(this.amp, time);
        this.gain.gain.linearRampToValueAtTime(0, time + fadeTime);

        this.source = null;
        this.gain = null;

        activeLoops.delete(this);
        this.button.classList.remove('active');
        this.button.style.opacity = 0.25;
    }

    displayIntensity() {
        const analyser = this.analyser;

        if (analyser.getFloatTimeDomainData) {
            const array = this.analyserArray;
            const fftSize = analyser.fftSize;

            analyser.getFloatTimeDomainData(array);

            let sum = 0;
            for (let i = 0; i < fftSize; i++) {
                const value = array[i];
                sum += (value * value);
            }

            const opacity = Math.min(1, 0.25 + 10 * Math.sqrt(sum / fftSize));
            this.button.style.opacity = opacity;
        }
    }

    get isPlaying() {
        return (this.source !== null);
    }
}

async function loadAudioFile(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
}

async function loadLoops() {
    const decodeContext = new AudioContext();
    for (let i = 0; i < sounds.length; i++) {
        const audioFile = await loadAudioFile(sounds[i]);
        decodeContext.decodeAudioData(audioFile, (buffer) => {
            loops[i] = new Loop(buffer, levels[i]);
        });
    }
}


function changeLoop(index) {
    const loop = loops[index];

    if (audioContext === null)
        audioContext = new AudioContext();

    if (loop) {
        const time = audioContext.currentTime;
        let syncLoopPhase = true;

        if (activeLoops.size === 0) {
            loopStartTime = time;
            syncLoopPhase = false;
            window.requestAnimationFrame(displayIntensity);
        }

        if (!loop.isPlaying) {
            loop.start(time, syncLoopPhase);
        } else {
            loop.stop(time);
        }
    }


}

function displayIntensity() {
    for (let loop of activeLoops)
        loop.displayIntensity();

    if (activeLoops.size > 0)
        window.requestAnimationFrame(displayIntensity);
}

function decibelToLinear(val) {
    return Math.exp(0.11512925464970229 * val); // pow(10, val / 20)
}


function playAudio(data) {
    var canvas = document.getElementById("plotting_canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (data != null) {
        if (data.x <= canvas.width / 2) {
            if (data.y > canvas.height / 2) {
                changeLoop(0);
            }
            else {
                changeLoop(1);
            }
        }
        else {
            if (data.y > canvas.height / 2) {
                changeLoop(2);
            }
            else {
                changeLoop(3);
            }
        }
    }
}
