'use strict';
var redis = require('redis');
var sub = redis.createClient();
var pub = redis.createClient();
var client = redis.createClient();
sub.subscribe('chat');

module.exports = function(io) {
  io.on('connection', function(err, socket, session) {
    if (!session.user) return;

    /*
     When the user sends a chat message, publish it to everyone (including myself) using
     Redis' 'pub' client we created earlier.
     Notice that we are getting user's name from session.
     */
    socket.on('chat', function(data) {
      var msg = JSON.parse(data);
      var reply = JSON.stringify({
        action: 'message',
        user: session.user.username,
        msg: msg.msg
      });
      client.rpush('mylist', reply, function(err, item) {
        if (err) {
          console.log('error : ', err);
        } else {
          pub.publish('chat', reply);
        }
      });

    });

    /*
     When a user joins the channel, publish it to everyone (including myself) using
     Redis' 'pub' client we created earlier.
     Notice that we are getting user's name from session.
     */
    socket.on('join', function() {
      var reply = JSON.stringify({
        action: 'control',
        user: session.user.username,
        msg: ' joined the channel'
      });
      client.rpush('mylist', reply, function(err, item) {
        if (err) {
          console.log('error : ', err)
        } else {
          client.lrange('mylist', 0, -1, function(err, items) {

            items.forEach(function(item) {
              pub.publish('chat', item);
            });

            // pub.publish('chat', reply);
          });

        }
      });
    });

    socket.on('leave', function() {
      var reply = JSON.stringify({
        action: 'control',
        user: session.user.username,
        msg: ' left from channel'
      });
      client.rpush('mylist', reply, function(err, item) {
        if (err) {
          console.log('err : ', err);
        } else {
          pub.publish('chat', reply);
        }
      });
    });



    /*
     Use Redis' 'sub' (subscriber) client to listen to any message from Redis to server.
     When a message arrives, send it back to browser using socket.io
     */
    sub.on('message', function(channel, message) {
      socket.emit(channel, message);
    });
  });
};
