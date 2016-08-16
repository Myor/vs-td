"use strict";

var ui = {};

(function () {

  function id(selector) {
    return document.getElementById(selector);
  }

  // Join Menu
  var joinMenuEl = id("joinMenu");
  var joinLobbyEl = id("joinLobby");
  var newLobbyBtn = id("newLobby");
  var lobbyListFetchBtn = id("lobbyListFetch");
  var lobbyListEl = id("lobbyList");
  var joinWaitEl = id("joinWait");

  // Game
  var gameWrapperEl = id("gameWrapper");

  // Stats
  var localLifeEl = id("localLife");
  var localCashEl = id("localCash");
  var localLifeBar = document.querySelector("#localStats .gameLifeBar");
  // Remote
  var remoteLifeEl = id("remoteLife");
  var remoteLifeBar = document.querySelector("#remoteStats .gameLifeBar");

  // Menu
  var cancelPlaceBtn = id("cancelPlace");
  var helpBtn = id("helpGame");
  var exitBtn = id("exitGame");

  // Towers
  var towerListEl = id("towers");
  var towerStatsEl = id("towerStats");

  // Selected-infos
  var tName = towerStatsEl.querySelector(".tName");
  var tDesc = towerStatsEl.querySelector(".tDesc");
  var tKillCount = towerStatsEl.querySelector(".tKillCount");
  var tPower = towerStatsEl.querySelector(".tPower");
  var tFreq = towerStatsEl.querySelector(".tFreq");
  var tRadius = towerStatsEl.querySelector(".tRadius");
  var tUpgrade = towerStatsEl.querySelector(".tUpgrade");
  var tCurrentLvl = towerStatsEl.querySelector(".tCurrentLvl");
  var tNextBtn = towerStatsEl.querySelector(".tNextBtn");
  var tNextLvl = towerStatsEl.querySelector(".tNextLvl");
  var tNextPrice = towerStatsEl.querySelector(".tNextPrice");
  var tSellBtn = towerStatsEl.querySelector(".tSellBtn");
  var tSellPrice = towerStatsEl.querySelector(".tSellPrice");

  // Mobs
  var mobList = id("mobs");

  // Dialogs
  var helpDialogEl = id("helpDialog");
  var helpCloseBtn = id("closeHelp");

  var newLobbyDialogEl = id("newLobbyDialog");
  var newLobbyTitleEl = id("newLobbyTitle");
  var newLobbyMapEl = id("newLobbyMap");
  var closeNewLobbyBtn = id("closeNewLobby");
  var createNewLobbyBtn = id("createNewLobby");

  var conLostDialogEl = id("conLostDialog");
  var closeConLostBtn = id("closeConLost");

  dialogPolyfill.registerDialog(helpDialogEl);
  dialogPolyfill.registerDialog(newLobbyDialogEl);
  dialogPolyfill.registerDialog(conLostDialogEl);

  // ===== Lobby Join =====
  var lobbyId;
  // Lobby erstellen öffnen
  newLobbyBtn.addEventListener("click", function () {
    lobbyId = Math.floor(Math.random() * 1000000000);
    newLobbyTitleEl.placeholder = "Lobby" + lobbyId;
    newLobbyDialogEl.showModal();
  });

  // Lobby erstellen abbrechen
  closeNewLobbyBtn.addEventListener("click", function () {
    newLobbyDialogEl.close();
  });

  // Lobby erstellen
  createNewLobbyBtn.addEventListener("click", function () {
    newLobbyDialogEl.close();

    var lobbyTitle = newLobbyTitleEl.value !== "" ? newLobbyTitleEl.value : newLobbyTitleEl.placeholder;
    var lobbyMap = Number(newLobbyMapEl.value);

    game.mapId = lobbyMap;
    game.connection = new PeerConnection(lobbyId, lobbyTitle, lobbyMap);
    game.connection.on("connect", startGame);
    game.connection.on("close", closeGame);

    ui.toJoinWait();
  });

  // Liste updaten
  lobbyListFetchBtn.addEventListener("click", net.fetchLobbys);

  lobbyListEl.addEventListener("click", function (e) {
    var btn = e.target;
    if (btn.matches(".joinLobby")) {
      var lobbyId = btn.dataset.id;

      game.mapId = Number(btn.dataset.map);
      game.connection = new PeerConnection(lobbyId);
      game.connection.on("connect", startGame);
      game.connection.on("close", closeGame);

      ui.toJoinWait();
    }
  });

  function startGame() {
    ui.toGame();
    game.start();
    ui.updateLocalLife();
    ui.updateRemoteLife();
    ui.setupLocalInput();
  }

  function closeGame() {
    ui.showConLost();
    ui.toJoinMenu();
    game.exit();
    game.connection = null;
  }

  function quitGame() {
    game.connection.off("connect", startGame);
    game.connection.off("close", closeGame);
    game.connection.close();
    ui.toJoinMenu();
    game.exit();
    game.connection = null;
  }

  // ===== Lobby Join Menüs =====

  ui.toJoinMenu = function () {
    net.fetchLobbys();
    joinMenuEl.classList.remove("hidden");
    joinLobbyEl.classList.remove("hidden");
    joinWaitEl.classList.add("hidden");
    gameWrapperEl.classList.add("hidden");
  };

  ui.toJoinWait = function () {
    joinLobbyEl.classList.add("hidden");
    joinWaitEl.classList.remove("hidden");
  };

  ui.toGame = function () {
    joinMenuEl.classList.add("hidden");
    gameWrapperEl.classList.remove("hidden");
  };

  // Verbindung verloren Popup
  ui.showConLost = function () {
    conLostDialogEl.show();
  };

  closeConLostBtn.addEventListener("click", function () {
    conLostDialogEl.close();
  });

  // ===== Events dynamisch erstellte Elemente =====
  ui.setupLocalInput = function () {
    // Kein Kontextmenü
    game.local.canvasEl.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
    // Klick auf Spielfeld
    game.local.canvasEl.addEventListener("click", clickHandler);
    game.local.canvasEl.addEventListener("touchend", touchHandler);

    //  document.addEventListener("visibilitychange", visibleHandler);
  };

  ui.updateCash = function () {
    localCashEl.textContent = game.local.cash;
  };

  ui.updateLocalLife = function () {
    localLifeEl.textContent = game.local.life;
    localLifeBar.style.width = game.local.life / game.local.fullLife * 100 + "%";

  };
  ui.updateRemoteLife = function () {
    remoteLifeEl.textContent = game.remote.life;
    remoteLifeBar.style.width = game.remote.life / game.remote.fullLife * 100 + "%";
  };

  // ===== Tower Informationen =====
  ui.showSelectedInfo = function (tower) {
    if (tower === null) {
      towerStatsEl.classList.add("invisible");
    } else {
      towerStatsEl.classList.remove("invisible");
      fillInfoSelected(tower);
    }
  };

  var fillInfoSelected = function (tower) {
    var type = tower.type;
    // Daten
    tName.textContent = type.name;
    tDesc.textContent = type.desc;
    tKillCount.textContent = tower.killCount;
    tPower.textContent = "power" in type ? tower.getPower().toFixed(2) : "-";
    tFreq.textContent = "freq" in type ? tower.getFreq().toFixed(2) : "-";
    tRadius.textContent = "radius" in type ? type.radius : "-";
    // Upgrades
    var hasNext = type.next !== undefined;
    tUpgrade.classList.toggle("noUpgrade", !hasNext);
    tCurrentLvl.textContent = type.level;
    tNextLvl.textContent = hasNext ? towerTypes[type.next].level : "-";
    tNextPrice.textContent = hasNext ? towerTypes[type.next].price : "-";
    tNextBtn.disabled = hasNext ? false : true;
    // Verkauf
    tSellPrice.textContent = type.sellPrice;
  };

  // ===== Button Event Handler =====

  exitBtn.addEventListener("click", quitGame);

  helpBtn.addEventListener("click", function () {
    helpDialogEl.show();
  });
  helpCloseBtn.addEventListener("click", function () {
    helpDialogEl.close();
  });

  function visibleHandler() {
    console.log(document.hidden);
  }

  // ====== Klick auf Spielfend ======
  function clickHandler(e) {
    // Nur bei Linksklick
    if (e.button !== 0) return;
    clickAt(e.offsetX, e.offsetY);
  }
  function touchHandler(e) {
    var t = e.changedTouches[0];
    clickAt(t.pageX - game.local.offsetX, t.pageY - game.local.offsetY);
  }

  function clickAt(x, y) {
    // Nur wenn kein Tower gesetzt wird
    if (selectBlocked) return;
    // Zelle berechnen & auswählen
    var cx = utils.input2Cell(x);
    var cy = utils.input2Cell(y);
    game.local.setSelectedTower(game.local.getTowerAt(cx, cy));
  }

  // ====== Tower Setzen =======

  // Auswählen beim Placen verhindern
  var selectBlocked = false;
  // Tower Typ zum placen speichern
  var placeType = -1;

  // Tower spawn
  towerListEl.addEventListener("click", function (e) {
    // Klicks auf Tower-Button
    if (e.target.matches("button.tower")) {
      // Wenn setzen schon aktiv - beenden
      if (placeType !== -1) endPlace();
      // Gewählten Tower merken
      placeType = Number(e.target.dataset.type);
      startPlace();
    }

  });

  function towerCancelHandler() {
    endPlace();
  }

  function startPlace() {
    //  cancelPlaceBtn.disabled = false;
    addPlaceListeners();
    game.local.setSelectedTower(null);
    selectBlocked = true;
    game.local.drawSelectCircle(towerTypes[placeType].radius);
  }

  function endPlace() {
    //  cancelPlaceBtn.disabled = true;
    removePlaceListeners();
    game.local.hideSelection();
    selectBlocked = false;
    placeType = -1;
  }

  // Events zum Updaten / Beenden beim Placen
  function addPlaceListeners() {
    game.local.canvasEl.addEventListener("mousemove", moveplaceHandlerMouse);
    game.local.canvasEl.addEventListener("mouseup", endPlaceHandlerMouse);
    game.local.canvasEl.addEventListener("touchmove", movePlaceHandlerTouch);
    game.local.canvasEl.addEventListener("touchend", endPlaceHandlerTouch);
  }
  function removePlaceListeners() {
    game.local.canvasEl.removeEventListener("mousemove", moveplaceHandlerMouse);
    game.local.canvasEl.removeEventListener("mouseup", endPlaceHandlerMouse);
    game.local.canvasEl.removeEventListener("touchmove", movePlaceHandlerTouch);
    game.local.canvasEl.removeEventListener("touchend", endPlaceHandlerTouch);
  }
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
      endPlace();
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
      game.local.buyTowerAt(placeType, cx, cy);
    }
  }

  // ====== Tower Stats Handler ======
  // Verkauft ausgewählten Tower
  tSellBtn.addEventListener("click", function () {
    var tower = game.local.getSelectedTower();
    if (tower === null) return;
    game.local.sellTower(tower);
    game.local.setSelectedTower(null);

  });

  tNextBtn.addEventListener("click", function () {
    var tower = game.local.getSelectedTower();
    if (tower === null) return;
    game.local.upgradeTower(tower);
    game.local.setSelectedTower(game.local.getTowerAt(tower.cx, tower.cy));
  });

  // ====== Mob Spawn Handler ======

  mobList.addEventListener("click", function (e) {
    // Klicks auf Mob-Button
    if (e.target.matches("button.mob")) {
      var typeId = Number(e.target.dataset.type);
      game.local.spawnMob(typeId);
    }
  });


}());