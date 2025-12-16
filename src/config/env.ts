// Ensure dotenv is loaded before reading env vars
import "dotenv/config";

// App Configuration
export const APP_NAME = process.env.APP_NAME || "My App";
export const APP_URL = process.env.APP_URL || "http://localhost:3000";
export const APP_PORT = process.env.PORT || 3000;
export const APP_HOST = process.env.HOST || "localhost";
export const __DEV__ = process.env.NODE_ENV === "development";
export const API_PREFIX = process.env.API_PREFIX || "api";

// Log Level Configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || (__DEV__ ? "debug" : "info");

// MongoDB Configuration
export const DB_NAME = process.env.DATABASE_NAME;
export const DB_HOST = process.env.DATABASE_HOST || "localhost";
export const DB_PORT = process.env.DATABASE_PORT || 27017;
export const DB_URL = process.env.DATABASE_URL;
export const DB_USER = process.env.DATABASE_USER;
export const DB_PASS = process.env.DATABASE_PASSWORD;

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET!;

// SMTP Configuration
export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
