
var gl;
var thetaLoc;
var theta;
var phi;
var colors;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
	var vertices = [vec2(-0.05, 0.0), vec2(0.05, 0.0), vec2(-0.05, 0.5), vec2(0.05, 0.5), vec2(0.0, 0.7)];
    var vertivesSecondPointer = [vec2(-0.05, 0.0), vec2(0.05, 0.0), vec2(-0.05, 0.7), vec2(0.05, 0.7), vec2(0.0, 0.85)];
    var colors = [];
    for(var i = 0; i < 5; i++) colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    for(var i = 0; i < 5; i++) colors.push(vec4(0.0, 0.0, 1.0, 1.0));
    
	theta = 0.0;
    phi = 0.01;
	thetaLoc = gl.getUniformLocation (program, "theta");
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten( vertices.concat(vertivesSecondPointer)), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    
    // Color
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
    

    //setInterval (render, 30);
	render();
};


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );
	theta -= .005;
	gl.uniform1f (thetaLoc, theta);
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 5);
       
    phi -= .01;
    gl.uniform1f (thetaLoc, phi);
    gl.drawArrays( gl.TRIANGLE_STRIP, 5, 5);
	
	requestAnimFrame (render);
}
