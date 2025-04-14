var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const networkCompanySchema = new Schema({
    cin: { type: String },
    legal_name: { type: String },
    company_status: { type: String },
    incorporation_date: { type: Date },
    paid_up_capital: { type: Number },
    sum_of_charges: { type: Number },
    city: { type: String },
    active_compliance: { type: String },
    cirp_status: { type: String },
    designation: { type: String },
    date_of_appointment: { type: Date },
    date_of_appointment_for_current_designation: { type: Date },
    date_of_cessation: { type: Date }
});

const networkLLPSchema = new Schema({
    llpin: { type: String },
    legal_name: { type: String },
    status: { type: String },
    incorporation_date: { type: Date },
    total_obligation_of_contribution: { type: Number },
    sum_of_charges: { type: Number },
    city: { type: String },
    cirp_status: { type: String },
    designation: { type: String },
    date_of_appointment: { type: Date },
    date_of_appointment_for_current_designation: { type: Date },
    date_of_cessation: { type: Date }
});

const networkSchema = new Schema({
    companies: [networkCompanySchema],
    llps: [networkLLPSchema]
});

const directorNetworkSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: 'Company' },
    name: { type: String },
    pan: { type: String },
    din: { type: String },
    network: networkSchema,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

directorNetworkSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

directorNetworkSchema.statics.addDirectorNetwork = async function addDirectorNetwork(data) {
    try {
        let DirectorNetwork = mongoose.model('DirectorNetwork', directorNetworkSchema);
        let newNetwork = new DirectorNetwork(data);
        let savedNetwork = await newNetwork.save();
        return savedNetwork;
    } catch (error) {
        throw new Error(error);
    }
};

directorNetworkSchema.methods.addCompanyToNetwork = async function(companyData) {
    this.network.companies.push(companyData);
    return await this.save();
};

directorNetworkSchema.methods.addLLPToNetwork = async function(llpData) {
    this.network.llps.push(llpData);
    return await this.save();
};

module.exports = mongoose.model('DirectorNetwork', directorNetworkSchema);