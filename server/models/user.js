
const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');
const validator = require('validator');

const logger = require('../../utils/logger')(module);
const crypto = require('../../lib/crypto');

const Token = require('./token');
const ObjectID = require('mongodb').ObjectID;
const UserProfile = require('./user-profile');
const MetaData = require('../models/meta-data');
var jwt = require('jsonwebtoken');
const config = require('../config');
const Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
const OTPSchema = require('../models/otp-token');
const utilities = require('../../utils/common-utilities');
const smsSender = require('../../lib/sms-sender')
const randomString = require('randomstring');

// define the schema for our user model
const userSchema = mongoose.Schema({
  emailVerificationToken: Token.schema,
  otpToken: OTPSchema.schema,
  profile: UserProfile.schema,
  metaData: MetaData.schema,
  trno: {
    type: Number,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: false
  },
  shortId: {
    type: String,
    default: utilities.getUniqueCusId
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false  
  },
  lastLogin : Date,
  local: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      sparse: true,
      validate: {
        isAsync: false,
        validator: validator.isEmail,
        message: '{VALUE} is not a valid email address!',
      },
    },
    password: {
      type: String,
      set: crypto.hash,
      // Also, add some complexity validation
    },
    userName: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    }
  },
  secondary :
  [{
    emails: {
      type: String,
      lowercase: true,
      unique: true,
      sparse: true,
      validate: {
        isAsync: false,
        validator: validator.isEmail,
        message: '{VALUE} is not a valid email address!',
      },
    },
     status : {
      type: String,
    },
  }] ,
  facebook: {
    id           : String,
    token        : String,
    // email        : String,
    // name         : String
  },
  google: {
    id           : String,
    token        : String,
    // email        : String,
    // name         : String
  },
  loginLog: [Date],
  temporaryReferrerUserId : String,
  notifyEmail: String
});

// /////////////////////////////////
// PROPERTIES
// /////////////////////////////////
userSchema.virtual('href').get(function () {
  return this.id;
});

userSchema.virtual('email').get(function () {
  return this.local.email;
});

userSchema.virtual('fullName').get(function () {
  return this.profile ? this.profile.contactInfo.fullName : this.local.email;
});

userSchema.virtual('userName').get(function () {
  var userName = this.local.email;
  if (this.profile) {
    if (this.profile.contactInfo.firstName && this.profile.contactInfo.lastName) {
      userName = `${this.profile.contactInfo.firstName} ${this.profile.contactInfo.lastName[0]}.`;
    }
  }
  return userName;
});

// /////////////////////////////////
// INSTANCE (PUBLIC) METHODS
// /////////////////////////////////

// checking if password is valid
userSchema.methods.isPasswordValid = function (password) {
  return crypto.checkHash(password, this.local.password);
};

userSchema.methods.setEmailVerificationToken = function () {
  this.emailVerificationToken = new Token();
};

userSchema.methods.setPhoneVerificationToken = function () {
  let token = new OTPSchema();
  this.otpToken = token;
};

userSchema.methods.setPasswordResetToken = function () {
  this.passwordResetToken = new Token();
};

/* input: permission group as defined in the constant PERMISSIONS.GROUP_PERMISSIONS
    Determined if the input is a string equal to one of the permissions
    defined in PERMISSIONS.GROUP_PERMISSIONS

    output: A boolean
*/
userSchema.methods.isPermissionValid = function (permission) {

  if (typeof(permission) !== 'string')
    throw new Error('the permission is not a string');

  for (var property in PERMISSIONS.GROUP_PERMISSIONS) {
    if (PERMISSIONS.GROUP_PERMISSIONS.hasOwnProperty(property)
        && PERMISSIONS.GROUP_PERMISSIONS[property] === permission) {
      return true;
    }
  }

  return false
}

/* input: a permission group as defined in the constant PERMISSIONS.GROUP_PERMISSIONS
    the addPermissionGroup method adds the permission group
    input into the method to the document

    output: The saved user document

    Throws an Error
*/
userSchema.methods.addPermissionGroup = function (permission) {

  const userPermission = this.profile.permissionGroups && this.profile.permissionGroups.length ? this.profile.permissionGroups : ['User'];
  if (this.isPermissionValid(permission))
    this.profile.permissionGroups = [...userPermission, permission];
  else
    throw new Error(`the permission ${permission} is not valid!`);

  return this;
}

