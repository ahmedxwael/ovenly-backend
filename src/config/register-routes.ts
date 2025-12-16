import { router } from "@/core";
import { importRoutes } from "@/routes";
import { log } from "@/shared/utils";
import { Express } from "express";

/**
 * Register all routes with the Express app.
 * Routes are discovered dynamically and registered automatically.
 */
export async function registerRoutes(app: Express): Promise<void> {
  try {
    // Dynamically discover and import all route files
    await importRoutes();

    // Register all discovered routes with Express
    router.scan(app);

    const routes = router.getRoutes();
    log.success(`Registered ${routes.length} route(s)`);
  } catch (error) {
    log.error("Failed to register routes:", error);
    throw error;
  }
}
