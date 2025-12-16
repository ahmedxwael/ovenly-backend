/**
 * Entry point to ensure all route files are compiled by esbuild.
 * This file imports all route modules so they're included in the build output.
 * The imports are side-effect only - routes register themselves when imported.
 */

// Import all route files to ensure they're compiled
import "./modules/file-uploads/routes";
import "./modules/general/routes";
import "./modules/user/routes";

// Export a dummy function to prevent tree-shaking
export function ensureRoutesCompiled() {
  // This function exists only to ensure this file is included in the build
  return true;
}
