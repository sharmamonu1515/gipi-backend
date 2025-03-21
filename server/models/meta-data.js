var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var metaDataSchema = new Schema({
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    createdBy: {type: ObjectId},
    updatedBy: {type: ObjectId},
});

metaDataSchema.statics.dateInfo = function()
{
    return new Date();
}
module.exports = mongoose.model('MetaData',metaDataSchema);