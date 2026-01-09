const express = require('express');
const Customer = require('../models/Customer');
const CreditEntry = require('../models/CreditEntry');

const router = express.Router();

// GET /api/customers
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json(customers);
    } catch (err) {
        console.error('Error fetching customers', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/customers
router.post('/', async (req, res) => {
    try {
        const { name, phone, address } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const customer = await Customer.create({ name, phone, address });
        res.status(201).json(customer);
    } catch (err) {
        console.error('Error creating customer', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        console.error('Error fetching customer', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/customers/:id  (update basic info)
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const updated = await Customer.findByIdAndUpdate(
            req.params.id,
            { name, phone, address },
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ message: 'Customer not found' });
        res.json(updated);
    } catch (err) {
        console.error('Error updating customer', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/customers/:id/ledger
router.get('/:id/ledger', async (req, res) => {
    try {
        const entries = await CreditEntry.find({ customerId: req.params.id })
            .sort({ date: 1, _id: 1 })
            .lean();
        res.json(entries);
    } catch (err) {
        console.error('Error fetching ledger', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/customers/:id/payments
router.post('/:id/payments', async (req, res) => {
    try {
        const { amount, description } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Amount must be positive' });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ message: 'Customer not found' });

        const newBalance = customer.balance - amount;
        customer.balance = newBalance;
        await customer.save();

        const entry = await CreditEntry.create({
            customerId: customer._id,
            description: description || 'Payment received',
            debit: 0,
            credit: amount,
            balanceAfter: newBalance,
        });

        res.status(201).json({ customer, entry });
    } catch (err) {
        console.error('Error recording payment', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;