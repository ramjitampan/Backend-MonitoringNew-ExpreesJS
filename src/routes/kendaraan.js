import { Router } from "express";
import { kendaraanController } from "../controllers/kendaraanController.js";
import { validate } from "../middlewares/validate.js";
import {
  storeKendaraanSchema,
  updateKendaraanSchema,
} from "../validations/kendaraan.schema.js";

const router = Router();

router.get("/", kendaraanController.index);
router.get("/:id", kendaraanController.show);
router.post("/", validate(storeKendaraanSchema), kendaraanController.store);
router.put("/:id", validate(updateKendaraanSchema), kendaraanController.update);
router.delete("/:id", kendaraanController.destroy);

export default router;
