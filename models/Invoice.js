const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: { type: String, required: true, unique: true },
        date: { type: Date, default: Date.now },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
        customerName: { type: String, trim: true },
        isCredit: { type: Boolean, default: false },
        items: { type: [invoiceItemSchema], required: true },
        total: { type: Number, required: true, min: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);