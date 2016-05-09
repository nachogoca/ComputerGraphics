
var gl;
var canvas;
var canvasXOffset;
var canvasYOffset;

var vertexBuffer;
var colorBuffer;

var checkerBoardPoints;
var checkerBoardColors;

var points;
var colors;

var NumPoints = 3000;
var CHECKERS_PIECE_RATIO = 0.70;
var TRIANGLES_PER_CIRCLE = 34;


// Maze with height > width is not supported

// Maze representation
// 0 -> empty
// 1 -> player a
// 2 -> player a selected 
// 3 -> player b
// 4 -> player b selected
var checkersTable;

var pieceIsSelected = false;
var lastPieceSelected;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    // Initialize elements
    canvasXOffset = canvas.offsetLeft;
    canvasYOffset = canvas.offsetTop;
    
    points = [];
    colors = [];
    checkersTable = createArray(8,8);
    
    initializeGame();
    
    // Draw checkerBoard
    [checkerBoardPoints,checkerBoardColors] = drawCheckersBoard();
    points = points.concat(checkerBoardPoints);
    colors = colors.concat(checkerBoardColors);
    
    // Draw players
    [playersPoints,playersColors] = drawPlayers(); 
    points = points.concat(playersPoints);
    colors = colors.concat(playersColors);
    
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    //  Load shaders and initialize attribute buffers
    
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Load the data into the GPU
    
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );

    // Associate our shader variables with our data buffer
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    
    // Colors
    colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW);
    
    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    
    
    // Set up event listener
	canvas.addEventListener ("click", function(event) {
        // Convert to canvas coordinate system
        var point = vec2 (-1 + 2 * (event.clientX - canvasXOffset)/canvas.width,
            -1 + 2 * ( canvas.height - (event.clientY - canvasYOffset) ) / canvas.height);
        
        // Analyze click positions
        
        
        processClick(point);
        
        points = [];
        colors = [];
        
        
        [playersPoints,playersColors] = drawPlayers(); 
        points = checkerBoardPoints.concat(playersPoints);
        colors = checkerBoardColors.concat(playersColors);
        
        
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW );
        
        gl.bindBuffer( gl.ARRAY_BUFFER, colorBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW );
        
    });
    
    render();
};


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
     
    requestAnimFrame (render);
}


// Function that interprets what the user has done, and convert it in a checkers action
function processClick(pointClicked) {
    
    // Convert floating point coordinates of click to the checkers table coordinates
    var [rowOfClick, colOfClick] = getPositionInBoardMatrix(pointClicked);
    
    // Checks basic rules of checkes, there is no game logic here
    if( !positionCanBeSelected(rowOfClick, colOfClick))
        return;
    
    var squareState = checkersTable[ rowOfClick ] [ colOfClick ];
    
    if(pieceIsSelected){
        
        // If it is the same piece, return to no-selected state
        if(lastPieceSelected[0] == rowOfClick && lastPieceSelected[1] == colOfClick){
            checkersTable[ rowOfClick ][ colOfClick ] = squareState - 1;
        } else {
            // TODO Implement checkers logic
            // For now it moves
            
            checkersTable[ rowOfClick ][ colOfClick ] = checkersTable[ lastPieceSelected[0] ][ lastPieceSelected[1] ] - 1;
            checkersTable[ lastPieceSelected[0] ][ lastPieceSelected[1] ] = 0; // Remove piece from board
        
        }
        pieceIsSelected = false;
        
    } else {
        // Select piece
        if(squareState == 1 || squareState == 3){
            checkersTable[ rowOfClick ] [ colOfClick ]++;
            lastPieceSelected = [ rowOfClick, colOfClick ];
            
        }
        pieceIsSelected = true;
    }
    
    
        
    
}

// Basic rules of checkers game, so next steps are easier to implement
function positionCanBeSelected(rowInBoard, colInBoard) {
    // Obtain destination state.
    var pieceState = checkersTable[ rowInBoard ][ colInBoard ];
    
    // If a piece has been selected, the only destination possible is a empty square or itself.
    if ( pieceIsSelected ){    
        return (pieceState == 0 || (lastPieceSelected[0] == rowInBoard && lastPieceSelected[1] == colInBoard));
    }

    // If a piece hasn't been selected, the empty square is the only square that the user can't select.
    return (pieceState != 0)
}


