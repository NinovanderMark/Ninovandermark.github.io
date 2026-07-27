// Squash for One
// Copyright 2017 - Nino van der Mark
// Written mostly in between work (honest!)

// ----------------------
// General Functions
// ----------------------

// Function to check for collisions
function collision(x1, y1, x2, y2, ox1, oy1, ox2, oy2) {
    if ( x1 >= ox1 && x2 <= ox2 && y1 >= oy1 && y2 <= oy2 ) {
        return true;
    }
    return false;
}

// Function to get a random colour
function getRandomColor(light) {
    var h = Math.round(Math.random()*360);
    return "hsl(" + h + ", 100%, " + light + "%)";
}

// Gets a coordinate on the canvas
function getPositionOnCanvas(canvas, xPos, yPos) {
    var rect = canvas.getBoundingClientRect();
    var widthFactor =  canvas.width / canvas.offsetWidth;
    var heightFactor = canvas.height /  canvas.offsetHeight;

    return {
        x: ( xPos*widthFactor ) - rect.left,
        y: ( yPos*heightFactor ) - rect.top
    }
}

// Get the mouse position
function getMousePosition(canvas, event) {
    return getPositionOnCanvas(canvas, event.clientX, event.clientY);
}

// Get touch position
function getTouchPosition(canvas, event) {
    return getPositionOnCanvas(canvas, event.changedTouches.item(0).clientX, event.changedTouches.item(0).clientY);
}

// ----------------------
// Object Definitions
// ----------------------

// Paddle object
function Paddle(xPos, yPos, paddleWidth, paddleHeight, moveSpeed) { 
    this.left = xPos;
    this.top = yPos;
    this.color = getRandomColor(60);
    this.width = paddleWidth;
    this.height = paddleHeight;
    this.moveSpeed = moveSpeed;
    this.drag = 2;
    this.xVel = 0;
    this.score = 0;
}

Paddle.prototype.draw = function(drawContext) {
    drawContext.fillStyle = this.color;
    drawContext.fillRect(this.left, this.top, this.width, this.height);
};

Paddle.prototype.tick = function(speedFactor) {
    this.left += this.xVel*speedFactor;

    // Apply drag
    if ( this.xVel > 0 ) { 
        this.xVel -= this.drag*speedFactor; 

        if ( this.xVel < 0 ) {
            this.xVel = 0;
        }
    }
    else if ( this.xVel < 0 ) { 
        this.xVel += this.drag*speedFactor;

        if ( this.xVel > 0 ) {
            this.xVel = 0;
        }
    }
};

Paddle.prototype.moveLeft = function(velocity) {
    if ( velocity < 0 || velocity > this.moveSpeed ) {
        this.xVel = -this.moveSpeed;
    }
    else {
        this.xVel = -velocity;
    }
};

Paddle.prototype.moveRight = function(velocity) {
    if ( velocity < 0 || velocity > this.moveSpeed ) {
        this.xVel = this.moveSpeed;
    }
    else {
        this.xVel = velocity;
    }
};

// Ball object
function Ball(xPos, yPos, ballSize, maxVelocity) {
    this.left = xPos;
    this.top = yPos;
    this.color = "#fff";
    this.size = ballSize;
    this.maxVelocity = maxVelocity;
    
    // Starting velocity
    this.xVel = 1;
    this.yVel = 3;
}

Ball.prototype.draw = function(drawContext) {
    drawContext.fillStyle = this.color;
    drawContext.fillRect(this.left, this.top, this.size, this.size);
};

Ball.prototype.collision = function(paddleObject) {
    var largestVel = this.xVel > this.yVel ? this.xVel : this.yVel;

    for (var t = Math.ceil(largestVel / this.size); t >= 0 ; t-- ) {
        var newLeft = this.left - (t*(this.xVel / this.size));
        var newTop = this.top - (t*(this.yVel / this.size));

        if ( collision(newLeft, newTop, newLeft+this.size, newTop+this.size, 
            paddleObject.left, paddleObject.top, paddleObject.left+paddleObject.width, paddleObject.top+paddleObject.height) ) {
            // We collided, so let's get ourselves in right order
            this.left = Math.round(newLeft);

            // Modify ball velocity
            this.yVel++;
            this.yVel = 0-ball.yVel;
            this.xVel += paddleObject.xVel;
            this.top = paddleObject.top - this.size;

            // If the ball has no more horizontal velocity
            if ( this.xVel === 0 ) {
                // Make sure we can't just sit pretty and win forever
                if ( Math.random() > 0.5 ) {
                        this.xVel = -1;
                }
                else {
                        this.xVel = 1;
                }
            }
            else if ( Math.random() > 0.8 ) {
                // Random chance to get a steeper velocity
                if ( this.xVel > 0 && this.xVel < this.maxVelocity-1.2 ) {
                    this.xVel+=Math.random()*1.2;
                }
                else if ( this.xVel < 0 && this.xVel > 0-this.maxVelocity+1.2 ) {
                    this.xVel-=Math.random()*1.2;
                }
            }

            // Collision happened, return true
            return true;
        }
    }

    // No collision happened
    return false;
    
};

