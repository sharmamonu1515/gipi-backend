'use strict';

var validator = require('validator');
var config = require('../config');
var logger = require('../../utils/logger')(module);
var auth = require('../../lib/auth');
var User = require('../models/user');
const emailGen = require('../../lib/email-template-generator').emailTemplateGenerator;
var emailSender = require('../../lib/email-sender');
var smsSender = require('../../lib/sms-sender');
var ObjectID = require('mongodb').ObjectID;
const paginate = require('express-paginate');
const moment = require('moment');
var help = require('./helpers');
const ApiUtility = require('../../lib/api-utility');
const allowForRequest = require('../../utils/common-utilities');



// NEW USER
// ...................
// REGISTRATION

/**
 * GET /users/register
 *
 * Display registration form with email input field (user/register.ejs)
 */
module.exports.showRegistrationForm = function (req, res) {
    var opts = help.flashToView(req);
    if (req.session.preLoginEmail) {
        opts.preLoginEmail = req.session.preLoginEmail;
        delete req.session.preLoginEmail;
    }
  res.render('user/registration-form', opts);
};

/**
 * GET /users/login
 *
 * Display login form with email and password input fields (user/login.ejs)
 */
module.exports.showLoginForm = function (req, res) {
  if (!req.session.user){
    var opts = help.flashToView(req);
    if (req.session.preLoginEmail) {
      opts.preLoginEmail = req.session.preLoginEmail;
      delete req.session.preLoginEmail;
    }
    res.render('user/login', opts);
  }
  else {
    if(req.query.next){
      res.redirect(req.query.next)
    } else {
      res.redirect('/users/dashboard')
    }
  }
};

/**
 * GET /users/login/facebook
 *
 * Performs login via Facebook, returning users profile and email back:
 */
// module.exports.facebookLogin = auth.authenticate.facebookLogin

/**
 * GET /users/password/reset
 *
 * Display password reminder form with email input field (user/forgot-password.ejs)
 */
module.exports.showPasswordReminderForm = function (req, res) {
  res.render('user/forgot-password', help.flashToView(req));
}


/**
 * GET /users/password/reset/:token
 *
 * Display pasword reset form with password, passwordConfirmation and (hidden) token input fields
 * (user/reset-password.ejs)
 */
module.exports.showPasswordResetForm = function (req, res) {
  var opts = help.flashToView(req);
  opts.token = req.params.token;
  res.render('user/reset-password', opts);
}
/**
 * GET /users/password/change
 *
 * Display pasword change form with oldPassword, password, passwordConfirmation and (hidden) token input fields
 * (user/change-password.ejs)
 */
module.exports.showPasswordSetForm = function(req, res) {
  var opts = help.flashToView(req);
  if (req.params.userId) {
    opts.userId = req.params.userId;
  }
  User.findById(opts.userId).exec().then((user) => {
    if(user) {
      res.render('user/set-password', opts);
    } else {
      res.redirect('/users/register/');
    }
  }).catch(() => {
    res.redirect('/users/register/');
  })
}

/**
 * GET /users/password/change
 *
 * Display pasword change form with oldPassword, password, passwordConfirmation and (hidden) token input fields
 * (user/change-password.ejs)
 */
module.exports.showPasswordChangeForm = function(req, res) {
  var opts = help.flashToView(req);
  if (req.params.userId) {
    opts.userId = req.params.userId;
  }
  res.render('user/change-password', opts);
}

module.exports.signupViaEmail = async function (req, res) {
  const userData = { email: req.body.email };
  const redirectUrl = req.body.redirectUrl;
  User.newRegistration(userData).then(function (registrationData) {
    const user = registrationData.user;
    const rootUrl = `${req.protocol}://${req.get('host')}`
    const data = {
      newRegistrationUrl: `${redirectUrl}/${encodeURIComponent(user.registrationToken.token)}?on=register`,
      homeUrl: rootUrl,
    };

    emailGen('user-registration', data)
      .then(function (template) {
        logger.info('Generated [user-registration] template');
        return template.html;
      })
      .then(function (html) {
        var emailData = {
          recipient: user.local.email,
          subject: 'Registration email',
          message: html
        };
        return emailData
      })
      .then(emailSender.sendEmail)
      .then(function (resp) {
        logger.info("SENT: ", resp);
        const message = `An email validation link was just emailed to you at ${req.body.email}, please verify your email and follow the instructions to complete your registration.
         We're happy to have you as part of our community!`;
        const note = `We've been having problems with our emails going to the spam folder. Please add support@aryavratinfotech.com as a contact so our email doesn't go to spam, and check your spam folder or trash if our emails don't come to your inbox!`
        res.send({
          status:'success',
          message: message,
          note: note
        }).end();
      })
      .catch(function (err) {
        logger.error('Failed seding email.', err);
        res.send({
          status: 'error',
          message: `Failed to create new user with message: ${err.message}`
        })
      });
  }).catch(function (err) {
    logger.error('Failed creating registration.', err);
    res.send({
      status: 'error',
      message: `Failed to create new user with message: ${err.message}`
    })
  });
}

