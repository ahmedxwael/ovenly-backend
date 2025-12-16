import { __DEV__ } from "@/config/env";
import { log, logError } from "@/shared/utils";
import { NextFunction, Request, Response } from "express";
import multer from "multer";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError | multer.MulterError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle Multer errors specifically
  if (error instanceof multer.MulterError) {
    let statusCode = 400;
    let message = error.message;

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large";
        statusCode = 413;
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files";
        statusCode = 400;
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message =
          "Unexpected file field. The file field name doesn't match the expected field name.";
        statusCode = 400;
        // Add helpful hint about field names
        if (req.route && req.route.path) {
          message += ` Make sure your form field name matches what the server expects (usually "file").`;
        }
        break;
      case "LIMIT_PART_COUNT":
        message = "Too many parts";
        statusCode = 400;
        break;
      default:
        message = error.message || "File upload error";
    }

    logError(error, {
      method: req.method,
      url: req.url,
      statusCode,
      isOperational: true,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(statusCode).json({
      error: {
        message,
        statusCode,
        code: error.code,
      },
    });
  }

  // Handle other errors
  const statusCode = (error as AppError).statusCode || 500;
  const isOperational = (error as AppError).isOperational || false;

  // Log error with context
  logError(error, {
    method: req.method,
    url: req.url,
    statusCode,
    isOperational,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Send error response
  const errorResponse: any = {
    error: {
      message: isOperational ? error.message : "Internal Server Error",
      statusCode,
    },
  };

  // Include stack trace in development
  if (__DEV__ && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Common browser/DevTools requests that should be silently ignored
const IGNORED_404_PATHS = [
  "/.well-known/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

export const notFoundHandler = (req: Request, res: Response) => {
  // Check if this is a common browser/DevTools request that should be ignored
  const shouldIgnore = IGNORED_404_PATHS.some((path) =>
    req.url.startsWith(path)
  );

  // Only log if it's not an ignored path
  if (!shouldIgnore) {
    log.warn(`Route ${req.method} ${req.url} not found`);
  }

  return res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.url} not found`,
      statusCode: 404,
    },
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
