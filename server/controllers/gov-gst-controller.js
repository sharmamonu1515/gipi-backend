const axios = require('axios');
const Fs = require('fs')
const Path = require('path');
const https = require('https');
const gst = module.exports;
const Gst = require('../models/gov-gst');
const moment = require('moment');
const GstByPan = require('../models/gst_by_pan');
const ObjectID = require('mongodb').ObjectID;

const agent = new https.Agent({
    rejectUnauthorized: false,
});

// Get GST Captcha Cookies and Store
gst.getGstCookies = function getGstCookies(req, res, next) {
    try {

        let randomNumber = Math.random();
        const path = Path.resolve(__dirname, 'images', 'gstcaptcha', 'code.jpg')
        const writer = Fs.createWriteStream(path);

        var config = {
            method: 'get',
            httpsAgent: agent,
            responseType: 'stream',
            url: `https://services.gst.gov.in/services/captcha?rnd=${randomNumber}`,
            headers: {
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Cookie': 'Lang=en; TS01b8883c=01ab915e2c6e791bd59b5940b492bec4ee1bea20d272e8ef85ad6d7ab11ad541cd6bab7c19ca2df1f15af4060f6d91775ac1013da5; ak_bmsc=12D020C0867DA119861BB8D0A0519928~000000000000000000000000000000~YAAQZ7YRYGR6XbqEAQAA2ZjzwxEzStp1KEv9KuTCSa+CWK1Gdqac0ISIr8Bk7YtXfMMQkI8DeEavFfQT4HpImENKofwhMs4Jkmx6KJHht7qXXdPJxRQKs+yfyvkeSRF3qZ14z5W9ZG0XIuoFcK5AT+E5Z0+73uQk93KBH4FXwyudsWf07TZo5SK2vtK6LYaEAMGIu2UfLvAALZXBoetQnVBzmQ1pObGrt6lkcUXtDwB8Keg519/hfCYqZpaHbHPTB3uNBbY0wMhBS0k9BXA8KPsJ5re4fWLRrvU5EDcHXSpXkyJBOjVAqXGNk9cA2C/XDISiyeTYnKUpdG6mYTAefeyVa3vi0QWfa9i36aMgJICf5c2or5xt5roztmZDV7I=; bm_sv=ED2118B357DB2A17C681EA9386A04E12~YAAQZ7YRYLKIXbqEAQAAL4H0wxEiOnyecIxWGiuX12210Kh9+eISTmzEiYM4JnxENwD/e36N6Vh5jYmeyJyj2aJASt9tvVNtHjSi6rlg+GXdU5hc8ACcivBfIHrQ3c7UsyAK+xcnRiNhfJemkZsV1QlSBqJb4aBIOfRL2BTLhjFEl+hcY+gQeiVJCLjmHJT62wk/6/NIoQA4O4oEbyjkexbF6ld02ams8xxXyuQ6ne+D1lE8ZopTebknFBq2+Syw~1',
                'Referer': 'https://services.gst.gov.in/services/login',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"'
            }
        };

        axios(config)
            .then(async function (response) {

                if (response.headers['set-cookie']) {

                    let captchaCookie = response.headers['set-cookie'][0].substr(0, response.headers['set-cookie'][0].indexOf(';'));
                    let captchaOtherCookie = response.headers['set-cookie'][1].substr(0, response.headers['set-cookie'][1].indexOf(';'));

                    let findGstCookieRecord = await Gst.findOne({});

                    if (!findGstCookieRecord) {

                        await Gst.addCookie({
                            captchaCookie: captchaCookie,
                            captchaOtherCookie: captchaOtherCookie
                        });

                    } else {

                        await Gst.findByIdAndUpdate(findGstCookieRecord._id, {
                            captchaCookie: captchaCookie,
                            captchaOtherCookie: captchaOtherCookie,
                            createdAt: Date.now()
                        });

                    }

                } else {
                    return res.send({ status: "error", message: "Unable to process request" });
                }

                response.data.pipe(writer);
                return new Promise((resolve, reject) => {
                    writer.on('finish', () => {
                        req.body.imagePath = Path.resolve(__dirname, 'images', 'gstcaptcha', 'code.jpg');
                        next();
                        resolve();
                    })
                    writer.on('error', () => { /* Add your code here */ reject(); })
                });


            })
            .catch(function (error) {
                return res.send({ status: "error", message: error.message });
            });

    } catch (error) {
        return res.send({ status: "error", message: error.message });
    }
}