module.exports.signupOnApp = async function (req, res) {
  const userData = {
    countryCode: req.body.code,
    phone: req.body.phone,
  };
  User.newRegistration(userData).then(function (registrationData) {
    const user = registrationData.user;
    const rootUrl = `${req.protocol}://${req.get('host')}`
    const data = {
      newRegistrationUrl: ``,
      homeUrl: rootUrl,
    };

    smsSender.sendSingleSMS({
      to:req.body.phone,
      message:`Use OTP: ${user.phoneVerificationToken.token} to verify your number on ${process.env.APP_NAME}`
    });

    emailGen('user-registration', data)
      .then(function (template) {
        logger.info('Generated [user-registration] template');
        return template.html;
      })
      .then(function (html) {
        var emailData = {
          recipient: user.local.email,
          subject: 'Registration email',
          message: html
        };
        return emailData
      })
      .then(emailSender.sendEmail)
      .then(function (resp) {
        logger.info("SENT: ", resp);
        const message = `An email validation link was just emailed to you at ${req.body.email}, please verify your email and follow the instructions to complete your registration.
         We're happy to have you as part of our community!`;
         return res.send(ApiUtility.success({
          code: user.phoneVerificationToken.token,
          user_id: user._id
         }, message));
      })
      .catch(function (err) {
        logger.error('Failed seding email.', err);
        return res.send(ApiUtility.failed(`${err.message}`))
      });
  }).catch(function (err) {
    logger.error('Failed creating registration.', err);
    return res.send(ApiUtility.failed(`${err.message}`))
  });
}

module.exports.resendEmailVerificationToken = async function (req, res) {
  const user_id = req.body.user_id;
  try {
    if (isEmpty(user_id)) {
      throw new Error("user_id is missing from request");
    }
    let user = await User.findById(user_id);
    if(!user){
      throw new Error("Invalid user_id");
    }
    user.setEmailVerificationToken();
    user.save().then(function (userData) {
      var rootUrl = `${req.protocol}://${req.get('host')}`
      var data = {
        passwordResetUrl: `${config.frontBaseUrl}/${encodeURIComponent(user._id)}/${encodeURIComponent(userData.emailVerificationToken.token)}`,
        homeUrl: rootUrl,
      };
      return emailGen('password-reset', data)
        .then(function(template) {
          logger.info('Generated [password-reset] template');
          return template.html;
        })
        .then(function(html) {
          // build email:
          var emailData = {
            recipient: user.local.email,
            subject: `${config.appName} password reset email`,
            message: html
          };
          return emailData
        })
        .then(emailSender.sendEmail)
        .then(function(resp) {
          logger.info("SENT: ", resp);
          const message = `Please check your email for a link to reset your password.`;
          return res.send(ApiUtility.success({}, message));
        })
        .catch(function(err) {
          logger.error('Failed sending password reset email.', err);
          return res.send(ApiUtility.failed(`${err.message}`))
        });
    }).catch(function (err) {
      logger.error('userController.resendEmailVerificationToken', err);
      return res.send(ApiUtility.failed(`${err.message}`))
    });
  } catch (error){
    return res.send(ApiUtility.failed(`${error.message}`))
  }
}

module.exports.confirmRegistration = async function (req, res) {
  const token = req.body.token;
  const newPassword = req.body.password;
  const passConfirm = req.body.passwordConfirmation;
  try {
    if (isEmpty(token)) {
      throw new Error("Security token is missing from request");
    }
    if (isEmpty(newPassword) || isEmpty(passConfirm)) {
      throw new Error("Password is required.");
    }

    User.confirmRegistration(token).then(function (user) {
      User.setPassword(user._id, newPassword, passConfirm).then(function (updatedUser) {
        res.send({
          status: 'success',
          message: `We are happy to have you as part of our community!`,
          data: {
            userId: user.id
          }
        })
      }).catch(function (err) {
        res.send({
          status: 'error',
          message: err.message,
          data: {}
        })
      });
    }).catch(function (err) {
      logger.error('userController.confirmRegistration REMOVING TOKEN...', err);
      res.send({
        status: 'error',
        message: err.message,
        data: {}
      })
    });
  } catch (error){
    res.send({
      message: error.message,
      status: 'error',
    }).end();
  }
}

module.exports.requestForgotPassword = async function (req, res) {

  const phone = req.body.phone;
  const countryCode = req.body.countryCode;
  try {
    if (isEmpty(phone) || isEmpty(countryCode)) {
      throw new Error("Phone number or Country code is missing from request");
    }
    let user = await User.findByPhone({phone: phone, countryCode: countryCode});
    if(!user){
      throw new Error("No record found with this phone number.");
    }
    user.setPhoneVerificationToken();
    user.save().then(function (userData) {
      smsSender.sendSingleSMS({
        to:`+${userData.profile.contactInfo.address.countryCode}${userData.profile.contactInfo.phone}`,
        message:`Use OTP: ${userData.otpToken.otpToken} to set new password on ${process.env.APP_NAME}`
      });
      return true;
    }).catch(function (err) {
      return res.send(ApiUtility.failed(`${err.message}`))
    });
    return res.send(ApiUtility.success({
      user_id: user._id,
      code: user.otpToken.otpToken
    }, `Verification code sent successfully`));
  } catch (error){
    return res.send(ApiUtility.failed(`${error.message}`))
  }
}

