const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emplianceCheckDateSchema = new Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    createdBy: mongoose.Schema.Types.ObjectId,
    updatedBy: mongoose.Schema.Types.ObjectId,
    emplianceCheckDate: Object
})

module.exports = mongoose.model('emp_check_date', emplianceCheckDateSchema);