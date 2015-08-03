var express = require('express');
var path = require('path');
var logger = require('morgan');
var CookieParser = require('cookie-parser');
var cookieParser = CookieParser('hello');
var bodyParser = require('body-parser');
var session = require('express-session');
var redis = require('redis');
var connectRedis = require('connect-redis');
var RedisStore = connectRedis(session);
var rClient = redis.createClient();
var sessionStore = new RedisStore({
  client: rClient
});

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser);
app.use(session({
  store: sessionStore,
  secret: 'hello',
  resave: true,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.post('/user', function(req, res) {
  req.session.user = req.body.user;
  res.json({
    "error": ""
  });
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/');
});
// app.use('/users', users);

// app.get('/', function(req, res, next) {
//   console.log('index/chat page')
//   console.log(req.session.user)

//   if (!req.session.user || req.session.user === undefined) {
//     res.redirect('/login');
//   } else {
//     var user = req.session.user;
//     req.session.regenerate(function(err) {
//       req.session.user = user;
//       res.render('chat', {
//         title: 'Express',
//       });
//     });
//   }
// });

// app.get('/login', function(req, res) {
//   res.render('login');
// });

// app.post('/login', function(req, res) {
//   console.log('----------------------')
//   console.log(req.body)
//   req.session.user = req.body.username;
//   // res.json({
//   //   'error': ''
//   // });
//   res.redirect('/');
// });

// app.get('/logout', function(req, res) {
//   req.session.destroy();
//   res.redirect('/login');
// });


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('error 404')
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.sessionStore = sessionStore;
app.cookieParser = cookieParser;

module.exports = app;
