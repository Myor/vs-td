"use strict";

window.RTCPeerConnection = window.webkitRTCPeerConnection || window.RTCPeerConnection;

var configuration = {
  iceServers: [{
      urls: "stun:stun.l.google.com:19302"
    }]
};

var PeerConnection = function (id, title, map) {

  this.ws = null;
  this.peerConnection = null;
  this.dataChannel = null;

  this.isChannelOpen = false;
  this.isICEDone = false;

  this._onSignalMessage = this._onSignalMessage.bind(this);
  this._onIceCandidate = this._onIceCandidate.bind(this);
  this._onReceiveChannel = this._onReceiveChannel.bind(this);
  this._onMessageCallback = this._onMessageCallback.bind(this);
  this._dataChannelOpen = this._dataChannelOpen.bind(this);
  this._forceCloseAll = this._forceCloseAll.bind(this);


  var url = new URL("join/" + id, location.href);
  if (title !== undefined) {
    url.searchParams.set("title", title);
    url.searchParams.set("map", map);
  }
  url.protocol = "ws:";

  this.ws = new WebSocket(url);
  this.ws.onmessage = this._onSignalMessage;
  this.ws.onclose = this._forceCloseAll;

};

PeerConnection.prototype = new PIXI.utils.EventEmitter();
PeerConnection.prototype.constructor = PeerConnection;


PeerConnection.prototype._sendSignal = function (obj) {
  if (this.ws !== null) {
    this.ws.send(JSON.stringify(obj));
  }
};

PeerConnection.prototype._onSignalMessage = function (event) {
  try {

    var msg = JSON.parse(event.data);
    var action = msg.action;

    if (action === "join-request") {
      this._sendOffer();
    } else if (action === "sdp-offer") {
      this._handleOffer(msg);
    } else if (action === "sdp-answer") {
      this._handleAnswer(msg);
    } else if (action === "ice-candidate") {
      this._handleIceCandidate(msg);
    } else {
      console.log("Unbekannte Signal Message");
    }

  } catch (err) {
    this._forceCloseAll(err);
  }
};

PeerConnection.prototype._createPeerConnection = function () {
  this.peerConnection = new RTCPeerConnection(configuration);
  this.peerConnection.onicecandidate = this._onIceCandidate;
};

PeerConnection.prototype._sendOffer = function () {

  this._createPeerConnection();

  this.dataChannel = this.peerConnection.createDataChannel("dataChannel");
  this.dataChannel.onmessage = this._onMessageCallback;
  this.dataChannel.onopen = this._dataChannelOpen;
  this.dataChannel.onclose = this._forceCloseAll;

  console.log("Created data channel");
  var con = this;

  this.peerConnection.createOffer().then(function (sdp) {
    return con.peerConnection.setLocalDescription(sdp);
  }).then(function () {

    con._sendSignal({
      action: "sdp-offer",
      sdp: con.peerConnection.localDescription
    });

  }).catch(this._forceCloseAll);
};

PeerConnection.prototype._handleOffer = function (msg) {
  var sdp = new RTCSessionDescription(msg.sdp);

  this._createPeerConnection();

  this.peerConnection.ondatachannel = this._onReceiveChannel;
  var con = this;

  this.peerConnection.setRemoteDescription(sdp).then(function () {
    return con.peerConnection.createAnswer();
  }).then(function (sdp) {
    return con.peerConnection.setLocalDescription(sdp);
  }).then(function () {

    con._sendSignal({
      action: "sdp-answer",
      sdp: con.peerConnection.localDescription
    });

  }).catch(this._forceCloseAll);
};

PeerConnection.prototype._handleAnswer = function (msg) {
  var sdp = new RTCSessionDescription(msg.sdp);
  this.peerConnection.setRemoteDescription(sdp).catch(this._forceCloseAll);
};

PeerConnection.prototype._onIceCandidate = function (event) {
  if (event.candidate) {
    this._sendSignal({
      action: "ice-candidate",
      candidate: event.candidate
    });
  } else {
    console.log("ice done");
    this.isICEDone = true;
    this._closeWebsocket();
  }
};

PeerConnection.prototype._handleIceCandidate = function (msg) {
  var candidate = new RTCIceCandidate(msg.candidate);
  this.peerConnection.addIceCandidate(candidate).catch(this._forceCloseAll);
};

PeerConnection.prototype._onReceiveChannel = function (event) {
  console.log("Got data channel");
  this.dataChannel = event.channel;
  this.dataChannel.onmessage = this._onMessageCallback;
  this.dataChannel.onopen = this._dataChannelOpen;
  this.dataChannel.onclose = this._forceCloseAll;
};

PeerConnection.prototype._onMessageCallback = function (event) {
  var msg = JSON.parse(event.data);

  this.emit(msg.e, msg.a1, msg.a2, msg.a3);
};

PeerConnection.prototype._dataChannelOpen = function () {
  console.log("datachannel open");
  this.isChannelOpen = true;
  this._closeWebsocket();

  this.emit("connect");
};

PeerConnection.prototype._closeWebsocket = function () {
  if (this.isChannelOpen && this.isICEDone && this.ws !== null) {
    var ws = this.ws;
    this.ws.onmessage = null;
    this.ws.onclose = null;
    this.ws = null;
    setTimeout(function () {
      ws.close();
    }, 1000);
  }
};

PeerConnection.prototype._forceCloseAll = function (err) {
  this.close();
  if (err) {
    console.error(err);
  }
};

PeerConnection.prototype.sendEvent = function (eventName, a1, a2, a3) {
  if (this.dataChannel === null) return;
  this.dataChannel.send(JSON.stringify({
    e: eventName,
    a1: a1,
    a2: a2,
    a3: a3
  }));
};

PeerConnection.prototype.pipeEvent = function (emiter, eventName) {
  var connection = this;
  emiter.on(eventName, function (a1, a2, a3) {
    connection.sendEvent(eventName, a1, a2, a3);
  });
};

PeerConnection.prototype.close = function () {

  if (this.ws !== null) {
    this.ws.onmessage = null;
    this.ws.onclose = null;
    this.ws.close();
    this.ws = null;
  }

  if (this.dataChannel !== null) {
    this.dataChannel.onmessage = null;
    this.dataChannel.onopen = null;
    this.dataChannel.onclose = null;
    this.dataChannel.close();
    this.dataChannel = null;

  }

  if (this.peerConnection !== null) {
    this.peerConnection.ondatachannel = null;
    this.peerConnection.onicecandidate = null;
    this.peerConnection.close();
    this.peerConnection = null;

  }

  this.emit("close");
};
