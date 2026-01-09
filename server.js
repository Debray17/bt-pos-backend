const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const customerRoutes = require('./routes/customerRoutes')
const authRequired = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Public auth routes
app.use('/api/auth', authRoutes);

// Protected routes (must send Bearer token)
app.use('/api/products', authRequired, productRoutes);
app.use('/api/invoices', authRequired, invoiceRoutes);
app.use('/api/dashboard', authRequired, dashboardRoutes);
app.use('/api/customers', authRequired, customerRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop-pos';

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date()
    });
});


mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Mongo connection error:', err);
        process.exit(1);
    });