/* input: a permission group as defined in the constant PERMISSIONS.GROUP_PERMISSIONS
    the hasPermssionGroup method returns true if the current user
    already has this permission group added and false otherwise

    output: A boolean

    Throws an Error
*/
userSchema.methods.hasPermissionGroup = function (permission) {

  if (this.isPermissionValid(permission))
    return (this.profile.permissionGroups.indexOf(permission) > -1);
  else
    throw new Error(`the permission ${permission} is not valid!`);
}


// /////////////////////////////////
// CLASS (STATIC) METHODS
// /////////////////////////////////

// generating a hash
userSchema.statics.generateTemporaryPassword = function generateTemporaryPassword() {
  return crypto.randomString(6);
};

/**
 * newRegistration - creates a new user object, populating only phone Number.
 *
 * The method could conceivably throw the following errors:
 *
 * 1. {Error} - {message: 'Error Message'} indicating that the email address is no longer available or that a Database
 *  Connection Error has occurred.
 * 2. {MongooseError} - error data containing a collection of { errors: {validation-errors}, message: 'Error Message',
 * ...}.
 *
 * @param  {String} phone valid
 */
userSchema.statics.newRegistration = function newRegistration(data) {
  // check user's presence:
  let userFilters = [ { "local.email" : email }, { "secondary.emails": email  }];
  if(data.phone){
    userFilters.push({'profile.contactInfo.phone':data.phone})
  }
  var promise = this.findOne({ $or: userFilters }).exec();
  // populate all relevant user fields:
  return promise.then((foundUser) => {
    if (foundUser && (foundUser.isPhoneVerified == true || foundUser.isEmailVerified == true)) {
      //`Email address ${email} has already been taken. If you forgot your password please go back to login and click "forgot password" to reset your password.`
      throw new Error("User Already Exists");
    }
    if(!foundUser){
      var User = mongoose.model('User', userSchema);
      var newUser = new User();
    } else {
      newUser = foundUser
    }
    newUser.local.email = email;
    newUser.local.password = data.password;
    newUser.profile = new UserProfile();
    newUser.profile.contactInfo.firstName = data.firstName;
    newUser.profile.contactInfo.lastName = data.lastName;
    newUser.profile.contactInfo.phone = data.phone;
    if (data.referrerUserId) newUser.temporaryReferrerUserId = data.referrerUserId;
    newUser.setEmailVerificationToken();
    newUser.setPhoneVerificationToken();
    return (newUser);
  })
  // save the user or pass the validation error up:
  .then((newUser) => {
    return newUser.save().then((savedUser) => {
      logger.info('********  USER REGISTERED ********', savedUser.local.email);
      //logger.info(savedUser.profile)
      return ({ user: savedUser });
    });
  });
};

/**
 * Confirms user registration and deletes the registration token.
 *
 * Token must match the value in DB as well as be NOT expired.
 */
userSchema.statics.confirmRegistration = function confirmRegistration(token) {
  token = sanitize(decodeURIComponent((token)));
  var promise = this.findOne({ 'emailVerificationToken.token': token }).exec();
  return promise.then((user) => {
    if (!user) {
      throw new Error('Registration token not found');
    } else if (user.emailVerificationToken.isExpired) {
      throw new Error('Sorry, your registration time has expired. Please try to register again.');
    } else {
      /*var removedToken = user.emailVerificationToken.remove();
      return user.save().then((savedUser) => {
        return savedUser;
      });*/
      return user;
    }
  });
};

userSchema.statics.verifyPhone = function verifyPhone(user, code) {
  code = sanitize(decodeURIComponent((code)));

  if (user.otpToken && user.otpToken.otpToken !== code) {
    throw new Error('The code is invalid');
  } else if (user.otpToken.isExpired) {
    throw new Error('Sorry, the code has expired. Please try again');
  } else {
    user.isPhoneVerified = true;
    user.isActive = true;
    user.lastLogin = new Date();
    this.updateLoginlog(user._id);
    return user.save().then((savedUser) => {
      return savedUser;
    }).catch((error)=> {
      throw new Error(error.message);
    })
  }
};

userSchema.statics.verifyEmail = function verifyEmail(user, code) {
  code = sanitize(decodeURIComponent((code)));

  if (user.emailVerificationToken && user.emailVerificationToken.token !== code) {
    throw new Error('The code is invalid');
  } else if (user.emailVerificationToken.isExpired) {
    throw new Error('Sorry, the code has expired. Please try again');
  } else {
    user.isEmailVerified = true;
    return user.save().then((savedUser) => {
      return savedUser;
    });
  }
};

