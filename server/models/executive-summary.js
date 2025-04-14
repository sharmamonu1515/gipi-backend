var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const sustainabilityItemSchema = new Schema({
    parameter: { type: String },
    weight: { type: Number },
    score: { type: Schema.Types.Mixed }
});

const executiveSummarySchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },
    executiveSummaryForm: {
        riskBand: { type: String },
        aboutEntity: { type: String },
        managementAssessment: { type: String },
        operationalAssessment: { type: String },
        financialAssessment: { type: String },
        complianceAssessment: { type: String },
        commentsDisclaimer: { type: String }
    },
    sustainibilityBandScore: [sustainabilityItemSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

executiveSummarySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

executiveSummarySchema.statics.addExecutiveSummary = async function addExecutiveSummary(data) {
    try {
        let ExecutiveSummary = mongoose.model('ExecutiveSummary', executiveSummarySchema);
        let newExecutiveSummary = new ExecutiveSummary(data);
        let savedExecutiveSummary = await newExecutiveSummary.save();
        return savedExecutiveSummary;
    } catch (error) {
        throw new Error(error);
    }
};

executiveSummarySchema.statics.updateExecutiveSummary = async function updateExecutiveSummary(id, data) {
    try {
        let updatedExecutiveSummary = await this.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );
        return updatedExecutiveSummary;
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = mongoose.model('ExecutiveSummary', executiveSummarySchema);