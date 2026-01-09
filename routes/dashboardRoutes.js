const express = require('express');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const todayInvoices = await Invoice.find({ date: { $gte: startOfDay } }).lean();

        const totalSalesToday = todayInvoices.reduce(
            (sum, inv) => sum + (inv.total || 0),
            0
        );
        const invoiceCountToday = todayInvoices.length;

        const lowStockCount = await Product.countDocuments({
            minStock: { $gt: 0 },
            $expr: { $lte: ['$stock', '$minStock'] },
        });

        const creditCustomers = await Customer.find({ balance: { $gt: 0 } }).lean();
        const outstandingTotal = creditCustomers.reduce(
            (sum, c) => sum + (c.balance || 0),
            0
        );
        const outstandingCustomers = creditCustomers.length;

        res.json({
            totalSalesToday,
            invoiceCountToday,
            lowStockCount,
            outstandingTotal,
            outstandingCustomers,
        });
    } catch (err) {
        console.error('Error fetching summary:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/dashboard/low-stock
router.get('/low-stock', async (req, res) => {
    try {
        const products = await Product.find({
            minStock: { $gt: 0 },
            $expr: { $lte: ['$stock', '$minStock'] },
        })
            .sort({ stock: 1 })
            .lean();

        res.json(products);
    } catch (err) {
        console.error('Error fetching low-stock products:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;