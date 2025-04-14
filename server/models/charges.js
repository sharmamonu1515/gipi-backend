var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const chargeSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    charge_id: { type: Number, unique: true },
    status: { type: String },
    date: { type: Date },
    amount: { type: Number },
    holder_name: { type: String },
    number_of_holder: { type: Number, default: null },
    property_type: { type: String, default: null },
    filing_date: { type: Date},
    property_particulars: { type: String, default: null }
});

module.exports = mongoose.model('Charge', chargeSchema);
