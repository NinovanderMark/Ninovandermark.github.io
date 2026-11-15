// Squashanoid - Nino van der Mark
// Created with Claude Code based on on Squash for One 

(function() {

// ----------------------
// Game Data (tweak at will)
// ----------------------

// Every letter that can be used in a level layout. Colour is purely visual.
// Add a new letter here and it can be used in LEVELS straight away.
var BLOCK_TYPES = {
    R: { name: "Red",    color: "#e53935" },
    G: { name: "Green",  color: "#43a047" },
    B: { name: "Blue",   color: "#1e88e5" },
    Y: { name: "Yellow", color: "#fdd835" },
    O: { name: "Orange", color: "#fb8c00" },
    P: { name: "Purple", color: "#8e24aa" },
    W: { name: "White",  color: "#eeeeee" }
};

// Powerups that can drop from destroyed blocks. A higher weight drops more often.
// effect is one of: score (adds value), multiball, laser, colorwipe, burst (fires projectiles), grow (makes the balls in play bigger)
var POWERUPS = [
    { effect: "score",     value: 100, label: "+100",  color: "#26a69a", weight: 30 },
    { effect: "score",     value: 200, label: "+200",  color: "#f9a825", weight: 20 },
    { effect: "score",     value: 500, label: "+500",  color: "#e53935", weight: 5  },
    { effect: "multiball",              label: "+BALL", color: "#5c6bc0", weight: 20 },
    { effect: "laser",                  label: "LASER", color: "#00acc1", weight: 15 },
    { effect: "colorwipe",              label: "WIPE",  color: "#ffffff", weight: 15 }, // Cycles through the block colours
    { effect: "burst",                  label: "BURST", color: "#ff7043", weight: 15 },
    { effect: "grow",                   label: "GROW",  color: "#ec407a", weight: 15 }
];

// How points popping up from destroyed blocks look, depending on the amount. The highest tier at or below the amount is used.
// The colour "rainbow" cycles through all colours. Tiers from shockwave on also send out a ring and shake the screen.
var SCORE_POPUP_TIERS = [
    { min: 0,    size: 14, color: "#ffffff", glow: 0,  sparkles: 0 },
    { min: 50,   size: 18, color: "#fff59d", glow: 6,  sparkles: 0 },
    { min: 150,  size: 24, color: "#ffcc80", glow: 12, sparkles: 1 },
    { min: 400,  size: 30, color: "#ff8a65", glow: 18, sparkles: 2 },
    { min: 1000, size: 38, color: "rainbow", glow: 24, sparkles: 3, shockwave: true },
    { min: 3000, size: 48, color: "rainbow", glow: 32, sparkles: 5, shockwave: true }
];

// Global settings.
var SETTINGS = {
    lives: 3,
    ballSpeed: 5,        // Pixels per frame at 60fps in the first level. Stays constant during a level.
    ballSpeedIncrease: 0.25, // Added to the ball speed for every level completed
    ballSize: 8,
    paddleWidth: 100,
    paddleHeight: 14,
    paddleSpeed: 10,
    paddleDrag: 2,
    paddleTilt: 25,      // Degrees the paddle surface tilts at its far edges, as if it were curved
    paddleInfluence: 0.5, // How much the paddle's sideways movement is added to the ball (0 = none)
    blockWidth: 27,
    blockHeight: 14,
    blockGap: 2,
    gridTop: 60,         // Distance between the top of the canvas and the first block row
    gridColumns: 29,     // Widest level that fits the canvas. Narrower levels are centred.
    frontRowPoints: 10,  // Score for a block in the front row (the last row of a level)
    pointsPerRow: 2,     // Extra score for every row further back
    chargeNeeded: 3,     // Blocks the ball has to clear before its next block hit explodes
    explosionRadius: 45, // Pixels around the hit block that are destroyed by an explosion
    explosionGrowth: 0.5, // Extra explosion radius, as a fraction of explosionRadius, each time the ball size doubles
    powerupChance: 0.2,  // Chance that a destroyed block drops a powerup
    powerupCooldownSeconds: 1, // After a powerup drops, no other can drop for this long
    powerupSpeed: 2.5,   // Pixels per frame at 60fps that a powerup falls
    powerupWidth: 46,
    powerupHeight: 18,
    extraBallAngle: 15,  // Degrees from straight up that an extra ball is launched, alternating left and right
    maxBalls: 12,
    laserChargeSeconds: 2,
    laserWidth: 14,      // Width of the laser beam in pixels
    colorCycleFrames: 20, // Frames a colour-wipe powerup shows each colour
    projectileCount: 6,  // Projectiles fired by the burst powerup
    projectileSpread: 45, // Degrees to each side of straight up that the burst covers
    projectileSize: 6,
    assistBlockCount: 5, // When fewer blocks than this are left, balls gently curve sideways towards the nearest one
    assistTurnRate: 0.015, // Radians per frame at 60fps that the curve can turn a ball
    maxBallSize: 64,     // The grow powerup stops growing the ball at this size, in pixels
    comboWindowSeconds: 1, // A block hit this soon after the previous one raises the score multiplier by 1. Without a hit in this time it resets to x1.
    hudHeight: 52,       // Score popups stay below this height, so they don't run into the score text
    skipLevelKey: 78     // Key code that skips the current level, for testing (78 = N)
};

// Level layouts. One string per row, one character per block.
// Use a letter from BLOCK_TYPES for a block, and "." or a space for an empty spot.
// Rows can be shorter than gridColumns. A level is centred on the canvas by its longest row.
// A block is about twice as wide as it is tall, so a shape looks square when each of its pixels is 1 block wide and 2 rows tall.
// Keep levels to 18 rows or fewer, so there is room for the ball.
// The last row is the front row. It scores the least, and every row behind it scores more.
// After the last level the game starts over at the first one, with a higher ball speed.
var LEVELS = [
    // Rainbow
    {
        rows: [
            "RRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
            "RRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
            "OOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
            "YYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
            "YYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "GGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
            "BBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
            "PPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
            "PPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
        ]
    },
    // Checkers
    {
        rows: [
            "WWRRWWRRWWRRWWRRWWRRWWRRWWRR",
            "WWRRWWRRWWRRWWRRWWRRWWRRWWRR",
            "RRWWRRWWRRWWRRWWRRWWRRWWRRWW",
            "RRWWRRWWRRWWRRWWRRWWRRWWRRWW",
            "GGBBGGBBGGBBGGBBGGBBGGBBGGBB",
            "GGBBGGBBGGBBGGBBGGBBGGBBGGBB",
            "BBGGBBGGBBGGBBGGBBGGBBGGBBGG",
            "BBGGBBGGBBGGBBGGBBGGBBGGBBGG",
            "YYPPYYPPYYPPYYPPYYPPYYPPYYPP",
            "YYPPYYPPYYPPYYPPYYPPYYPPYYPP",
            "PPYYPPYYPPYYPPYYPPYYPPYYPPYY",
            "PPYYPPYYPPYYPPYYPPYYPPYYPPYY"
        ]
    },
    // Diamonds
    {
        rows: [
            "..............R..............",
            "....RR.......RRR.......BB....",
            "....RR.......RPR.......BB....",
            "...RRRR.....RRPRR.....BBBB...",
            "...ROOR.....RPBPR.....BGGB...",
            "..RROORR...RRPBPRR...BBGGBB..",
            "..ROYYOR...RPBWBPR...BGYYGB..",
            ".RROYYORR.RRPBWBPRR.BBGYYGBB.",
            ".ROYWWYOR.RPBWWWBPR.BGYWWYGB.",
            ".RROYYORR.RRPBWBPRR.BBGYYGBB.",
            "..ROYYOR...RPBWBPR...BGYYGB..",
            "..RROORR...RRPBPRR...BBGGBB..",
            "...ROOR.....RPBPR.....BGGB...",
            "...RRRR.....RRPRR.....BBBB...",
            "....RR.......RPR.......BB....",
            "....RR.......RRR.......BB....",
            "..............R.............."
        ]
    },
    // Invaders
    {
        rows: [
            "...G.....G.........RRRR.....",
            "...G.....G.........RRRR.....",
            "....G...G.......RRRRRRRRRR..",
            "....G...G.......RRRRRRRRRR..",
            "...GGGGGGG.....RRRRRRRRRRRR.",
            "...GGGGGGG.....RRRRRRRRRRRR.",
            "..GG.GGG.GG....RRR..RR..RRR.",
            "..GG.GGG.GG....RRR..RR..RRR.",
            ".GGGGGGGGGGG...RRRRRRRRRRRR.",
            ".GGGGGGGGGGG...RRRRRRRRRRRR.",
            ".G.GGGGGGG.G......RR..RR....",
            ".G.GGGGGGG.G......RR..RR....",
            ".G.G.....G.G.....RR.RR.RR...",
            ".G.G.....G.G.....RR.RR.RR...",
            "....GG.GG......RR........RR.",
            "....GG.GG......RR........RR."
        ]
    },
    // Hearts
    {
        rows: [
            "...........RRR.RRR...........",
            "...........RRR.RRR...........",
            "..........RWWRRRRRR..........",
            "..........RWWRRRRRR..........",
            ".PP.PP...RRRRRRRRRRR...OO.OO.",
            ".PP.PP...RRRRRRRRRRR...OO.OO.",
            "PPPPPPP..RRRRRRRRRRR..OOOOOOO",
            "PPPPPPP..RRRRRRRRRRR..OOOOOOO",
            "PPPPPPP...RRRRRRRRR...OOOOOOO",
            "PPPPPPP...RRRRRRRRR...OOOOOOO",
            ".PPPPP.....RRRRRRR.....OOOOO.",
            ".PPPPP.....RRRRRRR.....OOOOO.",
            "..PPP.......RRRRR.......OOO..",
            "..PPP.......RRRRR.......OOO..",
            "...P.........RRR.........O...",
            "...P.........RRR.........O...",
            "..............R..............",
            "..............R.............."
        ]
    },
    // Equalizer
    {
        rows: [
            ".........GG...............",
            ".........GG...............",
            ".........GG....PP.........",
            ".........GG....PP.........",
            "......YY.GG....PP.........",
            "......YY.GG....PP....RR...",
            "......YY.GG.BB.PP....RR...",
            "......YY.GG.BB.PP....RR...",
            "...OO.YY.GG.BB.PP....RR...",
            "...OO.YY.GG.BB.PP.WW.RR...",
            "...OO.YY.GG.BB.PP.WW.RR...",
            "...OO.YY.GG.BB.PP.WW.RR.OO",
            "RR.OO.YY.GG.BB.PP.WW.RR.OO",
            "RR.OO.YY.GG.BB.PP.WW.RR.OO",
            "RR.OO.YY.GG.BB.PP.WW.RR.OO",
            "RR.OO.YY.GG.BB.PP.WW.RR.OO",
            "RR.OO.YY.GG.BB.PP.WW.RR.OO",
            "RR.OO.YY.GG.BB.PP.WW.RR.OO"
        ]
    },
    // Fortress
    {
        rows: [
            "PPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
            "PPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
            "P...........................P",
            "P...........................P",
            "P.BBBBBBBBBBBBBBBBBBBBBBBBB.P",
            "P.BBBBBBBBBBBBBBBBBBBBBBBBB.P",
            "P.B.......................B.P",
            "P.B.......................B.P",
            "P.B.WWWWWWWWWWWWWWWWWWWWW.B.P",
            "P.B.WWWWWWWWWWWWWWWWWWWWW.B.P",
            "P.B.......................B.P",
            "P.B.......................B.P",
            "P.BBBBBBBBBBBBBBBBBBBBBBBBB.P",
            "P.BBBBBBBBBBBBBBBBBBBBBBBBB.P",
            "P...........................P",
            "P...........................P",
            "PPPPPPPPPPPPPPPPPPPPPPPPPPPPP",
            "PPPPPPPPPPPPPPPPPPPPPPPPPPPPP"
        ]
    },
    // Diagonal
    {
        rows: [
            "RRRROOOOYYYYGGGGBBBBPPPPRRRRO",
            "RROOOOYYYYGGGGBBBBPPPPRRRROOO",
            "OOOOYYYYGGGGBBBBPPPPRRRROOOOY",
            "OOYYYYGGGGBBBBPPPPRRRROOOOYYY",
            "YYYYGGGGBBBBPPPPRRRROOOOYYYYG",
            "YYGGGGBBBBPPPPRRRROOOOYYYYGGG",
            "GGGGBBBBPPPPRRRROOOOYYYYGGGGB",
            "GGBBBBPPPPRRRROOOOYYYYGGGGBBB",
            "BBBBPPPPRRRROOOOYYYYGGGGBBBBP",
            "BBPPPPRRRROOOOYYYYGGGGBBBBPPP",
            "PPPPRRRROOOOYYYYGGGGBBBBPPPPR",
            "PPRRRROOOOYYYYGGGGBBBBPPPPRRR",
            "RRRROOOOYYYYGGGGBBBBPPPPRRRRO",
            "RROOOOYYYYGGGGBBBBPPPPRRRROOO"
        ]
    },
    // Triangles
    {
        rows: [
            "RRRRRRRRR.....Y.....BBBBBBBBB",
            "RRRRRRRRR.....Y.....BBBBBBBBB",
            "RRRRRRRRR....YYY....BBBBBBBBB",
            ".RRRRRRR.....YYY.....BBBBBBB.",
            ".RRRRRRR.....YYY.....BBBBBBB.",
            ".RRRRRRR.....YYY.....BBBBBBB.",
            ".RRRRRRR....YYYYY....BBBBBBB.",
            "..RRRRR.....YYYYY.....BBBBB..",
            "..RRRRR.....YYYYY.....BBBBB..",
            "..RRRRR.....YYYYY.....BBBBB..",
            "..RRRRR....YYYYYYY....BBBBB..",
            "...RRR.....YYYYYYY.....BBB...",
            "...RRR.....YYYYYYY.....BBB...",
            "...RRR.....YYYYYYY.....BBB...",
            "...RRR....YYYYYYYYY....BBB...",
            "....R.....YYYYYYYYY.....B....",
            "....R.....YYYYYYYYY.....B...."
        ]
    },
    // Smileys
    {
        rows: [
            "..YYYYY.....OOOOO.....WWWWW..",
            "..YYYYY.....OOOOO.....WWWWW..",
            ".YYYYYYY...OOOOOOO...WWWWWWW.",
            ".YYYYYYY...OOOOOOO...WWWWWWW.",
            "YY.YYY.YY.OO.OOO.OO.WW.WWW.WW",
            "YY.YYY.YY.OO.OOO.OO.WW.WWW.WW",
            "YY.YYY.YY.OO.OOO.OO.WW.WWW.WW",
            "YY.YYY.YY.OO.OOO.OO.WW.WWW.WW",
            "YYYYYYYYY.OOOOOOOOO.WWWWWWWWW",
            "YYYYYYYYY.OOOOOOOOO.WWWWWWWWW",
            "Y..YYY..Y.O..OOO..O.W..WWW..W",
            "Y..YYY..Y.O..OOO..O.W..WWW..W",
            "YY.....YY.OO.....OO.WW.....WW",
            "YY.....YY.OO.....OO.WW.....WW",
            ".YYYYYYY...OOOOOOO...WWWWWWW.",
            ".YYYYYYY...OOOOOOO...WWWWWWW.",
            "..YYYYY.....OOOOO.....WWWWW..",
            "..YYYYY.....OOOOO.....WWWWW.."
        ]
    },
    // Bricks
    {
        rows: [
            "RRRR.OOOO.OOOO.RRRR.RRRR.RRRR",
            "RRRR.OOOO.OOOO.RRRR.RRRR.RRRR",
            "R.RRRR.RRRR.RRRR.OOOO.OOOO.RR",
            "R.RRRR.RRRR.RRRR.OOOO.OOOO.RR",
            "RRRR.RRRR.RRRR.RRRR.RRRR.OOOO",
            "RRRR.RRRR.RRRR.RRRR.RRRR.OOOO",
            "R.OOOO.OOOO.RRRR.RRRR.RRRR.RR",
            "R.OOOO.OOOO.RRRR.RRRR.RRRR.RR",
            "RRRR.RRRR.OOOO.OOOO.RRRR.RRRR",
            "RRRR.RRRR.OOOO.OOOO.RRRR.RRRR",
            "R.RRRR.RRRR.RRRR.RRRR.OOOO.OO",
            "R.RRRR.RRRR.RRRR.RRRR.OOOO.OO",
            "OOOO.RRRR.RRRR.RRRR.RRRR.RRRR",
            "OOOO.RRRR.RRRR.RRRR.RRRR.RRRR",
            "R.RRRR.OOOO.OOOO.RRRR.RRRR.RR",
            "R.RRRR.OOOO.OOOO.RRRR.RRRR.RR"
        ]
    },
    // Hourglasses
    {
        rows: [
            ".PPPPPPPPPPPPP.PPPPPPPPPPPPP.",
            "..BBBBBBBBBBB...BBBBBBBBBBB..",
            "..BBBBBBBBBBB...BBBBBBBBBBB..",
            "...BBBBBBBBB.....BBBBBBBBB...",
            "....BYYYYYB.......BYYYYYB....",
            ".....BYYYB.........BYYYB.....",
            ".....BYYYB.........BYYYB.....",
            "......BYB...........BYB......",
            ".......W.............W.......",
            ".......W.............W.......",
            "......BBB...........BBB......",
            ".....BBBBB.........BBBBB.....",
            ".....BBBBB.........BBBBB.....",
            "....BBBBBBB.......BBBBBBB....",
            "...BYYYYYYYB.....BYYYYYYYB...",
            "..BYYYYYYYYYB...BYYYYYYYYYB..",
            "..BYYYYYYYYYB...BYYYYYYYYYB..",
            ".PPPPPPPPPPPPP.PPPPPPPPPPPPP."
        ]
    },
    // Ziggurat
    {
        rows: [
            "............WWWWW............",
            "............WWWWW............",
            "..........PPPPPPPPP..........",
            "..........PPPPPPPPP..........",
            "........BBBBBBBBBBBBB........",
            "........BBBBBBBBBBBBB........",
            "......GGGGGGGGGGGGGGGGG......",
            "......GGGGGGGGGGGGGGGGG......",
            "....YYYYYYYYYYYYYYYYYYYYY....",
            "....YYYYYYYYYYYYYYYYYYYYY....",
            "..OOOOOOOOOOOOOOOOOOOOOOOOO..",
            "..OOOOOOOOOOOOOOOOOOOOOOOOO..",
            "RRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
            "RRRRRRRRRRRRRRRRRRRRRRRRRRRRR"
        ]
    },
    // NINO
    {
        rows: [
            "RR...R.YYYYYY.GG...G..BBBB.",
            "RR...R.YYYYYY.GG...G..BBBB.",
            "RR...R...YY...GG...G.B....B",
            "RR...R...YY...GG...G.B....B",
            "R.R..R...YY...G.G..G.B....B",
            "R.R..R...YY...G.G..G.B....B",
            "R.R..R...YY...G.G..G.B....B",
            "R..R.R...YY...G..G.G.B....B",
            "R..R.R...YY...G..G.G.B....B",
            "R..R.R...YY...G..G.G.B....B",
            "R..R.R...YY...G..G.G.B....B",
            "R...RR...YY...G...GG.B....B",
            "R...RR.YYYYYY.G...GG..BBBB.",
            "R...RR.YYYYYY.G...GG..BBBB."
        ]
    }
];

// ----------------------
// General Functions
// ----------------------

// Function to check if two rectangles overlap
function overlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2+w2 && x1+w1 > x2 && y1 < y2+h2 && y1+h1 > y2;
}

// Gets a coordinate on the canvas, corrected for CSS scaling
function getPositionOnCanvas(canvas, xPos, yPos) {
    var rect = canvas.getBoundingClientRect();
    var widthFactor = canvas.width / rect.width;
    var heightFactor = canvas.height / rect.height;

    return {
        x: ( xPos - rect.left ) * widthFactor,
        y: ( yPos - rect.top ) * heightFactor
    };
}

// Get the mouse position
function getMousePosition(canvas, event) {
    return getPositionOnCanvas(canvas, event.clientX, event.clientY);
}

// Get touch position
function getTouchPosition(canvas, event) {
    return getPositionOnCanvas(canvas, event.changedTouches.item(0).clientX, event.changedTouches.item(0).clientY);
}

// Writes a number with a period between every thousand, so 12345 becomes 12.345
function formatNumber(value) {
    return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Storage that survives being blocked by the browser
function loadNumber(name) {
    try {
        var value = parseInt(localStorage.getItem(name), 10);
        return isNaN(value) ? 0 : value;
    }
    catch (e) {
        return 0;
    }
}

function saveNumber(name, value) {
    try {
        localStorage.setItem(name, value);
    }
    catch (e) {
        // Storage is unavailable, the highscore just won't be kept
    }
}

// ----------------------
// Object Definitions
// ----------------------

// Block object
function Block(xPos, yPos, type, points) {
    this.left = xPos;
    this.top = yPos;
    this.width = SETTINGS.blockWidth - SETTINGS.blockGap;
    this.height = SETTINGS.blockHeight - SETTINGS.blockGap;
    this.type = BLOCK_TYPES[type];
    this.points = points;
}

Block.prototype.draw = function(drawContext) {
    drawContext.fillStyle = this.type.color;
    drawContext.fillRect(this.left, this.top, this.width, this.height);

    // Highlight along the top edge
    drawContext.fillStyle = "rgba(255, 255, 255, 0.25)";
    drawContext.fillRect(this.left, this.top, this.width, 3);
};

// Paddle object
function Paddle(xPos, yPos, paddleWidth, paddleHeight, moveSpeed) {
    this.left = xPos;
    this.top = yPos;
    this.color = "#fff";
    this.width = paddleWidth;
    this.height = paddleHeight;
    this.moveSpeed = moveSpeed;
    this.drag = SETTINGS.paddleDrag;
    this.xVel = 0;
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

// Ball object. The speed is fixed, only the direction ever changes.
function Ball(ballSize, speed) {
    this.left = 0;
    this.top = 0;
    this.color = "#fff";
    this.size = ballSize;
    this.speed = speed;
    this.xVel = 0;
    this.yVel = 0;
    this.charge = 0;
}

Ball.prototype.draw = function(drawContext) {
    if ( this.charge > 0 ) {
        // The more charged, the redder and the bigger the glow. A full charge pulses.
        var level = Math.min(1, this.charge / SETTINGS.chargeNeeded);
        var hue = Math.round(60 * (1 - level));
        var pulse = level >= 1 ? 0.5 + 0.5 * Math.sin(Date.now() / 70) : 0;
        var halo = this.size / 2 + 3 + level * 4 + pulse * 3;

        drawContext.fillStyle = "hsla(" + hue + ", 100%, 60%, " + (0.12 + level * 0.18 + pulse * 0.15) + ")";
        drawContext.beginPath();
        drawContext.arc(this.left + this.size / 2, this.top + this.size / 2, halo, 0, Math.PI * 2);
        drawContext.fill();
        drawContext.fillStyle = "hsl(" + hue + ", 100%, 65%)";
    }
    else {
        drawContext.fillStyle = this.color;
    }

    drawContext.fillRect(this.left, this.top, this.size, this.size);
};

// Point the ball in a direction, angle is in radians from straight up
Ball.prototype.setDirection = function(angle) {
    this.xVel = this.speed * Math.sin(angle);
    this.yVel = -this.speed * Math.cos(angle);
};

// Rescale the velocity to the ball's fixed speed, keeping its direction
Ball.prototype.normalise = function() {
    var length = Math.sqrt(this.xVel*this.xVel + this.yVel*this.yVel);

    if ( length > 0 ) {
        this.xVel = this.xVel / length * this.speed;
        this.yVel = this.yVel / length * this.speed;
    }
};

// Bounce off the paddle like a curved surface that is also moving:
// - where the ball lands tilts the surface, so edges send the ball sideways
// - the incoming angle is mirrored in that tilted surface, so how the ball arrives matters
// - the paddle's own sideways movement is added on top
// The speed is then reset, so only the direction changes.
Ball.prototype.bounceOffPaddle = function(paddleObject) {
    var hitPosition = ((this.left + this.size/2) - (paddleObject.left + paddleObject.width/2)) / (paddleObject.width/2);
    hitPosition = Math.max(-1, Math.min(1, hitPosition));

    // Normal of the tilted paddle surface
    var tilt = hitPosition * SETTINGS.paddleTilt * Math.PI / 180;
    var normalX = Math.sin(tilt);
    var normalY = -Math.cos(tilt);

    // Mirror the velocity in the surface, if the ball is moving into it
    var into = this.xVel*normalX + this.yVel*normalY;
    if ( into < 0 ) {
        this.xVel -= 2 * into * normalX;
        this.yVel -= 2 * into * normalY;
    }

    this.yVel = -Math.abs(this.yVel); // Always leave upwards
    this.xVel += paddleObject.xVel * SETTINGS.paddleInfluence;

    this.normalise();
    this.keepSteep();
};

// Keep the ball from travelling almost horizontally, which would take forever
Ball.prototype.keepSteep = function() {
    var minVertical = this.speed * 0.25;

    if ( Math.abs(this.yVel) < minVertical ) {
        this.yVel = this.yVel < 0 ? -minVertical : minVertical;
        var horizontal = Math.sqrt(this.speed*this.speed - this.yVel*this.yVel);
        this.xVel = this.xVel < 0 ? -horizontal : horizontal;
    }
};

// ----------------------
// Program Start
// ----------------------

// Set up the environment
var canvas = document.getElementById("canvas");
var context = canvas.getContext('2d');

// Set up game variables
var paddle = new Paddle(0, canvas.height - 40, SETTINGS.paddleWidth, SETTINGS.paddleHeight, SETTINGS.paddleSpeed);
var balls = [];
var ballSpeed = SETTINGS.ballSpeed; // Speed of the balls in the current level
var blocks = [];

// Powerups
var powerups = [];
var projectiles = []; // Shots from the burst powerup
var powerupCooldown = 0; // Frames until another powerup may drop
var laser = null; // While the laser is charging: { time, total }
var beams = [];
var floaters = []; // Text that floats up when a powerup is picked up

// Score multiplier
var clock = 0; // Frames at 60fps since the game started
var lastHitTime = -Infinity; // Clock value at the last block hit
var comboBase = 1; // The multiplier at the last block hit
var comboTexts = []; // The multiplier text that crosses the screen after a hit
var scorePopups = []; // Points that fly up from destroyed blocks
var scoreEvent = null; // Collects the points of blocks destroyed together, so they show as one popup

// Explosion effects
var particles = [];
var shockwaves = [];
var shake = 0; // Frames of screen shake left
var flash = null; // Screen flash: { color, life, maxLife, strength }

var state = "ready"; // ready, playing, levelclear, gameover
var levelsCompleted = 0; // Never wraps, so the ball speed keeps rising after the last level
var score = 0;
var highScore = loadNumber('squashanoid-highscore');
var lives = SETTINGS.lives;

// Set up control variables
var leftDown = false;
var rightDown = false;
var mouseDown = false;
var mouseX = 0;
var lastFrameTime = 0;

// Builds the blocks of the current level from its data and resets the paddle and ball
function loadLevel() {
    var level = LEVELS[levelsCompleted % LEVELS.length];

    blocks = [];
    particles = [];
    shockwaves = [];
    shake = 0;
    flash = null;
    floaters = [];
    powerupCooldown = 0;
    comboBase = 1;
    lastHitTime = -Infinity;
    comboTexts = [];
    scorePopups = [];
    scoreEvent = null;

    // Centre the level by its longest row
    var levelColumns = 0;
    for ( var r = 0; r < level.rows.length; r++ ) {
        levelColumns = Math.max(levelColumns, Math.min(level.rows[r].length, SETTINGS.gridColumns));
    }
    var gridLeft = (canvas.width - levelColumns * SETTINGS.blockWidth) / 2;

    for ( var row = 0; row < level.rows.length; row++ ) {
        for ( var col = 0; col < SETTINGS.gridColumns && col < level.rows[row].length; col++ ) {
            var letter = level.rows[row].charAt(col).toUpperCase();

            if ( BLOCK_TYPES.hasOwnProperty(letter) ) {
                blocks.push(new Block(
                    gridLeft + col * SETTINGS.blockWidth + (SETTINGS.blockGap / 2),
                    SETTINGS.gridTop + row * SETTINGS.blockHeight + (SETTINGS.blockGap / 2),
                    letter,
                    SETTINGS.frontRowPoints + SETTINGS.pointsPerRow * (level.rows.length - 1 - row)
                ));
            }
        }
    }

    ballSpeed = SETTINGS.ballSpeed + SETTINGS.ballSpeedIncrease * levelsCompleted;
    resetBall();
}

// Puts a fresh ball on the paddle, waiting to be launched
function resetBall() {
    paddle.left = (canvas.width - paddle.width) / 2;
    paddle.xVel = 0;
    clearPowerups();
    balls = [ new Ball(SETTINGS.ballSize, ballSpeed) ];
    placeBallOnPaddle();
    state = "ready";
}

function placeBallOnPaddle() {
    balls[0].left = paddle.left + (paddle.width - balls[0].size) / 2;
    balls[0].top = paddle.top - balls[0].size;
}

// Removes everything a powerup left behind, for when the ball is lost or the level ends
function clearPowerups() {
    powerups = [];
    projectiles = [];
    beams = [];
    laser = null;
}

function startNewGame() {
    score = 0;
    lives = SETTINGS.lives;
    levelsCompleted = 0;
    loadLevel();
}

// Handles the launch, tap, or click action depending on the game state
function action() {
    if ( state === "ready" ) {
        balls[0].setDirection((Math.random() - 0.5) * 0.6);
        state = "playing";
    }
    else if ( state === "levelclear" ) {
        levelsCompleted++;
        loadLevel();
    }
    else if ( state === "gameover" ) {
        startNewGame();
    }
}

function addScore(value) {
    score += value;

    if ( score > highScore ) {
        highScore = score;
        saveNumber('squashanoid-highscore', highScore);
    }
}

// The score multiplier right now: it is back to x1 when no block was hit for more than the combo window
function currentMultiplier() {
    return clock - lastHitTime < SETTINGS.comboWindowSeconds * 60 ? comboBase : 1;
}

// Registers a block being hit. A hit soon after the previous one raises the multiplier.
// Above x1 the multiplier appears in the middle of the screen and drifts towards one of the edges, no further than its own size.
function registerHit() {
    var multiplier = currentMultiplier();

    if ( clock - lastHitTime < SETTINGS.comboWindowSeconds * 60 ) {
        multiplier++;
    }

    comboBase = multiplier;
    lastHitTime = clock;

    if ( multiplier > 1 ) {
        var edge = Math.floor(Math.random() * 4); // Left, right, top or bottom

        comboTexts.push({
            value: multiplier,
            startX: canvas.width / 2,
            startY: canvas.height / 2,
            x: canvas.width / 2,
            y: canvas.height / 2,
            dirX: edge === 0 ? -1 : (edge === 1 ? 1 : 0),
            dirY: edge === 2 ? -1 : (edge === 3 ? 1 : 0),
            distance: getComboSize(multiplier),
            life: 0,
            maxLife: 40
        });
    }
}

// Starts collecting the points of blocks that are destroyed together
function beginScoreEvent() {
    scoreEvent = { points: 0, x: 0, y: 0, count: 0 };
}

// Shows everything collected since beginScoreEvent as one popup, above the middle of the destroyed blocks
function endScoreEvent() {
    if ( scoreEvent && scoreEvent.count > 0 ) {
        showScorePopup(scoreEvent.points, scoreEvent.x / scoreEvent.count, scoreEvent.y / scoreEvent.count);
    }

    scoreEvent = null;
}

function showScorePopup(points, x, y) {
    var tier = 0;

    for ( var i = 0; i < SCORE_POPUP_TIERS.length; i++ ) {
        if ( points >= SCORE_POPUP_TIERS[i].min ) {
            tier = i;
        }
    }

    var maxLife = 50 + tier * 12;
    var speed = 1.4 + tier * 0.15;

    // How far the points would rise before they fade, with the slow-down applied in updateEffects
    var rise = speed * (1 - Math.pow(0.985, maxLife)) / 0.015;

    // The room between the block and the score text at the top. Points rise as far as that allows,
    // and blocks with almost no room above them get points that drift down instead.
    var size = SCORE_POPUP_TIERS[tier].size;
    var room = y - 6 - SETTINGS.hudHeight - size;
    var rises = room >= 24;

    scorePopups.push({
        text: "+" + formatNumber(points),
        tier: tier,
        x: x,
        y: rises ? y - 6 : Math.max(y + SETTINGS.blockHeight + 6, SETTINGS.hudHeight + size),
        xVel: (Math.random() - 0.5) * 0.6,
        yVel: rises ? -speed * Math.min(1, room / rise) : speed,
        life: 0,
        maxLife: maxLife,
        hueOffset: Math.random() * 360
    });

    // The best amounts get a ring and a shake as well
    if ( SCORE_POPUP_TIERS[tier].shockwave ) {
        shockwaves.push({ x: x, y: y, life: 0, maxLife: 20, maxRadius: 50 + tier * 12 });
        shake = Math.max(shake, 4 + tier);
    }
}

// Moves a ball a small step and handles everything it can hit.
// Returns false when the ball has left the bottom of the canvas.
function stepBall(ball, stepX, stepY) {
    var touched;

    // Horizontal movement
    ball.left += stepX;

    if ( ball.left < 0 ) {
        ball.left = 0;
        ball.xVel = -ball.xVel;
    }
    else if ( ball.left + ball.size > canvas.width ) {
        ball.left = canvas.width - ball.size;
        ball.xVel = -ball.xVel;
    }
    else {
        touched = getTouchedBlocks(ball);

        if ( touched.length > 0 ) {
            ball.left -= stepX;
            ball.xVel = -ball.xVel;
            hitBlocks(ball, touched);
        }
    }

    // Vertical movement
    ball.top += stepY;

    if ( ball.top < 0 ) {
        ball.top = 0;
        ball.yVel = -ball.yVel;
    }
    else {
        touched = getTouchedBlocks(ball);

        if ( touched.length > 0 ) {
            ball.top -= stepY;
            ball.yVel = -ball.yVel;
            hitBlocks(ball, touched);
        }
    }

    // Paddle, only when coming down onto its top half
    if ( ball.yVel > 0 && ball.top + ball.size/2 < paddle.top + paddle.height/2 &&
        overlap(ball.left, ball.top, ball.size, ball.size, paddle.left, paddle.top, paddle.width, paddle.height) ) {
        ball.top = paddle.top - ball.size;
        ball.bounceOffPaddle(paddle);
    }
    else {
        ball.keepSteep();
    }

    return ball.top <= canvas.height;
}

// Every block a ball is touching right now. A bigger ball touches more of them.
function getTouchedBlocks(ball) {
    var touched = [];

    for ( var i = 0; i < blocks.length; i++ ) {
        if ( overlap(ball.left, ball.top, ball.size, ball.size, blocks[i].left, blocks[i].top, blocks[i].width, blocks[i].height) ) {
            touched.push(blocks[i]);
        }
    }

    return touched;
}

// Handles a ball hitting blocks: this counts as one hit for the multiplier. A charged ball explodes
// around the block nearest its centre, otherwise it destroys every block it touches and charges for each one.
function hitBlocks(ball, touched) {
    var ballX = ball.left + ball.size / 2;
    var ballY = ball.top + ball.size / 2;
    var nearest = touched[0];
    var nearestDistance = Infinity;
    var i;

    for ( i = 0; i < touched.length; i++ ) {
        var dx = touched[i].left + touched[i].width / 2 - ballX;
        var dy = touched[i].top + touched[i].height / 2 - ballY;

        if ( dx*dx + dy*dy < nearestDistance ) {
            nearestDistance = dx*dx + dy*dy;
            nearest = touched[i];
        }
    }

    registerHit();
    beginScoreEvent();

    if ( ball.charge >= SETTINGS.chargeNeeded ) {
        explode(ball, nearest);
    }
    else {
        for ( i = 0; i < touched.length; i++ ) {
            destroyBlock(blocks.indexOf(touched[i]), "ball", ballX, ballY);
            ball.charge++;
        }
    }

    endScoreEvent();
}

// Removes a block, scores it and throws debris away from a point (the block's own centre by default).
// Only blocks destroyed by a ball or an explosion can drop a powerup.
function destroyBlock(index, source, fromX, fromY) {
    var block = blocks[index];

    var awarded = block.points * currentMultiplier();

    addScore(awarded);

    if ( scoreEvent ) {
        scoreEvent.points += awarded;
        scoreEvent.x += block.left + block.width / 2;
        scoreEvent.y += block.top;
        scoreEvent.count++;
    }
    else {
        showScorePopup(awarded, block.left + block.width / 2, block.top);
    }

    spawnDebris(block,
        fromX === undefined ? block.left + block.width / 2 : fromX,
        fromY === undefined ? block.top + block.height / 2 : fromY);
    blocks.splice(index, 1);

    if ( (source === "ball" || source === "explosion") && powerupCooldown <= 0 && Math.random() < SETTINGS.powerupChance ) {
        dropPowerup(block);
    }
}

// Destroys the block and every block around it, and discharges the ball
function explode(ball, target) {
    var centerX = target.left + target.width / 2;
    var centerY = target.top + target.height / 2;

    // A grown ball explodes bigger: a share of the base radius for every doubling of its size
    var doublings = Math.max(0, Math.log(ball.size / SETTINGS.ballSize) / Math.LN2);
    var radius = SETTINGS.explosionRadius * (1 + SETTINGS.explosionGrowth * doublings);

    for ( var i = blocks.length - 1; i >= 0; i-- ) {
        var dx = (blocks[i].left + blocks[i].width / 2) - centerX;
        var dy = (blocks[i].top + blocks[i].height / 2) - centerY;

        if ( dx*dx + dy*dy <= radius * radius ) {
            destroyBlock(i, "explosion", centerX, centerY);
        }
    }

    shockwaves.push({ x: centerX, y: centerY, life: 0, maxLife: 24, maxRadius: radius * 1.5 });
    shake = 14;
    flash = { color: "#ffdc96", life: 14, maxLife: 14, strength: 0.15 };
    ball.charge = 0;
}

// ----------------------
// Powerups
// ----------------------

// Picks a powerup type, favouring the ones with a higher weight
function pickPowerupType() {
    var totalWeight = 0;
    var i;

    for ( i = 0; i < POWERUPS.length; i++ ) {
        totalWeight += POWERUPS[i].weight;
    }

    var roll = Math.random() * totalWeight;

    for ( i = 0; i < POWERUPS.length; i++ ) {
        roll -= POWERUPS[i].weight;
        if ( roll < 0 ) {
            return POWERUPS[i];
        }
    }

    return POWERUPS[0];
}

// Lets a powerup fall from where a block was
function dropPowerup(block) {
    powerups.push({
        type: pickPowerupType(),
        left: block.left + block.width / 2 - SETTINGS.powerupWidth / 2,
        top: block.top,
        width: SETTINGS.powerupWidth,
        height: SETTINGS.powerupHeight,
        age: 0
    });

    powerupCooldown = SETTINGS.powerupCooldownSeconds * 60;
}

// The block colour a colour-wipe powerup is showing right now
function getWipeLetter(powerup) {
    var letters = Object.keys(BLOCK_TYPES);
    return letters[Math.floor(powerup.age / SETTINGS.colorCycleFrames) % letters.length];
}

// Applies a caught powerup
function applyPowerup(powerup) {
    var type = powerup.type;
    var label = type.label;

    if ( type.effect === "score" ) {
        addScore(type.value);
    }
    else if ( type.effect === "multiball" ) {
        addExtraBall();
    }
    else if ( type.effect === "laser" ) {
        laser = { time: SETTINGS.laserChargeSeconds * 60, total: SETTINGS.laserChargeSeconds * 60 };
    }
    else if ( type.effect === "burst" ) {
        fireBurst();
    }
    else if ( type.effect === "grow" ) {
        for ( var i = 0; i < balls.length; i++ ) {
            growBall(balls[i]);
        }
    }
    else if ( type.effect === "colorwipe" ) {
        var letter = getWipeLetter(powerup);
        label = "CLEAR";
        wipeColor(letter);
    }

    floaters.push({ text: label, x: powerup.left + powerup.width / 2, y: paddle.top - 10, life: 0, maxLife: 60, color: type.effect === "colorwipe" ? BLOCK_TYPES[getWipeLetter(powerup)].color : type.color });
}

// Gently curves a ball sideways towards the nearest block, to help finish a level.
// Only the horizontal direction is corrected, so the ball keeps moving up or down the way it was.
function steerTowardBlocks(ball, speedFactor) {
    var ballX = ball.left + ball.size / 2;
    var ballY = ball.top + ball.size / 2;
    var closest = Infinity;
    var targetDx = 0;
    var targetDy = 0;

    for ( var i = 0; i < blocks.length; i++ ) {
        var dx = (blocks[i].left + blocks[i].width / 2) - ballX;
        var dy = (blocks[i].top + blocks[i].height / 2) - ballY;

        if ( dx*dx + dy*dy < closest ) {
            closest = dx*dx + dy*dy;
            targetDx = dx;
            targetDy = dy;
        }
    }

    if ( closest === Infinity ) {
        return;
    }

    // Angles are measured from straight up or down, positive towards the right
    var vertical = ball.yVel < 0 ? -1 : 1;
    var angle = Math.atan2(ball.xVel, Math.abs(ball.yVel));
    var wanted = Math.atan2(targetDx, Math.max(Math.abs(targetDy), 1));
    var maxTurn = SETTINGS.assistTurnRate * speedFactor;

    angle += Math.max(-maxTurn, Math.min(maxTurn, wanted - angle));
    ball.xVel = ball.speed * Math.sin(angle);
    ball.yVel = vertical * ball.speed * Math.cos(angle);
    ball.keepSteep();
}

// Shoots projectiles from the middle of the paddle, spread evenly across an arc
function fireBurst() {
    var count = SETTINGS.projectileCount;
    var x = paddle.left + paddle.width / 2;

    for ( var i = 0; i < count; i++ ) {
        var degrees = count === 1 ? 0 : -SETTINGS.projectileSpread + 2 * SETTINGS.projectileSpread * i / (count - 1);
        var projectile = new Ball(SETTINGS.projectileSize, ballSpeed);

        projectile.color = "#ffd740";
        projectile.left = x - projectile.size / 2;
        projectile.top = paddle.top - projectile.size;
        projectile.setDirection(degrees * Math.PI / 180);
        projectiles.push(projectile);
    }

    shockwaves.push({ x: x, y: paddle.top, life: 0, maxLife: 12, maxRadius: 36 });
}

// Moves a projectile a small step. It acts like a ball, but is used up by the first block it hits or the top of the field.
// Returns false when the projectile is used up.
function stepProjectile(projectile, stepX, stepY) {
    var i;

    // Horizontal movement
    projectile.left += stepX;

    if ( projectile.left < 0 ) {
        projectile.left = 0;
        projectile.xVel = -projectile.xVel;
    }
    else if ( projectile.left + projectile.size > canvas.width ) {
        projectile.left = canvas.width - projectile.size;
        projectile.xVel = -projectile.xVel;
    }

    // Vertical movement
    projectile.top += stepY;

    if ( projectile.top <= 0 ) {
        return false;
    }

    for ( i = 0; i < blocks.length; i++ ) {
        if ( overlap(projectile.left, projectile.top, projectile.size, projectile.size, blocks[i].left, blocks[i].top, blocks[i].width, blocks[i].height) ) {
            registerHit();
            destroyBlock(i, "ball", projectile.left, projectile.top + projectile.size);
            return false;
        }
    }

    return true;
}

// Grows a ball by its starting size around its centre, up to the maximum size. Stacks with every pickup.
function growBall(ball) {
    var newSize = Math.min(ball.size + SETTINGS.ballSize, SETTINGS.maxBallSize);

    if ( newSize <= ball.size ) {
        return;
    }

    var centerX = ball.left + ball.size / 2;
    var centerY = ball.top + ball.size / 2;

    ball.size = newSize;
    ball.left = Math.max(0, Math.min(canvas.width - newSize, centerX - newSize / 2));
    ball.top = Math.max(0, centerY - newSize / 2);

    shockwaves.push({ x: centerX, y: centerY, life: 0, maxLife: 14, maxRadius: newSize * 1.2 });
}

// Launches an extra ball from the paddle, at the starting size and speed, a little off straight up
function addExtraBall() {
    if ( balls.length >= SETTINGS.maxBalls ) {
        return;
    }

    var extra = new Ball(SETTINGS.ballSize, ballSpeed);
    var side = balls.length % 2 === 0 ? 1 : -1;

    extra.left = paddle.left + (paddle.width - extra.size) / 2;
    extra.top = paddle.top - extra.size;
    extra.setDirection(side * SETTINGS.extraBallAngle * Math.PI / 180);
    balls.push(extra);
}

// Destroys every block of one colour
function wipeColor(letter) {
    beginScoreEvent();

    for ( var i = blocks.length - 1; i >= 0; i-- ) {
        if ( blocks[i].type === BLOCK_TYPES[letter] ) {
            destroyBlock(i, "wipe", canvas.width / 2, canvas.height / 2);
        }
    }

    endScoreEvent();

    shake = 8;
    flash = { color: BLOCK_TYPES[letter].color, life: 20, maxLife: 20, strength: 0.25 };
}

// Fires the laser straight up from the middle of the paddle, destroying every block in the way
function fireLaser() {
    var x = paddle.left + paddle.width / 2;
    var half = SETTINGS.laserWidth / 2;

    beginScoreEvent();

    for ( var i = blocks.length - 1; i >= 0; i-- ) {
        if ( blocks[i].left < x + half && blocks[i].left + blocks[i].width > x - half ) {
            destroyBlock(i, "laser", x, blocks[i].top + blocks[i].height / 2);
        }
    }

    endScoreEvent();

    beams.push({ x: x, life: 0, maxLife: 18 });
    shake = 8;
    flash = { color: "#a0ffff", life: 10, maxLife: 10, strength: 0.2 };
}

function updatePowerups(speedFactor) {
    var i;

    powerupCooldown = Math.max(0, powerupCooldown - speedFactor);

    for ( i = powerups.length - 1; i >= 0; i-- ) {
        var powerup = powerups[i];
        powerup.top += SETTINGS.powerupSpeed * speedFactor;
        powerup.age += speedFactor;

        if ( state === "playing" && overlap(powerup.left, powerup.top, powerup.width, powerup.height, paddle.left, paddle.top, paddle.width, paddle.height) ) {
            applyPowerup(powerup);
            powerups.splice(i, 1);
        }
        else if ( powerup.top > canvas.height ) {
            powerups.splice(i, 1);
        }
    }

    // Charge the laser, then fire it
    if ( laser ) {
        laser.time -= speedFactor;

        if ( laser.time <= 0 ) {
            laser = null;
            fireLaser();
        }
    }

    for ( i = beams.length - 1; i >= 0; i-- ) {
        beams[i].life += speedFactor;

        if ( beams[i].life >= beams[i].maxLife ) {
            beams.splice(i, 1);
        }
    }

    for ( i = floaters.length - 1; i >= 0; i-- ) {
        floaters[i].life += speedFactor;
        floaters[i].y -= 0.8 * speedFactor;

        if ( floaters[i].life >= floaters[i].maxLife ) {
            floaters.splice(i, 1);
        }
    }
}

function drawPowerups(drawContext) {
    var i;

    drawContext.font = "bold 12px sans-serif";

    for ( i = 0; i < powerups.length; i++ ) {
        var p = powerups[i];
        var color = p.type.effect === "colorwipe" ? BLOCK_TYPES[getWipeLetter(p)].color : p.type.color;
        var textWidth = drawContext.measureText(p.type.label).width;
        var textLeft = p.left + (p.width - textWidth) / 2;
        var textTop = p.top + p.height / 2 + 4;

        drawContext.fillStyle = color;
        drawContext.fillRect(p.left, p.top, p.width, p.height);
        drawContext.strokeStyle = "#fff";
        drawContext.lineWidth = 2;
        drawContext.strokeRect(p.left + 1, p.top + 1, p.width - 2, p.height - 2);

        // Outlined text, so it reads on every colour
        drawContext.lineWidth = 3;
        drawContext.strokeStyle = "#000";
        drawContext.strokeText(p.type.label, textLeft, textTop);
        drawContext.fillStyle = "#fff";
        drawContext.fillText(p.type.label, textLeft, textTop);
    }
}

function drawProjectiles(drawContext) {
    for ( var i = 0; i < projectiles.length; i++ ) {
        var p = projectiles[i];
        var length = Math.sqrt(p.xVel*p.xVel + p.yVel*p.yVel);
        var centerX = p.left + p.size / 2;
        var centerY = p.top + p.size / 2;

        // A short trail behind the projectile
        drawContext.strokeStyle = "rgba(255, 215, 64, 0.4)";
        drawContext.lineWidth = p.size / 2;
        drawContext.beginPath();
        drawContext.moveTo(centerX, centerY);
        drawContext.lineTo(centerX - p.xVel / length * 14, centerY - p.yVel / length * 14);
        drawContext.stroke();

        drawContext.fillStyle = p.color;
        drawContext.fillRect(p.left, p.top, p.size, p.size);
    }
}

// Draws the laser charging up on the paddle, and the beams
function drawLaser(drawContext) {
    var i;

    if ( laser ) {
        var progress = 1 - laser.time / laser.total;
        var x = paddle.left + paddle.width / 2;

        // Aiming line, and a glow that grows as the laser charges
        drawContext.fillStyle = "rgba(160, 255, 255, " + (0.08 + progress * 0.3) + ")";
        drawContext.fillRect(x - 1, 0, 2, paddle.top);

        drawContext.fillStyle = "rgba(160, 255, 255, " + (0.3 + progress * 0.5) + ")";
        drawContext.beginPath();
        drawContext.arc(x, paddle.top, 4 + progress * 12, 0, Math.PI * 2);
        drawContext.fill();
    }

    for ( i = 0; i < beams.length; i++ ) {
        var fade = 1 - beams[i].life / beams[i].maxLife;
        var width = SETTINGS.laserWidth;

        drawContext.fillStyle = "rgba(120, 255, 255, " + (fade * 0.5) + ")";
        drawContext.fillRect(beams[i].x - width, 0, width * 2, paddle.top);
        drawContext.fillStyle = "rgba(255, 255, 255, " + fade + ")";
        drawContext.fillRect(beams[i].x - width / 2, 0, width, paddle.top);
    }
}

function drawFloaters(drawContext) {
    drawContext.font = "bold 16px sans-serif";

    for ( var i = 0; i < floaters.length; i++ ) {
        var f = floaters[i];
        var textWidth = drawContext.measureText(f.text).width;

        drawContext.globalAlpha = Math.min(1, (1 - f.life / f.maxLife) * 2);
        drawContext.lineWidth = 3;
        drawContext.strokeStyle = "#000";
        drawContext.strokeText(f.text, f.x - textWidth / 2, f.y);
        drawContext.fillStyle = f.color;
        drawContext.fillText(f.text, f.x - textWidth / 2, f.y);
    }

    drawContext.globalAlpha = 1;
}

// Throws a few pieces of a destroyed block away from a point
function spawnDebris(block, centerX, centerY) {
    for ( var i = 0; i < 4; i++ ) {
        var x = block.left + Math.random() * block.width;
        var y = block.top + Math.random() * block.height;

        particles.push({
            x: x,
            y: y,
            xVel: (x - centerX) * 0.07 + (Math.random() - 0.5) * 2,
            yVel: (y - centerY) * 0.07 + (Math.random() - 0.5) * 2 - 1,
            size: 2 + Math.random() * 3,
            color: block.type.color,
            life: 30 + Math.random() * 25,
            maxLife: 55
        });
    }
}

function updateEffects(speedFactor) {
    var i;

    for ( i = particles.length - 1; i >= 0; i-- ) {
        var p = particles[i];
        p.x += p.xVel * speedFactor;
        p.y += p.yVel * speedFactor;
        p.yVel += 0.15 * speedFactor; // Gravity
        p.life -= speedFactor;

        if ( p.life <= 0 ) {
            particles.splice(i, 1);
        }
    }

    for ( i = shockwaves.length - 1; i >= 0; i-- ) {
        shockwaves[i].life += speedFactor;

        if ( shockwaves[i].life >= shockwaves[i].maxLife ) {
            shockwaves.splice(i, 1);
        }
    }

    if ( shake > 0 ) {
        shake = Math.max(0, shake - speedFactor);
    }

    if ( flash ) {
        flash.life -= speedFactor;

        if ( flash.life <= 0 ) {
            flash = null;
        }
    }

    // The multiplier text flies up and away, leaving sparkles behind
    for ( i = comboTexts.length - 1; i >= 0; i-- ) {
        var text = comboTexts[i];
        text.life += speedFactor;

        // Drift out and slow down, ending up exactly one text size away
        var travel = text.distance * (1 - Math.pow(1 - Math.min(1, text.life / text.maxLife), 2));
        text.x = text.startX + text.dirX * travel;
        text.y = text.startY + text.dirY * travel;

        if ( Math.random() < 0.6 * speedFactor ) {
            particles.push({
                x: text.x + (Math.random() - 0.5) * 24,
                y: text.y - Math.random() * 14,
                xVel: (Math.random() - 0.5) * 0.8,
                yVel: -0.3 - Math.random() * 0.6,
                size: 1.5 + Math.random() * 1.5,
                color: "hsl(" + getComboHue(text.value) + ", 100%, 85%)",
                life: 14 + Math.random() * 10,
                maxLife: 24
            });
        }

        if ( text.life >= text.maxLife ) {
            comboTexts.splice(i, 1);
        }
    }

    // Points rise from the blocks, and the better amounts throw sparkles
    for ( i = scorePopups.length - 1; i >= 0; i-- ) {
        var popup = scorePopups[i];
        var tier = SCORE_POPUP_TIERS[popup.tier];
        popup.x += popup.xVel * speedFactor;
        popup.y += popup.yVel * speedFactor;
        popup.yVel *= Math.pow(0.985, speedFactor);
        popup.life += speedFactor;

        if ( tier.sparkles > 0 && Math.random() < tier.sparkles * 0.25 * speedFactor ) {
            particles.push({
                x: popup.x + (Math.random() - 0.5) * tier.size * 2,
                y: popup.y - Math.random() * tier.size,
                xVel: (Math.random() - 0.5) * 1.2,
                yVel: -0.2 - Math.random() * 0.8,
                size: 1.5 + Math.random() * 2,
                color: tier.color === "rainbow" ? "hsl(" + Math.round(Math.random() * 360) + ", 100%, 80%)" : "#fffbe0",
                life: 16 + Math.random() * 14,
                maxLife: 30
            });
        }

        if ( popup.life >= popup.maxLife ) {
            scorePopups.splice(i, 1);
        }
    }
}

// Draws the points that fly up from destroyed blocks. The higher the amount, the bigger and brighter.
function drawScorePopups(drawContext) {
    for ( var i = 0; i < scorePopups.length; i++ ) {
        var popup = scorePopups[i];
        var tier = SCORE_POPUP_TIERS[popup.tier];
        var progress = popup.life / popup.maxLife;
        var shimmer = 0.5 + 0.5 * Math.sin(popup.life * 0.6);
        var size = Math.round(tier.size * (1 + Math.max(0, 0.5 - progress * 4)));
        var color = tier.color === "rainbow" ? "hsl(" + Math.round((popup.life * 9 + popup.hueOffset) % 360) + ", 100%, 65%)" : tier.color;

        drawContext.font = "bold " + size + "px sans-serif";
        var width = drawContext.measureText(popup.text).width;

        // Keep the whole text on screen, and below the score text at the top
        var left = Math.max(6, Math.min(canvas.width - 6 - width, popup.x - width / 2));
        var baseline = Math.max(SETTINGS.hudHeight + size, Math.min(canvas.height - 6, popup.y));

        drawContext.globalAlpha = Math.min(1, (1 - progress) * 3);
        drawContext.lineWidth = 3 + popup.tier;
        drawContext.strokeStyle = "rgba(0, 0, 0, 0.65)";
        drawContext.strokeText(popup.text, left, baseline);

        if ( tier.glow > 0 ) {
            drawContext.shadowColor = color;
            drawContext.shadowBlur = tier.glow * (0.7 + 0.3 * shimmer);
        }

        drawContext.fillStyle = color;
        drawContext.fillText(popup.text, left, baseline);
        drawContext.shadowBlur = 0;
    }

    drawContext.globalAlpha = 1;
}

// The text size of a multiplier, which grows with its value
function getComboSize(value) {
    return Math.min(40, 16 + 3 * value);
}

// Each multiplier gets its own colour, starting at gold and moving through red to purple
function getComboHue(value) {
    return (((50 - (value - 2) * 12) % 360) + 360) % 360;
}

// Draws the multiplier as shining text. It pops in, shimmers and fades out.
function drawCombo(drawContext) {
    for ( var i = 0; i < comboTexts.length; i++ ) {
        var text = comboTexts[i];
        var progress = text.life / text.maxLife;
        var hue = getComboHue(text.value);
        var shimmer = 0.5 + 0.5 * Math.sin(text.life * 0.5 + text.value);
        var size = Math.round(getComboSize(text.value) * (1 + Math.max(0, 0.6 - progress * 3)));
        var label = "x" + formatNumber(text.value);

        drawContext.font = "bold " + size + "px sans-serif";
        var left = text.x - drawContext.measureText(label).width / 2;

        drawContext.globalAlpha = Math.min(1, (1 - progress) * 2.5);
        drawContext.lineWidth = 3;
        drawContext.strokeStyle = "rgba(0, 0, 0, 0.6)";
        drawContext.strokeText(label, left, text.y);

        drawContext.shadowColor = "hsl(" + hue + ", 100%, 55%)";
        drawContext.shadowBlur = 10 + shimmer * 14;
        drawContext.fillStyle = "hsl(" + hue + ", 100%, " + Math.round(65 + shimmer * 25) + "%)";
        drawContext.fillText(label, left, text.y);
        drawContext.shadowBlur = 0;
    }

    drawContext.globalAlpha = 1;
}

function drawEffects(drawContext) {
    var i;

    for ( i = 0; i < shockwaves.length; i++ ) {
        var progress = shockwaves[i].life / shockwaves[i].maxLife;

        drawContext.strokeStyle = "rgba(255, 240, 180, " + (1 - progress) + ")";
        drawContext.lineWidth = 1 + 4 * (1 - progress);
        drawContext.beginPath();
        drawContext.arc(shockwaves[i].x, shockwaves[i].y, shockwaves[i].maxRadius * progress, 0, Math.PI * 2);
        drawContext.stroke();
    }

    for ( i = 0; i < particles.length; i++ ) {
        drawContext.globalAlpha = Math.min(1, particles[i].life / particles[i].maxLife * 1.5);
        drawContext.fillStyle = particles[i].color;
        drawContext.fillRect(particles[i].x, particles[i].y, particles[i].size, particles[i].size);
    }

    drawContext.globalAlpha = 1;
}

// ----------------------
// Draw and Update
// ----------------------

// Draws text centered on the canvas
function drawCentered(text, top, font, color) {
    context.font = font;
    context.fillStyle = color;
    context.fillText(text, (canvas.width - context.measureText(text).width) / 2, top);
}

// Draw function
function draw() {
    context.fillStyle = "#000";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Shake the game objects (not the HUD) right after an explosion
    var amplitude = Math.min(shake, 10) / 10 * 5;
    context.save();
    context.translate((Math.random() - 0.5) * 2 * amplitude, (Math.random() - 0.5) * 2 * amplitude);

    // Draw the game objects
    var i;
    for ( i = 0; i < blocks.length; i++ ) {
        blocks[i].draw(context);
    }

    drawLaser(context);
    paddle.draw(context);

    for ( i = 0; i < balls.length; i++ ) {
        balls[i].draw(context);
    }

    drawPowerups(context);
    drawProjectiles(context);
    drawEffects(context);
    drawFloaters(context);
    drawCombo(context);
    drawScorePopups(context);

    context.restore();

    // Brief flash on an explosion, laser or colour wipe
    if ( flash ) {
        context.globalAlpha = flash.strength * flash.life / flash.maxLife;
        context.fillStyle = flash.color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1;
    }

    // Draw the HUD: the score above the highscore in the top centre, the lives in the bottom right
    drawCentered("Score: " + formatNumber(score), 24, "18px serif", "#fff");
    drawCentered("Highscore: " + formatNumber(highScore), 46, "14px serif", "#aaa");

    var livesText = "Lives: " + lives;
    context.font = "18px serif";
    context.fillStyle = "#fff";
    context.fillText(livesText, canvas.width - 10 - context.measureText(livesText).width, canvas.height - 12);

    // Draw state messages
    if ( state === "ready" ) {
        drawCentered("Press space, click or tap to launch", canvas.height / 2 + 100, "20px serif", "#fff");
    }
    else if ( state === "levelclear" ) {
        drawCentered("Level cleared!", canvas.height / 2 + 100, "32px serif", "#fff");
        drawCentered("Press space, click or tap to continue", canvas.height / 2 + 136, "20px serif", "#fff");
    }
    else if ( state === "gameover" ) {
        drawCentered("Game over", canvas.height / 2 + 100, "32px serif", "#e53935");
        drawCentered("Press space, click or tap to try again", canvas.height / 2 + 136, "20px serif", "#fff");
    }
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

    // Use mouse and touch input to move
    if ( mouseDown && mouseX < paddle.left+(paddle.width/2) ) {
        paddle.moveLeft((paddle.left+(paddle.width/2)) - mouseX);
    }
    else if ( mouseDown && mouseX > paddle.left+(paddle.width/2) ) {
        paddle.moveRight(mouseX - (paddle.left+(paddle.width/2)));
    }

    // See how much time passed since the last frame, capped so a stalled tab doesn't teleport the ball
    var timePassed = lastFrameTime === 0 ? 1000/60 : currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    var speedFactor = Math.min((timePassed*60)/1000, 3);
    clock += speedFactor;

    // Tick the paddle
    paddle.tick(speedFactor);
    updateEffects(speedFactor);
    updatePowerups(speedFactor);

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

    if ( state === "ready" ) {
        placeBallOnPaddle();
    }
    else if ( state === "playing" ) {
        // Move each ball in small steps, so it can't skip through blocks or the paddle
        for ( var b = balls.length - 1; b >= 0; b-- ) {
            var ball = balls[b];

            if ( blocks.length < SETTINGS.assistBlockCount ) {
                steerTowardBlocks(ball, speedFactor);
            }

            var distance = ball.speed * speedFactor;
            var steps = Math.max(1, Math.ceil(distance / (ball.size / 2)));

            for ( var s = 0; s < steps; s++ ) {
                if ( !stepBall(ball, ball.xVel*speedFactor/steps, ball.yVel*speedFactor/steps) ) {
                    balls.splice(b, 1);
                    break;
                }

                if ( blocks.length === 0 ) {
                    break;
                }
            }
        }

        // Move the projectiles the same way
        for ( var q = projectiles.length - 1; q >= 0; q-- ) {
            var projectile = projectiles[q];
            var projectileSteps = Math.max(1, Math.ceil(projectile.speed * speedFactor / (projectile.size / 2)));

            for ( var ps = 0; ps < projectileSteps; ps++ ) {
                if ( !stepProjectile(projectile, projectile.xVel*speedFactor/projectileSteps, projectile.yVel*speedFactor/projectileSteps) ) {
                    projectiles.splice(q, 1);
                    break;
                }
            }
        }

        if ( blocks.length === 0 ) {
            state = "levelclear";
            clearPowerups();
        }
        else if ( balls.length === 0 ) {
            // Only losing the last ball costs a life
            lives--;
            if ( lives > 0 ) {
                resetBall();
            }
            else {
                state = "gameover";
                clearPowerups();
            }
        }
    }

    // Redraw next animation frame
    draw();

    // Next browser frame, tick the game again
    requestAnimationFrame(gameUpdate);
}

// ----------------------
// Input
// ----------------------

// Listen to key presses
document.addEventListener('keydown', function(event) {
    if ( event.keyCode == 37 ) {
        leftDown = true;
    }
    else if ( event.keyCode == 39 ) {
        rightDown = true;
    }
    else if ( event.keyCode == 32 ) {
        event.preventDefault(); // Don't scroll the page
        action();
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
canvas.addEventListener('mousedown', function(event) {
    if ( event.button == 0 ) {
        mouseDown = true;
        mouseX = getMousePosition(canvas, event).x;
        action();
    }
});

// Releasing and moving are tracked on the document, so dragging off the canvas still works
document.addEventListener('mouseup', function(event) {
    if ( event.button == 0 ) {
        mouseDown = false;
    }
});

document.addEventListener('mousemove', function(event) {
    if ( mouseDown ) {
        mouseX = getMousePosition(canvas, event).x;
    }
});

// Listen to touch events. They're on the canvas so preventDefault is honoured and the rest of the page still scrolls.
canvas.addEventListener('touchstart', function(event) {
    event.preventDefault();
    mouseDown = true;
    mouseX = getTouchPosition(canvas, event).x;
    action();
}, { passive: false });

canvas.addEventListener('touchend', function(event) {
    event.preventDefault();
    mouseDown = false;
}, { passive: false });

canvas.addEventListener('touchmove', function(event) {
    event.preventDefault();
    if ( mouseDown ) {
        mouseX = getTouchPosition(canvas, event).x;
    }
}, { passive: false });

console.log("Starting Squashanoid...");

// Start the first level and let the browser drive the game loop
startNewGame();
requestAnimationFrame(gameUpdate);

})();
