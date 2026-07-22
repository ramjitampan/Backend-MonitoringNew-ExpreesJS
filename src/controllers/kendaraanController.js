import { kendaraanService } from "../services/kendaraanService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError, ValidationError } from "../errors/ApiError.js";

export const kendaraanController = {
  index: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 15;

    const result = await kendaraanService.getAll({ page, perPage });

    res.json({
      success: true,
      message: "Data kendaraan berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  }),

  show: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const kendaraan = await kendaraanService.getById(id);

    if (!kendaraan) throw new NotFoundError("Kendaraan");

    res.json({
      success: true,
      message: "Detail kendaraan berhasil diambil",
      data: kendaraan,
    });
  }),

  store: asyncHandler(async (req, res) => {
    const existing = await kendaraanService.isPlatNomorUnique(req.validated.plat_nomor);

    if (!existing) {
      throw new ValidationError([
        { field: "plat_nomor", message: "Plat nomor sudah terdaftar" },
      ]);
    }

    const kendaraan = await kendaraanService.create(req.validated);

    res.status(201).json({
      success: true,
      message: "Kendaraan berhasil ditambahkan",
      data: kendaraan,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);

    const existing = await kendaraanService.isPlatNomorUnique(req.validated.plat_nomor, id);

    if (!existing) {
      throw new ValidationError([
        { field: "plat_nomor", message: "Plat nomor sudah terdaftar" },
      ]);
    }

    const kendaraan = await kendaraanService.update(id, req.validated);

    if (!kendaraan) throw new NotFoundError("Kendaraan");

    res.json({
      success: true,
      message: "Kendaraan berhasil diperbarui",
      data: kendaraan,
    });
  }),

  destroy: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const deleted = await kendaraanService.delete(id);

    if (!deleted) throw new NotFoundError("Kendaraan");

    res.json({
      success: true,
      message: "Kendaraan berhasil dihapus",
    });
  }),
};
