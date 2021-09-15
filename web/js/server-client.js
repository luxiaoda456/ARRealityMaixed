//服务端clientcamera用于和相机端通讯获取相机流数据并作为发送端发送数据
var remoteStream;
var pcs=[];//和相机采集进行通讯
var sCP;
if(mode=="server"){
  const getpcsbysocketid = function(socketID) {
    if(pcs==null)
      return null;
    for (var i = 0; i < pcs.length; i++) { 
      if (pcs[i].socketid == socketID) {
        return pcs[i]; 
      } 
    };
    return null;
  };
  socket.on('join', function (room){
    //showlog('Another peer made a request to join   room:'+roomname+";soketid:"+room.socketid); 
    if(room.mode=="client"){
      if(getpcsbysocketid(room.socketid)==null){
        var scp=new ServerClientPeer(room,this);
        var pctemp=scp.createPeerConnection(room.socketid);
        pcs.push({socketid:room.socketid,pc:pctemp,scp:scp});      
        scp.addStream(remoteStream);            
      }
    }
  });
   
  //back1 自己成功加入
  socket.on('joined', function(room) {
    // showlog('joined  room:'+roomname+";soketid:"+room.socketid);
  });
  //客户端已连接
  socket.on('readyclient', function(room) {
    // showlog('readyclient  room:'+room);
     isChannelReady = true;
  });      
  // This client receives a message
  socket.on('message', function(json) {
    var message=json.message;
    showlog('received '+json.mode+' message:'+message);
    if(json.mode=="client"){
      var pcobj=getpcsbysocketid(json.socketid);
      var scp =pcobj?pcobj.scp:null;
      if(scp==null) {
        showlog('********************************* null peer ');
        return;
      }
      scp.message(message);
    }
  });
  //开始录制视频
  function startRecord(){
      if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia){
          console.log('getUserMedia is not supported');
          return;
      }else{
          var deviceId = socket.id;
          var constraints2 = {
               video : {
                  //设置帧率
                  frameRate : 20,
                  facingMode : 'enviroment',
              }, 
              audio : true
          }  
        // 获取麦克风权限
        //  const audioTrack = navigator.mediaDevices.getUserMedia({ audio: true });
          constraints2.video.width=constraints.video.width;
          constraints2.video.height=constraints.video.height;
          var stream= navigator.mediaDevices.getDisplayMedia(constraints2)
          .then(gotStream)
          .catch(handleError);
      
          // 给MediaStream添加音频轨道
         // stream.addTrack(audioTrack.getAudioTracks()[0]);


      }
  }
//打印错误日志
  function handleError(err){
      console.log('getUserMedia error : ', err);
  }
  //点击确认分享屏幕后被回调
  function gotStream(stream) {
    showlog('Adding local stream');
    remoteStream = stream;
    /**
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(function (audioStream) {
      var tracks=audioStream.getAudioTracks();
      stream.addTrack(tracks[0]);
    });
    **/
    return remoteStream;
  }

  window.onbeforeunload = function() {
    handleRemoteHangup();
  };

  function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
  }
  function stop() {
    isStarted = false;
    for (var i = 0; i < pcs.length; i++) { 
      var pcobj=pcs[i];
      pcobj.pc.close();
      pcobj.pc = null;
    }
    pcs=[];
  }
  startRecord(); //服务端启动后启动一次录屏就可以
}