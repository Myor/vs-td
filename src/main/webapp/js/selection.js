"use strict";

/* ==== Tower Radius Anzeige ==== */
Game.prototype.drawSelectCircle = function (type) {
  this.selectCircleGr.clear();
  if ("radius" in type) {
    this.selectCircleGr.beginFill(0x000000, 0.3);
    this.selectCircleGr.drawCircle(0, 0, type.radius * game.cellSize);
  }
};
Game.prototype.showSelection = function () {
  this.selectGr.visible = true;
  this.selectCircleGr.visible = true;
};
Game.prototype.hideSelection = function () {
  this.selectGr.visible = false;
  this.selectCircleGr.visible = false;
};

Game.prototype.getSelectedTower = function () {
  return this.selectedTower;
};

Game.prototype.setSelectedTower = function (tower) {
  if (tower === null) {
    // Kreis ausblenden
    this.hideSelection();

    ui.hideSelectedInfo();
  } else if (this.selectedTower !== tower) {
    this.drawSelectCircle(tower.type);
    this.moveSelectionTo(tower.cx, tower.cy);
    // Kreis anzeigen
    this.showSelection();

    ui.showSelectedInfo(tower);
  }
  this.selectedTower = tower;
};

Game.prototype.moveSelectionTo = function (cx, cy) {
  this.selectGr.x = this.selectCircleGr.x = utils.cell2Pos(cx) + game.cellCenter;
  this.selectGr.y = this.selectCircleGr.y = utils.cell2Pos(cy) + game.cellCenter;
};

