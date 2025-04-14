const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompanyLogSchema = new Schema(
    {
      user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      company_id: { type: Schema.Types.ObjectId, ref: 'Company'},
      cinOrPan: { type: String},
      first_searched_at: { type: Date, default: Date.now },
      last_searched_at: { type: Date, default: Date.now },
      search_count: { type: Number, default: 1 },
      company_type: { type: String },
      search_type: { type: String },
      company_name: { type: String },
    },
    { timestamps: true }
);

CompanyLogSchema.index({ user_id: 1, cinOrPan: 1 }, { unique: true });

module.exports = mongoose.model("CompanyLog", CompanyLogSchema);
