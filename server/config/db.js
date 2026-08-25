// server/config/db.js
const mongoose = require('mongoose');

// Fail fast on a bad URI instead of buffering queries for 30s.
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and fill it in.');
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected — the driver will keep retrying.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected.');
  });

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};

/**
 * Waits for every model's indexes to exist before the server takes traffic.
 *
 * Mongoose builds indexes in the background, so without this the unique
 * constraints (one review per person per journey, unique username/email) are
 * not yet enforced during the first requests after a cold start.
 */
const ensureIndexes = async () => {
  const models = Object.values(mongoose.models);

  // createIndexes() rather than init(): the models are compiled before
  // connect() runs, and init() additionally tries to create the collection
  // through a db handle that does not exist yet at that point.
  const results = await Promise.allSettled(models.map((model) => model.createIndexes()));
  const failures = results.filter((result) => result.status === 'rejected');

  // A pre-existing index with different options should be visible, not silent,
  // but it must not stop the server from booting.
  failures.forEach((failure) => console.error('Index build failed:', failure.reason?.message));

  console.log(`Indexes ready for ${models.length - failures.length}/${models.length} models.`);
};

module.exports = connectDB;
module.exports.ensureIndexes = ensureIndexes;
