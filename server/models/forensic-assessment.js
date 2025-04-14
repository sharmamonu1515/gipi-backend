var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const riskCategorySchema = new Schema({
    category: { type: String },
    result: { 
        type: String, 
        enum: ['Match Found', 'No Match Found', 'Partial Match Found'],
        default: 'No Match Found'
    },
    tags: { type: String, default: '' },
    actions: { type: String, default: '' }
});

const forensicAssessmentSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },    
    riskCategories: [riskCategorySchema],
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ForensicAssessment', forensicAssessmentSchema);