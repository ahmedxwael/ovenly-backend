import { __DEV__, LOG_LEVEL } from "@/config/env";
import chalk from "chalk";
import dayjs from "dayjs";
import path from "path";

// Determine log level from environment or default to 'info'
const logLevel = LOG_LEVEL || (__DEV__ ? "debug" : "info");

// Global context for request IDs, user IDs, etc.
let globalContext: Record<string, any> = {};

/**
 * Set global context that will be included in all logs
 * Useful for request IDs, user IDs, etc.
 */
export const setLogContext = (context: Record<string, any>) => {
  globalContext = { ...globalContext, ...context };
};

/**
 * Clear global context
 */
export const clearLogContext = () => {
  globalContext = {};
};

/**
 * Get caller information (file and line number)
 */
const getCallerInfo = (): string | null => {
  if (!__DEV__) return null; // Only in development for performance

  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => stack;
  const stack = new Error().stack as unknown as NodeJS.CallSite[];
  Error.prepareStackTrace = originalPrepareStackTrace;

  // Skip the first few frames (getCallerInfo, formatMessage, log method)
  const caller = stack[3];
  if (!caller) return null;

  const fileName = caller.getFileName();
  if (!fileName) return null;

  const relativePath = path.basename(fileName);
  const lineNumber = caller.getLineNumber();
  const columnNumber = caller.getColumnNumber();

  return chalk.yellowBright.dim(
    `[${relativePath}:${lineNumber}:${columnNumber}]`
  );
};

// Log level hierarchy for filtering
const logLevels = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  success: 2, // Same as info
  note: 5,
};

// Check if a log level should be displayed
const shouldLog = (level: keyof typeof logLevels): boolean => {
  const currentLevel =
    logLevels[logLevel as keyof typeof logLevels] ?? logLevels.info;
  const messageLevel = logLevels[level] ?? logLevels.info;
  return messageLevel >= currentLevel;
};

// Color mappings for different log levels
const colors = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.cyanBright,
  debug: chalk.gray,
  success: chalk.green,
  trace: chalk.blue,
  note: chalk.white.dim,
};

/**
 * Format timestamp for logs
 */
const formatTime = () => {
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
};

/**
 * Format log message with chalk colors and symbols
 */
const formatMessage = (
  level: keyof typeof colors,
  message: string,
  data?: any,
  options?: {
    module?: string;
    showCaller?: boolean;
    context?: Record<string, any>;
  }
): string => {
  const color = colors[level];
  // const symbol = symbols[level];
  const timestamp = chalk.yellow(`[${formatTime()}]`);
  const levelLabel = color(`[${level.toUpperCase()}]`);
  const messageLabel = color(message);

  let formattedMessage = `${timestamp} ${levelLabel}`;

  // Add module/component tag if provided
  if (options?.module) {
    formattedMessage += ` ${chalk.magenta(`[${options.module}]`)}`;
  }

  // Add caller info in development
  if (options?.showCaller !== false && __DEV__) {
    const callerInfo = getCallerInfo();

    if (callerInfo) {
      formattedMessage += ` ${callerInfo}`;
    }
  }

  formattedMessage += ` ${messageLabel}`;

  // Merge context: global context + options context + data
  const mergedContext = {
    ...globalContext,
    ...options?.context,
    ...(data && typeof data === "object" ? data : {}),
  };

  // Only show context if there's actual data
  const hasContext = Object.keys(mergedContext).length > 0;

  if (hasContext) {
    // If data was a simple object, merge it; otherwise show separately
    if (data && typeof data === "object" && !Array.isArray(data)) {
      formattedMessage += `\n${colors[level](JSON.stringify(mergedContext, null, 2))}`;
    } else if (data) {
      formattedMessage += ` ${colors[level](String(data))}`;
      if (Object.keys(mergedContext).length > 0) {
        formattedMessage += `\n${colors[level](JSON.stringify(mergedContext, null, 2))}`;
      }
    } else {
      formattedMessage += `\n${colors[level](JSON.stringify(mergedContext, null, 2))}`;
    }
  } else if (data && typeof data !== "object") {
    formattedMessage += ` ${colors[level](String(data))}`;
  }

  return formattedMessage;
};

/**
 * Enhanced logger with chalk colorization
 * Uses chalk for all logging (both development and production)
 */
