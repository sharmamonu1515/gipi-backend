var axios = require('axios');
let mcaUtilities = require('../../utils/mca-encrypt-utilities');
let MCA = require('../models/mca-company')

const newMca = module.exports;

newMca.getMcaBasicDetails = async function (req, res, next) {
    try {

        let data = `data=${mcaUtilities.encrypt("ID=" + req.body.companyId + "&requestID=cin")}`;

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://www.mca.gov.in/bin/MDSMasterDataServlet',
            headers: {
                'host': 'www.mca.gov.in',
                'content-length': '73',
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?0',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'sec-ch-ua-platform': '"Windows"',
                'origin': 'https://www.mca.gov.in',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': 'https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'en-US,en;q=0.9',
                'priority': 'u=0, i',
                'cookie': '__UUID-HASH=b6b7e84cee964f146c5730de2768b54f$; cookiesession1=678B2869C90C01CA7C9BA892D1429D66; alertPopup=false'
            },
            data: data
        };

        let mcaBasicDetails = await axios(config)

        if (mcaBasicDetails.data.error)
            return res.send({ status: "error", message: mcaBasicDetails.data.message });

        if (!mcaBasicDetails.data)
            return res.send({ status: "error", message: "Please Try Again to Fetch Company Details." });

        req.body.mcaData = {
            companyData: mcaBasicDetails.data.data.companyData,
            charges: mcaBasicDetails.data.data.indexChargesData ? mcaBasicDetails.data.data.indexChargesData : [],
            signatoryMcaDetails: mcaBasicDetails.data.data.directorData
        };
        next();

    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

newMca.filterDirectorMcaValue = async function (req, res, next) {
    try {
        var i = 1;
        var currentSerialNo = 1;
        var filteredDirectorData = [];

        if (
            req.body.mcaData.companyData.companyType.toLowerCase() == "company" &&
            req.body.mcaData.companyData.companyOrigin.toLowerCase() == "indian"
        ) {
            var regExDesignation =
                /^(Nominee Director|Managing Director|Additional Director|Whole-time director|Alternate Director|Director appointed in casual vacancy|Director|CEO|CFO|Manager|Company Secretary)$/;
        } else if (req.body.mcaData.companyData.companyType.toLowerCase() == "llp") {
            var regExDesignation =
                /^(Designated Partner|Nominee for Body corporate designated partner)$/;
        } else if (
            req.body.mcaData.companyData.companyType.toLowerCase() == "company" &&
            req.body.mcaData.companyData.companyOrigin.toLowerCase() == "foreign"
        ) {
            var regExDesignation = /^(Authorised Representative)$/;
        }


        if (req.body.mcaData.signatoryMcaDetails.length != 0) {

            for (const item of req.body.mcaData.signatoryMcaDetails) {
                let filteredDirectorDetails = {}
                //Check Not Null Records
                if (
                    (item != undefined && item.DIN != null) ||
                    (item.DIN != undefined && item.PAN != null && item.PAN != undefined)
                ) {

                    if (item.MCAUserRole != null && item.MCAUserRole.length > 0) {

                        for (var i = 0; i < item.MCAUserRole.length; i++) {
                            if (
                                item.MCAUserRole[i].designation != "" &&
                                item.MCAUserRole[i].cin != ""
                            )

                                if (
                                    item.MCAUserRole[i].designation != null &&
                                    item.MCAUserRole[i].designation != undefined &&
                                    item.MCAUserRole[i].designation != "" &&
                                    item.MCAUserRole[i].designation.match(regExDesignation) &&
                                    req.body.mcaData.companyData.CIN == item.MCAUserRole[i].cin &&
                                    item.MCAUserRole[i].personType == "Signatory"
                                ) {
                                    //Association Status Conditions
                                    if (
                                        item.MCAUserRole[i].signatoryAssociationStatus == "Active" ||
                                        item.MCAUserRole[i].signatoryAssociationStatus ==
                                        "Resigned" ||
                                        item.MCAUserRole[i].signatoryAssociationStatus == "null" ||
                                        item.MCAUserRole[i].signatoryAssociationStatus == "" ||
                                        item.MCAUserRole[i].signatoryAssociationStatus == "Deactivated" && item.MCAUserRole[i].cessationDate == ""
                                    ) {
                                        //Serial No
                                        filteredDirectorDetails['serialNumber'] = currentSerialNo
                                        //Condition for DIN/PAN to be displayed.
                                        if (
                                            item.MCAUserRole[i].designation == "CEO" ||
                                            item.MCAUserRole[i].designation == "CFO" ||
                                            item.MCAUserRole[i].designation == "Manager" ||
                                            item.MCAUserRole[i].designation ==
                                            "Company Secretary" || item.MCAUserRole[i].designation == "Authorised Representative"
                                        ) {
                                            if (item.DIN != "" && item.PAN != "")
                                                filteredDirectorDetails['dinPanValue'] = item.PAN
                                            else if (item.DIN == "")
                                                filteredDirectorDetails['dinPanValue'] = item.PAN
                                            /*   else if (
                                                 item.DIN != "" &&
                                                 item.PAN != "" &&
                                                 item.MCAUserRole[i].designation ==
                                                   "Authorised Representative"
                                               )
                                                 var dinPanValue =
                                                   "<td><span class='redirect-Text' onclick='directorClickHandler(\"" +
                                                   item.DIN +
                                                   '","DIN")\' >' +
                                                   item.DIN +
                                                   "</span></td>"; */
                                            else if (item.PAN == "")
                                                filteredDirectorDetails['dinPanValue'] = item.DIN
                                        } else {
                                            if (item.DIN != "" && item.PAN != "")
                                                filteredDirectorDetails['dinPanValue'] = item.DIN
                                            else if (item.DIN == "")
                                                filteredDirectorDetails['dinPanValue'] = item.PAN
                                            else if (item.PAN == "")
                                                filteredDirectorDetails['dinPanValue'] = item.DIN
                                        }

                                        //Director Name
                                        if (item.FirstName != null && item.FirstName != "") {
                                            if (item.MiddleName != "" || item.MiddleName != null)
                                                filteredDirectorDetails['name'] = `${item.FirstName.replace(/\./g, '')} ${item.MiddleName.replace(/\./g, '')} ${item.LastName.replace(/\./g, '')}`
                                            else
                                                filteredDirectorDetails['name'] = `${item.FirstName.replace(/\./g, '')} ${item.LastName.replace(/\./g, '')}`
                                        } else {
                                            filteredDirectorDetails['name'] = `${item.FirstName.replace(/\./g, '')} ${item.LastName.replace(/\./g, '')}`
                                        }

                                        //Designation
                                        filteredDirectorDetails['designation'] = item.MCAUserRole[i].designation;

                                        // Date Of Appointment
                                        if (item.MCAUserRole[i].roleEffectiveDate != null) {
                                            if (item.MCAUserRole[i].roleEffectiveDate == "")
                                                filteredDirectorDetails['dateOfAppointment'] = item.MCAUserRole[i].currentDesignationDate
                                            else
                                                filteredDirectorDetails['dateOfAppointment'] = item.MCAUserRole[i].roleEffectiveDate
                                        } else if (item.MCAUserRole[i].roleEffectiveDate == null && item.MCAUserRole[i].currentDesignationDate == null) {
                                            filteredDirectorDetails['dateOfAppointment'] = "-"
                                        } else {
                                            filteredDirectorDetails['dateOfAppointment'] = "-"
                                        }

                                        //Cessation Date
                                        if (
                                            item.MCAUserRole[i].cessationDate != null &&
                                            item.MCAUserRole[i].cessationDate != undefined &&
                                            item.MCAUserRole[i].cessationDate != ""
                                        ) {
                                            filteredDirectorDetails['cessationDate'] = item.MCAUserRole[i].cessationDate
                                        } else {
                                            filteredDirectorDetails['cessationDate'] = "-"
                                        }

                                        //Signatory Type
                                        if (
                                            item.MCAUserRole[i].personType != null &&
                                            item.MCAUserRole[i].personType != undefined &&
                                            item.MCAUserRole[i].personType != "" &&
                                            item.MCAUserRole[i].personType == "Signatory"
                                        ) {
                                            filteredDirectorDetails['signatory'] = "Yes"
                                        } else {
                                            filteredDirectorDetails['signatory'] = "No"
                                        }
                                        filteredDirectorData.push(filteredDirectorDetails)
                                        currentSerialNo++;
                                    }
                                }
                        }

                    }

                }

            }

        }

        req.body.mcaData['filteredDirectorData'] = filteredDirectorData
        next()
    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}

newMca.directorDetails = async function (req, res, next) {
    try {
        let retrunDirectorData = [];

        for (let director of req.body.mcaData['filteredDirectorData']) {

            if (!director.dinPanValue.includes("*")) {

                let data = `data=${mcaUtilities.encrypt("ID=" + director.dinPanValue + "&requestID=din")}`;

                let config = {
                    method: 'post',
                    maxBodyLength: Infinity,
                    url: 'https://www.mca.gov.in/bin/MDSMasterDataServlet',
                    headers: {
                        'host': 'www.mca.gov.in',
                        'content-length': '53',
                        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                        'accept': 'application/json, text/javascript, */*; q=0.01',
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'x-requested-with': 'XMLHttpRequest',
                        'sec-ch-ua-mobile': '?0',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        'sec-ch-ua-platform': '"Windows"',
                        'origin': 'https://www.mca.gov.in',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS/director-master-info.html?DIN=SZcvAm0DDsWjlB1QgugOWg%3D%3D',
                        'accept-encoding': 'gzip, deflate, br, zstd',
                        'accept-language': 'en-US,en;q=0.9',
                        'priority': 'u=1, i',
                        'cookie': '__UUID-HASH=c365c18002b32d586295a1e256c626a0$; cookiesession1=678B2869E1DFAE152680CE741D9A8166'
                    },
                    data: data
                };

                let directorDetails = await axios(config)
                retrunDirectorData.push(directorDetails.data.data.directorData[0])

            }

        }

        req.body.mcaData['detailedDirectorData'] = retrunDirectorData
        next()


    } catch (error) {
        return res.send({ status: 'error', message: error.message });
    }
}