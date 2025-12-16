import esbuild from "esbuild";

esbuild
	.build({
		entryPoints: ["api/index.ts"], // Vercel entry
		bundle: true,
		platform: "node",
		target: "node20",
		format: "esm",
		outfile: "dist/index.js",
		sourcemap: true,
		minify: false,
		external: [
			"dotenv",
			"express",
			"cors",
			"helmet",
			"pino",
			"pino-http",
			"node:*", // excludes all Node built-in modules: fs, os, events, etc.
		],
	})
	.catch(() => process.exit(1));
