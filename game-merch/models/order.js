const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerAddress: {
        type: String,
        required: true
    },
    items: [orderItemSchema],
    totalPaid: {
        type: Number,
        required: true
    },
    paymentDetails: {
        cardLast4: { type: String },
        cardType: { type: String, default: 'Credit Card' }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);