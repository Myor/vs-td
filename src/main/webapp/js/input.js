"use strict";

function id(selector) {
    return document.getElementById(selector);
}

// Stats
//var lifeEl = id("localLife");
var cashEl = id("localCash");
//var roundEl = id("localRound");

// Menu
var cancelPlaceBtn = id("cancelPlace");

// Towers
var towerList = id("towers");


//// Alle statischen Elemente
//var gameWrapper = id("gameWrapper");
//// Game Menüs
//var mainMenu = id("mainMenu");
//var towerMenu = id("towerMenu");
//var towerInfo = id("towerInfo");
var towerStats = id("towerStats");
//// Buttons Game
//var nextWaveButton = id("nextWave");
//var pauseButton = id("pauseGame"); 
//var fastForwardButton = id("fastForward");
//var showTowersBtn = id("showTowers");
//

//var exitBtn = id("exitBtn");
//// Win / Lose
//var gameOverlayDiv = id("gameOverlay");
//var winMsgDiv = id("winMsg");
//var loseMsgDiv = id("loseMsg");
//var exitWinBtn = id("exitWin");
//var exitLoseBtn = id("exitLose");
//// Menü
//var playButton = id("playGame");
//var mapSelectDiv = id("mapSelect");
//var map1Button = id("playMap1");
//var map2Button = id("playMap2");
//var inputGameMode1 = id("inputGameMode1");

// Selected-infos
var tName = towerStats.querySelector(".tName");
var tKillCount = towerStats.querySelector(".tKillCount");
var tPower = towerStats.querySelector(".tPower");
var tFreq = towerStats.querySelector(".tFreq");
var tRadius = towerStats.querySelector(".tRadius");
var tCurrentLvl = towerStats.querySelector(".tCurrentLvl");
var tNextBtn = towerStats.querySelector(".tNextBtn");
var tNextLvl = towerStats.querySelector(".tNextLvl");
var tNextPrice = towerStats.querySelector(".tNextPrice");
var tAimDiv = towerStats.querySelector(".tAimDiv");
var tAimBtnList = tAimDiv.querySelectorAll("button");
var tSellBtn = towerStats.querySelector(".tSellBtn");
var tSellPrice = towerStats.querySelector(".tSellPrice");

// ===== Events bei statischen Elementen =====
//// PlayButton
//playButton.addEventListener("click", showMapSelect);
//map1Button.addEventListener("click", startMap1);
//map2Button.addEventListener("click", startMap2);
// Tower spawn
towerList.addEventListener("click", towerListHandler);
cancelPlaceBtn.addEventListener("click", towerCancelHandler);
// Tower verkauf
tSellBtn.addEventListener("click", sellHandler);
//// Tower aim setzen
//tAimDiv.addEventListener("click", setAimHandler);
// Tower upgraden
tNextBtn.addEventListener("click", upgradeHandler);

//// Nächste Wave enquen
//nextWaveButton.addEventListener("click", waveHandler);
//// Spiel Pausieren
//pauseButton.addEventListener("click", pauseHandler);
//// Spiel bescheunigen
//fastForwardButton.addEventListener("click", fastHandler);
//// TowerMenu
//showTowersBtn.addEventListener("click", ui.showMenu);
//// Exit to Menu
//exitBtn.addEventListener("click", ui.exitToMenu);
//exitLoseBtn.addEventListener("click", ui.exitToMenu);
//exitWinBtn.addEventListener("click", ui.exitToMenu);


var showMapSelect = function () {
    mapSelectDiv.classList.remove("hideMapSelect");
};

var startMap1 = function () {
    game.map = game.maps[0];
    setGameMode();
    showGame();
};

var startMap2 = function () {
    game.map = game.maps[1];
    setGameMode();
    showGame();
};

var showGame = function () {
    mapSelectDiv.classList.add("hideMapSelect");
    mainMenu.classList.add("hidden");
    gameWrapper.classList.remove("hidden");

    game.startGame();
};

var setGameMode = function () {
    if (inputGameMode1.checked) {
        game.cash = 70;
    } else {
        game.cash = Infinity;
    }
};

// ===== Events dynamisch erstellte Elemente =====
game.setupInput = function () {
    // Kein Kontextmenü
    game.local.canvasEl.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });
    // Klick auf Spielfeld
    game.local.canvasEl.addEventListener("click", clickHandler);
    game.local.canvasEl.addEventListener("touchend", touchHandler);
};


var ui = {};
ui.canVibrate = window.navigator.vibrate !== undefined;

ui.updateCash = function () {
    cashEl.textContent = game.local.cash;
};

// ===== Menüs =====

ui.showMenu = function () {
    game.setSelectedTower(null);
    towerMenu.classList.remove("hideLeft");
};

