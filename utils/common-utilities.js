const customId = require('custom-id');
const permisionCategory = require('../server/constants/permissions');
const utilities = module.exports;

utilities.generateOTP = function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000)
  }

  // Get First Name
utilities.getFirstName = function(name){
    if(name.indexOf(' ') === -1){
      return name;
    } else {
      return name.substr(0, name.indexOf(' '));
    }
  }

  // Get Last Name
utilities.getLastName = function(name){
    if(name.indexOf(' ') === -1){
      return '';
    } else {
      return name.substr(name.indexOf(' ')+1);
    }

  }

  // Clean Object
utilities.cleanObject = function(data) {
    for(let key in data) {

      if(typeof(data[key]) !== 'object') {
        if(
          data[key].trim().length === 0 ||
          data[key] === undefined ||
          data[key] === null) {
            delete data[key];
          }
      }
    }
    return data;
  }

  // Check Allowed Permissions
utilities.allowForAction = function (permissions, categoryName) {
    try {
      let permissionIndex = -1;

      for(let permission of permissions) {
        permissionIndex = permisionCategory.GROUP_CATEGORIES[categoryName].map((permissionCat) => {
          return permissionCat;
        }).indexOf(permission);
      }

      return permissionIndex > -1 ? true : false;

    } catch (error) {
      throw new Error(error.message);
    }
  }

utilities.getUniqueCusId = function getUniqueCusId() {
    try {
      return customId({});
    } catch (error) {
      throw new Error(error.message);
    }
  }

utilities.cleanQueryParams = function cleanQueryParams(query) {
  try {
    
    for(let key in query) {
      if(query[key] === 'undefined') {
        delete query[key];
      }
    }

    return query;

  } catch (error) {
    throw new Error(error.message);
  }
}

utilities.getTime = function getTime(time) {

  switch(time) {

    case '12:00 AM': 
      return 23;
    case '1:00 AM': 
      return 0;
    case '2:00 AM': 
      return 1;
    case '3:00 AM': 
      return 2;
    case '4:00 AM': 
      return 3;
    case '5:00 AM': 
      return 4;
    case '6:00 AM': 
      return 5;
    case '7:00 AM': 
      return 6;
    case '8:00 AM': 
      return 7;
    case '9:00 AM': 
      return 8;
    case '10:00 AM': 
      return 9;
    case '11:00 AM': 
      return 10;
    case '12:00 PM': 
      return 11;
    case '1:00 PM': 
      return 12;
    case '2:00 PM': 
      return 13;
    case '3:00 PM': 
      return 14;
    case '4:00 PM': 
      return 15;
    case '5:00 PM': 
      return 16;
    case '6:00 PM': 
      return 17;
    case '7:00 PM': 
      return 18;
    case '8:00 PM': 
      return 19;
    case '9:00 PM': 
      return 20;
    case '10:00 PM': 
      return 21;
    case '11:00 PM': 
      return 22;
  }

}