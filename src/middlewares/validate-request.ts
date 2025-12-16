import { formatZodErrors, log } from "@/shared/utils";
import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

export const validateRequest = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      ...req.files,
      ...req.body,
      ...req.params,
      ...req.query,
    });

    if (!result.success) {
      const errors = formatZodErrors(result.error);

      log.error("Validation error", {
        module: "validateRequest",
        data: errors,
      });
      return res.status(400).json({
        errors,
      });
    }

    next();
  };
};
