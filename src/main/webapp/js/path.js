"use strict";
/* ===== Path finding ===== */

var PFfinder = new PF.AStarFinder({
  allowDiagonal: false,
  heuristic: PF.Heuristic.euclidean
});

// Pfad von Start zum Ziel der Map
Game.prototype.findPath = function () {
  return PFfinder.findPath(
          game.map.start.x,
          game.map.start.y,
          game.map.finish.x,
          game.map.finish.y,
          this.PFgrid.clone());
};

Game.prototype.drawPath = function () {
  this.clearPath();
  var path = this.path;
  var cont = this.pathCon;
  var spr;
  // Pfad malen
  for (var i = 0; i < path.length; i++) {
    spr = new PIXI.Sprite(game.tex.pathMark);
    spr.x = utils.cell2Pos(path[i][0]);
    spr.y = utils.cell2Pos(path[i][1]);
    cont.addChild(spr);
  }
};

Game.prototype.clearPath = function () {
  var cont = this.pathCon;
  for (var i = 0; i < cont.children.length; i++) {
    // Alte Sprites löschen
    cont.children[i].destroy();
  }
  cont.removeChildren();
};
// Zelle für Pfad und Tower sperren
Game.prototype.lockCell = function (cx, cy) {
  this.collGrid.lockAt(cx, cy);
  this.PFgrid.setWalkableAt(cx, cy, false);
};
