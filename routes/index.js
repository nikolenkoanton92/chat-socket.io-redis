var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var serverName = process.env.VCAP_APP_HOST ? process.env.VCAP_APP_HOST + ":" + process.env.VCAP_APP_PORT : 'localhost:3000';
  var user = req.session.user;

  req.session.regenerate(function(err) {
    req.session.user = user;
    res.render('index', {
      title: 'Express',
      server: serverName,
      user: req.session.user
    });
  });
});

module.exports = router;
