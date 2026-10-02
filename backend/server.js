import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, isDatabaseConnected } from './config/database.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';
import requirementRoutes from './routes/requirementRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import requirementOfferRoutes from './routes/requirementOfferRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

// Production environment variable validation
if (process.env.NODE_ENV === 'production') {
  const requiredEnv = ['MONGODB_URL', 'JWT_SECRET', 'CLIENT_URLS'];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[Fatal Startup Error] Missing required production environment variables: ${missing.join(', ')}`);
    // Note: Do not hard exit in production to allow Render port binding and health check diagnostics
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Normalized CORS origin configuration
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'https://sih132-5paw.vercel.app',
];

const envOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server, curl, mobile
  const normalized = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.includes(normalized)) return true;
  // Allow Vercel preview deployments matching pattern
  if (/^https:\/\/sih132-[a-z0-9-]+\.vercel\.app$/.test(normalized)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Deny origin safely without throwing 500 internal server error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Public Health Check Route (does not require database ready state)
app.use('/api', healthRoutes);

// Fast Database Availability Guard for data routes to prevent hanging requests when DB is reconnecting
const checkDatabaseAvailability = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  if (!isDatabaseConnected()) {
    res.setHeader('Retry-After', '5');
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is connecting or temporarily unavailable. Please retry in a few moments.',
    });
  }
  next();
};

// Protected / Data API Routes (guarded by database readiness)
app.use('/api/auth', checkDatabaseAvailability, authRoutes);
app.use('/api/crops', checkDatabaseAvailability, cropRoutes);
app.use('/api/offers', checkDatabaseAvailability, offerRoutes);
app.use('/api/orders', checkDatabaseAvailability, orderRoutes);
app.use('/api/market-data', checkDatabaseAvailability, marketRoutes);
app.use('/api/admin', checkDatabaseAvailability, adminRoutes);
app.use('/api/users', checkDatabaseAvailability, userRoutes);
app.use('/api/requirements', checkDatabaseAvailability, requirementRoutes);
app.use('/api/requirement-offers', checkDatabaseAvailability, requirementOfferRoutes);
app.use('/api/matches', checkDatabaseAvailability, matchRoutes);

// Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server immediately on 0.0.0.0 so Render detects port binding without delay
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Backend] Server listening on 0.0.0.0:${PORT}`);
  console.log(`[Backend] Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});

// Connect to Database asynchronously in background without delaying server start
connectDB().catch((err) => {
  console.error(`[Database] Initial MongoDB connection error: ${err.message}`);
});

export default app;

