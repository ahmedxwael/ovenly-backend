import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProd = NODE_ENV === "production";
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST ?? "localhost";
const PROTOCOL = isProd ? "https" : "http";
const API_URL = `${PROTOCOL}://${HOST}${isProd ? "" : `:${PORT}`}`;

export const env = {
	PORT,
	HOST,
	API_URL,
	NODE_ENV,
	isProd,
	isDev: !isProd,
	toString() {
		return JSON.stringify({ ...this, toString: undefined }, null, 2);
	},
};
