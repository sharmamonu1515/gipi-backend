'use strict';

var logger = require('../../utils/logger')(module);
var config = require('../../server/config');
const ObjectID = require('mongodb').ObjectID
// Login Strategies:
var localLogin = require('./local-login-strategy');
// var facebookLogin = require('./facebook-login-strategy');
var jwtLogin = require('./jwt-login-strategy');
const localSignUp = require('./local-signup-manual-strategy');
// var facebookLoginMb = require('./facebook-loginmobile-strategy');

// var googleLogin = require('./google-login-strategy');
// var googleLoginMb = require('./google-loginmobile-strategy');
const ApiUtility = require('../../lib/api-utility');
// var SmsSender = require('../../lib/sms-sender');

var User = require('../../server/models/user');
// var Device = require('../../server/models/device');

var passport = require('passport');
const customPassport = require('passport-custom');
var flash = require('connect-flash');
var jwt = require('jsonwebtoken');
var exports = module.exports = {};
if (!Object.entries)
  Object.entries = function (obj) {
    var ownProps = Object.keys(obj),
      i = ownProps.length,
      resArray = new Array(i); // preallocate the Array
    while (i--)
      resArray[i] = [ownProps[i], obj[ownProps[i]]];

    return resArray;
  };

///////////////////////////////////////////////////////////
// Keep configuration localized here instead of server.js
//
// Set up Auth middleware
//////////////////////////////////////
exports.configureMiddleware = function (app) {
  // used to serialize the user for the session
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });


  // used to deserialize the user
  passport.deserializeUser(function (id, done) {
    User.findById(id, done);
  });

  // Install Login Strategies:
  localLogin(passport);
  jwtLogin(passport);
  localSignUp(passport);
  // facebookLogin(passport);
  // facebookLoginMb(passport);
  // googleLogin(passport);
  // googleLoginMb(passport);

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  logger.info('Auth middleware configured.')
};

// Pass Through the Auth routes:
exports.authenticate = {
  // Email/Password:
  localLogin: function (req, res, next) {
    return passport.authenticate('local', authenticationStrategyCallback(req, res, next))(req, res, next);
  },
  // Local SignUp
  localSignUp: function (req, res, next) {
    return passport.authenticate('signup', localSignupCallback(req, res, next))(req, res, next);
  },
  // JWT Strategy
  jwt_auth: async function (req, res, next) {

    if (!req.headers.authorization) {
      let data = {
        status: 'error',
        message: 'Authorization Token Missing'
      }
      return res.status(401).json(data);
    }

    let JWT = req.headers.authorization.substr(7);

    jwt.verify(JWT, config.jwtSecret, (err, decoded) => {
      if (err) {
        let data = {
          status: 'error',
          message: 'Invalid Token. Please Login Again !!'
        }
        return res.status(401).json(data);
      }
    })

    return passport.authenticate('jwt', { session: false }, authenticationStrategyCallbackJwt(req, res, next))(req, res, next);
  },
  // Facebook:
  facebookLogin: passport.authenticate('facebook', {
    authType: 'rerequest',
    scope: ['email', 'user_friends']
  }),
  facebookLoginCb: function (req, res, next) {
    return passport.authenticate('facebook', authenticationStrategyCallback(req, res, next))(req, res, next);
  },
  facebookLoginMb: function (req, res, next) {
    return passport.authenticate('local-facebook', authenticationStrategyCallback(req, res, next))(req, res, next);
  },
  // Google:
  googleLogin: passport.authenticate('google', { scope: 'profile email' }),
  googleLoginCb: function (req, res, next) {
    return passport.authenticate('google', authenticationStrategyCallback(req, res, next))(req, res, next);
  },
  googleLoginMb: function (req, res, next) {
    return passport.authenticate('local-google', authenticationStrategyCallback(req, res, next))(req, res, next);
  },
  // Etc.
};

exports.authenticationRequired = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    if (!req.xhr) req.session.redirectTo = req.originalUrl;
    res.redirect('/users/login/');
  }
}

// Check User Authenticated or Not
exports.CheckAuthentication = function (req, res, next) {
  if (req.isAuthenticated()) {
    return res.status(200).send({ status: 200, data: 'Authenticated' });
  } else {
    return res.status(401).send({ status: 401, data: 'NotAuthenticated' });
  }
}
//////////////////////////////////////
// END Set up Auth middleware
//////////////////////////////////////

/**
 * Enforces group permissions for required routes
 * @param {Array} routePermissions
 * @returns {Function} route handler to process request
 * @Example use: permisssionsRequire(["Admin"])
 */
exports.isAuthorized = (routePermissions = []) => {
  return (req, res, next) => {
    if (req.session.user) {
      if (req.session.user.profile) {
        const userPermissions = req.session.user.profile.permissionGroups;
        const userHasPermission = userPermissions.reduce((isGranted, userPermission) => {
          if (routePermissions.includes(userPermission)) isGranted = true;
          return isGranted;
        }, false);

        if (userHasPermission) next();
        else res.status(403).render('403');

      } else {
        res.redirect('/dashboard/')
      }
    } else {
      res.redirect('/users/login');
    }
  }
};


////////////////////////////////////
// PRIVATE METHODS
////////////////////////////////////
function authenticationStrategyCallback(req, res, next) {
  console.log("Authentication Login Strategy Callback Called");
  // Wrapping this anonymous function to pass req, res, and next:
  return (err, user, info) => {

    if (err) {
      return res.send(ApiUtility.failed(err));
    }
    // Check User's Profile and registration status:
    if (user) {
      if (user.isActive) {
        // Update User Last Login
        User.updateLastLogin(user._id);
        User.updateLoginlog(user._id);

        req.logIn(user, function (err) {
          if (err) {
            return res.send(ApiUtility.failed(err.message));
          }
        });

        return res.send(ApiUtility.success(User.getUserDataForApi(user, req.headers), 'Login Successfully'));

      } else {
        return res.send(ApiUtility.failed("Your account is not active"));
      }
    } else {
      return next('No User Data. Not sure why.');
    }
  }
}

// JWT Respone
function authenticationStrategyCallbackJwt(req, res, next) {
  return (err, jwtInfo, info) => {
    if (err) {
      return res.send({ status: 'error', message: err });
    }
    if (jwtInfo) {
      req.body.jwtInfo = jwtInfo.jwtInfo;
      return next();
    }
  }
}

// Local Sign Up
function localSignupCallback(req, res, next) {
  console.log("Local Sign Up Strategy Executed");
  // Wrapping this anonymous function to pass req, res, and next:
  return (err, user, info) => {
    if (err) {
      return res.send(ApiUtility.failed(err));
    }
    // Check User's Profile and registration status:

    if (user) {

      User.updateLastLogin(user._id);
      User.updateLoginlog(user._id);
      return res.send(ApiUtility.success(User.getUserDataForApi(user), 'Signup Successfully'));

    }
  }
}
