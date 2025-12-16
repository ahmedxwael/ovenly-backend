import { UPLOADS_FIELDNAME } from "@/modules/file-uploads/utils";
import path from "path";
import { getBaseDirectory } from "./serverless";

/**
 * Get the allowed uploads directory path
 * This is the root directory where all uploads must be stored
 */
export const getAllowedUploadsPath = (): string => {
  const baseDir = getBaseDirectory();
  return path.resolve(baseDir, UPLOADS_FIELDNAME);
};

/**
 * Validate that a file path is within the allowed uploads directory
 * Prevents directory traversal attacks
 *
 * @param filePath - The file path to validate
 * @returns true if the path is safe, false otherwise
 */
export const isPathWithinUploads = (filePath: string): boolean => {
  const allowedPath = getAllowedUploadsPath();
  const resolvedPath = path.resolve(filePath);

  // Normalize paths to handle different path separators
  const normalizedAllowed = path.normalize(allowedPath);
  const normalizedResolved = path.normalize(resolvedPath);

  // Check if the resolved path starts with the allowed path
  // This prevents directory traversal attacks like ../../../etc/passwd
  return (
    normalizedResolved.startsWith(normalizedAllowed + path.sep) ||
    normalizedResolved === normalizedAllowed
  );
};

/**
 * Validate file path and throw error if invalid
 *
 * @param filePath - The file path to validate
 * @throws Error if path is outside allowed uploads directory
 */
export const validateFilePath = (filePath: string): void => {
  if (!isPathWithinUploads(filePath)) {
    throw new Error(
      "Invalid path: File path is outside allowed uploads directory"
    );
  }
};
