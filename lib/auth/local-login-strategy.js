'use strict';

var LocalStrategy = require('passport-local').Strategy;
var User = require('../../server/models/user');
var logger = require('../../utils/logger')(module);
var config = require('../../server/config');
var cryptojs = require('../crypto/crypto');

module.exports = function (passport) {
    passport.use('local', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
        function (req, username, password, done) {
            logger.debug('Executing Local Login Strategy', username, password);
            //username = cryptojs.decrypt(username);
            //password = cryptojs.decrypt(password);
            // asynchronous
            process.nextTick(function () {
                let permission = req.url.indexOf('admin') > -1 ? ['admin'] : ['user', 'gipiAdmin'];
                //to allow user to login from his mail or any of the secondary emails $in:
                User.findOne({
                    $and: [
                        {
                            $or: [
                                { 'local.email': username },
                                { 'local.userName': username },
                            ]
                        },

                        { 'profile.permissionGroups': { $in: permission } }
                    ]
                }, function (err, user) {
                    // if there are any errors, return the error
                    if (err) return done(err);

                    // if no user is found, return the message
                    if (!user) {
                        return done('User not exist.');
                    }

                    if (!user.isPasswordValid(password)) {
                        return done('Oops! Wrong password.');
                    } else {
                        return done(null, user, 'Login successful!');
                    }
                });
            });
        }));
};
