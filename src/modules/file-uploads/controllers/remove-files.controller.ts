import { http } from "@/core";
import { getBaseDirectory, validateFilePath } from "@/shared/utils";
import { Request, Response } from "express";
import { existsSync, readdirSync, rmdirSync } from "fs";
import fs from "fs/promises";
import path from "path";
import { UPLOADS_FIELDNAME } from "../utils";

interface DeleteResult {
  filename: string;
  success: boolean;
  error?: string;
}

/**
 * Build response for file deletion results
 * Handles both success and failure cases
 */
const buildResponse = (total: number, failedFiles: DeleteResult[]) => {
  const successful = total - failedFiles.length;
  const hasFailures = failedFiles.length > 0;

  return {
    success: !hasFailures,
    message: hasFailures
      ? `Deleted ${successful} file(s), ${failedFiles.length} failed.`
      : `Successfully deleted ${total} file(s).`,
    total,
    successful,
    failed: failedFiles.length,
    ...(hasFailures && {
      errors: failedFiles.map((f) => ({
        filename: f.filename,
        error: f.error,
      })),
    }),
    user: http.user,
  };
};

/**
 * Remove a single file specified by filename and fieldname.
 * Validates fieldname is "uploads" and always uses "uploads" for the path.
 * Throws an error if the file does not exist or cannot be removed.
 * Uses the same path logic as uploads to support serverless environments.
 */
const findAndDeleteFile = async (filename: string): Promise<void> => {
  const baseDir = getBaseDirectory();
  // Files are stored directly in uploads/ (not uploads/uploads/)
  const filePath = path.join(baseDir, UPLOADS_FIELDNAME, filename);

  // Security: Prevent directory traversal attacks
  validateFilePath(filePath);

  if (!existsSync(filePath)) {
    throw new Error(`File "${filename}" not found`);
  }

  try {
    // Delete the file
    await fs.unlink(filePath);

    const dirPath = path.join(baseDir, UPLOADS_FIELDNAME);
    const hasFiles = readdirSync(dirPath).length > 0;
    // Delete the directory if it is empty
    if (!hasFiles) {
      rmdirSync(dirPath);
    }
  } catch (err: any) {
    throw new Error(
      `Failed to remove file "${filename}": ${err.message || err}`
    );
  }
};

/**
 * Process file deletion and return result
 */
const processFileDeletion = async (filename: string): Promise<DeleteResult> => {
  try {
    await findAndDeleteFile(filename);
    return { filename, success: true };
  } catch (error: any) {
    return {
      filename,
      success: false,
      error: error.message || "Unknown error",
    };
  }
};

/**
 * @description Remove files controller
 * @param req - The request object
 * @param res - The response object
 * @returns The response object
 *
 * Accepts:
 * - Body: { files: ["abc.jpg", "def.png"] }
 * Note: fieldname must be "uploads"
 */
export const removeFilesController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const files = http.input<string[]>("files", []);

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files provided. Use 'files' as an array of filenames.",
        user: http.user,
      });
    }

    const deleteResults = await Promise.all(files.map(processFileDeletion));

    const failedFiles = deleteResults.filter((r) => !r.success);
    const statusCode = failedFiles.length === 0 ? 200 : 400;

    return res
      .status(statusCode)
      .json(buildResponse(files.length, failedFiles));
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Internal server error while removing files",
      error: error.message,
      user: http.user,
    });
  }
};
