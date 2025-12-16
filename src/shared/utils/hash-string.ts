import { createHash } from "crypto";

// URL-friendly Base64 encoding (replace + with -, / with _, trim =)
const toUrlSafeBase64 = (buffer: Buffer): string =>
  buffer
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=+$/, "");

export const hashString = async (string: string): Promise<string> => {
  // Using SHA-256 for deterministic, url-friendly hashing
  const hash = createHash("sha256").update(string).digest();
  return toUrlSafeBase64(hash);
};

export const hashBuffer = async (buffer: Buffer): Promise<string> => {
  // Hash the file buffer content using SHA-256
  const hash = createHash("sha256").update(buffer).digest();
  return toUrlSafeBase64(hash);
};

export const verifyHashedString = async (
  string: string,
  hashedString: string
): Promise<boolean> => {
  // Hash the string and compare with hashedString
  const actualHash = await hashString(string);
  return actualHash === hashedString;
};