module.exports.requestForgotPasswordByEmail = async function (req, res) {
  const email = req.body.email;
  try {
    if (isEmpty(email)) {
      throw new Error("Email is missing from request");
    }
    let user = await User.findByEmail(email);
    if(!user){
      throw new Error("This Email is not registered");
    }
    user.setEmailVerificationToken();
    user.save().then(function (userData) {
      var rootUrl = `${req.protocol}://${req.get('host')}`
      var data = {
        passwordResetUrl: `${config.frontBaseUrl}/user/set-new-password/${encodeURIComponent(user._id)}/${encodeURIComponent(userData.emailVerificationToken.token)}`,
        homeUrl: rootUrl,
        firstName: user.profile.contactInfo.firstName,
        lastName: user.profile.contactInfo.lastName
      };
      return emailGen('password-reset', data)
        .then(function(template) {
          logger.info('Generated [password-reset] template');
          return template.html;
        })
        .then(function(html) {
          // build email:
          var emailData = {
            recipient: user.local.email,
            subject: `${config.appName} password reset email`,
            message: html
          };
          return emailData
        })
        .then(emailSender.sendEmail)
        .then(function(resp) {
          logger.info("SENT: ", resp);
          const message = `Please check your email for a link to reset your password.`;
          return res.send(ApiUtility.success({}, message));
        })
        .catch(function(err) {
          logger.error('Failed sending password reset email.', err);
          return res.send(ApiUtility.failed(`${err.message}`))
        });
    }).catch(function (err) {
      logger.error('userController.requestForgotPassword', err);
      return res.send(ApiUtility.failed(`${err.message}`))
    });
  } catch (error){
    return res.send(ApiUtility.failed(`${error.message}`))
  }
}

module.exports.setNewPassword = async function (req, res) {
  const code = req.body.code;
  const newPassword = req.body.password;
  const passConfirm = req.body.passwordConfirmation;
  const userId = req.body.userId;
  try {
    if (isEmpty(code)) {
      throw new Error("Verification Code is missing from request");
    }
    if (isEmpty(newPassword) || isEmpty(passConfirm)) {
      throw new Error("Password is required.");
    }
    let user = await User.findById(userId);
    if(!user){
      throw new Error("Invalid userId");
    }
    User.verifyPhone(user, code).then(function (user) {
      User.setPassword(user._id, newPassword, passConfirm).then(function (updatedUser) {
        return res.send(ApiUtility.success({},`Password set successfully!`));
      }).catch(function (err) {
        return res.send({
          status: 'error',
          message: err.message,
          data: {}
        }).end()
      });
    }).catch(function (err) {
      return res.send({
        status: 'error',
        message: err.message,
        data: {}
      }).end()
    });
  } catch (error){
    return res.send({
      message: error.message,
      status: 'error',
    }).end();
  }
}

module.exports.setNewPasswordByEmail = async function (req, res) {
  const code = req.body.token;
  const newPassword = req.body.password;
  const passConfirm = req.body.passwordConfirmation;
  const userId = req.body.userId;
  try {
    if (isEmpty(code)) {
      throw new Error("Verification Code is missing from request");
    }
    if (isEmpty(newPassword) || isEmpty(passConfirm)) {
      throw new Error("Password is required.");
    }
    let user = await User.findById(userId);
    if(!user){
      throw new Error("Invalid userId");
    }
    User.verifyEmail(user, code).then(function (user) {
      User.setPassword(user._id, newPassword, passConfirm).then(function (updatedUser) {
        return res.send(ApiUtility.success({},`Password set successfully!`));
      }).catch(function (err) {
        return res.send({
          status: 'error',
          message: err.message,
          data: {}
        }).end()
      });
    }).catch(function (err) {
      return res.send({
        status: 'error',
        message: err.message,
        data: {}
      }).end()
    });
  } catch (error){
    return res.send({
      message: error.message,
      status: 'error',
    }).end();
  }
}

module.exports.setPasswordByPhone = async function (req, res) {

  const token = req.body.token;
  const newPassword = req.body.password;
  const passConfirm = req.body.passwordConfirmation;

  try {
  if (isEmpty(token)) {
    throw new Error("OTP is missing from request");
  }
  if (isEmpty(newPassword) || isEmpty(passConfirm)) {
    throw new Error("Password is required.");
  }

  User.confirmPasswordReset(token).then(function(user) {
    if(user){
      User.setPassword(user._id, newPassword, passConfirm).then(function (updatedUser) {
        res.send({
          status: 'success',
          message: `Password set successfully!`,
        })
      }).catch(function (err) {
        res.send({
          status: 'error',
          message: err.message,
          data: {}
        })
      });
    } else {
      res.send({
        message: 'Invalid token',
        status: 'error',
      }).end();
    }
  }).catch(function(err) {
    res.send({
      message: err.message,
      status: 'error',
    }).end();
  });

  } catch (error){
    res.send({
      message: error.message,
      status: 'error',
    }).end();
  }
}

/**
 * POST /users/register, {email: 'user@emailaddress.com'}
 *
 * Generates registration token and temporary password for the user user, saves changes to DB, sends email to complete
 * registration.
 *
 * Success executes `next()` callback, failure raises errors.
 */
