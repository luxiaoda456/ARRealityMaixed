var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
    fileServer.serve(req, res);
}).listen(8800);


var io = socketIO.listen(app);
var persons = [];
var getPersonSeq = function() {
    var tempSeq = Math.floor(Math.random() * 5) + 1;
    persons.forEach(p => {
        if (p!=null&&p.seq == tempSeq) {
            tempSeq = getPersonSeq();
        }
    });
    return tempSeq;
}
/**
// 使用 express 框架
var app = require('express')();
var express = require("express");
var server = require('http').Server(app);
// 引入 socket.io
var io = require('socket.io')(server);
// 监听 80 端口
server.listen(8800);
**/
io.sockets.on('connection', function(socket) {
//io.on('connection', function(socket) {
    if (persons.indexOf(socket.id) == -1) {
        persons.push({ id: socket.id, seq: getPersonSeq() });
    }

    function trace(arguments) {
        //socket.emit('server', arguments);
        console.log(arguments);
    }

    console.log("用户 '" + socket.id + "' 连接成功！!!!");
    socket.emit('ready', socket.id, persons);
    socket.broadcast.emit('change', persons);
    
    //socket.emit('ready', socket.id, "helloa");
    //socket.broadcast.emit('change', "hellob");
    socket.on('disconnect', function() {
        console.log('终端(' + socket.id + ')已断开。 ');
        var tempPersons = [];
        persons.forEach(e => {
            if (e.id != socket.id) {
                tempPersons.push(e);
            }
        });
        persons = tempPersons;
        socket.broadcast.emit('change', persons);
    });
    socket.on('message', function(body) {
        var d = new Date();
        body.from = socket.id;
        body.time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        socket.to(body.to).emit('message', body);
        console.log('终端(' + socket.id + "):", body);
    });
    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                   console.log('ipaddr:==', details.address);
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });
   
});