let gameWidth, gameHeight;
let unit;
let scape = [];
let midId;
let c;
let score = 0;
let segmentScore = 0, isInSegment = 0, previousSegmentScore = 0;
let mode, modeQueue = [], modeTimer = 0;

// for extendScape
let blockTop = 0, blockBottom = 0, callCount = 0, modder = 1, modderBound = 1, freq1=1/3, freq2=1/4, theta = 0, speed = 1, walker = 0, walker2 = 0, specialTimer = 0;
function setup() {
  createCanvas(windowWidth, windowHeight);
  gameWidth = min(width, height);
  gameHeight = gameWidth;
  unit = ceil(0.006 * gameWidth);
  midId = floor(gameWidth / unit / 2);
  c = {
    x: 0,
    y: -gameHeight / 2,
  };
  getModeFromQueue();

  // Force system resets across all desktop and mobile edge cases
  window.addEventListener('blur', forceResetSystemInputs);
  window.addEventListener('focus', forceResetSystemInputs);
  window.addEventListener('pagehide', forceResetSystemInputs);
  
  // Catches cases where a user drags out and back into the canvas area
  let canvasElement = document.getElementById('defaultCanvas0');
  if (canvasElement) {
    canvasElement.addEventListener('mouseover', (e) => {
      if (!e.buttons) { // If they aren't actively holding a physical button
        forceResetSystemInputs();
      }
    });
  }
}

function draw() {
  background(0);
  push();
  translate((width - gameWidth) / 2, (height - gameHeight) / 2);

  modeTimer--;
  if (modeTimer <= 0) {
    getModeFromQueue();
    modeTimer = 500;
  }

  if (scape.length > 0) {
    scape.splice(0, 1);
    c.x += unit;
  }
  while (scape.length * unit < gameWidth) {
    extendScape(mode);
  }

  // FIX: Validate that mouse is physically pressed AND inside the game window canvas coordinates
  let isMouseValid = mouseIsPressed && mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;

  if (keyIsDown(87) || isMouseValid) {
    scape[midId].hit += 1;
    score += scape[midId].score;
    if (isInSegment === 1) {
      segmentScore += scape[midId].score;
    }
  }
  
  push();
  scale(1, -1);
  translate(0, c.y);
  fill(100, 100, 160);
  rect(0, -gameHeight / 2, gameWidth, gameHeight);
  for (let i = 0; i < scape.length; i++) {
    let x = i * unit, y = scape[i].score * gameHeight * 0.95;

    noStroke();
    if (scape[i].hit) {
      if (scape[i].score >= 0) {
        fill(0, 255, 100, map(scape[i].score, 0, 0.5, 40, 255));
      }
      else {
        fill(200, 0, 0, map(scape[i].score, 0, -0.5, 40, 255));
      }
      rect(x - unit / 2, -gameHeight / 2, unit, gameHeight);
    }
    else {
      fill(0);
      ellipse(x, y, unit, unit);
    }

    if (i > 0) {
      let prevX = (i-1) * unit, prevY = scape[i-1].score * gameHeight * 0.95;
      strokeWeight(unit / 4);
      stroke(0);
      line(x, y, prevX, prevY);
    }

    if (i === midId) {
      stroke(255);
      line(x, -gameHeight / 2, x, gameHeight / 2);
    }
  }
  stroke(255);
  line(0, 0, gameWidth, 0);
  pop();

  pop();

  textSize(70);
  fill(0);  
  textAlign(LEFT, TOP);
  if (score >= 0) {
    fill(0, 255, 100);
  }
  else {
    fill(200, 0, 0);
  }
  text(score.toFixed(3), 20, 20);
  if (!isInSegment) {
    textAlign(LEFT, BOTTOM);
    if (previousSegmentScore >= 0) {
      fill(0, 255, 100);
    }
    else {
      fill(200, 0, 0);
    }
    text(previousSegmentScore.toFixed(3), 20, height - 20);
  }
}

