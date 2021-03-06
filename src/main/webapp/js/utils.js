"use strict";

// Set für schnelles einfügen / löschen
// Sortierung wird nicht beachtet
var FastSet = function () {
  this.arr = [];
};
FastSet.prototype.add = function (val) {
  this.arr.push(val);
};
FastSet.prototype.remove = function (val) {
  var i = this.arr.indexOf(val);
  var last = this.arr.length - 1;
  this.arr[i] = this.arr[last];
  this.arr.pop();
  return i;
};
FastSet.prototype.removeAtIndex = function (index) {
  var last = this.arr.length - 1;
  this.arr[index] = this.arr[last];
  this.arr.pop();
};
FastSet.prototype.getIndex = function (val) {
  return this.arr.indexOf(val);
};
FastSet.prototype.getAtIndex = function (index) {
  return this.arr[index];
};
FastSet.prototype.clear = function () {
  this.arr = [];
};
FastSet.prototype.getArray = function () {
  return this.arr;
};
FastSet.prototype.isEmpty = function () {
  return this.arr.length === 0;
};

// Set für schnelles einfügen / löschen
// Verhindet Duplikate, Sortierung wird nicht beachtet
var FastUniqueSet = function () {
  this.arr = [];
};
FastUniqueSet.prototype.add = function (val) {
  if (this.arr.indexOf(val) === -1) {
    this.arr.push(val);
  }
};
FastUniqueSet.prototype.remove = function (val) {
  var i = this.arr.indexOf(val);
  if (i === -1) return;
  var last = this.arr.length - 1;
  this.arr[i] = this.arr[last];
  this.arr.pop();

};
FastUniqueSet.prototype.clear = function () {
  this.arr = [];
};
FastUniqueSet.prototype.getArray = function () {
  return this.arr;
};
FastUniqueSet.prototype.isEmpty = function () {
  return this.arr.length === 0;
};

// Objekt Pool, um den Garbage Collector zu schonen
// Class ist der Konstruktor

var Pool = function (Class, arg, allocSize) {
  this.pool = [];
  this.Class = Class;
  this.arg = arg;
  this.n = allocSize;
};
Pool.prototype.getObj = function () {
  if (this.pool.length === 0) {
    this.alloc();
  }
  return this.pool.pop();
};

Pool.prototype.alloc = function () {
  for (var i = 0; i < this.n; i++) {
    this.pool.push(new this.Class(this.arg));
  }
};
Pool.prototype.returnObj = function (o) {
  this.pool.push(o);
};
Pool.prototype.clear = function () {
  this.pool = [];
};

// ===== Hilfs-Funktionen =======
var utils = {};
// Von Pixel zu Zelle
utils.pos2Cell = function (pos) {
  return Math.floor(pos / game.cellSize);
};
// Von x, y Position zu Pixel
utils.cell2Pos = function (cell) {
  return cell * game.cellSize;
};
// Globale Pixel zu Position auf Spielfeld umrechnen
utils.input2Cell = function (px) {
  return utils.pos2Cell(px);
};

utils.isStart = function (cx, cy) {
  return cx === game.map.start.x && cy === game.map.start.y;
};
utils.isFinish = function (cx, cy) {
  return cx === game.map.finish.x && cy === game.map.finish.y;
};

utils.dist = function (x, y) {
  return Math.sqrt(x * x + y * y);
};
// Schnelle Math.atan2 Version für Mobs
// x, y können nur 1, 0, -1 sein
utils.fastatan2 = function (y, x) {
  if (y === 0) {
    return x === 1 ? 0 : Math.PI;
  } else {
    return (y === 1 ? 1 : -1) * Math.PI / 2;
  }
};

// Grid für effektive Kollsisionsabfragen
// Einfache implementirung von "Spatial Partitioning"
// Jede Zelle merkt sich, welche Tower sie Treffen könnten
// http://buildnewgames.com/broad-phase-collision-detection/
var CollisionGrid = function (cellsX, cellsY) {
  this.cellsX = cellsX;
  this.cellsY = cellsY;
  // 2D Array - speichert die Position jedes Towers,
  // für Klicks auf das Spielfeld praktisch
  this.towerGrid = [];
  // 3D Array - speichert für jedes Feld alle Tower,
  // deren Radius es treffen könnte
  this.towerCollisions = [];
  // Arrays aufbauen
  var i, j;
  for (i = 0; i < cellsX; i++) {
    this.towerGrid[i] = [];
    this.towerCollisions[i] = [];
    for (j = 0; j < cellsY; j++) {
      this.towerGrid[i][j] = null;
      this.towerCollisions[i][j] = new FastUniqueSet();
    }
  }
};

// TODO Es müsste nicht jede Zelle getested werden, nur (x, y) +/-radius
CollisionGrid.prototype.addTower = function (tower) {
  var cx = tower.cx;
  var cy = tower.cy;
  this.towerGrid[cx][cy] = tower;
  var i, j;
  for (i = 0; i < this.cellsX; i++) {
    for (j = 0; j < this.cellsY; j++) {
      // Speichern, wenn Distanz zwischen Feld und Tower < Radius
      // + kleine Abweichung
      if (utils.dist(i - cx, j - cy) <= tower.type.radius + 0.5) {
        this.towerCollisions[i][j].add(tower);
      }
    }
  }
};

CollisionGrid.prototype.deleteTower = function (tower) {
  this.towerGrid[tower.cx][tower.cy] = null;
  var i, j;
  for (i = 0; i < this.cellsX; i++) {
    for (j = 0; j < this.cellsY; j++) {
      this.towerCollisions[i][j].remove(tower);
    }
  }
};

CollisionGrid.prototype.updateTower = function (tower) {
  this.deleteTower(tower);
  this.addTower(tower);
};
// Gibt Kollisions-Set für Zelle x, y zurück
CollisionGrid.prototype.getCollisionsAt = function (cx, cy) {
  return this.towerCollisions[cx][cy];
};
// Gibt Tower in Zelle x, y zurück
CollisionGrid.prototype.getTowerAt = function (cx, cy) {
  return this.towerGrid[cx][cy];
};
// Sperrt Zelle an cx, cy
CollisionGrid.prototype.lockAt = function (cx, cy) {
  this.towerGrid[cx][cy] = false;
};
// Ist Zelle gesperrt?
CollisionGrid.prototype.islockedAt = function (cx, cy) {
  return this.towerGrid[cx][cy] === false;
};

