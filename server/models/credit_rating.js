var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const creditRatingSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: "Company", index: true, required: true },
    rating_date: { type: Date },
    rating_agency: { type: String },
    rating: { type: String },
    type_of_loan: { type: String },
    currency: { type: String, default: "INR" },
    amount: { type: Number },
    rating_details: [{
        rating: { type: String },
        action: { type: String },
        outlook: { type: String, default: null },
        remarks: { type: String, default: null }
    }]
});

module.exports = mongoose.model('CreditRating', creditRatingSchema);