

var canvas;
var gl;

var numVerticesRectangularGeometry  = 36;

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

// Delta value
var dr = 10;

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

// Look at the center of the floor.
// Last element is negative because the floor is in negative coordinates of z
const at = vec3(roomWidth / 2.0 , 0 , - (roomDepth / 2));
const up = vec3(0.0, 1.0, 0.0);


//// SPHERE
var numTimesToSubdivide = 3;
var sphereVerticesIndex = 0;

var normalsArray = [];
////


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

function colorCube() {
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
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
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
	image.src = "wood_floor.jpg";
	gl.bindTexture (gl.TEXTURE_2D, texture);
	gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
	gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
	
    initFloor();	  
    colorCube();
    
    initSphere();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );
    
    var vColor = gl.getAttribLocation( program, "vColor" );
	gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor);

    // Array that contains normals of the triangles that constitue the sphere
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);
    
    

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

    // Configure buttons to change viewing parameters
    document.getElementById("Button1").onclick = function(){eyeX += dr;};
    document.getElementById("Button2").onclick = function(){eyeX -= dr;};
    document.getElementById("Button3").onclick = function(){eyeY += dr;};
    document.getElementById("Button4").onclick = function(){eyeY -= dr;};
    document.getElementById("Button5").onclick = function(){eyeZ += dr;};
    document.getElementById("Button6").onclick = function(){eyeZ -= dr;};
    document.getElementById("Button7").onclick = function(){
        
        console.log('Points array: ' + pointsArray.length);
        console.log('Colors array: ' + colorsArray.length);
        console.log('Texture array: ' + texCoordsArray.length);
        console.log('Normals array: ' + normalsArray.length);
    }
    
    
    render();
}


var render = function() {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
        eye = vec3(eyeX, eyeY, eyeZ);

        modelViewMatrix = lookAt(eye, at , up); 
        projectionMatrix = perspective (50.0, aspect, 1, 500);
        
        gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
        gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
            
        gl.drawArrays( gl.TRIANGLES, 0, numVerticesRectangularGeometry );
        requestAnimFrame(render);
}

// Floor initialization
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


////////
// SPHERE
////////
function initSphere(){
    
    var va = vec4(0.0, 0.0, -1.0,1);
    var vb = vec4(0.0, 0.942809, 0.333333, 1);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
    var vd = vec4(0.816497, -0.471405, 0.333333,1);
    
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
}

////
//// Aux functions to generate sphere
////

// Last step of recursive algorithm,
// Adds the final vertives to pointsArray 
// and the triangle normal to normalsArray
function triangle(a, b, c) {

     var t1 = subtract(b, a);
     var t2 = subtract(c, a);
     var normal = normalize(cross(t2, t1));
     normal = vec4(normal);


     normalsArray.push(normal);
     normalsArray.push(normal);
     normalsArray.push(normal);
  /*   
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);
*/
     sphereVerticesIndex += 3;
}

// Recursive algorithm to generate the sphere. 
function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { 
        triangle( a, b, c );
    }
}

// Start of recursive algorithm to generate sphere.
// Parameters are the four vertex and number n of recursive steps
function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}