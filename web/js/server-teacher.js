//服务端teacher用于和老师通讯的控制服务
var pc2;//和教师进行通讯,接收控制指令
var dataChannel ;
var childmode3="server-teacher";
var isStarted2=false;
var isChannelReady2=false;
if(mode=="server"){
  //1、创建或加入房间foo
  if (room !== '') {

    var roomstr={
        room: room,
        mode: mode,
        childmode:childmode3
    }
  }

  socket.on('readyteacher', function(room) {
     showlog('readyteacher  room:'+room);
    isChannelReady2 = true;
  
  });
  

  // This client receives a message
  socket.on('message', function(json) {
    var message=json.message;

    if(json.mode=="teacher"){
      if (message.type === 'offer') {//收到第一个人发的offer后需要相应answer
        showlog('pc teacher received offer:'+json.mode);
        pc2.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      } else if (message.type === 'answer' && isStarted2) {
           showlog('pc teacher received answer:'+json.mode);
        pc2.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate' && isStarted2) {
        showlog('pc teacher received candidate '+message.candidate+";json.mode:"+json.mode);
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
   
        pc2.addIceCandidate(candidate);
      } else if (message === 'bye' && isStarted2) {
        handleRemoteHangup();
      }
    }
  });
  maybeStart();
  //教师端尝试启动RTCPeerConnection
  function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted2, isChannelReady2);
    if (!isStarted2) {
      showlog('pc teacher creating peer connection');
      createPeerConnection();
      showlog('pc teacher ondatachannel peer connection>>>>>>>>>>>>>>>>>>>>>>>>>>');
      pc2.ondatachannel = function(event) {
        var channel = event.channel;
      ﻿  channel.onopen = function(event) {
         showlog('pc teacher onopen: send Hello World!');
          channel.send("Hello World!");
        }
        channel.onmessage = function(event) {
          // console.log("pc teacherGot Data Channel Message:", event.data);
           var data=JSON.parse(event.data);
          //channel.send("pc teacher wo shi fuwuqi ");
          if(data.event=="transform")
            transformRootChange(data);
          else if(data.event=="nextStep"){
            nextStep();
          }else if(data.event=="preStep"){
            preStep();
          }else if(data.event=="asynRaycaster"){
            asynRaycaster(data);
          }else if(data.event=="loadMolecule"){
            loadMolecule(data.url,data.loadModeIndex);
          }else if(data.event=="changescale"){
            setRootScale(data.scale);
          }  else if(data.event=="desk"){
            desk(data);
          }else if(data.event=="transformChange"){
            transformChange(data);
          }else if(data.event=="tableshow"){

            tableshow(data.show);
          }else if(data.event=="changeCameraPara"){
            changeCameraPara(data.param);
          }else if(data.event=="transformChildChange"){//模型子对象变化
              transformChildChange(data)
          }else if(data.event=="animalShuiBeng"){
            animalShuiBeng(data.animalShuiBeng);
          }
        }
      }
      isStarted2 = true;
 
    }
  };



  window.onbeforeunload = function() {
    handleRemoteHangup();
  };

  /////////////////////////////////////////////////////////
 //创建服务端端PeerConnection
  function createPeerConnection() {
    try {
      pc2 = new RTCPeerConnection(null);
      pc2.onicecandidate = handleIceCandidate;
      pc2.onaddstream = handleRemoteStreamAdded;//处理远程视频流
      pc2.onremovestream = handleRemoteStreamRemoved;



       showlog('Created RTCPeerConnnection');
    } catch (e) {
          showlog('Cannot create RTCPeerConnection object.' + e.message);
      alert('Cannot create RTCPeerConnection object.');
  
      return;
    }
  }

  function handleIceCandidate(event) {
    showlog('icecandidate event：'+event);
    pc2.onicecandidate = null;
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      },childmode3);
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
    pc2.createAnswer().then(
      setLocalAndSendMessage,
      onCreateSessionDescriptionError
    );
  }
  //保存本地sdp并发送offer给远程
  function setLocalAndSendMessage(sessionDescription) {
    pc2.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription,childmode3);
  }

  function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
  }


  //服务端处理远程视频流
  function handleRemoteStreamAdded(event) {

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
    isStarted2 = false;
    localVideo.stop();
    pc2.close();
    pc2 = null;
  }
}