"use strict";

var canvas;
var gl;

var bufferCone, bufferWing, bufferBase, 
    coneVertices, wingVertices, baseVertices;
var vPosition;
var modelMatrixLoc, viewMatrixLoc, projectionMatrixLoc;

var tx = 0.0, ty = 0.0, tz = 0.0, 
    scale = 1.0, 
    rotationX = 0.0, rotationY = 0.0, rotationZ = 0.0;

var cameraX = 0, cameraY = 0, cameraZ = 5,
    targetX = 0, targetY = 0, targetZ = 0,
    fovy = 45;

var rotationSpeed = 0.5, angle = 0;
var triangleColor = [0.0, 0.0, 0.0]; 
var wingColors = [
    [1.0, 0.0, 0.0],  
    [0.0, 1.0, 0.0],  
    [0.0, 0.0, 1.0]   
]; 

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    coneVertices = [
    vec3(0.0, 0.0, 0.0) 
	];

	
	for (let i = 0; i <= 360; i += 10) {
		let x = 0.1 * Math.cos(radians(i));
		let z = 0.1 * Math.sin(radians(i));
		coneVertices.push(vec3(x, -1.0, z));
	}

    wingVertices = [
        vec3(-0.1, 0.0, 0.0),  
        vec3(0.1, 0.0, 0.0),
        vec3(-0.1, 0.6, 0.0),
        vec3(0.1, 0.6, 0.0)
    ];

    baseVertices = [
        vec3(-1, -1, -1),
        vec3(1, -1, -1),
        vec3(-1, -1, 1),
        vec3(1, -1, 1)
    ];

    bufferCone = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCone);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(coneVertices), gl.STATIC_DRAW);

    bufferWing = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferWing);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(wingVertices), gl.STATIC_DRAW);

    bufferBase = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferBase);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(baseVertices), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    var uTriangleColorLoc = gl.getUniformLocation(program, "uColor");

    gl.uniform3fv(uTriangleColorLoc, triangleColor);

    document.getElementById("inp_objX").oninput = function(event) {
        tx = parseFloat(event.target.value);
    };
    document.getElementById("inp_objY").oninput = function(event) {
        ty = parseFloat(event.target.value);
    };
    document.getElementById("inp_objZ").oninput = function(event) {
        tz = parseFloat(event.target.value);
    };
    document.getElementById("inp_obj_scale").oninput = function(event) {
        scale = parseFloat(event.target.value);
    };
    document.getElementById("inp_obj_rotX").oninput = function(event) {
        rotationX = parseFloat(event.target.value);
    };
    document.getElementById("inp_obj_rotY").oninput = function(event) {
        rotationY = parseFloat(event.target.value);
    };
    document.getElementById("inp_obj_rotZ").oninput = function(event) {
        rotationZ = parseFloat(event.target.value);
    };

    document.getElementById("inp_cam_x").oninput = function(event) {
        cameraX = parseFloat(event.target.value);
    };
    document.getElementById("inp_cam_y").oninput = function(event) {
        cameraY = parseFloat(event.target.value);
    };
    document.getElementById("inp_cam_z").oninput = function(event) {
        cameraZ = parseFloat(event.target.value);
    };
    document.getElementById("inp_fovy").oninput = function(event) {
        fovy = parseFloat(event.target.value);
    };

    document.getElementById("inp_target_x").oninput = function(event) {
        targetX = parseFloat(event.target.value);
    };
    document.getElementById("inp_target_y").oninput = function(event) {
        targetY = parseFloat(event.target.value);
    };
    document.getElementById("inp_target_z").oninput = function(event) {
        targetZ = parseFloat(event.target.value);
    };

    document.getElementById("inp_wing_speed").oninput = function(event) {
        rotationSpeed = parseFloat(event.target.value);
    };

    document.getElementById("redSlider").oninput = function(event) {
        triangleColor[0] = parseFloat(event.target.value);
        updateTriangleColor(uTriangleColorLoc);
    };
    document.getElementById("greenSlider").oninput = function(event) {
        triangleColor[1] = parseFloat(event.target.value);
        updateTriangleColor(uTriangleColorLoc);
    };
    document.getElementById("blueSlider").oninput = function(event) {
        triangleColor[2] = parseFloat(event.target.value);
        updateTriangleColor(uTriangleColorLoc);
    };

    render();
};

function updateTriangleColor(uTriangleColorLoc) {
    gl.uniform3fv(uTriangleColorLoc, triangleColor);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let modelMatrix = mult(
        translate(tx, ty, tz),
        mult(
            rotateX(rotationX),
            mult(
                rotateY(rotationY),
                mult(
                    rotateZ(rotationZ),
                    scalem(scale, scale, scale)
                )
            )
        )
    );

    let viewMatrix = lookAt(
        vec3(cameraX, cameraY, cameraZ), 
        vec3(targetX, targetY, targetZ), 
        vec3(0, 1, 0)
    );

    let projectionMatrix = perspective(fovy, 1, 0.1, 10);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferBase);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(mat4()));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    
    gl.uniform3fv(gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), "uColor"), [0.5, 0.5, 0.5]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCone);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    gl.uniform3fv(gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), "uColor"), triangleColor);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, coneVertices.length);

    let centerX = 0.0;
    let centerY = 0.0;

    for (let i = 0; i < 3; i++) {
        let angleOffset = angle + i * 120;
        let wingRotationMatrix = mult(
            translate(centerX, centerY, 0),
            mult(
                rotateZ(angleOffset),
                translate(-centerX, -centerY, 0)
            )
        );

        let wingModelMatrix = mult(modelMatrix, wingRotationMatrix);

        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(wingModelMatrix));
        gl.uniform3fv(gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), "uColor"), wingColors[i]);

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferWing);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    angle += rotationSpeed;
    window.requestAnimFrame(render);
}