function extendScape(mode) {
  let scapeEndX = scape.length * unit + c.x;
  let microNoise = noise(scapeEndX * 0.017, 123) * 2 - 1;
  let macroNoise = noise(scapeEndX * 0.003, 456) * 2 - 1;
  let newScore;
  callCount++;

  switch (mode) {
    case 0: // "uniform"
      newScore = random(-0.33, 0.3);
      break;
    case 1: // "upspikes"
      newScore = -0.2 + random(0, 0.01) + 0.5 * (abs(microNoise) % 0.5 > 0.38 && abs(microNoise) % 0.5 < 0.45);
      break;
    case 2: // "downspikes"
      newScore = 0.01 - 0.5 * (microNoise < -0.3);
      break;
    case 3: // "stalagmites"
      newScore = sq(microNoise) * 0.8 - 0.2 + sq(macroNoise) * 0.5;
      break;
    case 4: // "stalactites"
      newScore = macroNoise * 0.07 + 0.05 - sq(microNoise) * 2;
      break;
    case 5: // "sine"
      newScore = 0.3 * sin(scapeEndX / 15) - 0.12;
      break;
    case 6: // "sinechops"
      newScore = 0.3 * sin(scapeEndX / 20);
      if (abs(macroNoise) % 0.4 < 0.2) {
        newScore *= -1;
      }
      newScore -= 0.15;
      break;
    case 7: // sinedance
      if (random(0, 80) < 1) {
        freq1 = random(0.02, 0.4);
        freq2 = random(0.02, 0.4);
      }
      if (callCount % 2) {
        newScore = sin(callCount * freq1) * 0.25;
      }
      else {
        newScore = sin(callCount * freq2 - 1) * 0.25;
      }
      newScore -= 0.12;
      break;
    case 8: // "blocks"
      if (random(0, 8) < 1) {
        blockTop = random(0, 0.3);
        blockBottom = random(0, -0.45);
      }
      if (callCount % 2) {
        newScore = blockTop;
      }
      else {
        newScore = blockBottom;
      }
      break;
    case 9: // "weirdblocks"
      if (callCount % 20 === 0) {
        blockTop = random(0, 0.25);
        blockBottom = random(0, -0.45);
        if (random(0, 2) < 1) {
          modder = 3;
          modderBound = floor(random(1, 3));
        }
        else {
          modder = 4;
          modderBound = floor(random(1, 4));
        }
      }
      if (callCount % modder >= modderBound) {
        newScore = blockTop;
      }
      else {
        newScore = blockBottom;
      }
      break;
    case 10: // "densityblocks"
      blockTop = 0.2;
      blockBottom = -0.4;
      if (random(0, 8) < 1) {
        if (random(0, 2) < 1) {
          modder = 3;
          modderBound = floor(random(1, 3));
        }
        else {
          modder = 4;
          modderBound = floor(random(1, 4));
        }
      }
      if (callCount % modder >= modderBound) {
        newScore = blockTop;
      }
      else {
        newScore = blockBottom;
      }
      break;
    case 11: // "sniperworld"
      newScore = -0.15;
      if (random(0, 1) < 0.2) {
        newScore = 0.35;
      }
      break;
    case 12: // "obfuscation"
      newScore = macroNoise * 0.4 - 0.15 + random(-0.6, 0.6);
      break;
    case 13: // "density"
      newScore = macroNoise * 0.8 + random(-1.6, 1.2);
      break;
    case 14: // "metavariance"
      newScore = macroNoise * 0.4 - 0.15 + random(-1, 1) * sq(microNoise);
      break;
    case 15: // "hillhill"
      newScore = macroNoise * 0.4 - 0.1 + sin(callCount / 2) * 0.1;
      break;
    case 16: // "lillyhill"
      newScore = sin(callCount / 50) * 0.2 + macroNoise * 0.25 + microNoise * 0.25 - 0.2;
      break;
    case 17: // "wiggle"
      newScore = sin(callCount / 20 + sin(callCount * 0.37) + sin(callCount * 0.23) + macroNoise * 3) * 0.2 - 0.05;
      break;
    case 18: // "silly"
      newScore = callCount % 20 * 0.0025;
      if (macroNoise + microNoise < 0.2) {
        newScore *= -4;
      }
      newScore += microNoise * 0.2;
      break;
    case 19: // "snipercircus"
      newScore = random(-200000, 100000);
      break;
    case 20: // "gaussian"
      newScore = randomGaussian() * 0.15 - 0.015;
      break;
    case 21: // "picnic"
      newScore = sin(callCount / 40) * 0.02;
      break;
    case 22: // "sinesine"
      newScore = sin(callCount / 10 + sin(callCount / 10)) * 0.2;
      break;
    case 23: // "sinecosinesine"
      newScore = sin(callCount / 20 + cos(callCount / 20 + sin(callCount / 20))) * 0.3;
      break;
    case 24: // "sinetimewarp"
      newScore = sin(callCount / 20 + sin(callCount / 20 * 3.7)) * 0.2;
      break;
    case 25: // "speedslide"
      speed = 0.2 + 0.15 * sin(callCount / 60);
      theta += speed;
      newScore = sin(theta) * speed;
      break;
    case 26: // "speedshift"
      speed = 0.2 + 0.15 * Math.sign(sin(callCount / 60)) * pow(abs(sin(callCount/60)), 0.3);
      theta += speed;
      newScore = sin(theta) * speed;
      break;
    case 27: // "speedswitch"
      theta += speed;
      if (theta > 2 * PI) {
        theta -= 2 * PI;
        speed = sq(random(0.4, 1.8)) * 0.2;
      }
      newScore = sin(theta) * speed;
      break;
    case 28: // "speedup"
      theta += speed;
      if (theta > 2 * PI) {
        theta -= 2 * PI;
        speed *= 1.15;
        if (speed >= 3) {
          speed = 0.06;
        }
      }
      newScore = sin(theta) * speed;
      break;
    case 29: // "speedupfast"
      theta += speed;
      if (theta > 2 * PI) {
        theta -= 2 * PI;
        speed *= 1.4;
        if (speed >= 10) {
          speed = 0.06;
        }
      }
      newScore = sin(theta) * speed;
      break;
    case 30: // "cowboy"
      newScore = sin(callCount * 0.12) * 0.12 + sin(callCount * 0.25 + 1) * 0.12;
      break;
    case 31: // "cowboyslow"
      newScore = sin(callCount * 0.08) * 0.1 + sin(callCount * 0.17 + 1) * 0.1;
      break;  
    case 32: // "cowboytoofast"
      newScore = sin(callCount * 0.2) * 0.22 + sin(callCount * 0.41 + 1) * 0.22;
      break;
    case 33: // "walkerleash"
      walker *= 0.9;
      walker += random(-0.1, 0.1);
      newScore = walker;
      break;
    case 34: // "stepperleash"
      walker *= 0.6;
      if (random(0, 2) < 1) {
        walker += 0.15;
      }
      else {
        walker -= 0.15;
      }
      newScore = walker;
      break;
    case 35: // "stepperlikeszero"
      if (random(-0.3, 0.3) > walker) {
        walker += 0.05;
      }
      else {
        walker -= 0.05;
      }
      newScore = walker;
      break;
    case 36: // "walkermoodswing"
      walker *= 0.6;
      walker += random(-1, 1) * pow(1 + sin(callCount / 40), 3) * 0.06;
      newScore = walker;
      break;
    case 37: // "walkerloop"
      walker += random(-0.1, 0.1);
      if (walker > 0.5) {
        walker--;
      }
      if (walker < -0.5) {
        walker++;
      }
      newScore = walker;
      break;
    case 38: // "walkerdownloop"
      if (walker > 0) {
        walker += random(-0.06, 0);
      }
      else {
        walker += random(-0.08, 0.07);
        if (walker < -0.5) {
          walker++;
        }
      }
      newScore = walker;
      break;
    case 39: // "walkerlikesdistraction"
      if (random(-0.45, -0.3) > walker) {
        walker += 0.05;
      }
      else {
        walker -= 0.05;
      }
      if (random(0, 300) < 1) {
        specialTimer = 8;
      }
      if (specialTimer > 0) {
        specialTimer--;
        newScore = 0.5;
      }
      else {
        specialTimer = 0;
        newScore = walker;
      }
      break;
    case 40: // ataleoftwowalkers
      walker *= 0.99;
      walker += random(-0.1, 0.1);
      walker = constrain(walker, 0, 0.5);
      walker2 *= 0.99;
      walker2 += random(-0.1, 0.1);
      walker2 = constrain(walker2, -0.5, 0);
      if (callCount % 2) {
        newScore = walker;
      }
      else {
        newScore = walker2;
      }
      break;
    default:
      newScore = 0.05;
      break;
  }
  newScore = constrain(newScore, -0.5, 0.5);
  scape.push({
    score: newScore,
    hit: 0,
  });
}

