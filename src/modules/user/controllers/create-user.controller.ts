import { http } from "@/core";
import { Request, Response } from "express";
import { createUserService } from "../services";

export const createUserController = async (req: Request, res: Response) => {
  try {
    const user = await createUserService(req.body);
    return res.status(200).json({
      status: "success",
      record: user,
      user: http.user,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error,
      user: http.user,
    });
  }
};