// GET CAPTCHA IMAGE DETAILS
gst.getGstImageCaptchaDetails = function getMcaSignatoryCaptchaDetails(req, res) {
    try {

        let fileData = Fs.readFileSync(req.body.imagePath, 'base64');
        req.body.dataUrl = `data:image/jpeg;base64, ${fileData}`;

        return res.send({ status: 'success', message: 'Captcha Details Fetched Successfully', data: req.body });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// LOGIN TO GOV GST PORTAL
gst.auth = async function auth(req, res) {
    try {

        if (
            !req.body.username ||
            !req.body.password ||
            !req.body.captcha
        )
            return res.status(404).send('Missing Required Fields');

        let cookiesDetails = await Gst.findOne({});

        if (!cookiesDetails)
            return res.status(404).send('Please Login Again For GST Portal.');

        if (moment(new Date()).diff(cookiesDetails.createdAt, 'h') >= 5 || !cookiesDetails.captchaCookie) {
            return res.status(404).send('Session Expires Please Load The Captcha Again.');
        }

        let data = `{"username":"${req.body.username}","mFP":"{\\"VERSION\\":\\"2.1\\",\\"MFP\\":{\\"Browser\\":{\\"UserAgent\\":\\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36\\",\\"Vendor\\":\\"Google Inc.\\",\\"VendorSubID\\":\\"\\",\\"BuildID\\":\\"20030107\\",\\"CookieEnabled\\":true},\\"IEPlugins\\":{},\\"NetscapePlugins\\":{\\"PDF Viewer\\":\\"\\",\\"Chrome PDF Viewer\\":\\"\\",\\"Chromium PDF Viewer\\":\\"\\",\\"Microsoft Edge PDF Viewer\\":\\"\\",\\"WebKit built-in PDF\\":\\"\\"},\\"Screen\\":{\\"FullHeight\\":864,\\"AvlHeight\\":864,\\"FullWidth\\":1536,\\"AvlWidth\\":1462,\\"ColorDepth\\":24,\\"PixelDepth\\":24},\\"System\\":{\\"Platform\\":\\"Win32\\",\\"systemLanguage\\":\\"en-US\\",\\"Timezone\\":-330}},\\"ExternalIP\\":\\"\\",\\"MESC\\":{\\"mesc\\":\\"mi=2;cd=150;id=30;mesc=313205;mesc=748699\\"}}","deviceID":"dIl4qneZkBz6Cm7a09aPkAXlMIejMzw6fR5x7qCYkyja896DdQa05qczvn6wUpVS","type":"username","captcha":"${req.body.captcha}","password":"${req.body.password}"}`;

        let config = {
            method: 'post',
            url: 'https://services.gst.gov.in/services/authenticate',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json;charset=UTF-8',
                'Cookie': `${cookiesDetails.captchaCookie}; ${cookiesDetails.captchaOtherCookie}`,
                'Origin': 'https://services.gst.gov.in',
                'Referer': 'https://services.gst.gov.in/services/login',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"'
            },
            data: data
        };

        axios(config)
            .then(async function (response) {

                if (!response.data)
                    return res.status(404).send("GST Login Failed");

                if (!response.data.message)
                    return res.status(404).send("GST Login Failed");

                if (!response.data.message === 'success')
                    return res.status(404).send("GST Login Failed");

                let authToken = response.headers['set-cookie'][1].substr(0, response.headers['set-cookie'][1].indexOf(';'));
                let username = response.headers['set-cookie'][2].substr(0, response.headers['set-cookie'][2].indexOf(';'));
                let entityRefId = response.headers['set-cookie'][3].substr(0, response.headers['set-cookie'][3].indexOf(';'));

                await Gst.findByIdAndUpdate(cookiesDetails._id, {
                    captchaCookie: "",
                    authToken: authToken,
                    username: username,
                    entityRefId: entityRefId,
                    createdAt: Date.now()
                })

                return res.status(200).json({ status: 'success', message: 'GST Login Successfully' });
            })
            .catch(function (error) {
                return res.status(400).send("Bad Request");
            });

    } catch (error) {
        return res.status(404).send('Please Login Again For GST Portal')
    }
}

// GET ALL GST NUMBER BY PAN
gst.getAllGstByPan = async function getAllGstByPan(req, res, next) {
    try {

        if (
            !req.body.panNumber
        )
            return res.status(404).send('Missing Required Fields');

        let cookiesDetails = await Gst.findOne({});

        if (!cookiesDetails)
            return res.status(404).send('Please Login Again For GST Portal')

        if (
            moment(new Date()).diff(cookiesDetails.createdAt, 'h') >= 5 ||
            !cookiesDetails.authToken ||
            !cookiesDetails.entityRefId ||
            !cookiesDetails.username
        )
            return res.status(404).send('Session Expires Please Load The Captcha Again.');

        let data = `{"panNO":"${req.body.panNumber}"}`;

        var config = {
            method: 'post',
            url: 'https://services.gst.gov.in/services/auth/api/get/gstndtls',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Content-Type': 'application/json;charset=UTF-8',
                'Origin': 'https://services.gst.gov.in',
                'Referer': 'https://services.gst.gov.in/services/auth/searchtpbypan',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Cookie': `${cookiesDetails.authToken}; ${cookiesDetails.entityRefId}; ${cookiesDetails.username}; ${cookiesDetails.captchaOtherCookie}`
            },
            data: data
        };

        axios(config)
            .then(async function (response) {

                if (!response.data)
                    return res.status(404).send('Data Not Found');

                if (!response.data.gstinResList)
                    return res.status(404).send('Data Not Found');

                let findPan = await GstByPan.findOne({ panNumber: req.body.panNumber.trim() });
                let savedData = {};
                savedData.panNumber = req.body.panNumber;
                savedData.gstNumbers = response.data.gstinResList;

                if (!findPan) {
                    await GstByPan.addAllGstDetailsByPan(savedData);
                } else {
                    savedData.updatedAt = Date.now();
                    await GstByPan.findByIdAndUpdate(findPan._id, savedData);
                }

                Object.assign(req.body, cookiesDetails.toObject())
                // return res.status(200).send('Fetched Successfully');
                next();
            })
            .catch(function (error) {
                return res.status(400).send("Bad Request. Please Login For GST Portal");
            });


    } catch (error) {
        return res.status(404).send('Please Login Again For GST Portal');
    }
}

