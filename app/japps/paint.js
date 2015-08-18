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
    addPoint: function(x,y) {

    }

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
        this.componentValue = Math.round((this.componentValue + change) * 100) / 100;
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

    //simulates paint bucket tool and fills pixels with certain threshold
    fill: function(mousex, mousey) {
        //obtain image metadata
        var dim = [this.contextDOM.canvas.width, this.contextDOM.canvas.height];
        var imgdata = this.contextDOM.getImageData(0, 0, dim[0], dim[1]);

        //color to fill
        var fill_color = [];
        for (var i = RED; i <= ALPHA; i++) {
            fill_color.push(this.colorComponents[i].componentValue);
        }
        fill_color[3] *= 255;

        console.log("Fill color: " + fill_color);

        var data_coord = this.convert_coordinate_space(mousex, mousey);
        var start_color = this.get_rgba(data_coord, imgdata);

        console.log("Start color: " + start_color);

        //10% error
        var threshold = 30;

        var queue = [[mousex, mousey]];

        while (queue.length > 0) {
            var current_coord = queue.shift();
            var x = current_coord[0];
            var y = current_coord[1];

            //FIXME
            //this should be a bug considering we run --x first, data_coord should reflect that change too by
            //doing data_corod -= 4 after we set it above on currently line 241, but it causes a crash
            data_coord = this.convert_coordinate_space(x, y) - 4;
            //shift far left
            while (this.inbound(--x, y) && this.within_threshold(start_color, this.get_rgba(data_coord, imgdata), threshold)) {
                data_coord -= 4;
            }
            //shift back
            data_coord += 4;
            x++;

            while (this.inbound(x++, y) && this.within_threshold(start_color, this.get_rgba(data_coord, imgdata), threshold)) {
                //color pixel
                this.set_rgba(data_coord, fill_color, imgdata);

                var delta = [-1, 1];
                //keep track of if we checked above/below to add or not add pixel to the queue
                var checked = [false, false];
                for (var delta_counter = 0; delta_counter < 2; delta_counter++) {
                    if (this.inbound(x, y + delta[delta_counter])) {
                        if (this.within_threshold(start_color, this.get_rgba(data_coord + delta[delta_counter] * 4 * dim[1], imgdata), threshold)) {
                            if (!checked[delta_counter]) {
                                queue.push([x, y + delta[delta_counter]]);
                                checked[delta_counter] = true;
                            }
                        } else {
                            checked[delta_counter] = false;
                        }
                    }
                }

                //shift data coordinate by 4
                data_coord += 4;
            }
        }
        this.contextDOM.putImageData(imgdata, 0, 0);
        console.log("Filled");
    },

    inbound: function(x, y) {
        if (x < 0 || y < 0) return false;
        return x < this.contextDOM.canvas.width && y < this.contextDOM.canvas.height;
    },

    get_rgba: function(data_coord, imgdata) {
        var color = [];
        for (var i = 0; i < 4; i++) {
            color.push(imgdata.data[data_coord + i]);
        }
        return color;
    },

    set_rgba: function(data_coord, fill_color, imgdata) {
        for (var i = 0; i < 4; i++) {
            imgdata.data[data_coord + i] = fill_color[i];
        }
    },

    /*
        @return
            returns the index of the coordinate when converted from a 2d space to a 1d space
    */
    convert_coordinate_space: function(x, y) {
        return (x + y * this.contextDOM.canvas.width) * 4;
    },

    //checks if 2 colors are similar enough within a certain percentage
    within_threshold: function(color1, color2, threshold) {
        var lab1 = this.xyz_to_lab(this.rgb_to_xyz(color1));
        var lab2 = this.xyz_to_lab(this.rgb_to_xyz(color2));

        return this.deltae(lab1, lab2) <= threshold;
    },

    //Convert colorspace RGB to XYZ
    rgb_to_xyz: function(rgb) {
        for (var i = RED; i <= BLUE; i++) {
            rgb[i] /= 255;

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
    },

    //convert colorspace XYZ to CIE-L*ab
    xyz_to_lab: function(xyz) {
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
    },

    //calculate deltaE between two CIE-L*ab colorspace values
    deltae: function(lab1, lab2) {
        dl = lab2[0] - lab1[0];
        da = lab2[1] - lab1[1];
        db = lab2[2] - lab1[2];

        var e = Math.sqrt(dl * dl + da * da + db * db);
        //console.log("E: " + e); //DEBUG
        return e;
    },

    //returns a decimal between 0 and 1 calculating the percent error between two numerical values
    calc_error: function(accepted, measured) {
        return Math.abs(accepted - measured) / accepted;
    }
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
            canvasObj.fill(mouseX, mouseY);
        }
    });

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

// startup functions
$(document).ready(function () {
    canvasObj.__constructor__();
});
