//服务端处理客户端的连接请求

const ServerClientPeer=function(room,root){
  var myself=this;//new 返回的对应
  var pc4 ;
  var childmode2="server-client";
  var serverSocketID;//与服务断连接后服务端返回的sockitid

  this.addStream= function (stream){
    pc4.addStream(stream);
    myself.doCall();//offfer创建前需要先addStream 否则对方收不到
  };
  //创建服务端端PeerConnection
  this.createPeerConnection=function (socketid) {
      serverSocketID=socketid;
    try {
      pc4 = new RTCPeerConnection(null);
      pc4.onicecandidate = function (event) {
          showlog('onicecandidate event：'+event);
          event.currentTarget.onicecandidate = null;
          if (event.candidate) {
            sendMessage({
              type: 'candidate',
              label: event.candidate.sdpMLineIndex,
              id: event.candidate.sdpMid,
              candidate: event.candidate.candidate,
            },childmode2,serverSocketID);
          } else {
            console.log('End of candidates.');
          }
        };
  
      showlog('Created RTCPeerConnnection');
      return pc4;
    } catch (e) {
        showlog('Cannot create RTCPeerConnection object.' + e.message);
        alert('Cannot create RTCPeerConnection object.');
    }
    return null;
  };
  this.message=function (message){    
     if (message.type === 'answer' && isStarted) {//相应接收端的answer并保存remote信息
        showlog('received answer');
        pc4.setRemoteDescription(new RTCSessionDescription(message));
      
      }else if (message.type === 'candidate' && isStarted) {
        showlog('received candidate '+message.candidate);
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });   
        pc4.addIceCandidate(candidate);
      } 
  }
  //发送offer
  this.doCall=function () {
    showlog('Sending offer to peer');
    pc4.createOffer(sdpConstraints).then(setLocalAndSendMessage);
  };

  //保存本地sdp并发送offer给远程
  function setLocalAndSendMessage(sessionDescription) {
    pc4.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
 
    sendMessage(sessionDescription,childmode2,serverSocketID);
  };
}
