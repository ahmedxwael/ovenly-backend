import { JWT_SECRET } from "@/config/env";
import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";

/**
 * Generate an access token
 * @param data - The data to sign
 * @param options - The options to sign the token
 * @returns The access token
 */
export const generateAccessToken = (
  data: any,
  options: SignOptions = { expiresIn: "15m" }
) => {
  return jwt.sign(data, JWT_SECRET, options);
};

/**
 * Verify an access token
 * @param accessToken - The access token to verify
 * @param options - The options to verify the token
 * @returns The access token
 */
export const verifyAccessToken = async (
  accessToken: string,
  options: VerifyOptions = {}
) => {
  try {
    const decoded = await jwt.verify(accessToken, JWT_SECRET, options);

    return {
      decoded,
    };
  } catch (error) {
    return undefined;
  }
};

/**
 * Generate a refresh token
 * @param data - The data to sign
 * @param options - The options to sign the token
 * @returns The refresh token
 */
export const generateRefreshToken = (
  data: any,
  options: SignOptions = { expiresIn: "7d" }
) => {
  return jwt.sign(data, JWT_SECRET, options);
};

/**
 * Verify a refresh token
 * @param refreshToken - The refresh token to verify
 * @param options - The options to verify the token
 * @returns The refresh token
 */
export const verifyRefreshToken = async (
  refreshToken: string,
  options: VerifyOptions = {}
) => {
  try {
    const decoded = await jwt.verify(refreshToken, JWT_SECRET, options);

    return {
      decoded,
    };
  } catch (error) {
    return undefined;
  }
};

/**
 * Generate access and refresh tokens
 * @param data - The data to sign
 * @returns The access and refresh tokens
 */
export const generateTokens = (data: any) => {
  const accessToken = generateAccessToken(data);
  const refreshToken = generateRefreshToken(data);

  return { accessToken, refreshToken };
};

/**
 * Verify access and refresh tokens
 * @param accessToken - The access token to verify
 * @param refreshToken - The refresh token to verify
 * @returns The access and refresh tokens
 */
export const verifyTokens = async (
  accessToken: string,
  refreshToken: string
) => {
  const accessTokenResult = await verifyAccessToken(accessToken);
  const refreshTokenResult = await verifyRefreshToken(refreshToken);

  return { accessTokenResult, refreshTokenResult };
};
