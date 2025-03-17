const passportCustom = require('passport-custom');
const CustomStrategy = passportCustom.Strategy;
const User = require('../../server/models/user');
const { ObjectID } = require('mongodb');
const OTPToken = require('../../server/models/otp-token');
const smsSender = require('../../lib/sms-sender');

module.exports = function (passport) {
  passport.use('signup', new CustomStrategy(
    function (req, done) {
      if (
        !req.body.email ||
        !req.body.userName ||
        !req.body.password ||
        !req.body.passwordConfirmation ||
        !req.body.name
      ) return done('Missing Required Fields');
      let existUser;
      if (req.body.password.trim() !== req.body.passwordConfirmation.trim())
        return done("Password don't match to your confrim password");

      // asynchronous
      process.nextTick(function () {
        // Internally sigup User
        User.findOne({
          $or:[
            {'local.email': req.body.email},
            {'local.userName': req.body.userName}
          ],
          'profile.permissionGroups': { $in: ['user'] }
        }, async function (err, user) {
          if (err) return done(err);

          if (!user) {
            return done(null, await User.signUpUser(req.body));
          } else {
            return done('User Name or Email Already Taken');
          }

        });
      });
    }));
};