module.exports.sendRegistrationToken = async function (req, res, next) {
  const email = req.body.email;
  let numberPhone = req.body.phone;
  let phone = req.body.phone;

  const valEmail = email ? validator.isEmail(email) : false;
  let valPhone = false;
  if(numberPhone) {
    try {
      phone = await checkPhone(numberPhone);
      valPhone = !!phone;
    } catch (error) {}
  }

  let isEmail = true;
  let isPhone = true;

  if(email) isEmail = valEmail;
  if(numberPhone) isPhone = valPhone;

  if(isEmail && isPhone) {
    const dataRegister = {};
    if(valEmail) dataRegister['email'] = email;
    if(valPhone) dataRegister['phone'] = phone;

      // Check if the user to be registered came through social media link or direct email invitation
    let tmpInvitationId = (req.session.invitationId || req.session.socialMediaShareReferrerId)
                            ? (req.session.invitationId || req.session.socialMediaShareReferrerId) : null;
    if (!tmpInvitationId) { // if null check cookie
      const c_invitationId = req.cookies['user_invitationId'];
      if (c_invitationId) {
        const users = await GetUserByReferrerLink(req);
        if (users[0] || users[1]) {
          tmpInvitationId = (users[0] || users[1]).profile.referrerId;
        }
      }
    }
    const tmpFriendRequestId = (req.session.friendRequestId)? req.session.friendRequestId : null;
    const referrerUserId = (req.session.referrerUserId)? req.session.referrerUserId : null;
    User.newRegistration(dataRegister, tmpInvitationId, tmpFriendRequestId, referrerUserId,req.body.clientTimezoneOffset).then(function(registrationData) {
      // Now, need to email the user:
      var user = registrationData.user;
      var rootUrl = `${req.protocol}://${req.get('host')}`
      var data = {
        newRegistrationUrl: `${rootUrl}/users/register/${encodeURIComponent(user.registrationToken.token)}`,
        homeUrl: rootUrl,
      };

      if (config.registration.bypassEmail) {
        res.redirect(data.newRegistrationUrl);
      } else {
        const arrSend = [];
        if(valEmail){
           arrSend.push(sendByEmail(user.local.email, data));
        }
        if(valPhone){
          var messageSMS = `The code ${user.registrationCode.code} to confirm your registration on ${config.appName}`
          arrSend.push(sendByPhone(phone, messageSMS));
        }

        return Promise.all(arrSend)
        .then((results) => {
          const linkConfirm = valPhone ? `/users/code/${phone}` : '';
          const note = `We've been having problems with our emails going to the spam folder. Please add ${config.supportEmail} as a contact so our email doesn't go to spam, and check your spam folder or trash if our emails don't come to your inbox!`
          const message = `An email validation link was just emailed to you at ${req.body.email}, please verify your email and follow the instructions to complete your registration.
          We're happy to have you as part of our community!`;
          if(valPhone) {
            const message = user.local.email ? `An email validation link was just emailed to you at ${user.local.email}, please verify your email or input your code to complete your registration.` : '';
            res.render('user/registration-code', {
              message: message,
              phone: phone,
              userId: user._id,
              link: ''
            });
          } else {
            res.render('user/registration-sent', {
              message: message,
              note: note,
              link: linkConfirm
            });
          }
        })
        .catch(function(err) {
          logger.error('Failed seding email.', err);
          help.flashError(req, err.message);
          res.redirect('/users/register/');
        });
      }
    }).catch(function(err) {
      logger.error('Failed creating registration.', err);
      help.flashError(req, err.message);
      res.redirect("/users/login"+'?email='+req.body.email);
    });

  } else {
    if(!isEmail && isPhone) {
      help.flashError(req, "Emai number not valid");
    } else if(isEmail && !isPhone) {
      help.flashError(req, "Phone number not valid");
    } else {
      help.flashError(req, "Email and phone number not valid");
    }
    res.redirect('/users/register/');
  }
}

const checkPhone = (phone) => {
  return new Promise(function (resolve, reject) {
    smsSender.lookupNumber(phone).then((result) => {
      if(result && result.phoneNumber) {
        resolve(result.phoneNumber);
      } else {
        resolve(false);
      }
    })
    .catch((error) => {
      resolve(false);
    });
  });
}

const sendByEmail =  (email, data) => {
  return new Promise(function (resolve, reject) {
    emailGen('user-registration', data)
      .then(function (template) {
        logger.info('Generated [user-registration] template');
        return template.html;
      })
      .then(function (html) {
        var emailData = {
          recipient: email,
          subject: `${config.appName} registration email`,
          message: html
        };
        return emailData
      })
      .then(emailSender.sendEmail)
      .then((result) => {
        resolve(result);
      })
      .catch((err) => {
        logger.error('Failed seding email.', err);
        reject(new Error(err && err.message));
      });
  });
}

const sendByPhone = (phone, message) => {
  return new Promise(function (resolve, reject) {
      smsSender.lookupNumber(phone).then((result) => {
          if(result && result.phoneNumber) {
              const to = result.phoneNumber;
              client.messages.create({
                  body: message,
                  to: to,
                  from: phoneNumber
              })
              .then((message) => {
                  logger.info(`Send sms to ${to} success.`);
                  resolve(message);
              })
          } else {
              logger.error(`Look up number phone not found: ${phone}`);
              reject(new Error('Look up number phone not found'));
          }
      })
      .catch((error) => {
          logger.error(error);
          reject(new Error('Look up number phone not found'));
      });
  });
}

/**
 * GET /users/code/:phone
 *
 * Verifies that the token exists, still valid (has not expired), clears the token, sends the user to password change
 * page.
 */
