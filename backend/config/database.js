import mongoose from 'mongoose';

// Disable query buffering so disconnected queries fail fast rather than hanging requests
mongoose.set('bufferCommands', false);

export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'disconnected';
};

export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

let isConnecting = false;
let reconnectTimer = null;

const scheduleReconnect = (delayMs = 15000) => {
  if (reconnectTimer || !process.env.MONGODB_URL || isDatabaseConnected()) {
    return;
  }
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (!isDatabaseConnected() && !isConnecting) {
      console.log('[Database] Retrying MongoDB connection in background...');
      try {
        await connectDB();
      } catch (err) {
        console.warn(`[Database] Background reconnection attempt caught error: ${err.message}`);
      }
    }
  }, delayMs);

  if (reconnectTimer.unref) {
    reconnectTimer.unref();
  }
};

export const connectDB = async () => {
  if (isDatabaseConnected()) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return null;
  }

  isConnecting = true;
  const primaryUrl = process.env.MONGODB_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  const fallbackUrl = 'mongodb://127.0.0.1:27017/sih26132';

  try {
    if (primaryUrl) {
      try {
        const conn = await mongoose.connect(primaryUrl, {
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
        console.log(`[Database] MongoDB Connected (Primary): ${conn.connection.host}`);
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        return conn;
      } catch (error) {
        console.warn(`[Database] Primary MongoDB connection failed (${error.message}).`);
        if (isProduction) {
          console.error('[Database] Production mode active: local MongoDB fallback is disabled. Scheduling background reconnection attempt...');
          scheduleReconnect(15000);
          return null;
        }
        console.warn('[Database] Attempting fallback to local MongoDB in non-production mode...');
      }
    }

    if (isProduction) {
      console.error('[Database] Production mode active: local MongoDB fallback is disabled.');
      scheduleReconnect(15000);
      return null;
    }

    try {
      const conn = await mongoose.connect(fallbackUrl, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      console.log(`[Database] MongoDB Connected (Fallback): ${conn.connection.host}`);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      return conn;
    } catch (error) {
      console.warn(`[Database] MongoDB connection warning: ${error.message}. Continuing with disconnected database status.`);
      return null;
    }
  } finally {
    isConnecting = false;
  }
};

// Event listeners to keep state accurate and prevent unhandled process crashes
mongoose.connection.on('connected', () => {
  console.log('[Database] MongoDB connection established.');
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB connection lost.');
  scheduleReconnect(10000);
});

mongoose.connection.on('reconnected', () => {
  console.log('[Database] MongoDB reconnected successfully.');
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
});

mongoose.connection.on('error', (err) => {
  console.warn(`[Database] Mongoose connection error event: ${err.message}`);
});

