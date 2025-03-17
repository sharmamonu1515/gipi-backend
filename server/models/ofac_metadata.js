const mongoose = require('mongoose');

const ofacMetaDataSchema = new mongoose.Schema({
    sno: String,
    keyword: String,
    sourceFullName: String,
    authorityCountry: String,
    type: String,
    explanation: String,
    sourceLink: [String]
});

ofacMetaDataSchema.statics.addMetaData = async function addMetaData (data) {
    try {
        
        let MetaData = mongoose.model('ofac_meta_data', ofacMetaDataSchema);
        let newMetaData = new MetaData(data);

        await newMetaData.save();
        return true;

    } catch (error) {
        throw error;
    }
}

module.exports = mongoose.model('ofac_meta_data', ofacMetaDataSchema);