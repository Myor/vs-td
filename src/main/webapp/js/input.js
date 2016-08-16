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
  var lobbyList = id("lobbyList");
  var joinWaitEl = id("joinWait");

  var lobbyTmpl = id("lobbyTmpl");

  // Game
  var gameWrapper = id("gameWrapper");

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
  var towerList = id("towers");
  var towerStats = id("towerStats");

  // Selected-infos
  var tName = towerStats.querySelector(".tName");
  var tDesc = towerStats.querySelector(".tDesc");
  var tKillCount = towerStats.querySelector(".tKillCount");
  var tPower = towerStats.querySelector(".tPower");
  var tFreq = towerStats.querySelector(".tFreq");
  var tRadius = towerStats.querySelector(".tRadius");
  var tUpgrade = towerStats.querySelector(".tUpgrade");
  var tCurrentLvl = towerStats.querySelector(".tCurrentLvl");
  var tNextBtn = towerStats.querySelector(".tNextBtn");
  var tNextLvl = towerStats.querySelector(".tNextLvl");
  var tNextPrice = towerStats.querySelector(".tNextPrice");
  var tSellBtn = towerStats.querySelector(".tSellBtn");
  var tSellPrice = towerStats.querySelector(".tSellPrice");

  // Mobs
  var mobList = id("mobs");

  // Dialogs
  var helpDialog = id("helpDialog");
  var helpCloseBtn = id("closeHelp");

  var newLobbyDialog = id("newLobbyDialog");
  var newLobbyTitle = id("newLobbyTitle");
  var newLobbyMap = id("newLobbyMap");
  var closeNewLobby = id("closeNewLobby");
  var createNewLobby = id("createNewLobby");

  var conLostDialog = id("conLostDialog");
  var closeConLost = id("closeConLost");

  dialogPolyfill.registerDialog(helpDialog);
  dialogPolyfill.registerDialog(newLobbyDialog);
  dialogPolyfill.registerDialog(conLostDialog);

  var lobbyId;

  newLobbyBtn.addEventListener("click", function () {
    lobbyId = Math.floor(Math.random() * 1000000000);
    newLobbyTitle.placeholder = "Lobby" + lobbyId;
    newLobbyDialog.showModal();
  });

  closeNewLobby.addEventListener("click", function () {
    newLobbyDialog.close();
  });

  createNewLobby.addEventListener("click", function () {
    newLobbyDialog.close();

    var lobbyTitle = newLobbyTitle.value !== "" ? newLobbyTitle.value : newLobbyTitle.placeholder;
    var lobbyMap = parseInt(newLobbyMap.value);

    createLobby(lobbyId, lobbyTitle, lobbyMap);

    ui.toJoinWait();
  });

  lobbyListFetchBtn.addEventListener("click", function () {
    ui.fetchLobbys();
  });

  lobbyList.addEventListener("click", function (e) {
    var btn = e.target;
    if (btn.matches(".joinLobby")) {
      var lobbyId = btn.dataset.id;
      var map = btn.dataset.map;
      joinLobby(lobbyId);
      ui.toJoinWait();
    }
  });

  // Join Menüs
  ui.toJoinMenu = function () {
    ui.fetchLobbys();
    joinMenuEl.classList.remove("hidden");
    joinLobbyEl.classList.remove("hidden");
    joinWaitEl.classList.add("hidden");
    gameWrapper.classList.add("hidden");
  };

  ui.toJoinWait = function () {
    joinLobbyEl.classList.add("hidden");
    joinWaitEl.classList.remove("hidden");
  };

  ui.toGame = function () {
    joinMenuEl.classList.add("hidden");
    gameWrapper.classList.remove("hidden");
  };

  ui.fetchLobbys = function () {
    fetch("lobbys").then(function (response) {
      return response.json();
    }).then(function (json) {

      if (json.length === 0) {
        lobbyList.textContent = "Keine Lobbys gefunden.";
      } else {
        lobbyList.innerHTML = "";
        json.forEach(function (lobby) {
          lobbyTmpl.content.querySelector(".lobbyTitle").textContent = lobby.title;
          lobbyTmpl.content.querySelector(".joinLobby").dataset.id = lobby.id;
          lobbyTmpl.content.querySelector(".joinLobby").dataset.map = lobby.map;

          lobbyList.appendChild(document.importNode(lobbyTmpl.content, true));
        });
      }

    }).catch(function (err) {
      console.error(err);
    });
  };

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
  // ===== Menüs =====

  ui.showSelectedInfo = function (tower) {
    if (tower === null) {
      towerStats.classList.add("invisible");
    } else {
      towerStats.classList.remove("invisible");
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

  exitBtn.addEventListener("click", function () {
    game.exit();
  });

  helpBtn.addEventListener("click", function () {
    helpDialog.show();
  });
  helpCloseBtn.addEventListener("click", function () {
    helpDialog.close();
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
  towerList.addEventListener("click", function (e) {
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