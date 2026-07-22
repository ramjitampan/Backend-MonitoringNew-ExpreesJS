import prisma from "../config/prisma.js";

export const pegawaiRepository = {
  async findManyPaginated({ skip, take }) {
    return prisma.pegawai.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { id: "desc" },
    });
  },

  async countAll() {
    return prisma.pegawai.count({ where: { deletedAt: null } });
  },

  async findById(id) {
    return prisma.pegawai.findFirst({ where: { id, deletedAt: null } });
  },

  async create(data) {
    return prisma.pegawai.create({ data });
  },

  async update(id, data) {
    return prisma.pegawai.update({ where: { id }, data });
  },

  async delete(id) {
    try {
      await prisma.pegawai.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};
