"use strict";

var net = {};

net.fetchLobbys = function () {
  // Liste
  var lobbyList = document.getElementById("lobbyList");
  // Template für Lobby
  var lobbyTmpl = document.getElementById("lobbyTmpl");

  lobbyList.textContent = "Lade Lobbys...";

  fetch("lobbys").then(function (response) {
    // Nachricht als JSON parsen
    return response.json();
  }).then(function (json) {
    // Liste in Seite einfügen
    if (json.length === 0) {
      lobbyList.textContent = "Keine Lobbys gefunden.";
    } else {
      json.forEach(function (lobby) {
        lobbyList.innerHTML = "";
        // Template befüllen
        lobbyTmpl.content.querySelector(".lobbyTitle").textContent = lobby.title;
        lobbyTmpl.content.querySelector(".joinLobby").dataset.id = lobby.id;
        lobbyTmpl.content.querySelector(".joinLobby").dataset.map = lobby.map;
        // Element klonen und einfügen
        lobbyList.appendChild(document.importNode(lobbyTmpl.content, true));
      });
    }

  }).catch(function (err) {
    // Fehler bei der Anfrage / Verarbeitung
    lobbyList.textContent = "Fehler beim Laden der Lobbys.";
    console.error(err);
  });

};