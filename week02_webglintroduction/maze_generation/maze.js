
var gl;
var points;

var NumPoints = 3000;

var width = 100;
var height = 100;

// Maze with height > width is not supported

// Maze representation in boolean matrix
var maze_matrix;


window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    points = [];
    
    // Allocate space to save maze
    maze_matrix = createArray(width, height);
    
    // Create maze!
    createMaze();
    
    // Draw it, webgl!
    renderMatrix();
    
    
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
    
    
    render();
};

function createMaze() {
    // Stack of previous points, backtracking
    var stacky = [];
   
    // Initial random position of first cel
    var initialCellRow = Math.floor( Math.random() * (height - 2) ) + 1; // Inside the perimeter
    var initialCellCol = Math.floor( Math.random() * (width - 2) ) + 1;
    
    var currentCell = [initialCellRow, initialCellCol];
    
    // Set as visited
    maze_matrix[ currentCell[ 0 ] ][ currentCell[ 1 ] ] = true;
    stacky.push(currentCell);
    
    // Only the first one has been visited
    var unvisitedCells = (width * height) - 1;
    
    // All cells must be visited
    while (unvisitedCells > 0) {
        
        // Find posible neighbors, receive array of vec2
        var randomNeighbors = findPossibleNeighbors(currentCell);
        
        // No possible neighbors were found, let's see what is in the stack
        if(randomNeighbors.length > 0){
        
            // Find all possible neighbors!
            var randomNeighbor = randomNeighbors[Math.floor( Math.random() * randomNeighbors.length )];
            
            // Push the current cell to stack
            stacky.push( currentCell );
            
            // Paint route between current and accepted neighbors
            maze_matrix[randomNeighbor[0]][ randomNeighbor[1]] = true;
            
            // One less to go
            unvisitedCells--;
            
            // Change current cell
            currentCell = randomNeighbor;
            
        } else if(stacky.length>0){
            currentCell = stacky.pop();
        } else { // What if stack is empty
            break;
        }
        
    }
    
    // Eingang und Ausgang
    addStartEnd();
    
}

function addStartEnd() {
    var currentPixelCoordinate = 0;
    // Find the first white pixel in the left side
    while(!maze_matrix[ currentPixelCoordinate ][ 1 ])
        currentPixelCoordinate++;
    
    // Paint it white, that's the entrance
    maze_matrix[ currentPixelCoordinate ][ 0 ] = true;
    
    // Do the same for the right side
    currentPixelCoordinate = height - 1;
    
    while(!maze_matrix[ currentPixelCoordinate ][ width - 2 ])
        currentPixelCoordinate--;
        
    // Paint it
    maze_matrix[ currentPixelCoordinate ][ width - 1 ] = true;    
    
}

// Returns a list of all valid neighbors
// Valid means, inside the perimeter and that only has one white neighbor
function findPossibleNeighbors(cell) {
    var possibleNeighbors = [];
    
    // The neighbor should be inside the maze, should not have been visited and should not be sorrounded by more than two other white cells.
    
    var possibleNeighbor1 = [cell[0] - 1, cell[1]];
    if(isInsidePerimeter(possibleNeighbor1) && !isVisited(possibleNeighbor1) && fewWhiteNeighbors(possibleNeighbor1) ){
        possibleNeighbors.push(possibleNeighbor1);
    }
    
    var possibleNeighbor2 = [cell[0] + 1, cell[1]];
    if(isInsidePerimeter(possibleNeighbor2) && !isVisited(possibleNeighbor2) && fewWhiteNeighbors(possibleNeighbor2)){
        possibleNeighbors.push(possibleNeighbor2);
    }
    
    var possibleNeighbor3 = [cell[0], cell[1] - 1];
    if(isInsidePerimeter(possibleNeighbor3) && !isVisited(possibleNeighbor3) && fewWhiteNeighbors(possibleNeighbor3) ){
        possibleNeighbors.push(possibleNeighbor3);
    }

    var possibleNeighbor4 = [cell[0], cell[1] + 1];
    if(isInsidePerimeter(possibleNeighbor4) && !isVisited(possibleNeighbor4) && fewWhiteNeighbors(possibleNeighbor4) ){
        possibleNeighbors.push(possibleNeighbor4);
    }
    
    return possibleNeighbors;
}

// Cell is white?
function isVisited(cell) {
    return maze_matrix[cell[0]][cell[1]];
}

// Only two white neighbors are allowed
function fewWhiteNeighbors(cell) {
    var whiteNeighboors = 0;
    if(maze_matrix[cell[0] - 1][cell[1] - 1]) whiteNeighboors++;
    if(maze_matrix[cell[0] - 1][cell[1]] ) whiteNeighboors++;
    if(maze_matrix[cell[0] - 1][cell[1] + 1]) whiteNeighboors++;
    if(maze_matrix[cell[0] ][cell[1] - 1]) whiteNeighboors++;
    if(maze_matrix[cell[0] ][cell[1] + 1]) whiteNeighboors++;
    if(maze_matrix[cell[0] + 1][cell[1] - 1]) whiteNeighboors++;
    if(maze_matrix[cell[0] + 1][cell[1]]) whiteNeighboors++;
    if(maze_matrix[cell[0] + 1][cell[1] + 1]) whiteNeighboors++;
   
    return (whiteNeighboors < 3); 
}

// Inside maze
function isInsidePerimeter(cell){
    if(cell[0] < 1 || cell[0] > (height - 2)) return false;
    if(cell[1] < 1 || cell[1] > (width - 2)) return false;
    return true;
}

// Converts maze matrix into points so WebGl can understand
function renderMatrix() {
    
    var squareSideLenght = 2.0 / width;
    
    for (var row = 0; row < height; row++) {
        for (var col = 0; col < width; col++) {
            
            // If the matrix element contains a true value, it should be colored
            if (maze_matrix[row][col] == true) {
                
                var relativeHorizontalOrigin = col * squareSideLenght - 1; // Minus one because of the coordinate system
                var relativeVerticalOrigin = -row * squareSideLenght + 1; // Same here
                
                // Calculate 4 corners of the square
                var corner1 = vec2 (relativeHorizontalOrigin, relativeVerticalOrigin); // up left
                var corner2 = vec2 (relativeHorizontalOrigin + squareSideLenght, relativeVerticalOrigin ); // up right
                var corner3 = vec2 (relativeHorizontalOrigin + squareSideLenght, relativeVerticalOrigin - squareSideLenght); // down right
                var corner4 = vec2 (relativeHorizontalOrigin, relativeVerticalOrigin - squareSideLenght); // down left
                
                // Draw two triangles, no square primitive
                points.push(corner1, corner2, corner3);
                points.push(corner1, corner3, corner4);
                
            }
            
        }
    }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}


// Aux function to create array / maze matrix
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}