Ball.prototype.tick = function(speedFactor) {
    // Constrain velocity
    if ( this.xVel > this.maxVelocity ) {
        this.xVel = this.maxVelocity;
    }
    else if ( this.xVel < 0-this.maxVelocity ) {
        this.xVel = 0-this.maxVelocity;
    }

    if ( this.yVel > this.maxVelocity ) {
        this.yVel = this.maxVelocity;
    }
    else if ( this.yVel < 0-this.maxVelocity ) {
        this.yVel = 0-this.maxVelocity;
    }

    // Apply velocity
    this.left += this.xVel*speedFactor;
    this.top += this.yVel*speedFactor;
};

function ScoreCounter() {
    this.score = 0;
    this.color = "#fff";
    this.font = "24px serif";
    this.before = "";
    this.after = "";
    this.top = 40;
    this.left = "center";
    this.yVel = 0;
    
    this.lifeTime = -1;
    this.maxLifeTime = -1;
}

ScoreCounter.prototype.addScore = function(value) {
    this.score += value;
};

ScoreCounter.prototype.setScore = function(value) {
    this.score = value;
};

ScoreCounter.prototype.saveValue = function(valueName) {
    localStorage.setItem(valueName, this.score);
    localStorage.setItem(valueName + '-color', this.color);
};

ScoreCounter.prototype.loadValue = function(valueName) {
    var lastValue = localStorage.getItem(valueName);
    var lastValueColor = localStorage.getItem(valueName + '-color');

    // Get the value, if it exists
    if ( lastValue !== null ) {
        this.score = lastValue;
        
        // Get the color, if there is one
        if ( lastValueColor !== null ) {
            this.color = lastValueColor;
        }
    }
};

ScoreCounter.prototype.setLifeTime = function(newLifeTime) {
    this.maxLifeTime = newLifeTime;
    this.lifeTime = newLifeTime;
};

ScoreCounter.prototype.lifeTick = function(speedFactor) {
    if ( this.lifeTime > 0 ) {
        this.lifeTime-=speedFactor;
        if ( this.lifeTime < 0 ) {
            this.lifeTime = 0;
        }
    }
};

ScoreCounter.prototype.draw = function(drawContext) {
    // If we're not alive, don't draw anything
    if ( this.maxLifeTime >= 0 && this.lifeTime <= 0 ) {
        return;
    }

    // Set us up to draw
    drawContext.fillStyle = this.color;
    drawContext.font = this.font;
    var textToDraw = this.before + this.score + this.after;
    var leftPos = this.left;

    // If the text is centered;
    if ( this.left == "center" ) {
        var text = drawContext.measureText(textToDraw);
        leftPos = (drawContext.canvas.width/2) - (text.width/2);
    }

    // If this score has a limited lifetime
    if ( this.maxLifeTime >= 0 ) {
        // See if it is still alive
        if ( this.lifeTime > 0 ) {
            drawContext.globalAlpha = this.lifeTime / this.maxLifeTime;
        }
    }

    // Draw the score
    drawContext.fillText(textToDraw, leftPos, this.top);
    drawContext.globalAlpha = 1; // Reset alpha

    // If the score object is moving
    if ( this.yVel !== 0 ) {
        this.top += this.yVel;
    }

};

// ----------------------
// Program Start
// ----------------------

// Set up the environment
var canvas = document.getElementById("canvas");
var context = canvas.getContext('2d');
var backgroundColor = "#000";

// Set up game variables
var paddle = new Paddle(canvas.width/2, canvas.height - 40, 100, 16, 12);
var ball = new Ball(canvas.width/2, canvas.height/4, 4, 12);

var scoreCounter = new ScoreCounter();
var highScoreCounter = new ScoreCounter();
highScoreCounter.top = 60;
highScoreCounter.font = "14px serif";
highScoreCounter.before = "Highscore: ";
highScoreCounter.loadValue('highscore');

var lastScoreCounter = new ScoreCounter();
lastScoreCounter.setLifeTime(0);

// Set up control variables
var leftDown = false;
var rightDown = false;
var mouseDown = false;
var mouseX;
var mouseY;
var lastFrameTime = 0;

// Draw function
function draw() {
    // Draw functions
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the game objects
    paddle.draw(context);
    ball.draw(context);

    // Draw the score counters
    scoreCounter.draw(context);
    highScoreCounter.draw(context);
    lastScoreCounter.draw(context);
}

