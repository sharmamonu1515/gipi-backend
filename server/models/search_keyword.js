const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const KeywordSchema = new Schema(
    {
      value: { type: String, required: true },
      label: { type: String, required: true },
    },
    { timestamps: true }
  );
  
module.exports = mongoose.model("SearchKeyword", KeywordSchema);