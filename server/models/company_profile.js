var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const shareholderSchema = new Schema({
    shareholders: {
      type: String,
      enum: ['promoter', 'public'],
    },
    year: {
      type: String,
    },
    financial_year: {
      type: String,
    },
    category: {
      type: String,
      enum: ['equity', 'preference'],
    },
    indian_held_no_of_shares: {
      type: Number,
      default: 0
    },
    indian_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    nri_held_no_of_shares: {
      type: Number,
      default: 0
    },
    nri_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    foreign_held_other_than_nri_no_of_shares: {
      type: Number,
      default: 0
    },
    foreign_held_other_than_nri_percentage_of_shares: {
      type: Number,
      default: null
    },
    central_government_held_no_of_shares: {
      type: Number,
      default: 0
    },
    central_government_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    state_government_held_no_of_shares: {
      type: Number,
      default: 0
    },
    state_government_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    government_company_held_no_shares: {
      type: Number,
      default: 0
    },
    government_company_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    insurance_company_held_no_of_shares: {
      type: Number,
      default: 0
    },
    insurance_company_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    bank_held_no_of_shares: {
      type: Number,
      default: 0
    },
    bank_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    financial_institutions_held_no_of_shares: {
      type: Number,
      default: 0
    },
    financial_institutions_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    financial_institutions_investors_held_no_of_shares: {
      type: Number,
      default: 0
    },
    financial_institutions_investors_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    mutual_funds_held_no_of_shares: {
      type: Number,
      default: 0
    },
    mutual_funds_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    venture_capital_held_no_of_shares: {
      type: Number,
      default: 0
    },
    venture_capital_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    body_corporate_held_no_of_shares: {
      type: Number,
      default: 0
    },
    body_corporate_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    others_held_no_of_shares: {
      type: Number,
      default: 0
    },
    others_held_percentage_of_shares: {
      type: Number,
      default: null
    },
    total_no_of_shares: {
      type: Number,
      default: 0
    },
    total_percentage_of_shares: {
      type: Number,
      default: 0
    }
  });

const descriptionSchema = new Schema({
    desc_thousand_char : { type: String },
})

const shareholdingSummarySchema = new Schema({
    year: { type: String },
    financial_year: { type: String},
    total_equity_shares: { type: Number, default: 0 },
    total_preference_shares: { type: Number, default: 0 },
    promoter: { type: Number, default: 0 },
    public: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    metadata: {
        doc_id: { type: String }
    }
});

const leiSchema = new Schema({
    number: { type: String },
    status: { type: String },
    registration_date: { type: Date },
    last_updated_date: { type: Date },
    next_renewal_date: { type: Date }
});

// Address Schema
const addressSchema = new Schema({
    full_address: { type: String },
    address_line1: { type: String },
    address_line2: { type: String, default: null },
    city: { type: String },
    pincode: { type: String },
    state: { type: String }
});

// Company Schema
const companySchema = new Schema({
    cin: { type: String, unique: true },
    legal_name: { type: String },
    reportNumber : {type : String},
    profitLoss : {type : String},
    sic : {type : String},
    subCategory : {type : String},
    balanceSheetDate : {type : String},
    industry : {type : String},
    correspondenceAddress : {type : String},
    efiling_status: { type: String },
    incorporation_date: { type: Date },
    paid_up_capital: { type: Number },
    sum_of_charges: { type: Number },
    authorized_capital: { type: Number },
    active_compliance: { type: String },
    cirp_status: { type: String, default: null },
    lei: leiSchema,
    registered_address: addressSchema,
    business_address: addressSchema,
    pan: { type: String },
    website: { type: String },
    classification: { type: String },
    status: { type: String },
    next_cin: { type: String, default: null },
    last_agm_date: { type: Date },
    last_filing_date: { type: Date },
    email: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const emailSchema = new Schema({
  emailId: { type: String },
  status: { type: String, default: null }
});

const phoneSchema = new Schema({
  phoneNumber: { type: String },
  status: { type: String, default: null }
});

const contactDetailsSchema = new Schema({
  email: [emailSchema],
  phone: [phoneSchema]
});

const operationalFormSchema = new Schema({
  taxPayer: { type: String, default: "" },
  customerNo: { type: String, default: "" },
  businessGroup: { type: String, default: "" },
  employeesLocation: { type: String, default: "" },
  customerTypes: { type: String, default: "" }, 
  otherEntities: { type: String, default: "" },
  employeeAcross : { type: String, default: "" },
  companyAuditor : { type: String, default: "" },
});

const mcaFilingSchema = new Schema({
  particulars: { type: String, required: true },
  data: { type: Map, of: String }
});

const llpSchema = new mongoose.Schema({
  llpin: { type: String, required: true, unique: true },
  legal_name: { type: String, required: true },
  efiling_status: String,
  cirp_status: { type: String, default: null },
  incorporation_date: Date,
  sum_of_charges: Number,
  total_obligation_of_contribution: Number,
  registered_address: addressSchema,
  total_contribution_received: Number,
  business_address: addressSchema,
  pan: String,
  website: { type: String, default: null },
  classification: String,
  last_financial_reporting_date: Date,
  last_annual_returns_filed_date: Date,
  email: { type: String, required: true },
  lei: leiSchema
});
  
const companyProfileSchema = new Schema({
    cin: { type: String, unique: true },
    pan : { type : String, unique : true},
    company_type : { type : String, default: "Company"},
    legal_name: { type: String, required: true, unique: true },
    company : companySchema,
    llp : llpSchema,
    description : { type: descriptionSchema },
    shareholdings: [shareholderSchema],
    shareholdings_summary: [shareholdingSummarySchema],
    holding_entities: { type: Schema.Types.Mixed },
    joint_ventures: { type: Schema.Types.Mixed },
    subsidiary_entities: { type: Schema.Types.Mixed },
    associate_entities: { type: Schema.Types.Mixed },
    contact_details: contactDetailsSchema,
    industry_segments : [
      {
          industry: { type: String },
          segments: [{ type: String }]
      }
    ],
    operational_form: operationalFormSchema,
    mca_filings: [mcaFilingSchema],
    isAllDataSaved : { type : Boolean, default : false},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companyProfileSchema);
