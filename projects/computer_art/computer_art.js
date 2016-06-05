
var canvas;
var gl;
var colorLoc;
var modelViewLoc;
var projectionLoc;

var vertices = [];
var colors = [];
var indices = [];
var c = [];
var s = [];

var cubeSize = 10;
var cubeSize2 = cubeSize / 2.0;
var windowMin = -cubeSize2;
var windowMax = cubeSize + cubeSize2;

var roomWidth = 100;
var roomDepth = 150;
var roomHeight = 50;

var numberOfPrims = 10;

var projection;
var modelView;
var aspect;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

	// Load vertices and colors for the room floor
	
	// Floor dimensions
	// Height [-1.0, 0.0]
	// Width = [0, roomWidth]
	// Depth = [0, roomDepth]
	
	var verticesFloor = [
	   vec4(0.0, -1.0, 0, 1.0),
	   vec4(0.0, 0, 0, 1.0),
	   vec4(roomWidth, 0, 0, 1.0),
	   vec4(roomWidth, -1.0, 0, 1.0),
	   vec4(0.0, -1.0, -roomDepth, 1.0),
	   vec4(0.0, 0, -roomDepth, 1.0),
	   vec4(roomWidth, 0, -roomDepth, 1.0),
	   vec4(roomWidth, -1.0, -roomDepth, 1.0)
	];
	
	 colors = [
	    vec4(1.0, 0.0, 0.0, 1.0),  // red
		vec4(1.0, 1.0, 0.0, 1.0),  // yellow
		vec4(0.0, 1.0, 0.0, 1.0),  // green
		vec4(.25, 0.12 ,.23, .9),  // blue
		vec4(1.0, 0.0, 1.0, 1.0),  // magenta
		vec4(0.0, 1.0, 1.0, 1.0)   // cyan
	];
	

	// Load indices to represent the triangles that will draw each face
	
	initialIndices = [
	   1, 0, 3, 3, 2, 1,  // front face
	   2, 3, 7, 7, 6, 2,  // right face
	   3, 0, 4, 4, 7, 3,  // bottom face
	   6, 5, 1, 1, 2, 6,  // top face
	   4, 5, 6, 6, 7, 4,  // back face
	   5, 4, 0, 0, 1, 5   // left face
	];
	
	// Get Bed data
	var bedWoodParts = 8;
	var BedVertices =  getVerticesFromBed(roomWidth * (5.0 / 8.0), - roomDepth * (1.0 / 4.0));
	var BedColors = getColorsFromBed(bedWoodParts);
	//var BedIndices = getBedIndices(indices, bedWoodParts);
	
	// Add all vertices, colors and indices of bed wood parts
	vertices = vertices.concat(verticesFloor, BedVertices);
    colors = colors.concat(BedColors);
	
	// Add mattress
	var mattressVertices = getVerticesFromMattress(roomWidth * (5.0 / 8.0), - roomDepth * (1.0 / 4.0)); // Same origin as bed
	var mattressColors = getColorsFromMattress();
	
	vertices = vertices.concat(mattressVertices);
	colors = colors.concat(mattressColors);

	indices = getIndices(initialIndices, numberOfPrims);
	
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
	aspect = canvas.width / canvas.height;
    gl.clearColor( 0.7, 0.7, 0.7, 1.0 );
	gl.enable(gl.DEPTH_TEST);
	projection = perspective (50.0, aspect, 1, 500);
	//projection = ortho (windowMin, windowMax, windowMin, windowMax, windowMin, windowMax+cubeSize);
	// Register event listeners for the buttons
	
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	colorLoc = gl.getUniformLocation (program, "color");
	modelViewLoc = gl.getUniformLocation (program, "modelView");
	projectionLoc  = gl.getUniformLocation (program, "projection");
	gl.uniformMatrix4fv (projectionLoc, false, flatten(projection));
	
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	var iBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
	
	// Load translation and viewing matrices which don't change each render
	//looking = lookAt (vec3(50,50,100), vec3(50,0,-10), vec3(0.0, 1.0, 0.0));
	looking = lookAt (vec3(0,50,75), vec3(50,0,-30), vec3(0.0, 1.0, 0.0));
	
    render();
};

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	modelView = looking;
		
	gl.uniformMatrix4fv (modelViewLoc, false, flatten(modelView));
	for (var i=0; i< 6 * numberOfPrims; i++) {
		gl.uniform4fv (colorLoc, colors[i]);
		gl.drawElements( gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 6*i );
	}
	requestAnimFrame (render);
};

// Returns array that represents the wood parts of the bed. 
//It contains the vertices of all the rectangular prismas that represent each of the parts of the bed.
function getVerticesFromBed(horizontalOrigin, depthOrigin) {

	// Initialize Bed units
	var horizontalUnit = (roomWidth - horizontalOrigin) / 10.0;
	var depthUnit = (roomDepth - depthOrigin) / 20.0;
	var heightUnit = (roomHeight / 2.0) / 10.0;	
	
	// Initialize Bed parts
	var totalBedParts = [];
	
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
	
	totalBedParts = totalBedParts.concat(footLeg1, footLeg2, footLeg3, footLeg4);
	totalBedParts = totalBedParts.concat(bedPart1, bedPart2, bedPart3, bedPart4);
	
	return totalBedParts;
}

// Returns array of 6 * pieces vectors, each one with the color brown.
// 6 because that is the number of the faces in a prism.
// 'pieces', because tha number of bed pieces if the number of prismas.
function getColorsFromBed(pieces){
	var colors = [];
	
	// Add brown six times
	for(var i = 0; i < 6 * pieces; i++) {
		colors.push( vec4( 0.6, 0.3, 0.0, 1.0 ) );
	}
	
	return colors;
}

// Returns array that represents the mattress. 
//It contains the vertices of the rectangular prism in the world coordinate.
function getVerticesFromMattress(horizontalOrigin, depthOrigin) {
	// The origin is the same as the bed, and the units too.
		// Initialize Bed units
	var horizontalUnit = (roomWidth - horizontalOrigin) / 10.0;
	var depthUnit = (roomDepth - depthOrigin) / 20.0;
	var heightUnit = (roomHeight / 2.0) / 10.0;	
	
	// Only one prism, or cuboid.
	var mattressVertices = [
		vec4(horizontalOrigin, 						1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						6 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 6 * heightUnit, depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 1 * heightUnit,	depthOrigin - 1 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin, 						6 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 6 * heightUnit, depthOrigin - 10 * depthUnit, 1.0),
		vec4(horizontalOrigin + 5 * horizontalUnit, 1 * heightUnit,	depthOrigin - 10 * depthUnit, 1.0)
	];
	
	return mattressVertices;
}

// Returns array of 6 vectors, each one with the color beige, for the mattress.
// 6 because that is the number of the faces in a prism.
function getColorsFromMattress(){
	var colors = [];
	
	// Add beige six times
	for(var i = 0; i < 6; i++) {
		colors.push( vec4( 0.96, 0.96, 0.86, 1.0 ) ); // Beige
	}	
	
	return colors;
}

// Returns the indices in the great vertices array. Every set of 6 elements corresponds to a face of the rectangular prism of cuboid.
function getIndices(originalCubeIndices, pieces) {
	var indices =[];

	for(var j = 0; j < pieces; j++) {
		// Add 8 times i + 1 to the each element of the cube indices
		for(var i = 0; i < originalCubeIndices.length; i++) {
			indices.push(originalCubeIndices[i] + 8 * j);
		}
	}
	return indices;
}