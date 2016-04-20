
var gl;
// Points and colors should be same length
var points;
var colors;

var ngonNumber = 5; //Change here

window.onload = function init()
{ 
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    
    // Compute the vertices of the n-gons
    var externalVertices;
    [ points, colors] = getVertices(ngonNumber);
    
    // Generate new array with the intermediate vertices, so rosettes are drawed
    
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, .8);
    
    
    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Create buffer objects, initialize them, and associate them with the
    // associated attribute variables in our vertex shader
    
    // Vertices
    var verticesBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, verticesBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    // Colors
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    render();
};

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINES, 0, points.length );
}

// This functions receives number of vertives and returns points in which they are located and the vertex color
function getVertices(ngonNumber) {
    vertices = [];
    colors = [];
    
    var currentPoint = vec2(0.0, .8)
    var angleOfRotation = (2 * Math.PI) / ngonNumber ; // Every time, the new point will be rotated this angle
    
    // Same values of rotation every time, doesn't make sense to repeat the calculation
    var cosineValue = Math.cos(angleOfRotation);
    var sineValue = Math.sin(angleOfRotation);
    
    for(var vertexIndex = 0; vertexIndex < ngonNumber; vertexIndex++){
        
        vertices.push(currentPoint);
        
        var newPoint = [];
        var newColor = vec4(HSVtoRGB(angleOfRotation * vertexIndex / (2 * Math.PI), 1, 1 ), 1);
        
        // Matrix transformation
        // X coordinate
        newPoint[0] = currentPoint[0] * cosineValue + currentPoint[1] * sineValue;
        
        // Y coordinate
        newPoint[1] = currentPoint[0] * (-sineValue) + currentPoint[1] * cosineValue;
        
        // Save generated point and update currentPoint
        
        colors.push(newColor);
        
        currentPoint = newPoint;
    }
    
    return [vertices, colors];
}

/*
This function  expects 0 <= h, s, v <= 1, if you're using degrees or radians, remember to divide them out.
The returned values are in a range 0 <= r, g, b <= 1 
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [r,g,b];
}