ui.exitToMenu = function () {
    mainMenu.classList.remove("hidden");
    gameWrapper.classList.add("hidden");
    game.exitGame();
};

ui.hideMenu = function () {
    ui.hideInfo();
    towerMenu.classList.add("hideLeft");
};
ui.showInfo = function () {
    towerInfo.classList.remove("infoHide");
};
ui.hideInfo = function () {
    towerInfo.classList.add("infoHide");
};

ui.showSelectedInfo = function (tower) {
    fillInfoSelected(tower);
//    towerSelectedInfo.classList.remove("hideRight");
};
ui.hideSelectedInfo = function () {
//    towerSelectedInfo.classList.add("hideRight");
};

var fillTowerInfo = function (id) {
    var type = towerTypes[id];

    var nameDesc = "<div class='infoName'>" + type.name + "</div>" + type.desc;

    var table = "<table>";
    if ('power' in type)
        table += "<tr><td>Damage</td><td>" + type.power + "</td></tr>";
    if ('freq' in type)
        table += "<tr><td>Reload</td><td>" + type.freq + "</td></tr>";
    if ('radius' in type)
        table += "<tr><td>Radius</td><td>" + type.radius + "</td></tr>";

    table += "<tr><td>Price</td><td>" + type.price + "</td></tr>";
    table += "</table>";

    towerInfo.innerHTML = nameDesc + table;
};

var fillInfoSelected = function (tower) {
    var type = tower.type;

    tName.textContent = type.name;
    tKillCount.textContent = tower.killCount;
    tPower.textContent = "power" in type ? tower.getPower().toFixed(2) : "-";
    tFreq.textContent = "freq" in type ? tower.getFreq().toFixed(2) : "-";
    tRadius.textContent = "radius" in type ? type.radius : "-";
    // Upgrades
    tCurrentLvl.textContent = type.level;
    var hasNext = type.next !== undefined;
    tNextLvl.textContent = hasNext ? towerTypes[type.next].level : "-";
    tNextPrice.textContent = hasNext ? towerTypes[type.next].price : "-";
    tNextBtn.disabled = hasNext ? false : true;


    // Aim Buttons ein / ausblenden
    if (tower.aimFunc === null) {
        tAimDiv.classList.add("hidden");
    } else {
        tAimDiv.classList.remove("hidden");
        updateAimBtns(tower.aimFunc.id);
    }

    tSellPrice.textContent = type.sellPrice;
};

// Markiert aim-Button mit Class bzw. entfernt Class
var updateAimBtns = function (newID) {
    for (var i = 0; i < tAimBtnList.length; i++) {
        var btn = tAimBtnList[i];
        btn.classList.remove("active");
        if (btn.matches("button[data-aim='" + newID + "']")) {
            btn.classList.add("active");
        }
    }
};

// ===== Button Handler =====
var waveHandler = function (e) {
    game.startNextWave();
};

var fastHandler = function () {
    if (slowFactor === 1) {
        ui.doubleSpeed();
    } else {
        ui.normalSpeed();
    }
};

ui.doubleSpeed = function () {
    fastForwardButton.classList.add("active");
    slowFactor = 0.5;
};

ui.normalSpeed = function () {
    fastForwardButton.classList.remove("active");
    slowFactor = 1;
};

var pauseHandler = function () {
    if (game.isPaused === false) {
        ui.pauseGame();
    } else {
        ui.resumeGame();
    }
};

ui.pauseGame = function () {
    if (game.isPaused) return;
    game.pauseLoop();
    pauseButton.classList.add("paused");
};
ui.resumeGame = function () {
    if (!game.isPaused) return;
    game.resumeLoop();
    pauseButton.classList.remove("paused");
};
ui.loseGame = function () {
    gameOverlayDiv.classList.remove("hidden");
    loseMsgDiv.classList.remove("hidden");
};
ui.winGame = function () {
    gameOverlayDiv.classList.remove("hidden");
    winMsgDiv.classList.remove("hidden");
};

ui.reset = function () {
    pauseButton.classList.remove("paused");
    ui.normalSpeed();
    gameOverlayDiv.classList.add("hidden");
    loseMsgDiv.classList.add("hidden");
    winMsgDiv.classList.add("hidden");
};

// ===== Event Handler =====

function clickHandler(e) {
    // Nur bei Linksklick
    if (e.button !== 0) return;
    clickAt(e.offsetX, e.offsetY);
}
function touchHandler(e) {
    var t = e.changedTouches[0];
    clickAt(t.pageX - game.local.offsetX, t.pageY - game.local.offsetY);
}

