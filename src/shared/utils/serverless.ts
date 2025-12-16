/**
 * Check if running in a serverless environment (Vercel, AWS Lambda, etc.)
 */
export const isServerless = (): boolean => {
  return (
    !!process.env.VERCEL ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.VERCEL_ENV ||
    process.cwd() === "/var/task" ||
    process.cwd().startsWith("/var/task")
  );
};

/**
 * Get the base directory for file operations
 * In serverless environments, use /tmp (the only writable directory)
 * Otherwise, use the current working directory
 */
export const getBaseDirectory = (): string => {
  if (isServerless()) {
    return "/tmp";
  }
  return process.cwd();
};
