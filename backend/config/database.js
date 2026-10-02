import mongoose from 'mongoose';

// Disable query buffering so disconnected queries fail fast rather than hanging requests
mongoose.set('bufferCommands', false);

let isConnecting = false;
let reconnectTimer = null;
let lastConnectionError = null;
let lastAttemptTimestamp = null;

// Sanitize error messages so credentials (passwords) are NEVER exposed
const sanitizeErrorMessage = (msg) => {
  if (!msg) return null;
  return msg.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@)/i, '$1***$2');
};

export const getMongoUri = () => {
  const raw = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!raw) return null;
  let url = raw.trim().replace(/^['"\s]+|['"\s]+$/g, '');
  if (url.startsWith('mongodb+srv://')) {
    // A mongodb+srv connection string cannot specify a port number
    url = url.replace(/^(mongodb\+srv:\/\/(?:[^@/]+@)?[^:/]+)(?::\d+)(\/.*)?$/i, '$1$2');
  }
  return url;
};

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

export const getDatabaseDiagnostics = () => {
  const uri = getMongoUri();
  return {
    hasConfig: !!uri,
    uriType: uri ? (uri.startsWith('mongodb+srv://') ? 'mongodb+srv' : 'mongodb') : null,
    lastError: lastConnectionError,
    lastAttempt: lastAttemptTimestamp,
  };
};

const scheduleReconnect = (delayMs = 15000) => {
  const uri = getMongoUri();
  if (reconnectTimer || !uri || isDatabaseConnected()) {
    return;
  }
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (!isDatabaseConnected() && !isConnecting) {
      console.log('[Database] Retrying MongoDB connection in background...');
      try {
        await connectDB();
      } catch (err) {
        console.warn(`[Database] Background reconnection caught error: ${err.message}`);
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
  lastAttemptTimestamp = new Date().toISOString();
  const primaryUrl = getMongoUri();
  const isProduction = process.env.NODE_ENV === 'production';
  const fallbackUrl = 'mongodb://127.0.0.1:27017/sih26132';

  try {
    if (primaryUrl) {
      try {
        const conn = await mongoose.connect(primaryUrl, {
          dbName: 'sih26132',
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
        console.log(`[Database] MongoDB Connected (Primary): ${conn.connection.host}`);
        lastConnectionError = null;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        return conn;
      } catch (error) {
        lastConnectionError = sanitizeErrorMessage(error.message);
        console.warn(`[Database] Primary MongoDB connection failed (${lastConnectionError}).`);
        if (isProduction) {
          console.error('[Database] Production mode active: local MongoDB fallback is disabled. Scheduling background reconnection attempt...');
          scheduleReconnect(15000);
          return null;
        }
        console.warn('[Database] Attempting fallback to local MongoDB in non-production mode...');
      }
    } else {
      lastConnectionError = 'No MongoDB connection URL configured in environment (MONGODB_URL / MONGODB_URI / MONGO_URI).';
      console.warn(`[Database] ${lastConnectionError}`);
    }

    if (isProduction) {
      console.error('[Database] Production mode active: local MongoDB fallback is disabled.');
      scheduleReconnect(15000);
      return null;
    }

    try {
      const conn = await mongoose.connect(fallbackUrl, {
        dbName: 'sih26132',
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      });
      console.log(`[Database] MongoDB Connected (Fallback): ${conn.connection.host}`);
      lastConnectionError = null;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      return conn;
    } catch (error) {
      lastConnectionError = sanitizeErrorMessage(error.message);
      console.warn(`[Database] MongoDB connection warning: ${lastConnectionError}. Continuing with disconnected database status.`);
      return null;
    }
  } finally {
    isConnecting = false;
  }
};

// Event listeners to keep state accurate and prevent unhandled process crashes
mongoose.connection.on('connected', () => {
  console.log('[Database] MongoDB connection established.');
  lastConnectionError = null;
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
  lastConnectionError = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
});

mongoose.connection.on('error', (err) => {
  lastConnectionError = sanitizeErrorMessage(err.message);
  console.warn(`[Database] Mongoose connection error event: ${lastConnectionError}`);
});

