var axios = require('axios');
const Fs = require('fs')
const Path = require('path');
const htmlparser2 = require('htmlparser2');
const qs = require('qs');
const XLSX = require('xlsx');
const https = require('https');
const MCA = require('../models/mca-company');
const SAVEDMCA = require('../models/save-mca-company');
const ObjectID = require('mongodb').ObjectID;
const cheerio = require("cheerio");

const mca = module.exports;

const agent = new https.Agent({
    rejectUnauthorized: false,
});

let companyFirstTabDetails = false,
    currentTabInWork = '',
    firstTabData = [],
    companySecondTabDetails = false,
    secondTabData = [],
    companyThirdTabDetails = false,
    thirdTabData = [];

let indexFirstTableDetails = false,
    indexCurrentTabInWork = '',
    indexHeaderData = [],
    indexTableData = [];

const mcaCompanyDetailsParser = new htmlparser2.Parser({

    onopentag(name, attribs) {
        if (name === 'table' && attribs.class === 'result-forms' && attribs.id === 'resultTab1') {
            currentTabInWork = 'firstTab';
            companyFirstTabDetails = true;
        }

        if (name === 'table' && attribs.class === 'result-forms' && attribs.id === 'resultTab5') {
            currentTabInWork = 'secondTab';
            companySecondTabDetails = true;
        }

        if (name === 'table' && attribs.class === 'result-forms' && attribs.id === 'resultTab6') {
            currentTabInWork = 'thirdTab';
            companyThirdTabDetails = true;
        }

    },

    ontext(text) {

        if (companyFirstTabDetails) {

            if (text) {
                firstTabData.push(text)
            }

        }

        if (companySecondTabDetails) {

            if (text) {
                secondTabData.push(text)
            }

        }

        if (companyThirdTabDetails) {

            if (text) {
                if (text.indexOf('\n') === -1) {
                    thirdTabData.push(text)
                }

            }

        }

    },

    onclosetag(tagname) {

        if (tagname === 'table') {

            console.log(currentTabInWork);

            currentTabInWork === 'firstTab' ? companyFirstTabDetails = false :
                currentTabInWork === 'secondTab' ? companySecondTabDetails = false :
                    currentTabInWork === 'thirdTab' ? companyThirdTabDetails = false : '';

            currentTabInWork = '';

        }

    }

}, { decodeEntities: true })

const companyIndexOfChargesDetailsParser = new htmlparser2.Parser({

    onopentag(name, attribs) {
        if (name === 'table' && attribs.class === 'result-forms' && attribs.id === 'charges' && attribs.name === 'charges') {
            indexCurrentTabInWork = 'firstTab';
            indexFirstTableDetails = true;
        }

    },

    ontext(text) {

        if (indexFirstTableDetails) {

            if (text) {

                if (!text.startsWith("\r")) {
                    if (text.trim() === 'CERSAI') {
                        indexFirstTableDetails = false;
                    }
                    indexTableData.push(text);

                }
            }

        }
    },

    onclosetag(tagname) {

        if (tagname === 'table') {

            indexCurrentTabInWork = '';

        }

    }

}, { decodeEntities: true })

mca.getMcaCookies = function getMcaCookies(req, res, next) {
    try {

        var config = {
            method: 'get',
            httpsAgent: agent,
            url: 'https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do',
            headers: {
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'Referer': 'https://www.mca.gov.in/MinistryV2/aboutmasterdata.html',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'HttpOnly; cookiesession1=678B2874123456788901234ABCEF1188; JSESSIONID=0000DV2YqEuSegrSUIUvUGq59tw:1ae7156lo; HttpOnly; JSESSIONID=0000enZIo0H6B1vbSSE8gMJ12_k:1944eaeq6; cookiesession1=678B2874JKLMNOPTUVXYZABCDEFG0FFC'
            }
        };

        axios(config)
            .then(function (response) {
                if (response.headers['set-cookie']) {

                    let cookie = response.headers['set-cookie'][0];
                    cookie = (cookie.substring(cookie.indexOf("JSESSIONID=") + 11, cookie.indexOf("Path=/") - 2)).trim();
                    req.body.cookie = cookie;

                    return next();

                } else {
                    return res.send({ status: "error", message: "Unable to process request" });
                }
            })
            .catch(function (error) {
                return res.send({ status: "error", message: error.message });
            });

    } catch (error) {
        return res.send({ status: "error", message: error.message });
    }
}

mca.getMcaCaptcha = async function getMcaCaptcha(req, res, next) {
    try {

        const path = Path.resolve(__dirname, 'images', 'code.jpg')
        const writer = Fs.createWriteStream(path);

        var config = {
            method: 'get',
            url: 'https://www.mca.gov.in/mcafoportal/getCapchaImage.do',
            responseType: 'stream',
            headers: {
                'Connection': 'keep-alive',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                'sec-ch-ua-mobile': '?0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
                'sec-ch-ua-platform': '"Windows"',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Dest': 'image',
                'Referer': 'https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': `HttpOnly; JSESSIONID=${req.body.cookie}; HttpOnly; JSESSIONID=${req.body.cookie}`
            }
        };

        axios(config)
            .then(function (response) {

                response.data.pipe(writer);
                return new Promise((resolve, reject) => {
                    writer.on('finish', () => { req.body.path = Path.resolve(__dirname, 'images', 'code.jpg'); next(); resolve(); })
                    writer.on('error', () => { /* Add your code here */ reject(); })
                })
            })
            .catch(function (error) {
                console.log(error);
            });

    } catch (error) {
        return res.send({ status: "error", message: error.message });
    }
}

// mca.getMcaCaptchaRefresh = async function getMcaCaptchaRefresh(req, res, next) {
//     try {
//         let randomValue = 0.20033679695561002;
//         var config = {
//             method: 'get',
//             url: `https://www.mca.gov.in/mcafoportal/getCapchaImage.do?id=${randomValue}`,
//             headers: {
//                 'Connection': 'keep-alive',
//                 'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
//                 'sec-ch-ua-mobile': '?0',
//                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
//                 'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
//                 'Sec-Fetch-Site': 'same-origin',
//                 'Sec-Fetch-Mode': 'no-cors',
//                 'Sec-Fetch-Dest': 'image',
//                 'Referer': 'https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do',
//                 'Accept-Language': 'en-US,en;q=0.9',
//                 'Cookie': `HttpOnly; JSESSIONID=${req.body.cookie}; alertPopup=true;`
//             }
//         };

//         await axios(config);

//         // axios(config)
//         //     .then(function (response) {
//         //         var pixMap = captcha.getPixelMapFromBuffer(response.data);
//         //         console.log(captcha.getCaptcha(pixMap));
//         //     })
//         //     .catch(function (error) {
//         //         console.log(error);
//         //     });
//         req.body.randomValue = randomValue;
//         return next();

//     } catch (error) {
//         return res.send({ status: "error", message: error.message });
//     }
// }

