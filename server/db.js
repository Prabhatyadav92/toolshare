const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/toolshare';
let memoryServer = null;

const isLocal = (uri) => /(\/\/|@)(localhost|127\.0\.0\.1)(:|\/|$)/.test(uri);

/**
 * Connects to MongoDB.
 * - If MONGO_URI points to a remote DB (Atlas), it must connect or we fail with a clear message.
 * - If no MONGO_URI is set (or it is localhost) and no local MongoDB is running,
 *   we start a temporary in-memory MongoDB so the app still works out of the box.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI || LOCAL_URI;

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB connected (' + (isLocal(uri) ? 'local' : 'remote') + ')');
    return { memory: false };
  } catch (err) {
    if (!isLocal(uri) || process.env.NODE_ENV === 'production') {
      throw new Error(
        `Could not connect to MongoDB: ${err.message}\n` +
          'Check MONGO_URI (server/.env locally, or your host\'s environment variables), the password, and that Atlas Network Access allows your host (use 0.0.0.0/0 for cloud hosts).'
      );
    }

    console.warn('No local MongoDB found. Starting a temporary in-memory database (data resets on restart)...');
    let MongoMemoryServer;
    try {
      ({ MongoMemoryServer } = require('mongodb-memory-server'));
    } catch (e) {
      throw new Error(
        'MongoDB is not running and the in-memory fallback is not installed.\n' +
          'Fix: run "npm run install-all" again, OR install MongoDB, OR set MONGO_URI to a free MongoDB Atlas URI in server/.env'
      );
    }

    try {
      memoryServer = await MongoMemoryServer.create();
    } catch (e) {
      throw new Error(
        'Could not start the in-memory MongoDB (first run needs internet to download it once).\n' +
          'Details: ' + e.message + '\n' +
          'Fix: install MongoDB Community from mongodb.com, OR create a free MongoDB Atlas cluster and put its URI in server/.env as MONGO_URI'
      );
    }
    await mongoose.connect(memoryServer.getUri('toolshare'));
    console.log('In-memory MongoDB connected');
    return { memory: true };
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
