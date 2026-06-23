const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middlewares/errorHandler');
const CustomError = require('./utils/customError');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false // Allows the frontend to load static files like images
}));

// Request logger
app.use(morgan('dev'));

// CORS Configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check / Welcome
app.get('/', (req, res) => {
  res.json({ message: 'Optical MIS API is running.' });
});

const authRoutes = require('./routes/authRoutes');
const branchRoutes = require('./routes/branchRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const labOrderRoutes = require('./routes/labOrderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// --- ROUTERS SECTION ---
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/lab-orders', labOrderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Handle 404 Route Not Found
app.all('*', (req, res, next) => {
  next(new CustomError(`Route ${req.originalUrl} not found on this server!`, 404));
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;
