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

//Valid draw modes: pen, eraser, bucket
const PEN = "pen";
const ERASER = "eraser";
const BUCKET = "bucket";

// Point object
function Point(x, y) {
    this.x = x;
    this.y = y;
};

Point.prototype = {
    setPoint: function(x, y) {
        this.x = x;
        this.y = y;
    }
};

// Drawable base class
function Drawable(dom) {
    this.dom = dom;
    this.points = [];
};

Drawable.prototype = {
    addPoint: function(x,y)

};


// Line class
function Line(dom) {
    Drawable.apply(this, dom);
    
    this.dom = dom;
    this.size = dom.lineWidth;
    this.color = dom.strokeStyle;
    this.style = dom.lineJoin;
    this.points = [];
    
};

Line.prototype = {
    draw: function() {
        if (this.points.length === 0) return;
	
	this.dom.strokeStyle = this.color;
	this.dom.lineWidth = this.size;
	this.dom.lineJoin = this.style;
	this.dom.lineCap = this.style;
        this.dom.beginPath();
        //this.dom.moveTo(this.points[0].x, this.points[0].y);
        for (var i = 1; i < this.points.length; ++i) {
	    this.dom.moveTo(this.points[i-1].x,this.points[i-1].y)
            this.dom.lineTo(this.points[i].x, this.points[i].y);
        }
        this.dom.closePath();
        this.dom.stroke();
    },
    addPoint: function(x,y) {
        this.points.push(new Point(x,y));
    }
};

// Color Component class
function ColorComponent(id, componentValue, maxval, delta) {
    // stores ID of the class
    this.classId = id;
    this.plusId = this.classId+'-'+'plus';
    this.minusId = this.classId+'-'+'minus';

    this.componentValue = typeof componentValue !== 'undefined' ? componentValue : 0;
    this.maxval = typeof maxval !== 'undefined' ? maxval : 255;
    this.delta = typeof delta !== 'undefined' ? delta : 1;
};

ColorComponent.prototype = {
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
    // Check if update value is necessary
    updateHTML: function() {
        $(this.classId).val(this.componentValue);
    },

    /* Event listener functions */
    // Increment value; + button
    buttonPlus: function() {
        this.changeValue(this.delta);
    },
    // Decrement value; - button
    buttonMinus: function() {
        this.changeValue(-this.delta);
    },
    // Unfocus on input box to apply change; updates HTML
    inputFocusout: function() {
        this.parseValue($(this.classId)[0].value);
        this.updateHTML();
    },
    // Key input in input box to apply change; does NOT update HTML
    inputKeyup: function() {
        this.parseValue($(this.classId)[0].value);
    },
};

