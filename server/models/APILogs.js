const mongoose = require("mongoose");

const apiLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  apiType: { type: String, required: true },
  dateTime: { type: Date, default: Date.now },
  responseTime: { type: Number, required: true }, // Store response time in milliseconds
  additionalData: { type: Object, default: {} },
  mode: { type: String, required: true, default: 'test' },
  status: { type: String, required: true, default: 'success'},
});

module.exports = mongoose.model("api_logs", apiLogSchema);