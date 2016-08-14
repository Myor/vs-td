"use strict";

document.addEventListener("DOMContentLoaded", loadResources);

function loadResources() {
    PIXI.loader
            .add("mobs", "assets/mobSheet32.png")
            .add("mobBar", "assets/mobBar.png")
            .add("towers", "assets/towerSheet32.png")
            .add("shots", "assets/shots@2x.png")
            .add("pathMark", "assets/pathMarker.png")
            .add("map1ground", "assets/map1ground32.png")
            .add("map2ground", "assets/map2ground32.png")
            .add("shockwave", "assets/shockwave.png")
            .load(game.setup);
}

// Objekt für Statische Daten / Funktionen
var game = {};
game.resX = 384;
game.resY = 544;
game.cellSize = 32;
game.cellCenter = 16;
game.cellsX = 12; // = resX / cellSize
game.cellsY = 17; // = resY / cellSize
// Rechteck für einfach hit-tests
game.fieldRect = new PIXI.Rectangle(0, 0, game.cellsX, game.cellsY);
game.map = null;
// Simulationsschritt in ms
game.step = 50;

// ParticleContainer für gute Performance (wird auf GPU berechnet)
// Alle bekommen die gleichen Optionen, wegen PIXI Bug
// https://github.com/pixijs/pixi.js/issues/1953
var particleConOptions = {
    // scale wird bei den Mob-Lebensanzeigen gebraucht
    scale: true,
    position: true,
    rotation: true,
    // uvs, damit Texturen getauscht werden können
    uvs: true,
    alpha: false
};

// Ungenutzte Plugins
delete PIXI.WebGLRenderer.__plugins.interaction;
delete PIXI.WebGLRenderer.__plugins.accessibility;


game.setup = function () {
    console.log("setup");

    game.setupTextures();
    game.setupMapTextures();
    game.map = game.maps[0];
    game.local = new Game(document.getElementById("localGameField"));
    game.local.initGame();
    game.local.initLocal();
    game.local.initLoops();
    game.local.startGameLoop();
    
    game.remote = new Game(document.getElementById("remoteGameField"));
    game.remote.initGame();
    game.remote.initRemote();
    game.remote.initLoops();
    game.remote.startGameLoop();

    ui.setupInput();
};

// Spielfeld Konstruktor
function Game(el) {
    this.containerEl = el;
}
// Game erweitert den EventEmitter von PIXI
Game.prototype = new PIXI.utils.EventEmitter();
Game.prototype.constructor = Game;

Game.prototype.initGame = function () {

    this.life = 100;
    this.cash = 4242;
//    this.updateLife();
//    this.updateCash();

    // Waves
//    this.groupQueue = new Queue();
//    this.currentWaveID = -1;
//    this.isWaveActive = false;
//    this.currentGroup = null;
//    this.currentDelay = 0;

    this.renderer = new PIXI.WebGLRenderer(game.resX, game.resY, {
        antialias: true
    });
    // Canvas in DOM rein
    this.canvasEl = this.renderer.view;
    this.containerEl.appendChild(this.canvasEl);

    // Werte für Berechnung von Input merken
    var rec = this.canvasEl.getBoundingClientRect();
    this.offsetX = rec.left;
    this.offsetY = rec.top;
//    this.scale = game.resX / rec.width;

    // Collision-Grids
    this.collGrid = new CollisionGrid(game.cellsX, game.cellsY);
    this.buffColGrid = new CollisionGrid(game.cellsX, game.cellsY);

    // Pfad
    this.PFgrid = new PF.Grid(game.cellsX, game.cellsY);

    // PIXI Container
    var stage = new PIXI.Container();
    this.stage = stage;
    this.mapCon = new PIXI.Container();
    this.pathCon = new PIXI.Container();

    this.shotCon = new PIXI.ParticleContainer(1000, particleConOptions, 1000);
    this.shockCon = new PIXI.ParticleContainer(100, particleConOptions, 100);
    this.towersCon = new PIXI.ParticleContainer(200, particleConOptions, 200);

    this.mobsCon = new PIXI.ParticleContainer(50000, particleConOptions, 10000);
    this.mobsBarCon = new PIXI.ParticleContainer(50000, particleConOptions, 10000);

    this.towers = new FastSet();
    this.mobs = new FastSet();
    this.mobPool = new Pool(Mob, this, 10);
//    this.mobQueue = new Queue();

    // Grafik für Radius-anzeige
    this.selectCircleGr = new PIXI.Graphics();

    // Grafik beim Tower setzten
    this.selectGr = new PIXI.Graphics();
    this.selectGr.beginFill(0xFFFFFF, 0.5);
    this.selectGr.drawRect(-game.cellCenter, -game.cellCenter, game.cellSize, game.cellSize);

    this.selectedTower = null;
    this.setSelectedTower(null);

    // Alle Layer hinzufügen
    stage.addChild(this.mapCon);
    stage.addChild(this.selectCircleGr);
    stage.addChild(this.shotCon);
    stage.addChild(this.shockCon);
    stage.addChild(this.towersCon);
    stage.addChild(this.pathCon);
    stage.addChild(this.selectGr);
    stage.addChild(this.mobsCon);
    stage.addChild(this.mobsBarCon);

    // Map malen
    this.initMap();
    // Map kann Pfad geändert haben
    this.path = this.findPath();
    this.drawPath();

    this.isPaused = false;
    this.isLost = false;
//    this.updateRound();
//    ui.reset();

    this.on("addTower", this.addTowerAt, this);
    this.on("removeTower", this.removeTowerAt, this);

    this.on("addMob", this.addMob, this);
    this.on("removeMob", this.removeMob, this);
};

