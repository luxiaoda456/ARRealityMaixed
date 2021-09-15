//学生端，播放服务端的视频，作为接收端接收数据
var localStream;
var pc;//和相机采集进行通讯

var roomID;
//if(mode=="client"){
  //1、创建或加入房间foo

  if (room !== '') {
    var roomstr={
        room: room,
        mode: mode,
        childmode:"client"
    }
    socket.emit('create or join', roomstr);
    showlog('Attempted to create or  join room:'+room);
  }
  //back1 如果有第二个人加入房间，第一个人会触发房间有人加入导入回调
 socket.on('join', function (room){
    showlog('Another peer made a request to join   room:'+room.roomname+";soketid:"+room.socketid); 
 });
  //back1 自己成功加入
  socket.on('joined', function(room) {
     showlog('joined  room:'+room.roomname+";soketid:"+room.socketid);
     roomID=room.socketid;
  });
  //
  socket.on('readyclient', function(room) {
    showlog('readyclient  room:'+room);
    isChannelReady = true;
    isInitiator=true;//老师端作为发起者

  });

   // This client receives a message
  socket.on('message', function(json) {
    var message=json.message;
   
    if(json.mode=="server"&&json.childmode=="server-client"){
      if (json.remotesocketid!=roomID) {
          showlog('***message.socketid!=roomID:'+message);
        return;
      }
       showlog('Client received message:'+message);
      if (message.type === 'offer') {//收到第一个人发的offer后需要相应answer
        showlog('received offer');
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      } else if (message.type === 'candidate' && isStarted) {//收到服务端的candidate
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });

        pc.addIceCandidate(candidate);
        showlog('received candidate' +message.candidate);
       // sendMessage('start-localStream-record');
      } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();//收到服务端停止指令，需要停止当前和服务端的连接
      }
    }
  });
  maybeStart();

  //fullScreen(localVideo);
  window.addEventListener('mousedown',function(event) {
      fullScreen(localVideo); 
      localVideo.muted = false;
      localVideo.volume=1;
      //必须先停止再播放否则没有声音，电脑上没有这个问题
       localVideo.pause();
      localVideo.play();
  },false);

  //navigator.mediaDevices.getUserMedia(setting)
  //console.log('Getting user media with constraints', constraints);
  //教师端尝试启动RTCPeerConnection
  function maybeStart() {
    //console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady);
    if (!isStarted) {
      showlog('>>>>>>creating peer connection');
      createPeerConnection();
      isStarted = true;
      showlog('Created isInitiator'+isInitiator);
    }
  }

  window.onbeforeunload = function() {
    //sendMessage('bye');
    handleRemoteHangup();
  };

  /////////////////////////////////////////////////////////
  //创建教师端的PeerConnection
  function createPeerConnection() {
    try {
      pc = new RTCPeerConnection(null);
      pc.onicecandidate = handleIceCandidate;
      pc.onaddstream = handleRemoteStreamAdded;//处理远程视频流
      pc.onremovestream = handleRemoteStreamRemoved;

      showlog('Created RTCPeerConnnection');
    } catch (e) {
        showlog('Cannot create RTCPeerConnection object.' + e.message);
        alert('Cannot create RTCPeerConnection object.'+ e.message);
        return;
    }
  }
  //setLocalDescription后触发
  function handleIceCandidate(event) {
    showlog('icecandidate event：'+event);
     pc.onicecandidate = null;//必须取消否则setRemoteDescription也会触发handleIceCandidate
    //  alert('icecandidate event：'+event);
    if (event.candidate) {//发送sdp
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
  function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
  }

  //保存本地sdp并发送offer给远程
  function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
  }


  //显示服务端分享的平面流数据
  function handleRemoteStreamAdded(event) {
    showlog('《《《《《《《Remote stream added1》》》》》》》》');
    localStream = event.stream;
    showlog('《《《《《《《Remote stream added2》》》》》》》》');
    localVideo.srcObject = localStream;
    //必须先停止再播放否则视频有可能刷不出来不知道原因
    localVideo.pause();
    localVideo.play();
  // fullScreen(localVideo);

  }
   //全屏
  function fullScreen(element){
    // 判断各种浏览器，找到正确的方法
     if(element.requestFullscreen) {
      element.requestFullscreen();
     } else if(element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
     } else if(element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
     } else if(element.msRequestFullscreen) {
      element.msRequestFullscreen();
     }
  }
// 启动全屏!


  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  } 
  function doAnswer() {
    showlog('===Sending answer to peer=====');
    pc.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError
    );
  }
  function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
  }

  function stop() {
      showlog('stop=======.');
    isStarted = false;
     if(localVideo.paused){
        localVideo.pause();
         showlog('stop localVideo=======.');
     }
    pc.close();
    pc = null;
  }
//}