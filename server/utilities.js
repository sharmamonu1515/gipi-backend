const utilities = module.exports;

utilities.returnLocationPoint = function returnLocationPoint(lat, lng) {
    let point = [];
    point.push(Number(lng));
    point.push(Number(lat));
  
    let returnLocation = {
      type: 'Point',
      coordinates: point
    }
  
    return returnLocation;
  }