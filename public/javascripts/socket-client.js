/* global $*/

$(document).ready(function() {
  console.log('socket-client.js')
  var user = $('#username').val();
  console.log('#username')
  console.log(user)
  console.log('end #username')
  $('#username').keydown(function(e) {
    if (e.keyCode == 13) {
      $('#login').click();
    }
  });

  $('#login').click(function() {
    console.log('hi')
    join($('#username').val());
  });

  function join(name) {
    console.log('come to function join')

    // Connect to socket.io on server
    var host = window.location.host;
    var socket = io.connect('http://' + host, {
      reconnect: false,
      'try multiple transports': false
    });
    var intervalID;
    var reconnectCount = 0;

    socket.on('connect', function() {
      console.log('connected');
    });

    socket.on('connecting', function() {
      console.log('connecting');
    });

    socket.on('disconnect', function() {
      console.log('disconnect');
      intervalID = setInterval(tryReconnect, 4000);
    });

    socket.on('connect_failed', function() {
      console.log('connect_failed');
    });

    socket.on('error', function(err) {
      console.log('error: ' + err);
    });

    socket.on('reconnect_failed', function() {
      console.log('reconnect_failed');
    });

    socket.on('reconnect', function() {
      console.log('reconnect');
    });

    socket.on('reconnecting', function() {
      console.log('reconnecting');
    });



    // Recconect

    var tryReconnect = function() {
      ++reconnectCount;
      if (reconnectCount == 5) {
        clearInterval(intervalID);
      }
      console.log('Making a dummy http call to set jsessionid (before we do socket.io reconnect)');
      $.ajax('/')
        .success(function() {
          console.log("http request succeeded");
          //reconnect the socket AFTER we got jsessionid set
          socket.socket.reconnect();
          clearInterval(intervalID);
        }).error(function(err) {
          console.log("http request failed (probably server not up yet)");
        });
    };


    $.post('/login', {
      'username': name
    }).success(function() {
      console.log('success to login')
      socket.emit('join', JSON.stringify({}));
    }).error(function() {

      console.log('error');
    });

    var container = $('div.chat');


    socket.on('chat', function(msg) {
      var message = JSON.parse(msg);

      var action = message.action;

      var struct = container.find('li.' + action + ':first');

      if (struct.length < 1) {
        console.log('Could not handle: ' + message);
        return;
      }

      // get a new message view from struct template
      var messageView = struct.clone();

      // set time
      messageView.find('.time').text((new Date()).toString('HH:mm:ss'));

      switch (action) {
        case 'message':
          var matches;

          if (matches = message.msg.match(/^\s*[\/\\]me\s(.*)/)) {
            messageView.find('.user').text(message.user + ' ' + matches[1]);
            messageView.find('.user').css('font-wight', 'bold');
          } else {
            messageView.find('.user').text(message.user);
            messageView.find('.message').text(': ' + message.msg);
          }
          break;
        case 'control':
          messageView.find('.user').text(message.user);
          messageView.find('.message').text(message.msg);
          messageView.addClass('control');
          break;
      }

      if (message.user == name) {
        messageView.find('.user').addClass('self');
      }

      container.find('ul').append(messageView.show());
      container.scrollTop(container.find('ul').innerHeight());

    });

    $('#channel form').submit(function(event) {
      event.preventDefault();
      var input = $(this).find(':input');
      var msg = input.val();
      socket.emit('chat', JSON.stringify({
        action: 'message',
        msg: msg
      }));
    });


  }

});
