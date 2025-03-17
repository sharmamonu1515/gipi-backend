const CompanyIn = require('../models/company_IN');
const CompanyInGenInf = require('../models/company_IN_Gen_Inf');
const ApiUtility = require('../../lib/api-utility');
const company = module.exports;
const { ObjectID } = require('mongodb');
const Static = require('../models/static-list');
const AllCompanies = require('../models/all_comapnies');
const NewCompanies = require('../models/new_uploads');
const { ObjectId } = require('mongoose');

const streamBuffers = require('stream-buffers');
// const XLSX = require('xlsx');
const excel = require('exceljs');

// const { Workbook } = require('exceljs');

// Add India Company
company.addInCompany = async function addInCompany(req, res) {
    try {

        if (
            !req.body.name ||
            !req.body.cin
        )
            return ApiUtility.failed('Missing Required Fields');

        let savedCompany = await CompanyIn.addInCompany(req.body);

        return res.send(ApiUtility.success(savedCompany, 'Company Added Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

company.searchCompany = async function searchCompany(req, res) {
    try {

        if (
            !req.query.country && !req.query.companyName ||
            !req.query.country && !req.query.companyCin
        )
            return res.send(ApiUtility.failed('Something Went Wrong'));

        !req.query.isExactSearch ? req.query.isExactSearch = 'false' : '';

        let Company = req.query.country === 'IN' ? CompanyIn :
            await CompanyIn.returnCountrySchema(req.query.country);

        let companySearchQuery = {};
        req.query.isExactSearch === 'false' ? companySearchQuery = { name: { $regex: req.query.companyName, $options: 'i' } } :
            companySearchQuery = { name: req.query.companyName };
        req.query.companyCin ? companySearchQuery['cin'] = req.query.companyCin : '';
        req.query.legalStr ? companySearchQuery['legal_structure'] = ObjectID(req.query.legalStr) : '';

        let companyDetails = await Company.aggregate([
            {
                $match: companySearchQuery
            },
            { $skip: Number(req.query.skip) },
            { $limit: Number(req.query.limit) },
            {
                $lookup: {
                    from: 'static_lists',
                    localField: 'status',
                    foreignField: '_id',
                    as: 'statusDetails'
                }

            },
            { $unwind: '$statusDetails' },
            {
                $lookup: {
                    from: 'static_lists',
                    localField: 'legal_structure',
                    foreignField: '_id',
                    as: 'legalDetails'
                }

            },
            { $unwind: '$legalDetails' },
            {
                $project: {
                    name: 1,
                    id: '$_id',
                    address: { $ifNull: ['$generalInfo.registered_office_address', ''] },
                    state: { $ifNull: ['$generalInfo.state', ''] },
                    companyAge: { $ifNull: [{ $subtract: [new Date().getFullYear(), { $year: '$generalInfo.date_of_incorporation' }] }, 0] },
                    status: { $ifNull: ['$statusDetails.name', 'N/A'] },
                    cin: { $ifNull: ['$cin', ''] },
                    country: { $ifNull: ['$country', ''] },
                    mca_status: { $ifNull: ['$generalInfo.mca_status', ''] },
                    website: { $ifNull: ['$generalInfo.website', ''] },
                    legalName: '$legalDetails.name',
                    updatedAt: { $ifNull: ['$generalInfo.updatedDate', ''] },
                    type: { $ifNull: ['$type', ''] }

                }
            }
        ]);

        return res.send(ApiUtility.success(companyDetails, 'Search Company Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

// Update General Information
company.updateGeneralInfo = async function updateGeneralInfo(req, res) {
    try {

        let companyCount = await AllCompanies.countDocuments();

        for (let i = 2030160; i >= 0; i--) {
            let companyDetails = await AllCompanies.find({}).skip(i).limit(1);

            if (companyDetails.length > 0) {
                let generalInfo = await CompanyIn.findOne({ cin: companyDetails[0].cin });

                if (generalInfo) {
                    console.log("pratap123")
                } else {
                    console.log("Akhsya 1234")
                    await NewCompanies.addInCompany(companyDetails[0]);
                }
            }

            console.log(i + 1);
        }
        console.log("General Info Updated Successfully");

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

// Static List
company.staticList = async function staticList(req, res) {
    try {

        let staticDetails = await Static.find({});

        return res.send(ApiUtility.success(staticDetails, 'Static List Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

// Company Individual List
company.companyIndividualList = async function companyIndividualList(req, res) {
    try {
        console.log("Akshaya Pratap")
        if (
            !req.params.companyId ||
            !req.params.country
        )
            return res.send(ApiUtility.failed('Missing Required Fields'));
        let Company = req.params.country === 'IN' || req.params.country === 'India' ? CompanyIn :
            await CompanyIn.returnCountrySchema(req.params.country);

        console.log(Company)

        let companyIndividualDetails = await Company.aggregate([
            {
                $match: { _id: ObjectID(req.params.companyId) }
            },
            {
                $lookup: {
                    from: 'static_lists',
                    localField: 'status',
                    foreignField: '_id',
                    as: 'statusDetails'
                }

            },
            { $unwind: '$statusDetails' },
            {
                $lookup: {
                    from: 'static_lists',
                    localField: 'legal_structure',
                    foreignField: '_id',
                    as: 'legalDetails'
                }

            },
            { $unwind: '$legalDetails' },
            {
                $project: {
                    company: {
                        cin: "$cin",
                        country: "$country",
                        createdDate: "$createdDate",
                        id: "$_id",
                        name: "$name",
                        type: "$type",
                        updatedDate: { $ifNull: ['$updatedDate', ''] },
                        updatedBy: { $ifNull: ['$updatedBy', ''] },
                        legal_structure: {
                            _id: '$legalDetails._id',
                            id: '$legalDetails._id',
                            name: '$legalDetails.name',
                            type: '$legalDetails.type',
                            position: '$legalDetails.position',
                        },
                        status: '$statusDetails'
                    },
                    general_info: '$generalInfo',
                    do_space_url: process.env.SPACES_BUCKET_LINK

                }
            }
        ]);

        return res.send(companyIndividualDetails[0]);

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

// Update Company Data
company.updateCompanyData = async function updateCompanyData(req, res) {
    try {
        if (!req.body.company_id)
            return res.send(ApiUtility.failed('Missing Required Fields'));

        req.body.updatedDate = Date.now();
        let Company = req.body.country === 'IN' || req.body.country === 'India' ? CompanyIn :
            await CompanyIn.returnCountrySchema(req.body.country);

        await Company.findByIdAndUpdate({ _id: ObjectID(req.body.company_id) }, {
            generalInfo: req.body,
            cin: req.body.cin,
            name: req.body.nameEntity
        });

        return res.send(ApiUtility.success({}, 'General Info Updated Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

// Filter Company Data
company.filterData = async function filterData(req, res) {
    try {

        if (!req.query.country)
            return res.send(ApiUtility.failed('Missing Required Fields'));

        let companyFilterQuery = {};
        req.query.type === '1' ?
            companyFilterQuery = {} :
            req.query.type === '2' ?
                companyFilterQuery['type'] = 'USER_ADMIN' :
                req.query.type === '3' ?
                    companyFilterQuery['type'] = 'USER_KYC' :
                    req.query.type === '4' ?
                        companyFilterQuery['type'] = 'USER_APP' :
                        companyFilterQuery['type'] = {
                            $nin: [
                                'USER_ADMIN',
                                'USER_APP',
                                'USER_KYC',
                            ]
                        }

        req.query.country ? companyFilterQuery['country'] = req.query.country : '';
        req.query.filterValue ? companyFilterQuery['name'] = { $regex: `^${req.query.filterValue}` } : '';
        req.query.cinFilterValue ? companyFilterQuery['cin'] = req.query.cinFilterValue.trim() : '';

        let Company = req.query.country === 'IN' || req.query.country === 'India' ? CompanyIn :
            await CompanyIn.returnCountrySchema(req.query.country);

        const count = await Company.find(companyFilterQuery).countDocuments('_id');

        return Company.aggregate([
            {
                $match: companyFilterQuery
            },
            { $skip: Number(req.query.skip) },
            { $limit: Number(req.query.limit) },
            { // Comapny Status Details
                $lookup: {
                    from: 'static_lists',
                    localField: 'status',
                    foreignField: '_id',
                    as: 'statusDetails'
                }
            },
            { $unwind: '$statusDetails' },
            { // Legal Statement Details
                $lookup: {
                    from: 'static_lists',
                    localField: 'legal_structure',
                    foreignField: '_id',
                    as: 'legalDetails'
                }
            },
            { $unwind: '$legalDetails' },
            {
                $project: {
                    cin: 1,
                    country: 1,
                    status: {
                        _id: '$statusDetails._id',
                        id: '$statusDetails._id',
                        name: '$statusDetails.name',
                        position: '$statusDetails.position',
                        type: '$statusDetails.type',
                    },
                    type: 1,
                    name: 1,
                    legal_structure: {
                        _id: '$legalDetails._id',
                        id: '$legalDetails._id',
                        name: '$legalDetails.name',
                        position: '$legalDetails.position',
                        type: '$legalDetails.type',
                    },
                    createdDate: 1,
                }
            }
        ]).then((resolve) => {
            return res.status(200).json({
                list: resolve,
                count: count
            })
        }).catch((err) => {
            return res.send(ApiUtility.failed(err.message));
        });

    } catch (error) {

        return res.send(ApiUtility.failed(error.message));

    }
}

company.updateOrAddCompany = async function updateOrAddCompany(req, res) {
    try {
        if (!req.body.country)
            return res.send(ApiUtility.failed('Missing Required Fields'));

        let Company = req.body.country === 'IN' || req.body.country === 'India' ? CompanyIn :
            await CompanyIn.returnCountrySchema(req.body.country);

        if (req.body._id !== null) {
            req.body.updatedAt = Date.now();
            let updatedCompany;

            if (req.body.status === "5cd2e1ed8152f81724f406ba") {

                req.body.type = 'USER_ADMIN';
                req.body.previousType = 'USER_APP';
                updatedCompany = await Company.findByIdAndUpdate({ _id: ObjectID(req.body._id) }, req.body)

            } else {
                updatedCompany = await Company.findByIdAndUpdate({ _id: ObjectID(req.body._id) }, req.body)
            }

            return res.send(ApiUtility.success(await getById(updatedCompany._id, Company), "Company Updated Successfully"));
        } else {

            let foundCompany = await Company.findOne({cin: req.body.cin});

            if(foundCompany)
            return res.send(ApiUtility.failed('Company Already Exists.'));

            req.body.type = 'USER_ADMIN';
            delete (req.body._id);
            let newCompany = new Company(req.body);
            let savedCompany = await newCompany.save();
            return res.send(ApiUtility.success(await getById(savedCompany._id, Company), 'Company Added Successfully'));
        }

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

async function getById(id, Company) {

    let companyDetails = await Company.aggregate([
        {
            $match: {
                _id: ObjectID(id)
            }
        },
        { // Comapny Status Details
            $lookup: {
                from: 'static_lists',
                localField: 'status',
                foreignField: '_id',
                as: 'statusDetails'
            }
        },
        { $unwind: '$statusDetails' },
        { // Legal Statement Details
            $lookup: {
                from: 'static_lists',
                localField: 'legal_structure',
                foreignField: '_id',
                as: 'legalDetails'
            }
        },
        { $unwind: '$legalDetails' },
        {
            $project: {
                cin: 1,
                country: 1,
                status: {
                    _id: '$statusDetails._id',
                    id: '$statusDetails._id',
                    name: '$statusDetails.name',
                    position: '$statusDetails.position',
                    type: '$statusDetails.type',
                },
                type: 1,
                name: 1,
                legal_structure: {
                    _id: '$legalDetails._id',
                    id: '$legalDetails._id',
                    name: '$legalDetails.name',
                    position: '$legalDetails.position',
                    type: '$legalDetails.type',
                },
                createdDate: 1,
            }
        }
    ]);

    return companyDetails[0];

}

company.removeCompany = async function removeCompany(req, res) {
    try {

        if (!req.body.country)
            return res.send(ApiUtility.failed('Missing required Fields'));

        let Company = req.body.country === 'IN' || req.body.country === 'India' ? CompanyIn :
            await CompanyIn.returnCountrySchema(req.body.country);

        await Company.deleteOne({ _id: ObjectID(req.body._id) });

        return res.send(ApiUtility.success({}, 'Company Deleted Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

company.countDashboard = async function countDashboard(req, res) {

    try {

        var startOfToday = new Date(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        let companyCount = await CompanyIn.countDocuments({ type: 'USER_ADMIN' });
        let totalCompanyCount = await CompanyIn.countDocuments();
        let kycCompanyCount = await CompanyIn.countDocuments({ type: 'USER_KYC' });
        let appCompanyCount = await CompanyIn.countDocuments({ type: 'USER_APP' });
        let companyCountToday = await CompanyIn.countDocuments({
            createdDate: {
                $gte: startOfToday
            }
        });

        return res.send(ApiUtility.success({
            companyCount: companyCount,
            company_total: totalCompanyCount,
            company_kyc: kycCompanyCount,
            company_app: appCompanyCount,
            companyCountToday: companyCountToday
        }, "Company Count Successfull"));


    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }

}

// UPDATE MCA QUERY
company.updateMcaData = async function updateMcaData(req, res) {
    try {

        if (
            !req.body.data.cin ||
            !req.body.country
        )
            return res.send(ApiUtility.failed('Something Went Wrong'));

        req.body.data.updatedAt = Date.now();

        let filterOpenCharges = req.body.charges.filter((charge) => {
            return charge.status === 'OPEN';
        });

        let charges = filterOpenCharges.reduce(function (acc, curr) {
            acc += curr.chargeAmt;
            return acc;
        }, 0);

        let Company = req.body.country === 'IN' || req.body.country === 'India' ? CompanyIn :
            await CompanyIn.returnCountrySchema(req.body.country);

        let foundCompany = await Company.findOne({ cin: req.body.data.cin });

        if (!foundCompany)
            return res.send(ApiUtility.failed('Something Went Wrong'));

        req.body.data['generalInfo.date_of_incorporation'] = `${req.body.data['generalInfo.date_of_incorporation'].substring(6)}-${req.body.data['generalInfo.date_of_incorporation'].substring(3, 5)}-${req.body.data['generalInfo.date_of_incorporation'].substring(0, 2)}`;
        req.body.data['generalInfo.age_incorporate_date'] = req.body.data['generalInfo.date_of_incorporation'];
        req.body.data['generalInfo.balance_sheet_date'] ?
            req.body.data['generalInfo.balance_sheet_date'] === '-' ?
                delete (req.body.data['generalInfo.balance_sheet_date']) :
                req.body.data['generalInfo.balance_sheet_date'] = `${req.body.data['generalInfo.balance_sheet_date'].substring(6)}-${req.body.data['generalInfo.balance_sheet_date'].substring(3, 5)}-${req.body.data['generalInfo.balance_sheet_date'].substring(0, 2)}` : '';

        req.body.data['generalInfo.open_charges'] = charges;

        await Company.findByIdAndUpdate({ _id: ObjectID(foundCompany._id) }, req.body.data);
        req.body.data.companyId = foundCompany._id;

        return res.send(ApiUtility.success(req.body, 'MCA Details Updated Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

// Add Data Basis Of Excel File
company.parseExcelFile = async function parseExcelFile(req, res) {
    try {

        if (!req.files.attachment || req.files.attachment == undefined)
            return res.send(ApiUtility.failed('No Attachment Found'));

        // var workbook = XLSX.read(req.files.attachment.data);
        // var sheet_name_list = workbook.SheetNames;
        // var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        var myReadableStreamBuffer = new streamBuffers.ReadableStreamBuffer({
            // frequency: 10,   // in milliseconds.
            // chunkSize: 2048  // in bytes.
        });

        myReadableStreamBuffer.put(req.files.attachment.data);

        myReadableStreamBuffer.on('data', async function (data) {
            // streams1.x style data
            // assert.isTrue(data instanceof Buffer);
            // console.log('Akshay', data)
            // var workbook = XLSX.read(data);
            // var sheet_name_list = workbook.SheetNames;
            // var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

            // console.log(xlData)

            const workbook = new excel.Workbook();
            let dataDet = await workbook.xlsx.load(data);
            console.log(dataDet)

        });

        // myReadableStreamBuffer.on('end', function (data) {

        //     console.log("Akshay Pratap Singh")
        // });


    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}