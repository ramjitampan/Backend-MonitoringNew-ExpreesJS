import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";

const router = Router();

router.get("/", dashboardController.index);

export default router;
