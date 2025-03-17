const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = require('../config');

const ofacSchema = new Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    searchType: {
        type: String,
        default: config.searchType
    },
    uniqueFileName: {
        type: String,
        default: config.uniqueName
    }
}, { strict: false })

module.exports = mongoose.model('ofac_record', ofacSchema);