"use strict";


// Nimmt ein Mob aus dem Pool und schiebt ihn in den Queue
/*game.enqueMobs = function (typeId, num) {
    for (var i = 0; i < num; i++) {
        var mob = game.mobPool.getObj();
        mob.type = mobTypes[typeId];
        game.mobQueue.enqueue(mob);
    }
};*/

Game.prototype.spawnMob = function (typeId) {
    // TODO Preis prüfen
    // TODO muss zu peer gesendet werden, nicht lokal
    game.local.emit("spawnMob", typeId);
};
// Mob aus Pool nehmen und zum Update loop hinzufügen
Game.prototype.addMob = function (typeId) {
    var mob = this.mobPool.getObj();
    mob.type = mobTypes[typeId];
    mob.init();
    this.mobs.add(mob);
};

// Killed Mobs entfernen
Game.prototype.cleanMobs = function () {
    // Rückwärts, um keine Elemente zu überspringen
    var mobs = this.mobs.getArray();
    var i, mob;
    for (i = mobs.length - 1; i >= 0; i--) {
        mob = mobs[i];
        // Mob töten, wenn im Ziel
        if (utils.isFinish(mob.cx, mob.cy)) {
            this.emit("hit");
            this.emit("killMob", mob, null);
        }
        if (mob.isKilled()) {
            this.emit("removeMob", i);
        }
    }
};
// Mob als tot kennzeichnen
Game.prototype.killMob = function (mob, by) {
    if (by != null) {
        by.killCount++;
        this.addCash(mob.type.cash);
    }
    mob.type = null;
};

// Mob zurück in den Pool schieben und aus Update loop löschen
Game.prototype.removeMob = function (index) {
    var mob = this.mobs.getAtIndex(index);
    mob.reset();
    this.mobPool.returnObj(mob);
    this.mobs.removeAtIndex(index);
};

// Konstruktor erstellt "unsichtbaren" Mob
var Mob = function (gameRef) {
    this.game = gameRef;
    this.type = null;
    // Textur
    this.spr = new PIXI.Sprite(game.tex.mobTexEmpty);
    this.spr.anchor.set(0.5);
    this.spr.x = this.spr.y = -100;
    // Textur Lebens-balken
    this.barSpr = new PIXI.Sprite(game.tex.mobBarTexEmpty);
    this.barSpr.x = this.barSpr.y = -100;
    this.game.mobsCon.addChild(this.spr);
    this.game.mobsBarCon.addChild(this.barSpr);
};

// Alles leeren und sichtbar machen (textur tauschen)
Mob.prototype.init = function () {
    this.spr.texture = this.type.tex;
    this.barSpr.texture = game.tex.mobBarTex;
    this.life = this.type.life;
    this.cx = 0;
    this.cy = 0;
    this.x = 0;
    this.y = 0;
    this.dirX = 0;
    this.dirY = 0;
    this.covered = 0;
    this.age = 0;
};

// Unsichtbar machen
Mob.prototype.reset = function () {
    this.spr.texture = game.tex.mobTexEmpty;
    this.barSpr.texture = game.tex.mobBarTexEmpty;
};

Mob.prototype.isKilled = function () {
    return this.type === null;
};

// Komplett löschen
Mob.prototype.destroy = function () {
    this.type = null;
    this.game.mobsCon.removeChild(this.spr);
    this.game.mobsBarCon.removeChild(this.barSpr);
    this.spr.destroy();
    this.barSpr.destroy();
};

// Mob-daten bis age berechnen
Mob.prototype.simulateToAge = function (age) {
    var path = this.game.path;
    // Zurückgelegter Weg
    var covered = age / this.type.speed;
    // In Zelle + Nachkommastelle (zum interpolieren) Teilen
    var cell = Math.floor(covered);
    var frac = covered - cell;
    // Zelle aus Pfad lesen
    var prevX, prevY, nextX, nextY;
    if (cell + 1 < path.length) {
        prevX = path[cell][0];
        prevY = path[cell][1];
        nextX = path[cell + 1][0];
        nextY = path[cell + 1][1];
    } else {
        prevX = nextX = path[path.length - 1][0];
        prevY = nextY = path[path.length - 1][1];
    }
    // Laufrichtung zur nächsten Zelle (-1 -> links, 0 -> gleich, 1 -> rechts)
    var dirX = nextX - prevX;
    var dirY = nextY - prevY;
    // Position = Zelle + Nachkomma * Laufrichtung
    this.x = utils.cell2Pos(prevX + frac * dirX);
    this.y = utils.cell2Pos(prevY + frac * dirY);
    // Speichern für weiteren Berechnungen
    this.cx = frac < 0.5 ? prevX : nextX;
    this.cy = frac < 0.5 ? prevY : nextY;
    this.dirX = dirX;
    this.dirY = dirY;
    this.covered = covered;
};

// Daten auf Sprites setzten
Mob.prototype.update = function (passedTime, accumulator) {
    this.simulateToAge(this.age + accumulator);
    this.spr.x = this.x + game.cellCenter;
    this.spr.y = this.y + game.cellCenter;
    this.spr.rotation = utils.fastatan2(this.dirY, this.dirX);
    this.barSpr.x = this.x;
    this.barSpr.y = this.y;
    this.barSpr.scale.x = this.life / this.type.life;
};

Mob.prototype.hit = function (power, by) {
    if (this.isKilled()) return;
    this.life -= power;
    if (this.life <= 0) {
        this.life = 0;
        this.game.emit("killMob", this, by);
    }
};

