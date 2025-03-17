var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var gstByPanSchema = new Schema({

    panNumber: {
        type: String,
        required: true
    },
    gstNumbers:[{
        gstin: String,
        authStatus: String,
        stateCd: String,
        firstTabValue: Object,
        secondTabValue: Object,
        gstFilingDetails: Object,
        gstLiabilityDetails: Object,
        additionalAddressDetails: Object,
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

gstByPanSchema.statics.addAllGstDetailsByPan = async function addAllGstDetailsByPan(data) {
    try {

        let GstByPan = mongoose.model(`gst_by_pan`, gstByPanSchema);
        let newGstByPan = new GstByPan(data);

        let savedGstByPan = await newGstByPan.save();
        return savedGstByPan;

    } catch (error) {
        throw new Error(error);
    }
}
module.exports = mongoose.model('gst_by_pan',gstByPanSchema);