/**
 * Generates a reset token for a valid user's email, sets and returns temporary password
 * email can be main or any of the secondary ones
 * Token must match the value in DB as well as be NOT expired.
 */
userSchema.statics.resetPassword = function resetPassword(email) {
  email = sanitize(email.toLowerCase());
  // check user's presence:
  //var promise = this.findOne({ 'local.email': email }).exec();
  var promise = this.findOne({ $or: [ { "local.email" : email }, { "secondary.emails": email  } ] }).exec();
  // populate all relevant user fields:
  return promise.then((user) => {
    if (user) {
      // Generate password reset token:
      user.setPasswordResetToken();
      return (user);
    } else {
      throw new Error(`Email address ${email} is not found.  Please check and try again.`);
    }
  })
  // save the user or pass the validation error up:
  .then((user) => {
    if(email == user.local.email){
      return user.save().then((savedUser) => {
        logger.info('********  PASSWORD RESET ********', email);
        return ({ user });
      });
    }else{
      user.secondary.forEach(function(data){
        if(data.emails == email){
          if(data.status == 'verified'){
            return user.save().then((savedUser) => {
              logger.info('********  PASSWORD RESET ********', user.local.email);
              return ({ user });
            });
          } else {
            throw new Error('Oops! This Email is not verified with your account yet,Please try with another one.')
          }
        }
      });
      return ({ user });
    }
  });
};


/**
 * Confirms user password reset and deletes the password reset token.
 *
 * Token must match the value in DB as well as be NOT expired.
 */
userSchema.statics.confirmPasswordReset = function confirmPasswordReset(token) {

  token = sanitize(decodeURIComponent((token)));
  var promise = this.findOne({ 'otpToken.otpToken': token }).exec();
  return promise.then((user) => {
    if (!user) {
      throw new Error('Invalid password reset token');
    } else if (user.otpToken.isExpired) {
      throw new Error('Sorry, your password reset request has expired. Please try resetting again.');
    } else {
      return user;
    }
  });
};

/**
 * set user's password when they register.  User must exist (by ID), new password must match
 * confirmation.
 */
userSchema.statics.setPassword = function setPassword(userId, newPassword, passwordConfirmation) {
  // never trust inputs
  userId = sanitize(userId);
  newPassword = sanitize(newPassword);
  passwordConfirmation = sanitize(passwordConfirmation);
  // validations
  if (newPassword != passwordConfirmation) {
    return Promise.reject(new Error('Password confirmation does not match the new password.'));
  }
  // return a promise
  return this.findById(userId).exec().then((user) => {
    user.local.password = newPassword;
    // if (user.emailVerificationToken) user.emailVerificationToken.remove();
    if (user.otpToken) user.otpToken.remove();
    return user.save();
  });
};

// old password must be correct. validate current password when user changes their password
userSchema.statics.changePassword = function changePassword(userId, oldPassword, newPassword, passwordConfirmation) {
  // never trust inputs
  userId = sanitize(userId);
  oldPassword = sanitize(oldPassword);
  newPassword = sanitize(newPassword);
  passwordConfirmation = sanitize(passwordConfirmation);
  // validations
  if (newPassword != passwordConfirmation) {
    return Promise.reject(new Error('Password confirmation does not match the new password.'));
  }
  // return a promise
  return this.findById(userId).exec().then((user) => {

    // iff oldPassword is not correct, throw an error
    if (user.isPasswordValid(oldPassword)) {
      // old password is correct, so now we set the password
      user.local.password = newPassword;
      return user.save();
    }
    else {
      throw new Error('Your current password does not seem correct.  Please try again.');
    }
  });
};

