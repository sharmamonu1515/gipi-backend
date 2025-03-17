const ClickMetrics = require('../server/models/common/click-metrics');
const Promise = require('bluebird');


module.exports.addClick = function(req,data){
    return new Promise(function (resolve, reject) {
    var clickMetrics = new ClickMetrics();
    if(req.headers['posLat'] && req.headers['posLong']){
        clickMetrics.lat = req.headers['posLat'];
        clickMetrics.lng = req.headers['posLon'];
    }
    if(req.headers['user-agent']){
        clickMetrics.userAgent = req.headers['user-agent'];
    }
    if(data.type){
        clickMetrics.type = data.type;
    }
    if(data.venueId){
        clickMetrics.venueId = data.venueId;
    }
    if(data.menuItemId){
        clickMetrics.menuItemId = data.menuItemId;
    }
    if(data.subType){
        clickMetrics.subType = data.subType;
    }
    if(req.session.user){
        clickMetrics.userId = req.session.user._id;
    }
    clickMetrics.save();
    resolve([]);
    });
}

module.exports.getClicks = function(venueId){
    return ClickMetrics.getClicks(venueId);
}