var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var gstCookieSchema = new Schema({

    captchaCookie: String,
    captchaOtherCookie: String,
    authToken: String,
    username: String,
    entityRefId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

gstCookieSchema.statics.addCookie = async function addCookie(data) {
    try {

        let GstCookie = mongoose.model(`gstCookie`, gstCookieSchema);
        let newGstCookie = new GstCookie(data);

        let savedGstCookie = await newGstCookie.save();
        return savedGstCookie;

    } catch (error) {
        throw new Error(error);
    }
}
module.exports = mongoose.model('gstCookie',gstCookieSchema);