Game.prototype.initLocal = function () {
    
    this.on("spawnMob", function (id) {
        this.emit("addMob", id);
    }, this);
    
    this.on("killMob", this.killMob, this);
    
    this.on("hit", this.hitHandler, this);

    // Events zu Peer senden
    // this.on("addTower", ...);
};

Game.prototype.initRemote = function () {
    // Events von Peer empfangen und lokal emit
    // Dieser Kram muss übers netzwerk laufen
    game.local.on("addTower", game.remote.addTowerAt, this);
    game.local.on("removeTower", game.remote.removeTowerAt, this);

    game.local.on("addMob", game.remote.addMob, this);
    game.local.on("removeMob", game.remote.removeMob, this);
};

Game.prototype.destroyGame = function () {
    this.stopGameLoop();
    // Aktive Aktionen abbrechen
//    ui.endPlace();
//    ui.hideMenu();
    this.setSelectedTower(null);

    // Stage mit allen Inhalten löschen
    // TODO Texturen nicht mit löschen / erneut verwenden
    this.stage.destroy(true);
    this.stage = null;
    // Renderer mit Canvas löschen
    this.renderer.destroy(true);
    this.renderer = null;
    this.canvasEl = null;
    // Alle Referenzen auf Objekte löschen
    this.collGrid = null;
    this.buffColGrid = null;

    this.mapCon = null;
    this.pathCon = null;
    this.shotCon = null;
    this.shockCon = null;
    this.towersCon = null;
    this.towers = null;

    this.selectCircleGr = null;
    this.selectGr = null;

    this.mobsCon = null;
    this.mobsBarCon = null;
    this.mobs = null;
    this.mobQueue = null;
    this.groupQueue = null;
    this.mobPool = null;

    this.PFgrid = null;
    this.path = null;

};

Game.prototype.initMap = function () {
    var map = game.map;
    var mapCon = this.mapCon;

    this.renderer.backgroundColor = map.bgColor;

    // Background
    var layout = map.groundLayout;
    for (var y = 0; y < game.cellsY; y++) {
        for (var x = 0; x < game.cellsX; x++) {
            var index = y * game.cellsX + x;
            var spr = new PIXI.Sprite(map.groundTex[layout[index]]);
            spr.position.x = utils.cell2Pos(x);
            spr.position.y = utils.cell2Pos(y);
            mapCon.addChild(spr);
        }
    }

    // Map ändert sich nicht, kann gecached werden
    mapCon.cacheAsBitmap = true;

    // Standard Tower
//    var walls = map.walls;
//    for (var i = 0; i < walls.length; i++) {
//        game.addTowerAt(towerTypes[0], walls[i][0], walls[i][1]);
//    }
    // Blockierte Zellen
//    var locks = map.locks;
//    for (var y = 0; y < game.cellsY; y++) {
//        for (var x = 0; x < game.cellsX; x++) {
//            var index = y * game.cellsX + x;
//            if (locks[index] === 1) game.lockCell(x, y);
//        }
//    }
};

