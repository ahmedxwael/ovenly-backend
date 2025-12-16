import { z } from "zod";

export const removeFilesValidator = z.object({
  files: z.array(z.string()),
});
