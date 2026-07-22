import { pegawaiRepository } from "../repositories/pegawaiRepository.js";

export const pegawaiService = {
  async getAll({ page = 1, perPage = 15 }) {
    const skip = (page - 1) * perPage;
    const take = perPage;

    const [data, total] = await Promise.all([
      pegawaiRepository.findManyPaginated({ skip, take }),
      pegawaiRepository.countAll(),
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
    const pegawai = await pegawaiRepository.findById(id);

    return pegawai ?? null;
  },

  async create(data) {
    const pegawai = await pegawaiRepository.create({
      nama: data.nama,
      jabatan: data.jabatan ?? null,
      divisi: data.divisi ?? null,
      noHp: data.no_hp ?? null,
    });

    return pegawai;
  },

  async update(id, data) {
    const existing = await pegawaiRepository.findById(id);

    if (!existing) return null;

    const pegawai = await pegawaiRepository.update(id, {
      nama: data.nama,
      jabatan: data.jabatan ?? null,
      divisi: data.divisi ?? null,
      noHp: data.no_hp ?? null,
    });

    return pegawai;
  },

  async delete(id) {
    return pegawaiRepository.delete(id);
  },
};
