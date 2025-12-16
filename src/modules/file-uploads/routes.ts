import { router } from "@/core";
import { uploadAny, validateRequest } from "@/middlewares";
import { removeFilesController, uploadFilesController } from "./controllers";
import { FILE_VALIDATION_CONFIG, removeFilesValidator } from "./validators";

/**
 * @description Uploads routes
 * @returns The uploads routes
 */
router
  .route("/uploads")
  .post(uploadAny(FILE_VALIDATION_CONFIG), uploadFilesController)
  .delete(validateRequest(removeFilesValidator), removeFilesController);
