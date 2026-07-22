import { Router } from "express";
import { pegawaiController } from "../controllers/pegawaiController.js";
import { validate } from "../middlewares/validate.js";
import { storePegawaiSchema, updatePegawaiSchema } from "../validations/pegawai.schema.js";

const router = Router();

router.get("/", pegawaiController.index);
router.get("/:id", pegawaiController.show);
router.post("/", validate(storePegawaiSchema), pegawaiController.store);
router.put("/:id", validate(updatePegawaiSchema), pegawaiController.update);
router.delete("/:id", pegawaiController.destroy);

export default router;
