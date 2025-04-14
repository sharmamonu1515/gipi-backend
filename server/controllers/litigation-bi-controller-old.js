const axios = require('axios');
const LitigationAuth = require('../models/litigation_bi_auth')
const LitigationDetails = require('../models/litigation_bi_details')
const LitigationFileDetails = require('../models/litigation_bi_file_details')
const KarzaMcaDetails = require('../models/karza_company_details')
const LitigationDirectorFileDetails = require('../models/litigation_bi_directors_details')
const McaCompanyBulkDetails = require('../models/mca_company_bulk_details')

const litigationBi = module.exports;

// Litigation BI Auth Details
async function getAndSaveAuthToken() {
    try {

        let data = JSON.stringify({
            "username": "empliance_operations",
            "password": "Empliance@2022"
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/login',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': '_hjSessionUser_2171476=eyJpZCI6IjdiYmI4MWI0LWRmNTQtNTk3Zi1hNzY1LWUxOTYzNWIwOWQ4NiIsImNyZWF0ZWQiOjE3MDUwNTQxMDM3NDEsImV4aXN0aW5nIjp0cnVlfQ==; _ga_DGTVLJ1D8C=GS1.1.1708503382.2.1.1708503405.0.0.0; _hjSessionUser_2281971=eyJpZCI6ImJjZDAzYjhmLWMwYzAtNWNlNS04OGY3LTFhY2MyYTA2MjAwMCIsImNyZWF0ZWQiOjE3MDg1MDM0MTAyNDAsImV4aXN0aW5nIjpmYWxzZX0=; _ga_VBVF28KVSW=GS1.1.1708503410.1.1.1708503967.0.0.0; _ga_HFNPT4T9YF=GS1.1.1712727156.9.0.1712727163.0.0.0; _gid=GA1.2.1245526769.1716706481; _ga_H24S6XGS6G=GS1.1.1716736094.4.1.1716736094.0.0.0; _gat_gtag_UA_149853712_5=1; _ga_XKLBW308PM=GS1.1.1716736094.4.0.1716736094.0.0.0; _ga=GA1.1.1181110842.1705054103; k-token=bd5cb465d5499663163acc7fd1179127dc83f617',
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/login',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'x-product': 'kscan'
            },
            data: data
        };

        let authDetails = await axios(config)
        let authSetCookie = authDetails.headers['set-cookie'][0].split(';')

        let foundLitigationDetails = await LitigationAuth.findOne({});
        if (!foundLitigationDetails) {
            let saveAuthData = new LitigationAuth({
                "token": authDetails.data.data,
                "setCookie": authSetCookie[0]
            })
            return await saveAuthData.save();
        } else {
            let updatedAuthData = await LitigationAuth.findOneAndUpdate({}, {
                "token": authDetails.data.data,
                "setCookie": authSetCookie[0],
                "isExpired": false
            }, { new: true })
            return updatedAuthData;
        }


    } catch (error) {
        return error
    }
}

