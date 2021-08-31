var context, controller, loop

// Setup Canvas
var canvas = document.getElementById('screen');
var ctx = canvas.getContext('2d');
context = ctx;

let dpr = window.devicePixelRatio;
canvas.width = 800;
canvas.height = 600;

canvas.style.height = '100vh'
canvas.style.width = '125vh'

ctx.imageSmoothingEnabled = false;