module.exports.formConfirmCode = function(req, res) {
  const phone = req.params.phone;
  const valPhone = phone ? validator.isMobilePhone(phone, ['en-US']) : false;
  if(valPhone) {
    User.newRegistrationCode(phone).then(function(user) {
      const message = user.local.email ? `An email validation link was just emailed to you at ${user.local.email}, please verify your email and follow the instructions to complete your registration` : '';
      res.render('user/registration-code', {
        message: message,
        phone: user.local.phone,
        link: ''
      });
    }).catch(function(err) {
      logger.error('userController.confirmRegistration REMOVING TOKEN...', err);
      help.flashError(req, err.message);
      res.redirect('/users/register/');
    });
  } else {
    res.redirect('/users/register/');
  }
}

/**
 * GET /users/register/:token
 *
 * Verifies that the token exists, still valid (has not expired), clears the token, sends the user to password change
 * page.
 */
module.exports.confirmRegistration = function(req, res) {
  User.confirmRegistration(req.params.token).then(function(user) {
    help.flashSuccess(req, 'We are happy to have you as part of our community!');
    res.redirect(`/users/password/set/${user.id}`);
  }).catch(function(err) {
    logger.error('userController.confirmRegistration REMOVING TOKEN...', err);
    help.flashSuccess(req, '');
    help.flashError(req, err.message);
    res.redirect('/users/register/');
  });
}

/**
 * GET /users/register/:token
 *
 * Verifies that the token exists, still valid (has not expired), clears the token, sends the user to password change
 * page.
 */
module.exports.confirmCodeRegistration = function(req, res) {

  if(!req.body.code || !req.body.userId)
    return res.send(ApiUtility.failed('Missing Requried Fields'));

  const code = req.body.code;
  const userId = req.body.userId;

  User.findById({_id: ObjectID(userId)}).then((foundUser) => {

    if(!foundUser)
      return res.send(ApiUtility.failed('User not found'));

    User.verifyPhone(foundUser, code).then(function(user) {
      
      return res.send(ApiUtility.success(User.getUserDataForApi(user), 'Phone Verified Successfully'));
  
    }).catch(function(err) {
      return res.send(ApiUtility.failed(err.message));
    });

  }).catch((error) => {
    return res.send(ApiUtility.failed(error.message));
  })

  
}

module.exports.restCodeRegistration = function(req, res) {
  const phone = req.body.phone;
  const registration = req.body.registration;
  User.resetCodeRegistration(phone).then(function(user) {
    var messageSMS = `The code ${user.registrationCode.code} to confirm your registration on ${config.appName}`
    if(registration) {
      messageSMS = `The code ${user.registrationCode.code} to confirm your rest password on ${config.appName}`
    }
    sendByPhone(phone, messageSMS)
    .then((result)=> {
      res.send({
        message: `We sent the code to the phone number ${phone}`,
        success: true,
        phone: phone
      })
    })
    .catch(function(err) {
      logger.error('userController.restCodeRegistration send code failed', err);
      res.send({
        message: `We cannot send sms to phone number ${phone}`,
        success: false,
        phone: phone
      })
    });
  }).catch(function(err) {
    logger.error('userController.restCodeRegistration send code failed', err);
    res.send({
      message: `Phone number ${phone} has not been registered with ${config.appName}`,
      success: false,
      phone: phone
    })
  });
}

/**
 * Submit phone to receive code
 */

module.exports.submitPhone = async function(req, res) {
  let phone = req.body.phone;
  let valPhone = false;
  if(phone) {
    try {
      phone = await checkPhone(phone);
      valPhone = !!phone;
    } catch (error) {}
  }
  if (req.session.user && valPhone){
    let userId = req.session.user && req.session.user.href;
    User.submitPhone(userId).then(function(user) {
      var messageSMS = `The code ${user.registrationCode.code} to confirm your phone with ${config.appName}`
      return sendByPhone(phone, messageSMS)
      .then((result)=> {
        return res.send({
          message: `We sent the code to the phone number ${phone}`,
          success: true,
          phone: phone
        }).end();
      })
      .catch(function(err) {
        logger.error('userController.submitPhone send code failed', err);
        return res.send({
          message: `We cannot send sms to phone number ${phone}`,
          success: false,
          phone: phone
        }).end();
      });
    }).catch(function(err) {
      logger.error('Submit phone...', err);
      res.send({
        message: err.message || 'Sent phone failed',
        success: false
      })
    });
  } else {
    res.send({
      message: !valPhone ? 'Invalid phone number' : 'User not found!',
      success: false
    })
  }
}

/**
 * Save phone
 * @param phone;
 */
module.exports.savePhone = function(req, res) {
  const phone = req.body.phone;
  const code = req.body.code;
  if (req.session.user && code){
    let userId = req.session.user && req.session.user.href;
    User.confirmCodeSubmit(userId).then((user) => {
      if(user && user.registrationCode.code == code) {
        return User.savePhone(phone, userId).then(function(result) {
          return res.send(result).end();
        })
      } else {
        return res.send({
          message: `Sorry, code is incorrect. Please try to sent again.`,
          success: false
        }).end();
      }
    }).catch(function(err) {
      logger.error('Save phone...', err);
      res.send({
        message: err.message || 'Save phone failed',
        success: false
      })
    });
  } else {
    res.send({
      message: !valPhone ? 'Invalid phone number' : 'User not found!',
      success: false
    })
  }
}
/**
 * Save email
 * @param email;
 */
