const Crypto = require('crypto-js');

const crypto = module.exports;

crypto.decrypt = function decrypt(input) {
    try {
        
        return Crypto.AES.decrypt(input.trim(), process.env.CRYPTO_ENC_KEY).toString(Crypto.enc.Utf8);

    } catch (error) {
        throw error;
    }
}