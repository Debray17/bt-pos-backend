const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products?q=search
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        const filter = q
            ? {
                $or: [
                    { name: new RegExp(q, 'i') },
                    { sku: new RegExp(q, 'i') },
                ],
            }
            : {};

        const products = await Product.find(filter).sort({ name: 1 });
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const prod = await Product.findById(req.params.id);
        if (!prod) return res.status(404).json({ message: 'Product not found' });
        res.json(prod);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    try {
        const { name, sku, salePrice, stock, minStock } = req.body;
        if (!name || salePrice == null) {
            return res.status(400).json({ message: 'Name and price are required' });
        }

        const product = new Product({
            name,
            sku,
            salePrice,
            stock: stock || 0,
            minStock: minStock || 0,
        });

        const saved = await product.save();
        res.status(201).json(saved);
    } catch (err) {
        console.error('Error creating product:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'SKU must be unique' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, sku, salePrice, stock, minStock } = req.body;

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            { name, sku, salePrice, stock, minStock },
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ message: 'Product not found' });
        res.json(updated);
    } catch (err) {
        console.error('Error updating product:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'SKU must be unique' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/products/:id/adjust-stock
router.post('/:id/adjust-stock', async (req, res) => {
    try {
        const { change } = req.body; // positive or negative number
        if (typeof change !== 'number') {
            return res.status(400).json({ message: 'change must be a number' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const newStock = product.stock + change;
        if (newStock < 0) {
            return res.status(400).json({ message: 'Stock cannot be negative' });
        }

        product.stock = newStock;
        await product.save();

        res.json(product);
    } catch (err) {
        console.error('Error adjusting stock:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;