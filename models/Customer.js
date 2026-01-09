// backend/models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        address: { type: String, trim: true },
        balance: { type: Number, default: 0 }, // positive = they owe you
    },
    { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);