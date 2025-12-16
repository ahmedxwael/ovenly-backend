import { Request } from "express";

export const getTokenFromHeaders = (req: Request) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  return accessToken || null;
};

export const getRefreshTokenFromHeaders = (req: Request) => {
  const refreshToken = req.headers["x-refresh-token"] as string;

  return refreshToken || null;
};

export const getTokensFromHeaders = (req: Request) => {
  return {
    accessToken: getTokenFromHeaders(req),
    refreshToken: getRefreshTokenFromHeaders(req),
  };
};
