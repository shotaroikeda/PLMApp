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
        increment: function(val, id) {
            if (val < 255) {
                ++val;
                $(id).val(val);
            }
            return val;
        },
        decrement: function(val, id) {
            if (val > 0) {
                --val;
                $(id).val(val);
	    }
            return val;
        },
        parseValue: function(val) {
            if (isNaN(parseInt(val)) || val > 255 || val < 0)
                val = 0;
            return val;
        },
	updateValue: function(val, id) {
	    if (isNaN(val) || val > 255 || val < 0)
		val = 0;
	    $(id).val(val);
	},
        red: 0,
        green: 0,
        blue: 0,
        alpha: 1
    },

    __previous_coord__: [undefined, undefined],

    // Functions we don't want people using that much
    __defaultSettings__: function() {
        // Javascript pseudo constructor replacement
        this.contextDOM.canvas.width = window.innerWidth*.75;
        this.contextDOM.canvas.height = window.innerHeight;

        this.contextDOM.strokeStyle = "black";
        this.contextDOM.lineJoin = "round";
        this.contextDOM.lineWidth = 5;
    },

    // Functions that will run often
    applyRGBA: function() {
        this.setColor(this.RGBA.red,
                      this.RGBA.green,
                      this.RGBA.blue,
                      this.RGBA.alpha);
        $('#fancy-color-preview')[0].style.backgroundColor = this.contextDOM.strokeStyle;
    },

    setColor: function() { // javascript varargs is strange...
        // Expecting setColor(r, g, b, a);
        var args = Array.prototype.slice.call(arguments);

        if(args.length != 4) {
            args.push(1);
        }

        this.contextDOM.strokeStyle = 'rgba(' + args.join(", ") + ')';
    },
    setSize: function(size) {
        if (isNaN(parseInt(size)) || size < 1 || size > 100)
            size = 1;
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
/*** Note: I'm not sure if this can be cleaned up or put into the canvasObj
     instead of being "global" functions ***/
// Manual value input
$('#red').keyup(function(){
    canvasObj.RGBA.red = canvasObj.RGBA.parseValue($('#red')[0].value);
    canvasObj.applyRGBA();
});
$('#green').keyup(function(){
    canvasObj.RGBA.green = canvasObj.RGBA.parseValue($('#green')[0].value);
    canvasObj.applyRGBA();
});
$('#blue').keyup(function(){
    canvasObj.RGBA.blue = canvasObj.RGBA.parseValue($('#blue')[0].value);
    canvasObj.applyRGBA();
});
$('#alpha').keyup(function(){
    var a = $('#alpha')[0].value;
    if (a > 1 || a < 0)
        a = 1;
    canvasObj.RGBA.alpha = a;
    canvasObj.applyRGBA();
});
$('#red').focusout(function(){
    canvasObj.RGBA.updateValue(canvasObj.RGBA.red, '#red');
});
$('#green').focusout(function(){
    canvasObj.RGBA.updateValue(canvasObj.RGBA.green, '#green');
});
$('#blue').focusout(function(){
    canvasObj.RGBA.updateValue(canvasObj.RGBA.blue, '#blue');
});
$('#alpha').focusout(function(){
    canvasObj.RGBA.updateValue(canvasObj.RGBA.alpha, '#alpha');
});
// Click + or - actions
$('#red-minus').click(function(){
    canvasObj.RGBA.red = canvasObj.RGBA.decrement(canvasObj.RGBA.red, '#red');
    canvasObj.applyRGBA();
});
$('#red-plus').click(function(){
    canvasObj.RGBA.red = canvasObj.RGBA.increment(canvasObj.RGBA.red, '#red');
    canvasObj.applyRGBA();
});
$('#green-minus').click(function(){
    canvasObj.RGBA.green = canvasObj.RGBA.decrement(canvasObj.RGBA.green, '#green');
    canvasObj.applyRGBA();
});
$('#green-plus').click(function(){
    canvasObj.RGBA.green = canvasObj.RGBA.increment(canvasObj.RGBA.green, '#green');
    canvasObj.applyRGBA();
});
$('#blue-minus').click(function(){
    canvasObj.RGBA.blue = canvasObj.RGBA.decrement(canvasObj.RGBA.blue, '#blue');
    canvasObj.applyRGBA();
});
$('#blue-plus').click(function(){
    canvasObj.RGBA.blue = canvasObj.RGBA.increment(canvasObj.RGBA.blue, '#blue');
    canvasObj.applyRGBA();
});
// Can't do val-=0.1 because of float rouding errors
$('#alpha-minus').click(function(){
    if (canvasObj.RGBA.alpha > 0) {
	canvasObj.RGBA.alpha = (parseFloat(canvasObj.RGBA.alpha)*100 - 10)/100;
	$('#alpha').val(canvasObj.RGBA.alpha);
    }
    canvasObj.applyRGBA();
});
$('#alpha-plus').click(function(){
    if (canvasObj.RGBA.alpha < 1) {
	canvasObj.RGBA.alpha = (parseFloat(canvasObj.RGBA.alpha)*100 + 10)/100;
	$('#alpha').val(canvasObj.RGBA.alpha);
    }
    canvasObj.applyRGBA();
});
// End color change actions

/* Brush listeners */
$('#size').keyup(function() {
    canvasObj.setSize($('#size')[0].value);
});
$('#size-minus').click(function() {
    console.log('ran');
    canvasObj.setSize(canvasObj.contextDOM.lineWidth - 1);
    $('#size').val(canvasObj.contextDOM.lineWidth);
});
$('#size-plus').click(function() {
    canvasObj.setSize(canvasObj.contextDOM.lineWidth + 1);
    $('#size').val(canvasObj.contextDOM.lineWidth);
});
$('#size').focusout(function() {
    $('#size').val(canvasObj.contextDOM.lineWidth);
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

// startup functions
$(document).ready(function () {
});
