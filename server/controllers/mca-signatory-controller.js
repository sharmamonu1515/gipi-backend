const signatory = module.exports;
const axios = require('axios');
const Fs = require('fs')
const Path = require('path');
const qs = require('qs');
const htmlparser2 = require('htmlparser2');

let currentTabInWork = '',
    signatoryDetails = false,
    signatoryTabDetails = [],
    errorType = '';

const mcaSignatoryDetailsParser = new htmlparser2.Parser({

    onopentag(name, attribs) {

        if (name === 'table' && attribs.class === 'result-forms' && attribs.id === 'signatoryDetails') {
            currentTabInWork = 'firstTab';
            signatoryDetails = true;
        }

        if (name === 'div' && attribs.class === 'overlay-content' && attribs.id === 'overlayCnt') {
            currentTabInWork = 'alternate-error';
        }

    },

    ontext(text) {

        if (signatoryDetails) {

            if (text) {
                if (text.indexOf('\n') === -1) {
                    signatoryTabDetails.push(text)
                }

            }

        }

        if (currentTabInWork === 'alternate-error') {

            if (text) {

                if (text.startsWith("CIN/LLPIN must be of the pattern [ADDDDDAADDDDAAADDDDDD]")) {
                    errorType = "pattern"
                }
            }

        }

    },

    onclosetag(tagname) {

        if (tagname === 'table') {

            currentTabInWork = '';
            signatoryDetails = false;

        }

        if (tagname === 'div') {

            currentTabInWork = '';

        }

    }

}, { decodeEntities: true })

