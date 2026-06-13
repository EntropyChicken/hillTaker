let gameWidth, gameHeight;
let unit;
let scape = [];
let midId;
let c;
let score = 0;
let segmentScore = 0, isInSegment = 0, previousSegmentScore = 0;
let mode = 15;

// for extendScape
let blockTop = 0, blockBottom = 0, callCount = 0, modder = 1, modderBound = 1, freq1=1/3, freq2=1/4;

function setup() {
  createCanvas(windowWidth,windowHeight);
  gameWidth = min(width,height);
  gameHeight = gameWidth;
  unit = ceil(0.0064*gameWidth);
  midId = floor(gameWidth/unit/2);
  c = {
    x:0,
    y:-gameHeight/2,
  };
}

function draw() {
  background(0);
  push();
  translate((width-gameWidth)/2,(height-gameHeight)/2);

  if(random(0,150)<1){
    mode = floor(random(0,22));
    // one time high spike
    // scape.push({
    //   score:0.49,
    //   hits:0,
    // });
  }
  if(scape.length>0){
    scape.splice(0,1);
    c.x+=unit;
  }
  while(scape.length*unit<gameWidth){
    extendScape(mode);
  }
  if(keyIsDown(87)||mouseIsPressed){
    scape[midId].hit+=1;
    score+=scape[midId].score;
    if(isInSegment===1){
      segmentScore+=scape[midId].score;
    }
  }
  
  push();
  scale(1,-1);
  translate(0,c.y);
  fill(100,100,140);
  rect(0,-gameHeight/2,gameWidth,gameHeight);
  for(let i = 0; i<scape.length; i++){
    let x = i*unit, y = scape[i].score*gameHeight*0.95;

    noStroke();
    if(scape[i].hit){
      if(scape[i].score>=0){
        fill(0,255,100,map(scape[i].score,0,0.5,30,255));
      }
      else{
        fill(200,0,0,map(scape[i].score,0,-0.5,20,255));
      }
      rect(x-unit/2,-gameHeight/2,unit,gameHeight);
    }
    else{
      fill(0);
      ellipse(x,y,unit,unit);
    }

    if(i>0){
      let prevX = (i-1)*unit, prevY = scape[i-1].score*gameHeight*0.95;
      strokeWeight(1);
      stroke(0);
      line(x,y,prevX,prevY);
    }

    if(i===midId){
      stroke(255);
      line(x,-gameHeight/2,x,gameHeight/2);
    }
  }
  stroke(255);
  line(0,0,gameWidth,0);
  pop();

  pop();

  textSize(70);
  fill(0);  
  textAlign(LEFT,TOP);
  if(score>=0){
    fill(0,255,100);
  }
  else{
    fill(200,0,0);
  }
  text(score.toFixed(3),20,20);
  if(!isInSegment){
    textAlign(LEFT,BOTTOM);
    if(previousSegmentScore>=0){
      fill(0,255,100);
    }
    else{
      fill(200,0,0);
    }
    text(previousSegmentScore.toFixed(3),20,height-20);
  }
}

