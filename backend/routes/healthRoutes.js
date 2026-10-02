import express from 'express';
import { getDatabaseStatus, isDatabaseConnected, getDatabaseDiagnostics } from '../config/database.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const dbReady = isDatabaseConnected();
  const diagnostics = getDatabaseDiagnostics();

  res.status(200).json({
    success: true,
    server: 'healthy',
    ready: dbReady,
    database: dbStatus,
    diagnostics,
    message: dbReady
      ? 'Server is healthy and database is connected'
      : `Server is online but database is currently ${dbStatus}`,
    timestamp: new Date().toISOString(),
  });
});

export default router;

