const mongoose = require('mongoose');
const sanitize = require('mongo-sanitize');

const allCompanySchema = new mongoose.Schema({
    cin: String,
    country: String,
    name: {
        type: String,
        uppercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    status: mongoose.Schema.Types.ObjectId,
    legal_structure: mongoose.Schema.Types.ObjectId,
    type: String,
    previousType: String,
    generalInfo: {
        image_path: {
            type: String,
            default: 'default/assets/img/compay-default-clip-art.png'
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
        latest_year_annual_return: Date,
        latest_year_financial_statement: Date,
        fiscal_year: String,
        createdDate: Date,
        vendor_type: mongoose.Schema.Types.ObjectId,
        transaction_currency: mongoose.Schema.Types.ObjectId,
        trade_style: {
            type: String,
            default: ''
        },
        website: {
            type: String,
            default: ''
        },
        parent_company_name: {
            type: String,
            default: ''
        },
        country_origin_parent: {
            type: String,
            default: ''
        },
        transaction_currency_other: {
            type: String,
            default: ''
        },
        registrar_status: {
            type: String,
            default: ''
        },
        no_of_signatories: {
            type: String,
            default: ''
        },
        balance_sheet_date: {
            type: String,
            default: ''
        },
        profit_after_tax: {
            type: String,
            default: ''
        },
        open_charges: {
            type: String,
            default: ''
        },
        age_incorporate_date: {
            type: Date,
            default: ''
        },
        registrationNumber: String,
        numOfMembersWithoutShareCapital: String,
        whetherListedOrNot: String,
        dateOfLastAgm: String,
        llpDetails: {
            numOfPartners: String,
            numOfDesignatedPartners: String,
            obligationContribution: String,
            businessActivityInIndia: String,
            mainDivisionDescription: String,
            dateOfLastFinancialYearAccountsForSolvencyFiled: String,
            dateOfLastFinancialYearAccountsForAnnualReturnFiled: String,
        }
    }

});

allCompanySchema.statics.addInCompany = async function addInCompany(data) {
    try {

        // let name = sanitize(data.name);
        // let foundCompany = await this.findOne({
        //     $and: [
        //         {type: data.type},
        //         {$or: [
        //             {name: name},
        //             {cin: data.cin}
        //         ]}
        //     ]
        // });


        // if(foundCompany)
        // throw new Error('Company Already Registered');

        let Company = mongoose.model(`previous_data`, allCompanySchema);
        let newCompany = new Company(data);

        let savedCompany = await newCompany.save();
        return savedCompany;

    } catch (error) {
        throw new Error(error);
    }
}

module.exports = mongoose.model('previous_data', allCompanySchema);