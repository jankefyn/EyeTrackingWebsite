window.onload = function() {
    webgazer.setGazeListener(function(data, elapsedTime) {
        if (data == null) {
            return;
        }
        var xprediction = data.x; //these x coordinates are relative to the viewport
        var yprediction = data.y; //these y coordinates are relative to the viewport
        drawCircle(xprediction,yprediction);
        console.log("x: "+ xprediction); //elapsed time is based on time since begin was called
    }).begin();
};
// Function to draw a red circle at the specified coordinates
function drawCircle(x, y) {
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas width and height to match window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Clear the canvas before drawing the circle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a red circle at the specified coordinates
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.closePath();
  }


