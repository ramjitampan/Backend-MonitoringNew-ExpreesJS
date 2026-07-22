import { Router } from "express";
import { perjalananController } from "../controllers/perjalananController.js";
import { validate } from "../middlewares/validate.js";
import {
  storePerjalananSchema,
  updatePerjalananSchema,
} from "../validations/perjalanan.schema.js";

const router = Router();

router.get("/export/excel", perjalananController.exportExcel);
router.get("/", perjalananController.index);
router.get("/:id", perjalananController.show);
router.post("/", validate(storePerjalananSchema), perjalananController.store);
router.put("/:id", validate(updatePerjalananSchema), perjalananController.update);
router.delete("/:id", perjalananController.destroy);

export default router;
