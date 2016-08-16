"use strict";

var net = {};

net.fetchLobbys = function () {

  var lobbyList = document.getElementById("lobbyList");
  var lobbyTmpl = document.getElementById("lobbyTmpl");

  lobbyList.textContent = "Lade Lobbys...";

  fetch("lobbys").then(function (response) {
    return response.json();
  }).then(function (json) {

    if (json.length === 0) {
      lobbyList.textContent = "Keine Lobbys gefunden.";
    } else {
      json.forEach(function (lobby) {
        lobbyList.innerHTML = "";
        lobbyTmpl.content.querySelector(".lobbyTitle").textContent = lobby.title;
        lobbyTmpl.content.querySelector(".joinLobby").dataset.id = lobby.id;
        lobbyTmpl.content.querySelector(".joinLobby").dataset.map = lobby.map;

        lobbyList.appendChild(document.importNode(lobbyTmpl.content, true));
      });
    }

  }).catch(function (err) {
    lobbyList.textContent = "Fehler beim Laden.";
    console.error(err);
  });

};