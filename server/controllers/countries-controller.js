const countryInfo = require('../countries.json');
const ApiUtility = require('../../lib/api-utility');

const country = module.exports;
const mongoose = require('mongoose');

// Get Country Data
country.getCountriesData = async function getCountriesData(req, res) {
    try {

        if (!req.query.countryCode)
            return res.send(ApiUtility.failed('Missing Required Fields'));

        let countryDetails = countryInfo[req.query.countryCode.toUpperCase()];
        if (countryDetails) {
            countryDetails.shortName = req.query.countryCode;
            delete countryDetails.states;
            return res.send(ApiUtility.success(countryDetails, 'Country Info Successfully'));
        } else {
            return res.send(ApiUtility.failed('Countries Info Not Available'));
        }

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}

country.getCountriesInfo = async function getCountriesInfo(countryCode) {
    try {

        if (!countryCode)
            throw 'Missing required fields';

        let countryDetails = countryInfo[countryCode.toUpperCase()];
        if (countryDetails) {
            countryDetails.shortName = countryCode;
            delete countryDetails.states;
            return countryDetails;
        } else {
            throw 'Countries Info Not Available';
        }

    } catch (error) {
        return res.send(ApiUtility.failed(error.message));
    }
}


