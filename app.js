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

var passport = require('passport');
var mongoose = require('mongoose');
var Account = require('./models/account');

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

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));


passport.use(Account.createStrategy());
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

mongoose.connect('mongodb://127.0.0.1:27017/account', function(err) {
  if (err) {
    console.log(err);
  }
});

app.post('/user', function(req, res) {
  req.session.user = req.body.user;
  res.json({
    "error": ""
  });
});

app.post('/login', passport.authenticate('local'), function(req, res, next) {
  req.session.save(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});


app.get('/', function(req, res, next) {
  var serverName = process.env.VCAP_APP_HOST ? process.env.VCAP_APP_HOST + ":" + process.env.VCAP_APP_PORT : 'localhost:3000';
  var user = req.session.user;
  var password = req.session.password;
  if (req.user) {
    req.session.user = req.user;
    res.render('index', {
      title: 'Express',
      server: serverName,
      user: req.session.user
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/logout', function(req, res, next) {
  req.logout();
  req.session.destroy();
  res.redirect('/login');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res) {
  Account.register(new Account({
    username: req.body.username
  }), req.body.password, function(err, user) {
    if (err) {
      res.redirect('/signup');
    } else {
      passport.authenticate('local')(req, res, function() {
        req.session.save(function(err) {
          if (err) {
            return next(err);
          }
          res.redirect('/login');
        });
      });
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
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
