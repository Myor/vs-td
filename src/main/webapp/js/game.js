"use strict";

/* ==== Game-Loops === */
// http://gafferongames.com/game-physics/fix-your-timestep/
// http://codeincomplete.com/posts/2013/12/4/javascript_game_foundations_the_game_loop/

// TODO Jedes Feld hat jetzt einen Loop = überflüssige Arbeit
// vllt. einen "requestAnimationFrame" Loop, der alle Spiele Rendert?

Game.prototype.initLoops = function () {
  this.accumulator = 0; // Sammelt die Frame-Zeiten
  this.passedTime = 0; // Summe aller Frame-Zeiten
  this.slowFactor = 1; // Slow-motion Faktor
  this.lastTime = 0;

  this.frameId;

  this.initGameloop = this.initGameloop.bind(this);
  this.gameloop = this.gameloop.bind(this);
  this.renderloop = this.renderloop.bind(this);
};
// Erster Frame, um initiale Zeit zu setzen
Game.prototype.initGameloop = function (newTime) {
  this.lastTime = newTime;
  this.renderer.render(this.stage);
  this.frameId = requestAnimationFrame(this.gameloop);
};
// Loop mit allen updates
Game.prototype.gameloop = function (newTime) {
  var slowStep = game.step * this.slowFactor;

  var frameTime = newTime - this.lastTime;
  if (frameTime > 500) {
    // Spikes abfangen
    frameTime = 500;
  }
  this.lastTime = newTime;
  this.accumulator += frameTime;
  this.passedTime += frameTime;

  while (this.accumulator >= slowStep) {
    this.simulate(game.step);

    this.accumulator -= slowStep;
  }

  this.updateAnimation(this.passedTime / this.slowFactor, this.accumulator / this.slowFactor);

  this.renderer.render(this.stage);
  this.frameId = requestAnimationFrame(this.gameloop);
};
// Loop nur zum rendern der Stage
Game.prototype.renderloop = function () {
  this.renderer.render(this.stage);
  this.frameId = requestAnimationFrame(this.renderloop);
};

Game.prototype.startGameLoop = function () {
  requestAnimationFrame(this.initGameloop);
};

Game.prototype.stopGameLoop = function () {
  cancelAnimationFrame(this.frameId);
};

Game.prototype.pauseLoop = function () {
  this.isPaused = true;
  cancelAnimationFrame(this.frameId);
  this.frameId = requestAnimationFrame(this.renderloop);
};
Game.prototype.resumeLoop = function () {
  this.isPaused = false;
  cancelAnimationFrame(this.frameId);
  this.startGameLoop();
};

// Physik update / Kollisionsabfragen
Game.prototype.simulate = function (dt) {
  var i, j, tower, mob, dist, collArray;
  var towers = this.towers.getArray();
  var mobs = this.mobs.getArray();

//    game.updateWave();

  for (i = 0; i < towers.length; i++) {
    tower = towers[i];
    tower.beforeCollide();
  }

  for (i = 0; i < mobs.length; i++) {
    mob = mobs[i];

    mob.age += dt;
    mob.simulateToAge(mob.age);

    collArray = this.collGrid.getCollisionsAt(mob.cx, mob.cy).getArray();

    for (j = 0; j < collArray.length; j++) {
      tower = collArray[j];
      dist = utils.dist(tower.x - mob.x, tower.y - mob.y);
      tower.collide(mob, dist);
    }

  }
  for (i = 0; i < towers.length; i++) {
    tower = towers[i];
    tower.afterCollide();
  }
  this.cleanMobs();
};

// Grafik update
Game.prototype.updateAnimation = function (passedTime, accumulator) {
  var mobs = this.mobs.getArray();
  var towers = this.towers.getArray();
  var i, mob, tower;
  for (i = 0; i < mobs.length; i++) {
    mob = mobs[i];
    mob.update(passedTime, accumulator);

  }
  for (i = 0; i < towers.length; i++) {
    tower = towers[i];
    tower.update(passedTime, accumulator);
  }
};



//var colorMatrix = new PIXI.filters.ColorMatrixFilter();
////colorMatrix.brightness(1.5);
//colorMatrix.blackAndWhite();
//
//var blur = new PIXI.filters.BlurFilter();
//blur.blur = 3;
//
//
//game.lose = function () {
//    if (game.isLost) return;
//    game.isLost = true;
//    slowFactor = 2;
//    game.stage.filters = [colorMatrix, blur];
//    ui.loseGame();
//};
//
//game.win = function () {
//    if (game.isLost) return;
//    ui.winGame();
//};

// ==== Game Life ====
Game.prototype.hitHandler = function () {
  this.life -= 1;
  if (this.life <= 0) {
    this.life = 0;
    console.log("lose");
//        game.lose();
  }
  ui.updateLife();
  if (ui.canVibrate) navigator.vibrate(40);
};

// ==== Game Cash ====
Game.prototype.addCash = function (c) {
  this.cash += c;
  ui.updateCash();
};

Game.prototype.removeCash = function (c) {
  this.cash -= c;
  ui.updateCash();
};

Game.prototype.hasCash = function (price) {
  return this.cash >= price;
};

// ==== Game Wave ====
//game.updateRound = function () {
//    if (game.currentWaveID === -1) {
//        gameRoundEl.textContent = "";
//    } else {
//        gameRoundEl.textContent = game.currentWaveID + "/" + (game.waves.length - 1);
//    }
//};