export const log = {
  /**
   * Log error messages
   * @param message - Error message
   * @param data - Additional data or context
   * @param options - Optional: module name, custom context
   */
  error: (
    message: string,
    data?: any,
    options?: { module?: string; context?: Record<string, any> }
  ) => {
    if (shouldLog("error")) {
      const formatted = formatMessage("error", message, data, options);
      console.error(formatted);
    }
  },

  /**
   * Log warning messages
   * @param message - Warning message
   * @param data - Additional data or context
   * @param options - Optional: module name, custom context
   */
  warn: (
    message: string,
    data?: any,
    options?: { module?: string; context?: Record<string, any> }
  ) => {
    if (shouldLog("warn")) {
      const formatted = formatMessage("warn", message, data, options);
      console.warn(formatted);
    }
  },

  /**
   * Log info messages
   * @param message - Info message
   * @param data - Additional data or context
   * @param options - Optional: module name, custom context
   */
  info: (
    message: string,
    data?: any,
    options?: { module?: string; context?: Record<string, any> }
  ) => {
    if (shouldLog("info")) {
      const formatted = formatMessage("info", message, data, options);
      console.info(formatted);
    }
  },

  /**
   * Log debug messages
   * @param message - Debug message
   * @param data - Additional data or context
   * @param options - Optional: module name, custom context
   */
  debug: (
    message: string,
    data?: any,
    options?: { module?: string; context?: Record<string, any> }
  ) => {
    if (shouldLog("debug")) {
      const formatted = formatMessage("debug", message, data, options);
      console.debug(formatted);
    }
  },

  /**
   * Log success messages
   * @param message - Success message
   * @param data - Additional data or context
   * @param options - Optional: module name, custom context
   */
  success: (
    message: string,
    data?: any,
    options?: { module?: string; context?: Record<string, any> }
  ) => {
    if (shouldLog("success")) {
      const formatted = formatMessage("success", message, data, options);
      console.log(formatted);
    }
  },

  /**
   * Log trace messages (for detailed debugging)
   * @param message - Trace message
   * @param data - Additional data or context
   * @param options - Optional: module name, custom context
   */
  trace: (
    message: string,
    data?: any,
    options?: { module?: string; context?: Record<string, any> }
  ) => {
    if (shouldLog("trace")) {
      const formatted = formatMessage("trace", message, data, options);
      console.log(formatted);
    }
  },

  /**
   * Log a separator
   */
  note: (
    message: string,
    data?: any,
    options?: { module?: string; context?: Record<string, any> }
  ) => {
    if (shouldLog("note")) {
      const formatted = formatMessage("note", message, data, options);
      console.log(formatted);
    }
  },
};

/**
 * Enhanced error logging with stack trace and context
 */
export const logError = (
  error: Error | unknown,
  context?: Record<string, any>
) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Format error with chalk
  const timestamp = chalk.grey(`[${formatTime()}]`);
  const errorLabel = colors.error("[ERROR]");

  console.error(
    `${timestamp} ${errorLabel} ${colors.error(errorName)}: ${errorMessage}`
  );

  if (context) {
    console.error(chalk.grey(JSON.stringify(context, null, 2)));
  }

  if (errorStack) {
    console.error(chalk.red(errorStack));
  }
};

/**
 * Log database operations
 */
export const logDatabase = (operation: string, details?: any) => {
  if (shouldLog("info")) {
    const formatted = formatMessage("info", `Database: ${operation}`, details);
    console.log(formatted);
  }
};

/**
 * Log route completion based on HTTP status code
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Route path
 * @param statusCode - HTTP status code from response (optional)
 * @param duration - Request duration in milliseconds (optional)
 */
export const logRouteCompletion = (
  method: string,
  path: string,
  statusCode?: number,
  duration?: number
) => {
  const methodUpper = method.toUpperCase();
  const routeInfo = `${methodUpper} ${path}`;
  const durationText = duration !== undefined ? ` (${duration}ms)` : "";

  if (statusCode !== undefined && typeof statusCode === "number") {
    const message = `${routeInfo} finished with status ${statusCode}${durationText}`;
    if (statusCode >= 500) {
      log.error(message, undefined, { module: "HTTP" });
    } else if (statusCode >= 400) {
      log.warn(message, undefined, { module: "HTTP" });
    } else {
      log.success(message, undefined, { module: "HTTP" });
    }
  } else {
    log.info(`${routeInfo} finished${durationText}`, undefined, {
      module: "HTTP",
    });
  }
};

/**
 * Create a performance timer
 * @param label - Label for the timer
 * @returns Function to stop the timer and log the duration
 */
export const createTimer = (label: string) => {
  const start = Date.now();
  return {
    stop: (
      data?: any,
      options?: { module?: string; context?: Record<string, any> }
    ) => {
      const duration = Date.now() - start;
      const durationColor =
        duration > 1000
          ? chalk.red
          : duration > 500
            ? chalk.yellow
            : chalk.grey;
      const message = `${label} completed in ${durationColor(`${duration}ms`)}`;
      log.info(message, data, options);
      return duration;
    },
    getElapsed: () => Date.now() - start,
  };
};

/**
 * Log performance metrics
 * @param label - Performance metric label
 * @param value - Metric value
 * @param unit - Unit of measurement (ms, MB, etc.)
 * @param threshold - Warning threshold (optional)
 */
export const logPerformance = (
  label: string,
  value: number,
  unit: string = "ms",
  threshold?: number
) => {
  const message = `${label}: ${value}${unit}`;
  const data = threshold
    ? { threshold, exceeded: value > threshold }
    : undefined;
  const options = { module: "Performance" };

  if (threshold && value > threshold) {
    log.warn(message, data, options);
  } else {
    log.info(message, data, options);
  }
};

/**
 * Log memory usage
 */
export const logMemory = () => {
  const usage = process.memoryUsage();
  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)}MB`;
  };

  log.debug(
    "Memory Usage",
    {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external),
    },
    { module: "System" }
  );
};

/**
 * Create a logger instance for a specific module
 * @param moduleName - Name of the module
 * @returns Logger instance with module pre-configured
 */
export const createModuleLogger = (moduleName: string) => {
  return {
    error: (message: string, data?: any, context?: Record<string, any>) =>
      log.error(message, data, { module: moduleName, context }),
    warn: (message: string, data?: any, context?: Record<string, any>) =>
      log.warn(message, data, { module: moduleName, context }),
    info: (message: string, data?: any, context?: Record<string, any>) =>
      log.info(message, data, { module: moduleName, context }),
    debug: (message: string, data?: any, context?: Record<string, any>) =>
      log.debug(message, data, { module: moduleName, context }),
    success: (message: string, data?: any, context?: Record<string, any>) =>
      log.success(message, data, { module: moduleName, context }),
    trace: (message: string, data?: any, context?: Record<string, any>) =>
      log.trace(message, data, { module: moduleName, context }),
  };
};
