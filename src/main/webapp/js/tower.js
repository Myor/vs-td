"use strict";

// Kauft Tower, wenn möglich
Game.prototype.buyTowerAt = function (typeID, cx, cy) {
  // Tower vorhanden bzw. start & ziel
  if (this.collGrid.islockedAt(cx, cy)
          || this.collGrid.getTowerAt(cx, cy) !== null
          || utils.isStart(cx, cy)
          || utils.isFinish(cx, cy)) {
    return false;
  }
  var type = towerTypes[typeID];

  // Wenn Tower den Weg blockieren kann, Weg testen
  if (type.isBlocking) {
    this.PFgrid.setWalkableAt(cx, cy, false);
    var newPath = this.findPath();
    // Nur setzen, wenn Weg vorhanden
    if (newPath.length === 0) {
      this.PFgrid.setWalkableAt(cx, cy, true);
      return;
    }
  }
  // Preis zahlen
  if (!this.hasCash(type.price)) return false;
  this.removeCash(type.price);

  this.emit("addTower", typeID, cx, cy);
  return true;
};

// Setzt Tower ohne Einschränkungen zu prüfen
Game.prototype.addTowerAt = function (typeID, cx, cy) {
  var type = towerTypes[typeID];

  var tower = new Tower(this, type, cx, cy);

  // Pfad blockieren, wenn nötig
  if (tower.type.isBlocking) {
    this.PFgrid.setWalkableAt(tower.cx, tower.cy, false);
    this.path = this.findPath();
    this.drawPath();
  }

  if (isBuffTower(tower)) {
    this.buffColGrid.addTower(tower);
  }
  this.calculateBuffs();

  this.collGrid.addTower(tower);
  this.towers.add(tower);
};

// Tower für Zelle finden, null wenn keiner vorhanden
Game.prototype.getTowerAt = function (cx, cy) {
  if (game.fieldRect.contains(cx, cy) && !this.collGrid.islockedAt(cx, cy)) {
    return this.collGrid.getTowerAt(cx, cy);
  }
  return null;
};

// Verkauft Tower
Game.prototype.sellTower = function (tower) {
  this.addCash(tower.type.sellPrice);
  this.emit("removeTower", this.towers.getIndex(tower));
};

// Entfernt Tower
Game.prototype.removeTower = function (index) {
  var tower = this.towers.getAtIndex(index);

  // Pfad freigeben
  if (tower.type.isBlocking) {
    this.PFgrid.setWalkableAt(tower.cx, tower.cy, true);
    this.path = this.findPath();
    this.drawPath();
  }
  // Wenn Bufftower enternt - Buffs neu berechnen
  if (isBuffTower(tower)) {
    this.buffColGrid.deleteTower(tower);
    this.calculateBuffs();
  }

  this.collGrid.deleteTower(tower);
  this.towers.remove(tower);
  tower.destroy();
};

// Tower verbesern
Game.prototype.upgradeTower = function (tower) {
  var nextType = towerTypes[tower.type.next];

  if (!this.hasCash(nextType.price)) return;
  this.removeCash(nextType.price);
  // Löschen + neu setzen
  this.emit("removeTower", this.towers.getIndex(tower));
  this.emit("addTower", tower.type.next, tower.cx, tower.cy);
};

// Bonus Tower neu berechnen
Game.prototype.calculateBuffs = function () {
  var towers = this.towers.getArray();
  var tower;
  var buffTowers;
  for (var i = 0; i < towers.length; i++) {
    tower = towers[i];
    if (!isBuffTower(tower)) {
      tower.powerMulti = 1;
      tower.freqMulti = 1;
      tower.radiusMulti = 1;

      buffTowers = this.buffColGrid.getCollisionsAt(tower.cx, tower.cy).getArray();

      for (var j = 0; j < buffTowers.length; j++) {
        if ("powerAdd" in buffTowers[j].type) {
          tower.powerMulti += buffTowers[j].type.powerAdd;
        }
        if ("freqAdd" in buffTowers[j].type) {
          tower.freqMulti -= buffTowers[j].type.freqAdd;
        }
      }
    }
  }
};

var isBuffTower = function (tower) {
  return tower.type === towerTypes[11] || tower.type === towerTypes[12];
};

// Allgemeiner Tower Konstruktor
var Tower = function (gameRef, type, cx, cy) {
  this.game = gameRef;
  this.type = type;
  this.killCount = 0;

  this.cx = cx;
  this.cy = cy;
  this.x = utils.cell2Pos(cx);
  this.y = utils.cell2Pos(cy);

  this.radiusMulti = 1;
  this.freqMulti = 1;
  this.powerMulti = 1;

  this.spr = new PIXI.Sprite(this.type.tex);
  this.spr.anchor.set(0.5);
  this.spr.x = this.x + game.cellCenter;
  this.spr.y = this.y + game.cellCenter;

  this.game.towersCon.addChild(this.spr);
  Object.assign(this, type.extend);
  this.init();
};

Tower.prototype.destroy = function () {
  this.game.towersCon.removeChild(this.spr);
  this.spr.destroy();
};
// Funktionen, welche alle Tower teilen
Tower.prototype.isInRadius = function (dist) {
  return dist <= utils.cell2Pos(this.type.radius);
};
Tower.prototype.angleToMob = function (mob) {
  return Math.atan2(mob.y - this.y, mob.x - this.x);
};
Tower.prototype.getFreq = function () {
  return this.type.freq * this.freqMulti;
};
Tower.prototype.getPower = function () {
  return this.type.power * this.powerMulti;
};
// Default noops
Tower.prototype.init = function () {};
Tower.prototype.update = function () {};
Tower.prototype.beforeCollide = function () {};
Tower.prototype.collide = function () {};
Tower.prototype.afterCollide = function () {};
Tower.prototype.aimFunc = null;

// Funktionen zum Anvisieren von Mobs
var aimFuncs = {};

aimFuncs.first = function (mob, dist) {
  return this.focus === null || mob.covered > this.focus.covered;
};

