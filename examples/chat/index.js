// Setup basic express server
var express = require('express');
var fs = require('fs');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var objJson = [];
var port = process.env.PORT || 3000;
var her = false;
var him = false;
var passEncodingHer = new Buffer("H0la!.").toString('base64');
var passEncodingHim = new Buffer("C4ball3r0").toString('base64');

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    /*console.log(objJson);
    console.log(objJson.push({
      username: socket.username,
      message: data
    }));
    console.log(objJson);*/
    var jsonChat = JSON.parse(fs.readFileSync('./myjson/chat.json', 'utf8'));
    jsonChat.push({
      username: socket.username,
      message:data
    });

    console.log(jsonChat);

    fs.writeFileSync('./myjson/chat.json', JSON.stringify(jsonChat), 'utf8');
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;
    objJson = JSON.parse(fs.readFileSync('./myjson/chat.json', 'utf8'));
    console.log(objJson);

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers,
      conversation: objJson
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    console.log('disconnect');
    if (addedUser) {
      --numUsers;
      console.log(socket.username);
      if (socket.username == 'her') {
        her = false;
      }
      if (socket.username == 'him') {
        him = false;
      }

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  socket.on('exist', function (data) {

    var dataEncoding = new Buffer(data).toString('base64');
    console.log(data, dataEncoding);
    if ((passEncodingHer == dataEncoding) && !her) {
      her = true;
    } else {
      her = false;
    }
    if ((passEncodingHim == dataEncoding) && !him) {
      him = true;
    } else {
      him = false;
    }
    console.log(her, him);

      socket.emit('approved', {
        oneNcode: dataEncoding,
        twoNcode: passEncodingHer,
        her: her,
        him: him
      });
  });



});
