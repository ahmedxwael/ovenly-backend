import { Express } from "express";
import { router } from "@/core";
import { importRoutes } from "@/routes";
import { log } from "@/shared/utils";

export async function registerRoutes(app: Express) {
  try {
    // Automatically import all routes.ts files from modules folder
    await importRoutes();

    // Scan the routes and register them with Express
    router.scan(app);

    const routes = router.getRoutes();
    log.success(`Registered ${routes.length} route(s)`);
  } catch (error) {
    log.error("Failed to register routes:", error);
    throw error;
  }
}
