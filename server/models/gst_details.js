var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const filingSchema = new Schema({
    return_type: { type: String},
    date_of_filing: { type: Date },
    financial_year: { type: String },
    tax_period: { type: String },
    status: { type: String }
});

const gstDetailsSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: 'Company' },
    gstin: { type: String},
    status: { type: String},
    company_name: { type: String },
    trade_name: { type: String },
    state: { type: String },
    state_jurisdiction: { type: String },
    centre_jurisdiction: { type: String },
    date_of_registration: { type: Date },
    taxpayer_type: { type: String},
    nature_of_business_activities: { type: String },
    filings: [filingSchema],
    createdAt: { type: Date, default: Date.now }
});

gstDetailsSchema.statics.addGSTDetails = async function addGSTDetails(data) {
    try {
        let GSTDetails = mongoose.model('GSTDetails', gstDetailsSchema);
        let newGSTDetails = new GSTDetails(data);
        let savedGSTDetails = await newGSTDetails.save();
        return savedGSTDetails;
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = mongoose.model('GSTDetails', gstDetailsSchema);