gst.getSingleGstDetails = async function getSingleGstDetails(req, res) {
    try {

        let panDetails = await GstByPan.findOne({ panNumber: req.body.panNumber });
        if (!panDetails)
            return res.status(500).send('Missing Required Fields');

        for (let gstInfo of panDetails.gstNumbers) {

            // Update GST FIRST TAB DATA
            let data = `{"gstin":"${gstInfo.gstin}"}`;

            let config = {
                method: 'post',
                url: 'https://publicservices.gst.gov.in/publicservices/auth/api/search/tp',
                headers: {
                    'Accept': 'application/json, text/plain',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': 'https://services.gst.gov.in',
                    'Referer': 'https://services.gst.gov.in/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Cookie': `${req.body.authToken}; ${req.body.entityRefId}; ${req.body.username}; ${req.body.captchaOtherCookie}`
                },
                data: data
            };

            let gstIndividualDetails = await axios(config);
            await GstByPan.findOneAndUpdate({
                panNumber: req.body.panNumber,
                'gstNumbers.gstin': gstInfo.gstin
            }, {
                'gstNumbers.$.firstTabValue': gstIndividualDetails.data
            });

            // Update GST SECOND TAB DATA
            let gstSecondTabConfig = {
                method: 'get',
                url: `https://publicservices.gst.gov.in/publicservices/auth/api/search/goodservice?gstin=${gstInfo.gstin}`,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Origin': 'https://services.gst.gov.in',
                    'Referer': 'https://services.gst.gov.in/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Cookie': `${req.body.authToken}; ${req.body.entityRefId}; ${req.body.username}; ${req.body.captchaOtherCookie}`
                }
            };

            let secondTabInfo = await axios(gstSecondTabConfig);
            await GstByPan.findOneAndUpdate({
                panNumber: req.body.panNumber,
                'gstNumbers.gstin': gstInfo.gstin
            }, {
                'gstNumbers.$.secondTabValue': secondTabInfo.data
            });

            // Update GST FILINGS TAB DATA
            let filingRequestData = `{"gstin":"${gstInfo.gstin}"}`;
            let gstFilingConfig = {
                method: 'post',
                url: 'https://publicservices.gst.gov.in/publicservices/auth/api/search/taxpayerReturnDetails',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': 'https://services.gst.gov.in',
                    'Referer': 'https://services.gst.gov.in/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                    'at': `${req.body.authToken.substr(req.body.authToken.indexOf('=') + 1)}`,
                    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Cookie': `${req.body.authToken}; ${req.body.entityRefId}; ${req.body.username}; ${req.body.captchaOtherCookie}`
                },
                data: filingRequestData
            };

            let gstFilingDetails = await axios(gstFilingConfig);
            await GstByPan.findOneAndUpdate({
                panNumber: req.body.panNumber,
                'gstNumbers.gstin': gstInfo.gstin
            }, {
                'gstNumbers.$.gstFilingDetails': gstFilingDetails.data
            });

            // Update GST LIABILITY TAB DATA

            let gstLiabilityConfig = {
                method: 'get',
                url: `https://publicservices.gst.gov.in/publicservices/auth/api/get/getLiabRatio?gstin=${gstInfo.gstin}`,
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Origin': 'https://services.gst.gov.in',
                    'Referer': 'https://services.gst.gov.in/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                    'at': `${req.body.authToken.substr(req.body.authToken.indexOf('=') + 1)}`,
                    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Cookie': `${req.body.authToken}; ${req.body.entityRefId}; ${req.body.username}; ${req.body.captchaOtherCookie}`
                }
            };

            let gstLiabilityDetails = await axios(gstLiabilityConfig);
            await GstByPan.findOneAndUpdate({
                panNumber: req.body.panNumber,
                'gstNumbers.gstin': gstInfo.gstin
            }, {
                'gstNumbers.$.gstLiabilityDetails': gstLiabilityDetails.data
            });

            // Update GST ADDITIONAL ADDRESS DATA

            let gstAdditionalAddData = `{"gstin":"${gstInfo.gstin}"}`;

            let gstAdditionalAddConfig = {
                method: 'post',
                url: 'https://publicservices.gst.gov.in/publicservices/auth/api/search/tp/busplaces',
                headers: {
                    'Accept': 'application/json, text/plain',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Content-Type': 'application/json;charset=UTF-8',
                    'Origin': 'https://services.gst.gov.in',
                    'Referer': 'https://services.gst.gov.in/',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-site',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                    'at': `${req.body.authToken.substr(req.body.authToken.indexOf('=') + 1)}`,
                    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'Cookie': `${req.body.authToken}; ${req.body.entityRefId}; ${req.body.username}; ${req.body.captchaOtherCookie}`
                },
                data: gstAdditionalAddData
            };

            let gstAdditionalAddDetails = await axios(gstAdditionalAddConfig);
            await GstByPan.findOneAndUpdate({
                panNumber: req.body.panNumber,
                'gstNumbers.gstin': gstInfo.gstin
            }, {
                'gstNumbers.$.additionalAddressDetails': gstAdditionalAddDetails.data
            });

        }

        return res.status(200).json({ status: 'success', message: 'GST Data Saved Successfully.' });

    } catch (error) {
        console.log(error)
        return res.status(404).send('Please Login Again For GST Portal');
    }
}

