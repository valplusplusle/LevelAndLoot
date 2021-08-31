var context, controller, loop

// Setup Canvas
context = document.querySelector('canvas').getContext('2d')
context.canvas.width = 800
context.canvas.height = 600


document.getElementById('screen').style.transform = 'scale(2,2)'

// var canvas = document.getElementById('screen')
// canvas.style.height = window.innerHeight + 'px';
// var variableResolution = (window.innerHeight / 600) * 800
// canvas.style.width = variableResolution + 'px';