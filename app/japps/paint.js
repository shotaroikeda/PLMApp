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

function ColorComponent(id, componentValue, maxval, delta) {
    this.classId = id;
    this.componentValue = typeof componentValue !== 'undefined' ? componentValue : 0;
    this.maxval = typeof maxval !== 'undefined' ? maxval : 255;
    this.delta = typeof delta !== 'undefined' ? delta : 1;
    this.plusId = this.classId+'-'+'plus';
    this.minusId = this.classId+'-'+'minus';
}

ColorComponent.prototype = {
    // stores ID of the class
    classId: "",
    plusId: "",
    minusId: "",
    maxval: 255,
    componentValue: 0,
    delta: 1,


    // Changes component value by a +1 or -1
    changeValue: function(change) {
        this.componentValue = Math.round((this.componentValue+change)*100)/100;
        if (this.componentValue < 0)
            this.componentValue = 0;
        else if (this.componentValue > this.maxval)
            this.componentValue = this.maxval;
        this.updateHTML();
    },
    // Manual number input; does NOT automatically update HTML value
    parseValue: function(val) {
        val = parseFloat(val);
        if (isNaN(val) || val < 0) val = 0;
        else if (val > this.maxval) val = this.maxval;
        this.componentValue = Math.round(val*100)/100;
    },
    // check if update value is necessary
    updateHTML: function() {
        $(this.classId).val(this.componentValue);
    },

    // Event listener functions
    buttonPlus: function() {
        console.log("delta"+this.delta);
        this.changeValue(this.delta);
    },
    buttonMinus: function() {
        this.changeValue(-this.delta);
    },
    inputFocusout: function() {
        this.parseValue($(this.classId)[0].value);
        this.updateHTML();
    },
    inputKeyup: function() {
        this.parseValue($(this.classId)[0].value);
    },


};

var canvasObj = {
    // object variables
    contextDOM: $('#mainCanvas')[0].getContext("2d"),
    penDown: false,
    //Valid draw modes: pen, eraser, bucket
    currentDrawMode: "pen",

    colorComponents: [
        new ColorComponent("#red"),
        new ColorComponent("#green"),
        new ColorComponent("#blue"),
        new ColorComponent("#alpha", 1, 1, 0.1)],

    __previous_coord__: [undefined, undefined],

    // Functions we don't want people using that much
    __defaultSettings__: function() {
        // Javascript pseudo constructor replacement
        this.contextDOM.canvas.width = window.innerWidth*.85;
        this.contextDOM.canvas.height = window.innerHeight - 50;

        this.contextDOM.strokeStyle = "black";
        this.contextDOM.lineJoin = "round";
        this.contextDOM.lineWidth = 5;

        this.__initEvents__();
    },

    __initEvents__: function() {
        _addColorEvents(RED);
        _addColorEvents(GREEN);
        _addColorEvents(BLUE);
        _addColorEvents(ALPHA);
	_addMouseEvents();
	_addButtonEvents();
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
        this.contextDOM.strokeStyle = 'rgba('+r+','+g+','+b+','+a+')';
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
    },

};


function _addColorEvents(color) {
    // pass by constant ex: RED, GREEN, BLUE, ALPHA
    var component = canvasObj.colorComponents[color];

    // Click + or - buttons
    $(component.minusId).on('click', function(){
        component.buttonMinus();
        canvasObj.applyRGBA();
    });
    $(component.plusId).on('click', function(){
        component.buttonPlus();
        canvasObj.applyRGBA();
    });

    // When text box goes out of focus, the value inside updates
    $(component.classId).on('focusout', function(){
        component.inputFocusout();
        canvasObj.applyRGBA();
    });
    // When keyup occurs, the value updates only in the script, not HTML
    $(component.classId).on('keyup', function(){
        component.inputKeyup();
        canvasObj.applyRGBA();
    });
};

function _addMouseEvents() {

    $('canvas').mousedown(function(e) {
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

};

function _addButtonEvents() {
    // Clear canvas
    $('#cls').click(function () {
        canvasObj.clearCanvas();
    });

    // Brush size events
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

    // Brush types
    $('#eraser').click(function() {
        canvasObj.setColor(255, 255, 255, 1);
        canvasObj.currentDrawMode = "eraser";
        $('.tool-active').removeClass('tool-active');
        $('#eraser').addClass('tool-active');
    });

    $('#pen').click(function() {
        //todo this function call is unnecessary
	canvasObj.applyRGBA();
        canvasObj.currentDrawMode = "pen";

        $('.tool-active').removeClass('tool-active');
        $('#pen').addClass('tool-active');
    });
};


canvasObj.__defaultSettings__();
// startup functions
$(document).ready(function () {
});


///////////////////////////////////
//         Mitsumi's Trash       //
///////////////////////////////////
$('#bucket').click(function() {
    canvasObj.setColor(canvasObj.colorComponents[RED].componentValue,
                       canvasObj.colorComponents[GREEN].componentValue,
                       canvasObj.colorComponents[BLUE].componentValue,
                       canvasObj.colorComponents[ALPHA].componentValue);
    canvasObj.currentDrawMode = "bucket";

    $('.tool-active').removeClass('tool-active');
    $('#bucket').addClass('tool-active');
});
$('#undo').click(function() {
    //TODO implement me
});
$('#redo').click(function() {
    //TODO implement me
});
//Convert colorspace RGB to XYZ
function rgb_to_xyz(rgb) {
    for (var i = RED; i <= BLUE; i++) {
        if (rgb[i] > 0.04045) {
            rgb[i] = Math.pow((rgb[i] + 0.055) / 1.055, 2.4);
        } else {
            rgb[i] /= 12.92;
        }
        rgb[i] *= 100;
    }

    x = rgb[RED] * 0.4124 + rgb[GREEN] * 0.3576 + rgb[BLUE] * 0.1805;
    y = rgb[RED] * 0.2126 + rgb[GREEN] * 0.7152 + rgb[BLUE] * 0.0722;
    z = rgb[RED] * 0.0193 + rgb[GREEN] * 0.1192 + rgb[BLUE] * 0.9505;

    return [x, y, z];
}

//convert colorspace XYZ to CIE-L*ab
function xyz_to_lab(xyz) {
    xyz[0] /= 95.047;
    xyz[1] /= 100.000;
    xyz[2] /= 108.883;

    for (var i = 0; i <= 3; i++) {
        if (xyz[i] > 0.008856) {
            xyz[i] = Math.pow(xyz[i], 1 / 3);
        } else {
            xyz[i] = (7.787 * xyz[i]) + (16 / 116);
        }
    }

    l = (116 * xyz[1]) - 16; 
    a = 500 * (xyz[0] - xyz[1]);
    b = 200 * (xyz[1] - xyz[2]);

    return [l, a, b];
}

//calculate deltaE between two CIE-L*ab colorspace values
function deltae(lab1, lab2) {
    dl = lab1[0] - lab2[0];
    da = lab1[1] - lab2[1];
    db = lab1[2] - lab2[2];

    return Math.sqrt(dl * dl + da * da + db * db);
}

//returns a decimal between 0 and 1 calculating the percent error between two numerical values
function calc_error(accepted, measured) {
    return (accepted - measured) / accepted;
}
