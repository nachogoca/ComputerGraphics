

var canvas;
var gl;

// Number of vertices used to create the floor
var numVerticesRectangularGeometry  = 36;
var numVerticesBed = 0;

var pointsArray = [];
var colorsArray = [];
var texCoordsArray = [];

// Floor dimmensions
var roomWidth = 20;
var roomDepth = 40;
var roomHeight = 10;

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
var eyeY = 12;
var eyeZ = 25;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;



//// SPHERE
var numTimesToSubdivide = 3;
var sphereVerticesIndex = 0;

var normalsArray = [];
////



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
    
    initBed( 1.0 , -3.0);
    
    initSphere(50);

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
        
        // Look at the center of the floor.
        // Last element is negative because the floor is in negative coordinates of z
        //var at = vec3(roomWidth / 2.0 , 0 , - (roomDepth / 2));
        var at = vec3(0.0, 0.0, 0.0);
        var up = vec3(0.0, 1.0, 0.0);
        var eye = vec3(eyeX, eyeY, eyeZ);

        modelViewMatrix = lookAt(eye, at , up); 
        projectionMatrix = perspective (50.0, aspect, 1, 500);
        
        gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
        gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
            
        gl.drawArrays( gl.TRIANGLES, 0, numVerticesRectangularGeometry + sphereVerticesIndex + numVerticesBed);
        requestAnimFrame(render);
}



////////
// SPHERE
////////
function initSphere(offset){
    
    var va = vec4(0.0 * offset, 0.0 * offset, -1.0 * offset, 1.0);
    var vb = vec4(0.0 * offset, 0.942809 * offset, 0.333333 * offset, 1.0);
    var vc = vec4(-0.816497 * offset, -0.471405 * offset , 0.333333 * offset, 1.0);
    var vd = vec4(0.816497 * offset, -0.471405 * offset , 0.333333 * offset, 1.0);
    
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


     //normalsArray.push(normal);
     //normalsArray.push(normal);
     //normalsArray.push(normal);
     
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);

     var randomColor = vec4(Math.random(), Math.random(), Math.random(), 1.0);

     colorsArray.push( randomColor );
     colorsArray.push( randomColor );
     colorsArray.push( randomColor );
     
     texCoordsArray.push(texCoord[0]);
     texCoordsArray.push(texCoord[1]);
     texCoordsArray.push(texCoord[2]);

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


/// Floor

// Floor initialization
function initFloor(){

    verticesFloor = [
       vec4( - roomWidth / 2.0, -2.0, 0, 1.0),
       vec4( - roomWidth / 2.0, -1.0, 0, 1.0),
       vec4(   roomWidth / 2.0, -1.0, 0, 1.0),
       vec4(   roomWidth / 2.0, -2.0, 0, 1.0),
       vec4( - roomWidth / 2.0, -2.0, -roomDepth, 1.0),
       vec4( - roomWidth / 2.0, -1.0, -roomDepth, 1.0),
       vec4(   roomWidth / 2.0, -1.0, -roomDepth, 1.0),
       vec4(   roomWidth / 2.0, -2.0, -roomDepth, 1.0)
    ];
};


// quad uses first index to set color for face

