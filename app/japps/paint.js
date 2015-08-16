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

//CONSTANTS - use for indexing canvasobj colorcomponents
const RED = 0;
const GREEN = 1;
const BLUE = 2;
const ALPHA = 3;

function ColorComponent(componentValue, id) {
    this.componentValue = componentValue
    this.id = id;
}

ColorComponent.prototype = {
    //stores ID of the class
    id: "",
    componentValue: 0,

    //Changes component value by a +1 or -1
    changeComponentValue: function(change) {
        this.componentValue += change;
        this.componentValue %= 255;
        $(this.id).val(this.componentValue);
    },
    //Manual number input
    parseValue: function(val) {
        if (isNaN(parseInt(val)) || val > 255 || val < 0)
            val = 0;
        $(this.id).val(val);
        componentValue = val;
    },
    //check if update value is necessary
    updateValue: function() {
        $(this.id).val(this.componentValue);
    }
};

var canvasObj = {
    // object variables
    contextDOM: $('#mainCanvas')[0].getContext("2d"),
    penDown: false,
    //Valid draw modes: pen, eraser, bucket
    currentDrawMode: "pen",

    colorComponents: [new ColorComponent(0, "#red"), new ColorComponent(0, "#green"), new ColorComponent(0, "#blue"), new ColorComponent(1, "#alpha")],

    __previous_coord__: [undefined, undefined],

    // Functions we don't want people using that much
    __defaultSettings__: function() {
        // Javascript pseudo constructor replacement
        this.contextDOM.canvas.width = window.innerWidth*.85;
        this.contextDOM.canvas.height = window.innerHeight - 50;

        this.contextDOM.strokeStyle = "black";
        this.contextDOM.lineJoin = "round";
        this.contextDOM.lineWidth = 5;
    },

    //Sets the color of the preview box to the currently selected RGBA value
    applyRGBA: function() {
        this.setColor(this.colorComponents[RED].componentValue,
                      this.colorComponents[GREEN].componentValue,
                      this.colorComponents[BLUE].componentValue,
                      this.colorComponents[ALPHA].componentValue);
        $('#fancy-color-preview')[0].style.backgroundColor = this.contextDOM.strokeStyle;
    },

    //Sets the color of the stroke
    setColor: function(r, g, b, a) {
        if (this.currentDrawMode == "pen") {

            /*
            //TODO why is this necessary
            // Expecting setColor(r, g, b, a);
            var args = Array.prototype.slice.call(arguments);

            if(args.length != 4) {
                args.push(1);
            }
            */

            this.contextDOM.strokeStyle = 'rgba(' + r + g + b + a + ')';
        }
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
$('#red').keyup(function() {
    canvasObj.colorComponents[RED].parseValue($('#red')[0].value);
    canvasObj.applyRGBA();
});
$('#green').keyup(function() {
    canvasObj.colorComponents[GREEN].parseValue($('#green')[0].value);
    canvasObj.applyRGBA();
});
$('#blue').keyup(function() {
    canvasObj.colorComponents[BLUE].parseValue($('#blue')[0].value);
    canvasObj.applyRGBA();
});
$('#alpha').keyup(function() {
    var alph = $('#alpha')[0].value;
    if (alph > 1 || a < 0) a = 1;
    canvasObj.colorComponents[ALPHA].parseValue($('#alpha')[0].value);
    canvasObj.applyRGBA();
});

//TODO check if these are necessary
$('#red').focusout(function() {
    canvasObj.colorComponents[RED].updateValue();
});
$('#green').focusout(function() { 
    canvasObj.colorComponents[GREEN].updateValue();
});
$('#blue').focusout(function() {
    canvasObj.colorComponents[BLUE].updateValue();
});
$('#alpha').focusout(function() {
    canvasObj.colorComponents[ALPHA].updateValue();
});
// Click + or - actions
$('#red-minus').click(function() {
    canvasObj.colorComponents[RED].changeComponentValue(-1);
    canvasObj.applyRGBA();
});
$('#red-plus').click(function() {
    canvasObj.colorComponents[RED].changeComponentValue(1);
    canvasObj.applyRGBA();
});
$('#green-minus').click(function() {
    canvasObj.colorComponents[GREEN].changeComponentValue(-1);
    canvasObj.applyRGBA();
});
$('#green-plus').click(function() {
    canvasObj.colorComponents[GREEN].changeComponentValue(1);
    canvasObj.applyRGBA();
});
$('#blue-minus').click(function() {
    canvasObj.colorComponents[BLUE].changeComponentValue(-1);
    canvasObj.applyRGBA();
});
$('#blue-plus').click(function() {
    canvasObj.colorComponents[BLUE].changeComponentValue(1);
    canvasObj.applyRGBA();
});
// Can't do val-=0.1 because of float rouding errors
//TODO look into why this isnt calling the method
$('#alpha-minus').click(function(){
    if (canvasObj.RGBA.alpha > 0) {
	   canvasObj.colorComponents[ALPHA].componentValue = (parseFloat(canvasObj.RGBA.alpha)*100 - 10)/100;
	   $('#alpha').val(canvasObj.RGBA.alpha);
    }
    canvasObj.applyRGBA();
});
$('#alpha-plus').click(function(){
    if (canvasObj.RGBA.alpha < 1) {
	   canvasObj.colorComponents[ALPHA].componentValue = (parseFloat(canvasObj.RGBA.alpha)*100 + 10)/100;
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

/* brush icons */
$('#eraser').click(function() {
    canvasObj.setColor(255, 255, 255, 1);
    canvasObj.currentDrawMode = "eraser";

    $('.tool-active').removeClass('tool-active');
    $('#eraser').addClass('tool-active');
});

$('#pen').click(function() {
    //todo this function call is unnecessary
    canvasObj.setColor(canvasObj.colorComponents[RED].componentValue,
                       canvasObj.colorComponents[GREEN].componentValue,
                       canvasObj.colorComponents[BLUE].componentValue,
                       canvasObj.colorComponents[ALPHA].componentValue);
    canvasObj.currentDrawMode = "pen";

    $('.tool-active').removeClass('tool-active');
    $('#pen').addClass('tool-active');
});

// startup functions
$(document).ready(function () {
});
