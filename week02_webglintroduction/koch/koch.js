
var gl;
var points;
var Nrand, GaussAdd, GaussFac;

var NumPoints = 300;
var recursionLimit = 2;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Initialize initial points
	var initial_point_1 = vec2 (-1.0, 0.0);
    var initial_point_2 = vec2 (1.0,0.0);
    
	points = [ initial_point_1 ];
    addPoints(initial_point_1, 2.0, 0, 0, points);
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( .6, 0.7, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINE_STRIP, 0, points.length );
}


function addPoints(initialPoint, currentDistance, currentAngle, recursionLevel, pointList){
    // Recursion stop condition
    if (recursionLevel == recursionLimit) return pointList;
    
    //console.log("Initial Point: " + initialPoint + ", Current Distance: " + currentDistance
      //         + ", Recursion level: " + recursionLevel);
    
    //Generate points
    
    // First section
    addPoints(initialPoint, currentDistance / 3.0, currentAngle, recursionLevel + 1, pointList);
    var nextPoint1 = getNextPoint(initialPoint, currentDistance / 3.0, currentAngle);
    pointList.push(nextPoint1);    
    
    // Second section
    addPoints(nextPoint1, currentDistance / 3.0, currentAngle + (Math.PI / 3), recursionLevel + 1, pointList);
    var nextPoint2 = getNextPoint(nextPoint1, currentDistance / 3.0, currentAngle + (Math.PI / 3));
    pointList.push(nextPoint2);
    
    // Third section
    addPoints(nextPoint2, currentDistance / 3.0, currentAngle - (Math.PI / 3), recursionLevel + 1, pointList);
    var nextPoint3 = getNextPoint(nextPoint2, currentDistance / 3.0, currentAngle  - (Math.PI / 3));
    pointList.push(nextPoint3);
    
    // Fourth section
    addPoints(nextPoint3, currentDistance / 3.0, currentAngle, recursionLevel + 1, pointList);
    var nextPoint4 = getNextPoint(nextPoint3, currentDistance / 3.0, currentAngle);
    pointList.push(nextPoint4);
}

function getNextPoint (currentPoint, currentLength, currentAngle) {
    
    // Calculate horizontal and vertical lenght
    horizontalDisplacement = currentLength * Math.cos(currentAngle);
    verticalDisplacement = currentLength * Math.sin(currentAngle);
    
    // New point is defined by the previous point plus the displacements
    var nextPoint = vec2 (currentPoint[0] + horizontalDisplacement,
                         currentPoint[1] + verticalDisplacement);
    
    return nextPoint;
}

function InitGauss () {
	Nrand = 4;
	GaussAdd = Math.sqrt (3.0 * Nrand);
	GaussFac = 2.0 * GaussAdd / Nrand;
}
	
function Gauss () {
	var sum = 0;
	for (var i=0; i<Nrand; i++) {
		sum += Math.random();
	}
	return GaussFac * sum - GaussAdd;
}