// Initialize checkers board matrix
function initializeGame(){
    for (var i = 0; i < 8; i += 2){
        checkersTable[0][i] = 1;    // Player 1
        checkersTable[1][i] = 0;
        checkersTable[2][i] = 1; 
        
        checkersTable[3][i] = 0;    // Empty
        checkersTable[4][i] = 0;
        
        checkersTable[5][i] = 0;
        checkersTable[6][i] = 3;    // Player 2
        checkersTable[7][i] = 0;
    }
    
    for (var i = 1; i < 8; i += 2){
        checkersTable[0][i] = 0;    // Player 1
        checkersTable[1][i] = 1;
        checkersTable[2][i] = 0; 
        
        checkersTable[3][i] = 0;    // Empty
        checkersTable[4][i] = 0;
        
        checkersTable[5][i] = 3;
        checkersTable[6][i] = 0;    // Player 2
        checkersTable[7][i] = 3;
    }
    
}

// Returns vertices of checker board arranged so can webgl can draw them as triangles
function drawCheckersBoard(){
    var canvasVertexLimits = getBoardLinearLimits();
    var vertices = [];
    var colorSquares = [];
    
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
                colorSquares = colorSquares.concat(addRed());
            else
                colorSquares = colorSquares.concat(addBeige());
            
            color = !color;
        }
        // Diagonal pattern
        color = !color;
    }
    
    return [vertices, colorSquares];
}

// Returns points that represents the circles-playeers, according to checkersTable
function drawPlayers() {
    
    var playersPoints = [];
    var playersColors = [];
    
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
                playersColors.push(perfectColor);
            }
            
        }
    }
    
    return [playersPoints,playersColors];
}

// Returns the adequate color for the checkers piece, according to checkersTable, row and col
function getRightColor(row, col){
    
    switch (checkersTable[ row ][ col ]){
        case 1:     return vec4 ( 0.92, 0.75, 0.0, 1.0);
        case 2:     return vec4 (1, 0.75, 0.0, 0.8);
        case 3:     return vec4 ( 0.82, 0.41, 0.11, 1.0 );
        case 4:     return vec4 ( 1.0, 0.41, 0.11, 0.8 );
        default:    return vec4 (1.0, 1.0, 1.0, 1.0);
    }
    
}





// Draw a red square
function addRed() {
    var redSquareColor = [];
    
    redSquareColor.push( vec4( .96 , .94 , .87 , 1 ) ); // Design
    redSquareColor.push( vec4( .96 , .94 , .87 , 1 ) );
    redSquareColor.push( vec4( .86 , .84 , .77 , 1 ) );
    redSquareColor.push( vec4( .86 , .84 , .77 , 1 ) );
    redSquareColor.push( vec4( .86 , .84 , .77 , 1 ) );
    redSquareColor.push( vec4( .86 , .84 , .77 , 1 ) );
    
    return redSquareColor;
}

// Draw a beige square
function addBeige() {
    var beigeSquareColor = [];
    
    beigeSquareColor.push( vec4( .74 , .26 , .16 , 1 ) ); // Design
    beigeSquareColor.push( vec4( .74 , .26 , .16 , 1 ) );
    beigeSquareColor.push( vec4( .64 , .16 , .16 , 1 ) ); 
    beigeSquareColor.push( vec4( .64 , .16 , .16 , 1 ) );
    beigeSquareColor.push( vec4( .64 , .16 , .16 , 1 ) );
    beigeSquareColor.push( vec4( .64 , .16 , .16 , 1 ) );
    
    return beigeSquareColor;
}




// Determine the row and column of the click event
function getPositionInBoardMatrix(clickPosition) {
    var squareLimitLenght = 2.0 / 8;
    
    // Working with other coordinate system Domain [0,2] and range [0,2]
    var niceCoordinateSystemXPosition = clickPosition[0] + 1;
    var niceCoordinateSystemYPosition = (1 - clickPosition[1]); 
    
    var row = Math.floor( niceCoordinateSystemYPosition / squareLimitLenght );
    var col = Math.floor( niceCoordinateSystemXPosition / squareLimitLenght );
    
    return [row, col];
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