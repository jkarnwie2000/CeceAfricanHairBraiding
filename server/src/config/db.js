import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/**
 * Connect once and reuse the connection. In serverless environments (Vercel) the module stays
 * warm between invocations, so caching the promise avoids opening a new connection per request.
 */
let connecting = null;

export async function connectDB(uri) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 })
      .then(() => {
        const { host, name } = mongoose.connection;
        if (process.env.NODE_ENV !== 'test') console.log(`[db] Connected to MongoDB ${host}/${name}`);
        return mongoose.connection;
      })
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  return connecting;
}

export async function disconnectDB() {
  connecting = null;
  await mongoose.disconnect();
}
