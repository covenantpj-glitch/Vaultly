require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: '*' }));

// Body parser
app.use(express.json());

// Rate limiter — max 20 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please slow down.' }
});

// Stricter limiter for login/register — max 5 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Please wait 30 seconds.' }
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => res.json({ message: 'Vaultly API running ✅' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));