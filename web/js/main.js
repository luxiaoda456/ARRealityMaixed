'use strict';
window.isChannelReady = false;
window.isInitiator = false;
window.isStarted = false;

window.turnReady;
//聊天服务器地址，该地址通过nginx做https代理
window.socketServerAddr="https://192.168.10.61:1443";
//window.mode="client"//client/server/clientcamera
const pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};
//const cameraPara={fov:78,px:0.04,py:0.95, pz:1.49,rx:-0.26,ry:0.0,rz:-0.02,zoom:2.14,cameraHelper:false,ground:false};
//.setFocalLength( focalLength ) — 设置当前和 .filmGauge 有关的 .fov 的焦距。默认为35mm。
//const cameraPara={fov:60,px:0.174,py:1.622, pz:2.121,rx:-0.46,ry:0.0,rz:-0.0,qx:-0.229,qy:0,qz:0,qw:1,zoom:2.13,focalLength:35,cameraHelper:false,ground:false};
//const cameraPara={fov:60,px:0.174,py:1.622, pz:2.121,rx:-0.46,ry:0.0,rz:-0.0,qx:-0.974822,qy:-0.0180783,qz:0.0040271,qw:0.222213,zoom:2.13,cameraHelper:false,ground:false};
//const cameraPara={fov:90,px:0.4,py:2, pz:2,rx:-0.9,ry:0.0,rz:-0.0,qx:-0,qy:0,qz:0,qw:1,zoom:1,focalLength:35,cameraHelper:false,ground:false};
//const cameraPara={fov:50.625,px:0,py:2, pz:0,rx:-1.57,ry:0.0,rz:-0.0,qx:-0,qy:0,qz:0,qw:1,zoom:1,focalLength:35,cameraHelper:false,ground:false};
//const cameraPara={fov:50.625,px:0,py:2, pz:0,rx:-1.57,ry:0.0,rz:-0.0,qx:-0,qy:0,qz:0,qw:1,zoom:1,focalLength:35,cameraHelper:false,ground:false};
//注意fov是垂直方向的fov，不是
//const cameraPara={fov:30.51,px:0.0,py:1.625, pz:2.162,rx:-0.4413,ry:-0.0,rz:-0.0,qx:-0.0,qy:-0.0180783,qz:0.0040271,qw:0.222213,zoom:1,cameraHelper:false,ground:false};
const cameraPara={fov:30.51,px:0.03,py:1.317, pz:1.626,rx:-0.3,ry:-0.0,rz:-0.0,qx:-0.511,qy:-0.0180783,qz:0.0040271,qw:0.222213,zoom:1,cameraHelper:false,ground:false};
const dataChannelOptions = {
  ordered: false, //不保证到达顺序
  maxRetransmitTime: 3000, //最大重传时间
};

const getQueryString2 = name => {
  if(window.location.pathname.indexOf("cameraclient.html")>-1)
    return "cameraclient";
  if(window.location.pathname.indexOf("client.html")>-1)
    return "client";

    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
};
// Set up audio and video regardless of what devices are present.
const sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};
const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};
 var tempmode=getQueryString2('mode')?getQueryString2('mode'):"clientcamera";
const mode = tempmode;//client/server/clientcamera
/////////////////////////////////////////////
//
const room = 'liveroom';
//video:{ facingMode: "user" }//调用前置摄像头
//video: { facingMode: { exact: "environment" } }//后置
const constraints = {
   video: { 
        facingMode: { exact: "environment" } ,//environment,user   
        width:1920,
        height:1080,
        //设置帧率
        frameRate : 30,
    },
    audio : true
};
//本地视频组件
window.localVideo = document.querySelector('#video');
//远端视频组件
window.remoteVideo = document.querySelector('#video');

// Could prompt for room name:
// room = prompt('Enter room name:');

const socket = io.connect(socketServerAddr);
  socket.on('log', function(array) {
  console.log.apply(console, array);
});
//back1 如果是第三个或以上的人登录的人，服务端相应成功将触发房间已满的回调
socket.on('full', function(room) {
    showlog('full  room:'+room);
});
const showlog=  function (content){
  var d = new Date();
  console.log(d.getMinutes()+":"+d.getSeconds()+" "+d.getMilliseconds()+" "+mode +" "+content);
    //$("#log").html(content);
    $("#log").append("<p>"+content+"</p>");
}
  ////////////////////////////////////////////////

const sendMessage= function(content,childmode,socketid) {
    var json={
      message:content,
      mode:mode,
      childmode:childmode?childmode:mode,
      remotesocketid:socketid
    }

    socket.emit('message', json);
    showlog(mode+'sending message:'+json);
}