userSchema.statics.saveProfile = function saveProfile(userId, email, profile) {
  userId = sanitize(userId);
  email = sanitize(email.toLowerCase());

  return this.findById(userId).exec().then((user) => {
    user.local.email = email;
    // user.profile.
    // var keys = ['street', 'city', 'postalCode', 'country']
    if (!user.profile) user.profile = new UserProfile();

    user.profile.address = profile.address;
    user.profile.contactInfo = profile.contactInfo;
    // Taster Profile
    user.profile.tasterProfile = profile.tasterProfile;
    user.profile.noDietaryPreferences = profile.noDietaryPreferences;
    //Update user referral ID
    if (user.temporaryInvitationId && user.temporaryReferrerUserId) {
          user.profile.referralId = user.temporaryInvitationId;
          //add user friend on the basis of referralId
          var userFriend = new UserFriends();
          var referrerUserId = new ObjectID(user.temporaryReferrerUserId);
          userFriend.invitedByUserId = referrerUserId;
          userFriend.invitedBy = 'Link';
          userFriend.userId = new ObjectID(user._id);
          userFriend.referralId = user.temporaryInvitationId;
          userFriend.status = 'Accepted';
          userFriend.acceptedAt = Date.now;
          userFriend.save();
          //clean temporary data
          user.temporaryInvitationId = null;
          user.temporaryReferrerUserId = null;
    }
    return user.save();
  });
};

/**
 * Updates the users lastLogin field to current date
 */
userSchema.statics.updateLastLogin = function updateLastLogin(userId) {
  return this.findById(userId).exec().then((user) => {
      user.lastLogin = new Date();
      return user.save();
  })
};

/**
 * Updates the users Login Log
 */
userSchema.statics.updateLoginlog = function updateLoginlog(userId) {
  return this.findById(userId).exec().then((user) => {

    if(user.loginLog.length === 10) {
      user.loginLog.pop();
    }

    user.loginLog.unshift(new Date);
    return user.save();

  })
};

/**
 * Updates the users status
 */
userSchema.statics.changeStatus = function changeStatus(userId, status) {
  return this.findById(userId).exec().then((user) => {
      if(user){
        user.isActive = status;
        return user.save();
      } else {
        throw new Error('Invalid userId')
      }
  })
};

/**
 * Update permission group use in restaurant controller.js
 *@param userId
 *@param permissionGroup
 */
userSchema.statics.updatePermissionGroup = function updatePermissionGroup(userId, permissionGroup) {
  userId = ObjectID(userId);
  let options = { $set: {'profile.permissionGroups': permissionGroup } };
  return this.findOneAndUpdate({ _id: userId }, options, { new: true}).then((result) => {
    logger.info(`- - - - - - - - Update permissionGroups success (user ${userId})`);
    return { code: 0, message: 'Update permissionGroups success.' };
  }).catch((err) => {
    console.log(err);
    logger.error(`- - - - - - - - Update permissionGroups failed (user ${userId})`);
    return { code: 1, message: 'Update permissionGroups failed.', error: err };
  });
};

/**
 * when verification link clicked for a secondary email
 */
userSchema.statics.verifySecondaryEmail = function verifySecondaryEmail(userId, secondaryEmail,) {
  // never trust inputs
  userId = sanitize(userId);
  secondaryEmail = sanitize(secondaryEmail);
  // return a promise
  return this.updateOne({'secondary.emails': secondaryEmail, "_id" : ObjectID(userId) }, { $set: { 'secondary.$.status' : 'verified' } }).then((updatedDoc) => {
    if(updatedDoc.ok == 1){
      return this.findById(userId).exec().then((user) => {
        return user.save();
      });
    } else {
       return {code: 1, message:'Unable to verify new Email entered.'};
    }
  });

};

userSchema.statics.addSubUser = function addSubUser(data,res){
  email = sanitize(data.email.toLowerCase());

  // check if Email Is Exists
  var promise = this.findOne({ $or: [ { "local.email" : email }, { "secondary.emails": email  } ] }).exec();

  return promise.then((foundUser) => {
    if(foundUser){
      throw new Error(`Email address ${email} has already taken.`);
    }else{
      var subUser = mongoose.model('User',userSchema);
      var newSubUser = new subUser();
      newSubUser.parentUserId = data.parentUserId;
      newSubUser.local.email = data.email;
      newSubUser.profile = new UserProfile();
      newSubUser.profile.contactInfo.firstName = data.firstName;
      newSubUser.profile.contactInfo.lastName = data.lastName;
      newSubUser.profile.contactInfo.phone = data.phone;
      if(data.referrerUserId) newSubUser.referrerUserId = data.referrerUserId;
      return (newSubUser);
    }
  })
  // save the Sub User Details
  .then((newSubUser) => {
    return newSubUser.save().then((savedSubUser) => {
      logger.info('********  SUB USER ADDED SUCCESSFULLY ********', savedSubUser.local.email);
      return ({subUser: savedSubUser});
    }).catch(function(err){
      return res.send({status:"error",message: err.message});
    });
  });
};

