var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocanMongoose = require('passport-local-mongoose');

var Account = new Schema({
  username: String,
  password: String
});

mongoose.plugin(passportLocanMongoose);

module.exports = mongoose.model('account', Account);
