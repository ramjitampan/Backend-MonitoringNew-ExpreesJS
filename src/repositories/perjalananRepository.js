import prisma from "../config/prisma.js";

export const perjalananRepository = {
  async findManyPaginated({ where, include, skip, take, orderBy }) {
    return prisma.perjalanan.findMany({ where, include, skip, take, orderBy });
  },

  async count(where) {
    return prisma.perjalanan.count({ where });
  },

  async findById(id) {
    return prisma.perjalanan.findFirst({
      where: { id, deletedAt: null },
      include: { pegawai: true, kendaraan: true },
    });
  },

  async findFirst(where) {
    return prisma.perjalanan.findFirst({ where });
  },

  async findLastOdometer(kendaraanId, excludeId = null) {
    const where = { kendaraanId, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };

    return prisma.perjalanan.findFirst({
      where,
      orderBy: [{ kmBaru: "desc" }, { id: "desc" }],
      select: { kmBaru: true },
    });
  },

  async findHistoryTimeline(kendaraanId, tanggal, excludeId = null) {
    const where = {
      kendaraanId,
      deletedAt: null,
      OR: [
        { tanggal: { lt: new Date(tanggal) } },
        ...(excludeId
          ? [{ tanggal: new Date(tanggal), id: { lt: excludeId } }]
          : [{ tanggal: new Date(tanggal) }]),
      ],
    };

    return prisma.perjalanan.findMany({
      where,
      orderBy: [{ tanggal: "asc" }, { id: "asc" }],
      select: { kmLama: true, kmBaru: true, jarak: true, tanggal: true, id: true },
    });
  },

  async sumJarakByDate(kendaraanId, tanggal, excludeId = null) {
    const where = {
      kendaraanId,
      tanggal: new Date(tanggal),
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    };

    return prisma.perjalanan.aggregate({
      where,
      _sum: { jarak: true },
    });
  },

  async countDuplicateBon(noBon, kendaraanId, excludeId = null) {
    const where = { noBon, kendaraanId, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.perjalanan.count({ where });
  },

  async countDuplicateRecord(tanggal, kendaraanId, kmLama, kmBaru, volLiter, excludeId = null) {
    const where = {
      tanggal: new Date(tanggal),
      kendaraanId,
      kmLama,
      kmBaru,
      volLiter,
      deletedAt: null,
    };
    if (excludeId) where.id = { not: excludeId };
    return prisma.perjalanan.count({ where });
  },

  async create(data) {
    return prisma.perjalanan.create({ data, include: { pegawai: true, kendaraan: true } });
  },

  async update(id, data) {
    return prisma.perjalanan.update({
      where: { id },
      data,
      include: { pegawai: true, kendaraan: true },
    });
  },

  async delete(id) {
    try {
      await prisma.perjalanan.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  async getStats(where) {
    return prisma.perjalanan.aggregate({
      where,
      _sum: { jumlahBiaya: true, volLiter: true },
      _avg: { efisiensi: true },
    });
  },

  async findExportData({ where, include, orderBy }) {
    return prisma.perjalanan.findMany({ where, include, orderBy });
  },
};
