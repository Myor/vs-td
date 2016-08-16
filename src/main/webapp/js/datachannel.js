"use strict";

if (window.webkitRTCPeerConnection != undefined) window.RTCPeerConnection = window.webkitRTCPeerConnection;

var configuration = {
  iceServers: [{
      urls: "stun:stun.l.google.com:19302"
    }]
};

var ws;
var peerConnection;
var dataChannel;

function createLobby(id, title, map) {
  var url = new URL("join/" + id, location.href);
  url.searchParams.set("title", title);
  url.searchParams.set("map", map);
  url.protocol = "ws:";
  connectWS(url.toString());
}

function joinLobby(id) {
  var url = new URL("join/" + id, location.href);
  url.protocol = "ws:";
  connectWS(url.toString());
}

function connectWS(url) {
  ws = new WebSocket(url);
  ws.onmessage = onSignalMessage;
  ws.onclose = forceCloseAll;
}

function onSignalMessage(event) {

  try {

    var msg = JSON.parse(event.data);

    console.log("Websocket received", msg.action);
    console.log(msg);

    var action = msg.action;

    if (action === "join-request") {
      if (window.confirm("soll user joinen?")) {
        sendOffer();
      } else {
        console.log("quit");
        closeAll();
      }
    } else if (action === "sdp-offer") {
      handleOffer(msg);
    } else if (action === "sdp-answer") {
      handleAnswer(msg);
    } else if (action === "ice-candidate") {
      handleIceCandidate(msg);
    } else {
      console.log("Unbekannte Signal Message");
    }

  } catch (err) {
    forceCloseAll(err);
  }
}
function sendSignal(obj) {
  if (ws) {
    console.log("WebSocket sending", obj.action);
    ws.send(JSON.stringify(obj));
  }
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);
  peerConnection.onicecandidate = iceCandidateCallback;
}

function sendOffer() {

  createPeerConnection();

  dataChannel = peerConnection.createDataChannel("dataChannel");
  dataChannel.onmessage = onMessageCallback;
  dataChannel.onopen = dataChannelOpen;
  dataChannel.onclose = forceCloseAll;

  console.log("Created peer connection & data channel");

  peerConnection.createOffer().then(function (sdp) {
    return peerConnection.setLocalDescription(sdp);
  }).then(function () {

    sendSignal({
      action: "sdp-offer",
      sdp: peerConnection.localDescription
    });

  }).catch(forceCloseAll);
}

function handleOffer(msg) {

  var sdp = new RTCSessionDescription(msg.sdp);

  createPeerConnection();

  peerConnection.ondatachannel = receiveChannelCallback;
  console.log("Created peer connection");

  peerConnection.setRemoteDescription(sdp).then(function () {
    return peerConnection.createAnswer();
  }).then(function (sdp) {
    return peerConnection.setLocalDescription(sdp);
  }).then(function () {

    sendSignal({
      action: "sdp-answer",
      sdp: peerConnection.localDescription
    });

  }).catch(forceCloseAll);
}

function handleAnswer(msg) {

  var sdp = new RTCSessionDescription(msg.sdp);
  peerConnection.setRemoteDescription(sdp).catch(forceCloseAll);
}

function iceCandidateCallback(event) {
  if (event.candidate) {
    sendSignal({
      action: "ice-candidate",
      candidate: event.candidate
    });
  } else {
    console.log("ICE Done");
  }
}

function handleIceCandidate(msg) {
  peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(forceCloseAll);
}

function receiveChannelCallback(event) {
  console.log("Got data channel");
  dataChannel = event.channel;
  dataChannel.onmessage = onMessageCallback;
  dataChannel.onopen = dataChannelOpen;
  dataChannel.onclose = forceCloseAll;
}

function onMessageCallback(event) {
  console.log("WebRTC Received", event.data);
}

function sendData() {
  var data = dataChannelSend.value;
  dataChannel.send(data);
  console.log("WebRTC Sent Data", data);
}

function sendGameState() {
  var gameData = {
    mobs: game.mobs,
    towers: game.towers
  };
  dataChannel.send(gameData);
}
function dataChannelOpen() {
  ws.onmessage = null;
  ws.onclose = null;
  ws.close();
  ws = null;
  // finish
  console.log("DONE, Start Game...");
}

function forceCloseAll(err) {
  console.log("Verbindung wurde beendet");
  if (err) console.error(err);
  //...
  closeAll();
}

function closeAll() {
  console.log("closing all connections");

  if (ws) {
    ws.onmessage = null;
    ws.onclose = null;
    ws.close();
  }

  if (dataChannel) {
    dataChannel.onmessage = null;
    dataChannel.onopen = null;
    dataChannel.onclose = null;
    dataChannel.close();
  }

  if (peerConnection) {
    peerConnection.ondatachannel = null;
    peerConnection.onicecandidate = null;
    peerConnection.close();
  }

  ws = null;
  dataChannel = null;
  peerConnection = null;

}