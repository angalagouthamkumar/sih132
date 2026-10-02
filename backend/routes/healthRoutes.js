import express from 'express';
import { getDatabaseStatus, isDatabaseConnected } from '../config/database.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const dbReady = isDatabaseConnected();

  res.status(200).json({
    success: true,
    server: 'healthy',
    ready: dbReady,
    database: dbStatus,
    message: dbReady
      ? 'Server is healthy and database is connected'
      : `Server is online but database is currently ${dbStatus}`,
    timestamp: new Date().toISOString(),
  });
});

export default router;

