const mongoose = require('mongoose');

const staticListSchema = new mongoose.Schema({
    name: String,
    type: Number,
    position: Number
});

module.exports = mongoose.model('static_lists', staticListSchema);