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

var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var joinButton = document.querySelector("button#ws-join");

document.querySelector('button#sendButton').onclick = sendData;
document.querySelector('button#closeButton').onclick = closeAll;

joinButton.onclick = joinRoom;

function joinRoom() {
    joinButton.disabled = true;
    
    var roomid = "123";

    var url = new URL("join/" + roomid, location.href);
    url.protocol = "ws:";

    ws = new WebSocket(url.toString());

    ws.onmessage = onSignalMessage;
    ws.onclose = closeAll;

    console.log("Created Websocket");
}

function sendSignal(obj) {
    console.log("WebSocket sending", obj.action);

    ws.send(JSON.stringify(obj));
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
            }
        } else if (action === "sdp-offer") {
            handleOffer(msg);
        } else if (action === "sdp-answer") {
            handleAnswer(msg);
        } else if (action === "ice-candidate") {
            handleIceCandidate(msg);
        } else {
            //?
        }

    } catch (err) {
        handleError(err);
    }
}

function sendOffer() {

    peerConnection = new RTCPeerConnection(null);
    peerConnection.onicecandidate = iceCallback;

    dataChannel = peerConnection.createDataChannel("dataChannel");
    dataChannel.onmessage = onMessageCallback;
    dataChannel.onopen = dataChannelOpen;
    dataChannel.onclose = closeAll;

    console.log("Created peer connection & data channel");

    peerConnection.createOffer().then(function (sdp) {
        return peerConnection.setLocalDescription(sdp);
    }).then(function () {

        sendSignal({
            action: "sdp-offer",
            sdp: peerConnection.localDescription
        });

    }).catch(handleError);
}

function handleOffer(msg) {

    var sdp = new RTCSessionDescription(msg.sdp);

    peerConnection = new RTCPeerConnection(null);
    peerConnection.onicecandidate = iceCallback;

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

    }).catch(handleError);
}

function handleAnswer(msg) {

    var sdp = new RTCSessionDescription(msg.sdp);

    peerConnection.setRemoteDescription(sdp).catch(handleError);
}

function sendData() {
    var data = dataChannelSend.value;
    dataChannel.send(data);
    console.log("WebRTC Sent Data", data);
}

function iceCallback(event) {
    if (event.candidate) {
        sendSignal({
            action: "ice-candidate",
            candidate: event.candidate
        });
    }
}

function handleIceCandidate(msg) {
    peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(handleError);
}

function receiveChannelCallback(event) {
    console.log("Got data channel");
    dataChannel = event.channel;
    dataChannel.onmessage = onMessageCallback;
    dataChannel.onopen = dataChannelOpen;
    dataChannel.onclose = closeAll;
}

function onMessageCallback(event) {
    console.log("WebRTC Received", event.data);
}

function dataChannelOpen() {
    ws.onclose = null;
    ws.close();
    // finish
    console.log("DONE");
}

function handleError(err) {
    console.error("Error", err);
    forceCloseAll();
}

function forceCloseAll() {

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
    
    joinButton.disabled = false;
}