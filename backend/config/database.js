import mongoose from 'mongoose';

export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'disconnected';
};

export const connectDB = async () => {
  const primaryUrl = process.env.MONGODB_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  const fallbackUrl = 'mongodb://127.0.0.1:27017/sih26132';

  if (primaryUrl) {
    try {
      const conn = await mongoose.connect(primaryUrl, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`[Database] MongoDB Connected (Primary): ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`[Database] Primary MongoDB connection failed (${error.message}).`);
      if (isProduction) {
        console.error('[Database] Production mode active: local MongoDB fallback is disabled.');
        return null;
      }
      console.warn('[Database] Attempting fallback to local MongoDB in non-production mode...');
    }
  }

  if (isProduction) {
    console.error('[Database] Production mode active: local MongoDB fallback is disabled.');
    return null;
  }

  try {
    const conn = await mongoose.connect(fallbackUrl, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] MongoDB connection warning: ${error.message}. Continuing with disconnected database status.`);
    return null;
  }
};
