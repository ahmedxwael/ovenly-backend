import { registerRoutes } from "@/config";
import { __DEV__, APP_HOST, APP_PORT } from "@/config/env";
import {
  errorHandler,
  faviconMiddleware,
  notFoundHandler,
  staticFiles,
} from "@/middlewares";
import { getAllowedUploadsPath, log, logError } from "@/shared/utils";
import express, { Express } from "express";

/**
 * Setup middlewares for the Express app
 */
async function setupMiddlewares(app: Express): Promise<void> {
  app.use(staticFiles());
  app.use(faviconMiddleware());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(getAllowedUploadsPath()));
}

/**
 * Setup error handlers (must be after routes)
 */
function setupErrorHandlers(app: Express): void {
  app.use(errorHandler);
  app.use(notFoundHandler);
}

/**
 * Register routes and setup error handlers
 */
export async function setupApp(app: Express): Promise<void> {
  await setupMiddlewares(app);
  await registerRoutes(app);
  setupErrorHandlers(app);
}

/**
 * Start the server (for local development only)
 */
export async function startServer(app: Express): Promise<void> {
  try {
    await setupApp(app);

    if (__DEV__) {
      app.listen(APP_PORT, () => {
        log.success(`Server is running on http://${APP_HOST}:${APP_PORT}`);
      });
    }
  } catch (error) {
    logError(error);
    process.exit(1);
  }
}
