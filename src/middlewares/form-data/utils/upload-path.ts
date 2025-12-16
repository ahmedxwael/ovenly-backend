import { UPLOADS_FIELDNAME } from "@/modules/file-uploads/utils";
import { getBaseDirectory } from "@/shared/utils";
import path from "path";

/**
 * Required fieldname for all uploads
 */
export const REQUIRED_FIELDNAME = "uploads";

/**
 * Validate that fieldname is "uploads"
 * This ensures all files are stored in the uploads directory
 */
export const validateFieldname = (fieldName: string): void => {
  if (fieldName !== REQUIRED_FIELDNAME) {
    throw new Error(
      `Invalid fieldname: "${fieldName}". Fieldname must be "${REQUIRED_FIELDNAME}"`
    );
  }
};

/**
 * Get upload path - files go directly to uploads/
 * In serverless environments, files are stored in /tmp
 * Validates that the provided fieldname is "uploads"
 */
export const getUploadPath = (fieldName: string): string => {
  // Validate fieldname is "uploads"
  validateFieldname(fieldName);

  const baseDir = getBaseDirectory();

  // Files are stored directly in uploads/ (not uploads/uploads/)
  return path.join(baseDir, UPLOADS_FIELDNAME);
};
