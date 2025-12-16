import { ensureDirectory } from "@/shared/utils";
import multer from "multer";
import path from "path";
import { getUploadPath } from "./utils";

/**
 * Custom storage that handles file deduplication
 */
export const storage = multer.diskStorage({
  destination: (req, file: Express.Multer.File, cb) => {
    try {
      // Store files based on their fieldname (sanitized)
      const uploadPath = getUploadPath(file.fieldname);
      const destinationPath = ensureDirectory(uploadPath);
      cb(null, destinationPath);
    } catch (error: any) {
      cb(error, "");
    }
  },
  filename: async (req, file: Express.Multer.File, cb) => {
    try {
      // Read the file buffer to hash its content
      // Note: In diskStorage, we need to read the file after it's written
      // So we'll handle deduplication in a different way
      const ext = path.extname(file.originalname);

      // Generate a temporary filename first
      // We'll check for duplicates after the file is written
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const tempFileName = `temp-${uniqueSuffix}${ext}`;

      cb(null, tempFileName);
    } catch (error: any) {
      cb(error, "");
    }
  },
});
