import { fileMimeTypeSchema } from "@/modules/file-uploads/validators";
import { Request } from "express";
import multer from "multer";
import path from "path";
import { FileValidationOptions } from "../types";

/**
 * Validate file extension matches MIME type
 */
export const validateFileExtension = (
  filename: string,
  mimetype: string
): boolean => {
  const ext = path.extname(filename).toLowerCase().replace(".", "");
  const mimeToExt: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/jpg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/gif": ["gif"],
    "image/webp": ["webp"],
    "image/svg+xml": ["svg"],
    "application/pdf": ["pdf"],
    "application/msword": ["doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      "docx",
    ],
    "application/vnd.ms-excel": ["xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      "xlsx",
    ],
  };

  const allowedExts = mimeToExt[mimetype];

  return allowedExts ? allowedExts.includes(ext) : false;
};

/**
 * Create file filter with Zod validation and extension checking
 */
export const createFileFilter = (config: FileValidationOptions) => {
  return (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    // Validate fieldname is "uploads"
    if (file.fieldname !== "uploads") {
      return cb(
        new Error(
          `Invalid fieldname: "${file.fieldname}". Fieldname must be "uploads"`
        )
      );
    }

    // Validate MIME type using Zod
    const mimeResult = fileMimeTypeSchema.safeParse(file.mimetype);

    if (!mimeResult.success) {
      const errorMessage =
        mimeResult.error.issues[0]?.message || "Invalid file type";
      return cb(new Error(errorMessage));
    }

    // Validate file extension matches MIME type
    if (!validateFileExtension(file.originalname, file.mimetype)) {
      return cb(
        new Error(`File extension does not match MIME type: ${file.mimetype}`)
      );
    }

    cb(null, true);
  };
};
