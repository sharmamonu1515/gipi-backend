var axios = require('axios');
const apiUtility = require('../../lib/api-utility');
const companyProfile = require('../models/company_profile');

const prob = module.exports;

prob.getCompanyDetailByCINOrPAN = async function (req, res) {
    try {
        const cinOrPan = req.params.cinOrPan;
        const searchType = req.query.type;
        const companyType = req.query.companyType;

        let existingCompany = await companyProfile.findOne({
            $or: [{ cin: cinOrPan }, { pan: cinOrPan }]
        }).lean().exec();

        if (existingCompany) {
            const companyDetails = await companyProfile.aggregate([
                { $match: { _id: existingCompany._id } },
                {
                    $lookup: {
                        from: "gstdetails",
                        localField: "_id",
                        foreignField: "company_id",
                        as: "gst_details"
                    }
                },
                {
                    $lookup: {
                        from: "financialstatements",
                        pipeline: [
                            { $match: { company_id: existingCompany._id } },
                            { 
                                $project: { 
                                    "pnl.lineItems._id": 0,
                                    "bs.liabilities._id" : 0,
                                    "bs.assets._id" : 0
                                } 
                            },
                            { $sort: { year: -1 } }
                        ],
                        as: "financials"
                    }
                },
                {
                    $lookup: {
                        from: "charges",
                        localField: "_id",
                        foreignField: "company_id",
                        as: "charge_sequence"
                    }
                },
                {
                    $lookup: {
                        from: "creditratings",
                        localField: "_id",
                        foreignField: "company_id",
                        as: "credit_ratings"
                    }
                },
                {
                    $lookup: {
                        from: "directorshareholdings",
                        localField: "_id",
                        foreignField: "company_id",
                        as: "director_shareholdings"
                    }
                },
                {
                    $lookup: {
                        from: "establishments",
                        localField: "_id",
                        foreignField: "company_id",
                        as: "establishments_registered_with_epfo"
                    }
                },
                {
                    $lookup: {
                        from: "authorizedsignatories",
                        localField: "_id",
                        foreignField: "company_id",
                        as: "authorized_signatories"
                    }
                },
                {
                    $lookup: {
                        from: "directornetworks",
                        localField: "_id",
                        foreignField: "company_id",
                        as: "director_network"
                    }
                },
                {
                    $addFields: {
                        establishments_registered_with_epfo: {
                            $map: {
                                input: { $ifNull: ["$establishments_registered_with_epfo", []] },
                                as: "establishment",
                                in: {
                                    $mergeObjects: [
                                        "$$establishment",
                                        {
                                            filing_details: {
                                                $map: {
                                                    input: { $ifNull: ["$$establishment.filing_details", []] },
                                                    as: "filing",
                                                    in: {
                                                        $mergeObjects: [
                                                            "$$filing",
                                                            {
                                                                date_of_credit: {
                                                                    $dateToString: {
                                                                        format: "%Y-%m-%d",
                                                                        date: "$$filing.date_of_credit"
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        authorized_signatories: {
                            $map: {
                                input: { $ifNull: ["$authorized_signatories", []] },
                                as: "signatory",
                                in: {
                                    $mergeObjects: [
                                        "$$signatory",
                                        {
                                            date_of_appointment: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: "$$signatory.date_of_appointment"
                                                }
                                            },
                                            date_of_appointment_for_current_designation: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: "$$signatory.date_of_appointment_for_current_designation"
                                                }
                                            },
                                            date_of_cessation: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: "$$signatory.date_of_cessation"
                                                }
                                            },
                                            date_of_birth: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: "$$signatory.date_of_birth"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
        
                        credit_ratings: {
                            $map: {
                                input: { $ifNull: ["$credit_ratings", []] },
                                as: "rating",
                                in: {
                                    $mergeObjects: [
                                        "$$rating",
                                        {
                                            rating_date: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: "$$rating.rating_date"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        },
        
                        director_network: {
                            $map: {
                                input: { $ifNull: ["$director_network", []] },
                                as: "director",
                                in: {
                                    $mergeObjects: [
                                        "$$director",
                                        {
                                            network: {
                                                $mergeObjects: [
                                                    "$$director.network",
                                                    {
                                                        companies: {
                                                            $map: {
                                                                input: { $ifNull: ["$$director.network.companies", []] },
                                                                as: "company",
                                                                in: {
                                                                    $mergeObjects: [
                                                                        "$$company",
                                                                        {
                                                                            date_of_appointment: {
                                                                                $dateToString: {
                                                                                    format: "%Y-%m-%d",
                                                                                    date: "$$company.date_of_appointment"
                                                                                }
                                                                            },
                                                                            date_of_appointment_for_current_designation: {
                                                                                $dateToString: {
                                                                                    format: "%Y-%m-%d",
                                                                                    date: "$$company.date_of_appointment_for_current_designation"
                                                                                }
                                                                            },
                                                                            date_of_cessation: {
                                                                                $dateToString: {
                                                                                    format: "%Y-%m-%d",
                                                                                    date: "$$company.date_of_cessation"
                                                                                }
                                                                            }
                                                                        }
                                                                    ]
                                                                }
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        },
        
                        charge_sequence: {
                            $map: {
                                input: { $ifNull: ["$charge_sequence", []] },
                                as: "charge",
                                in: {
                                    $mergeObjects: [
                                        "$$charge",
                                        {
                                            filing_date: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: "$$charge.filing_date"
                                                }
                                            },
                                            date: {
                                                $dateToString: {
                                                    format: "%Y-%m-%d",
                                                    date: "$$charge.date"
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            ]);
        
            return res.send(apiUtility.success({ data: companyDetails[0] }, `Company Details fetched successfully!`));
        }
        
        const apiUrl = `https://api.probe42.in/probe_pro/${companyType === "llps" ? "llps" : "companies"}/${cinOrPan}/comprehensive-details?identifier_type=${searchType}`;
        const apiKey = process.env.PROB_API_KEY;

        console.log('apiUrl', apiUrl);
        const headers = {
            'accept': 'application/json',
            'x-api-version': '1.3',
            'x-api-key': apiKey
        };

        const response = await axios.get(apiUrl, { headers });
        const companyName = response.data.data.company.legal_name || response.data.data.llp.legal_name || null;

        const query = { $or: [{ cin: cinOrPan }] };

        if (companyName) {
            query.$or.push({ legal_name: companyName });
        }

        const company = await companyProfile.findOne(query).select('_id').lean().exec();
        if (response.data.data) {
            response.data.data.company_id = company._id || null;
        }
        return res.send(apiUtility.success(response.data,`Company Details fetched successfully!`));
    } catch (error) {
        console.log('Error in getCompanyDetailByCINOrPAN', error.response.message || error.message);
        return res.send({ status: 'error', message: error.message });
    }
}