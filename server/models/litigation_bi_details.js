var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports

module.exports = mongoose.model('litigation_bi_detail_old', new Schema({}, { strict: false} ));