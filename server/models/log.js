// models/log.model.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  fileName: String,
  numberOfItems: Number,
  uploadedAt: Date,

});

module.exports = mongoose.model('log', logSchema);