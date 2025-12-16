import { GenericObject } from "@/types";
import { ZodError } from "zod";

export const formatZodErrors = (errors: ZodError<Record<string, unknown>>) => {
  const errorsMap = errors.issues.reduce((acc, error) => {
    acc[error.path.join(".")] = error.message;
    return acc;
  }, {} as GenericObject);

  return Object.entries(errorsMap).map(([field, message]) => ({
    field,
    message,
  }));
};
