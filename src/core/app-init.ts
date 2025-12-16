import { Express, NextFunction, Request, Response } from "express";
import { __DEV__ } from "@/config/env";
import { logError } from "@/shared/utils";
import { connectToDB } from "@/core/db";
import { setupApp, startServer } from "@/core/server";

// Serverless initialization state
type InitState = {
  isInitialized: boolean;
  promise: Promise<void> | null;
};

let initState: InitState = {
  isInitialized: false,
  promise: null,
};

/**
 * Handle initialization errors based on environment
 */
function handleInitError(error: unknown): void {
  if (__DEV__) {
    setTimeout(() => {
      process.exit(1);
    }, 100);
  } else {
    console.error("Failed to initialize application:", error);
  }
}

/**
 * Create initialization guard middleware for serverless environments
 * Ensures app is fully initialized before handling requests
 */
function createInitGuard() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (initState.isInitialized) {
      return next();
    }

    if (!initState.promise) {
      return res.status(500).json({
        error: "Application initialization not started",
      });
    }

    try {
      await initState.promise;
      next();
    } catch (error) {
      res.status(500).json({
        error: "Application initialization failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}

/**
 * Initialize the application (connect DB and setup routes)
 * Used for serverless environments where we don't call app.listen()
 */
export async function initializeApp(app: Express): Promise<void> {
  try {
    await connectToDB();
    await setupApp(app);
  } catch (error) {
    logError(error);
    throw error;
  }
}

/**
 * Start the application (for local development)
 */
export async function startApplication(app: Express): Promise<void> {
  await connectToDB();
  await startServer(app);
}

/**
 * Setup app initialization based on environment
 * - Development: starts server with app.listen()
 * - Production/Serverless: initializes routes and adds guard middleware
 */
export function setupAppInitialization(app: Express): void {
  if (__DEV__) {
    // Development: start server with app.listen()
    startApplication(app).catch(handleInitError);
  } else {
    // Production/Serverless: initialize routes and wait for requests
    initState.promise = initializeApp(app)
      .then(() => {
        initState.isInitialized = true;
      })
      .catch((error) => {
        handleInitError(error);
        throw error;
      });

    // Guard middleware: ensure initialization completes before handling requests
    app.use(createInitGuard());
  }
}
