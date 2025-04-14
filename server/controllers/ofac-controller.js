const OFACHeader = require('../models/ofac-headers');
const ApiUtility = require('../../lib/api-utility');
const OFACMetaData = require('../models/ofac_metadata');
const OFAC = require('../models/ofac');
const { ObjectID } = require('mongodb');
const readExcel = require('read-excel-file/node');
const translate = require("translate");
const XLSX = require('xlsx');
const config = require('../config');

const ofac = module.exports;

ofac.addOfacHeaders = async function addOfacHeaders(req, res) { 
    try {

        let updateOfacHeader = {};

        updateOfacHeader[req.body.savedValue] = req.body[req.body.savedValue];

        await OFACHeader.findByIdAndUpdate({
            _id: ObjectID("610a78d087d46b04a40011cb")
        }, updateOfacHeader)

        return res.send(ApiUtility.success({}, "OFAC Headers Added Successfully."));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

ofac.addMetaData = async function addMetaData(req, res) { // Add OFAC Meta Data
    try {

        req.body.sourceLink = req.body.sourceLink.split(',');
        await OFACMetaData.addMetaData(req.body);

        return res.send(ApiUtility.success({}, "OFAC Meta Data Added Successfully"));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

ofac.getMetaDataList = async function getMetaDataList(req, res) { // OFAC Meta Data List
    try {

        let metaDataDetails = await OFACMetaData.find({}).limit(5);

        return res.send(ApiUtility.success(metaDataDetails, "OFAC Meta Data List Successfully"));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

ofac.meataDataFilterExcel = async function meataDataFilterExcel(req, res) { // Meta Data Filter
    try {

        let metaDataDetails = {};

        readExcel("C:/Users/Akshay Pratap Singh/Desktop/International Checklist(scrapping) - All.xlsx").then(async (rows) => {
            let headers = rows[0].filter((row) => {
                return row !== null;
            });

            for (let i = 1; i < rows.length; i++) {

                metaDataDetails = {};

                for (let j = 0; j < headers.length; j++) {

                    metaDataDetails[`${headers[j]}`] = rows[i][j];

                }

                // let metaDataFound = await OFACMetaData.findOne({keyword: metaDataDetails.keyword});

                // if(!metaDataFound) {
                //     await OFACMetaData.addMetaData(metaDataDetails)
                // } else {
                //     await OFACMetaData.findOneAndUpdate({
                //         keyword: metaDataDetails.keyword
                //     }, {
                //         $push: {
                //             sourceLink: metaDataDetails.sourceLink
                //         }
                //     })
                // }
                console.log(i);
            }

            return res.send(ApiUtility.success({}, "Meta Data Added Successfully"));

        }).catch((error) => {
            return res.send(ApiUtility.failed(error.message));
        })

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

ofac.searchKeyword = async function searchKeyword(req, res) { // One Check Search Keyword

    try {
        if (
            !req.query.limit ||
            !req.query.skip ||
            !req.query.keyword ||
            req.query.keyword === null
        )
            return res.send(ApiUtility.failed('Something Went Wrong'));

        // Keyword Search On the Basis od Delimiter Start

        let filterKeywordType = JSON.parse(req.query.filterKeywordType);
        let delimiterType = JSON.parse(req.query.delimiterType);
        let keywordQuery = {};
        keywordQuery = {
            $or: [
                { "name": { $regex: req.query.keyword, $options: 'i' } },
                { "data": { $regex: req.query.keyword, $options: 'i' } }
            ]
        }

        if (filterKeywordType.seperate) {

            let splitDelimiter = '';

            delimiterType.comma ? splitDelimiter = ',' :
                delimiterType.dot ? splitDelimiter = '.' :
                    delimiterType.space ? splitDelimiter = ' ' : splitDelimiter = null;

            if (splitDelimiter) {

                let splitText = req.query.keyword.split(splitDelimiter);
                splitText = splitText.map(function (text) { return new RegExp(text, "i"); });

                keywordQuery = {
                    $or: [
                        { name: { $in: splitText } },
                        { data: { $in: splitText } }
                    ]
                }

            } else {
                keywordQuery = {
                    $or: [
                        { "name": { $regex: req.query.keyword, $options: 'i' } },
                        { "data": { $regex: req.query.keyword, $options: 'i' } }
                    ]
                }
            }

        } else {
            keywordQuery = {
                $or: [
                    { "name": { $regex: req.query.keyword, $options: 'i' } },
                    { "data": { $regex: req.query.keyword, $options: 'i' } }
                ]
            }
        }

        req.query.countryName && req.query.countryName !== 'null' ? keywordQuery['countryOfAuthority'] = req.query.countryName : '';
        req.query.sanctions && req.query.sanctions !== 'null' ? keywordQuery['keywordAbbreviation'] = req.query.sanctions : '';

        // Keyword Search On the Basis od Delimiter Ended

        let count = await OFAC.countDocuments(keywordQuery);

        let searchResults = await OFAC.aggregate([
            {
                $match: keywordQuery
            },
            { $skip: (Number(req.query.skip) * Number(req.query.limit)) },
            { $limit: Number(req.query.limit) },
            // {
            //     $lookup: {
            //         from: "ofac_meta_datas",
            //         localField: "keyword",
            //         foreignField: "keyword",
            //         as: "metaDataFields"
            //     }
            // },
            // { $unwind: "$metaDataFields" },
            {
                $project: {
                    keyword: { $ifNull: ["$keywordAbbreviation", 'N/A'] },
                    name: { $ifNull: ["$name", ""] },
                    data: { $ifNull: ["$data", ""] },
                    sourceFullName: { $ifNull: ["$fullNameOfSource", "N/A"] },
                    authorityCountry: { $ifNull: ["$countryOfAuthority", "N/A"] },
                    type: { $ifNull: ["$type", "N/A"] },
                    searchType: { $ifNull: ["$searchType", "N/A"] },

                    // explanation: { $ifNull: ["$metaDataFields.explanation", ""] },
                    // sourceLinkArray: { $ifNull: ["$metaDataFields.sourceLink", ""] },
                    // sourceLink: {
                    //     "$reduce": {
                    //         "input": "$metaDataFields.sourceLink",
                    //         "initialValue": "",
                    //         "in": {
                    //             "$cond": {
                    //                 "if": { "$eq": [{ "$indexOfArray": ["$metaDataFields.sourceLink", "$$this"] }, 0] },
                    //                 "then": { "$concat": ["$$value", "$$this"] },
                    //                 "else": { "$concat": ["$$value", ", ", "$$this"] }
                    //             }
                    //         }
                    //     }
                    // },
                }
            }
        ]);

        return res.send(ApiUtility.success({
            count: count,
            list: searchResults
        }, "List Fetched Successfully."))

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }

}

ofac.translateHindiToEnglish = async function translateHindiToEnglish(req, res) {
    try {

        const text = await translate("Hello world", "es");
        console.log(text); // Hola mundo

        // readExcel('C:/Users/Akshay Pratap Singh/Downloads/hindi.xlsx').then((row) => {
        //     console.log(row[1][6]);
        // })

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

ofac.readLargeFile = async function readLargeFile(req, res) {
    try {

        if (!req.files.attachment || req.files.attachment == undefined)
            return res.send(ApiUtility.failed('No Attachment Found'));

        if (!req.query.searchTypeValue)
            return res.send(ApiUtility.failed("Please Select List Type"));

        if (!req.query.uniqueFileName)
            return res.send(ApiUtility.failed("Please Give Uploading File Unique Name."));

        let foundUniqueName = await OFAC.findOne({uniqueFileName: req.query.uniqueFileName.trim()});

        if(foundUniqueName)
        return res.send(ApiUtility.failed("Unique Name Was Already Taken"));

        if (
            req.query.searchTypeValue !== 'Domestic' && req.query.searchTypeValue === 'International' || 
            req.query.searchTypeValue !== 'International' && req.query.searchTypeValue === 'Domestic') {

            } else {
                return res.send(ApiUtility.failed('Wrong List Type Selected or Passed'));
            }
            

        config.searchTypeValue = req.query.searchTypeValue;
        config.uniqueFileName = req.query.uniqueFileName;

        var workbook = XLSX.read(req.files.attachment.data);
        var sheet_name_list = workbook.SheetNames;
        var xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        let isHeaderError = isHeaderThere(xlData[0]);

        if (isHeaderError)
            return res.send(ApiUtility.failed('Headers Missing in the file'));

        await OFAC.insertMany(xlData)

        return res.send(ApiUtility.success({}, 'File Added Successfully'));

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

function isHeaderThere(data) {
    try {

        let isHeaderError = false;
        let getHeaderList = JSON.stringify(Object.keys(data));
        let necessaryHeaders = ['name', 'keywordAbbreviation', 'fullNameOfSource', 'countryOfAuthority', 'type'];

        for (let header of necessaryHeaders) {
            if (getHeaderList.search(header) === -1) {
                isHeaderError = true;
                break;
            } else {
                continue;
            }
        }

        return isHeaderError;

    } catch (error) {
        throw error;
    }
}

ofac.countryName = async function countryName (req, res) {
    try {
        
        let countriesList = await OFAC.distinct("countryOfAuthority");
        let sanctionList = await OFAC.distinct("keywordAbbreviation");
        
        return res.send(ApiUtility.success({
            countriesList: countriesList,
            sanctionList: sanctionList
        }, 'One Check Countries List Fetched Successfully.'))

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}