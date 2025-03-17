var axios = require('axios');
const apiUtility = require('../../lib/api-utility');

const prob = module.exports;

prob.getCompanyDetailByCINOrPAN = async function (req, res) {
    try {
        const cinOrPan = req.params.cinOrPan;
        const searchType = req.query.type;

        const apiUrl = `https://api.probe42.in/probe_pro_sandbox/companies/${cinOrPan}/comprehensive-details?identifier_type=${searchType}`;
        const apiKey = process.env.PROB_API_KEY;

        const headers = {
            'accept': 'application/json',
            'x-api-version': '1.3',
            'x-api-key': apiKey
        };

        const response = await axios.get(apiUrl, { headers });
        return res.send(apiUtility.success(response.data,`Company Details fetched successfully!`));
    } catch (error) {
        console.log('Error in getCompanyDetailByCINOrPAN', error.response.message || error.message);
        return res.send({ status: 'error', message: error.message });
    }
}