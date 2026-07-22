import { perjalananRepository } from "../repositories/perjalananRepository.js";

export const validasiService = {
  isNominalGanjil(jumlah) {
    const jumlahInt = Math.round(jumlah);
    if (jumlahInt % 1000 !== 0) return false;
    return jumlahInt % 10000 !== 0;
  },

  async isDuplicateBon(noBon, kendaraanId, excludeId = null) {
    const count = await perjalananRepository.countDuplicateBon(noBon, kendaraanId, excludeId);
    return count > 0;
  },

  async isDuplicateRecord(tanggal, kendaraanId, kmLama, kmBaru, volLiter, excludeId = null) {
    const count = await perjalananRepository.countDuplicateRecord(tanggal, kendaraanId, kmLama, kmBaru, volLiter, excludeId);
    return count > 0;
  },

  async isJarakWajar(jarak, tipe, tanggal, kendaraanId, excludeId = null) {
    const maxPerHari = tipe === "R2" ? 200 : 600;

    const result = await perjalananRepository.sumJarakByDate(kendaraanId, tanggal, excludeId);

    const jarakHariIni = parseFloat(result._sum.jarak || 0);
    return jarakHariIni + jarak <= maxPerHari;
  },
};
