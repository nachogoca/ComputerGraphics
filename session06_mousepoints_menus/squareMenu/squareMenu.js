
var gl;
var thetaLoc;
var theta;
var colorLoc;
var color;
var speedFactor;

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
	color = vec4 (1.0, 0.0, 0.0, 1.0);
	colorLoc = gl.getUniformLocation (program, "color");
    
	// Initialize speed factor
	speedFactor = 1;
	
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	// Add the event listener for the color menu
	
	var menu = document.getElementById ("colorMenu");
	menu.addEventListener ("click", function () {
	   switch (menu.selectedIndex) {
	      case 0:
		     color = vec4 (1.0, 0.0, 0.0, 1.0);
			 break;
		  case 1:
		     color = vec4 (0.0, 1.0, 0.0, 1.0);
			 break;
		  case 2:
			 color = vec4 (0.0, 0.0, 1.0, 1.0);
			 break;
		  case 3:
		     color = vec4 (0.0, 0.0, 0.0, 1.0);
			 break;
		}
	})
	
	// Add the event listener for the speed menu
	var speedMenu = document.getElementById( "speedMenu" );
	speedMenu.addEventListener( "click", function() {
		switch( speedMenu.selectedIndex ) {
			case 0: 
				speedFactor = 0;
				break;
			case 1: 	
				speedFactor = 1;
				break;
			case 2:
				speedFactor = 2;
				break;
			case 3:
				speedFactor = 3;
				break;
		}
		
	})

 	render();
};


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT );
	theta += (0.01 * speedFactor);
	gl.uniform1f (thetaLoc, theta);
	gl.uniform4fv (colorLoc, color);
	gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4);
	requestAnimFrame (render);
}
