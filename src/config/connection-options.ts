import { __DEV__ } from "@/config/env";
import { MongoClientOptions } from "mongodb";

/**
 * @description Get MongoDB connection options optimized for serverless environments
 * @param username Optional username for authentication (development mode)
 * @param password Optional password for authentication (development mode)
 * @returns MongoDB client connection options
 */
export function getConnectionOptions(
  username?: string,
  password?: string
): MongoClientOptions {
  // Connection options optimized for serverless environments
  // If using DATABASE_URL (production), it usually includes auth in the URL
  // If using host:port (development), we need to provide auth separately
  const connectionOptions: MongoClientOptions = {};

  // Only add auth if not using a full connection string (development mode)
  if (__DEV__ && username && password) {
    connectionOptions.auth = {
      username,
      password,
    };
  }

  // Add timeout options to fail faster when server is unavailable
  // In development, use shorter timeouts for faster feedback
  if (__DEV__) {
    connectionOptions.serverSelectionTimeoutMS = 5000; // 5 seconds
    connectionOptions.connectTimeoutMS = 5000; // 5 seconds
    connectionOptions.socketTimeoutMS = 5000; // 5 seconds
  }

  return connectionOptions;
}
