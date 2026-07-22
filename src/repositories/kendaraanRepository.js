import prisma from "../config/prisma.js";

export const kendaraanRepository = {
  async findManyPaginated({ skip, take }) {
    return prisma.kendaraan.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { id: "desc" },
    });
  },

  async countAll() {
    return prisma.kendaraan.count({ where: { deletedAt: null } });
  },

  async findById(id) {
    return prisma.kendaraan.findFirst({ where: { id, deletedAt: null } });
  },

  async findByPlatNomor(platNomor, excludeId = null) {
    const where = { platNomor, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.kendaraan.findFirst({ where });
  },

  async findByIdWithJenis(id) {
    return prisma.kendaraan.findFirst({
      where: { id, deletedAt: null },
      select: { jenis: true },
    });
  },

  async create(data) {
    return prisma.kendaraan.create({ data });
  },

  async update(id, data) {
    return prisma.kendaraan.update({ where: { id }, data });
  },

  async delete(id) {
    try {
      await prisma.kendaraan.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
