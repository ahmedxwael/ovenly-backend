import { FILE_VALIDATION_CONFIG } from "@/modules/file-uploads/validators";
import { NextFunction, Response } from "express";
import multer from "multer";
import { storage } from "./storage";
import type { FileValidationOptions } from "./types";
import { handleFileUpload } from "./upload-handler";
import {
  createFileFilter,
  handleMulterError,
  sendErrorResponse,
} from "./utils";

/**
 * Create multer instance with validation
 */
const createMulterUpload = (config: FileValidationOptions) => {
  return multer({
    storage,
    fileFilter: createFileFilter(config),
    limits: {
      fileSize: config.maxFileSize,
      files: config.maxFiles,
    },
  });
};

// Default multer instance
const defaultUpload = createMulterUpload(FILE_VALIDATION_CONFIG);

/**
 * Middleware to handle multipart/form-data (file uploads)
 *
 * Usage:
 * - Single file: formData.single('fieldName')
 * - Multiple files: formData.array('fieldName', maxCount)
 * - Multiple fields: formData.fields([{ name: 'field1', maxCount: 1 }, { name: 'field2', maxCount: 3 }])
 * - Any files: uploadAny()
 */
export const formData = defaultUpload;

/**
 * Helper middleware for single file upload
 */
const uploadSingle = (fieldName: string = "file") => {
  return defaultUpload.single(fieldName);
};

/**
 * Helper middleware for multiple files upload
 */
const uploadMultiple = (fieldName: string = "files", maxCount: number = 10) => {
  return defaultUpload.array(fieldName, maxCount);
};

/**
 * Helper middleware for multiple fields with files
 */
const uploadFields = (fields: { name: string; maxCount?: number }[]) => {
  return defaultUpload.fields(fields);
};

/**
 * Helper middleware for any files (no field name restriction)
 * Includes automatic deduplication based on file content
 *
 * @param config - File validation configuration
 */
export const uploadAny = (
  config: FileValidationOptions = FILE_VALIDATION_CONFIG
) => {
  const multerInstance = createMulterUpload(config);
  const multerMiddleware = multerInstance.any();

  return async (req: any, res: Response, next: NextFunction) => {
    try {
      await new Promise<void>((resolve, reject) => {
        multerMiddleware(req, res, (err: any) => {
          if (err) {
            const { statusCode, message } = handleMulterError(err, config);
            return reject({ statusCode, message });
          }
          resolve();
        });
      });
    } catch (error: any) {
      const { statusCode, message } = error.statusCode
        ? error
        : handleMulterError(error, config);
      return sendErrorResponse(res, statusCode, message);
    }

    // Handle file upload validation and processing
    await handleFileUpload(req, res, next, config);
  };
};

// Export types
export type { FileValidationOptions };
