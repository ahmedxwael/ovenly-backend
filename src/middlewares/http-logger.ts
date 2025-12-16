import { pinoHttp } from "pino-http";
import { logger } from "../utils/logger.ts";

export const httpLogger = pinoHttp({
	logger,
	customLogLevel: (res, err) => {
		if ((res?.statusCode && res.statusCode >= 500) || err) return "error";
		if (res?.statusCode && res.statusCode >= 400) return "warn"; // or error
		return "info";
	},
	customSuccessMessage: (req, res) => {
		return `${req.method} ${req.url} ${res.statusCode}`;
	},
});
