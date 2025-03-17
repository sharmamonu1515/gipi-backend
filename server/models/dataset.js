const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const datasetSchema = new Schema({
  id: { type: String, required: true },
  schma: { type: String, required: true },
  name: { type: String, required: true },
  aliases: { type: String},
  birth_date: { type: String },
  countries: { type: String},
  addresses: { type: String },
  identifiers: { type: String},
  sanctions: { type: String },
  phones: { type: String },
  emails: { type: String },
  dataset: { type: String },
  first_seen: { type: String },
  last_seen: { type: String },
  last_change: { type: String },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('dataset', datasetSchema);