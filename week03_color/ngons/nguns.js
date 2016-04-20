
var gl;
var points;

var ngonNumber = 1000; //Change here

window.onload = function init()
{ 
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // Compute the vertices of the n-gons
    points = getNGonVertices(ngonNumber);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, .8);
    
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
    gl.drawArrays( gl.LINE_LOOP, 0, points.length ); // LINE_LOOP connects also end point with start point
}

// This functions receives number of vertives and returns points in which they are located.
function getNGonVertices(ngonNumber) {
    vertices = [];
    
    var currentPoint = vec2(0.0, .8)
    var angleOfRotation = (2 * Math.PI) / ngonNumber ; // Every time, the new point will be rotated this angle
    
    // Same values of rotation every time, doesn't make sense to repeat the calculation
    var cosineValue = Math.cos(angleOfRotation);
    var sineValue = Math.sin(angleOfRotation);
    
    for(var vertexIndex = 0; vertexIndex < ngonNumber; vertexIndex++){
        
        var newPoint = [];
        
        // Matrix transformation
        // X coordinate
        newPoint[0] = currentPoint[0] * cosineValue + currentPoint[1] * sineValue;
        
        // Y coordinate
        newPoint[1] = currentPoint[0] * (-sineValue) + currentPoint[1] * cosineValue;
        
        // Save generated point and update currentPoint
        vertices.push(newPoint);
        currentPoint = newPoint;
    }
    
    return vertices;
}