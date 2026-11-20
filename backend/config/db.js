import mongoose from 'mongoose';
import { env } from './env.js';

// Cache the connection across serverless invocations.
const cache = globalThis.__khayyanMongo || (globalThis.__khayyanMongo = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 5,
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }
  return cache.conn;
}
