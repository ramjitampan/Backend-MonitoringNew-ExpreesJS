import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../validations/auth.schema.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);

export default router;
