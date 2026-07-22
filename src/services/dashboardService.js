import { pegawaiService } from "./pegawaiService.js";
import { kendaraanService } from "./kendaraanService.js";
import { perjalananService } from "./perjalananService.js";

export const dashboardService = {
  async getData() {
    const [pegawai, kendaraan, perjalanan] = await Promise.all([
      pegawaiService.getAll({ page: 1, perPage: 1 }),
      kendaraanService.getAll({ page: 1, perPage: 1 }),
      perjalananService.getStats(),
    ]);

    return {
      totalPegawai: pegawai.meta.total,
      totalKendaraan: kendaraan.meta.total,
      totalPerjalanan: perjalanan.total,
      totalBBM: perjalanan.totalBBM,
      totalLiter: perjalanan.totalLiter,
      rataEfisiensi: perjalanan.rataEfisiensi,
    };
  },
};
