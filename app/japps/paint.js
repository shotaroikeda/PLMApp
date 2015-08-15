///////////////////////////////////////////////////////////////////////////////////////////
// This is a rewrite of paint.js                                                         //
//                                                                                       //
// The problem with the current paint.js is that it does not follow readable code        //
// standards. In addition some functions are/were generally inefficent and should be     //
// rewritten from the ground up.                                                         //
//                                                                                       //
// The original will stay there for backwards compatibility, until this one is complete. //
///////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////
// Canvas Panel drawing related things. Not selected tools //
/////////////////////////////////////////////////////////////

var canvasObj = {
    // object variables
    contextDOM: $('#mainCanvas')[0].getContext("2d"),
    penDown: false,

    RGBA: {
        parseValue: function(val) {
            if (isNaN(parseInt(val)) || val > 255 || val < 0)
                val = 0;
            return val;
        },
        red: 0,
        green: 0,
        blue: 0,
        alpha: 1
    },
    penSize: 5,

    __previous_coord__: [undefined, undefined],

    // Functions we don't want people using that much
    __defaultSettings__: function() {
        // Javascript pseudo constructor replacement
        this.contextDOM.canvas.width = 600;
        this.contextDOM.canvas.height = 600;

        this.contextDOM.strokeStyle = "black";
        this.contextDOM.lineJoin = "round";
        this.contextDOM.linewidth = 5;
    },

    // Functions that will run often
    setColor: function() { // javascript varargs is strange...
        // Expecting setColor(r, g, b, a);
        var args = Array.prototype.slice.call(arguments);

        if(args.length != 4) {
            args.push(1);
        }

        this.contextDOM.strokeStyle = 'rgba(' + args.join(", ") + ')';
    },
    setSize: function(size) {
	this.contextDOM.lineWidth = size;
    },

    clearCanvas: function() {
        this.contextDOM.clearRect(0, 0,
                                  this.contextDOM.canvas.width, this.contextDOM.canvas.height);
    },

    draw: function(x, y, drag) {
        this.contextDOM.beginPath();

        if (drag) {
            var prevX = this.__previous_coord__[0];
            var prevY = this.__previous_coord__[1];
            this.contextDOM.moveTo(prevX, prevY);
        } else {
            this.contextDOM.moveTo(x-1, y);
        }
        this.__previous_coord__ = [x, y];

        this.contextDOM.lineTo(x, y);
        this.contextDOM.closePath();
        this.contextDOM.stroke();
    }
};

$('canvas').mousedown(function(e) {
    var mouseX = e.pageX - this.offsetLeft;
    var mouseY = e.pageY - this.offsetTop;

    canvasObj.penDown = true;
    canvasObj.draw(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, false);
});

$('canvas').mousemove(function(e) {
    if(canvasObj.penDown) {
        canvasObj.draw(e.pageX - this.offsetLeft, e.pageY - this.offsetTop, true);
    }
});

$('canvas').mouseup(function(e) {
    canvasObj.penDown = false;
});

$('canvas').mouseleave(function(e) {
    canvasObj.penDown = false;
});

canvasObj.__defaultSettings__();

////////////////////////////////////
// Context Tool Related functions //
////////////////////////////////////

/* Clear Canvas */
$('#cls').click(function () {
    canvasObj.clearCanvas();
});

/* Color change listener */
$('#RGBA').keyup(function(){

    $('#red').keyup(function(){
        canvasObj.RGBA.red = canvasObj.RGBA.parseValue($('#red')[0].value);
    })
    $('#green').keyup(function(){
        canvasObj.RGBA.green = canvasObj.RGBA.parseValue($('#green')[0].value);
    })
    $('#blue').keyup(function(){
        canvasObj.RGBA.blue = canvasObj.RGBA.parseValue($('#blue')[0].value);
    })
    $('#alpha').keyup(function(){
        var a = $('#alpha')[0].value;
        if (a > 1 || a < 0)
            a = 1;
        canvasObj.RGBA.alpha = a;
    })
    
    canvasObj.setColor(canvasObj.RGBA.red,
                       canvasObj.RGBA.green,
                       canvasObj.RGBA.blue,
                       canvasObj.RGBA.alpha);
    
});
// End color change actions

/* Brush listeners */
$('#size').keyup(function() {
    var size = $('#size')[0].value;
    if (isNaN(parseInt(size)) || size < 1 || size > 100)
	size = 1;
    canvasObj.setSize(size);
});

$('#eraser').click(function() {
    canvasObj.setColor(255, 255, 255, 1);
});

$('#pen').click(function() {
    canvasObj.setColor(canvasObj.RGBA.red,
                       canvasObj.RGBA.green,
                       canvasObj.RGBA.blue,
                       canvasObj.RGBA.alpha);
});
