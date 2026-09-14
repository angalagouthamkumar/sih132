import express from 'express';
import { getDatabaseStatus } from '../config/database.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    database: dbStatus,
  });
});

export default router;
