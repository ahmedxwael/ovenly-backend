import { existsSync, mkdirSync } from "fs";
import path from "path";
import { getBaseDirectory } from "./serverless";

/**
 * Ensure uploads directory exists
 * In serverless environments, uses /tmp directory
 * Handles both absolute and relative paths
 */
export const ensureDirectory = (directory: string) => {
  // If directory is already an absolute path, use it directly
  const fullPath = path.isAbsolute(directory)
    ? directory
    : path.join(getBaseDirectory(), directory);

  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }

  return fullPath;
};
