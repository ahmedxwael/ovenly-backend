import {
  ensureDirectory,
  hashBuffer,
  log,
  validateFilePath,
} from "@/shared/utils";
import { Request } from "express";
import fs from "fs/promises";
import path from "path";
import { getUploadPath } from "./upload-path";

/**
 * Generate hashed filename based on file content
 */
export const generateHashedFilename = async (
  filePath: string,
  originalName: string
): Promise<string> => {
  const fileBuffer = await fs.readFile(filePath);
  const contentHash = await hashBuffer(fileBuffer);
  const ext = path.extname(originalName);

  return `${contentHash}${ext}`;
};

/**
 * Check if file exists and return true if it does
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Process a single file for deduplication
 */
export const processFileDeduplication = async (
  file: Express.Multer.File
): Promise<void> => {
  const hashedFileName = await generateHashedFilename(
    file.path,
    file.originalname
  );
  const uploadPath = getUploadPath(file.fieldname);
  const destinationPath = ensureDirectory(uploadPath);
  const finalFilePath = path.join(destinationPath, hashedFileName);

  // Security: Prevent directory traversal attacks
  validateFilePath(finalFilePath);

  const exists = await fileExists(finalFilePath);

  if (exists) {
    // File exists, delete temporary file and use existing one
    await fs.unlink(file.path);
    file.filename = hashedFileName;
    file.path = finalFilePath;
  } else {
    // File doesn't exist, rename temp file to hashed filename
    await fs.rename(file.path, finalFilePath);
    file.filename = hashedFileName;
    file.path = finalFilePath;
  }
};

/**
 * Post-processing middleware to handle file deduplication
 * Checks if files with the same content already exist and reuses them
 */
export const handleDeduplication = async (
  req: Request,
  files: Express.Multer.File | Express.Multer.File[]
): Promise<void> => {
  const fileArray = Array.isArray(files) ? files : [files];

  await Promise.allSettled(
    fileArray.map(async (file) => {
      try {
        await processFileDeduplication(file);
      } catch (error: any) {
        // If deduplication fails, keep the original file
        log.error("File deduplication failed", {
          filename: file.originalname,
          error: error.message,
        });
      }
    })
  );
};
