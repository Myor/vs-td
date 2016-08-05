"use strict";

// Konstruktor erstellt "unsichtbaren" Mob
var Mob = function () {
    this.type = null;
    // Textur
    this.spr = new PIXI.Sprite(game.tex.mobTexEmpty);
    this.spr.anchor.set(0.5);
    this.spr.x = this.spr.y = -100;
    // Textur Lebens-balken
    this.barSpr = new PIXI.Sprite(game.tex.mobBarTexEmpty);
    this.barSpr.x = this.barSpr.y = -100;
    game.mobsCon.addChild(this.spr);
    game.mobsBarCon.addChild(this.barSpr);
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
Mob.prototype.kill = function () {
    console.log("I had "+this.type.life+" HP and this much speed: "+this.type.speed );
    this.type = null;
    this.spr.texture = game.tex.mobTexEmpty;
    this.barSpr.texture = game.tex.mobBarTexEmpty;
};

// Komplett löschen
Mob.prototype.destroy = function () {
    this.type = null;
    game.mobsCon.removeChild(this.spr);
    game.mobsBarCon.removeChild(this.barSpr);
    this.spr.destroy();
    this.barSpr.destroy();
};

// Mob-daten bis age berechnen
Mob.prototype.simulateToAge = function (age) {
    // Zurückgelegter Weg
    var covered = age / this.type.speed;
    // In Zelle + Nachkommastelle (zum interpolieren) Teilen
    var cell = Math.floor(covered);
    var frac = covered - cell;
    // Zelle aus Pfad lesen
    var prevX, prevY, nextX, nextY;
    if (cell + 1 < game.path.length) {
        prevX = game.path[cell][0];
        prevY = game.path[cell][1];
        nextX = game.path[cell + 1][0];
        nextY = game.path[cell + 1][1];
    } else {
        prevX = nextX = game.path[game.path.length - 1][0];
        prevY = nextY = game.path[game.path.length - 1][1];
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
Mob.prototype.update = function () {
    this.spr.x = this.x + game.cellCenter;
    this.spr.y = this.y + game.cellCenter;
    this.spr.rotation = utils.fastatan2(this.dirY, this.dirX);
    this.barSpr.x = this.x;
    this.barSpr.y = this.y;
    this.barSpr.scale.x = this.life / this.type.life;
};

Mob.prototype.isKilled = function () {
    return this.type === null;
};

Mob.prototype.hit = function (power, by) {
    if (this.isKilled()) return;
    this.life -= power;
    if (this.life <= 0) {
        by.killCount++;
        game.addCash(this.type.cash);
        this.kill();
    }
};


    // Nimmt ein Mob aus dem Pool und schiebt ihn in den Queue
game.enqueMobs = function (typeID, num) {
    for (var i = 0; i < num; i++) {
        var mob = game.mobPool.getObj();
        mob.type = mobTypes[typeID];
        game.mobQueue.enqueue(mob);
    }
};
// Mob sichtbar machen und zum Update loop hinzufügen
game.addMob = function (mob) {
    mob.init();
    game.mobs.add(mob);
};
// Mob zurück in den Pool schieben und aus Update loop löschen
game.removeMob = function (mob) {
    game.mobPool.returnObj(mob);
    game.mobs.remove(mob);
};


