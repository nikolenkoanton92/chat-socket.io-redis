'use strict';

var redis = require('redis');
var sub = redis.createClient();
var pub = redis.createClient();
sub.subscribe('chat');

module.exports = function(io) {
  io.on('connection', function(err, socket, session) {

    if (!session.user) return;


    socket.on('chat', function(data) {
      var msg = JSON.parse(data);
      var reply = JSON.stringify({
        action: 'message',
        user: session.user,
        msg: msg.msg
      });
      pub.publish('chat', reply);
    });



    socket.on('join', function() {
      var reply = JSON.stringify({
        action: 'control',
        user: session.user,
        msg: 'joined the channel'
      });
      pub.publish('chat', reply);
    });



    sub.on('message', function(channel, message) {
      socket.emit(channel, message);
    });

  });
};
