const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/orbit';
    const useMemoryDb = process.env.USE_IN_MEMORY_DB === 'true';

    if (useMemoryDb) {
      console.log('🔄 Initializing in-memory MongoDB instance for development/testing...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`✅ In-memory MongoDB Connected: ${uri}`);
        return;
      } catch (memErr) {
        console.warn('⚠️ Could not start mongodb-memory-server, trying standard MONGO_URI...', memErr.message);
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If local connection fails and memory server wasn't explicitly disabled, try memory server fallback
    if (!mongod) {
      try {
        console.log('🔄 Attempting fallback to in-memory MongoDB...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);
        console.log(`✅ Fallback In-memory MongoDB Connected: ${uri}`);
        return;
      } catch (fallbackErr) {
        console.error('❌ Failed to launch fallback database:', fallbackErr.message);
      }
    }
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

module.exports = { connectDB, disconnectDB };
