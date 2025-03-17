const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');

const companyInGenInfSchema = new mongoose.Schema({
        image_path: {
            type: String,
            default: ''
        },
        updatedDate: Date,
        mca_status: String,
        company_category: String,
        company_sub_category: String,
        date_of_incorporation: Date,
        state: String,
        authorized_cap: String,
        paid_up_capital: String,
        industrial_class: String,
        principal_business_activity: String,
        registered_office_address: String,
        registrar_of_company: String,
        email_id: String,
        latest_year_annual_return: String,
        latest_year_financial_statement: String,
        vendor_type: mongoose.Schema.Types.ObjectId,
        transaction_currency: mongoose.Schema.Types.ObjectId,
        company_id: mongoose.Schema.Types.ObjectId,
        fiscal_year: String,
        createdDate: Date,
        vendor_type: String,
        transaction_currency: String
});

companyInGenInfSchema.statics.addInCompanyGenInf = async function addInCompanyGenInf (data) {
    try {

        let Company = mongoose.model('IN_Company', companyInGenInfSchema);
        let newCompany = new Company(data);

        let savedCompany = await newCompany.save();
        return savedCompany._id;

    } catch (error) {
        throw new Error(error);
    }
}

module.exports = mongoose.model('in_companies_gen_inf', companyInGenInfSchema);