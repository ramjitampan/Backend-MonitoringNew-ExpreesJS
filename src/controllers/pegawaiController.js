import { pegawaiService } from "../services/pegawaiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError } from "../errors/ApiError.js";

export const pegawaiController = {
  index: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 15;

    const result = await pegawaiService.getAll({ page, perPage });

    res.json({
      success: true,
      message: "Data pegawai berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  }),

  show: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const pegawai = await pegawaiService.getById(id);

    if (!pegawai) throw new NotFoundError("Pegawai");

    res.json({
      success: true,
      message: "Detail pegawai berhasil diambil",
      data: pegawai,
    });
  }),

  store: asyncHandler(async (req, res) => {
    const pegawai = await pegawaiService.create(req.validated);

    res.status(201).json({
      success: true,
      message: "Pegawai berhasil ditambahkan",
      data: pegawai,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const pegawai = await pegawaiService.update(id, req.validated);

    if (!pegawai) throw new NotFoundError("Pegawai");

    res.json({
      success: true,
      message: "Pegawai berhasil diperbarui",
      data: pegawai,
    });
  }),

  destroy: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const deleted = await pegawaiService.delete(id);

    if (!deleted) throw new NotFoundError("Pegawai");

    res.json({
      success: true,
      message: "Pegawai berhasil dihapus",
    });
  }),
};
