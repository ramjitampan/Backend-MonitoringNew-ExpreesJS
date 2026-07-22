import { kendaraanRepository } from "../repositories/kendaraanRepository.js";

export const kendaraanService = {
  async getAll({ page = 1, perPage = 15 }) {
    const skip = (page - 1) * perPage;
    const take = perPage;

    const [data, total] = await Promise.all([
      kendaraanRepository.findManyPaginated({ skip, take }),
      kendaraanRepository.countAll(),
    ]);

    return {
      data,
      meta: {
        currentPage: page,
        perPage,
        total,
        lastPage: Math.ceil(total / perPage),
      },
    };
  },

  async getById(id) {
    const kendaraan = await kendaraanRepository.findById(id);
    return kendaraan ?? null;
  },

  async isPlatNomorUnique(platNomor, excludeId = null) {
    const existing = await kendaraanRepository.findByPlatNomor(platNomor, excludeId);
    return !existing;
  },

  async create(data) {
    const kendaraan = await kendaraanRepository.create({
      platNomor: data.plat_nomor,
      merk: data.merk,
      jenis: data.jenis,
      tahun: data.tahun,
    });

    return kendaraan;
  },

  async update(id, data) {
    const existing = await kendaraanRepository.findById(id);

    if (!existing) return null;

    const kendaraan = await kendaraanRepository.update(id, {
      platNomor: data.plat_nomor,
      merk: data.merk,
      jenis: data.jenis,
      tahun: data.tahun,
    });

    return kendaraan;
  },

  async delete(id) {
    return kendaraanRepository.delete(id);
  },
};
