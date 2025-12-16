import esbuild from "esbuild";

esbuild
	.build({
		entryPoints: ["api/index.ts"], // your Vercel entry
		bundle: true,
		platform: "node",
		target: "node20", // match Node version on Vercel
		format: "esm",
		outfile: "dist/index.js",
		sourcemap: true,
		minify: false,
	})
	.catch(() => process.exit(1));