function quad(a, b, c, d) {
     pointsArray.push(verticesFloor[a]); 
     colorsArray.push( vec4(0.0, 0.0, 0.0, 0.0) ); 
	 texCoordsArray.push(texCoord[0]);
	 
     pointsArray.push(verticesFloor[b]); 
     colorsArray.push( vec4(0.0, 0.0, 0.0, 0.0) ); 
	 texCoordsArray.push(texCoord[1]);
	 
     pointsArray.push(verticesFloor[c]); 
     colorsArray.push( vec4(0.0, 0.0, 0.0, 0.0) );   
	 texCoordsArray.push(texCoord[2]);
	 
     pointsArray.push(verticesFloor[a]); 
     colorsArray.push( vec4(0.0, 0.0, 0.0, 0.0) ); 
	 texCoordsArray.push(texCoord[0]);

     pointsArray.push(verticesFloor[c]); 
     colorsArray.push( vec4(0.0, 0.0, 0.0, 0.0) ); 
	 texCoordsArray.push(texCoord[2]);

     pointsArray.push(verticesFloor[d]); 
     colorsArray.push( vec4(0.0, 0.0, 0.0, 0.0) ); 
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

///// Bed

// Initialize array that represents the wood parts of the bed. 
//It contains the vertices of all the rectangular prismas that represent each of the parts of the bed.
function initBed(horizontalOrigin, depthOrigin) {

	// Initialize Bed units
	var horizontalUnit = (roomWidth - horizontalOrigin) / 15.0;
	var depthUnit = (roomDepth - depthOrigin) / 25.0;
	var heightUnit = (roomHeight / 2.0) / 10.0;	
	
    initFootLeg1(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit);
    initFootLeg2(horizontalOrigin, depthOrigin,horizontalUnit, depthUnit, heightUnit);
    initFootLeg3(horizontalOrigin,depthOrigin,horizontalUnit, depthUnit, heightUnit);
    initFootLeg4(horizontalOrigin,depthOrigin,horizontalUnit, depthUnit, heightUnit);
    
    initBedPart1(horizontalOrigin,depthOrigin,horizontalUnit, depthUnit, heightUnit);
    initBedPart2(horizontalOrigin,depthOrigin,horizontalUnit, depthUnit, heightUnit);
    initBedPart3(horizontalOrigin,depthOrigin,horizontalUnit, depthUnit, heightUnit);
    initBedPart4(horizontalOrigin,depthOrigin,horizontalUnit, depthUnit, heightUnit);

    initMattress(horizontalOrigin,depthOrigin,horizontalUnit, depthUnit, heightUnit);

}

function initFootLeg1(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var footLeg1 = [
		vec4(horizontalOrigin, 						0, 				depthOrigin, 1.0),
		vec4(horizontalOrigin, 						8 * heightUnit,	depthOrigin, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 8 * heightUnit, depthOrigin, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 0, 				depthOrigin, 1.0),
		vec4(horizontalOrigin, 						0, 				depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						8 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 8 * heightUnit, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 0, 				depthOrigin - 1 * depthUnit, 1.0)
	];
    
    insertBedPart(footLeg1, true); 
}

function initFootLeg2(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    	
	var footLeg2 = [
		vec4(horizontalOrigin + 4 * horizontalUnit, 0, 				depthOrigin, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 8 * heightUnit, depthOrigin, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 8 * heightUnit, depthOrigin, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 0, 				depthOrigin, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 0, 				depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 8 * heightUnit, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 8 * heightUnit, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 0, 				depthOrigin - 1 * depthUnit, 1.0)
	];
    
    insertBedPart(footLeg2, true); 
}

function initFootLeg3(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var footLeg3 = [
		vec4(horizontalOrigin, 						0, 				depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						8 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 8 * heightUnit, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 0, 				depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin,						0, 				depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						8 * heightUnit, depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 8 * heightUnit, depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 0, 				depthOrigin - 11 * depthUnit, 1.0)
	];
    
    insertBedPart(footLeg3, true); 
}

function initFootLeg4(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var footLeg4 = [
		vec4(horizontalOrigin + 4 * horizontalUnit, 0, 				depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 8 * heightUnit, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 8 * heightUnit, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 0, 				depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 0, 				depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 8 * heightUnit, depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 8 * heightUnit, depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 0, 				depthOrigin - 11 * depthUnit, 1.0)
	];
    
    insertBedPart(footLeg4, true); 
}

function initBedPart1(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var bedPart1 = [
		vec4(horizontalOrigin, 						1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						3 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 3 * heightUnit, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						3 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 3 * heightUnit, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit, 1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0)
	]
    
    insertBedPart(bedPart1, true); 
}

function initBedPart2(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var bedPart2 = [
		vec4(horizontalOrigin + 4 * horizontalUnit,	1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit,	3 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 3 * heightUnit, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit,	1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit,	3 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 3 * heightUnit, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0)
	]
    
    insertBedPart(bedPart2, true); 
}

function initBedPart3(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var bedPart3 = [
		vec4(horizontalOrigin + 1 * horizontalUnit,	1 * heightUnit,	depthOrigin - 0 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit,	3 * heightUnit,	depthOrigin - 0 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 3 * heightUnit, depthOrigin - 0 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 1 * heightUnit,	depthOrigin - 0 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit,	1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit,	3 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 3 * heightUnit, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0)
	]
    
    insertBedPart(bedPart3, true); 
}

function initBedPart4(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var bedPart4 = [
		vec4(horizontalOrigin + 1 * horizontalUnit,	1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit,	3 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 3 * heightUnit, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit,	1 * heightUnit,	depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 1 * horizontalUnit,	3 * heightUnit,	depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 3 * heightUnit, depthOrigin - 11 * depthUnit, 1.0),
		vec4(horizontalOrigin + 4 * horizontalUnit, 1 * heightUnit,	depthOrigin - 11 * depthUnit, 1.0)
	]
    
    insertBedPart(bedPart4, true); 
}

function initMattress(horizontalOrigin,depthOrigin, horizontalUnit, depthUnit, heightUnit){
    var mattressVertices = [
		vec4(horizontalOrigin, 						1 * heightUnit + 1,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						5 * heightUnit + 1,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 5 * heightUnit + 1, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 1 * heightUnit + 1,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						1 * heightUnit + 1,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						5 * heightUnit + 1,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 5 * heightUnit + 1, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 1 * heightUnit  +1,	depthOrigin - 10 * depthUnit, 1.0)
	];
    
    insertBedPart(mattressVertices, false); 
}

function insertBedPart(bedPart, isMadeOfWood){
    insertBedPartFace( bedPart, isMadeOfWood, 1, 0, 3, 2 );
    insertBedPartFace( bedPart, isMadeOfWood, 2, 3, 7, 6 );
    insertBedPartFace( bedPart, isMadeOfWood, 3, 0, 4, 7 );
    insertBedPartFace( bedPart, isMadeOfWood, 6, 5, 1, 2 );
    insertBedPartFace( bedPart, isMadeOfWood, 4, 5, 6, 7 );
    insertBedPartFace( bedPart, isMadeOfWood, 5, 4, 0, 1 );
}

// Insert geometry and colors of bed face, in the appropiate order for webgl.
function insertBedPartFace(bedPart, isMadeOfWood, vertexA, vertexB, vertexC, vertexD) {
     var numVertices = 6;
     
     pointsArray.push( bedPart[ vertexA ] ); 
	 texCoordsArray.push(texCoord[0]);
	 
     pointsArray.push( bedPart[ vertexB ]); 
	 texCoordsArray.push(texCoord[1]);
	 
     pointsArray.push( bedPart[ vertexC ]); 
	 texCoordsArray.push(texCoord[2]);
	 
     pointsArray.push( bedPart[ vertexA ]); 
	 texCoordsArray.push(texCoord[0]);

     pointsArray.push( bedPart[vertexC ]); 
	 texCoordsArray.push(texCoord[2]);

     pointsArray.push( bedPart[ vertexD ]); 
	 texCoordsArray.push(texCoord[3]);
    
     numVerticesBed += numVertices;
    
    // Add color
     var brownColor = vec4( 0.6, 0.3, 0.0, 1.0 );
     var beigeColor = vec4( 0.96, 0.96, 0.86, 1.0 ); 
     
     if( isMadeOfWood )
        addColor( numVertices, brownColor );
     else
        addColor( numVertices, beigeColor );
     
     
}

// Adds colors 'color' 'numTimes' times to the color array.
function addColor(numTimes, color) {
    for( var i = 0; i < numTimes; i++) {
        colorsArray.push(color);
    }   
}
