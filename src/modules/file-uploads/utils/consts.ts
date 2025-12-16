export const UPLOADS_FIELDNAME = "uploads";
export const UPLOADS_FIELDS: (keyof Express.Multer.File)[] = [
  "fieldname",
  "originalname",
  "mimetype",
  "filename",
  "size",
];
