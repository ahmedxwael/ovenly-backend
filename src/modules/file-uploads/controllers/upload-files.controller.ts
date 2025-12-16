import { http } from "@/core";
import { Request, Response } from "express";

/**
 * @description Upload files controller
 * @param req - The request object
 * @param res - The response object
 * @returns The response object
 */
export const uploadFilesController = async (req: Request, res: Response) => {
  const files = http.reqFiles();

  if (!files.length) {
    return res.status(400).json({
      message: "Files are required",
      user: http.user,
    });
  }

  return res.status(200).json({
    message: "Files uploaded",
    files: files.map((file) => file.getFile(req)),
    user: http.user,
  });
};