mca.getMcaRandomValueAndCookies = async function getMcaRandomValueAndCookies(req, res) {
    try {


        let fileData = Fs.readFileSync(req.body.path, 'base64');
        const dataUrl = `data:image/jpeg;base64, ${fileData}`;

        return res.send({
            status: "success", message: "MCA Capcha Url", data: {
                // imageUrl: `https://www.mca.gov.in/mcafoportal/getCapchaImage.do`,
                imageData: dataUrl,
                cookie: req.body.cookie
            }
        });

    } catch (error) {
        return res.send({ status: "error", message: error.message });
    }
}

mca.getCompanyDetails = async function getCompanyDetails(req, res) {
    try {

        var data = qs.stringify({
            'companyName': '',
            'companyID': 'U74899DL1991PTC043217'
        });

        console.log(data)

        var config = {
            method: 'post',
            url: 'https://www.mca.gov.in/mcafoportal/companyLLPMasterData.do',
            headers: {
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1',
                'Origin': 'https://www.mca.gov.in',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'Referer': 'https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'HttpOnly; JSESSIONID=0000RADGaDnIXWYw1R_nYRuHgTn:1bp6g5oug'
            },
            data: data
        };

        let companyDetailsPageLoad = await axios(config);

        mcaCompanyDetailsParser.write(companyDetailsPageLoad.data);
        mcaCompanyDetailsParser.end();

        let returnObject = {
            firstTabData: {
                heading: [],
                value: []
            },
            secondTabData: {
                isAnyCharges: true,
                chargeValue: 'No Charges Exists for Company/LLP',
                heading: [],
                value: []
            },
            thirdTabData: {
                headers: [],
                value: []
            }
        }

        /** 
         * Parsed First Tab Data Started
         */

        let firstTabParsedMapping = {
            headingName: [2, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 74, 80, 86, 92, 97, 103, 109, 115],
            headingValue: [5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 70, 76, 82, 88, 94, 99, 105, 111, 117]
        }

        for (let i = 0; i < firstTabParsedMapping.headingName.length; i++) {

            if (i === 11) {
                let filterValue = firstTabData[firstTabParsedMapping.headingName[i]].substr(0, firstTabData[firstTabParsedMapping.headingName[i]].indexOf('Address') + 7);
                firstTabData[firstTabParsedMapping.headingName[i]] = filterValue;
            }

            if (i === 15) {

                firstTabData[firstTabParsedMapping.headingValue[i]] = firstTabData[firstTabParsedMapping.headingValue[i]].replace(/(\r\n|\n|\r)/gm, "");
            }

            returnObject.firstTabData[firstTabData[firstTabParsedMapping.headingName[i]]] = firstTabData[firstTabParsedMapping.headingValue[i]];
            returnObject.firstTabData.heading.push(firstTabData[firstTabParsedMapping.headingName[i]]);
            returnObject.firstTabData.value.push(firstTabData[firstTabParsedMapping.headingValue[i]]);
        }

        /** 
         * Parsed First Tab Data Ended
         */

        /** 
         * Parsed Second Tab Data Started
         */

        let secondTabParsedMapping = {
            headingName: [2, 4, 6, 8, 10],
            headingValue: []
        }

        if (secondTabData[14] === 'No Charges Exists for Company/LLP') {
            returnObject.secondTabData.isAnyCharges = false;
        }

        for (let i = 0; i < secondTabParsedMapping.headingName.length; i++) {

            if (!returnObject.secondTabData.isAnyCharges) {

                returnObject.secondTabData[secondTabData[secondTabParsedMapping.headingName[i]]] = '';
                returnObject.secondTabData.heading.push(secondTabData[secondTabParsedMapping.headingName[i]]);

            }

        }

        /** 
         * Parsed Second Tab Data Ended
         */

        /** 
         * Parsed Third Tab Data Started
         */

        /** 
         * Parsed Third Tab Data Header Started
         */

        for (let i = 0; i <= 4; i++) {
            returnObject.thirdTabData.headers.push(thirdTabData[i])
        }

        /** 
         * Parsed Third Tab Data Header Ended
         */

        /** 
         * Parsed Third Tab Data Value Started
         */
        let thirdParsedValueObj = {}, objArrayValue = ['din', 'name', 'beginDate', 'endDate', 'surrenderedDin'], finalThirdtabResult = [];

        for (let i = 5; i < thirdTabData.length; i++) {

            if (isNaN(thirdTabData[i])) {

                let savedObjKey = Object.keys(thirdParsedValueObj);
                let attributeIndex = objArrayValue.indexOf(savedObjKey[savedObjKey.length - 1]);
                thirdParsedValueObj[objArrayValue[attributeIndex + 1]] = thirdTabData[i];

            } else {

                if (i > 5) {
                    returnObject.thirdTabData.value.push(thirdParsedValueObj);
                }

                thirdParsedValueObj = {};
                thirdParsedValueObj['din'] = thirdTabData[i];

            }

            if (i === thirdTabData.length - 1) {
                returnObject.thirdTabData.value.push(thirdParsedValueObj);
                thirdParsedValueObj = {}
            }
            // returnObject.thirdTabData.headers.push(thirdTabData[i])
        }

        /** 
         * Parsed Third Tab Data Value Ended
         */

        /** 
         * Parsed Third Tab Data Header Ended
         */

        return res.send({ status: 'success', message: 'Data Fetched Successfully', data: returnObject });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// MCA Details Started
mca.getMcaExcelFile = async function getMcaExcelFile(req, res, next) {
    try {

        if (!req.body.jwtInfo.jwtId)
            return res.send({ status: 'error', message: 'You are not authorized to place request.' });

        if (!req.body.companyId)
            return res.send({ status: 'error', message: 'Missing Required Fields.' });

        let companyId = req.body.companyId;

        if (!Fs.existsSync(Path.resolve(__dirname, `files/${req.body.jwtInfo.jwtId}/${companyId}`))) {
            Fs.mkdirSync(Path.resolve(__dirname, `files/${req.body.jwtInfo.jwtId}/${companyId}`), { recursive: true });
        }

        const path = Path.resolve(__dirname, `files/${req.body.jwtInfo.jwtId}/${companyId}`, 'details.xlsx');
        const writer = Fs.createWriteStream(path);

        var data = qs.stringify({
            'altScheme': 'CIN',
            'companyID': req.body.companyId,
            // 'companyName': 'PAYTM+MOBILE+SOLUTIONS+PRIVATE+LIMITED'
        });
        var config = {
            method: 'post',
            httpsAgent: agent,
            responseType: 'stream',
            url: 'https://www.mca.gov.in/mcafoportal/exportCompanyMasterData.do',
            headers: {
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Upgrade-Insecure-Requests': '1',
                'Origin': 'https://www.mca.gov.in',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-User': '?1',
                'Sec-Fetch-Dest': 'document',
                'Referer': 'https://www.mca.gov.in/mcafoportal/companyLLPMasterData.do',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'HttpOnly; alertPopup=true; cookiesession1=678B2874123456788901234ABCEF1188; JSESSIONID=0000mqniQKKUObjaoBUHJMfmkXT:1aevgiefc; HttpOnly; JSESSIONID=0000pX_xuQjEhBf3PPlTPNvkg9m:1bp6g5oug; cookiesession1=678B2874JKLMNOPTUVXYZABCDEFG0FFC'
                // 'Cookie': `HttpOnly; alertPopup=true; JSESSIONID=${req.body.cookie}; HttpOnly; JSESSIONID=${req.body.cookie};`
            },
            data: data
        };

        axios(config)
            .then(function (response) {
                response.data.pipe(writer);
                return new Promise((resolve, reject) => {
                    writer.on('finish', () => {
                        req.body.companyId = companyId;
                        req.body.filePath = Path.resolve(__dirname, `files/${req.body.jwtInfo.jwtId}/${companyId}`, 'details.xlsx');
                        req.body.deleteFilePath = Path.resolve(__dirname, `files/${req.body.jwtInfo.jwtId}/${companyId}`);
                        next();
                        resolve();
                    })
                    writer.on('error', () => { res.send({ status: 'error', message: 'Something Went Wrong' }); reject(); })
                })
            })
            .catch(function (error) {
                return res.send({ status: 'error', message: error.message })
            });


    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Parsed MCA File
mca.parseMcaExcelFile = async function parseMcaExcelFile(req, res, next) {
    try {

        let workbook = XLSX.readFile(req.body.filePath);
        let sheet_name_list = workbook.SheetNames;
        let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        if (data.length === 0)
            return res.send({ status: 'error', message: 'Some Error Occurred. Please Check The MCA Website.' });

        let returnData = {
            firstTabData: {
                headerDetails: [],
                value: [],
                payloadData: {}
            },
            secondTabData: {
                tableHeaderDetails: [],
                isAnyCharges: true,
                value: [],
                noChargeValue: 'No Charges Exists for Company/LLP'
            },
            thirdTabData: {
                tableHeaderDetails: [],
                value: [],
            }
        }

        let ifLLp = false;
        JSON.stringify(data).search('LLP Master Data') > -1 ? ifLLp = true : '';

        if (ifLLp) {

            let secondTabIndex = data.map((item) => {
                return item['LLP Master Data'];
            }).indexOf('Charges');

            let thirdTabIndex = data.map((item) => {
                return item['LLP Master Data'];
            }).indexOf('Directors/Signatory Details');

            /**
             * Parsed First Tab Data Started
             */

            for (let i = 0; i < secondTabIndex; i++) {
                returnData.firstTabData.payloadData[data[i]['LLP Master Data']] = data[i]['__EMPTY_1'];
                returnData.firstTabData.headerDetails.push(data[i]['LLP Master Data']);
                returnData.firstTabData.value.push(data[i]['__EMPTY_1']);
            }

            /**
             * Parsed First Tab Data Ended
             */

            /**
             * Parsed Second Tab Data Started
             */

            for (let i = secondTabIndex + 1; i < thirdTabIndex; i++) {

                if (i === secondTabIndex + 1) {

                    for (let key in data[secondTabIndex + 1]) {
                        returnData.secondTabData.tableHeaderDetails.push(data[secondTabIndex + 1][key])
                    }

                } else {

                    if (thirdTabIndex - secondTabIndex === 3) {

                        if (data[i]['LLP Master Data'] === 'No Charges Exists for Company/LLP') {
                            returnData.secondTabData.isAnyCharges = false;
                        } else {
                            let thirdTabData = {
                                assetsUnderCharges: data[i]['LLP Master Data'] ? data[i]['LLP Master Data'] : 'N/A',
                                chargeAmt: data[i]['__EMPTY'] ? data[i]['__EMPTY'] : 'N/A',
                                dateOfCreation: data[i]['__EMPTY_1'] ? data[i]['__EMPTY_1'] : 'N/A',
                                dateOfModify: data[i]['__EMPTY_2'] ? data[i]['__EMPTY_2'] : 'N/A',
                                status: data[i]['__EMPTY_3'] ? data[i]['__EMPTY_3'] : 'N/A',
                            }

                            returnData.secondTabData.value.push(thirdTabData);
                        }


                    } else {

                        let thirdTabData = {
                            assetsUnderCharges: data[i]['LLP Master Data'] ? data[i]['LLP Master Data'] : 'N/A',
                            chargeAmt: data[i]['__EMPTY'] ? data[i]['__EMPTY'] : 'N/A',
                            dateOfCreation: data[i]['__EMPTY_1'] ? data[i]['__EMPTY_1'] : 'N/A',
                            dateOfModify: data[i]['__EMPTY_2'] ? data[i]['__EMPTY_2'] : 'N/A',
                            status: data[i]['__EMPTY_3'] ? data[i]['__EMPTY_3'] : 'N/A',
                        }

                        returnData.secondTabData.value.push(thirdTabData);

                    }

                }

            }

            /**
             * Parsed Second Tab Data Ended
             */

            /**
             * Parsed Third Tab Data Started
             */

            for (let i = thirdTabIndex + 1; i < data.length; i++) {

                if (i === thirdTabIndex + 1) {

                    for (let key in data[thirdTabIndex + 1]) {
                        returnData.thirdTabData.tableHeaderDetails.push(data[thirdTabIndex + 1][key])
                    }

                } else {

                    let tableValue = {
                        din: data[i]['LLP Master Data'],
                        name: data[i]['__EMPTY'],
                        beginDate: data[i]['__EMPTY_1'],
                        endDate: data[i]['__EMPTY_2']
                    }

                    returnData.thirdTabData.value.push(tableValue);

                }


            }

            /**
             * Parsed Third Tab Data Ended
             */

        } else {

            let secondTabIndex = data.map((item) => {
                return item['Company Master Data'];
            }).indexOf('Charges');

            let thirdTabIndex = data.map((item) => {
                return item['Company Master Data'];
            }).indexOf('Directors/Signatory Details');



            /**
             * Parsed First Tab Data Started
             */

            for (let i = 0; i < secondTabIndex; i++) {
                returnData.firstTabData.payloadData[data[i]['Company Master Data']] = data[i]['__EMPTY_1'];
                returnData.firstTabData.headerDetails.push(data[i]['Company Master Data']);
                returnData.firstTabData.value.push(data[i]['__EMPTY_1']);
            }

            /**
             * Parsed First Tab Data Ended
             */

            /**
             * Parsed Second Tab Data Started
             */

            for (let i = secondTabIndex + 1; i < thirdTabIndex; i++) {

                if (i === secondTabIndex + 1) {

                    for (let key in data[secondTabIndex + 1]) {
                        returnData.secondTabData.tableHeaderDetails.push(data[secondTabIndex + 1][key])
                    }

                } else {

                    if (thirdTabIndex - secondTabIndex === 3) {

                        if (data[i]['Company Master Data'] === 'No Charges Exists for Company/LLP') {
                            returnData.secondTabData.isAnyCharges = false;
                        } else {
                            let thirdTabData = {
                                assetsUnderCharges: data[i]['Company Master Data'] ? data[i]['Company Master Data'] : 'N/A',
                                chargeAmt: data[i]['__EMPTY'] ? data[i]['__EMPTY'] : 'N/A',
                                dateOfCreation: data[i]['__EMPTY_1'] ? data[i]['__EMPTY_1'] : 'N/A',
                                dateOfModify: data[i]['__EMPTY_2'] ? data[i]['__EMPTY_2'] : 'N/A',
                                status: data[i]['__EMPTY_3'] ? data[i]['__EMPTY_3'] : 'N/A',
                            }

                            returnData.secondTabData.value.push(thirdTabData);
                        }


                    } else {

                        let thirdTabData = {
                            assetsUnderCharges: data[i]['Company Master Data'] ? data[i]['Company Master Data'] : 'N/A',
                            chargeAmt: data[i]['__EMPTY'] ? data[i]['__EMPTY'] : 'N/A',
                            dateOfCreation: data[i]['__EMPTY_1'] ? data[i]['__EMPTY_1'] : 'N/A',
                            dateOfModify: data[i]['__EMPTY_2'] ? data[i]['__EMPTY_2'] : 'N/A',
                            status: data[i]['__EMPTY_3'] ? data[i]['__EMPTY_3'] : 'N/A',
                        }

                        returnData.secondTabData.value.push(thirdTabData);

                    }

                }

            }

            /**
             * Parsed Second Tab Data Ended
             */


            /**
             * Parsed Third Tab Data Started
             */

            for (let i = thirdTabIndex + 1; i < data.length; i++) {

                if (i === thirdTabIndex + 1) {

                    for (let key in data[thirdTabIndex + 1]) {
                        returnData.thirdTabData.tableHeaderDetails.push(data[thirdTabIndex + 1][key])
                    }

                } else {

                    let tableValue = {
                        din: data[i]['Company Master Data'],
                        name: data[i]['__EMPTY'],
                        beginDate: data[i]['__EMPTY_1'],
                        endDate: data[i]['__EMPTY_2']
                    }

                    returnData.thirdTabData.value.push(tableValue);

                }


            }

            /**
             * Parsed Third Tab Data Ended
             */

        }

        Fs.unlinkSync(req.body.filePath);
        Fs.rmdirSync(req.body.deleteFilePath, { recursive: true, force: true });

        req.body.mcaData = returnData;
        next();

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Get MCA Details
mca.getMcaDetails = async function getMcaDetails(req, res, next) {
    try {

        var data = qs.stringify({
            companyID: req.body.companyId,
        });

        var config = {
            method: "post",
            url: "https://www.mca.gov.in/mcafoportal/companyLLPMasterData.do",
            headers: {
                authority: "www.mca.gov.in",
                "cache-control": "max-age=0",
                "sec-ch-ua":
                    '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "upgrade-insecure-requests": "1",
                origin: "https://www.mca.gov.in",
                "content-type": "application/x-www-form-urlencoded",
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
                accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "sec-fetch-site": "same-origin",
                "sec-fetch-mode": "navigate",
                "sec-fetch-user": "?1",
                "sec-fetch-dest": "document",
                referer:
                    "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do",
                "accept-language": "en-US,en;q=0.9",
                cookie:
                    "HttpOnly; JSESSIONID=0000tGqbDZO2TGOVWOTZpwwFnZn:1esaukip7; HttpOnly",
            },
            data: data,
        };

        axios(config).then((response) => {
            const html = response.data;
            const $ = cheerio.load(html);
            CIN = $(
                "#resultTab1 > tbody > tr:nth-child(1) > td:nth-child(2)"
            ).text();
            companyName = $(
                " #resultTab1 > tbody > tr:nth-child(2) > td:nth-child(2)"
            ).text();
            ROC_code = $(
                "#resultTab1 > tbody > tr:nth-child(3) > td:nth-child(2)"
            ).text();
            registerationNumber = $(
                "#resultTab1 > tbody > tr:nth-child(3) > td:nth-child(2)"
            ).text();
            companyCategory = $(
                "#resultTab1 > tbody > tr:nth-child(5) > td:nth-child(2)"
            ).text();
            companySubCatergory = $(
                "#resultTab1 > tbody > tr:nth-child(6) > td:nth-child(2)"
            ).text();
            classOfCompany = $(
                "#resultTab1 > tbody > tr:nth-child(7) > td:nth-child(2)"
            ).text();
            authorisedCapital = $(
                "#resultTab1 > tbody > tr:nth-child(8) > td:nth-child(2)"
            ).text();
            paidUpCapitals = $(
                "#resultTab1 > tbody > tr:nth-child(9) > td:nth-child(2)"
            ).text();
            noOfMembers = $(
                "#resultTab1 > tbody > tr:nth-child(10) > td:nth-child(2)"
            ).text();
            dateOfIncorporatio = $(
                "#resultTab1 > tbody > tr:nth-child(11) > td:nth-child(2)"
            ).text();
            registeredAddress = $(
                "#resultTab1 > tbody > tr:nth-child(12) > td:nth-child(2)"
            ).text();
            adressOtherThanRO = $(
                "#resultTab1 > tbody > tr:nth-child(13) > td:nth-child(2)"
            ).text();
            emailID = $(
                "#resultTab1 > tbody > tr:nth-child(14) > td:nth-child(2)"
            ).text();
            wheterListeOrNot = $(
                "#resultTab1 > tbody > tr:nth-child(15) > td:nth-child(2)"
            ).text();
            ACTIVECompliance = $(
                "#resultTab1 > tbody > tr:nth-child(16) > td:nth-child(2)"
            ).text();
            suspendedAtStockExchange = $(
                "#resultTab1 > tbody > tr:nth-child(17) > td:nth-child(2)"
            ).text();
            dateOfLastAGM = $(
                "#resultTab1 > tbody > tr:nth-child(18) > td:nth-child(2)"
            ).text();
            dateOfBalanceSheet = $(
                "#resultTab1 > tbody > tr:nth-child(19) > td:nth-child(2)"
            ).text();
            companyStatus = $(
                "#resultTab1 > tbody > tr:nth-child(20) > td:nth-child(2)"
            ).text();

            var dateParts = dateOfIncorporatio.split("/");
            var checkindate = new Date(
                dateParts[2],
                dateParts[1] - 1,
                dateParts[0]
            );
            var now = new Date();
            var difference = now - checkindate;
            var days = difference / (1000 * 60 * 60 * 24);
            const years = days / 365;
            no_of_years = parseFloat(years).toFixed(2);

            const age = `${no_of_years} years- (${dateOfIncorporatio})`;

            mcaBasicDetails = {
                "CIN": CIN,
                "Company / LLP Name": companyName,
                "ROC Code": ROC_code,
                "Registration Number": registerationNumber,
                "Company Category": companyCategory,
                "Company SubCategory": companySubCatergory,
                "Class of Company": classOfCompany,
                "Authorised Capital(Rs)": authorisedCapital,
                "Paid up Capital(Rs)": paidUpCapitals,
                "Number of Members(Applicable in case of company without Share Capital)": noOfMembers,
                "Date of Incorporation": dateOfIncorporatio,
                "Registered Address": registeredAddress,
                "Address other than R/o where all or any books of account and papers are maintained": adressOtherThanRO,
                "Email Id": emailID,
                "Whether Listed or not": wheterListeOrNot,
                "ACTIVE compliance": ACTIVECompliance,
                "Suspended at stock exchange": suspendedAtStockExchange,
                "Date of last AGM": dateOfLastAGM,
                "Date of Balance Sheet": dateOfBalanceSheet,
                "Company Status(for efiling)": companyStatus,
                "Age": age,
            };

            // Get Charges Header Values
            getChargesHeaders = [], chargesValue = [];
            for (let i = 1; i < 6; i++) {
                getChargesHeaders.push(
                    $(
                        `#resultTab5 > tbody > tr:nth-child(1) > th:nth-child(${i})`
                    ).text()
                );
            }

            // Fetch Charges if exists
            for (let i = 1; i++;) {

                if ($(
                    `#resultTab5 > tbody > tr:nth-child(${i}) > td:nth-child(1)`
                ).text().trim().length === 0) {
                    break;
                }
                let chargeValueObj = {};

                for (let j = 1; j < 6; j++) {
                    chargeValueObj[`${getChargesHeaders[j - 1]}`] = $(
                        `#resultTab5 > tbody > tr:nth-child(${i}) > td:nth-child(${j})`
                    ).text().trim()
                }
                chargesValue.push(chargeValueObj);
            }

            // Get Signatory MCA Details
            getSignatoryMcaHeaders = [], getSignatoryMcaDetails = [];

            for (let i = 1; i < 6; i++) {
                getSignatoryMcaHeaders.push(
                    $(
                        `#resultTab6 > tbody > tr:nth-child(1) > th:nth-child(${i})`
                    ).text()
                );
            }

            // Fetch Signatory Details if exists
            for (let i = 1; i++;) {

                if ($(
                    `#resultTab6 > tbody > tr:nth-child(${i}) > td:nth-child(1)`
                ).text().trim().length === 0) {
                    break;
                }
                let signatoryMcaObj = {};

                for (let j = 1; j < 6; j++) {
                    signatoryMcaObj[`${getSignatoryMcaHeaders[j - 1]}`] = $(
                        `#resultTab6 > tbody > tr:nth-child(${i}) > td:nth-child(${j})`
                    ).text().trim()
                }
                getSignatoryMcaDetails.push(signatoryMcaObj);
            }

            req.body.mcaData = {
                companyData: mcaBasicDetails,
                charges: {
                    headers: getChargesHeaders,
                    data: chargesValue
                },
                signatoryMcaDetails: {
                    headers: getSignatoryMcaHeaders,
                    data: getSignatoryMcaDetails
                }
            };
            next();
        }).catch((error) => {
            return res.send({ status: 'error', message: error.message });
        });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Add Index Of Charges
mca.addIndexOfCharges = async function addIndexOfCharges(req, res, next) {
    try {

        let data = qs.stringify({
            'companyName': '',
            'companyID': `${req.body.companyId}`,
            'displayCaptcha': 'false'
        });

        let config = {
            method: 'post',
            url: 'https://www.mca.gov.in/mcafoportal/viewIndexOfCharges.do',
            headers: {
                'authority': 'www.mca.gov.in',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'content-type': 'application/x-www-form-urlencoded',
                'cookie': 'HttpOnly; cookiesession1=678B2873TUWXYZABCDEFGJKLMOPQC253; JSESSIONID=0000GYypGc1MTE14p4MstvLtFLf:1ave0turu; HttpOnly',
                'origin': 'https://www.mca.gov.in',
                'referer': 'https://www.mca.gov.in/mcafoportal/showIndexOfCharges.do',
                'sec-ch-ua': '"Chromium";v="112", "Google Chrome";v="112", "Not:A-Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
            },
            data: data
        };

        axios(config)
            .then(function (response) {

                let indexObjValue = [];

                companyIndexOfChargesDetailsParser.write(response.data);
                companyIndexOfChargesDetailsParser.end();

                if (indexTableData.length === 0) {
                    req.body.indexHeaderData = indexHeaderData;
                    req.body.indexObjValue = indexObjValue;

                } else {

                    let indexResponse = response.data.toString();

                    let individualCharges = [], seperator = 2, lastSeprator = 0;

                    indexTableData.pop();
                    indexTableData.shift();

                    indexHeaderData = indexTableData.slice(0, indexTableData.indexOf('Address') + 1);
                    indexTableData = indexTableData.slice(indexTableData.indexOf('Address') + 1, indexTableData.length);

                    for (let i = 0; i < indexTableData.length; i++) {

                        if (indexTableData[i] == seperator.toString()) {
                            seperator = seperator + 1;
                            individualCharges.push(indexTableData.slice(lastSeprator, i));
                            lastSeprator = i;
                        }

                    }
                    let lastIndex = indexTableData.indexOf((seperator - 1).toString())
                    individualCharges.push(indexTableData.slice(lastIndex, indexTableData.length))

                    for (let individual of individualCharges) {

                        let individualChargesObj = {};

                        if (individual.length == 9) {

                            for (let j = 0; j < individual.length; j++) {
                                individualChargesObj[`${indexHeaderData[j]}`] = individual[j];
                            }

                        } else {

                            let realArray = individual.slice(0, 8)
                            let address = '';
                            let concatAddress = individual.slice(8, individual.length);
                            realArray.push(address.concat(concatAddress));

                            for (let j = 0; j < realArray.length; j++) {
                                individualChargesObj[`${indexHeaderData[j]}`] = realArray[j];
                            }
                        }

                        let srnIndex = indexResponse.search(individualChargesObj['SRN']);
                        let classSubstring = indexResponse.substring(srnIndex - 40, srnIndex + 20);

                        classSubstring.search("indexGreen") > -1 ? individualChargesObj["class"] = "green" :
                            classSubstring.search("indexRed") > -1 ? individualChargesObj["class"] = "red" : individualChargesObj["class"] = "black"

                        indexObjValue.push(individualChargesObj)
                    }

                    req.body.indexHeaderData = indexHeaderData;
                    req.body.indexObjValue = indexObjValue;
                }

                indexHeaderData = [];
                indexTableData = [];

                next();

            })
            .catch(function (error) {
                return res.send({ status: 'error', message: error.message });
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// MCA Directors Data
mca.getMcaDirectorDetails = async function getMcaDirectorDetails(req, res, next) {
    try {

        var directorData = [];

        for (let dinInfo of req.body.mcaData.signatoryMcaDetails) {

            let directorDetails = {};
            directorDetails['DIN/PAN'] = dinInfo['DIN'];
            directorDetails['Name'] = `${(dinInfo['FirstName']).trim()} ${(dinInfo['MiddleName']).trim()} ${(dinInfo['LastName']).trim()}`;

            var data = qs.stringify({
                din: `${dinInfo['DIN']}`,
            });

            var config = {
                method: "post",
                url: "https://www.mca.gov.in/mcafoportal/showdirectorMasterData.do",
                headers: {
                    authority: "www.mca.gov.in",
                    "cache-control": "max-age=0",
                    "sec-ch-ua":
                        '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                    "upgrade-insecure-requests": "1",
                    origin: "https://www.mca.gov.in",
                    "content-type": "application/x-www-form-urlencoded",
                    "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
                    accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "sec-fetch-site": "same-origin",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-user": "?1",
                    "sec-fetch-dest": "document",
                    referer:
                        "https://www.mca.gov.in/mcafoportal/showdirectorMasterData.do",
                    "accept-language": "en-US,en;q=0.9",
                    cookie:
                        "HttpOnly; JSESSIONID=0000zlFqoBrDX9BFANq14JfMd_Y:1esaukip7; HttpOnly",
                },
                data: data,
            };

            const response = await axios(config)
            const html = response.data;
            const $ = cheerio.load(html);

            // Add List of compaines details
            listOfCompaniesHeaders = [], listOfCompaniesDetails = [];
            // Add LLP Compaines details
            llpCompaniesHeaders = [], llpCompaniesDetails = [];

            // Add compaines header details
            for (let i = 1; i < 6; i++) {
                listOfCompaniesHeaders.push($(
                    `#companyData > thead > tr:nth-child(1) > th:nth-child(${i})`
                ).text().trim())
            }

            // Fetch Company list details if exists
            for (let i = 1; i++;) {

                if ($(
                    `#companyData > tbody > tr:nth-child(${i}) > td:nth-child(1)`
                ).text().trim().length === 0) {
                    break;
                }

                let companyObj = {};

                for (let j = 1; j < 6; j++) {
                    companyObj[`${listOfCompaniesHeaders[j - 1]}`] = ($(
                        `#companyData > tbody > tr:nth-child(${i}) > td:nth-child(${j})`
                    ).text().trim())
                }
                listOfCompaniesDetails.push(companyObj);
            }

            // Add llp compaines header details
            for (let i = 1; i < 6; i++) {
                llpCompaniesHeaders.push($(
                    `#llpData > thead > tr:nth-child(1) > th:nth-child(${i})`
                ).text().trim())
            }

            // Fetch llp Company details if exists
            for (let i = 1; i++;) {

                if ($(
                    `#llpData > tbody > tr:nth-child(${i - 1}) > td:nth-child(1)`
                ).text().trim().length === 0) {
                    break;
                }

                let llpCompanyObj = {};

                for (let j = 1; j < 5; j++) {
                    llpCompanyObj[`${llpCompaniesHeaders[j - 1]}`] = ($(
                        `#llpData > tbody > tr:nth-child(${i - 1}) > td:nth-child(${j})`
                    ).text().trim())
                }
                llpCompaniesDetails.push(llpCompanyObj);
            }

            directorDetails['listOfCompaniesHeaders'] = listOfCompaniesHeaders;
            directorDetails['listOfCompaniesDetails'] = listOfCompaniesDetails;
            directorDetails['llpCompaniesHeaders'] = llpCompaniesHeaders;
            directorDetails['llpCompaniesDetails'] = llpCompaniesDetails;

            directorData.push(directorDetails)
        }

        req.body.directorData = directorData;
        next();
    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

//MCA Details Ended
mca.saveMcaDataToDb = async function saveMcaDataToDb(req, res) {
    try {

        let savedCompanyDetails = await MCA.findOne({
            userId: req.body.jwtInfo.jwtId,
            companyId: req.body.companyId
        });

        let savedData = {
            userId: req.body.jwtInfo.jwtId,
            companyId: req.body.companyId,
            companyData: req.body.mcaData.companyData,
            charges: req.body.mcaData.charges,
            signatoryMcaDetails: req.body.mcaData.signatoryMcaDetails,
            indexHeaderData: req.body.indexHeaderData,
            indexObjValue: req.body.indexObjValue,
            filteredDirectorData: req.body.mcaData.filteredDirectorData,
            detailedDirectorData: req.body.mcaData.detailedDirectorData,
            createdAt: new Date(),
            trno: Date.now()
        }

        if (!savedCompanyDetails) {
            let newCompanyData = new MCA(savedData);
            await newCompanyData.save();
        } else {
            savedData.updatedAt = new Date();
            savedData.updatedTrno = Date.now();
            await MCA.findByIdAndUpdate(savedCompanyDetails._id, savedData)
        }

        return res.send({ status: 'success', message: 'MCA Details Saved Successfully', data: req.body.mcaData });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}
// List saved Mca Company
mca.mcaCompanyList = async function mcaCompanyList(req, res) {
    try {

        if (
            !req.query.sort ||
            !req.query.order ||
            !req.query.page
        )
            return res.status(500).send('Missing requried fields');

        let sort = {}, limit = 30;
        req.query.order === 'desc' ? sort[req.query.sort] = -1 : sort[req.query.sort] = 1;
        let skip = limit * (Number(req.query.page) - 1);

        let query = {
            userId: req.body.jwtInfo.jwtId.toString()
        }

        req.query.searchText && req.query.searchText !== 'null' ? query['$or'] = [
            { companyId: { $regex: req.query.searchText, $options: 'i' } },
            { 'companyData.Company / LLP Name': { $regex: req.query.searchText, $options: 'i' } },
        ] : '';

        let total_count = await MCA.countDocuments(query);

        let mcaCompanyDetails = await MCA.aggregate([
            {
                $match: query
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    companyId: "$companyId",
                    companyData: "$companyData",
                    chargesValue: { $ifNull: ["$charges.data", []] },
                    signatoryMcaDetails: { $ifNull: ["$signatoryMcaDetails.data", []] },
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    indexObjValue: "$indexObjValue",
                    filteredDirectorData: "$filteredDirectorData",
                    detailedDirectorData: "$detailedDirectorData",
                }
            }
        ]);

        return res.status(200).send({
            items: mcaCompanyDetails,
            total_count: total_count
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}
// Individual MCA Details
mca.mcaIndividualMcaDetails = async function mcaIndividualMcaDetails(req, res) {
    try {

        if (
            !req.query.companyId
        )
            return res.status(500).send('Missing requried fields');

        let mcaCompanyDetails = await MCA.aggregate([
            {
                $match: { _id: ObjectID(req.query.companyId) }
            },
            {
                $project: {
                    companyId: "$companyId",
                    companyData: "$companyData",
                    chargesValue: { $ifNull: ["$charges", []] },
                    signatoryMcaDetails: { $ifNull: ["$signatoryMcaDetails", []] },
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    indexObjValue: "$indexObjValue",
                    filteredDirectorData: "$filteredDirectorData",
                    detailedDirectorData: "$detailedDirectorData",
                }
            }
        ]);

        return res.status(200).send({
            data: mcaCompanyDetails.length > 0 ? mcaCompanyDetails[0] : {}
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}
// Delete MCA Details
mca.mcaDeleteMcaDetails = async function mcaDeleteMcaDetails(req, res) {
    try {

        if (
            !req.query.companyId
        )
            return res.status(500).send('Missing requried fields');

        let mcaDetails = await MCA.findById(req.query.companyId);

        if (!mcaDetails)
            return res.status(500).send('Missing MCA Detail.');

        await MCA.findByIdAndDelete(req.query.companyId);

        return res.status(200).send({
            data: true
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}
// Parse Director Excel
async function parseDirectorExcel(filePath, deleteFilePath, name, din) {
    try {

        let returnObj = {
            din: din,
            name: name,
            companiesDetails: {
                isData: false,
                message: 'No Company exists for a Director',
                value: []
            },
            llpDetails: {
                isData: false,
                message: 'No LLP exists for a Director',
                value: []
            }
        };
        let workbook = XLSX.readFile(filePath);
        let sheet_name_list = workbook.SheetNames;
        let data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        let listOfCompaniesIndex = data.findIndex(item => item['Director Master Data'] === 'CIN/FCRN');
        let listOfLLpIndex = data.findIndex(item => item['Director Master Data'] === 'LLPIN/FLLPIN');

        for (let i = listOfCompaniesIndex + 1; i < listOfLLpIndex - 1; i++) {
            if (data[i]['Director Master Data'] === 'No Company exists for a Director') break;

            if (i === listOfCompaniesIndex + 1) {
                returnObj.companiesDetails.isData = true;
                returnObj.companiesDetails.value.push({
                    "CIN/FCRN": data[i]['Director Master Data'],
                    "Company Name": data[i]['__EMPTY'],
                    "Begin Date": data[i]['__EMPTY_1'],
                    "End Date": data[i]['__EMPTY_2']
                })
            } else {
                returnObj.companiesDetails.value.push({
                    "CIN/FCRN": data[i]['Director Master Data'],
                    "Company Name": data[i]['__EMPTY'],
                    "Begin Date": data[i]['__EMPTY_1'],
                    "End Date": data[i]['__EMPTY_2']
                })
            }

        }

        for (let i = listOfLLpIndex + 1; i < data.length; i++) {
            if (data[i]['Director Master Data'] === 'No LLP exists for a Director') break;

            if (i === listOfLLpIndex + 1) {
                returnObj.llpDetails.isData = true;
                returnObj.llpDetails.value.push({
                    "LLPIN/FLLPIN": data[i]['Director Master Data'],
                    "LLP Name": data[i]['__EMPTY'],
                    "Begin Date": data[i]['__EMPTY_1'],
                    "End Date": data[i]['__EMPTY_2']
                })
            } else {
                returnObj.llpDetails.value.push({
                    "LLPIN/FLLPIN": data[i]['Director Master Data'],
                    "LLP Name": data[i]['__EMPTY'],
                    "Begin Date": data[i]['__EMPTY_1'],
                    "End Date": data[i]['__EMPTY_2']
                })
            }

        }

        Fs.unlinkSync(filePath);
        Fs.rmdirSync(deleteFilePath, { recursive: true, force: true });

        return returnObj;

    } catch (error) {
        return error
    }
}

// Save MCA Details To DB
mca.saveMcaDetailsFromExcelFile = async function saveMcaDetailsFromExcelFile(req, res, next) {
    try {

        let workbook = XLSX.readFile(req.body.filePath);
        let sheet_name_list = workbook.SheetNames;
        let cinData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

        for (let i = 0; i < cinData.length; i++) {

            var data = qs.stringify({
                companyID: cinData[i]['CIN'],
            });

            console.log(`Saving data for index ${i + 1} and cin ${cinData[i]['CIN']}`)

            var config = {
                method: "post",
                url: "https://www.mca.gov.in/mcafoportal/companyLLPMasterData.do",
                headers: {
                    authority: "www.mca.gov.in",
                    "cache-control": "max-age=0",
                    "sec-ch-ua":
                        '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": '"Windows"',
                    "upgrade-insecure-requests": "1",
                    origin: "https://www.mca.gov.in",
                    "content-type": "application/x-www-form-urlencoded",
                    "user-agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
                    accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "sec-fetch-site": "same-origin",
                    "sec-fetch-mode": "navigate",
                    "sec-fetch-user": "?1",
                    "sec-fetch-dest": "document",
                    referer:
                        "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do",
                    "accept-language": "en-US,en;q=0.9",
                    cookie:
                        "HttpOnly; JSESSIONID=0000tGqbDZO2TGOVWOTZpwwFnZn:1esaukip7; HttpOnly",
                },
                data: data,
            };

            let mcaPayload = await axios(config)
            const html = mcaPayload.data;
            const $ = cheerio.load(html);

            CIN = $(
                "#resultTab1 > tbody > tr:nth-child(1) > td:nth-child(2)"
            ).text();
            companyName = $(
                " #resultTab1 > tbody > tr:nth-child(2) > td:nth-child(2)"
            ).text();
            ROC_code = $(
                "#resultTab1 > tbody > tr:nth-child(3) > td:nth-child(2)"
            ).text();
            registerationNumber = $(
                "#resultTab1 > tbody > tr:nth-child(3) > td:nth-child(2)"
            ).text();
            companyCategory = $(
                "#resultTab1 > tbody > tr:nth-child(5) > td:nth-child(2)"
            ).text();
            companySubCatergory = $(
                "#resultTab1 > tbody > tr:nth-child(6) > td:nth-child(2)"
            ).text();
            classOfCompany = $(
                "#resultTab1 > tbody > tr:nth-child(7) > td:nth-child(2)"
            ).text();
            authorisedCapital = $(
                "#resultTab1 > tbody > tr:nth-child(8) > td:nth-child(2)"
            ).text();
            paidUpCapitals = $(
                "#resultTab1 > tbody > tr:nth-child(9) > td:nth-child(2)"
            ).text();
            noOfMembers = $(
                "#resultTab1 > tbody > tr:nth-child(10) > td:nth-child(2)"
            ).text();
            dateOfIncorporatio = $(
                "#resultTab1 > tbody > tr:nth-child(11) > td:nth-child(2)"
            ).text();
            registeredAddress = $(
                "#resultTab1 > tbody > tr:nth-child(12) > td:nth-child(2)"
            ).text();
            adressOtherThanRO = $(
                "#resultTab1 > tbody > tr:nth-child(13) > td:nth-child(2)"
            ).text();
            emailID = $(
                "#resultTab1 > tbody > tr:nth-child(14) > td:nth-child(2)"
            ).text();
            wheterListeOrNot = $(
                "#resultTab1 > tbody > tr:nth-child(15) > td:nth-child(2)"
            ).text();
            ACTIVECompliance = $(
                "#resultTab1 > tbody > tr:nth-child(16) > td:nth-child(2)"
            ).text();
            suspendedAtStockExchange = $(
                "#resultTab1 > tbody > tr:nth-child(17) > td:nth-child(2)"
            ).text();
            dateOfLastAGM = $(
                "#resultTab1 > tbody > tr:nth-child(18) > td:nth-child(2)"
            ).text();
            dateOfBalanceSheet = $(
                "#resultTab1 > tbody > tr:nth-child(19) > td:nth-child(2)"
            ).text();
            companyStatus = $(
                "#resultTab1 > tbody > tr:nth-child(20) > td:nth-child(2)"
            ).text();

            var dateParts = dateOfIncorporatio.split("/");
            var checkindate = new Date(
                dateParts[2],
                dateParts[1] - 1,
                dateParts[0]
            );
            var now = new Date();
            var difference = now - checkindate;
            var days = difference / (1000 * 60 * 60 * 24);
            const years = days / 365;
            no_of_years = parseFloat(years).toFixed(2);

            const age = `${no_of_years} years- (${dateOfIncorporatio})`;

            mcaBasicDetails = {
                "Input CIN": cinData[i]['CIN'],
                "CIN": CIN,
                "Company / LLP Name": companyName,
                "ROC Code": ROC_code,
                "Registration Number": registerationNumber,
                "Company Category": companyCategory,
                "Company SubCategory": companySubCatergory,
                "Class of Company": classOfCompany,
                "Authorised Capital(Rs)": authorisedCapital,
                "Paid up Capital(Rs)": paidUpCapitals,
                "Number of Members(Applicable in case of company without Share Capital)": noOfMembers,
                "Date of Incorporation": dateOfIncorporatio,
                "Registered Address": registeredAddress,
                "Address other than R/o where all or any books of account and papers are maintained": adressOtherThanRO,
                "Email Id": emailID,
                "Whether Listed or not": wheterListeOrNot,
                "ACTIVE compliance": ACTIVECompliance,
                "Suspended at stock exchange": suspendedAtStockExchange,
                "Date of last AGM": dateOfLastAGM,
                "Date of Balance Sheet": dateOfBalanceSheet,
                "Company Status(for efiling)": companyStatus,
                "Age": age ? age : null,
                createdAt: new Date(),
                trno: Date.now()
            };

            let newCompanyData = new SAVEDMCA(mcaBasicDetails);
            await newCompanyData.save();

            // axios(config).then(async(response) => {
            //     const html = response.data;
            //     const $ = cheerio.load(html);
            //     CIN = $(
            //         "#resultTab1 > tbody > tr:nth-child(1) > td:nth-child(2)"
            //     ).text();
            //     companyName = $(
            //         " #resultTab1 > tbody > tr:nth-child(2) > td:nth-child(2)"
            //     ).text();
            //     ROC_code = $(
            //         "#resultTab1 > tbody > tr:nth-child(3) > td:nth-child(2)"
            //     ).text();
            //     registerationNumber = $(
            //         "#resultTab1 > tbody > tr:nth-child(3) > td:nth-child(2)"
            //     ).text();
            //     companyCategory = $(
            //         "#resultTab1 > tbody > tr:nth-child(5) > td:nth-child(2)"
            //     ).text();
            //     companySubCatergory = $(
            //         "#resultTab1 > tbody > tr:nth-child(6) > td:nth-child(2)"
            //     ).text();
            //     classOfCompany = $(
            //         "#resultTab1 > tbody > tr:nth-child(7) > td:nth-child(2)"
            //     ).text();
            //     authorisedCapital = $(
            //         "#resultTab1 > tbody > tr:nth-child(8) > td:nth-child(2)"
            //     ).text();
            //     paidUpCapitals = $(
            //         "#resultTab1 > tbody > tr:nth-child(9) > td:nth-child(2)"
            //     ).text();
            //     noOfMembers = $(
            //         "#resultTab1 > tbody > tr:nth-child(10) > td:nth-child(2)"
            //     ).text();
            //     dateOfIncorporatio = $(
            //         "#resultTab1 > tbody > tr:nth-child(11) > td:nth-child(2)"
            //     ).text();
            //     registeredAddress = $(
            //         "#resultTab1 > tbody > tr:nth-child(12) > td:nth-child(2)"
            //     ).text();
            //     adressOtherThanRO = $(
            //         "#resultTab1 > tbody > tr:nth-child(13) > td:nth-child(2)"
            //     ).text();
            //     emailID = $(
            //         "#resultTab1 > tbody > tr:nth-child(14) > td:nth-child(2)"
            //     ).text();
            //     wheterListeOrNot = $(
            //         "#resultTab1 > tbody > tr:nth-child(15) > td:nth-child(2)"
            //     ).text();
            //     ACTIVECompliance = $(
            //         "#resultTab1 > tbody > tr:nth-child(16) > td:nth-child(2)"
            //     ).text();
            //     suspendedAtStockExchange = $(
            //         "#resultTab1 > tbody > tr:nth-child(17) > td:nth-child(2)"
            //     ).text();
            //     dateOfLastAGM = $(
            //         "#resultTab1 > tbody > tr:nth-child(18) > td:nth-child(2)"
            //     ).text();
            //     dateOfBalanceSheet = $(
            //         "#resultTab1 > tbody > tr:nth-child(19) > td:nth-child(2)"
            //     ).text();
            //     companyStatus = $(
            //         "#resultTab1 > tbody > tr:nth-child(20) > td:nth-child(2)"
            //     ).text();

            //     var dateParts = dateOfIncorporatio.split("/");
            //     var checkindate = new Date(
            //         dateParts[2],
            //         dateParts[1] - 1,
            //         dateParts[0]
            //     );
            //     var now = new Date();
            //     var difference = now - checkindate;
            //     var days = difference / (1000 * 60 * 60 * 24);
            //     const years = days / 365;
            //     no_of_years = parseFloat(years).toFixed(2);

            //     const age = `${no_of_years} years- (${dateOfIncorporatio})`;

            //     mcaBasicDetails = {
            //         "CIN": CIN,
            //         "Company / LLP Name": companyName,
            //         "ROC Code": ROC_code,
            //         "Registration Number": registerationNumber,
            //         "Company Category": companyCategory,
            //         "Company SubCategory": companySubCatergory,
            //         "Class of Company": classOfCompany,
            //         "Authorised Capital(Rs)": authorisedCapital,
            //         "Paid up Capital(Rs)": paidUpCapitals,
            //         "Number of Members(Applicable in case of company without Share Capital)": noOfMembers,
            //         "Date of Incorporation": dateOfIncorporatio,
            //         "Registered Address": registeredAddress,
            //         "Address other than R/o where all or any books of account and papers are maintained": adressOtherThanRO,
            //         "Email Id": emailID,
            //         "Whether Listed or not": wheterListeOrNot,
            //         "ACTIVE compliance": ACTIVECompliance,
            //         "Suspended at stock exchange": suspendedAtStockExchange,
            //         "Date of last AGM": dateOfLastAGM,
            //         "Date of Balance Sheet": dateOfBalanceSheet,
            //         "Company Status(for efiling)": companyStatus,
            //         "Age": age ? age : null,
            //         createdAt: new Date(),
            //         trno: Date.now()
            //     };

            //     let newCompanyData = new SAVEDMCA(mcaBasicDetails);
            //     await newCompanyData.save();

            // }).catch((error) => {
            //     return res.send({ status: 'error', message: error.message });
            // });
        }

        return res.send({ status: 'success', message: 'MCA Details Saved Successfully' });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}