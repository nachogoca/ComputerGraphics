
var gl;
var thetaLoc;
var theta;
var colorLoc;
var color = 0;
var rotationDirection = true;
var accelerationValue = .5;
var labelAcceleration;
var labelTheta;
var stop = true;


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
	var vertices = [vec2(-0.5, -0.5), vec2(0.5, -0.5), vec2(-0.5, 0.5), vec2(0.5, 0.5)];
	theta = 0.0;
	thetaLoc = gl.getUniformLocation (program, "theta");
    
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate our shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	// Associate the color variable with the shader
	
	colorLoc = gl.getUniformLocation (program, "color");
	
	// Set up event handler
    
    // Change color
	var colorButton = document.getElementById("ColorButton");
	colorButton.addEventListener("click", 
        function() { color = (color + 1 ) % 3});
       
    // Change direction
    var directonButton = document.getElementById("ThetaDirectionButton");
    directonButton.addEventListener("click",
        function() {
            rotationDirection = !rotationDirection;
        })
    
    // Stop rotation
    var stopButton = document.getElementById("StopRotation");
    stopButton.addEventListener("click",
        function() {
            stop = !stop;
        }
    )
    
    labelAcceleration = document.getElementById("AccelerationLabel");
    labelTheta = document.getElementById("ThetaLabel");
     
	render();
};


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );
    
    if(stop){
        delta = 0;
    } else {
        delta = (.01 * accelerationValue * theta) + .01;
    }
    
    
    if(rotationDirection){
        theta += delta;
    } else{
        theta -= delta;
    }
	
	gl.uniform1f (thetaLoc, theta);
    switch (color) {
        case 0:
            gl.uniform4fv (colorLoc, vec4(1.0, 0.0, 0.0, 1.0));
            break;
        case 1:
            gl.uniform4fv (colorLoc, vec4(0.0, 1.0, 0.0, 1.0));
            break;
        case 2:
            gl.uniform4fv (colorLoc, vec4(0.0, 0.0, 1.0, 1.0));
            break;
    }
    
    labelTheta.innerHTML = theta;
    labelAcceleration.innerHTML = accelerationValue;
    
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4);
	requestAnimFrame (render);
}