// Get MCA Signatory Token & session ID
signatory.getMcaSignatoryTokenAndSession = function getMcaSignatoryTokenAndSession(req, res, next) {
    try {

        var config = {
            method: 'get',
            url: 'https://www.mca.gov.in/mcafoportal/viewSignatoryDetails.do',
            headers: {
                'authority': 'www.mca.gov.in',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'cookie': 'HttpOnly; cookiesession1=678B2874123456788901234ABCEF1188; JSESSIONID=0000Clc1tUEPSgfta9z3APKyts8:1aevgiefc; HttpOnly; cookiesession1=678B2874JKLMNOPTUVXYZABCDEFG0FFC',
                'referer': 'https://www.google.com/',
                'sec-ch-ua': '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'cross-site',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
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

                // console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
                console.log(error);
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// Get MCA Signatory Captcha
signatory.getMcaSignatoryCaptcha = function getMcaSignatoryCaptcha(req, res, next) {
    try {

        if (!req.body.jwtInfo.jwtId)
            return res.send({ status: 'error', message: 'Missing Required Fields.' });

        let uniqueId = req.body.jwtInfo.jwtId;

        if (!Fs.existsSync(Path.resolve(__dirname, `images/${uniqueId}`))) {
            Fs.mkdirSync(Path.resolve(__dirname, `images/${uniqueId}`), { recursive: true });
        }

        const path = Path.resolve(__dirname, `images/${uniqueId}`, 'code.jpg');
        const writer = Fs.createWriteStream(path);

        var config = {
            method: 'get',
            url: 'https://www.mca.gov.in/mcafoportal/getCapchaImage.do',
            // url: 'https://www.mca.gov.in/mcafoportal/getCapchaImage.do?id=0.08770859201952642',
            responseType: 'stream',
            headers: {
                'authority': 'www.mca.gov.in',
                'accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'accept-language': 'en-US,en;q=0.9',
                'cookie': `HttpOnly; cookiesession1=678B2874123456788901234ABCEF1188; JSESSIONID=${req.body.cookie}`,
                //   'cookie': 'HttpOnly; cookiesession1=678B2874123456788901234ABCEF1188; JSESSIONID=0000Clc1tUEPSgfta9z3APKyts8:1aevgiefc; HttpOnly; cookiesession1=678B2874JKLMNOPTUVXYZABCDEFG0FFC', 
                'referer': 'https://www.mca.gov.in/mcafoportal/viewSignatoryDetails.do',
                'sec-ch-ua': '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'image',
                'sec-fetch-mode': 'no-cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
            }
        };

        axios(config)
            .then(function (response) {
                response.data.pipe(writer);
                return new Promise((resolve, reject) => {
                    writer.on('finish', () => {
                        req.body.uniqueId = uniqueId;
                        req.body.filePath = Path.resolve(__dirname, `images/${uniqueId}`, 'code.jpg');
                        req.body.deleteFilePath = Path.resolve(__dirname, `images/${uniqueId}`);
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

// GET CAPTCHA DETAILS
signatory.getMcaSignatoryCaptchaDetails = function getMcaSignatoryCaptchaDetails(req, res) {
    try {

        let fileData = Fs.readFileSync(req.body.filePath, 'base64');
        req.body.dataUrl = `data:image/jpeg;base64, ${fileData}`;

        return res.send({ status: 'success', message: 'Captcha Details Fetched Successfully', data: req.body });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

// GET MCA SIGNATORY DETAILS
signatory.getMcaSignatoryParsedDetails = function getMcaSignatoryParsedDetails(req, res) {
    try {

        if (
            !req.body.cookie ||
            !req.body.deleteFilePath ||
            !req.body.captcha ||
            !req.body.companyId ||
            !req.body.filePath
        )
            return res.send({ status: 'error', message: 'Missing Required Fields' });

        var data = qs.stringify({
            'companyID': `${req.body.companyId}`,
            'displayCaptcha': 'true',
            'userEnteredCaptcha': `${req.body.captcha}`,
            'submitBtn': 'Submit'
        });

        var regex = /([A-Z]){5}([0-9]){4}([A-Z]){1}$/;

        var config = {
            method: 'post',
            url: 'https://www.mca.gov.in/mcafoportal/viewSignatoryDetailsAction.do',
            headers: {
                'authority': 'www.mca.gov.in',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'max-age=0',
                'content-type': 'application/x-www-form-urlencoded',
                'cookie': `HttpOnly; cookiesession1=678B2874123456788901234ABCEF1188; JSESSIONID=${req.body.cookie}`,
                'origin': 'https://www.mca.gov.in',
                'referer': 'https://www.mca.gov.in/mcafoportal/viewSignatoryDetailsAction.do',
                'sec-ch-ua': '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
            },
            data: data
        };

        let returnObject = {
            tabData: {
                headers: [],
                value: []
            }
        }

        axios(config)
            .then(function (response) {

                mcaSignatoryDetailsParser.write(response.data);
                mcaSignatoryDetailsParser.end();

                if (errorType) {

                    if (errorType === 'pattern') {
                        errorType = '';
                        return res.send({ status: 'error', message: 'Either CIN/FCRN/LLPIN/FLLPIN must be of the pattern [ADDDDDAADDDDAAADDDDDD] for CIN, [FDDDDD] for FCRN, [AAA-DDDD] for LLPIN and [FAAA-DDDD] for FLLPIN where A is an alphabet, D is a digit (0-9) and F is a literal. Or Enter valid Letters shown above. Or MCA Website is Not Working.' });
                    }

                    errorType = '';
                    return res.send({ status: 'error', message: 'Some Error Occurred. Please Check The MCA Website.' });

                }

                /** 
                 * Parsed Tab Data Header Started
                 */

                for (let i = 0; i <= 6; i++) {
                    returnObject.tabData.headers.push(signatoryTabDetails[i])
                }

                /** 
                 * Parsed Tab Data Header Ended
                 */

                /** 
                 * Parsed Tab Data Value Started
                 */
                let thirdParsedValueObj = {}, objArrayValue = ['din', 'name', 'designation', 'dateOfAppt', 'isDscRgstrd', 'dscExpiryDate', 'surrenderedDin'], finalThirdtabResult = [];

                for (let i = 7; i < signatoryTabDetails.length; i++) {

                    if (
                        isNaN(signatoryTabDetails[i]) && !regex.test(signatoryTabDetails[i].toUpperCase()) ||
                        !isNaN(signatoryTabDetails[i]) && regex.test(signatoryTabDetails[i].toUpperCase())
                    ) {

                        let savedObjKey = Object.keys(thirdParsedValueObj);
                        let attributeIndex = objArrayValue.indexOf(savedObjKey[savedObjKey.length - 1]);
                        thirdParsedValueObj[objArrayValue[attributeIndex + 1]] = signatoryTabDetails[i];

                    } else {

                        if (i > 7) {
                            returnObject.tabData.value.push(thirdParsedValueObj);
                        }

                        thirdParsedValueObj = {};
                        thirdParsedValueObj['din'] = signatoryTabDetails[i];

                    }

                    if (i === signatoryTabDetails.length - 1) {
                        returnObject.tabData.value.push(thirdParsedValueObj);
                        thirdParsedValueObj = {}
                    }
                }

                /** 
                 * Parsed Third Tab Data Value Ended
                 */

                signatoryTabDetails = [];
                Fs.unlinkSync(req.body.filePath);
                Fs.rmdirSync(req.body.deleteFilePath, { recursive: true, force: true });

                return res.send({ status: 'success', message: 'MCA Signatory Details Fetched Details', data: returnObject });
            })
            .catch(function (error) {
                return res.send({ status: 'error', message: error.message });
            });

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}