var canvasObj = {
    /* Setup functions
     * all member variables are in the constructor
     */

    // NOTE: I can't seem to get function CanvasObj() and CanvasObj.prototype to work well
    // This is the best substitute I have so far.
    __constructor__: function() {
        /* Object Varibles */
        this.contextDOM =  $('#mainCanvas')[0].getContext("2d");
        // Window: width is .85 because of column, height - 50 for navbar
        this.contextDOM.canvas.width = window.innerWidth*.85;
        this.contextDOM.canvas.height = window.innerHeight - 50;

        // TODO: different lineJoin for different tools
        this.contextDOM.strokeStyle = "black";
        this.contextDOM.lineJoin = "round";
        this.contextDOM.lineWidth = 5;

        this.currentDrawMode = PEN;
        this.penDown = false,
        this.__previous_coord__ = [undefined, undefined],
        this.colorComponents = [
            new ColorComponent("#red"),
            new ColorComponent("#green"),
            new ColorComponent("#blue"),
            new ColorComponent("#alpha", 1, 1, 0.1)
        ];

        // Holds all shapes for undo and redo
        this.shapes = [];

        // Initialize event listeners
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

    /* Public member functions */
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
        this.contextDOM.strokeStyle = 'rgba(' + [r, g, b, a].join(',') + ')';
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

    /*
    old_draw: function(x, y, drag) {
        this.contextDOM.beginPath();

        if (drag) {
            var prevX = this.__previous_coord__[0];
            var prevY = this.__previous_coord__[1];
            this.contextDOM.moveTo(prevX, prevY);
        } else {
            this.contextDOM.moveTo(x - 1, y);
        }
        this.__previous_coord__ = [x, y];

        this.contextDOM.lineTo(x, y);
        this.contextDOM.closePath();
        this.contextDOM.stroke();
    },
    */
    
    draw: function(x, y, drag) {
        if (drag && this.shapes.length-1 >= 0) {
	    var currLine = this.shapes[this.shapes.length-1];
	    currLine.addPoint(x,y);
        } else {
	    var newLine = new Line(this.contextDOM);
	    newLine.addPoint(x,y);
            this.shapes.push(newLine);
        }
	this.clearCanvas();
	for (var i = 0; i < this.shapes.length; ++i) {
	    this.shapes[i].draw();
	}
	


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
    $(component.classId).on('focusout', function() {
        component.inputFocusout();
        canvasObj.applyRGBA();
    });
    // When keyup occurs, the value updates only in the script, not HTML
    $(component.classId).on('keyup', function() {
        component.inputKeyup();
        canvasObj.applyRGBA();
    });
};

function arrayColorCompare(arr1, arr2) {
    for (var i=0;i < arr1.length;i++) {
        if (arr1[i] != arr2[i]) {
            return false;
        }
    }

    return true;
}

function _addMouseEvents() {

    $('canvas').mousedown(function(e) {
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;
        if (canvasObj.currentDrawMode == "pen" || canvasObj.currentDrawMode == "eraser") {
            canvasObj.penDown = true;
            canvasObj.draw(mouseX, mouseY, false);
        } else if (canvasObj.currentDrawMode == "bucket") {
            /* WARNING:
               Currently uses pixel by pixel filling which is apparently slower vs filling in a
               rectangle of a larger area.

               There is definitely room for opimization here.

               Right now this list is in order of percent of time taken of operation
               (ie. biggest bottlenecks)

               1. The queue is filled up very quickly. Might want to check for adjacent pixels
               before checking instead of vice versa (current implementation)

               2. fillRect() is slow. however it seems like putImageData() does not work(?)
               obtaining pixel data for point is inefficent as it creates the whole object rather than
               just pixel data.

               3. Implementation itself might not be that great. See https://en.wikipedia.org/wiki/Flood_fill
               for more ideas (right now this uses most simple one)
            */
            queue = [];
            queue.push([mouseX, mouseY]);
            pointer_pixel_data = canvasObj.contextDOM.getImageData(mouseX, mouseY, 1, 1);
            fill_color = [parseInt($('#red')[0].value), parseInt($('#green')[0].value),
                          parseInt($('#blue')[0].value), parseInt($('#alpha')[0].value)];

            while (queue.length > 0) {
                current_point = queue.shift();
                current_pixel_data = canvasObj.contextDOM.
                    getImageData(current_point[0], current_point[1], 1, 1);

                if (arrayColorCompare(current_pixel_data.data, pointer_pixel_data.data)) {
                    // Add ajacent pixels to queue, check later
                    curr_x = current_point[0];
                    curr_y = current_point[1];
                    if (canvasObj.contextDOM.canvas.width >= (curr_x+1)) {
                        queue.push([curr_x+1, curr_y]);
                    }

                    if (canvasObj.contextDOM.canvas.height >= (curr_y+1)) {
                        queue.push([curr_x, curr_y+1]);
                    }

                    if ((curr_x-1) >= 0) {
                        queue.push([curr_x-1, curr_y]);
                    }

                    if ((curr_y-1) >= 0) {
                        queue.push([curr_x, curr_y-1]);
                    }

                    current_pixel_data.data[RED] = fill_color[RED];
                    current_pixel_data.data[GREEN] = fill_color[GREEN];
                    current_pixel_data.data[BLUE] = fill_color[BLUE];
                    current_pixel_data.data[ALPHA] = fill_color[ALPHA];

                    canvasObj.contextDOM.fillRect(curr_x, curr_y, 1, 1);
                    //TODO finish me
                    // right now it's so inefficent it crashes
                }
            }
        }});

    $('canvas').mousemove(function(e) {
        var mouseX = e.pageX - this.offsetLeft;
        var mouseY = e.pageY - this.offsetTop;
        if((canvasObj.currentDrawMode == "pen" || canvasObj.currentDrawMode == "eraser") &&
           canvasObj.penDown) {
            canvasObj.draw(mouseX, mouseY, true);
        }
    });

    $('canvas').mouseup(function(e) {
        canvasObj.penDown = false;
        if (canvasObj.currentDrawMode == "pen" || canvasObj.currentDrawMode == "eraser") {
            canvasObj.penDown = false;
        }
    });

    $('canvas').mouseleave(function(e) {
        canvasObj.penDown = false;
        if (canvasObj.currentDrawMode == "pen" || canvasObj.currentDrawMode == "eraser") {
            canvasObj.penDown = false;
        }
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
        canvasObj.applyRGBA();
        canvasObj.currentDrawMode = "pen";

        $('.tool-active').removeClass('tool-active');
        $('#pen').addClass('tool-active');
    });

    $('#bucket').click(function() {
        canvasObj.applyRGBA();
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
};


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




// startup functions
$(document).ready(function () {
    canvasObj.__constructor__();
});
