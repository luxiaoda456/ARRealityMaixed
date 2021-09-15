'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8800);
var persons = [];

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {
  
  // convenience function to log server messages on the client
function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    //socket.emit('log', array);
      console.log(arguments);
  }

  socket.on('message', function(message) {
   // log('Client message: ', message);
    // for a real app, would be room-only (not broadcast)
    message.socketid=socket.id ;  
    socket.broadcast.emit('message', message);//发送给除了接收者外的其他人
  });

  var deleteSokect = function(socketID) {
    if(persons==null)
      return null;
      for (var i = 0; i < persons.length; i++) { 
        if (persons[i].id == socketID) {
          persons.splice(i, 1); 
          log('deleteSokect socketID:' + socketID);
          return persons; 
        } 
      };
      return persons;
  };
  //map['key1'] = 1;
  socket.on('disconnect', (reason) => {
    // ...
      log('disconnect ' + socket.id);
      deleteSokect(socket.id);
  });
  socket.on('error', (error) => {
    log('error ' + socket.id);
    socket.disconnect(true);
  });
  socket.on('addStream', function(roomobj) {
    log('addStream ' + socket.id);

      socket.broadcast.emit('addStream', roomobj);//发送给除了接收者外的其他人：有人加入房间
  })
  socket.on('create or join', function(roomobj) {
    var room=roomobj.room;
    //log('Received request to create or join room ' + room);
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('create or join Room ' + room + ' now has ' + numClients + ' client(s)'+" socket.id:"+socket.id);
    persons.push({ id: socket.id, roomobj: roomobj});
     var teacherNum=0, clientNum=0,serverNum=0,cameraClientNum=0;
   // log('persons.length : ' + persons.length);
    for (var i = 0; i < persons.length; i++) { 
      log('persons[i].mode ' + persons[i].roomobj.mode+";persons[i].roomobj.childmode: "+persons[i].roomobj.childmode);
      if (persons[i].roomobj.mode == "teacher") {
        teacherNum=teacherNum+1;
      }else if (persons[i].roomobj.mode == "server") {
        serverNum=serverNum+1;
      } else if (persons[i].roomobj.mode == "clientcamera") {
        cameraClientNum=cameraClientNum+1;
      }else{
        clientNum=clientNum+1;
      }
    };
    if ((roomobj.mode == "client"&&clientNum >10)||(roomobj.mode == "server"&&serverNum>1)||(roomobj.mode == "teacher"&&teacherNum>1)) { 
      socket.emit('full', room);
       log('full clientNum:' + clientNum + ' ServerNum:' + serverNum+'  teacherNum:'+teacherNum+"  cameraClientNum:"+cameraClientNum);
    }else{
   
      log('Client ID ' + socket.id + ' joined room ' + room+'clientNum:' + clientNum+";teacherNum:"+teacherNum+";ServerNum:"+serverNum+"  cameraClientNum:"+cameraClientNum);
      //io.sockets.in(room).emit('join', room);//in 同to 为随后的事件发射设置一个修饰符，事件只会广播到已经加入给定的客户端room。要发射到多个房间，可以to多次打电话
      socket.join(room);
      var roomdata={
        roomname:room,
        socketid:socket.id,
        mode:roomobj.mode 
      }
      socket.broadcast.emit('join', roomdata);//发送给除了接收者外的其他人：有人加入房间
      socket.emit('joined', roomdata, socket.id);//向当前连接socket.id的客户端发出事件 ：加入成功的事件
      if(roomobj.mode == "teacher"||roomobj.mode == "server"){
        if (teacherNum+serverNum>1) {//教室和服务端已经建立
          io.sockets.in(room).emit('readyteacher',room);//
          log('readyteacher');
        }
      }else if(roomobj.mode == "client"||roomobj.mode == "server"){
        if (serverNum+clientNum>1) {//教室和服务端已经建立
          io.sockets.in(room).emit('readyclient',room);//
          log('readyclient');
        }
      }else if(roomobj.mode == "clientcamera"||roomobj.mode == "server"){
        if (serverNum+cameraClientNum>1) {//
          io.sockets.in(room).emit('readycamera',room);//
          log('readycamera');
        }
      }
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });
});
