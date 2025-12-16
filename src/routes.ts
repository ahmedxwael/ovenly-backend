import { log } from "@/shared/utils";
import { readdir } from "fs/promises";
import path from "path";

/**
 * Automatically imports all routes.ts files from the modules folder
 * This allows each module to define its own routes without manual registration
 */
export async function importRoutes() {
  try {
    // Get the src directory (works in both dev and production)
    // In dev: __dirname = src (when using ts-node-dev)
    // In production/Vercel: __dirname might be dist or the compiled location
    // Vercel with @vercel/node compiles on-the-fly, so we need to handle both cases
    let srcDir = __dirname;

    // If we're in a dist folder, go up to find src
    if (__dirname.includes("dist")) {
      srcDir = path.join(__dirname, "..", "src");
    }

    // If src doesn't exist, try the current directory (Vercel might use different structure)
    try {
      await readdir(srcDir);
    } catch {
      // If src doesn't exist, use current directory (for Vercel)
      srcDir = __dirname;
    }

    const modulesDir = path.join(srcDir, "modules");

    // Check if modules directory exists
    try {
      await readdir(modulesDir);
    } catch (error) {
      log.warn(
        `Modules directory not found at ${modulesDir}, trying alternative paths...`
      );
      // Try alternative: maybe we're already in src
      const altModulesDir = path.join(process.cwd(), "src", "modules");
      try {
        await readdir(altModulesDir);
        log.info(`Found modules at ${altModulesDir}`);
        return await importRoutesFromDir(
          altModulesDir,
          path.join(process.cwd(), "src")
        );
      } catch {
        throw new Error(
          `Could not find modules directory. Tried: ${modulesDir}, ${altModulesDir}`
        );
      }
    }

    return await importRoutesFromDir(modulesDir, srcDir);
  } catch (error) {
    log.error("Error importing routes:", error);
    throw error;
  }
}

async function importRoutesFromDir(
  modulesDir: string,
  srcDir: string
): Promise<void> {
  // Recursively find all routes.ts files
  const findRouteFiles = async (dir: string): Promise<string[]> => {
    const files: string[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findRouteFiles(fullPath);
        files.push(...subFiles);
      } else if (
        entry.isFile() &&
        (entry.name === "routes.ts" || entry.name === "routes.js")
      ) {
        files.push(fullPath);
      }
    }

    return files;
  };

  const routeFiles = await findRouteFiles(modulesDir);
  log.info(`Found ${routeFiles.length} route file(s) to import`);

  // Import all route files in parallel
  const importPromises = routeFiles.map(async (routeFile) => {
    try {
      // Convert absolute path to relative path from src directory
      const relativePath = path.relative(
        srcDir,
        routeFile.replace(/\.(ts|js)$/, "")
      );

      // Convert Windows paths to forward slashes
      const normalizedPath = relativePath.replace(/\\/g, "/");

      // In production (dist), we need .js extension for ESM imports
      // In development, ts-node handles .ts files
      const isProduction = __dirname.includes("dist");
      const importPath = isProduction
        ? `./${normalizedPath}.js`
        : `./${normalizedPath}`;

      log.info(`Importing routes from ${importPath}`);
      await import(importPath);
      log.note(`Imported routes from ${importPath}`);
    } catch (error) {
      log.error(`Failed to import route file ${routeFile}:`, error);
      throw error;
    }
  });

  await Promise.all(importPromises);
}
