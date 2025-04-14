var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const assetsSchema = new Schema({
    tangible_assets: { type: Number },
    producing_properties: { type: Number },
    intangible_assets: { type: Number },
    preproducing_properties: { type: Number },
    tangible_assets_capital_work_in_progress: { type: Number },
    intangible_assets_under_development: { type: Number },
    noncurrent_investments: { type: Number },
    deferred_tax_assets_net: { type: Number },
    foreign_curr_monetary_item_trans_diff_asset_account: { type: Number },
    long_term_loans_and_advances: { type: Number },
    other_noncurrent_assets: { type: Number },
    current_investments: { type: Number },
    inventories: { type: Number },
    trade_receivables: { type: Number },
    cash_and_bank_balances: { type: Number },
    short_term_loans_and_advances: { type: Number },
    other_current_assets: { type: Number },
    given_assets_total: { type: Number }
});

const liabilitiesSchema = new Schema({
    share_capital: { type: Number },
    reserves_and_surplus: { type: Number },
    money_received_against_share_warrants: { type: Number },
    share_application_money_pending_allotment: { type: Number },
    deferred_government_grants: { type: Number },
    minority_interest: { type: Number },
    long_term_borrowings: { type: Number },
    deferred_tax_liabilities_net: { type: Number },
    foreign_curr_monetary_item_trans_diff_liability_account: { type: Number },
    other_long_term_liabilities: { type: Number },
    long_term_provisions: { type: Number },
    short_term_borrowings: { type: Number },
    trade_payables: { type: Number },
    other_current_liabilities: { type: Number },
    short_term_provisions: { type: Number },
    given_liabilities_total: { type: Number }
});

const balanceSheetSubTotalsSchema = new Schema({
    total_equity: { type: Number },
    total_non_current_liabilities: { type: Number },
    total_current_liabilities: { type: Number },
    net_fixed_assets: { type: Number },
    total_current_assets: { type: Number },
    capital_wip: { type: Number },
    total_debt: { type: Number },
    total_other_non_current_assets: { type: Number }
});

const balanceSheetNotesSchema = new Schema({
    gross_fixed_assets: { type: Number },
    trade_receivable_exceeding_six_months: { type: Number }
});

const pnlLineItemsSchema = new Schema({
    net_revenue: { type: Number },
    total_cost_of_materials_consumed: { type: Number },
    total_purchases_of_stock_in_trade: { type: Number },
    total_changes_in_inventories_or_finished_goods: { type: Number },
    total_employee_benefit_expense: { type: Number },
    total_other_expenses: { type: Number },
    operating_profit: { type: Number },
    other_income: { type: Number },
    depreciation: { type: Number },
    profit_before_interest_and_tax: { type: Number },
    interest: { type: Number },
    profit_before_tax_and_exceptional_items_before_tax: { type: Number },
    exceptional_items_before_tax: { type: Number },
    profit_before_tax: { type: Number },
    income_tax: { type: Number },
    profit_for_period_from_continuing_operations: { type: Number },
    profit_from_discontinuing_operation_after_tax: { type: Number },
    minority_interest_and_profit_from_associates_and_joint_ventures: { type: Number },
    profit_after_tax: { type: Number }
});

const revenueBreakupSchema = new Schema({
    revenue_from_operations: { type: Number },
    revenue_from_interest: { type: Number },
    revenue_from_other_financial_services: { type: Number },
    revenue_from_sale_of_products: { type: Number },
    revenue_from_sale_of_services: { type: Number },
    other_operating_revenues: { type: Number },
    excise_duty: { type: Number },
    service_tax_collected: { type: Number },
    other_duties_taxes_collected: { type: Number }
});

const auditorSchema = new Schema({
    auditor_name: { type: String },
    auditor_firm_name: { type: String },
    pan: { type: String },
    membership_number: { type: String },
    firm_registration_number: { type: String },
    address: { type: String }
});

const financialStatementSchema = new Schema({
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    year: { type: String },
    nature: { type: String },
    stated_on: { type: Date },
    filing_type: { type: String },
    filing_standard: { type: String },
    statement_of_assets_and_liabilities : {type : Schema.Types.Mixed},
    statement_of_income_and_expenditure : {type : Schema.Types.Mixed},
    certifiers : {
        type : { type : String },
        name : { type : String },
        id : { type : String },
        address : { type : String },
        firm_id : { type : String },
        firm_name: { type : String }
    },
    bs: {
        assets: assetsSchema,
        liabilities: liabilitiesSchema,
        subTotals: balanceSheetSubTotalsSchema,
        notes: balanceSheetNotesSchema,
        metadata: {
            doc_id: { type: String }
        }
    },
    pnl: {
        lineItems: pnlLineItemsSchema,
        subTotals: {
            total_operating_cost: { type: Number }
        },
        revenue_breakup: revenueBreakupSchema,
        depreciation_breakup: {
            depreciation: { type: Number },
            amortisation: { type: Number },
            depletion: { type: Number }
        },
        metadata: {
            docId: { type: String }
        }
    },
    cash_flow: {
        profit_before_tax: { type: Number },
        adjustment_for_finance_cost_and_depreciation: { type: Number },
        adjustment_for_current_and_non_current_assets: { type: Number },
        adjustment_for_current_and_non_current_liabilities: { type: Number },
        other_adjustments_in_operating_activities: { type: Number },
        cash_flows_from_used_in_operating_activities: { type: Number },
        cash_outflow_from_purchase_of_assets: { type: Number },
        cash_inflow_from_sale_of_assets: { type: Number },
        income_from_assets: { type: Number },
        other_adjustments_in_investing_activities: { type: Number },
        cash_flows_from_used_in_investing_activities: { type: Number },
        cash_outflow_from_repayment_of_capital_and_borrowings: { type: Number },
        cash_inflow_from_raisng_capital_and_borrowings: { type: Number },
        interest_and_dividends_paid: { type: Number },
        other_adjustments_in_financing_activities: { type: Number },
        cash_flows_from_used_in_financing_activities: { type: Number },
        incr_decr_in_cash_cash_equv_before_effect_of_excg_rate_changes: { type: Number },
        adjustments_to_cash_and_cash_equivalents: { type: Number },
        incr_decr_in_cash_cash_equv: { type: Number },
        cash_flow_statement_at_end_of_period: { type: Number }
    },
    pnl_key_schedule: {
        managerial_remuneration: { type: Number },
        payment_to_auditors: { type: Number },
        insurance_expenses: { type: Number },
        power_and_fuel: { type: Number }
    },
    auditor: auditorSchema,
    auditor_comments: {
        report_has_adverse_remarks: { type: Boolean, default: false },
        disclosures_auditor_report: [{ type: Schema.Types.Mixed }],
        disclosures_director_report: [{ type: Schema.Types.Mixed }]
    },    
    auditor_additional: { type: Schema.Types.Mixed },
    financial_highlights : [{ type: Schema.Types.Mixed }],
    financial_observations : { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

financialStatementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

financialStatementSchema.statics.addFinancialStatement = async function(data) {
    try {
        let FinancialStatement = mongoose.model('FinancialStatement', financialStatementSchema);
        let newStatement = new FinancialStatement(data);
        let savedStatement = await newStatement.save();
        return savedStatement;
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = mongoose.model('FinancialStatement', financialStatementSchema);