var clickAt = function (x, y) {
    // Menü zuklappen
//    ui.hideMenu();
    // Nur wenn kein Tower gesetzt wird
    if (selectBlocked) return;
    // Zelle berechnen & auswählen
    var cx = utils.input2Cell(x);
    var cy = utils.input2Cell(y);
    game.local.setSelectedTower(game.local.getTowerAt(cx, cy));
};

// ====== Tower Placing =======
// Maus und Touch haben getrennte Events, welche sich leicht unterschiedlich Verhalten :-/

// Auswählen beim Placen verhindern
var selectBlocked = false;
// Tower Typ zum placen speichern
var placeType = -1;

function towerListHandler(e) {
    // Klicks auf Tower-Button
    if (e.target.matches("button.tower")) {
        // Wenn setzen schon aktiv - beenden
        if (placeType !== -1) ui.endPlace();
        // Gewählten Tower merken
        placeType = Number(e.target.dataset.type);
        ui.startPlace();
    } else if (e.target.matches("button.towerInfo")) {
        // Klick auf Info-Button
//        var towerID = Number(e.target.dataset.type);
//        fillTowerInfo(towerID);
//        ui.showInfo();
    }

}

function towerCancelHandler() {
    ui.endPlace();
}

ui.startPlace = function () {
    cancelPlaceBtn.disabled = false;
    addPlaceListeners();
    game.local.setSelectedTower(null);
    selectBlocked = true;
    game.local.drawSelectCircle(towerTypes[placeType]);
};

ui.endPlace = function () {
    cancelPlaceBtn.disabled = true;
    removePlaceListeners();
    game.local.hideSelection();
    selectBlocked = false;
    placeType = -1;
};

// Events zum Updaten / Beenden beim Placen
var addPlaceListeners = function () {
    game.local.canvasEl.addEventListener("mousemove", moveplaceHandlerMouse);
    game.local.canvasEl.addEventListener("mouseup", endPlaceHandlerMouse);
    game.local.canvasEl.addEventListener("touchmove", movePlaceHandlerTouch);
    game.local.canvasEl.addEventListener("touchend", endPlaceHandlerTouch);
};
var removePlaceListeners = function () {
    game.local.canvasEl.removeEventListener("mousemove", moveplaceHandlerMouse);
    game.local.canvasEl.removeEventListener("mouseup", endPlaceHandlerMouse);
    game.local.canvasEl.removeEventListener("touchmove", movePlaceHandlerTouch);
    game.local.canvasEl.removeEventListener("touchend", endPlaceHandlerTouch);
};
// == Maus ==
function moveplaceHandlerMouse(e) {
    updatePlace(utils.input2Cell(e.offsetX), utils.input2Cell(e.offsetY));
}
function endPlaceHandlerMouse(e) {
    if (e.button === 0) {
        // Linke Maustaste
        tryPlace(utils.input2Cell(e.offsetX), utils.input2Cell(e.offsetY));
    } else if (e.button === 2) {
        // Rechte Maustaste
        ui.endPlace();
    }
}
// == Touch ==
// Touch Events haben keine "offset" Eigenschft
function movePlaceHandlerTouch(e) {
    var t = e.targetTouches[0];
    updatePlace(utils.input2Cell(t.pageX - game.local.offsetX), utils.input2Cell(t.pageY - game.local.offsetY));
}
function endPlaceHandlerTouch(e) {
    var t = e.changedTouches[0];
    tryPlace(utils.input2Cell(t.pageX - game.local.offsetX), utils.input2Cell(t.pageY - game.local.offsetY));
}

function updatePlace(cx, cy) {
    game.local.showSelection();
    // Kreis und Platzhalter mitbewegen, wenn im Feld
    if (game.fieldRect.contains(cx, cy)) {
        game.local.moveSelectionTo(cx, cy);
    }
}

// Versuchen einen Tower zu setzen
function tryPlace(cx, cy) {
    if (game.fieldRect.contains(cx, cy)) {
        game.local.tryAddTowerAt(placeType, cx, cy);
    }
}

/* ====== Tower Stats Handler ====== */
// Verkauft ausgewählten Tower
function sellHandler() {
    var tower = game.local.getSelectedTower();
    if (tower === null) return;
    game.local.sellTower(tower);
    game.local.setSelectedTower(null);

}
// Setzt aim-Funktion von ausgewähltem Tower
var setAimHandler = function (e) {
    if (!e.target.matches("button")) return;
    var tower = game.getSelectedTower();
    var newAimFunc = aimFuncs[e.target.dataset.aim];
    tower.aimFunc = newAimFunc;
    updateAimBtns(newAimFunc.id);
};

function upgradeHandler() {
    var tower = game.local.getSelectedTower();
    if (tower === null) return;
    game.local.upgradeTower(tower);
    game.local.setSelectedTower(game.local.getTowerAt(tower.cx, tower.cy));
}

