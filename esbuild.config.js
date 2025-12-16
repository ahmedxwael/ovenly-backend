const esbuild = require("esbuild");
const path = require("path");
const { glob } = require("glob");

// Plugin to resolve path aliases
const pathAliasPlugin = {
  name: "path-alias",
  setup(build) {
    const alias = {
      "@": path.resolve(__dirname, "src"),
    };

    // Resolve alias imports
    build.onResolve({ filter: /^@\// }, (args) => {
      const aliasPath = alias["@"];
      const relativePath = args.path.replace(/^@\//, "");
      const resolvedPath = path.join(aliasPath, relativePath);

      return {
        path: resolvedPath,
        namespace: "file",
      };
    });
  },
};

async function build() {
  try {
    console.log("🔨 Building with esbuild...");

    // Find all TypeScript files
    const tsFiles = await glob("src/**/*.ts", {
      ignore: ["**/*.d.ts", "**/node_modules/**"],
    });

    if (tsFiles.length === 0) {
      console.error("No TypeScript files found!");
      process.exit(1);
    }

    console.log(`📦 Found ${tsFiles.length} TypeScript files`);

    // Log route files being compiled
    const routeFiles = tsFiles.filter((f) => f.includes("routes.ts"));
    console.log(`📋 Route files found: ${routeFiles.length}`);
    routeFiles.forEach((f) => console.log(`   - ${f}`));

    // Build all files
    const result = await esbuild.build({
      entryPoints: tsFiles,
      bundle: false, // Don't bundle, keep file structure
      platform: "node",
      target: "node18",
      format: "cjs", // CommonJS
      outdir: "dist",
      outbase: "src", // Preserve directory structure
      sourcemap: true,
      minify: false, // Don't minify for easier debugging
      keepNames: true,
      plugins: [pathAliasPlugin],
      // TypeScript options
      tsconfig: "tsconfig.json",
      logLevel: "info",
    });

    console.log("✅ Build completed successfully!");
    console.log(`📁 Output: dist/`);

    // Verify route files were compiled
    const fs = require("fs");
    const compiledRoutes = routeFiles.map((f) =>
      f
        .replace("src\\", "dist\\")
        .replace("src/", "dist/")
        .replace(".ts", ".js")
    );
    console.log(`\n🔍 Verifying compiled route files:`);
    compiledRoutes.forEach((f) => {
      const exists = fs.existsSync(f);
      console.log(`   ${exists ? "✓" : "✗"} ${f}`);
    });
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

build();
