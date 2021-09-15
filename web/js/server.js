//服务端clientcamera用于和相机端通讯获取相机流数据
var localStream;
var pc4;//和相机采集进行通讯


if(mode=="server"){
  //1、创建或加入房间foo
  if (room !== '') {
    var roomstr={
        room: room,
        mode: mode,
        childmode:"server"
    }
    socket.emit('create or join', roomstr);
    showlog('Attempted to create or  join room:'+room);
  }
  //back1 如果有第二个人加入房间，第一个人会触发房间有人加入导入回调
  socket.on('join', function (room){

    showlog('Another peer made a request to join   room:'+room.roomname+";soketid:"+room.socketid); 
  });
  //back1 如果是第二个登录的人，服务端相应成功将触发加入成功回调
  socket.on('joined', function(room) {
    //isInitiator=true;//老师端作为发起者
     showlog('joined  room:'+room.roomname+";soketid:"+room.socketid);
    
  });
  socket.on('readycamera', function(room) {
     showlog('readycamera  room:'+room);
    isChannelReady = true;
    
  });
  socket.on('readyclient', function(room) {
     showlog('readyclient  room:'+room);
   // isChannelReady = true;
  });
function onSuccess() {};
function onError(error) {
  console.error(error);
};
  // This client receives a message
  socket.on('message', function(json) {
    var message=json.message;
    //showlog('received '+json.mode+' message:'+message);
    if(json.mode=="clientcamera"){
      if (message === 'got user media') {//教室开始录制视频
      }else if (message.type === 'offer') {//收到第一个人发的offer后需要相应answer
        showlog('received offer');
        //pc4.setRemoteDescription(new RTCSessionDescription(message));
        //doAnswer();
         pc4.setRemoteDescription(new RTCSessionDescription(message),() => {
        // When receiving an offer lets answer it        
            pc4.createAnswer().then(setLocalAndSendMessage).catch(onCreateSessionDescriptionError);
          
        }, onCreateSessionDescriptionError);

      } else if (message.type === 'answer' && isStarted) {
           showlog('received answer');
        pc4.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && isStarted) {
        showlog('received candidate '+message.candidate);
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });   
        if(message.candidatejson){
          pc4.addIceCandidate(new RTCIceCandidate(message.candidatejson), onSuccess, onError);
        }else
         pc4.addIceCandidate(candidate, onSuccess, onError);
      } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
      }
    }
  });
  maybeStart();
  window.addEventListener('mousedown',function(event) {//h5不支持声音自动播放
     localVideo.muted = false;
      showlog('localVideo.muted = false');
  },false);
  //教师端尝试启动RTCPeerConnection
  function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady);
    if (!isStarted) {
      createPeerConnection();
      isStarted = true;
 
    }
  }

  window.onbeforeunload = function() {
   // sendMessage('bye');
    handleRemoteHangup();
  };

  /////////////////////////////////////////////////////////
 //创建服务端端PeerConnection
  function createPeerConnection() {
    try {
      pc4 = new RTCPeerConnection(configuration);
      pc4.onicecandidate = handleIceCandidate;
      pc4.onaddstream = handleRemoteStreamAdded;//处理远程视频流

      pc4.onremovestream = handleRemoteStreamRemoved;
/**
      pc4.addEventListener('addstream', function(e) {
          //  showlog('addstream::::::::::::::::::::::::::::::::::::::::::：'+e);
          //  debugger;
          localStream = e.stream;
          localVideo.srcObject = localStream;
      });**/


       showlog('Created RTCPeerConnnection');
    } catch (e) {
          showlog('Cannot create RTCPeerConnection object.' + e.message);
      alert('Cannot create RTCPeerConnection object.');
  
      return;
    }
  }

  function handleIceCandidate(event) {
    showlog('icecandidate event：'+event);
     pc4.onicecandidate = null;
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
        candidatejson:event.candidate
      });
    } else {
      console.log('End of candidates.');
    }
  }

  function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
    showlog('createOffer() error');
  }


  function doAnswer() {
    showlog('===Sending answer to peer=====');
    pc4.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError
    );
  }
  //保存本地sdp并发送offer给远程
  function setLocalAndSendMessage(sessionDescription) {
    pc4.setLocalDescription(sessionDescription,
      () => sendMessage(pc4.localDescription),
      onCreateSessionDescriptionError
    );
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    //sendMessage(sessionDescription);
  }

  function onCreateSessionDescriptionError(error) {
    //trace('Failed to create session description: ' + error.toString());
      showlog('Failed to create session description: ' + error.toString());
  }


  //服务端处理远程视频流
  function handleRemoteStreamAdded(event) {
     showlog('Remote stream added');
    localStream = event.stream;
    localVideo.srcObject = localStream;

    var tracks=localStream.getAudioTracks();
   // remoteStream.addTrack(tracks[0]);

    //pc4.addStream(localStream);
    //localStream.getTracks().forEach(track => pc4.addTrack(track, localStream));

    //必须先停止再播放否则视频有可能刷不出来不知道原因
    localVideo.pause();
    localVideo.play();
  }

  function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
  }



  function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
  }

  function stop() {
    isStarted = false;
    //localVideo.stop();
 
    pc4.close();
    pc4 = null;
  }



//==========================下面是无用的测试代码

//startRecord();
//双向流测试
  //只有老师才能录制视频
function startRecord(){
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then(stream => {
      // Display your local video in #localVideo element
      // Add your stream to be sent to the conneting peer
  
        pc4.addStream(stream);
    }, onError);
}
function onSuccess() {};
function onError(error) {
  console.error(error);
};
//////////////////////////////////////////////////////







}