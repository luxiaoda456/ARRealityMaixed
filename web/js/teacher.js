var localStream;
var pc=null;

var remoteStream;
var dataChannel ;
var dataChannelOpen=false;
const teacherDataChanger=function(json){
    //showlog(json);
    if(dataChannel&&dataChannelOpen)
      dataChannel.send(JSON.stringify(json));
}
/////////////////////////////////////////////
if(mode=="teacher"){

  $("#beforeLayer").hide();

  //1、创建或加入房间
  if (room !== '') {
    var roomstr={
        room: room,
        mode: mode,
        childmode:"teacher"
    }
    socket.emit('create or join', roomstr);
    showlog('Attempted to create or  join room:'+room);
  }
  //back1 其他人加入
  socket.on('join', function (room){
  showlog('Another peer made a request to join   room:'+room.roomname+";soketid:"+room.socketid); 
  });
  //back1 自己成功加入
  socket.on('joined', function(room) {
     showlog('joined  room:'+room.roomname+";soketid:"+room.socketid);
  });
  //back1 2个角色已加入（teacher，server）
  socket.on('readyteacher', function(room) {
    //注意不管是stream还是数据通道都必须在offer发送前建立否则对方监听不到
    dataChannelOpen=false;
       showlog('createDataChannel >>>>>>>>>>>>>>>>>>>  room:'+room);
    dataChannel = pc.createDataChannel("DataChannel", dataChannelOptions);//使用信令传输信道创建对等连接 
    dataChannel.onopen = function(event) {
     // debugger;
      dataChannelOpen=true;
        showlog('dataChannelOpen send  Hi you!');
        var json={
          event:"message",
          content:"hi you"
        }
       // debugger;
        teacherDataChanger(json);
    };
    dataChannel.onmessage = function(event) {
      console.log(event.data);
    };
     dataChannel.onclose = function(event) {
      dataChannelOpen=false;
    };
    if(isChannelReady==false)
        doCall();//发送offer    
    isChannelReady = true;
    isInitiator=true;//老师端作为发起者
  });
  // This client receives a message
  socket.on('message', function(json) {
    var message=json.message;
    //showlog('Client received message:'+message);
    if(json.mode=="server"&&json.childmode=="server-teacher"){
      if (message.type === 'answer' && isStarted) {//相应服务端的answer并保存remote信息
        showlog('answer');
        pc.setRemoteDescription(new RTCSessionDescription(message));

      } else if (message.type === 'candidate' && isStarted) {//收到服务端的candidate
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
        showlog('<<<<<<<<<<<<<<<<<<<<<<<<<<<<candidate>>>>>>>>>>>>>>>');
       // sendMessage('start-localStream-record');
      } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();//收到服务端停止指令，需要停止当前和服务端的连接
      }
    }
  });
  maybeStart();
  //navigator.mediaDevices.getUserMedia(setting)
  //console.log('Getting user media with constraints', constraints);
  //教师端尝试启动RTCPeerConnection
  function maybeStart() {
    //console.log('>>>>>>> maybeStart() ', isStarted, isChannelReady);
    if (!isStarted) {
      showlog('>>>>>>creating peer connection');
      createPeerConnection();
      //pc.addStream(localStream);
  

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
  //发送offer
  function doCall() {
    showlog('Sending offer to peer');
    //pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    pc.createOffer(sdpConstraints).then(setLocalAndSendMessage);
  }

  //保存本地sdp并发送offer给远程


  function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
  }


  //服务端处理远程视频流，教师端无需处理服务端发送共享桌面信息，而且服务端也不会给教师发
  function handleRemoteStreamAdded(event) {
     showlog('Remote stream added');
  sendMessage("handleRemoteStreamAdded=================================================================teacher error");

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
    pc.close();
    pc = null;
  }
}