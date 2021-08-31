var context, controller, loop

// Setup Canvas
var canvas = document.getElementById('screen');
var ctx = canvas.getContext('2d');
context = ctx;

let dpr = window.devicePixelRatio;
canvas.width = 800;
canvas.height = 600;

resize();
function resize() {
// Get browser's x/y scaling
let xScale = canvas.clientWidth * dpr / 800;
let yScale = canvas.clientHeight * dpr / 600;

// Round down to 2 decimal places (e.g. 2.73)
xScale = Math.floor(xScale * 100) / 100;
yScale = Math.floor(yScale * 100) / 100;

// Select the lowest scale
let desiredScale = Math.min(xScale, yScale);

// Set the canvas width and height, taking pixel ratio into account
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;

console.log(desiredScale)

// Scale the canvas using our chosen scale
ctx.setTransform(desiredScale, 0, 0, desiredScale, 0, 0);

// Don't forget to turn off image smoothing
ctx.imageSmoothingEnabled = false;
}
