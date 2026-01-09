const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        sku: { type: String, trim: true, unique: true, sparse: true },
        salePrice: { type: Number, required: true, min: 0 },
        stock: { type: Number, required: true, min: 0, default: 0 },
        minStock: { type: Number, min: 0, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);