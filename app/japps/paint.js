var context = $('#canvas_perfect')[0].getContext("2d");

var paint = false;

// colors
var colorPurple = "#cb3594";
var colorGreen = "#659b41";
var colorYellow = "#ffcf33";
var colorBrown = "#986928";

var curColor = colorPurple;
var clickColor = new Array();

context.canvas.width = 400;
context.canvas.height = 400;

$('canvas').mousedown(function(e) {
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;

    paint = true;
    addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
    redraw();
});

$('canvas').mousemove(function(e) {
    if(paint) {
        addClick(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
        redraw();
    }
});

$('canvas').mouseup(function(e) {
    paint = false;
    clickX = [];
    clickY = [];
    clickDrag = [];
    curColor = [];
});

$('canvas').mouseleave(function(e) {
    paint = false;
});

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();

function addClick(x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
    clickColor.push(curColor);
}

function redraw() {
    // context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clear Canvas
    // context.strokeStyle = "#df4b26";
    context.lineJoin = "round";
    context.lineWidth = 5;

    for (var i=0; i < clickX.length; i++) {
	context.strokeStyle = clickColor[i];
        context.beginPath();
        if(clickDrag[i]) {
            context.moveTo(clickX[i-1], clickY[i-1]);
        } else {
            context.moveTo(clickX[i]-1, clickY[i]);
        }
        context.lineTo(clickX[i], clickY[i]);
        context.closePath();
        context.stroke();
    }
}

$('#cls').click(function() {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
});

$('#canvas-perfect').resizable();
