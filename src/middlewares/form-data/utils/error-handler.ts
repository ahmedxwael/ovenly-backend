import { Response } from "express";
import multer from "multer";
import { FileValidationOptions } from "../types";

/**
 * Clean up uploaded files
 */
export const cleanupFiles = async (
  files: Express.Multer.File[]
): Promise<void> => {
  const fs = await import("fs/promises");
  await Promise.allSettled(
    files.map((file) => file.path && fs.unlink(file.path).catch(() => {}))
  );
};

/**
 * Send error response
 */
export const sendErrorResponse = (
  res: Response,
  statusCode: number,
  message: string
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

/**
 * Handle multer errors and return user-friendly messages
 */
export const handleMulterError = (
  error: any,
  config: FileValidationOptions
): { statusCode: number; message: string } => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return {
          statusCode: 413,
          message: `File too large. Maximum size: ${config.maxFileSize / 1024 / 1024}MB`,
        };
      case "LIMIT_FILE_COUNT":
        return {
          statusCode: 400,
          message: `Too many files. Maximum: ${config.maxFiles} files`,
        };
      default:
        return {
          statusCode: 400,
          message: error.message || "File upload error",
        };
    }
  }

  return {
    statusCode: 400,
    message: error.message || "File upload error",
  };
};