function extendScape(mode){
  let scapeEndX = scape.length*unit+c.x;
  let microNoise = noise(scapeEndX*0.017,123)*2-1;
  let macroNoise = noise(scapeEndX*0.003,456)*2-1;
  let newScore;
  callCount++;

  switch(mode){
    case 0: // "uniform"
      newScore = random(-0.33,0.3);
      break;
    case 1: // "upspikes"
      newScore = -0.2+0.5*(microNoise>0.45);
      break;
    case 2: // "downspikes"
      newScore = 0.01-0.5*(microNoise<-0.3);
      break;
    case 3: // "stalagmites"
      newScore = sq(microNoise)*0.8-0.2+sq(macroNoise)*0.5;
      break;
    case 4: // "stalactites"
      newScore = macroNoise*0.07+0.05-sq(microNoise)*2;
      break;
    case 5: // "sine"
      newScore = 0.3*sin(scapeEndX/15)-0.12;
      break;
    case 6: // "sinechops"
      newScore = 0.3*sin(scapeEndX/20);
      if(abs(macroNoise)%0.4<0.2){
        newScore*=-1;
      }
      newScore-=0.15;
      break;
    case 7: // sinedance
      if(random(0,80)<1){
        freq1 = random(0.02,0.4);
        freq2 = random(0.02,0.4);
      }
      if(callCount%2){
        newScore = sin(callCount*freq1)*0.25;
      }
      else{
        newScore = sin(callCount*freq2-1)*0.25;
      }
      newScore-=0.12;
      break;
    case 8: // "blocks"
      if(random(0,8)<1){
        blockTop = random(0,0.3);
        blockBottom = random(0,-0.45);
      }
      if(callCount%2){
        newScore = blockTop;
      }
      else{
        newScore = blockBottom;
      }
      break;
    case 9: // "weirdblocks"
      if(callCount%20===0){
        blockTop = random(0,0.25);
        blockBottom = random(0,-0.45);
        if(random(0,2)<1){
          modder = 3;
          modderBound = floor(random(1,3));
        }
        else{
          modder = 4;
          modderBound = floor(random(1,4));
        }
      }
      if(callCount%modder>=modderBound){
        newScore = blockTop;
      }
      else{
        newScore = blockBottom;
      }
      break;
    case 10: // "densityblocks"
      blockTop = 0.2;
      blockBottom = -0.4;
      if(random(0,8)<1){
        if(random(0,2)<1){
          modder = 3;
          modderBound = floor(random(1,3));
        }
        else{
          modder = 4;
          modderBound = floor(random(1,4));
        }
      }
      if(callCount%modder>=modderBound){
        newScore = blockTop;
      }
      else{
        newScore = blockBottom;
      }
      break;
    case 11: // "sniperworld"
      newScore = -0.15;
      if(random(0,1)<0.2){
        newScore = 0.35;
      }
      break;
    case 12: // "obfuscation"
      newScore = macroNoise*0.4-0.15+random(-0.6,0.6);
      break;
    case 13: // "density"
      newScore = macroNoise*0.8+random(-1.6,1.2);
      break;
    case 14: // "metavariance"
      newScore = macroNoise*0.4-0.15+random(-1,1)*sq(microNoise);
      break;
    case 15: // "hillhill"
      newScore = macroNoise*0.4-0.1+sin(callCount/2)*0.1;
      break;
    case 16: // "lillyhill"
      newScore = sin(callCount/50)*0.2+macroNoise*0.25+microNoise*0.25-0.2;
      break;
    case 17: // "wiggle"
      newScore = sin(callCount/20+sin(callCount*0.37)+sin(callCount*0.23)+macroNoise*3)*0.2-0.05;
      break;
    case 18: // "silly"
      newScore = callCount%20*0.0025;
      if(macroNoise+microNoise<0.2){
        newScore*=-4;
      }
      newScore+=microNoise*0.2;
      break;
    case 19: // "snipercircus"
      newScore = random(-200000,100000);
      break;
    case 20: // "picnic"
      newScore = sin(callCount/40)*0.022-0.005;
      break;
    case 21: // "gaussian"
      newScore = randomGaussian()*0.15-0.015;
      break;
    default:
      newScore = 0.05;
      break;
  }
  newScore = constrain(newScore,-0.5,0.5);
  scape.push({
    score:newScore,
    hit:0,
  });
}

function keyPressed(){
  if(key.toString()==="w"){
    isInSegment = 1;
  }
}
function keyReleased(){
  if(key.toString()==="w"){
    isInSegment = 0;
    previousSegmentScore = segmentScore;
    segmentScore = 0;
  }
}
function touchStarted() {
  isInSegment = 1;
  return false; 
}

function touchEnded() {
  isInSegment = 0;
  previousSegmentScore = segmentScore;
  segmentScore = 0;
  return false;
}