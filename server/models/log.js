// models/log.model.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  fileName: String,
  numberOfItems: Number,
  uploadedAt: Date,

});

// Prevent OverwriteModelError
module.exports = mongoose.models.log || mongoose.model('log', logSchema);