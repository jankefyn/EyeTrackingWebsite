var PointCalibrate = 0;
var CalibrationPoints = {};

// Find the help modal
var helpModal;

/**
 * Clear the canvas and the calibration button.
 */
function ClearCanvas() {
  document.querySelectorAll('.Calibration').forEach((i) => {
    i.style.setProperty('display', 'none');
  });
  var canvas = document.getElementById("plotting_canvas");
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Show the instruction of using calibration at the start up screen.
 */
function PopUpInstruction() {
  ClearCanvas();
  swal({
    title: "Kalibrierung",
    text: "Bitte klicken Sie auf jeden der 9 Punkte auf dem Bildschirm. Sie müssen jeden Punkt 5 Mal anklicken, bis er gelb wird. Dadurch werden Ihre Augenbewegungen kalibriert.",
    buttons: {
      cancel: false,
      confirm: true
    }
  }).then(isConfirm => {
    ShowCalibrationPoint();
    loadLoops();
  });

}
/**
  * Show the help instructions right at the start.
  */
function helpModalShow() {
  if (!helpModal) {
    helpModal = new bootstrap.Modal(document.getElementById('helpModal'))
  }
  helpModal.show();
}

function calcAccuracy() {
  // show modal
  // notification for the measurement process
  swal({
    title: "Berechnung der Messung",
    text: "Bitte bewegen Sie Ihre Maus nicht und starren Sie für die nächsten 5 Sekunden auf den mittleren Punkt. Dadurch können wir die Genauigkeit der Vorhersagen berechnen.",
    closeOnEsc: false,
    allowOutsideClick: false,
    closeModal: true
  }).then(() => {
    // makes the variables true for 5 seconds & plots the points

    store_points_variable(); // start storing the prediction points

    sleep(5000).then(() => {
      stop_storing_points_variable(); // stop storing the prediction points
      var past50 = webgazer.getStoredPoints(); // retrieve the stored points
      var precision_measurement = calculatePrecision(past50);
      var accuracyLabel = "<a>Accuracy | " + precision_measurement + "%</a>";
      document.getElementById("Accuracy").innerHTML = accuracyLabel; // Show the accuracy in the nav bar.
      swal({
        title: "Your accuracy measure is " + precision_measurement + "%",
        allowOutsideClick: false,
        buttons: {
          cancel: "Recalibrate",
          confirm: true,
        }
      }).then(isConfirm => {
        if (isConfirm) {
          //clear the calibration & hide the last middle button
          ClearCanvas();
        } else {
          //use restart function to restart the calibration
          document.getElementById("Accuracy").innerHTML = "<a>Not yet Calibrated</a>";
          webgazer.clearData();
          ClearCalibration();
          ClearCanvas();
          ShowCalibrationPoint();
        }
      });
    });
  });
}

function calPointClick(node) {
  const id = node.id;

  if (!CalibrationPoints[id]) { // initialises if not done
    CalibrationPoints[id] = 0;
  }
  CalibrationPoints[id]++; // increments values

  if (CalibrationPoints[id] == 5) { //only turn to yellow after 5 clicks
    node.style.setProperty('background-color', 'yellow');
    node.setAttribute('disabled', 'disabled');
    PointCalibrate++;
  } else if (CalibrationPoints[id] < 5) {
    //Gradually increase the opacity of calibration points when click to give some indication to user.
    var opacity = 0.2 * CalibrationPoints[id] + 0.2;
    node.style.setProperty('opacity', opacity);
  }

  //Show the middle calibration point after all other points have been clicked.
  if (PointCalibrate == 8) {
    document.getElementById('Pt5').style.removeProperty('display');
  }

  if (PointCalibrate >= 9) { // last point is calibrated
    // grab every element in Calibration class and hide them except the middle point.
    document.querySelectorAll('.Calibration').forEach((i) => {
      i.style.setProperty('display', 'none');
    });
    document.getElementById('Pt5').style.removeProperty('display');

    // clears the canvas
    var canvas = document.getElementById("plotting_canvas");
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the accuracy
    calcAccuracy();
  }
}

/**
 * Load this function when the index page starts.
* This function listens for button clicks on the html page
* checks that all buttons have been clicked 5 times each, and then goes on to measuring the precision
*/
//$(document).ready(function(){
function docLoad() {
  ClearCanvas();
  helpModalShow();

  // click event on the calibration buttons
  document.querySelectorAll('.Calibration').forEach((i) => {
    i.addEventListener('click', () => {
      calPointClick(i);
    })
  })
};
window.addEventListener('load', docLoad);

/**
 * Show the Calibration Points
 */
function ShowCalibrationPoint() {
  document.querySelectorAll('.Calibration').forEach((i) => {
    i.style.removeProperty('display');
  });
  // initially hides the middle button
  document.getElementById('Pt5').style.setProperty('display', 'none');
}

/**
* This function clears the calibration buttons memory
*/
function ClearCalibration() {
  // Clear data from WebGazer

  document.querySelectorAll('.Calibration').forEach((i) => {
    i.style.setProperty('background-color', 'red');
    i.style.setProperty('opacity', '0.2');
    i.removeAttribute('disabled');
  });

  CalibrationPoints = {};
  PointCalibrate = 0;
}

// sleep function because java doesn't have one, sourced from http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