game.setupTextures = function () {
    game.tex = {};

    game.tex.mobTexEmpty = texFromCache("mobs", 0, 0, 32, 32);
    game.tex.mobBarTex = texFromCache("mobBar", 0, 0, 32, 3);
    game.tex.mobBarTexEmpty = texFromCache("mobBar", 0, 6, 32, 4);

    game.tex.pathMark = texFromCache("pathMark");

    mobTypes[0].tex = texFromCache("mobs", 33, 0, 32, 32);
    mobTypes[1].tex = texFromCache("mobs", 66, 0, 32, 32);
    mobTypes[2].tex = texFromCache("mobs", 99, 0, 32, 32);
    mobTypes[3].tex = texFromCache("mobs", 132, 0, 32, 32);
    mobTypes[4].tex = texFromCache("mobs", 165, 0, 32, 32);
    mobTypes[5].tex = texFromCache("mobs", 198, 0, 32, 32);
    mobTypes[6].tex = texFromCache("mobs", 231, 0, 32, 32);
    mobTypes[7].tex = texFromCache("mobs", 264, 0, 32, 32);
    mobTypes[8].tex = texFromCache("mobs", 298, 0, 48, 32);
    mobTypes[9].tex = texFromCache("mobs", 1, 33, 64, 48);
    mobTypes[10].tex = texFromCache("mobs", 66, 33, 72, 48);
    mobTypes[11].tex = texFromCache("mobs", 165, 33, 98, 64);

    // Mauer
    towerTypes[0].tex = texFromCache("towers", 409, 0, 32, 32);

    // Laser
    towerTypes[1].tex = texFromCache("towers", 103, 0, 32, 32);
    towerTypes[1].tex2 = texFromCache("towers", 137, 0, 32, 32);
    towerTypes[1].shotTex = texFromCache("shots", 13, 0, 1, 32);
    // Laser Level 2
    towerTypes[2].tex = towerTypes[1].tex;
    towerTypes[2].tex2 = towerTypes[1].tex;
    towerTypes[2].shotTex = texFromCache("shots", 17, 0, 1, 32);

    // Laser 2
    towerTypes[3].tex = texFromCache("towers", 1, 0, 32, 32);
    towerTypes[3].shotTex = texFromCache("shots", 6, 0, 1, 32);
    // Laser 2 Level 2
    towerTypes[4].tex = towerTypes[3].tex;
    towerTypes[4].shotTex = texFromCache("shots", 1, 0, 1, 32);

    // Slime
    towerTypes[5].tex = texFromCache("towers", 443, 0, 32, 32);
    // Slime Level 2
    towerTypes[6].tex = towerTypes[5].tex;

    // AoE
    towerTypes[7].tex = texFromCache("towers", 35, 0, 32, 32);
    towerTypes[7].tex2 = texFromCache("towers", 69, 0, 32, 32);
    towerTypes[7].shotTex = texFromCache("shockwave");
    // AoE Level 2
    towerTypes[8].tex = towerTypes[7].tex;
    towerTypes[8].tex2 = towerTypes[7].tex2;
    towerTypes[8].shotTex = texFromCache("shockwave");

    // Ufo
    towerTypes[9].tex = texFromCache("towers", 342, 0, 32, 32);
    towerTypes[9].tex2 = texFromCache("towers", 377, 0, 32, 32);
    towerTypes[9].shotTex = [
        texFromCache("shots", 0, 32, 128, 32),
        texFromCache("shots", 0, 64, 128, 32),
        texFromCache("shots", 0, 96, 128, 32)
    ];
    // Ufo Level 2
    towerTypes[10].tex = towerTypes[9].tex;
    towerTypes[10].tex2 = towerTypes[9].tex2;
    towerTypes[10].shotTex = [
        texFromCache("shots", 0, 128, 128, 32),
        texFromCache("shots", 0, 160, 128, 32),
        texFromCache("shots", 0, 192, 128, 32)
    ];

    // Aura
    towerTypes[11].tex = texFromCache("towers", 170, 0, 32, 32);
    towerTypes[11].texAnim = [
        texFromCache("towers", 170, 0, 32, 32),
        texFromCache("towers", 204, 0, 32, 32),
        texFromCache("towers", 238, 0, 32, 32),
        texFromCache("towers", 272, 0, 32, 32),
        texFromCache("towers", 306, 0, 32, 32)
    ];
    // Aura Level 2
    towerTypes[12].tex = towerTypes[11].tex;
    towerTypes[12].texAnim = [
        texFromCache("towers", 170, 0, 32, 32),
        texFromCache("towers", 204, 0, 32, 32),
        texFromCache("towers", 238, 0, 32, 32),
        texFromCache("towers", 272, 0, 32, 32),
        texFromCache("towers", 306, 0, 32, 32)
    ];

};

// Textur aus loader Cache lesen, mit frame
function texFromCache(img, x, y, w, h) {
    if (x !== undefined) {
        return new PIXI.Texture(
                PIXI.loader.resources[img].texture.baseTexture,
                new PIXI.Rectangle(x, y, w, h));
    } else {
        return new PIXI.Texture(PIXI.loader.resources[img].texture.baseTexture);
    }
}
;
game.texFromCache = texFromCache;