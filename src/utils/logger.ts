import pino from "pino";
import { env } from "../config/env.ts";

export const logger = pino({
	level: env.isProd ? "info" : "debug",
	transport: env.isProd
		? undefined
		: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "HH:MM:ss",
					ignore: "pid,hostname",
					singleLine: true,
					levelKey: "level",
				},
		  },
});
