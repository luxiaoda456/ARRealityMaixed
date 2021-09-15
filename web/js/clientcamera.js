//相机端负责相机流数据的捕获和上传
var localStream;
var pc=null;

var remoteStream;
var hadDoCall=false;
/////////////////////////////////////////////

if(mode=="clientcamera"){
  //1、创建或加入房间
  if (room !== '') {
    var roomstr={
        room: room,
        mode: mode,
        childmode:"clientcamera"
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
  socket.on('readycamera', function(room) {
    showlog('readycamera  room:'+room);
    //发起offer前需要保证本地视频流localStream已开启否则对方不会触发onstream
    if(isChannelReady==false&&localStream)//
      doCall();//等连接建立后再发送offer
    isChannelReady = true;
    isInitiator=true;//老师端作为发起者
  
  });
  function onSuccess() {};
function onError(error) {
  console.error(error);
};
  // This client receives a message
  socket.on('message', function(json) {
    var message=json.message;
    showlog('received '+json.mode+' message:'+message);
    if(json.mode=="server"&&json.childmode=="server"){
      if (message.type === 'answer' && isStarted) {//相应服务端的answer并保存remote信息
        showlog('answer');
        pc.setRemoteDescription(new RTCSessionDescription(message));
      
      } else if (message.type === 'candidate' && isStarted) {//收到服务端的candidate
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        if(message.candidatejson){
          pc.addIceCandidate(new RTCIceCandidate(message.candidatejson), onSuccess, onError);
        }else
         pc.addIceCandidate(candidate, onSuccess, onError);
        showlog('candidate');
        
       // sendMessage('start-localStream-record');
      } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();//收到服务端停止指令，需要停止当前和服务端的连接
      }
    }
  });
  maybeStart();
  window.addEventListener('mousedown',function(event) {
      fullScreen(localVideo); 
  },false);

  function isMobile (){
      if( navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
      )return true;
      return false;
    }
  //navigator.mediaDevices.getUserMedia(setting)
  //只有老师才能录制视频
  function startRecord(){

     // setupCamera();
      //return;
      if(!isMobile()){//pc
        setupCamera();
      }else{

          // alert('startRecord' );
        //navigator.mediaDevices.getUserMedia(constraints)
        navigator.mediaDevices.getUserMedia(constraints)
        .then(gotStream)
        .catch(function(e) {
          alert('getUserMedia() error: ' + e.name);
        }
        );
    }
  }


// 调用摄像头
  function setupCamera() {
                
            let exArray = [];
            //web rtc 调用摄像头(兼容性写法(谷歌、火狐、ie))
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            
            //遍历摄像头
            navigator.mediaDevices.enumerateDevices()
            .then(function (sourceInfos) {
                for (var i = 0; i < sourceInfos.length; ++i) {

                  var deviceInfo=sourceInfos[i];
                   console.log("设备种类：" + deviceInfo.kind);
                    console.log("设备名称：" + deviceInfo.label);
                    console.log("设备Id：" + deviceInfo.deviceId);
                    console.log("groupId:" + deviceInfo.groupId);
                    if (deviceInfo.kind === "audioinput") {
                        console.log( "音频输入设备");               
                    } else if (deviceInfo.kind === "audiooutput") {
                       console.log("音频输出设备");          
                    } else if (deviceInfo.kind === "videoinput") {
                        console.log( "视频输入设备");       
                    }


                    if (sourceInfos[i].kind == 'videoinput') {
                        exArray.push(sourceInfos[i].deviceId);
                    }
                }
            })
            .then(() => {
                // 因为我这里是有三个摄像头,我需要取最后一个摄像头
                let deviceId = exArray[exArray.length - 1];  // 取最后一个摄像头,(深度,灰度,RGB)
                if(exArray.length>=2)
                  deviceId = exArray[0]; 
                var constraints2={
                    audio: true, 
                    video: { 
                        deviceId: deviceId,
                        width:320,
                        height:180,
                        frameRate : 25,
                    } 
                };
                constraints2.audio=constraints.audio;
                constraints2.video.width=constraints.video.width;
                constraints2.video.height=constraints.video.height;
                navigator.mediaDevices.getUserMedia(constraints2) 
                .then(gotStream)
                .catch(function(e) {
                    alert('getUserMedia() error: ' + e.name);
                });
            });
        }



  
  //教师端获取到本地视频
  function gotStream(stream) {
    showlog('Adding local stream');
    localStream = stream;
    localVideo.srcObject = stream;
    //var remotevideott=document.querySelector('#video1');
    //remotevideott.srcObject=stream;
   // 
    pc.addStream(stream);
    //sendMessage('gotStream');//向其他用户发送指令
    if(isChannelReady)//需要等到对方peerconnetion已建立才可以发起offer
      doCall();
  }
  //console.log('Getting user media with constraints', constraints);
  //教师端尝试启动RTCPeerConnection
  function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted);
    if (!isStarted) {
      createPeerConnection();
      //pc.addStream(localStream);
      startRecord();//必须在发送offer前addstream否则对方收不到onaddstream
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
      pc = new RTCPeerConnection(configuration);
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
    var json= event.candidate;//.address = "192.168.112.11";
    //json.address = "192.168.112.11";
    if (event.candidate) {//发送sdp
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
        candidatejson:json
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
    pc.setLocalDescription(sessionDescription,
      () => sendMessage(pc.localDescription),
      onCreateSessionDescriptionError
    );
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    //sendMessage(sessionDescription);
  }

  //发送offer
  function doCall() {
    showlog('Sending offer to peer');
    if(hadDoCall)
        return;
    hadDoCall=true;
   // pc.onnegotiationneeded = () => {
       pc.createOffer(sdpConstraints).then(setLocalAndSendMessage);
  //  }
  
  }
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
  //保存本地sdp并发送offer给远程


  function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
  }


  //服务端处理远程视频流，教师端无需处理服务端发送共享桌面信息，而且服务端也不会给教师发
  function handleRemoteStreamAdded(event) {
     showlog('Remote stream added');

    var remotevideott=document.querySelector('#video1');
    remotevideott.srcObject=event.stream;
  // localVideo.srcObject = event.stream;
    remotevideott.pause();
    remotevideott.play();
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