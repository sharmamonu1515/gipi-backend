const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const searchWebsitesSchema = new Schema(
    {
      name: { type: String, required: true },
      url: { type: String, required: true },
    },
    { timestamps: true }
);
  
module.exports = mongoose.model("SearchWebsites", searchWebsitesSchema);