// Game update function
function gameUpdate(currentTime) {

    // Use keyboard input to move
    if ( leftDown ) {
        paddle.moveLeft(-1);
    }
    else if ( rightDown ) {
        paddle.moveRight(-1);
    }

    // Use mouse input to move
    if ( mouseDown && mouseX < paddle.left+(paddle.width/2) ) {
        paddle.moveLeft((paddle.left+(paddle.width/2)) - mouseX);
    }
    else if ( mouseDown && mouseX > paddle.left+(paddle.width/2) ) {
        paddle.moveRight(mouseX - (paddle.left+(paddle.width/2)));
    }

    // See how much time passed since the last frame
    var timePassed = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    // Adjust how quickly the simulation should run
    var speedFactor = (timePassed*60)/1000;

    // Tick the objects
    ball.tick(speedFactor);
    paddle.tick(speedFactor);
    lastScoreCounter.lifeTick(speedFactor);

    // Constrain the paddle
    if ( paddle.left < 0 ) {
        paddle.left = 0;
        if ( paddle.xVel < 0 ) {
            paddle.xVel = 0;
        }
    }
    else if ( paddle.left+paddle.width > canvas.width ) {
        paddle.left = canvas.width-paddle.width;
        if ( paddle.xVel > 0 ) {
            paddle.xVel = 0;
        }
    }


    // Bounce the ball
    if ( ball.collision(paddle) ) {
        // Add score
        scoreCounter.addScore(Math.round(Math.abs(ball.xVel)+Math.abs(ball.yVel)));

        // Check to see if the highscore has been surpassed
        if ( scoreCounter.score > highScoreCounter.score ) {
            highScoreCounter.setScore(scoreCounter.score);
            highScoreCounter.color = paddle.color;
            highScoreCounter.saveValue('highscore');
        }

        backgroundColor = getRandomColor(5);
    }

    // Check for bounds leaving
    if ( ball.left < 0 ) {
        ball.left = 0;
        ball.xVel = 0-ball.xVel;
    }

    if ( ball.left+ball.size > canvas.width ) {
        ball.left = canvas.width-ball.size;
        ball.xVel = 0-ball.xVel;
    }

    if ( ball.top < 0 ) {
        ball.top = 0;
        ball.yVel = 0-ball.yVel;
    }

    // See if the ball left the bottom, so the player loses
    if ( ball.top+ball.size > canvas.height ) {
        // Show last score if it isn't a highscore
        if ( scoreCounter.score > 0 && scoreCounter.score != highScoreCounter.score ) {
            lastScoreCounter.setLifeTime(90);
            lastScoreCounter.setScore(scoreCounter.score);
            lastScoreCounter.color = "rgb(255,0,0)";
            lastScoreCounter.font = "18px serif";
            lastScoreCounter.yVel = 1;
            lastScoreCounter.top = canvas.height / 2;
        }

        // Reset game state
        ball.left = canvas.width/2;
        ball.top = canvas.height/4;
        ball.xVel = 1;
        ball.yVel = 2;
        paddle.left = canvas.width/2;
        paddle.color = getRandomColor(60);
        backgroundColor = "#000";
        scoreCounter.score = 0;
    }

    // Redraw next animation frame
    draw();

    // Next browser frame, tick the game again
    requestAnimationFrame(gameUpdate);
}

// Listen to key presses
document.addEventListener('keydown', function(event) {
    if ( event.keyCode == 37 ) {
        leftDown = true;
    }
    else if ( event.keyCode == 39 ) {
        rightDown = true;
    }
});

document.addEventListener('keyup', function(event) {
    if ( event.keyCode == 37 ) {
        leftDown = false;
    }
    else if ( event.keyCode == 39 ) {
        rightDown = false;
    }
});

// Listen to mouse presses
document.addEventListener('mousedown', function(event) {
    if ( event.button == 0 ) {
        mouseDown = true;
        var mousePos = getMousePosition(canvas, event);
        mouseX = mousePos.x;
        mouseY = mousePos.y;
    }
});

document.addEventListener('mouseup', function(event) {
    if ( event.button == 0 ) {
        mouseDown = false;
    }
});

// Update mouse position when the button is held
document.addEventListener('mousemove', function(event) {
    if ( mouseDown ) {
        var mousePos = getMousePosition(canvas, event);
        mouseX = mousePos.x;
        mouseY = mousePos.y;
    }
});

// Listen to touch events
document.addEventListener('touchstart', function(event) {
    event.preventDefault();
    mouseDown = true;
    var touchPos = getTouchPosition(canvas, event);
    mouseX = touchPos.x;
    mouseY = touchPos.y;
});

document.addEventListener('touchend', function(event) {
    event.preventDefault();
    mouseDown = false;
});

document.addEventListener('touchmove', function(event) {
    event.preventDefault();
    if ( mouseDown ) {
        var touchPos = getTouchPosition(canvas, event);
        mouseX = touchPos.x;
        mouseY = touchPos.y;
    }
});

console.log("Starting Squash...");

// Updates the game state every time the browser requests a new frame
gameUpdate(0);