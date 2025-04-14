const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const directorShareholdingSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true }, 
    year: { type: String },
    financial_year: { type: String },
    din_pan: { type: String },
    full_name: { type: String },
    designation: { type: String },
    date_of_cessation: { type: Date, default: null },
    no_of_shares: { type: Number, default: 0 },
    percentage_holding: { type: Number, default: 0 }
}, { timestamps: true }); 

module.exports = mongoose.model('DirectorShareholding', directorShareholdingSchema);