userSchema.statics.findByEmail = function (email){
  return this.findOne({ 'local.email': email }).exec();
}

userSchema.statics.findByPhone = function (data){
  return this.findOne({ 
    $and: [
      {'profile.contactInfo.phone': data.phone},
      {'profile.contactInfo.address.countryCode': data.countryCode},
    ]
  }).exec();
}

userSchema.statics.getDisplayName = function(userId){
  return this.findById({_id:ObjectID(userId)}).then((user) => {
    if(user.profile.contactInfo.firstName){
      return(user.profile.contactInfo.fullName);
    }else{
      return(user.local.email);
    }
  })
}

userSchema.statics.getUserDataForApi = function(user, headers){

  var payload = {
    id: user._id,
    permission: user.profile.permissionGroups
  };

  var token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpireTime }), imageUrl;

  let userData = {
    userId: user._id,
    id: user._id,
    lastLogin:user.lastLogin,
    isActive:user.isActive,
    email:user.local.email,
    userName:user.local.userName,
    imageUrl: imageUrl ? imageUrl : user.profile.imageUrl,
    avatar: imageUrl ? imageUrl : user.profile.imageUrl,
    lastName:user.profile.contactInfo.lastName,
    firstName:user.profile.contactInfo.firstName,
    name: `${user.profile.contactInfo.firstName} ${user.profile.contactInfo.lastName}`,
    token:token,
    accessToken:token,
    status: 'online',
    permission: user.profile.permissionGroups.length > 0 ? user.profile.permissionGroups[0] : ''
  }
  return userData;
}

userSchema.statics.getPatientDetail = function(user){
  let userData = {
    userId: user._id,
    lastLogin:user.lastLogin,
    isActive:user.isActive,
    email:user.local.email,
    imageUrl: user.profile.imageUrl,
    phone: user.profile.contactInfo.phone,
    lastName:user.profile.contactInfo.lastName,
    firstName:user.profile.contactInfo.firstName,
    age:0,
    enrollDate: (user.createdAt)?user.createdAt:Date()
  }
  return userData;
}

userSchema.statics.createAdmin = async function createAdmin(data) {
  try {

    let findAdmin = await this.findOne({
      $and: [
        {'profile.contactInfo.address.countryCode': data.countryCode},
        {'profile.contactInfo.phone': data.phone},
        {'profile.permissionGroups': {$in: ['admin']}}
      ]
    });

    if(findAdmin)
    throw new Error('Phone Number Already Taken');

    let User = mongoose.model('User', userSchema);
    let adminUser = new User();

    adminUser.local.password = 'Test@123';
    adminUser.isPhoneVerified = true;
    adminUser.isActive = true;
    adminUser.profile = new UserProfile();
    adminUser.profile.permissionGroups = ['admin'];
    adminUser.profile.contactInfo.firstName = utilities.getFirstName(data.name);
    adminUser.profile.contactInfo.lastName = utilities.getLastName(data.name);
    adminUser.profile.contactInfo.phone = data.phone;
    adminUser.profile.contactInfo.address.countryCode = data.countryCode;

    let savedAdmin = await adminUser.save();
    return savedAdmin;

  } catch (error) {
    throw new Error(error.message);
  }
}

userSchema.statics.signUpUser = async function signUpUser(data) { // Use For Signup TelaDent
  try {
    let User = mongoose.model('User', userSchema);
    let newUser = new User();

    newUser.metaData = new MetaData();
    newUser.profile = new UserProfile();
    newUser.otpToken = new OTPSchema();

    newUser.metaData.createdAt = MetaData.dateInfo();

    newUser.profile.contactInfo.phone = data.phone;
    newUser.profile.contactInfo.firstName = utilities.getFirstName(data.name);
    newUser.profile.contactInfo.lastName = utilities.getLastName(data.name);
    newUser.profile.contactInfo.address.countryCode = data.countryCode;
    newUser.profile.permissionGroups = ['user'];
    newUser.local.password = data.password;
    newUser.local.email = data.email;
    newUser.local.userName = data.userName;

    let savedNewUser= await newUser.save();

    // smsSender.sendSms({
    //   recipient: `+${savedNewUser.profile.contactInfo.address.countryCode}${savedNewUser.profile.contactInfo.phone}`,
    //   message: `Your One Time Password for signup is ${savedNewUser.otpToken.otpToken}`
    // })

    return savedNewUser;

  } catch (error) {
    throw new Error(error.message)
  }
}


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
