import { Router } from "express";

const generalRoutes = Router();

generalRoutes.get("/", (req, res) => {
	res.json({
		message: "Ovenly backend API",
	});
});

generalRoutes.get("/health", (req, res) => {
	res.json({
		status: "ok",
		message: "Ovenly backend API is running",
	});
});

export default generalRoutes;