// Get Litigation BI Search Result
litigationBi.getLitigationSearchDetails = async function (req, res, next) {
    try {

        let litigationAuthDetails = await LitigationAuth.findOne({ "isExpired": false });
        if (!litigationAuthDetails) {
            litigationAuthDetails = await getAndSaveAuthToken();
        }

        let data = JSON.stringify({
            "id": `${req.body.companyId}`,
            "filter": {
                "name": null
            },
            "nameMatch": false,
            "entitySearch": true,
            "temporaryKid": false,
            "section": "litigation"
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v3/search/byIdOrName',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': `_gid=GA1.2.1335970274.1716707509; _gat_gtag_UA_149853712_5=1; _ga=GA1.1.1421116793.1716707509; k-token=3ecee8b29d3ff5fe805b8b5a1dca0912349719c5; st=90; dttk=${litigationAuthDetails.token}; _ga_H24S6XGS6G=GS1.1.1716707508.1.1.1716707521.0.0.0; ${litigationAuthDetails.setCookie}`,
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/litigation-bi',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'x-product': 'kscan'
            },
            data: data
        };

        axios.request(config)
            .then((response) => {
                req.body['auth_details'] = litigationAuthDetails;
                req.body['company_search_details'] = response.data;
                next();
            })
            .catch(async (error) => {
                await LitigationAuth.findOneAndUpdate({}, { "isExpired": true })
                return res.send({ status: 'karza_error', message: error.message });
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Get Company Details By CIN
litigationBi.getCompanyDetailsByCin = async function (req, res, next) {
    try {

        let data = JSON.stringify({
            "id": "U74140MH1996PTC102649",
            "filter": {
                "name": null
            },
            "nameMatch": false,
            "entitySearch": true,
            "temporaryKid": false,
            "section": "litigation"
        });
        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v3/search/byIdOrName',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': `_gid=GA1.2.1335970274.1716707509; _gat_gtag_UA_149853712_5=1; _ga=GA1.1.1421116793.1716707509; k-token=3ecee8b29d3ff5fe805b8b5a1dca0912349719c5; st=90; dttk=${req.body.auth_details.token}; _ga_H24S6XGS6G=GS1.1.1716707508.1.1.1716707521.0.0.0; ${req.body.auth_details.setCookie}`,
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/litigation-bi',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'x-product': 'kscan'
            },
            data: data
        };
        axios.request(config)
            .then((response) => {
                req.body['company_details'] = response.data.result[0];
                next();
            })
            .catch((error) => {
                return res.send({ status: 'karza_error', message: error.message });
            });
    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Get Company Details by Karza ID
litigationBi.getKarzaCompanyDetails = async function (req, res, next) {
    try {

        let data = JSON.stringify({
            "id": req.body.company_details.kid
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v3/mca-details',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': `_gid=GA1.2.1335970274.1716707509; _gat_gtag_UA_149853712_5=1; _ga=GA1.1.1421116793.1716707509; k-token=3ecee8b29d3ff5fe805b8b5a1dca0912349719c5; st=90; dttk=${req.body.auth_details.token}; _ga_H24S6XGS6G=GS1.1.1716707508.1.1.1716707521.0.0.0; ${req.body.auth_details.setCookie}`,
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/litigation-bi?q=eyJlbnRpdHlOYW1lIjoiRU1QTElBTkNFIFRFQ0hOT0xPR0lFUyBQUklWQVRFIExJTUlURUQiLCJzdGFydERhdGUiOm51bGwsImVuZERhdGUiOm51bGwsInVwY29taW5nUGVyaW9kIjpudWxsLCJwZW5kaW5nQ2FzZVR5cGUiOm51bGwsImNvdW50T25seSI6ZmFsc2UsInJjbm8iOiIiLCJjYXNlU3RhdHVzIjoiIiwiZW50aXR5UmVsYXRpb24iOiJiIiwic3RhdGVDb2RlIjpbXSwiZGF0ZVR5cGUiOiJmaWxpbmdEYXRlIiwiY291cnRUeXBlcyI6e30sImZ1enppbmVzcyI6ZmFsc2UsInNldmVyaXR5Ijp7fSwiZGlzdHJpY3QiOltdLCJ5ZWFyIjpudWxsLCJtb250aCI6bnVsbCwiZmlsaW5nRGF0ZSI6IiIsImRlY2lzaW9uRGF0ZSI6IiIsIm5leHRIZWFyaW5nRGF0ZSI6IiIsImFkdm9jYXRlIjoiIiwiYWR2b2NhdGVSZWxhdGlvbiI6ImIiLCJqdWRnZSI6IiIsImNhc2VUeXBlQ2F0ZWdvcnkiOiIiLCJjYXNlVHlwZSI6IiIsImNhc2VBY3QiOiIiLCJjYXNlU2VjdGlvbiI6IiIsInN0YWdlT2ZDYXNlIjoiIiwiY291cnRDb21wbGV4IjoiIiwiY291cnROdW1iZXIiOm51bGwsImFnZ3JlZ2F0aW9uVHlwZSI6ImRhdGUiLCJjb3VydEVzdGFibGlzaG1lbnQiOiIiLCJkaXJlY3RvclNlYXJjaFR5cGUiOiJhbGwiLCJlbnRpdHlJZCI6IlU3MjUwMUhSMjAyMFBUQzA4NzcwMiIsInBldGl0aW9uZXJSZXNwb25kZW50UGFydHkiOiIiLCJzZWFyY2hUeXBlIjoiRU5USVRZIiwiYWRkcmVzcyI6IiIsImtpZCI6IktDTzAwMDExNjMwNTI2OEgifQ%3D%3D&f=1kqph469fe',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'x-product': 'kscan'
            },
            data: data
        };

        axios.request(config)
            .then(async (response) => {
                let karzaCompanyDetails = {
                    entityId: req.body.company_search_details.result[0].entityId,
                    name: req.body.company_search_details.result[0].name,
                    basicDetails: req.body.company_details,
                    detailedDetails: response.data.result[0],
                    createdAt: new Date(),
                    createdTrno: Date.now(),
                    updatedAt: new Date(),
                    updatedTrno: Date.now()
                }

                let foundKarzaMcaDetails = await KarzaMcaDetails.findOne({
                    "entityId": req.body.company_search_details.result[0].entityId,
                    "name": req.body.company_search_details.result[0].name
                })

                if (foundKarzaMcaDetails) {
                    await KarzaMcaDetails.findByIdAndDelete(foundKarzaMcaDetails._id)
                }

                let saveKarzaMcaDetails = new KarzaMcaDetails(karzaCompanyDetails)
                await saveKarzaMcaDetails.save()

                next();
            })
            .catch((error) => {
                return res.send({ status: 'karza_error', message: error.message });
            });
    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Get Litigation BI Details
litigationBi.getLitigationDetails = async function (req, res) {
    try {

        let data = JSON.stringify({
            "entityName": `${req.body.company_search_details.result[0].name}`,
            "countOnly": false,
            "entityRelation": "b",
            "dateType": "filingDate",
            "fuzziness": false,
            "advocateRelation": "b",
            "aggregationType": "date",
            "entityId": `${req.body.company_search_details.result[0].entityId}`,
            "searchType": "ENTITY",
            "pageSize": 20,
            "pageNo": 1,
            "ui_response": true,
            "version": 3,
            "section": "litigation"
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v1/litigations/bi/all/classification',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': `_hjSessionUser_2171476=eyJpZCI6IjdiYmI4MWI0LWRmNTQtNTk3Zi1hNzY1LWUxOTYzNWIwOWQ4NiIsImNyZWF0ZWQiOjE3MDUwNTQxMDM3NDEsImV4aXN0aW5nIjp0cnVlfQ==; _ga_DGTVLJ1D8C=GS1.1.1708503382.2.1.1708503405.0.0.0; _hjSessionUser_2281971=eyJpZCI6ImJjZDAzYjhmLWMwYzAtNWNlNS04OGY3LTFhY2MyYTA2MjAwMCIsImNyZWF0ZWQiOjE3MDg1MDM0MTAyNDAsImV4aXN0aW5nIjpmYWxzZX0=; _ga_VBVF28KVSW=GS1.1.1708503410.1.1.1708503967.0.0.0; _ga_HFNPT4T9YF=GS1.1.1712727156.9.0.1712727163.0.0.0; _gid=GA1.2.1245526769.1716706481; _ga=GA1.1.1181110842.1705054103; k-token=3ecee8b29d3ff5fe805b8b5a1dca0912349719c5; st=90; dttk=${req.body.auth_details.token}; ksReNoG=; _gat_gtag_UA_149853712_5=1; _ga_H24S6XGS6G=GS1.1.1716736094.4.1.1716736356.0.0.0; _ga_XKLBW308PM=GS1.1.1716736094.4.1.1716736356.0.0.0; ${req.body.auth_details.setCookie}`,
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/litigation-bi?q=eyJlbnRpdHlOYW1lIjoiTE9CTyBTVEFGRklORyBTT0xVVElPTlMgUFJJVkFURSBMSU1JVEVEIiwic3RhcnREYXRlIjpudWxsLCJlbmREYXRlIjpudWxsLCJ1cGNvbWluZ1BlcmlvZCI6bnVsbCwicGVuZGluZ0Nhc2VUeXBlIjpudWxsLCJjb3VudE9ubHkiOmZhbHNlLCJyY25vIjoiIiwiY2FzZVN0YXR1cyI6IiIsImVudGl0eVJlbGF0aW9uIjoiYiIsInN0YXRlQ29kZSI6W10sImRhdGVUeXBlIjoiZmlsaW5nRGF0ZSIsImNvdXJ0VHlwZXMiOnt9LCJmdXp6aW5lc3MiOmZhbHNlLCJzZXZlcml0eSI6e30sImRpc3RyaWN0IjpbXSwieWVhciI6bnVsbCwibW9udGgiOm51bGwsImZpbGluZ0RhdGUiOiIiLCJkZWNpc2lvbkRhdGUiOiIiLCJuZXh0SGVhcmluZ0RhdGUiOiIiLCJhZHZvY2F0ZSI6IiIsImFkdm9jYXRlUmVsYXRpb24iOiJiIiwianVkZ2UiOiIiLCJjYXNlVHlwZUNhdGVnb3J5IjoiIiwiY2FzZVR5cGUiOiIiLCJjYXNlQWN0IjoiIiwiY2FzZVNlY3Rpb24iOiIiLCJzdGFnZU9mQ2FzZSI6IiIsImNvdXJ0Q29tcGxleCI6IiIsImNvdXJ0TnVtYmVyIjpudWxsLCJhZ2dyZWdhdGlvblR5cGUiOiJkYXRlIiwiY291cnRFc3RhYmxpc2htZW50IjoiIiwiZGlyZWN0b3JTZWFyY2hUeXBlIjoiYWxsIiwiZW50aXR5SWQiOiJVNzQxNDBNSDE5OTZQVEMxMDI2NDkiLCJwZXRpdGlvbmVyUmVzcG9uZGVudFBhcnR5IjoiIiwic2VhcmNoVHlwZSI6IkVOVElUWSIsImFkZHJlc3MiOiIiLCJraWQiOiJLQ08wMDAwMDg3NTg2NzBPIn0%3D&f=ha1cg9ozy7',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'x-product': 'kscan'
            },
            data: data
        };

        axios.request(config)
            .then(async (response) => {

                let litigationViewDetails = {
                    entityId: req.body.company_search_details.result[0].entityId,
                    name: req.body.company_search_details.result[0].name,
                    type: 'company',
                    litigationDetails: {
                        severityCount: response.data.result.severityCount,
                        priorityCount: response.data.result.priorityCount,
                        caseTypeCategoryCount: response.data.result.caseTypeCategoryCount,
                        totalCases: response.data.result.totalCases,
                        courtWiseCount: response.data.result.courtWiseCount,
                        upcomingCases: response.data.result.upcomingCases,
                    }
                }

                let foundLitigationDetails = await LitigationDetails.findOne({
                    "entityId": req.body.company_search_details.result[0].entityId,
                    "name": req.body.company_search_details.result[0].name
                })

                if (!foundLitigationDetails) {
                    litigationViewDetails.createdAt = new Date()
                    litigationViewDetails.createdTrno = Date.now()
                    litigationViewDetails.updatedAt = new Date()
                    litigationViewDetails.updatedTrno = Date.now()
                    let saveLitigationDetails = new LitigationDetails(litigationViewDetails)
                    await saveLitigationDetails.save()
                } else {
                    let foundLitigationDetailsObj = foundLitigationDetails.toObject()
                    litigationViewDetails.createdAt = foundLitigationDetailsObj.createdAt
                    litigationViewDetails.createdTrno = foundLitigationDetailsObj.createdTrno
                    litigationViewDetails.updatedAt = new Date()
                    litigationViewDetails.updatedTrno = Date.now()
                    await LitigationDetails.findByIdAndUpdate(foundLitigationDetailsObj._id, litigationViewDetails)
                }

                return res.send({ status: 'success', message: "Litigation BI Details Fetched Successfully" });
            })
            .catch(async (error) => {
                // await LitigationAuth.findOneAndUpdate({}, { "isExpired": true })
                return res.send({ status: 'karza_error', message: error.message });
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Save Advanced Excel Data 
litigationBi.saveLitigationAdvancedExcelFileDetails = async function (req, res) {
    try {

        let foundLitigationFileDetails = await LitigationFileDetails.findOne({
            "entityId": req.body.company_search_details.result[0].entityId,
            "name": req.body.company_search_details.result[0].name,
            "type": 'advance'
        })

        if (foundLitigationFileDetails) {
            return res.send({ status: 'success', message: "Litigation BI File Details Fetched Successfully", data: foundLitigationFileDetails });
        }

        let data = JSON.stringify({
            "entityName": `${req.body.company_search_details.result[0].name}`,
            "countOnly": false,
            "entityRelation": "b",
            "dateType": "filingDate",
            "fuzziness": false,
            "advocateRelation": "b",
            "aggregationType": "date",
            "entityId": `${req.body.company_search_details.result[0].entityId}`,
            "searchType": "ENTITY",
            "pageSize": 20,
            "pageNo": 1,
            "ui_response": true,
            "version": 3,
            "section": "litigation",
            "exportType": "c",
            "excelSheet": "allRecords",
            "type": "advanced",
            "sheetSize": 2000
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v1/litigations/bi/all/excel',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': `_hjSessionUser_2171476=eyJpZCI6IjdiYmI4MWI0LWRmNTQtNTk3Zi1hNzY1LWUxOTYzNWIwOWQ4NiIsImNyZWF0ZWQiOjE3MDUwNTQxMDM3NDEsImV4aXN0aW5nIjp0cnVlfQ==; _ga_DGTVLJ1D8C=GS1.1.1708503382.2.1.1708503405.0.0.0; _hjSessionUser_2281971=eyJpZCI6ImJjZDAzYjhmLWMwYzAtNWNlNS04OGY3LTFhY2MyYTA2MjAwMCIsImNyZWF0ZWQiOjE3MDg1MDM0MTAyNDAsImV4aXN0aW5nIjpmYWxzZX0=; _ga_VBVF28KVSW=GS1.1.1708503410.1.1.1708503967.0.0.0; _ga_HFNPT4T9YF=GS1.1.1712727156.9.0.1712727163.0.0.0; _gid=GA1.2.1245526769.1716706481; _ga=GA1.1.1181110842.1705054103; k-token=782266b62552c6f97bb6657dee4249bb464dd065; st=90; dttk=${req.body.auth_details.token}; ksReNoG=; _gat_gtag_UA_149853712_5=1; _ga_H24S6XGS6G=GS1.1.1716750704.6.1.1716750776.0.0.0; _ga_XKLBW308PM=GS1.1.1716750704.6.1.1716750776.0.0.0; ${req.body.auth_details.setCookie}`,
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/litigation-bi?q=eyJlbnRpdHlOYW1lIjoiTE9CTyBTVEFGRklORyBTT0xVVElPTlMgUFJJVkFURSBMSU1JVEVEIiwic3RhcnREYXRlIjpudWxsLCJlbmREYXRlIjpudWxsLCJ1cGNvbWluZ1BlcmlvZCI6bnVsbCwicGVuZGluZ0Nhc2VUeXBlIjpudWxsLCJjb3VudE9ubHkiOmZhbHNlLCJyY25vIjoiIiwiY2FzZVN0YXR1cyI6IiIsImVudGl0eVJlbGF0aW9uIjoiYiIsInN0YXRlQ29kZSI6W10sImRhdGVUeXBlIjoiZmlsaW5nRGF0ZSIsImNvdXJ0VHlwZXMiOnt9LCJmdXp6aW5lc3MiOmZhbHNlLCJzZXZlcml0eSI6e30sImRpc3RyaWN0IjpbXSwieWVhciI6bnVsbCwibW9udGgiOm51bGwsImZpbGluZ0RhdGUiOiIiLCJkZWNpc2lvbkRhdGUiOiIiLCJuZXh0SGVhcmluZ0RhdGUiOiIiLCJhZHZvY2F0ZSI6IiIsImFkdm9jYXRlUmVsYXRpb24iOiJiIiwianVkZ2UiOiIiLCJjYXNlVHlwZUNhdGVnb3J5IjoiIiwiY2FzZVR5cGUiOiIiLCJjYXNlQWN0IjoiIiwiY2FzZVNlY3Rpb24iOiIiLCJzdGFnZU9mQ2FzZSI6IiIsImNvdXJ0Q29tcGxleCI6IiIsImNvdXJ0TnVtYmVyIjpudWxsLCJhZ2dyZWdhdGlvblR5cGUiOiJkYXRlIiwiY291cnRFc3RhYmxpc2htZW50IjoiIiwiZGlyZWN0b3JTZWFyY2hUeXBlIjoiYWxsIiwiZW50aXR5SWQiOiJVNzQxNDBNSDE5OTZQVEMxMDI2NDkiLCJwZXRpdGlvbmVyUmVzcG9uZGVudFBhcnR5IjoiIiwic2VhcmNoVHlwZSI6IkVOVElUWSIsImFkZHJlc3MiOiIiLCJraWQiOiJLQ08wMDAwMDg3NTg2NzBPIn0%3D&f=y5no4135qw',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'x-product': 'kscan'
            },
            data: data
        };

        axios.request(config)
            .then(async (response) => {

                let litigationAdvanceExcelFileDetails = {
                    entityId: req.body.company_search_details.result[0].entityId,
                    name: req.body.company_search_details.result[0].name,
                    type: 'advance',
                    litigationFileDetails: {
                        downloadLink: response.data.result.downloadLink
                    }
                }

                litigationAdvanceExcelFileDetails.createdAt = new Date()
                litigationAdvanceExcelFileDetails.createdTrno = Date.now()
                litigationAdvanceExcelFileDetails.updatedAt = new Date()
                litigationAdvanceExcelFileDetails.updatedTrno = Date.now()
                let saveLitigationFileDetails = new LitigationFileDetails(litigationAdvanceExcelFileDetails)
                await saveLitigationFileDetails.save()

                return res.send({ status: 'success', message: "Litigation BI File Details Fetched Successfully", data: litigationAdvanceExcelFileDetails });
            })
            .catch((error) => {
                return res.send({ status: 'karza_error', message: error.message });
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Get Litigation BI List
litigationBi.getLitigationBiListAll = async function (req, res) {
    try {

        if (
            !req.query.sort ||
            !req.query.order ||
            !req.query.page
        )
            return res.status(500).send('Missing requried fields');

        let query = {};
        let sort = {}, limit = 30;
        req.query.order === 'desc' ? sort[req.query.sort] = -1 : sort[req.query.sort] = 1;
        let skip = limit * (Number(req.query.page) - 1);

        if (req.query.searchText && req.query.searchText !== 'null') {
            query['$or'] = [
                { 'name': { $regex: req.query.searchText, $options: 'i' } },
                { 'entityId': req.query.searchText }
            ]
        }

        let total_count = await LitigationDetails.countDocuments(query);

        let litigationBiDetails = await LitigationDetails.aggregate([
            {
                $match: query
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'karza_mca_company_details',
                    localField: 'entityId',
                    foreignField: 'entityId',
                    as: 'karzaMcaDetails'
                }

            },
            { $unwind: '$karzaMcaDetails' },
            {
                $project: {
                    _id: 1,
                    entityId: 1,
                    name: 1,
                    updatedAt: 1,
                    directors: '$karzaMcaDetails.detailedDetails.directors'
                }
            }
        ]);

        return res.status(200).send({
            items: litigationBiDetails,
            total_count: total_count
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// Get Litigation Directors List
litigationBi.getLitigationDirctorsListAll = async function (req, res) {
    try {

        if (
            !req.query.companyId
        )
            return res.status(500).send('Missing requried fields');


        let litigationBiDirectorDetails = await KarzaMcaDetails.aggregate([
            {
                $match: { entityId: req.query.companyId }
            },
            {
                $project: {
                    _id: 1,
                    entityId: 1,
                    name: 1,
                    updatedAt: 1,
                    directors: '$detailedDetails.directors'
                }
            }
        ]);

        return res.status(200).send({
            data: litigationBiDirectorDetails.length > 0 ? litigationBiDirectorDetails[0] : {}
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// Save Lite Excel Data 
litigationBi.saveLitigationLiteExcelFileDetails = async function (req, res) {
    try {

        let foundLitigationFileDetails = await LitigationFileDetails.findOne({
            "entityId": req.body.company_search_details.result[0].entityId,
            "name": req.body.company_search_details.result[0].name,
            "type": 'lite'
        })

        if (foundLitigationFileDetails) {
            return res.send({ status: 'success', message: "Litigation BI File Details Fetched Successfully", data: foundLitigationFileDetails });
        }

        let data = JSON.stringify({
            "entityName": `${req.body.company_search_details.result[0].name}`,
            "countOnly": false,
            "entityRelation": "b",
            "dateType": "filingDate",
            "fuzziness": false,
            "advocateRelation": "b",
            "aggregationType": "date",
            "entityId": `${req.body.company_search_details.result[0].entityId}`,
            "searchType": "ENTITY",
            "pageSize": 20,
            "pageNo": 1,
            "ui_response": true,
            "version": 3,
            "section": "litigation",
            "exportType": "c",
            "excelSheet": "allRecords",
            "type": "lite",
            "sheetSize": 5000
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v1/litigations/bi/all/excel',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': `_hjSessionUser_2171476=eyJpZCI6IjdiYmI4MWI0LWRmNTQtNTk3Zi1hNzY1LWUxOTYzNWIwOWQ4NiIsImNyZWF0ZWQiOjE3MDUwNTQxMDM3NDEsImV4aXN0aW5nIjp0cnVlfQ==; _ga_DGTVLJ1D8C=GS1.1.1708503382.2.1.1708503405.0.0.0; _hjSessionUser_2281971=eyJpZCI6ImJjZDAzYjhmLWMwYzAtNWNlNS04OGY3LTFhY2MyYTA2MjAwMCIsImNyZWF0ZWQiOjE3MDg1MDM0MTAyNDAsImV4aXN0aW5nIjpmYWxzZX0=; _ga_VBVF28KVSW=GS1.1.1708503410.1.1.1708503967.0.0.0; _ga_HFNPT4T9YF=GS1.1.1712727156.9.0.1712727163.0.0.0; _gid=GA1.2.1245526769.1716706481; _ga=GA1.1.1181110842.1705054103; k-token=782266b62552c6f97bb6657dee4249bb464dd065; st=90; dttk=${req.body.auth_details.token}; ksReNoG=; _gat_gtag_UA_149853712_5=1; _ga_H24S6XGS6G=GS1.1.1716750704.6.1.1716750776.0.0.0; _ga_XKLBW308PM=GS1.1.1716750704.6.1.1716750776.0.0.0; ${req.body.auth_details.setCookie}`,
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/litigation-bi?q=eyJlbnRpdHlOYW1lIjoiTE9CTyBTVEFGRklORyBTT0xVVElPTlMgUFJJVkFURSBMSU1JVEVEIiwic3RhcnREYXRlIjpudWxsLCJlbmREYXRlIjpudWxsLCJ1cGNvbWluZ1BlcmlvZCI6bnVsbCwicGVuZGluZ0Nhc2VUeXBlIjpudWxsLCJjb3VudE9ubHkiOmZhbHNlLCJyY25vIjoiIiwiY2FzZVN0YXR1cyI6IiIsImVudGl0eVJlbGF0aW9uIjoiYiIsInN0YXRlQ29kZSI6W10sImRhdGVUeXBlIjoiZmlsaW5nRGF0ZSIsImNvdXJ0VHlwZXMiOnt9LCJmdXp6aW5lc3MiOmZhbHNlLCJzZXZlcml0eSI6e30sImRpc3RyaWN0IjpbXSwieWVhciI6bnVsbCwibW9udGgiOm51bGwsImZpbGluZ0RhdGUiOiIiLCJkZWNpc2lvbkRhdGUiOiIiLCJuZXh0SGVhcmluZ0RhdGUiOiIiLCJhZHZvY2F0ZSI6IiIsImFkdm9jYXRlUmVsYXRpb24iOiJiIiwianVkZ2UiOiIiLCJjYXNlVHlwZUNhdGVnb3J5IjoiIiwiY2FzZVR5cGUiOiIiLCJjYXNlQWN0IjoiIiwiY2FzZVNlY3Rpb24iOiIiLCJzdGFnZU9mQ2FzZSI6IiIsImNvdXJ0Q29tcGxleCI6IiIsImNvdXJ0TnVtYmVyIjpudWxsLCJhZ2dyZWdhdGlvblR5cGUiOiJkYXRlIiwiY291cnRFc3RhYmxpc2htZW50IjoiIiwiZGlyZWN0b3JTZWFyY2hUeXBlIjoiYWxsIiwiZW50aXR5SWQiOiJVNzQxNDBNSDE5OTZQVEMxMDI2NDkiLCJwZXRpdGlvbmVyUmVzcG9uZGVudFBhcnR5IjoiIiwic2VhcmNoVHlwZSI6IkVOVElUWSIsImFkZHJlc3MiOiIiLCJraWQiOiJLQ08wMDAwMDg3NTg2NzBPIn0%3D&f=y5no4135qw',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'x-product': 'kscan'
            },
            data: data
        };

        axios.request(config)
            .then(async (response) => {

                let litigationLiteExcelFileDetails = {
                    entityId: req.body.company_search_details.result[0].entityId,
                    name: req.body.company_search_details.result[0].name,
                    type: 'lite',
                    litigationFileDetails: {
                        downloadLink: response.data.result.downloadLink
                    }
                }

                litigationLiteExcelFileDetails.createdAt = new Date()
                litigationLiteExcelFileDetails.createdTrno = Date.now()
                litigationLiteExcelFileDetails.updatedAt = new Date()
                litigationLiteExcelFileDetails.updatedTrno = Date.now()
                let saveLitigationFileDetails = new LitigationFileDetails(litigationLiteExcelFileDetails)
                await saveLitigationFileDetails.save()

                return res.send({ status: 'success', message: "Litigation BI File Details Fetched Successfully", data: litigationLiteExcelFileDetails });
            })
            .catch((error) => {
                return res.send({ status: 'karza_error', message: error.message });
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Save Director Advanced Excel Data 
litigationBi.saveDirectorAdvancedExcelFileDetails = async function (req, res) {
    try {

        try {
            let litigationAuthDetails = await LitigationAuth.findOne({ "isExpired": false });
            if (!litigationAuthDetails) {
                litigationAuthDetails = await getAndSaveAuthToken();
            }
        } catch (error) {

        }

        let foundLitigationDirectorFileDetails = await LitigationDirectorFileDetails.findOne({
            "entityId": req.body.company_search_details.result[0].entityId,
            "name": req.body.company_search_details.result[0].name,
            "type": 'advance'
        })

        if (foundLitigationDirectorFileDetails) {
            return res.send({ status: 'success', message: "Litigation BI File Details Fetched Successfully", data: foundLitigationDirectorFileDetails });
        }

        let data = JSON.stringify({
            "entityName": `${req.body.company_search_details.result[0].name}`,
            "countOnly": false,
            "entityRelation": "b",
            "dateType": "filingDate",
            "fuzziness": false,
            "advocateRelation": "b",
            "aggregationType": "date",
            "entityId": `${req.body.company_search_details.result[0].entityId}`,
            "searchType": "ENTITY",
            "pageSize": 20,
            "pageNo": 1,
            "ui_response": true,
            "version": 3,
            "section": "litigation",
            "exportType": "c",
            "excelSheet": "allRecords",
            "type": "advanced",
            "sheetSize": 2000
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v1/litigations/bi/all/excel',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-type': 'application/json',
                'Cookie': `_hjSessionUser_2171476=eyJpZCI6IjdiYmI4MWI0LWRmNTQtNTk3Zi1hNzY1LWUxOTYzNWIwOWQ4NiIsImNyZWF0ZWQiOjE3MDUwNTQxMDM3NDEsImV4aXN0aW5nIjp0cnVlfQ==; _ga_DGTVLJ1D8C=GS1.1.1708503382.2.1.1708503405.0.0.0; _hjSessionUser_2281971=eyJpZCI6ImJjZDAzYjhmLWMwYzAtNWNlNS04OGY3LTFhY2MyYTA2MjAwMCIsImNyZWF0ZWQiOjE3MDg1MDM0MTAyNDAsImV4aXN0aW5nIjpmYWxzZX0=; _ga_VBVF28KVSW=GS1.1.1708503410.1.1.1708503967.0.0.0; _ga_HFNPT4T9YF=GS1.1.1712727156.9.0.1712727163.0.0.0; _gid=GA1.2.1245526769.1716706481; _ga=GA1.1.1181110842.1705054103; k-token=782266b62552c6f97bb6657dee4249bb464dd065; st=90; dttk=${req.body.auth_details.token}; ksReNoG=; _gat_gtag_UA_149853712_5=1; _ga_H24S6XGS6G=GS1.1.1716750704.6.1.1716750776.0.0.0; _ga_XKLBW308PM=GS1.1.1716750704.6.1.1716750776.0.0.0; ${req.body.auth_details.setCookie}`,
                'Origin': 'https://app.karza.in',
                'Referer': 'https://app.karza.in/kscan/litigation-bi?q=eyJlbnRpdHlOYW1lIjoiTE9CTyBTVEFGRklORyBTT0xVVElPTlMgUFJJVkFURSBMSU1JVEVEIiwic3RhcnREYXRlIjpudWxsLCJlbmREYXRlIjpudWxsLCJ1cGNvbWluZ1BlcmlvZCI6bnVsbCwicGVuZGluZ0Nhc2VUeXBlIjpudWxsLCJjb3VudE9ubHkiOmZhbHNlLCJyY25vIjoiIiwiY2FzZVN0YXR1cyI6IiIsImVudGl0eVJlbGF0aW9uIjoiYiIsInN0YXRlQ29kZSI6W10sImRhdGVUeXBlIjoiZmlsaW5nRGF0ZSIsImNvdXJ0VHlwZXMiOnt9LCJmdXp6aW5lc3MiOmZhbHNlLCJzZXZlcml0eSI6e30sImRpc3RyaWN0IjpbXSwieWVhciI6bnVsbCwibW9udGgiOm51bGwsImZpbGluZ0RhdGUiOiIiLCJkZWNpc2lvbkRhdGUiOiIiLCJuZXh0SGVhcmluZ0RhdGUiOiIiLCJhZHZvY2F0ZSI6IiIsImFkdm9jYXRlUmVsYXRpb24iOiJiIiwianVkZ2UiOiIiLCJjYXNlVHlwZUNhdGVnb3J5IjoiIiwiY2FzZVR5cGUiOiIiLCJjYXNlQWN0IjoiIiwiY2FzZVNlY3Rpb24iOiIiLCJzdGFnZU9mQ2FzZSI6IiIsImNvdXJ0Q29tcGxleCI6IiIsImNvdXJ0TnVtYmVyIjpudWxsLCJhZ2dyZWdhdGlvblR5cGUiOiJkYXRlIiwiY291cnRFc3RhYmxpc2htZW50IjoiIiwiZGlyZWN0b3JTZWFyY2hUeXBlIjoiYWxsIiwiZW50aXR5SWQiOiJVNzQxNDBNSDE5OTZQVEMxMDI2NDkiLCJwZXRpdGlvbmVyUmVzcG9uZGVudFBhcnR5IjoiIiwic2VhcmNoVHlwZSI6IkVOVElUWSIsImFkZHJlc3MiOiIiLCJraWQiOiJLQ08wMDAwMDg3NTg2NzBPIn0%3D&f=y5no4135qw',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'x-product': 'kscan'
            },
            data: data
        };

        axios.request(config)
            .then(async (response) => {

                let litigationAdvanceExcelFileDetails = {
                    entityId: req.body.company_search_details.result[0].entityId,
                    name: req.body.company_search_details.result[0].name,
                    type: 'advance',
                    litigationFileDetails: {
                        downloadLink: response.data.result.downloadLink
                    }
                }

                litigationAdvanceExcelFileDetails.createdAt = new Date()
                litigationAdvanceExcelFileDetails.createdTrno = Date.now()
                litigationAdvanceExcelFileDetails.updatedAt = new Date()
                litigationAdvanceExcelFileDetails.updatedTrno = Date.now()
                let saveLitigationFileDetails = new LitigationFileDetails(litigationAdvanceExcelFileDetails)
                await saveLitigationFileDetails.save()

                return res.send({ status: 'success', message: "Litigation BI File Details Fetched Successfully", data: litigationAdvanceExcelFileDetails });
            })
            .catch((error) => {
                return res.send({ status: 'karza_error', message: error.message });
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Download MCA Bulk Data
litigationBi.mcaCompanyBulkData = async function (req, res, next) {
    try {

        let litigationAuthDetails = await LitigationAuth.findOne({ "isExpired": false });
        if (!litigationAuthDetails) {
            litigationAuthDetails = await getAndSaveAuthToken();
        }

        documentsCount = await McaCompanyBulkDetails.countDocuments()

        for (let i = 0; i < documentsCount; i++) {

            let companyDetails = await McaCompanyBulkDetails.findOne({}).skip(i).limit(1);
            console.log(`${i + 1}. Fetching Company Details for CIN Number :: ${companyDetails['CIN']}`);
            
            let data = JSON.stringify({
                "id": `${companyDetails['CIN']}`,
                "filter": {
                    "name": null
                },
                "nameMatch": false,
                "entitySearch": true,
                "temporaryKid": false,
                "section": "litigation"
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://app.karza.in/dashboard/prod/api-wrapper/kscan/prod/v3/search/byIdOrName',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Content-type': 'application/json',
                    'Cookie': `_gid=GA1.2.1335970274.1716707509; _gat_gtag_UA_149853712_5=1; _ga=GA1.1.1421116793.1716707509; k-token=3ecee8b29d3ff5fe805b8b5a1dca0912349719c5; st=90; dttk=${litigationAuthDetails.token}; _ga_H24S6XGS6G=GS1.1.1716707508.1.1.1716707521.0.0.0; ${litigationAuthDetails.setCookie}`,
                    'Origin': 'https://app.karza.in',
                    'Referer': 'https://app.karza.in/kscan/litigation-bi',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                    'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'x-product': 'kscan'
                },
                data: data
            };

            try {

                let response = await axios.request(config);
                let companyResponseDetails = {};
                if (Array.isArray(response.data.result)) {
                    companyResponseDetails = response.data.result[0];
                }

                await McaCompanyBulkDetails.findByIdAndUpdate(companyDetails._id, {
                    "name": companyResponseDetails.name ? companyResponseDetails.name : 'NA',
                    "status": companyResponseDetails.status ? companyResponseDetails.status : 'NA',
                    "type": companyResponseDetails.type ? companyResponseDetails.type : 'NA'
                })


            } catch (error) {
                await LitigationAuth.findOneAndUpdate({}, { "isExpired": true })
                return res.send({ status: 'karza_error', message: error.message });
            }
        }

        return res.send({ status: 'success', message: "Company Details Fetched Successfully" });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}