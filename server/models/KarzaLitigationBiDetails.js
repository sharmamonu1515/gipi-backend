const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const litigationBiDetailSchema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { strict: false }
);

module.exports = mongoose.model("litigation_bi_detail", litigationBiDetailSchema);
