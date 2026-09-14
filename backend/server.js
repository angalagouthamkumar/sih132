import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
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
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

// Production environment variable validation
if (process.env.NODE_ENV === 'production') {
  const requiredEnv = ['MONGODB_URL', 'JWT_SECRET', 'CLIENT_URLS'];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[Fatal Startup Error] Missing required production environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration parsing comma-separated CLIENT_URLS
const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Strict origin rejection - do NOT allow arbitrary browser origins
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/market-data', marketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requirements', requirementRoutes);
app.use('/api/matches', matchRoutes);

// Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to Database before accepting traffic
const startServer = async () => {
  const dbConnection = await connectDB();

  if (process.env.NODE_ENV === 'production' && !dbConnection) {
    console.error('[Fatal Startup Error] Production MongoDB connection failed. Exiting.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[Backend] Server listening on port ${PORT}`);
    console.log(`[Backend] Allowed CORS origins: ${allowedOrigins.join(', ')}`);
  });
};

startServer();