module.exports.saveEmail = function(req, res) {
  const email = req.body.email;
  const valEmail = email ? validator.isEmail(email) : false;
  if (req.session.user && valEmail){
    let userId = req.session.user && req.session.user.href;
    User.saveEmail(email, userId).then(function(result) {
      res.send(result)
    }).catch(function(err) {
      logger.error('Save email...', err);
      res.send({
        message: err.message || 'Save email failed',
        success: false
      })
    });
  } else {
    res.send({
      message: !valEmail ? 'Invalid email address' : 'User not found!',
      success: false
    })
  }
}

/**
 * POST /users/password/change/:userId
 *
 * Sets the users password during the registration process
 */
module.exports.setPassword = function(req, res, next) {
  // User can use this for registration password reset or self-reset:
  if (req.method === 'GET') res.redirect('/users/password/set/');
  else {
    var userId, errUrl;
    if (req.body.userId) {
      userId = req.body.userId;
      errUrl = `/users/password/set/${userId}`;
    } else {
      userId = req.user.id;
      errUrl = '/users/password/set/';
    }
    var newPassword = req.body.password;
    var passConfirm = req.body.passwordConfirmation;
    if (isEmpty(newPassword) || isEmpty(passConfirm)) {
      throw new Error("password is required.");
    }
    User.setPassword(userId, newPassword, passConfirm).then(function(updatedUser) {
      help.flashSuccess(req, `Welcome to ${config.appName}!`);
      req.body.email = updatedUser.local.email || updatedUser.local.phone;
      return auth.authenticate.localLogin(req, res, next);
    }).catch(function(err) {
      var errMsg = err.message;
      // TODO: Figure out the error:
      help.flashError(req, errMsg);
      res.redirect(errUrl);
    });
  }
}

/**
 * GET /users/password/change
 * POST /users/password/change/:userId
 *
 * Changes user's password, when the Current Password matches the record and password is correctly confirmed.
 * In addition, userId can be sent via POST DATA, for cases where there is password reminder or registration is to
 * be required and user is not authenticated.
 */
module.exports.changePassword = function(req, res, next) {
  // User can use this for registration password reset or self-reset:
  if (req.method === 'GET') res.redirect('/users/password/change/');
  else {
    var userId, errUrl;
    userId = req.user.id;
    errUrl = '/users/password/change/';

    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var passConfirm = req.body.passwordConfirmation;
    if (isEmpty(newPassword) || isEmpty(passConfirm)) {
      throw new Error("password is required.");
    }
    User.changePassword(userId, oldPassword, newPassword, passConfirm).then(function(updatedUser) {
      help.flashSuccess(req, 'Password changed successfully!');
      res.redirect('/users/dashboard/');
      //req.body.email = updatedUser.local.email;
      //return auth.authenticate.localLogin(req, res, next);
    }).catch(function(err) {
      var errMsg = err.message;
      help.flashError(req, errMsg);
      logger.error(errMsg);
      res.redirect(errUrl);
    });
  }
}

/**
 * POST /users/password/change/:userId
 *
 * Changes user's password, when the Current Password matches the record and password is correctly confirmed.
 * In addition, userId can be sent via POST DATA, for cases where there is password reminder or registration is to
 * be required and user is not authenticated.
 */
module.exports.changePasswordApi = function(req, res, next) {
    const userId = req.body.userId;
    var oldPassword = req.body.oldPassword;
    var newPassword = req.body.newPassword;
    var passConfirm = req.body.passwordConfirmation;
    if (isEmpty(newPassword) || isEmpty(passConfirm)) {
      throw new Error("password is required.");
    }
    User.changePassword(userId, oldPassword, newPassword, passConfirm).then(function(updatedUser) {
      return res.send(ApiUtility.success({},`Password changed successfully!`));
    }).catch(function(err) {
      return res.send(ApiUtility.failed(err.message));
    });
}

/**
 * POST /users/login
 *
 * Authenticates the user via email and password input fields, setting user as logged in for the current session.
 */
module.exports.login = auth.authenticate.localLogin;

/**
 *
 * Sign Up via phone.
 */
module.exports.signup = auth.authenticate.localSignUp;

/**
 * POST /users/logout
 *
 * Logs out the current user from this session.
 */
module.exports.logout = function (req, res, next) {
  help.flashSuccess(req, 'You have been logged out successfully.');
  return req.db.collection('sessions').deleteOne({'session.email':req.session.email})
  .then((success)=>{
    req.logout();
    next();
  })
}

