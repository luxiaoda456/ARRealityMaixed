'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;
const socketServerAddr="https://192.168.10.61:1443";
var mode="client"//client/server
var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};
 
   console.log('test ' + window.test );
var mode = getQueryString('mode');
/////////////////////////////////////////////
//
var room = 'foo';
// Could prompt for room name:
// room = prompt('Enter room name:');

var socket = io.connect(socketServerAddr);
showlog(socketServerAddr);
//1、创建或加入房间foo
if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or  join room', room);
  showlog('Attempted to create or  join room:'+room);
}
//back1 如果是第一个登录的人，服务端相应成功将触发创建成功回调
socket.on('created', function(room) {
  console.log('Created room ' + room);
    showlog('Created  room:'+room);
  isInitiator = true;
});
//back1 如果是第三个或以上的人登录的人，服务端相应成功将触发房间已满的回调
socket.on('full', function(room) {
  console.log('Room ' + room + ' is full');
    showlog('full  room:'+room);
});
//back1 如果有第二个人加入房间，第一个人会触发房间有人加入导入回调
socket.on('join', function (room){
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  showlog('Another peer made a request to join   room:'+room);
  isChannelReady = true;
});
//back1 如果是第二个登录的人，服务端相应成功将触发加入成功回调
socket.on('joined', function(room) {
  console.log('joined: ' + room);
   showlog('joined  room:'+room);
  isChannelReady = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);

});
function showlog(content){

  //$("#log").html(content);
  $("#log").append("<p>"+content+"</p>");
}
////////////////////////////////////////////////

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
  showlog('Client sending message:'+message);
}

// This client receives a message
socket.on('message', function(message) {
  console.log('Client received message:', message);
    showlog('Client received message:'+message);
  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {//收到第一个人发的offer后需要相应answer
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////
//本地视频组件
var localVideo = document.querySelector('#video');
//远端视频组件
var remoteVideo = document.querySelector('#video');
//navigator.mediaDevices.getUserMedia(setting)
if(mode=="teacher"){//只有老师才能录制视频
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}
//教师端获取到本地视频
function gotStream(stream) {
  console.log('Adding local stream.');
  showlog('Adding local stream');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

var constraints = {
   video: { 
       facingMode: { exact: "user" } ,
        width:1920,
        height:1080,
        aspectRadio:16/9
    }
};

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
 // requestTurn(
  //  'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  //);
}
//教师端尝试启动RTCPeerConnection
function maybeStart() {
  console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>> creating peer connection');
    showlog('creating peer connection');
    createPeerConnection();
    if(mode=="teacher")//只有教师端需要发送本地视频流
      pc.addStream(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    showlog('Created isInitiator'+isInitiator);
    if (isInitiator) {
      doCall();//发送offer
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;//处理远程视频流
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
     showlog('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      showlog('Cannot create RTCPeerConnection object.' + e.message);
    return;
  }
}

function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  showlog('icecandidate event：'+event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
  showlog('createOffer() error');
}
//发送offer
function doCall() {
  console.log('Sending offer to peer');
  showlog('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  showlog('Sending answer to peer');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}
//保存本地sdp并发送offer给远程
function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  var turnExists = false;
  for (var i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}
//服务端处理远程视频流
function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
   showlog('Remote stream added');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
