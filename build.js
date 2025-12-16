import esbuild from "esbuild";

esbuild
	.build({
		entryPoints: ["vercel-entry.ts"], // Vercel entry
		bundle: true,
		platform: "node",
		target: "node20",
		format: "esm",
		outfile: "api/index.js", // Output to api/ for Vercel
		sourcemap: true,
		minify: false,
		loader: {
			".ts": "ts",
		},
		resolveExtensions: [".ts", ".js", ".json"],
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
