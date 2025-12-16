import { Request, Response } from "express";

export const healthController = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      status: "success",
      message: "Ovenly backend API is running",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error,
    });
  }
};
