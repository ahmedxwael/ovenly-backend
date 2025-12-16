import { __DEV__ } from "@/config/env";
import express from "express";
import fs from "fs";
import path from "path";
import favicon from "serve-favicon";

/**
 * Generate possible paths for a file or directory
 * Handles both local development and serverless environments (Vercel, etc.)
 */
function generatePossiblePaths(relativePath: string): string[] {
  return [
    path.join(__dirname, "..", relativePath), // Local: dist/relativePath or Vercel: /var/task/relativePath
    path.join(process.cwd(), relativePath), // Vercel/serverless: /var/task/relativePath
    path.join(process.cwd(), "dist", relativePath), // Vercel: /var/task/dist/relativePath
    path.join(__dirname, relativePath), // Alternative: dist/relativePath
  ];
}

/**
 * Resolve a file path by trying multiple possible locations
 * @param relativePath - Relative path from public directory (e.g., "favicon.ico")
 * @param mustBeDirectory - If true, checks that the path is a directory
 * @returns Resolved path or null if not found
 */
function resolvePath(
  relativePath: string,
  mustBeDirectory: boolean = false
): string | null {
  const possiblePaths = generatePossiblePaths(relativePath);

  return (
    possiblePaths.find((p) => {
      try {
        if (!fs.existsSync(p)) return false;
        return mustBeDirectory ? fs.statSync(p).isDirectory() : true;
      } catch {
        return false;
      }
    }) || null
  );
}

/**
 * No-op middleware that just calls next()
 * Used as a fallback when a middleware can't be initialized
 */
const noOpMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  next();
};

/**
 * Middleware to serve static files from the public directory
 * @param publicPath - Path to the public directory (default: "public")
 * @returns Express middleware
 */
export const staticFiles = (publicPath: string = "public") => {
  const staticPath =
    resolvePath(publicPath, true) || generatePossiblePaths(publicPath)[0];

  return express.static(staticPath, {
    maxAge: __DEV__ ? "0" : "1y",
    etag: true,
    lastModified: true,
    index: false,
    dotfiles: "ignore",
  });
};

/**
 * Middleware to serve favicon
 * Handles both local and serverless environments
 * @returns Express middleware (no-op if favicon not found)
 */
export const faviconMiddleware = () => {
  const faviconPath = resolvePath(path.join("public", "favicon.ico"));

  return faviconPath ? favicon(faviconPath) : noOpMiddleware;
};
