
var gl;
var points;
var colors;

var NumPoints = 3000;


// Maze with height > width is not supported

// Maze representation in boolean matrix
var maze_matrix;


window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    colors = [];
    points = drawCheckersBoard();
    
    
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
   
    // Add beige to colors

            

            //vertices.push (vec2( canvasVertexLimits[0 + 1] - .01 , canvasVertexLimits[1] + .01 ) );
            
    
    var color = true    ;
    
    //Create points and arrange them
    for (var row = 0; row < 8; row++ ){
        
        for (var col = 0; col < 8; col++) {
           
                vertices.push (vec2( canvasVertexLimits[row] , canvasVertexLimits[col]));
                vertices.push (vec2( canvasVertexLimits[row], canvasVertexLimits[col + 1] ));
                vertices.push (vec2( canvasVertexLimits[row + 1], canvasVertexLimits[col] ) );
                
                vertices.push (vec2( canvasVertexLimits[row + 1], canvasVertexLimits[col] ) );
                vertices.push (vec2( canvasVertexLimits[row], canvasVertexLimits[col + 1]) );
                vertices.push (vec2( canvasVertexLimits[row + 1] , canvasVertexLimits[col + 1] ));
            
            if(color) {
                
                
                addRed();
            } else {
                addBrown();
            }
            
            color = !color;
            
            

        }
        
        color = !color;
    }
    
    return vertices;
}

// Draw a beige square
function addRed() {
 // Add beige to colors
 
    colors.push( vec4( .96 , .94 , .87 , 1 ) );
    colors.push( vec4( .96 , .94 , .87 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );
    colors.push( vec4( .86 , .84 , .77 , 1 ) );

}

// Draw a beige square
function addBrown() {
 // Add beige to colors
 
  // Add beige to colors
    //colors.push( vec4( .96 , .94 , .87 , 1 ) );
    //colors.push( vec4( .96 , .94 , .87 , 1 ) );
    
    colors.push( vec4( .74 , .26 , .16 , 1 ) );
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
