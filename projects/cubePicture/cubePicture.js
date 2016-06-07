

var canvas;
var gl;

var numVertices  = 36;

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

var roomWidth = 100;
var roomDepth = 150;
var roomHeight = 50;

var verticesFloor = [];

var vertexColors = [
        vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
        vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
        vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
        vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
        vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
        vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
        vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
        vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    ];

var texCoord = [
		vec2(0,0),
		vec2(0,1),
		vec2(1,1),
		vec2(1,0)
];

var near = -1;
var far = 100;
var radius = 1.0;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

///
// Camera
var aspect;

var eyeX = 0;
var eyeY = 50;
var eyeZ = 75;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;

//const at = vec3(0.0, 0.0, 0.0);
const at = vec3(50,0,-30);
const up = vec3(0.0, 1.0, 0.0);

// quad uses first index to set color for face

function quad(a, b, c, d) {
     pointsArray.push(verticesFloor[a]); 
     colorsArray.push(vertexColors[a]); 
	 texCoordsArray.push(texCoord[0]);
	 
     pointsArray.push(verticesFloor[b]); 
     colorsArray.push(vertexColors[a]); 
	 texCoordsArray.push(texCoord[1]);
	 
     pointsArray.push(verticesFloor[c]); 
     colorsArray.push(vertexColors[a]);    
	 texCoordsArray.push(texCoord[2]);
	 
     pointsArray.push(verticesFloor[a]); 
     colorsArray.push(vertexColors[a]); 
	 texCoordsArray.push(texCoord[0]);

     pointsArray.push(verticesFloor[c]); 
     colorsArray.push(vertexColors[a]); 
	 texCoordsArray.push(texCoord[2]);

     pointsArray.push(verticesFloor[d]); 
     colorsArray.push(vertexColors[a]); 
	 texCoordsArray.push(texCoord[3]);
}

// Each face determines two triangles

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);
    
    
    /// Initialize camera aspect ratio
    aspect = canvas.width / canvas.height;
    
    
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	// Set up texture map
	
	var texture = gl.createTexture();
	var image = new Image();
	image.src = "pyramid.gif";
	gl.bindTexture (gl.TEXTURE_2D, texture);
	gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
	
    initFloor();	  
    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
	gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	var tBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);
	
	var vTexCoord = gl.getAttribLocation (program, "vTexCoord");
	gl.vertexAttribPointer (vTexCoord, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vTexCoord);
 
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

// buttons to change viewing parameters

    document.getElementById("Button1").onclick = function(){near  *= 1.1; far *= 1.1;};
    document.getElementById("Button2").onclick = function(){near *= 0.9; far *= 0.9;};
    document.getElementById("Button3").onclick = function(){radius *= 1.1;};
    document.getElementById("Button4").onclick = function(){radius *= 0.9;};
    document.getElementById("Button5").onclick = function(){theta += dr;};
    document.getElementById("Button6").onclick = function(){theta -= dr;};
    document.getElementById("Button7").onclick = function(){phi += dr;};
    document.getElementById("Button8").onclick = function(){phi -= dr;};



    
    render();
}


var render = function() {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
        //eye = vec3(z, y, z);
        eye = vec3(eyeX, eyeY, radius*Math.cos(phi) + 30);

        modelViewMatrix = lookAt(eye, at , up); 
        //projectionMatrix = ortho(left, right, bottom, ytop, near, far);
        projectionMatrix = perspective (50.0, aspect, 1, 500);
        
        gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
        gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
            
        gl.drawArrays( gl.TRIANGLES, 0, numVertices );
        requestAnimFrame(render);
}

function initFloor(){

    verticesFloor = [
       vec4(0.0, -1.0, 0, 1.0),
       vec4(0.0, 0, 0, 1.0),
       vec4(roomWidth, 0, 0, 1.0),
       vec4(roomWidth, -1.0, 0, 1.0),
       vec4(0.0, -1.0, -roomDepth, 1.0),
       vec4(0.0, 0, -roomDepth, 1.0),
       vec4(roomWidth, 0, -roomDepth, 1.0),
       vec4(roomWidth, -1.0, -roomDepth, 1.0)
    ];
};