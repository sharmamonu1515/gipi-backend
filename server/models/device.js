/*! =========================================================
 * device.js
 * Device Schema for push notification
         deviceToken
         deviceType (ios, android, web)
 * ========================================================= */

'use strict';
var mongoose = require('mongoose');
var logger = require('../../utils/logger')(module);

var deviceSchema = mongoose.Schema({
  userId       : {
    type:mongoose.Schema.Types.ObjectId,
    required:true,
  },
  deviceId       : { type: String }, //unique/ unchanged
  deviceName     : { type: String },
  deviceModel     : { type: String },
  buildVersion     : { type: String },
  deviceToken    : { type: String },
  platform       : { type: String },
  osVersion       : { type: String },
  osType       : { type: String },
  status         : { type: Boolean },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,

  // ------- web platform
  publicVapidKey : { type: String },
  endpoint       : { type: String },

  keys           : { type: Object },

});




module.exports = mongoose.model('Device', deviceSchema);
