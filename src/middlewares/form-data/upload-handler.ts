import { NextFunction, Request, Response } from "express";
import type { FileValidationOptions } from "./types";
import { cleanupFiles, handleDeduplication, sendErrorResponse } from "./utils";

/**
 * Handle file upload validation and processing
 * Extracted from uploadAny for better separation of concerns
 */
export const handleFileUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
  config: FileValidationOptions
): Promise<Response | void> => {
  const files = Array.isArray(req.files) ? req.files : [];

  // Validate files were uploaded
  if (files.length === 0) {
    return sendErrorResponse(res, 400, "No files uploaded");
  }

  // Validate file count
  if (files.length > config.maxFiles) {
    await cleanupFiles(files);
    return sendErrorResponse(
      res,
      400,
      `Too many files. Maximum: ${config.maxFiles} files`
    );
  }

  // Handle deduplication
  await handleDeduplication(req, files);
  next();
};
