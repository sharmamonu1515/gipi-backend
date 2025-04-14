var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const establishmentSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    establishment_id: { type: String, unique: true },
    address: { type: String },
    city: { type: String },
    latest_date_of_credit: { type: Date },
    date_of_setup: { type: Date },
    establishment_name: { type: String },
    exemption_status_edli: { type: String },
    exemption_status_pension: { type: String },
    exemption_status_pf: { type: String },
    no_of_employees: { type: Number },
    principal_business_activities: { type: String },
    amount: { type: Number },
    latest_wage_month: { type: String },
    working_status: { type: String },

    filing_details: [
        {
            trrn: { type: String },
            wage_month: { type: String },
            date_of_credit: { type: Date },
            no_of_employees: { type: Number },
            amount: { type: Number }
        }
    ]
});

module.exports = mongoose.model('Establishment', establishmentSchema);
