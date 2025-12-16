import { z } from "zod";

// File validation configuration
export const FILE_VALIDATION_CONFIG = {
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ] as string[],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
} as const;

// File validation schema for multer fileFilter
export const fileMimeTypeSchema = z
  .string()
  .refine((mime) => FILE_VALIDATION_CONFIG.allowedMimeTypes.includes(mime), {
    message: `Invalid file type. Allowed types: ${FILE_VALIDATION_CONFIG.allowedMimeTypes.join(", ")}`,
  });

// File validation schema for post-upload validation
const fileSchema = z.object({
  fieldname: z.string().min(1, "Fieldname is required"),
  originalname: z.string().min(1, "Original filename is required"),
  encoding: z.string(),
  mimetype: fileMimeTypeSchema,
  size: z
    .number()
    .max(
      FILE_VALIDATION_CONFIG.maxFileSize,
      `File size exceeds maximum of ${FILE_VALIDATION_CONFIG.maxFileSize / 1024 / 1024}MB`
    ),
  filename: z.string(),
  path: z.string(),
});

export const uploadFilesValidator = z.object({
  files: z
    .array(fileSchema)
    .min(1, "At least one file is required")
    .max(
      FILE_VALIDATION_CONFIG.maxFiles,
      `Maximum ${FILE_VALIDATION_CONFIG.maxFiles} files allowed`
    ),
});
