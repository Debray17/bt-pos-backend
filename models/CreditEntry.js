const mongoose = require('mongoose');

const creditEntrySchema = new mongoose.Schema(
    {
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
        date: { type: Date, default: Date.now },
        description: { type: String, trim: true },
        debit: { type: Number, default: 0 },  // sale on credit
        credit: { type: Number, default: 0 }, // payment
        balanceAfter: { type: Number, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CreditEntry', creditEntrySchema);