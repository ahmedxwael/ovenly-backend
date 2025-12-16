import { getConnectionOptions } from "@/config";
import {
  __DEV__,
  DB_HOST,
  DB_NAME,
  DB_PASS,
  DB_PORT,
  DB_URL,
  DB_USER,
} from "@/config/env";
import { log } from "@/shared/utils";
import { MongoClient } from "mongodb";
import { Database, db } from "./db";

// Helper functions
function buildConnectionUrl(): string {
  if (!__DEV__ && DB_URL) {
    return DB_URL;
  }
  return `mongodb://${DB_HOST}:${DB_PORT}`;
}

function sanitizeUrl(url: string): string {
  return url.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
}

function validateConnectionUrl(url: string | null): void {
  if (!url) {
    const message = __DEV__
      ? "Database connection URL is not set. Please set DATABASE_HOST and DATABASE_PORT environment variables."
      : "Database connection URL is not set. Please set DATABASE_URL environment variable for production.";
    log.error(message);
    throw new Error(message);
  }
}

async function isConnectionAlive(client: MongoClient): Promise<boolean> {
  try {
    await client.db().admin().ping();
    return true;
  } catch {
    return false;
  }
}

export class DBConnection {
  private static instance: DBConnection;
  private client: MongoClient | null = null;
  private clientDb: Database | null = null;

  private constructor() {}

  public static getInstance(): DBConnection {
    if (!DBConnection.instance) {
      DBConnection.instance = new DBConnection();
    }
    return DBConnection.instance;
  }

  public async connect(): Promise<Database> {
    try {
      // Reuse existing connection if alive
      if (
        this.client &&
        this.clientDb &&
        (await isConnectionAlive(this.client))
      ) {
        log.info("Database already connected");
        return this.clientDb;
      }

      // Reset dead connection
      if (this.client) {
        log.warn("Database connection lost, reconnecting...");
        this.reset();
      }

      // Build and validate connection URL
      const connectionUrl = buildConnectionUrl();
      validateConnectionUrl(connectionUrl);

      // Connect to database
      const options = getConnectionOptions(DB_USER, DB_PASS);
      log.info(
        `Connecting to database... [${__DEV__ ? "dev" : "prod"}] ${sanitizeUrl(connectionUrl)}`
      );

      this.client = await MongoClient.connect(connectionUrl, options);
      this.clientDb = db.setDatabase(this.client.db(DB_NAME));

      log.success(`Database connected successfully (${DB_NAME})`);

      if (__DEV__ && (!DB_USER || !DB_PASS)) {
        log.warn("You're not making a secure database connection!");
      }

      return this.clientDb;
    } catch (error: any) {
      // Provide helpful error messages for common connection issues
      if (
        error?.code === "ECONNREFUSED" ||
        error?.name === "MongoServerSelectionError"
      ) {
        const connectionUrl = buildConnectionUrl();
        const sanitizedUrl = sanitizeUrl(connectionUrl);

        log.error("Failed to connect to MongoDB server");
        log.error(`Connection URL: ${sanitizedUrl}`);
        log.error("");
        log.error("Possible solutions:");
        log.error("1. Make sure MongoDB is running locally:");
        log.error(
          "   - Windows: Check if MongoDB service is running in Services"
        );
        log.error("   - Or start MongoDB manually: mongod");
        log.error(
          "2. If using MongoDB Atlas (cloud), set DATABASE_URL in your .env file"
        );
        log.error(
          "3. Verify your DATABASE_HOST and DATABASE_PORT in .env file"
        );
        log.error("4. Check your firewall settings");
      }

      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client) {
      log.info("Database already disconnected");
      return;
    }

    await this.client.close();
    this.reset();
    log.info("Database disconnected successfully");
  }

  private reset(): void {
    this.client = null;
    this.clientDb = null;
  }
}

// Singleton instance
const dbConnection = DBConnection.getInstance();

// Public API
export async function connectToDB(): Promise<void> {
  await dbConnection.connect();
}

export async function disconnectFromDB(): Promise<void> {
  await dbConnection.disconnect();
}
