var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const addressSchema = new Schema({
    address_line1: { type: String },
    address_line2: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String }
});

const associationHistorySchema = new Schema({
    company_name: { type: String },
    cin: { type: String },
    role: { type: String },
    appointment_date: { type: Date },
    cessation_date: { type: Date },
    designation_after_event : { type: String },
    event : { type: String },
    event_date : { type: String },
    filing_date : { type: String }
});

const authorizedSignatorySchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    pan: { type: String },
    din: { type: String },
    name: { type: String },
    designation: { type: String },
    din_status: { type: String },
    gender: { type: String },
    date_of_birth: { type: Date },
    age: { type: Number },
    date_of_appointment: { type: Date },
    date_of_appointment_for_current_designation: { type: Date },
    date_of_cessation: { type: Date },
    nationality: { type: String },
    dsc_status: { type: String },
    dsc_expiry_date: { type: Date },
    father_name: { type: String },
    address: addressSchema,
    association_history: [associationHistorySchema],
    createdAt: { type: Date, default: Date.now }
});

authorizedSignatorySchema.statics.addAuthorizedSignatory = async function addAuthorizedSignatory(data) {
    try {
        let AuthorizedSignatory = mongoose.model('AuthorizedSignatory', authorizedSignatorySchema);
        let newSignatory = new AuthorizedSignatory(data);
        let savedSignatory = await newSignatory.save();
        return savedSignatory;
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = mongoose.model('AuthorizedSignatory', authorizedSignatorySchema);