function makeModeQueue(modeStart = 0, modeEnd = 22) {
  modeQueue = [];
  for (let i = 0; i < modeEnd - modeStart; i++) {
    modeQueue.push(modeStart + i);
    let swap = modeQueue[i];
    let j = floor(random(0, i));
    modeQueue[i] = modeQueue[j];
    modeQueue[j] = swap;
  }
}

function getModeFromQueue() {
  if (modeQueue.length === 0) {
    makeModeQueue(40, 41);
  }
  mode = modeQueue.pop();
}

// FIX: Dedicated global segment reset logic used by handlers
function resetSegmentScore() {
  if (isInSegment === 1) {
    isInSegment = 0;
    previousSegmentScore = segmentScore;
    segmentScore = 0;
  }
}

function keyPressed() {
  if (key.toString() === "w") {
    isInSegment = 1;
  }
}

function keyReleased() {
  if (key.toString() === "w") {
    resetSegmentScore();
  }
}

function touchStarted() {
  isInSegment = 1;
  return false; 
}

function touchEnded() {
  resetSegmentScore();
  return false;
}

function forceResetSystemInputs() {
  // Clear your game's tracking variables
  isInSegment = 0;
  previousSegmentScore = segmentScore;
  segmentScore = 0;
  
  // Clear p5.js's global system inputs completely
  mouseIsPressed = false;
  if (typeof touches !== 'undefined') {
    touches = []; 
  }
}