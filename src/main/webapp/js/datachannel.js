"use strict";

var net = {};

var RTCPeerConnection = window.webkitRTCPeerConnection || window.RTCPeerConnection;

var configuration = {
  iceServers: [{
      urls: "stun:stun.l.google.com:19302"
    }]
};

var PeerConnection = function (id, title, map) {

  this.ws = null;
  this.peerConnection = null;
  this.dataChannel = null;

  this._sendSignal = this._sendSignal.bind(this);
  this._onSignalMessage = this._onSignalMessage.bind(this);
  this._createPeerConnection = this._createPeerConnection.bind(this);
  this._sendOffer = this._sendOffer.bind(this);
  this._handleOffer = this._handleOffer.bind(this);
  this._handleAnswer = this._handleAnswer.bind(this);
  this._iceCandidateCallback = this._iceCandidateCallback.bind(this);
  this._handleIceCandidate = this._handleIceCandidate.bind(this);
  this._receiveChannelCallback = this._receiveChannelCallback.bind(this);
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
  this.peerConnection.onicecandidate = this._iceCandidateCallback;
};

PeerConnection.prototype._sendOffer = function () {

  this._createPeerConnection();

  this.dataChannel = this.peerConnection.createDataChannel("dataChannel");
  this.dataChannel.onmessage = this._onMessageCallback;
  this.dataChannel.onopen = this._dataChannelOpen;
  this.dataChannel.onclose = this._forceCloseAll;

  console.log("Created peer connection & data channel");
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

  this.peerConnection.ondatachannel = this._receiveChannelCallback;
  console.log("Created peer connection");
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

PeerConnection.prototype._iceCandidateCallback = function (event) {
  if (event.candidate) {
    this._sendSignal({
      action: "ice-candidate",
      candidate: event.candidate
    });
  } else {
    console.log("ICE Done");
  }
};

PeerConnection.prototype._handleIceCandidate = function (msg) {
  this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(this._forceCloseAll);
};

PeerConnection.prototype._receiveChannelCallback = function (event) {
  console.log("Got data channel");
  this.dataChannel = event.channel;
  this.dataChannel.onmessage = this._onMessageCallback;
  this.dataChannel.onopen = this._dataChannelOpen;
  this.dataChannel.onclose = this._forceCloseAll;
};

PeerConnection.prototype._onMessageCallback = function (event) {
  this.emit("message", event.data);
  console.log("WebRTC Received", event.data);
};

PeerConnection.prototype._dataChannelOpen = function () {
  this.ws.onmessage = null;
  this.ws.onclose = null;
  this.ws.close();
  this.ws = null;

  this.emit("connect");
};

PeerConnection.prototype._forceCloseAll = function (err) {
  if (err) console.error(err);
  //...
  this.close();
};

PeerConnection.prototype.sendData = function (data) {
  this.dataChannel.send(data);
};

PeerConnection.prototype.close = function () {

  if (this.ws !== null) {
    this.ws.onmessage = null;
    this.ws.onclose = null;
    this.ws.close();
  }

  if (this.dataChannel !== null) {
    this.dataChannel.onmessage = null;
    this.dataChannel.onopen = null;
    this.dataChannel.onclose = null;
    this.dataChannel.close();
  }

  if (this.peerConnection !== null) {
    this.peerConnection.ondatachannel = null;
    this.peerConnection.onicecandidate = null;
    this.peerConnection.close();
  }

  this.ws = null;
  this.dataChannel = null;
  this.peerConnection = null;

};