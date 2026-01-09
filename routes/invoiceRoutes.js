const express = require('express');
const Invoice = require('../models/Invoice');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const CreditEntry = require('../models/CreditEntry');

const router = express.Router();

function generateInvoiceNumber() {
    const now = new Date();
    return (
        'INV-' +
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        '-' +
        now.getTime()
    );
}

// GET /api/invoices?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
    try {
        const { from, to } = req.query;
        const filter = {};
        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                filter.date.$lte = toDate;
            }
        }

        const invoices = await Invoice.find(filter).sort({ date: -1 }).lean();
        res.json(invoices);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).lean();
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        console.error('Error fetching invoice:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/invoices
// Body: { customerId?, customerName?, isCredit?, items: [ { productId, quantity } ] }
router.post('/', async (req, res) => {
    try {
        const { customerId, customerName, isCredit, items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        if (isCredit && !customerId) {
            return res
                .status(400)
                .json({ message: 'Credit sale must have a customer selected' });
        }

        // Load products
        const productIds = items.map((i) => i.productId);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));

        // Build invoice items and check stock
        const invoiceItems = [];
        let total = 0;

        for (const item of items) {
            const { productId, quantity } = item;

            if (!productId || !quantity || quantity <= 0) {
                return res.status(400).json({
                    message: 'Each item needs productId and positive quantity',
                });
            }

            const product = productMap.get(productId);
            if (!product) {
                return res.status(400).json({ message: 'Product not found: ' + productId });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    message: `Not enough stock for ${product.name}. In stock: ${product.stock}`,
                });
            }

            const price = product.salePrice;
            const lineTotal = price * quantity;

            invoiceItems.push({
                productId: product._id,
                productName: product.name,
                quantity,
                price,
                lineTotal,
            });

            total += lineTotal;
        }

        // Deduct stock
        for (const invItem of invoiceItems) {
            const product = productMap.get(invItem.productId.toString());
            product.stock -= invItem.quantity;
            await product.save();
        }

        const invoiceNumber = generateInvoiceNumber();

        let customer = null;
        if (isCredit && customerId) {
            customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(400).json({ message: 'Customer not found' });
            }
            const newBalance = customer.balance + total;
            customer.balance = newBalance;
            await customer.save();

            await CreditEntry.create({
                customerId: customer._id,
                description: `Invoice ${invoiceNumber}`,
                debit: total,
                credit: 0,
                balanceAfter: newBalance,
            });
        }

        const invoice = new Invoice({
            invoiceNumber,
            customerId: customerId || undefined,
            customerName: customerName || (customer ? customer.name : undefined),
            isCredit: !!isCredit,
            items: invoiceItems,
            total,
        });

        const saved = await invoice.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Error creating invoice:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;