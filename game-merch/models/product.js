const mongoose = require('mongoose');

const colorVariantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mainImage: { type: String, required: true },
    thumbnails: [{ type: String }],
    sizes: [{ type: String }]
}, { _id: false });

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    colors: [colorVariantSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);