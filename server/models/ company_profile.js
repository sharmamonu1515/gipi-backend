var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var companySchema = new Schema({
    cin: { type: String, required: true, unique: true },
    legal_name: { type: String, required: true, unique: true },
    efiling_status: { type: String },
    incorporation_date: { type: Date },
    paid_up_capital: { type: Number },
    sum_of_charges: { type: Number },
    authorized_capital: { type: Number },
    active_compliance: { type: String },
    cirp_status: { type: String, default: null },
    lei: {
        number: { type: String },
        status: { type: String },
        registration_date: { type: Date },
        last_updated_date: { type: Date },
        next_renewal_date: { type: Date }
    }, 
    registered_address: {
        full_address: { type: String },
        address_line1: { type: String },
        address_line2: { type: String, default: null },
        city: { type: String },
        pincode: { type: String },
        state: { type: String }
    },
    business_address: {
        address_line1: { type: String },
        address_line2: { type: String, default: null },
        city: { type: String },
        pincode: { type: Number },
        state: { type: String }
    },
    pan: { type: String },
    website: { type: String },
    classification: { type: String },
    status: { type: String },
    next_cin: { type: String, default: null },
    last_agm_date: { type: Date },
    last_filing_date: { type: Date },
    description : { type: String},
    email: { type: String },
    createdAt: { type: Date, default: Date.now }
});

companySchema.statics.addCompany = async function addCompany(data) {
    try {
        let Company = mongoose.model('Company', companySchema);
        let newCompany = new Company(data);
        let savedCompany = await newCompany.save();
        return savedCompany;
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = mongoose.model('Company', companySchema);
