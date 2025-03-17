'use strict';
var mongoose = require('mongoose');
const moment = require('moment');
const config = require('../config');
const utilities = require('../../utils/common-utilities');

var otptokenSchema = mongoose.Schema({
  otpToken: {
    type: String,
    default: utilities.generateOTP
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expireMinutes: {
    type: Number,
    default: config.OTP_Provider.OTPExpire
  }
});

otptokenSchema.virtual('isExpired').get(function() {
    let currentTime = new Date();
    let difference = moment(currentTime).diff(this.createdAt, 'minutes');
  if(config.OTP_Provider.OTPExpire > difference){
    return false;
  } else {
    return true;
  }
});

module.exports = mongoose.model('OTPToken', otptokenSchema);
