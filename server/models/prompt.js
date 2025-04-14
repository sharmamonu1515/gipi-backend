var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const promptSchema = new Schema({
    section: { type: String, required: true },
    prompt: { type: String, required: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    editedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    temperature: { type: Number, default: 0.7 },
    maxOutputTokens: { type: Number, default: 2000 },
    topP: { type: Number, default: 1 }, 
    topK: { type: Number, default: 20 }
});

module.exports = mongoose.model('Prompt', promptSchema);
