import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error-handler.ts";
import { httpLogger } from "./middlewares/http-logger.ts";
import generalRoutes from "./modules/general/routes.ts";
import { logger } from "./utils/logger.ts";

const app = express();

app.use(httpLogger); // 👈 FIRST
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api", generalRoutes);
app.use(errorHandler);

logger.info("Express app initialized");

export default app;
