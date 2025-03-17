'use strict';
var mongoose = require('mongoose');
var crypto = require('../../lib/crypto');
const moment = require('moment');

var tokenSchema = mongoose.Schema({
  token: {
    type: String,
    default: crypto.randomString
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expireMinutes: {
    type: Number,
    default: 10
  }
});

tokenSchema.virtual('isExpired').get(function() {
  let currentTime = new Date();
  let difference = moment(currentTime).diff(this.createdAt, 'minutes');
  if(this.expireMinutes > difference){
    return false;
  } else {
    return true;
  }
});

module.exports = mongoose.model('Token', tokenSchema);