// List saved GST
gst.gstList = async function gstList(req, res) {
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

        // PAN Number Or Name Search
        let regex = /([A-Z]){5}([0-9]){4}([A-Z]){1}$/;

        if (req.query.searchText && req.query.searchText !== 'null') {
            if (regex.test(req.query.searchText.toUpperCase())) {
                query.panNumber = req.query.searchText.toUpperCase();
            } else {
                query['gstNumbers.firstTabValue.lgnm'] = { $regex: req.query.searchText, $options: 'i' }
            }
        }

        let total_count = await GstByPan.countDocuments(query);

        let gstDetails = await GstByPan.aggregate([
            {
                $match: query
            },
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    panNumber: 1,
                    mandateName: { $arrayElemAt: ['$gstNumbers.firstTabValue.lgnm', 0] },
                    createdAt: 1,
                    updatedAt: 1,
                    gstNumbers: 1
                }
            }
        ]);

        return res.status(200).send({
            items: gstDetails,
            total_count: total_count
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// Individual GST Details
gst.gstIndividualDetails = async function gstIndividualDetails(req, res) {
    try {

        if (
            !req.query.docId
        )
            return res.status(500).send('Missing requried fields');

        let gstDetails = await GstByPan.aggregate([
            {
                $match: { _id: ObjectID(req.query.docId) }
            },
            {
                $project: {
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    gstNumbers: 1,
                    panNumber: 1
                }
            }
        ]);

        return res.status(200).send({
            data: gstDetails.length > 0 ? gstDetails[0] : {}
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}

// GST Details
gst.gstDetails = async function gstDetails(req, res) {
    try {

        if (
            !req.query.docId ||
            !req.query.gstin
        )
            return res.status(500).send('Missing requried fields');

        let gstDetails = await GstByPan.aggregate([
            {
                $match: { _id: ObjectID(req.query.docId) }
            },
            {
                $project: {
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    gstNumbers: 1,
                    panNumber: 1
                }
            }
        ]);

        if (gstDetails.length === 0)
            return res.status(404).json({ status: 'error', message: 'GST Details Not Found' });

        let gstDetail = gstDetails[0];

        let element = gstDetail.gstNumbers.filter((items) => {
            return items.gstin === req.query.gstin;
        });

        if (element.length === 0)
            return res.status(404).json({ status: 'error', message: 'GST Details Not Found' });

        gstDetail.gstNumbers = element[0];

        return res.status(200).send({
            data: gstDetail
        });

    } catch (error) {
        return res.status(500).send(error.message);
    }
}
