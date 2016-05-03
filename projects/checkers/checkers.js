
var gl;
var points;
var colors;

var NumPoints = 3000;
var CHECKERS_PIECE_RATIO = 0.70;
var TRIANGLES_PER_CIRCLE = 34;


// Maze with height > width is not supported

// Maze representation
// 0 -> empty
// 1 -> player a
// 2 -> player b 
// 3 -> player a selected
// 4 -> player b selected
var checkersTable;


window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    colors = [];
    
    
    checkersTable = createArray(8,8);
    
    for(var i = 0; i < 8; i++){
        for(var j = 0; j < 8; j++){
            checkersTable[i][j] = 1;
        }
    }
    
    checkersTable[0][1] = 2;
    checkersTable[0][0] = 0;
    
    
    points = drawCheckersBoard();
    playerPoints = drawPlayers();
    
    points = points.concat(playerPoints);
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
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
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}

// Returns vertices of checker board arranged so can webgl can draw them as triangles
function drawCheckersBoard(){
    var canvasVertexLimits = getBoardLinearLimits();
    var vertices = [];
  
    var color = true;
    
    //Create points and arrange them
    for (var row = 0; row < 8; row++ ){
        
        for (var col = 0; col < 8; col++) {
           
            // The square is made of two triangles
            vertices.push (vec2( canvasVertexLimits[row] , canvasVertexLimits[col]));
            vertices.push (vec2( canvasVertexLimits[row], canvasVertexLimits[col + 1] ));
            vertices.push (vec2( canvasVertexLimits[row + 1], canvasVertexLimits[col] ) );
            
            vertices.push (vec2( canvasVertexLimits[row + 1], canvasVertexLimits[col] ) );
            vertices.push (vec2( canvasVertexLimits[row], canvasVertexLimits[col + 1]) );
            vertices.push (vec2( canvasVertexLimits[row + 1] , canvasVertexLimits[col + 1] ));
            
            // To make the diagonal color pattern
            if(color)
                addRed();
            else
                addBeige();
            
            color = !color;
        }
        // Diagonal pattern
        color = !color;
    }
    
    return vertices;
}

// Returns points that represents the circles-playeers, according to checkersTable
function drawPlayers() {
    
    var playersPoints = [];
    
    var boardLimits = getBoardLinearLimits();
    
    // Visit every cell
    for (var row = 0; row < 8; row++) {
        for (var col = 0; col < 8; col++) {
            
            // Nothing to draw here. No players
            if( checkersTable[ row ][ col ] == 0) 
                continue;
                      
            // Get the points that create the circle 
            var circlePoints = getCirclePoints( row, col, boardLimits);
            playersPoints = playersPoints.concat(circlePoints);
            
            var perfectColor = getRightColor(row, col);
            for(var i = 0; i < circlePoints.length ; i++){
                colors.push(perfectColor);
            }
            
        }
    }
    
    return playersPoints;
}

// Returns the adequate color for the checkers piece, according to checkersTable, row and col
function getRightColor(row, col){
    
    switch (checkersTable[ row ][ col ]){
        case 1: return vec4 ( 1.0, 0.84, 0.0, 1.0);
        case 2: return vec4 ( 0.82, 0.41, 0.11, 1.0 );
        //TODO Add other colors
        default:    return vec4 (1.0, 1.0, 1.0, 1.0);
    }
    
}


// Returns a set of triangles that together are the circle.
// The circle coordinates depends of the board limits and the row and index of the board.
function getCirclePoints(rowIndex, colIndex, boardLimits) {
    var distanceBetweenLimits = boardLimits[1] - boardLimits[0];
   
    // Calculate center point, according to indexes
    var centerPoint = [];
    centerPoint.X = (colIndex * distanceBetweenLimits) + (distanceBetweenLimits / 2); // Indexes are 0-based
    centerPoint.Y = (rowIndex * distanceBetweenLimits) + (distanceBetweenLimits / 2);
    
    // I don't like webgl coordinate system
    // Transform [0,2] in X, and [0,2] in Y to webgl coordinate system
    centerPoint.X -= 1;
    centerPoint.Y = (2 - centerPoint.Y) - 1;
 
    var radius = (distanceBetweenLimits / 2) * CHECKERS_PIECE_RATIO;
    
    return generateTrianglesOfCircle(centerPoint, radius);    
}



function generateTrianglesOfCircle(centerPoint, radius){
    var circlePoints = [];
    
    // Is easier with vec2 to do math
    var center = vec2(centerPoint.X, centerPoint.Y);
    
    var deltaAngle = (2 * Math.PI) / TRIANGLES_PER_CIRCLE;
    
    for (var i = 0; i < TRIANGLES_PER_CIRCLE; i++) {
        
        // Add each triangle -> 3 points
        circlePoints.push( center );
        circlePoints.push( vec2(   radius * Math.cos( i * deltaAngle ) + centerPoint.X,
                                   radius * Math.sin( i * deltaAngle ) + centerPoint.Y ));
        circlePoints.push( vec2(   radius * Math.cos( ( i + 1 ) * deltaAngle ) + centerPoint.X,
                                   radius * Math.sin( ( i + 1 ) * deltaAngle ) + centerPoint.Y ));
                                  
                                    
        
    }
    
    return circlePoints;
}


// Draw a beige square
function addRed() {
 // Add beige to colors
 
    colors.push( vec4( .96 , .94 , .87 , 1 ) ); // Design
    colors.push( vec4( .96 , .94 , .87 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );

}

// Draw a beige square
function addBeige() {
 // Add beige to colors
    
    colors.push( vec4( .74 , .26 , .16 , 1 ) ); // Design
    colors.push( vec4( .74 , .26 , .16 , 1 ) );
    colors.push( vec4( .64 , .16 , .16 , 1 ) ); 
    colors.push( vec4( .64 , .16 , .16 , 1 ) );
    colors.push( vec4( .64 , .16 , .16 , 1 ) );
    colors.push( vec4( .64 , .16 , .16 , 1 ) );
    
}

// Returns 9 limits from [ -1 , 1 ], because that is the webgl canvas.
function getBoardLinearLimits(){
    var limits = [];
    
    var delta =  2 / 8.0;
    currentLimit = -1;
    
    for(var i = 0; i < 9; i++){
        limits.push(currentLimit);
        currentLimit += delta ;
    }
    
    return limits;
}

// Aux function to create matrix
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}
