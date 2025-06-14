
// backend/src/app.js
const express = require('express');
const cors = require('cors');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const helpTicketRoutes = require('./routes/helpTicketRoutes');
const lgpdRoutes = require('./routes/lgpdRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

// API Routes
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/products`, productRoutes);
app.use(`${config.apiPrefix}/cart`, cartRoutes);
app.use(`${config.apiPrefix}/orders`, orderRoutes);
app.use(`${config.apiPrefix}/users`, userRoutes);
app.use(`${config.apiPrefix}/service-requests`, serviceRequestRoutes);
app.use(`${config.apiPrefix}/help-tickets`, helpTicketRoutes);
app.use(`${config.apiPrefix}/lgpd-terms`, lgpdRoutes);
app.use(`${config.apiPrefix}/dashboard`, dashboardRoutes);

// Basic root route
app.get(config.apiPrefix, (req, res) => {
  res.json({ message: `Bem-vindo à API do ${process.env.APP_NAME || 'UNIFAFIBE Marketplace'}` });
});

// Error handling middleware (simple example)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack || err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor.';
  res.status(statusCode).json({ message });
});

module.exports = app;
