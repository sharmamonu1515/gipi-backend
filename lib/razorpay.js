const RazorPay = require('razorpay');
const Promise = require('bluebird');
const crypto = require('crypto');

// const instance = new RazorPay({
//     key_id: process.env.RAZOR_KEY_ID,
//     key_secret: process.env.RAZOR_PAY_SECRET
// });

const razorUtil = module.exports;

razorUtil.generateOrderId = function generateOrderId (data) { // Generate Order Id

    return new Promise(function (resolve, reject) {

        var options = {
            amount: Number(data.amount) *100,
            currency: data.currency,
            receipt: `tela_${Date.now()}`
        }
        instance.orders.create(options).then((order) => {
            resolve(order)
        }).catch((err) =>{
            reject(err);
        })

    })
}

razorUtil.verifyPaymentSignature = function verifyPaymentSignature (data) { // Verify Signature

    return new Promise(function (resolve, reject) {

        const hmac = crypto.createHmac('sha256', process.env.RAZOR_PAY_SECRET);
        hmac.update(data.razorOrderId + "|" + data.razorPayId);
        let generatedSignature = hmac.digest('hex');
        let isSignatureValid = generatedSignature == data.razorSignature

        resolve(isSignatureValid);
    })
}