const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
// Configure CORS: allow specific origins in production, be permissive in dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.RENDER_EXTERNAL_URL
].filter(Boolean);

// Allow localhost during development
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /\.onrender\.com$/.test(new URL(origin).hostname)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
};

// In development, allow all origins to support local network access (e.g., 10.x/192.168.x)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
} else {
  app.use(cors(corsOptions));
}
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roommate-expense-splitter';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('Auth routes loaded');
} catch (error) {
  console.log('Auth routes error:', error.message);
}

try {
  app.use('/api/groups', require('./routes/groups'));
  console.log('Groups routes loaded');
} catch (error) {
  console.log('Groups routes error:', error.message);
}

try {
  app.use('/api/expenses', require('./routes/expenses'));
  console.log('Expenses routes loaded');
} catch (error) {
  console.log('Expenses routes error:', error.message);
}

// Payment routes (optional - only if Razorpay is configured)
try {
  app.use('/api/payments', require('./routes/payments'));
  console.log('Payment routes loaded');
} catch (error) {
  console.log('Payment routes disabled:', error.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files in production from ../frontend/build
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.resolve(__dirname, '../frontend/build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    // Only handle non-API routes with SPA fallback
    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  } else {
    console.warn('Frontend build directory not found at', buildPath);
  }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Server error:', error);
});

module.exports = app; 