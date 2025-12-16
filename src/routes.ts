import { log } from "@/shared/utils";
import { readdir } from "fs/promises";
import path from "path";

/**
 * Automatically discovers and imports all route files from the modules folder.
 * Route files are expected to be named "routes.ts" or "routes.js" and located
 * in subdirectories of the modules folder.
 *
 * This module uses fully dynamic discovery - no manual registration needed.
 * Just create a routes.ts file in any module and it will be automatically discovered.
 */

/**
 * Get the modules directory path based on the current environment
 */
function getModulesDirectory(): string {
  const isProduction = __dirname.includes("dist");
  const projectRoot = process.cwd();

  if (isProduction) {
    // Production: files are in dist/
    return path.join(projectRoot, "dist", "modules");
  } else {
    // Development: files are in src/
    return path.join(projectRoot, "src", "modules");
  }
}

/**
 * Recursively find all route files (routes.ts or routes.js) in a directory
 */
async function findRouteFiles(
  dir: string,
  depth: number = 0
): Promise<string[]> {
  const routeFiles: string[] = [];
  const indent = "  ".repeat(depth);

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    log.info(`${indent}Scanning: ${dir} (${entries.length} entries)`);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        log.info(`${indent}  [DIR] ${entry.name}`);
        // Recursively search subdirectories
        const subFiles = await findRouteFiles(fullPath, depth + 1);
        routeFiles.push(...subFiles);
      } else {
        log.info(`${indent}  [FILE] ${entry.name}`);
        if (entry.name === "routes.ts" || entry.name === "routes.js") {
          routeFiles.push(fullPath);
          log.info(`${indent}    ✓ Found route file: ${fullPath}`);
        }
      }
    }
  } catch (error: any) {
    log.error(`Could not read directory ${dir}: ${error?.message || error}`);
  }

  return routeFiles;
}

/**
 * Convert an absolute file path to a relative import path
 */
function getImportPath(filePath: string, isProduction: boolean): string {
  const fileWithoutExt = filePath.replace(/\.(ts|js)$/, "");
  const relativePath = path.relative(__dirname, fileWithoutExt);
  const normalizedPath = relativePath.replace(/\\/g, "/");

  // Add ./ prefix if needed and .js extension in production
  const importPath = normalizedPath.startsWith(".")
    ? normalizedPath
    : `./${normalizedPath}`;

  return isProduction ? `${importPath}.js` : importPath;
}

/**
 * Dynamically import a route file
 */
async function importRouteFile(
  filePath: string,
  isProduction: boolean
): Promise<void> {
  const importPath = getImportPath(filePath, isProduction);

  try {
    await import(importPath);
    log.info(`✓ Imported routes from ${path.basename(path.dirname(filePath))}`);
  } catch (error: any) {
    log.error(
      `Failed to import route file ${filePath}: ${error?.message || error}`
    );
    throw error;
  }
}

/**
 * Automatically imports all routes.ts files from the modules folder.
 * This function dynamically discovers route files and imports them.
 */
export async function importRoutes(): Promise<void> {
  try {
    const isProduction = __dirname.includes("dist");
    const modulesDir = getModulesDirectory();

    log.info(`Discovering route files in: ${modulesDir}`);

    // Find all route files
    const routeFiles = await findRouteFiles(modulesDir);

    if (routeFiles.length === 0) {
      log.warn("No route files found in modules directory.");
      return;
    }

    log.info(`Found ${routeFiles.length} route file(s)`);

    // Import all route files in parallel
    await Promise.all(
      routeFiles.map((file) => importRouteFile(file, isProduction))
    );

    log.success(`Successfully imported ${routeFiles.length} route file(s)`);
  } catch (error) {
    log.error("Error importing routes:", error);
    throw error;
  }
}
