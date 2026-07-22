import { perjalananRepository } from "../repositories/perjalananRepository.js";

export const timelineService = {
  async getOdometerTerakhir(kendaraanId, excludeId = null) {
    const last = await perjalananRepository.findLastOdometer(kendaraanId, excludeId);
    return last ? parseFloat(last.kmBaru) : null;
  },

  async validasiTimeline(kmLama, kmBaru, kendaraanId, excludeId = null, tanggal = null) {
    if (!tanggal) {
      return { status: "Logis", alasan: null };
    }

    const riwayat = await perjalananRepository.findHistoryTimeline(kendaraanId, tanggal, excludeId);

    if (riwayat.length === 0) {
      return { status: "Logis", alasan: null };
    }

    const kmBaruTerakhir = parseFloat(riwayat[riwayat.length - 1].kmBaru);

    if (kmLama > kmBaruTerakhir) {
      const selisih = Math.round(kmLama - kmBaruTerakhir);
      return {
        status: "Perlu Verifikasi",
        alasan: `Terdapat loncatan odometer sebesar ${selisih} km dari pencatatan terakhir (${kmBaruTerakhir}) ke KM awal baru (${kmLama}). Histori kendaraan perlu diverifikasi.`,
      };
    }

    if (kmLama < kmBaruTerakhir) {
      const selisih = Math.round(kmBaruTerakhir - kmLama);
      return {
        status: "Tidak Logis",
        alasan: `KM awal (${kmLama}) lebih rendah dari KM akhir pencatatan sebelumnya (${kmBaruTerakhir}). Odometer tidak dapat mundur. Histori kendaraan perlu diverifikasi.`,
      };
    }

    if (kmLama === kmBaruTerakhir) {
      const sebelumnya = riwayat[riwayat.length - 1];
      if (parseFloat(sebelumnya.jarak) > 0 && parseFloat(sebelumnya.kmBaru) === kmLama) {
        return { status: "Logis", alasan: null };
      }
    }

    const totalJarakRiwayat = riwayat.reduce((sum, r) => sum + parseFloat(r.jarak), 0);
    const rataJarak = riwayat.length > 0 ? totalJarakRiwayat / riwayat.length : 0;

    const jarakBaru = Math.max(0, kmBaru - kmLama);
    if (rataJarak > 0 && jarakBaru > rataJarak * 3) {
      return {
        status: "Perlu Verifikasi",
        alasan: `Jarak tempuh (${jarakBaru} km) jauh di atas rata-rata perjalanan kendaraan ini (${rataJarak.toFixed(2)} km). Histori perlu diverifikasi.`,
      };
    }

    return { status: "Logis", alasan: null };
  },
};
