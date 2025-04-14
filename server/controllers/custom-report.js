const Company = require("../models/company_profile");
const ApiUtility = require('../../lib/api-utility');
const authorizedSignatory = require('../models/authorized_signatory');
const directorsNetwork = require('../models/directors_network');
const GSTDetails = require('../models/gst_details');
const FinancialStatement = require('../models/financials');
const executiveSummary = require("../models/executive-summary");
const forensicAssessment = require("../models/forensic-assessment");
const axios = require('axios');
const reportLog = require('../models/report_log');
const charges = require('../models/charges');
const creditRating = require('../models/credit_rating');
const directorShareholding = require('../models/director_shareholdings');
const establishments = require('../models/establishments');

const companyController = module.exports;

companyController.addCompany = async function addCompany(req, res) {
    try {
        const companyData = req.body;

        const newCompany = await Company.create(companyData);

        return res.send(ApiUtility.success(newCompany, "Company added successfully."));
    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
};

companyController.addAuthorizedSignatories = async function addAuthorizedSignatories(req, res) {
    try {
        const signatoryData = req.body;

        if (!Array.isArray(signatoryData) || signatoryData.length === 0) {
            return res.send(ApiUtility.failed("Invalid input. Please provide an array of authorized signatories."));
        }

        const savedSignatories = await authorizedSignatory.insertMany(signatoryData);

        return res.send(ApiUtility.success(savedSignatories, "Authorized signatories added successfully."));
    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
};

companyController.addDirectorNetworks = async function addDirectorNetworks(req, res) {
    try {
        const directorNetworks = req.body;

        if (!Array.isArray(directorNetworks) || directorNetworks.length === 0) {
            return res.send(ApiUtility.failed("Invalid input. Please provide an array of director networks."));
        }

        const savedNetworks = await directorsNetwork.insertMany(directorNetworks);

        return res.send(ApiUtility.success(savedNetworks, "Director networks added successfully."));
    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
};

companyController.addCompanyToNetwork = async function addCompanyToNetwork(req, res) {
    try {
        const { directorNetworkId, companyData } = req.body;

        let directorNetwork = await directorsNetwork.findById(directorNetworkId);
        if (!directorNetwork) {
            return res.send(ApiUtility.failed("Director's Network not found."));
        }

        await directorNetwork.addCompanyToNetwork(companyData);
        return res.send(ApiUtility.success(directorNetwork, "Company added to network successfully."));
    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
};

companyController.addLLPToNetwork = async function addLLPToNetwork(req, res) {
    try {
        const { directorNetworkId, llpData } = req.body;

        let directorNetwork = await directorsNetwork.findById(directorNetworkId);
        if (!directorNetwork) {
            return res.send(ApiUtility.failed("Director's Network not found."));
        }

        await directorNetwork.addLLPToNetwork(llpData);
        return res.send(ApiUtility.success(directorNetwork, "LLP added to network successfully."));
    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
};


companyController.addGSTDetails = async function addGSTDetails(req, res) {
    try {
        const gstData = req.body;

        if (!Array.isArray(gstData) || gstData.length === 0) {
            return res.send(ApiUtility.failed("Invalid input. Please provide an array of GST details."));
        }

        const savedGSTDetails = await GSTDetails.insertMany(gstData);

        return res.send(ApiUtility.success(savedGSTDetails, "GST details added successfully."));
    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
};

companyController.addFinancialStatement = async function addFinancialStatement(req, res) {
    try {
        const financialData = req.body;
        const newStatement = await FinancialStatement.addFinancialStatement(financialData);
        return res.send(ApiUtility.success(newStatement, "Financial detail added successfully."));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

companyController.addFinancialStatementsBulk = async function addFinancialStatementsBulk(req, res) {
    try {
        const financialStatements = req.body;
        if (!Array.isArray(financialStatements) || financialStatements.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid data format or empty array' });
        }

        const savedStatements = await FinancialStatement.insertMany(financialStatements);
        return res.send(ApiUtility.success(savedStatements, "Financial details added successfully."));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

companyController.addExecutiveSummary = async function addExecutiveSummary(req, res) {
    try {
        const executiveSummaryData = req.body;

        const updatedOrCreatedSummary = await executiveSummary.findOneAndUpdate(
            { company_id: executiveSummaryData.company_id },
            { $set: executiveSummaryData },
            { new: true, upsert: true, runValidators: true }
        );

        return res.send(ApiUtility.success(updatedOrCreatedSummary, "Executive summary upserted successfully."));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

companyController.addOrUpdateForensicAssessment = async function (req, res) {
    try {
        const forensicAssessmentData = req.body;

        const updatedOrCreatedAssessment = await forensicAssessment.findOneAndUpdate(
            { company_id: forensicAssessmentData.company_id },
            { $set: forensicAssessmentData },
            { new: true, upsert: true, runValidators: true }
        );

        return res.send(ApiUtility.success(updatedOrCreatedAssessment, "Forensic assessment upserted successfully."));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


companyController.getForensicAssessment = async function getForensicAssessment(req, res) {
    try {
        const { companyId } = req.query;
        const assessment = await forensicAssessment.findOne({ company_id: companyId });
        return res.send(ApiUtility.success(assessment, "Forensic assessment fetched successfully."));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

companyController.getExecutiveSummary = async function getExecutiveSummary(req, res) {
    try {
        const { companyId } = req.query;
        const summary = await executiveSummary.findOne({ company_id: companyId });
        return res.send(ApiUtility.success(summary, "Executive summary fetched successfully."));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

companyController.addCompanyLog = async function (req, res) {
    try {
        const { cinOrPan, company_type, search_type } = req.body;
        const user_id = req.user.id;

        let existingCompany = await Company.findOne({
            $or: [{ cin: cinOrPan }, { pan: cinOrPan }]
        });

        if (existingCompany) {
            const existingLog = await reportLog.findOne({user_id, company_id: existingCompany._id});
            if (existingLog) {
                return res.status(400).json(ApiUtility.failed(`Company ${existingLog.company_name} already exists.`));
            }

            if (existingCompany.isAllDataSaved) {
                await reportLog.findOneAndUpdate(
                    { user_id, company_id: existingCompany._id },
                    {
                        $set: {
                            company_type,
                            search_type,
                            last_searched_at: new Date(),
                            cinOrPan,
                            company_name: existingCompany.company_name || existingCompany.legal_name
                        },
                        $inc: { search_count: 1 },
                        $setOnInsert: { first_searched_at: new Date(), isAllDataSaved: true }
                    },
                    { new: true, upsert: true }
                );

                return res.status(200).json(ApiUtility.success({existingCompany, isExisting : true}, `Company ${existingCompany.company_name || existingCompany.legal_name} Added Successfully`));
            } else {
                await cleanupIncompleteData(existingCompany._id);
            }
        }

        const apiUrl = `https://api.probe42.in/probe_pro/${company_type === "llps" ? "llps" : "companies"}/${cinOrPan}/comprehensive-details?identifier_type=${search_type}`;
        const apiKey = process.env.PROB_API_KEY;

        const headers = {
            'accept': 'application/json',
            'x-api-version': '1.3',
            'x-api-key': apiKey
        };

        const response = await axios.get(apiUrl, { headers });
        const companyData = response.data.data;
        
        if (!companyData) {
            return res.status(404).json(ApiUtility.failed("Company data not found"));
        }

        const company = saveData(companyData, user_id, company_type);

        await reportLog.create({
            user_id,
            company_type,
            search_type,
            first_searched_at: new Date(),
            last_searched_at: new Date(),
            search_count: 1,
            cinOrPan,
        });
        
        const successMessage = existingCompany 
            ? `Company ${company.company_name || company.legal_name} Data Updated Successfully`
            : `Company ${company.company_name || company.legal_name} Added Successfully`;
            
        return res.status(200).json(ApiUtility.success({company, isExisting : false}, successMessage));
        
    } catch (error) {
        const errorMessage = error.response && error.response.data && error.response.data.message
        console.error("Error in addCompanyLog:", error);
        return res.status(500).json(ApiUtility.failed(errorMessage || "An Error occurred, Please try again..."));
    }
};

companyController.getUserCompanyLogs = async function getUserCompanyLogs(req, res) {
    try {
        const user_id = req.user.id;
        let { page, limit } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        const skip = (page - 1) * limit;

        const logs = await reportLog.find({ user_id })
            .populate({
                path: 'company_id',
                select: 'name isAllDataSaved',
                match: { isAllDataSaved: true }
            })
            .sort({ last_searched_at: -1 })
            .skip(skip)
            .limit(limit);

        const filteredLogs = logs.filter(log => log.company_id);

        const totalLogs = filteredLogs.length;

        return res.send(ApiUtility.success(
            {
                logs: filteredLogs,
                pagination: {
                    total: totalLogs,
                    page,
                    limit,
                    totalPages: Math.ceil(totalLogs / limit)
                }
            },
            "Company search logs retrieved successfully."
        ));
    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
};


companyController.updateFinancialData = async function updateFinancialData(req, res) {
    try {
        const { companyId, financialData } = req.body;

        if (!companyId || !financialData) {
            return res.status(400).json(ApiUtility.failed("Missing required fields: companyId, financialData, and yearsToUpdate array"));
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json(ApiUtility.failed("Company not found."));
        }

        const updateResults = await updateFinancialStatementsForYears(companyId, financialData);

        return res.send(ApiUtility.success(
            updateResults.results,
            `Financial data updated successfully for ${updateResults.results.filter(r => r.status === 'success').length} years.`
        ));
    } catch (error) {
        return res.status(500).json(ApiUtility.failed(error.message));
    }
};

companyController.updateCompanyProfileData = async function(req, res) {
    try {
        const { companyId, mcaFiling, operationalForm, companyForm } = req.body;

        if (!companyId || !companyForm) {
            return res.status(400).json(ApiUtility.failed("Missing required fields: companyId or companyForm"));
        }

        const company = await Company.findById(companyId).lean().exec();
        if (!company) {
            return res.status(404).json(ApiUtility.failed("Company not found."));
        }

        const updateData = {
            company: {
                ...company.company,
                ...(companyForm && {
                    reportNumber: companyForm.reportNo,
                    profitLoss: companyForm.profitLoss,
                    sic: companyForm.sic,
                    subCategory: companyForm.subCategory,
                    balanceSheetDate: companyForm.balanceSheetDate,
                    industry: companyForm.industry,
                    correspondenceAddress : companyForm.correspondenceAddress
                })
            },
            operational_form: {
                ...(operationalForm || {})
            },
            mca_filings: [
                ...(mcaFiling || [])
            ]
        };

        const updatedCompany = await Company.findByIdAndUpdate(companyId, { $set: updateData }, { new: true });

        return res.status(200).json(ApiUtility.success(updatedCompany, "Company profile updated successfully."));
    } catch (error) {
        return res.status(500).json(ApiUtility.failed(error.message));
    }
};

async function cleanupIncompleteData(companyId) {
    try {
        await Promise.all([
            charges.deleteMany({ company_id: companyId }),
            creditRating.deleteMany({ company_id: companyId }),
            authorizedSignatory.deleteMany({ company_id: companyId }),
            directorsNetwork.deleteMany({ company_id: companyId }),
            directorShareholding.deleteMany({ company_id: companyId }),
            establishments.deleteMany({ company_id: companyId }),
            FinancialStatement.deleteMany({ company_id: companyId }),
            GSTDetails.deleteMany({ company_id: companyId }),
            reportLog.deleteMany({ company_id: companyId }),
        ]);
        
        await Company.findByIdAndDelete(companyId);
    } catch (err) {
        console.error("Error cleaning up incomplete data:", err);
        throw err;
    }
}

async function saveData(companyData, user_id, company_type) {
    try {
        const companyProfile = companyData.company || companyData.llp;
        const companyDetails = {
            cin: companyProfile.cin || companyProfile.llpin,
            pan: companyProfile.pan,
            company_type,
            legal_name: companyProfile.legal_name,
            llp : companyData.llp && companyData.llp,
            company : {
                cin: companyProfile.cin || companyProfile.llp,
                legal_name: companyProfile.legal_name,
                efiling_status: companyProfile.efiling_status,
                incorporation_date: companyProfile.incorporation_date,
                paid_up_capital: companyProfile.paid_up_capital,
                sum_of_charges: companyProfile.sum_of_charges,
                authorized_capital: companyProfile.authorized_capital,
                active_compliance: companyProfile.active_compliance,
                cirp_status: companyProfile.cirp_status,
                lei: companyProfile.lei,
                registered_address: companyProfile.registered_address,
                business_address: companyProfile.business_address,
                pan: companyProfile.pan,
                website: companyProfile.website,
                classification: companyProfile.classification,
                status: companyProfile.status,
                next_cin: companyProfile.next_cin,
                last_agm_date: companyProfile.last_agm_date,
                last_filing_date: companyProfile.last_filing_date,
                email: companyProfile.email
            },
            description: companyData.description,
            contact_details: companyData.contact_details,
            shareholdings : companyData.shareholdings,
            shareholdings_summary : companyData.shareholdings_summary,
            holding_entities : companyData.holding_entities,
            joint_ventures : companyData.joint_ventures,
            subsidiary_entities : companyData.subsidiary_entities,
            associate_entities : companyData.associate_entities,
            industry_segments : companyData.industry_segments,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const company = await Company.findOneAndUpdate(
            { cin: companyDetails.cin },
            { $set: companyDetails },
            { upsert: true, new: true }
        );

        if (companyData.charge_sequence && companyData.charge_sequence.length > 0) {
            for (const charge of companyData.charge_sequence) {
                const existingCharge = await charges.findOne({
                    company_id: company._id,
                    charge_id: charge.charge_id,
                    date: charge.date,
                    filing_date: charge.filing_date,
                    status : charge.status
                });

                if (!existingCharge) {
                    const chargeData = {
                        company_id: company._id,
                        charge_id: charge.charge_id,
                        status: charge.status,
                        date: charge.date,
                        amount: charge.amount,
                        holder_name: charge.holder_name,
                        number_of_holder: charge.number_of_holder,
                        property_type: charge.property_type,
                        filing_date: charge.filing_date,
                        property_particulars: charge.property_particulars,
                        createdAt: new Date()
                    };

                    await charges.create(chargeData);
                } else {
                    await charges.findByIdAndUpdate(
                        existingCharge._id,
                        {
                            $set: {
                                status: charge.status,
                                date: charge.date,
                                amount: charge.amount,
                                holder_name: charge.holder_name,
                                number_of_holder: charge.number_of_holder,
                                property_type: charge.property_type,
                                filing_date: charge.filing_date,
                                property_particulars: charge.property_particulars
                            }
                        }
                    );
                }
            }
        }

        if(companyData.credit_ratings && companyData.credit_ratings.length > 0) {
            for (const rating of companyData.credit_ratings) {
                const existingRating = await creditRating.findOne({
                    company_id: company._id,
                    rating_agency: rating.rating_agency,
                    rating_date : rating.rating_date,
                    rating : rating.rating,
                    amount : rating.amount
                });

                if (!existingRating) {
                    const ratingData = {
                        company_id: company._id,
                        rating_date: rating.rating_date,
                        rating_agency: rating.rating_agency,
                        rating: rating.rating,
                        type_of_loan: rating.type_of_loan,
                        currency: rating.currency,
                        amount: rating.amount,
                        rating_details: rating.rating_details || []
                    };

                    await creditRating.create(ratingData);
                }
            }
        }

        if (companyData.authorized_signatories && companyData.authorized_signatories.length > 0) {

            for (const signatory of companyData.authorized_signatories) {
                const existingSignatory = await authorizedSignatory.findOne({
                    company_id: company._id,
                    pan: signatory.pan,
                });

                if (!existingSignatory) {
                    const signatoryData = {
                        company_id: company._id,
                        pan: signatory.pan,
                        din: signatory.din,
                        name: signatory.name,
                        designation: signatory.designation,
                        din_status: signatory.din_status,
                        gender: signatory.gender,
                        date_of_birth: signatory.date_of_birth,
                        age: signatory.age,
                        date_of_appointment: signatory.date_of_appointment,
                        date_of_appointment_for_current_designation: signatory.date_of_appointment_for_current_designation,
                        date_of_cessation: signatory.date_of_cessation,
                        nationality: signatory.nationality,
                        dsc_status: signatory.dsc_status,
                        dsc_expiry_date: signatory.dsc_expiry_date,
                        father_name: signatory.father_name,
                        address: signatory.address,
                        association_history: signatory.association_history || []
                    };

                    await authorizedSignatory.create(signatoryData);
                } else {
                    await authorizedSignatory.findByIdAndUpdate(
                        existingSignatory._id,
                        {
                            $set: {
                                designation: signatory.designation,
                                din_status: signatory.din_status,
                                date_of_appointment: signatory.date_of_appointment,
                                date_of_appointment_for_current_designation: signatory.date_of_appointment_for_current_designation,
                                date_of_cessation: signatory.date_of_cessation,
                                dsc_status: signatory.dsc_status,
                                dsc_expiry_date: signatory.dsc_expiry_date,
                            }
                        }
                    );
                }
            }
        }

        if (companyData.director_network && companyData.director_network.length > 0) {
            for (const director of companyData.director_network) {
                if (director.network) {
                    const existingNetwork = await directorsNetwork.findOne({
                        company_id: company._id,
                        $or: [
                            { pan: director.pan }, 
                            { din: director.din }
                        ]
                    });

                    if (!existingNetwork) {
                        const networkData = {
                            company_id: company._id,
                            name: director.name,
                            pan: director.pan,
                            din: director.din,
                            network: {
                                companies: director.network.companies || [],
                                llps: director.network.llps || []
                            }
                        };

                        await directorsNetwork.create(networkData);
                    } else {
                        if (director.network.companies && director.network.companies.length > 0) {
                            for (const networkCompany of director.network.companies) {
                                const companyExists = existingNetwork.network.companies.some(
                                    c => c.cin === networkCompany.cin
                                );

                                if (!companyExists) {
                                    await existingNetwork.addCompanyToNetwork(networkCompany);
                                }
                            }
                        }

                        if (director.network.llps && director.network.llps.length > 0) {
                            for (const networkLLP of director.network.llps) {
                                const llpExists = existingNetwork.network.llps.some(
                                    l => l.llpin === networkLLP.llpin
                                );

                                if (!llpExists) {
                                    await existingNetwork.addLLPToNetwork(networkLLP);
                                }
                            }
                        }
                    }
                }
            }
        }

        if(companyData.director_shareholdings && companyData.director_shareholdings.length > 0) {
            for (const shareholding of companyData.director_shareholdings) {
                const existingShareholding = await directorShareholding.findOne({
                    company_cin: company._id,
                    year: shareholding.year,
                    financial_year: shareholding.financial_year
                });

                if (!existingShareholding) {
                    const shareholdingData = {
                        company_id: company._id,
                        year: shareholding.year,
                        financial_year: shareholding.financial_year,
                        din_pan: shareholding.din_pan,
                        full_name: shareholding.full_name,
                        designation: shareholding.designation,
                        date_of_cessation: shareholding.date_of_cessation,
                        no_of_shares: shareholding.no_of_shares,
                        percentage_holding: shareholding.percentage_holding
                    };

                    await directorShareholding.create(shareholdingData);
                }
            }
        }

        if (companyData.establishments_registered_with_epfo && companyData.establishments_registered_with_epfo.length > 0) {
            for (const establishment of companyData.establishments_registered_with_epfo) {
                const existingEstablishment = await establishments.findOne({
                    company_id: company._id,
                    establishment_id: establishment.establishment_id
                });

                if (!existingEstablishment) {
                    const establishmentData = {
                        company_id: company._id,
                        establishment_id: establishment.establishment_id,
                        address: establishment.address,
                        city: establishment.city,
                        latest_date_of_credit: establishment.latest_date_of_credit,
                        date_of_setup: establishment.date_of_setup,
                        establishment_name: establishment.establishment_name,
                        exemption_status_edli: establishment.exemption_status_edli,
                        exemption_status_pension: establishment.exemption_status_pension,
                        exemption_status_pf: establishment.exemption_status_pf,
                        no_of_employees: establishment.no_of_employees,
                        principal_business_activities: establishment.principal_business_activities,
                        amount: establishment.amount,
                        latest_wage_month: establishment.latest_wage_month,
                        working_status: establishment.working_status,
                        filing_details: (establishment.filing_details || []).slice(0, 10)
                    };

                    await establishments.create(establishmentData);
                }
            }
        }

        if (companyData.financials && companyData.financials.length > 0) {
            if (!company || !company._id) {
                throw new Error("Company ID is missing.");
            }

            const createPromises = companyData.financials.map(async (statement) => {
                if (!statement.year) return;

                const existingStatement = await FinancialStatement.findOne({
                    company_id: company._id,
                    year: statement.year,
                    nature: statement.nature
                });

                if (!existingStatement) {
                    const pnl = (statement && statement.pnl) || {};

                    const financialData = {
                        company_id: company._id,
                        year: statement.year,
                        nature: statement.nature,
                        stated_on: statement.stated_on ? new Date(statement.stated_on) : null,
                        filing_type: statement.filing_type || "",
                        filing_standard: statement.filing_standard || "",
                        statement_of_assets_and_liabilities : statement.statement_of_assets_and_liabilities,
                        statement_of_income_and_expenditure : statement.statement_of_income_and_expenditure,
                        certifiers : statement.certifiers,
                        bs: {
                            assets: statement.bs && statement.bs.assets ? statement.bs.assets : {},
                            liabilities: statement.bs && statement.bs.liabilities ? statement.bs.liabilities : {},
                            subTotals: statement.bs && statement.bs.subTotals ? statement.bs.subTotals : {},
                            notes: statement.bs && statement.bs.notes ? statement.bs.notes : {},
                            metadata: statement.bs && statement.bs.metadata ? statement.bs.metadata : {}
                        },
                        pnl: {
                            lineItems: pnl.lineItems || {},
                            subTotals: pnl.subTotals || {},
                            revenue_breakup: pnl.revenue_breakup || {},
                            depreciation_breakup: pnl.depreciation_breakup || {},
                            metadata: pnl.metadata || {}
                        },
                        cash_flow: statement && statement.cash_flow ? statement.cash_flow : {},
                        pnl_key_schedule: statement && statement.pnl_key_schedule ? statement.pnl_key_schedule : {},
                        auditor: statement && statement.auditor ? statement.auditor : {},
                        auditor_comments: statement && statement.auditor_comments ? statement.auditor_comments : {},
                        auditor_additional: statement && statement.auditor_additional ? statement.auditor_additional : {}
                    };

                    return FinancialStatement.create(financialData);
                }
            });

            await Promise.all(createPromises);
        }

        if (companyData.gst_details && companyData.gst_details.length > 0) {
            for (const gstDetail of companyData.gst_details) {
                const existingGSTDetail = await GSTDetails.findOne({
                    company_id: company._id,
                    gstin: gstDetail.gstin
                });

                if (!existingGSTDetail) {
                    const gstData = {
                        company_id: company._id,
                        gstin: gstDetail.gstin,
                        status: gstDetail.status,
                        company_name: gstDetail.company_name,
                        trade_name: gstDetail.trade_name,
                        state: gstDetail.state,
                        state_jurisdiction: gstDetail.state_jurisdiction,
                        centre_jurisdiction: gstDetail.centre_jurisdiction,
                        date_of_registration: gstDetail.date_of_registration,
                        taxpayer_type: gstDetail.taxpayer_type,
                        nature_of_business_activities: gstDetail.nature_of_business_activities,
                        filings: gstDetail.filings || []
                    };

                    await GSTDetails.create(gstData);
                } else {
                    if (gstDetail.filings && gstDetail.filings.length > 0) {
                        for (const filing of gstDetail.filings) {
                            const filingExists = existingGSTDetail.filings.some(
                                f => f.return_type === filing.return_type &&
                                    f.financial_year === filing.financial_year &&
                                    f.tax_period === filing.tax_period
                            );

                            if (!filingExists) {
                                await GSTDetails.findByIdAndUpdate(
                                    existingGSTDetail._id,
                                    { $push: { filings: filing } }
                                );
                            }
                        }
                    }
                }
            }
        }

        await Company.findByIdAndUpdate(
            company._id,
            { $set: { isAllDataSaved: true } }, 
            { new: true, upsert: true }
        );

        await reportLog.findOneAndUpdate(
            {
                user_id,
                $or: [
                    { cinOrPan: company.cin },
                    { cinOrPan: company.pan }
                ]
            },
            {
                company_name: company.legal_name,
                company_id: company._id
            },
            {
                new: true,
                upsert: true 
            }
        );
        
        return company;
    } catch (err) {
        console.error("Error saving company data:", err);
        throw err;
    }
}

async function updateFinancialStatementsForYears(companyId, DataToUpdate) {
    try {
        const {
            balanceSheetData,
            profitLossData,
            assetsData,
            financialData,
            financialObservations,
            yearsToUpdate,
        } = DataToUpdate;

        const updateResults = [];
        const company = await Company.findById(companyId).lean().exec();
        const companyType = await company.company_type;

        if (financialData || financialObservations) {
            const highlightsUpdateObj = {};

            if (financialData) {
                highlightsUpdateObj.financial_highlights = financialData;
            }

            if (financialObservations) {
                highlightsUpdateObj.financial_observations = financialObservations;
            }

            try {
                await FinancialStatement.updateMany(
                    { company_id: companyId },
                    { $set: highlightsUpdateObj }
                );
                console.log(`Updated highlights and observations for all years of company ${companyId}`);
            } catch (error) {
                console.error('Error updating highlights and observations:', error);
            }
        }

        for (const year of yearsToUpdate) {

            const hasData = [
                balanceSheetData[year],
                profitLossData[year],
                assetsData[year]
            ].some(data => data);

            if (!hasData) {
                updateResults.push({ year, status: 'skipped', message: 'No data provided for this year' });
                continue;
            }

            const setUpdateFields = {};
            
            if (balanceSheetData[year]) {
                if(companyType === 'llps'){
                    setUpdateFields['statement_of_assets_and_liabilities.liabilities'] = balanceSheetData[year];
                }else{
                    setUpdateFields['bs.liabilities'] = balanceSheetData[year];
                }
            }

            if (profitLossData[year]) {
                if(companyType === 'llps'){
                    setUpdateFields['statement_of_income_and_expenditure.lineItems'] = profitLossData[year];
                }else{
                    setUpdateFields['pnl.lineItems'] = profitLossData[year];
                }
            }

            if (assetsData[year]) {
                if(companyType === 'llps'){
                    setUpdateFields['statement_of_assets_and_liabilities.assets'] = assetsData[year];
                }else{
                    setUpdateFields['bs.assets'] = assetsData[year];
                }
            }

            setUpdateFields.updatedAt = new Date(); 

            try {
                const result = await FinancialStatement.findOneAndUpdate(
                    { company_id: companyId, year: new RegExp(`^${year}-`), nature: "STANDALONE" },
                    { $set: setUpdateFields },
                    {
                        new: true,
                        upsert: true
                    }
                );

                updateResults.push({ year, status: 'success', data: result._id });
            } catch (yearError) {
                updateResults.push({ year, status: 'error', message: yearError.message });
            }
        }

        return {
            success: true,
            message: `Updated financial statements for ${updateResults.filter(r => r.status === 'success').length} years`,
            results: updateResults
        };
    } catch (error) {
        console.error('Error updating financial statements:', error);
        return { success: false, error: error.message };
    }
}