/**
 * POST /users/password/reset, {email: 'user@emailaddress.com'}
 *
 * Generates password reset token and temporary password for the user user, saves changes to DB, sends email to complete
 * registration.
 *
 * Success executes `next()` callback, failure raises errors.
 */
 module.exports.sendPasswordResetToken = function (req, res, next) {
  var username = req.body.username;
  const valiPhone = username ? validator.isMobilePhone(username, ['en-US']) : false;
  User.resetPassword(username, valiPhone).then(function(resetData) {
    // Now, need to email the user:
    var user = resetData.user;
    var rootUrl = `${req.protocol}://${req.get('host')}`
    var data = {
      passwordResetUrl: `${rootUrl}${'/users/password/reset'}/${encodeURIComponent(user.passwordResetToken.token)}`,
      homeUrl: rootUrl,
    };
    // don't want to send emails in prod
    if (config.registration.bypassEmail) {
      res.redirect(data.passwordResetUrl);
    } else {
      if(valiPhone) {
        return User.resetCodeRegistration(username).then(function(user) {
          var messageSMS = `The code ${user.registrationCode.code} to confirm your reset password ${config.appName}.`
          sendByPhone(username, messageSMS)
          .then((result)=> {
            res.render('user/registration-code', {
              message: '',
              phone: user.local.phone,
              link: `${'/users/password/reset'}/${encodeURIComponent(user.passwordResetToken.token)}`,
            });
          });
        })
      } else {
        return emailGen('password-reset', data)
        .then(function(template) {
          logger.info('Generated [password-reset] template');
          return template.html;
        })
        .then(function(html) {
          // build email:
          var emailData = {
            //recipient: user.local.email,
            recipient: username,
            subject: `${config.appName} password reset email`,
            message: html
          };
          return emailData
        })
        .then(emailSender.sendEmail)
        .then(function(resp) {
          logger.info("SENT: ", resp);
          const message = `Please check your email for a link to reset your password.`;
          res.render('user/forgot-password-sent', {
              message: message
          });
        })
        .catch(function(err) {
          logger.error('Failed sending password reset email.', err);
          help.flashError(req, err.message);
          res.redirect('/users/password/reset');
        });
      }
    };
  }).catch(function(err) {
    help.flashError(req, err.message);
    res.redirect('/users/password/reset');
  });
};

/**
 * POST /users/password/reset, {email: 'user@emailaddress.com'}
 *
 * Generates password reset token and temporary password for the user user, saves changes to DB, sends email to complete
 * registration.
 *
 * Success executes `next()` callback, failure raises errors.
 */
module.exports.confirmPasswordReset = function (req, res, next) {
  User.confirmPasswordReset(req.params.token).then(function(user) {
    //I oumou change the text in the next line.
    help.flashSuccess(req, ' Please type your new password twice below.');
    res.redirect(`/users/password/set/${user.id}`);
  }).catch(function(err) {
    logger.error('userController.confirmPasswordReset REMOVING TOKEN...', err);
    help.flashError(req, err.message);
    res.redirect('/users/password/reset');
  });
}

module.exports.updateAdminProfile = async function(req, res){
  try {
    const { email, firstName, lastName, phone, userId } = req.body;
    if(!email || !firstName || !lastName || !phone || !userId){
      return res.send(ApiUtility.failed("Required fields are missing"));
    }
    let user = await User.findById(userId);
    if(!user){
      throw new Error("Invalid User ID");
    }

    user.local.email = email;
    user.profile.contactInfo.phone = phone;
    user.profile.contactInfo.firstName = firstName;
    user.profile.contactInfo.lastName = lastName;

    if(req.files && req.files.profilePic){
      let profilePic = req.files.profilePic;
      // Use the mv() method to place the file somewhere on your server
      let uploadFilePath = `${config.express.staticFilesPath}/uploads/${userId}_${profilePic.name}`;
      uploadFilePath = uploadFilePath.replace(/\s+/g, '-');
      var rootUrl = `${req.protocol}://${req.get('host')}`;
      let imageUrl = `${rootUrl}/uploads/${userId}_${profilePic.name}`;
      imageUrl = imageUrl.replace(/\s+/g, '-');
      user.profile.imageUrl = imageUrl;
//TODO: need to delete old image of user;
      profilePic.mv(uploadFilePath, function(err) {
        if (err){
          return res.status(500).send(err);
        }
        user.save().then(function (userData) {
          let responseData = User.getPatientDetail(userData);
          return res.send(ApiUtility.success(responseData,"Profile updated successfully"))
        }).catch(function (err) {
          logger.error('userController.updateUserProfile', err);
          return res.send(ApiUtility.failed(`${err.message}`))
        });
      });
    } else {
      user.save().then(function (userData) {
        let responseData = User.getPatientDetail(userData);
        return res.send(ApiUtility.success(responseData,"Profile updated successfully"));
      }).catch(function (err) {
        logger.error('userController.updateUserProfile', err);
        return res.send(ApiUtility.failed(`${err.message}`))
      });
    }
  } catch(err){
    return res.send(ApiUtility.failed(err.message));
  }
}

module.exports.updateUserProfile = async function(req, res){
  try {
    const { email, userId } = req.body;
    if(!email || !userId){
      return res.send(ApiUtility.failed("Required fields are missing"));
    }
    let user = await User.findById(userId);
    if(!user){
      throw new Error("Invalid User ID");
    }

    user.local.email = email;
    // user.profile.contactInfo.phone = phone;
    // user.profile.contactInfo.firstName = firstName;
    // user.profile.contactInfo.lastName = lastName;

    if(req.files && req.files.profilePic){
      let profilePic = req.files.profilePic;
      // Use the mv() method to place the file somewhere on your server
      let uploadFilePath = `${config.express.staticFilesPath}/uploads/${userId}_${profilePic.name}`;
      uploadFilePath = uploadFilePath.replace(/\s+/g, '-');
      var rootUrl = `${req.protocol}://${req.get('host')}`;
      let imageUrl = `${rootUrl}/uploads/${userId}_${profilePic.name}`;
      imageUrl = imageUrl.replace(/\s+/g, '-');
      user.profile.imageUrl = imageUrl;
//TODO: need to delete old image of user;
      profilePic.mv(uploadFilePath, function(err) {
        if (err){
          return res.status(500).send(err);
        }
        user.save().then(function (userData) {
          let responseData = User.getPatientDetail(userData);
          return res.send(ApiUtility.success(responseData,"Profile updated successfully"))
        }).catch(function (err) {
          logger.error('userController.updateUserProfile', err);
          return res.send(ApiUtility.failed(`${err.message}`))
        });
      });
    } else {
      user.save().then(function (userData) {
        let responseData = User.getPatientDetail(userData);
        return res.send(ApiUtility.success(responseData,"Profile updated successfully"));
      }).catch(function (err) {
        logger.error('userController.updateUserProfile', err);
        return res.send(ApiUtility.failed(`${err.message}`))
      });
    }
  } catch(err){
    return res.send(ApiUtility.failed(err.message));
  }
}

