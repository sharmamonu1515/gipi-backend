'use strict';
var mongoose = require('mongoose');
var sanitize = require('mongo-sanitize');
var validator = require('validator');
var shortid = require('shortid');

var logger = require('../../utils/logger')(module);
var ContactInfo = require('./contact-info');
var PERMISSIONS = require('../constants/permissions');


var profileSchema = mongoose.Schema({
  contactInfo: {
    type: ContactInfo.schema,
    default: new ContactInfo()
  },
  imageUrl : {
    type: String,
    default: 'https://t4.ftcdn.net/jpg/01/18/03/35/360_F_118033506_uMrhnrjBWBxVE9sYGTgBht8S5liVnIeY.jpg'
  },
  timeZone: {
    type: String,
    default : "Asia/Kolkata"
  },
  permissionGroups: {
    type: [String],
    default: Array,
    enum: [
    PERMISSIONS.GROUP_PERMISSIONS.USER, 
    PERMISSIONS.GROUP_PERMISSIONS.ADMIN,
    PERMISSIONS.GROUP_PERMISSIONS.GIPIADMIN,
    PERMISSIONS.GROUP_PERMISSIONS.ONLINEDOCTORS,
    PERMISSIONS.GROUP_PERMISSIONS.SAASPRODUCT
  ]
  },
  referralId : String,
  referrerId : {
    type: String,
    required: [true, 'Referrer ID must be set'],
    default: shortid.generate
  },
});


module.exports = mongoose.model('UserProfile', profileSchema);
