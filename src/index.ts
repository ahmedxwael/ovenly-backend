import { setupAppInitialization } from "@/core";
import express from "express";

// Create Express app
const app = express();

// Setup app initialization based on environment
setupAppInitialization(app);

export default app;