function isEmpty(str) {
  return !str || str.trim().length == 0;
}

async function GetUserByReferrerLink(req) {
  const refId = req.cookies['user_invitationId'];

  const u_referrerId = await req.db.collection('users').findOne({
    'profile.referrerId': refId
  });

  const u_oldReferrerId = await req.db.collection('users').findOne({
    'profile.oldReferrerId': {
      $elemMatch: {
        $in: [refId],
        $exists: true
      }
    }
  })
  return [u_referrerId, u_oldReferrerId];
}

/**
 * GET /users/password/secondary
 *
 * Redirect user to users/profile page with succes message of email verification
 *
 */
module.exports.secondaryEmailVerification = function(req, res) {
  let userId = req.params.userId;
  let secondaryEmail = req.params.secondaryEmail;
  var errUrl = ROUTES.USERS.SECONDARY_PASSWORD_SET_PATH;
  var successUrl = '/users/dashboard/';
    User.verifySecondaryEmail(userId, secondaryEmail).then(function(updatedUser) {
      help.flashSuccess(req, `Welcome to ${config.appName}! You have successfully verified your new email address ${secondaryEmail}`);
      req.body.email = updatedUser.local.email;
      res.redirect(successUrl);
    }).catch(function(err) {
      var errMsg = err.message;
      // TODO: Figure out the error:
      help.flashError(req, errMsg);
    });
}

/**
 * GET /users/validateEmail
 *
 * check whether the passed email is a valid user or not
 */
module.exports.validateEmail = function (req, res) {
	let data = req.body.email;
	req.db.collection('users').findOne({"local.email":  data.toLowerCase()})
    .then(function (result) {
        if (result != null) {
          res.status(200).send({data: result, code: 0});
        } else {
          res.status(404).send({code: 1, message: 'Failed to get Validated Email.'});
        }
    })
    .catch(function (err) {
      res.status(404).send({code: 1, message: err});
    });
}


/**
 * POST /registerDevice
 * Register device token for push notification
 */
module.exports.registerDevice = function (req, res) {
    if (req.session.user){
      let userId       = req.session.user && req.session.user.href;
      const deviceData = req.body;

      NotificationAPI.register(userId, deviceData).then(result => {
          return res.status(200).send(result);
      }).catch(error => {
          logger.error("[Register Device] - ", error);
          return res.status(200).send(error);
      });
    } else {
      res.status(200).send({success:0, message: "Not logged in."});
    }
};

module.exports.updateLocation = function(req, res){
  var data = {};
  locationHistory.addHistory(req, data).then(function(result){
    if (result !== null) {
      res.status(200).send({data: result, code: 0});
    } else {
      res.status(500).send({code: 1, message: 'Unable to update user history'});
    }
  });
};

module.exports.adminAddDoctor = async function adminAddDoctor (req, res) {
  try {
    
    if(
      !req.body.countryCode ||
      !req.body.phone
    )
    return res.send(ApiUtility.failed('Missing Required Fields'));

    if(!allowForRequest.allowForAction(req.body.jwtInfo.permission, 'category1'))
      return res.send(ApiUtility.failed('You have no permission to make this request'));

    let savedDoctor = await User.addDoctor(req.body);

    return res.send(ApiUtility.success({
      _id: savedDoctor.doctor._id,
      randomPass: savedDoctor.randomPass
    }, 'Doctor Add Successfully'));


  } catch (error) {
    return res.send(ApiUtility.failed(error.message));
  }
}

module.exports.registerAdmin = async function registerAdmin (req, res) {
  try {
    
    if(
      !req.body.countryCode ||
      !req.body.phone ||
      !req.body.name
    )
    return res.send(ApiUtility.failed('Missing Required Field'));

    let savedAdmin = await User.createAdmin(req.body);

    return res.send(ApiUtility.success('Admin Created Successfully', savedAdmin._id));

  } catch (error) {
    return res.send(ApiUtility.failed(error.message));
  }
}

module.exports.getUserDetailsByToken = async function getUserDetailsByToken (req, res) {
  try {
    
    let userDetails = await User.findById(req.body.jwtInfo.jwtId);

    if(!userDetails)
    return res.send({status: 'error', message: 'User Not Exists'});

    let returnUserDetails = {
      name: `${userDetails.profile.contactInfo.firstName} ${userDetails.profile.contactInfo.lastName}`,
      avatar: userDetails.profile.imageUrl,
      id: userDetails._id,
      email:userDetails.local.email,
    }

    return res.send({status: 'success', message: 'User Details Fetched Successfully', data: returnUserDetails});

  } catch (error) {
    return res.send({status: 'error', message: error.message});
  }
}