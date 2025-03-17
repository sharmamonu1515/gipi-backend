const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const razorOrderIdSchema = new Schema ({
    id: String,
    entity: String,
    amount: Number,
    amount_paid: Number,
    amount_due: Number,
    currency: String,
    receipt: String,
    offer_id: String,
    status: String,
    attempts: Number,
    notes: [],
    created_at: String,
    orderCreatedAt: {
        type: Date,
        default: Date.now
    },
    userId: Schema.Types.ObjectId,
    freeConsultation: {
        type: Boolean,
        default: false
    },
    paymentDetails: {
        payId: String,
        razorSignature: String,
        isPaymentDone: {
            type: Boolean,
            default: false
        },
        paymentDoneDate: Date
    }
});

razorOrderIdSchema.statics.createOrderId = async function createOrderId (data) {
    try {
        let Order = mongoose.model('razor_order_id', razorOrderIdSchema);
        let newOrder = new Order();

        newOrder.id = data.id;
        newOrder.entity = data.entity;
        newOrder.amount = data.amount;
        newOrder.amount_paid = data.amount_paid;
        newOrder.amount_due = data.amount_due;
        newOrder.currency = data.currency;
        newOrder.receipt = data.receipt;
        newOrder.offer_id = data.offer_id;
        newOrder.status = data.status;
        newOrder.attempts = data.attempts;
        newOrder.notes = data.notes;
        newOrder.created_at = data.created_at;
        newOrder.userId = data.userId;
        newOrder.freeConsultation = data.freeConsultation;

        let savedOrder = await newOrder.save();
        return savedOrder;

    } catch (error) {
        throw new Error(error);
    }
}

module.exports = mongoose.model('razor_order_id', razorOrderIdSchema);