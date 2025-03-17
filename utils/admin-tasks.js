'use strict';
var Promise = require('bluebird');
var User = require('../server/models/user');
var TasterProfile = require('../server/models/taster-profile');

/*
 *   This function will reset all user's profiles taster Preferences
 *
 */
var updateUsersTasterPreferences = function (req, res, done) {
  console.log('Starting updateUsersTasterPreferences');
  var promise = User.find({}).exec();
  promise.then(function (users) {
    if (users) {
      var updatingUsers = [];
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        if (user.profile) {
          user.profile.tasterProfile.remove();
          user.profile.tasterProfile = new TasterProfile();
          updatingUsers.push(user.save());
        }
      }

      Promise.all(updatingUsers).then(function (updates) {
        var output = `<p>updateUserTasterPreferences -> Updated ${updates.length} records</p>`;
        console.log(output);
        if ( res ) res.send(output);
      }).catch(function (err) {
        console.error(err);
      }).finally(function() {
        if (done) done();
      });
    }
  }).catch(function (err) {
    console.error(err);
  }).finally(function() {
    if (done) done();
  });
}

module.exports.updateUsersTasterPreferences = updateUsersTasterPreferences;

module.exports.updateUsersTasterPreferencesWithSetup = function() {
  var config = require('../server/config');
  var mongoose = require('mongoose');
  mongoose.Promise = require('bluebird');
  mongoose.connect(config.dbConnection.string);

  updateUsersTasterPreferences(null, null, function() {
    console.log('Done.  Cleaning up...');
    mongoose.connection.close();
  });
}