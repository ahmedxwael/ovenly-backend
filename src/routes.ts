import { log } from "@/shared/utils";
import { readdir } from "fs/promises";
import path from "path";

/**
 * Automatically imports all routes.ts files from the modules folder
 * This allows each module to define its own routes without manual registration
 */
export async function importRoutes() {
  try {
    const isProduction = __dirname.includes("dist");
    const projectRoot = process.cwd();

    log.info(
      `Route import starting - __dirname: ${__dirname}, cwd: ${projectRoot}, isProduction: ${isProduction}`
    );

    // Determine the base directory and modules directory
    // In production: files are in dist/, so modules are in dist/modules/
    // In development: files are in src/, so modules are in src/modules/
    let baseDir: string;
    let modulesDir: string;

    if (isProduction) {
      // Production: compiled files are in dist/
      baseDir = path.join(projectRoot, "dist");
      modulesDir = path.join(baseDir, "modules");
    } else {
      // Development: source files are in src/
      baseDir = path.join(projectRoot, "src");
      modulesDir = path.join(baseDir, "modules");
    }

    // Try to find modules directory
    let foundModulesDir = modulesDir;
    const pathsToTry = [
      modulesDir,
      path.join(projectRoot, "src", "modules"),
      path.join(projectRoot, "dist", "modules"),
      path.join(__dirname, "modules"),
      path.join(__dirname, "..", "modules"),
      path.join(__dirname, "..", "src", "modules"),
      path.join(__dirname, "..", "dist", "modules"),
    ];

    let found = false;
    for (const tryPath of pathsToTry) {
      try {
        await readdir(tryPath);
        foundModulesDir = tryPath;
        // Determine baseDir based on which path worked
        if (tryPath.includes("dist")) {
          baseDir = path.dirname(tryPath);
        } else if (tryPath.includes("src")) {
          baseDir = path.dirname(tryPath);
        } else {
          baseDir = path.dirname(tryPath);
        }
        log.info(`Found modules directory at: ${tryPath}`);
        found = true;
        break;
      } catch (error) {
        // Continue to next path
      }
    }

    if (!found) {
      const errorMsg = `Could not find modules directory. Tried: ${pathsToTry.join(", ")}`;
      log.error(errorMsg);
      throw new Error(errorMsg);
    }

    return await importRoutesFromDir(foundModulesDir, baseDir, isProduction);
  } catch (error) {
    log.error("Error importing routes:", error);
    throw error;
  }
}

async function importRoutesFromDir(
  modulesDir: string,
  baseDir: string,
  isProduction: boolean
): Promise<void> {
  // Helper to log directory contents for debugging
  const logDirectoryContents = async (
    dir: string,
    depth: number = 0
  ): Promise<void> => {
    const indent = "  ".repeat(depth);
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      log.info(`${indent}Directory: ${dir}`);
      for (const entry of entries) {
        if (entry.isDirectory()) {
          log.info(`${indent}  [DIR] ${entry.name}`);
          await logDirectoryContents(path.join(dir, entry.name), depth + 1);
        } else {
          log.info(`${indent}  [FILE] ${entry.name}`);
        }
      }
    } catch (error) {
      log.error(`${indent}Error reading directory ${dir}:`, error);
    }
  };

  // Log directory structure for debugging
  log.info(`Scanning for route files in: ${modulesDir}`);
  await logDirectoryContents(modulesDir);

  // Recursively find all routes.ts or routes.js files
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
        log.info(`Found route file: ${fullPath}`);
      }
    }

    return files;
  };

  const routeFiles = await findRouteFiles(modulesDir);
  log.info(`Found ${routeFiles.length} route file(s) to import`);

  if (routeFiles.length === 0) {
    log.warn(`No route files found in ${modulesDir}`);
    return;
  }

  // Import all route files in parallel
  const importPromises = routeFiles.map(async (routeFile) => {
    try {
      // Calculate relative path from __dirname (where this file is located) to the route file
      // This ensures imports work correctly in both dev and production
      const routeFileWithoutExt = routeFile.replace(/\.(ts|js)$/, "");
      const relativePath = path.relative(__dirname, routeFileWithoutExt);

      // Convert Windows paths to forward slashes
      const normalizedPath = relativePath.replace(/\\/g, "/");

      // Build import path
      // In production: use .js extension
      // In development: use relative path without extension (ts-node handles it)
      let importPath: string;

      if (isProduction) {
        // In production, ensure we have .js extension
        // If path doesn't start with ./, add it
        importPath = normalizedPath.startsWith(".")
          ? `${normalizedPath}.js`
          : `./${normalizedPath}.js`;
      } else {
        // In development, use relative path without extension
        // If path doesn't start with ./, add it
        importPath = normalizedPath.startsWith(".")
          ? normalizedPath
          : `./${normalizedPath}`;
      }

      log.info(
        `Importing routes from ${importPath} (file: ${routeFile}, __dirname: ${__dirname})`
      );

      try {
        await import(importPath);
        log.note(`Successfully imported routes from ${importPath}`);
      } catch (importError: any) {
        // Fallback: try using file:// URL for absolute path (works in some serverless environments)
        if (
          importError?.code === "ERR_MODULE_NOT_FOUND" ||
          importError?.message?.includes("Cannot find module")
        ) {
          log.warn(
            `Relative import failed, trying file:// URL approach for ${routeFile}`
          );
          const fileUrl = `file://${routeFileWithoutExt}${isProduction ? ".js" : ".ts"}`;
          try {
            await import(fileUrl);
            log.note(
              `Successfully imported routes using file:// URL: ${fileUrl}`
            );
          } catch (fileUrlError: any) {
            log.error(
              `Both relative and file:// URL imports failed for ${routeFile}`
            );
            log.error(
              `Relative import error: ${importError?.message || importError}`
            );
            log.error(
              `File URL import error: ${fileUrlError?.message || fileUrlError}`
            );
            throw importError; // Throw the original error
          }
        } else {
          throw importError;
        }
      }
    } catch (error: any) {
      log.error(`Failed to import route file ${routeFile}:`, error);
      log.error(`Error details: ${error?.message || error}`);
      if (error?.stack) {
        log.error(`Stack trace: ${error.stack}`);
      }
      throw error;
    }
  });

  await Promise.all(importPromises);
}
