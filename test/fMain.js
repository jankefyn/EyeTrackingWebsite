window.onload = async function () {

    //start the webgazer tracker
    await webgazer.setRegression('ridge') /* currently must set regression and tracker */
        //.setTracker('clmtrackr')
        .setGazeListener(function (data, clock) {
            playAudio(data);
        })
        .saveDataAcrossSessions(true)
        .begin();
    webgazer.showVideoPreview(false) /* shows all video previews */
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
const fadeTime = 0.150;

let loopStartTime = 0;
let lastPlayed = 0;




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
    }

    stop(time) {
        this.source.stop(time + fadeTime);
        this.gain.gain.setValueAtTime(this.amp, time);
        this.gain.gain.linearRampToValueAtTime(0, time + fadeTime);

        this.source = null;
        this.gain = null;
        activeLoops.delete(this);
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


function changeLoop(index, checker) {
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
        if (checker === 1 && !loop.isPlaying) {
            console.log("ich versuche zu starten " + index);
            loop.start(time, syncLoopPhase);
            lastPlayed = index;
            
        } else if (checker === 0 && loop.isPlaying) {
            console.log("ich versuche zu stoppen " + index);
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
            if (data.y > canvas.height / 2 && lastPlayed != 0) {
                changeLoop(lastPlayed, 0);
                changeLoop(0, 1);
                changecolor(3);
            }
            if (data.y <= canvas.height / 2 && lastPlayed != 1) {
                changeLoop(lastPlayed, 0);
                changeLoop(1, 1);
                changecolor(1);
            }
        }
        else {
            if (data.y > canvas.height / 2 && lastPlayed != 2) {
                changeLoop(lastPlayed, 0);
                changeLoop(2, 1);
                changecolor(4);
            }
            if (data.y <= canvas.height / 2 && lastPlayed != 3) {
                changeLoop(lastPlayed, 0);
                changeLoop(3, 1);
                changecolor(2);
            }
        }
    }
}

function changecolor(boxIndex) {
    //switch the box colours with the boxIndex and if not active switch back
    const box1 = document.querySelector('.box1');
    const box2 = document.querySelector('.box2');
    const box3 = document.querySelector('.box3');
    const box4 = document.querySelector('.box4');

    switch (boxIndex) {
        case (1):
        //alles gleich außer orange soll anders sein
            box1.style.backgroundColor = "#FFB347";
            box2.style.backgroundColor = "#FDFD96";
            box3.style.backgroundColor = "#6A93B0";
            box4.style.backgroundColor = "#77DD77";
            break;
        case (2):
            box1.style.backgroundColor = "#EFBE7D";
            box2.style.backgroundColor = "#FFFF00";
            box3.style.backgroundColor = "#6A93B0";
            box4.style.backgroundColor = "#77DD77";
            break;
        case (3):
            box1.style.backgroundColor = "#EFBE7D";
            box2.style.backgroundColor = "#FDFD96";
            box3.style.backgroundColor = "#0000FF";
            box4.style.backgroundColor = "#77DD77";
            break;
        case (4):
            box1.style.backgroundColor = "#EFBE7D";
            box2.style.backgroundColor = "#FDFD96";
            box3.style.backgroundColor = "#6A93B0";
            box4.style.backgroundColor = "#008000";
            break;

    }

}
