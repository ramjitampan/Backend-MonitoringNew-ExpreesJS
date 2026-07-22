import { perjalananRepository } from "../repositories/perjalananRepository.js";
import { kendaraanRepository } from "../repositories/kendaraanRepository.js";
import { efisiensiService } from "./efisiensiService.js";
import { validasiService } from "./validasiService.js";
import { timelineService } from "./timelineService.js";
import { fraudService } from "./fraudService.js";

function formatPerjalanan(p) {
  const flags = p.fraudFlags || {};
  const fotoBon = p.fotoBon || null;
  const fotoBonUrl = null;

  return {
    id: p.id,
    tanggal: p.tanggal ? new Date(p.tanggal).toISOString().split("T")[0] : null,
    pegawai: {
      id: p.pegawaiId,
      nama: p.pegawai?.nama || null,
    },
    kendaraan: {
      id: p.kendaraanId,
      plat_nomor: p.kendaraan?.platNomor || null,
      jenis: p.kendaraan?.jenis || null,
    },
    tujuan: p.tujuan,
    uraian: p.uraian,
    odometer: {
      km_lama: parseFloat(p.kmLama),
      km_baru: parseFloat(p.kmBaru),
      jarak_km: parseFloat(p.jarak),
    },
    bbm: {
      vol_liter: parseFloat(p.volLiter),
      harga_per_liter: parseFloat(p.hargaPerLiter),
      jumlah_biaya: parseFloat(p.jumlahBiaya),
      no_bon: p.noBon || null,
      foto_bon: fotoBon,
      foto_bon_url: fotoBonUrl,
    },
    monitoring: {
      efisiensi: parseFloat(p.efisiensi),
      status_efisiensi: p.statusEfisiensi,
      status_reason: p.statusReason,
      fraud_score: p.fraudScore,
      fraud_flags: flags,
    },
    status_validasi: flags?.status_anomali || "Normal",
    nilai_sewajarnya: parseFloat(flags?.hasil_sewajarnya || 0),
    deviasi_km: parseFloat(flags?.deviasi || 0),
    keterangan_validasi: flags?.keterangan_anomali || "Tidak ada alasan.",
    timeline_status: flags?.timeline_status || "Logis",
    alasan_timeline: flags?.alasan_timeline || null,
    display_flags: flags?.display_flags || [],
    created_at: p.createdAt || null,
    updated_at: p.updatedAt || null,
  };
}

export const perjalananService = {
  async getAll({
    page = 1,
    perPage = 15,
    pegawai_id,
    kendaraan_id,
    status,
    status_validasi,
    tanggal_dari,
    tanggal_sampai,
  }) {
    const skip = (page - 1) * perPage;
    const take = perPage;

    const where = { deletedAt: null };

    if (pegawai_id) where.pegawaiId = BigInt(pegawai_id);
    if (kendaraan_id) where.kendaraanId = BigInt(kendaraan_id);
    if (status) where.statusEfisiensi = status.charAt(0).toUpperCase() + status.slice(1);
    if (tanggal_dari) where.tanggal = { ...where.tanggal, gte: new Date(tanggal_dari) };
    if (tanggal_sampai) where.tanggal = { ...where.tanggal, lte: new Date(tanggal_sampai) };
    if (status_validasi) {
      where.fraudFlags = { path: ["status_anomali"], equals: status_validasi };
    }

    const [data, total] = await Promise.all([
      perjalananRepository.findManyPaginated({
        where,
        include: { pegawai: true, kendaraan: true },
        skip,
        take,
        orderBy: [{ kendaraanId: "asc" }, { kmBaru: "asc" }],
      }),
      perjalananRepository.count(where),
    ]);

    return {
      data: data.map(formatPerjalanan),
      meta: {
        currentPage: page,
        perPage,
        total,
        lastPage: Math.ceil(total / perPage),
      },
    };
  },

  async getById(id) {
    const data = await perjalananRepository.findById(id);

    if (!data) return null;
    return formatPerjalanan(data);
  },

  async buildPayload(validated, excludeId = null) {
    const jarak = efisiensiService.hitungJarak(
      parseFloat(validated.km_lama),
      parseFloat(validated.km_baru)
    );
    const volLiter = efisiensiService.hitungVolumeLiter(
      parseFloat(validated.jumlah_biaya),
      parseFloat(validated.harga_per_liter)
    );
    const efisiensi = efisiensiService.hitungEfisiensi(jarak, volLiter);

    const kendaraan = await kendaraanRepository.findByIdWithJenis(BigInt(validated.kendaraan_id));
    const tipe = kendaraan?.jenis || "R4";
    const bbm = efisiensiService.inferBBM(parseFloat(validated.harga_per_liter));
    const status = efisiensiService.tentukanStatus(efisiensi, tipe, bbm);
    const statusReason = efisiensiService.generateStatusReason(efisiensi, tipe, status, bbm);

    const verifikasiResult = await fraudService.hitungIndikasiVerifikasi(
      {
        ...validated,
        jarak,
        efisiensi,
        harga_per_liter: validated.harga_per_liter,
      },
      excludeId,
      tipe
    );

    const anomaliResult = fraudService.hitungAnomali(
      jarak,
      volLiter,
      efisiensi,
      tipe,
      bbm,
      verifikasiResult.indikasi,
      status
    );

    const timeline = await timelineService.validasiTimeline(
      parseFloat(validated.km_lama),
      parseFloat(validated.km_baru),
      parseInt(validated.kendaraan_id),
      excludeId,
      validated.tanggal
    );

    const fraudScore = (() => {
      switch (anomaliResult.status_anomali) {
        case "Perlu Verifikasi": return 50;
        case "Anomali": return status === "balance" ? 50 : 90;
        default: return status === "anomali" ? 50 : 10;
      }
    })();

    const displayFlags = fraudService.resolveDisplayFlags(
      verifikasiResult.indikasi,
      timeline.status || "Logis"
    );

    const fraudFlags = {
      verifikasi_indikasi: verifikasiResult.indikasi,
      total_bobot: verifikasiResult.total_bobot,
      status_anomali: anomaliResult.status_anomali,
      hasil_sewajarnya: anomaliResult.hasil_sewajarnya,
      deviasi: anomaliResult.deviasi,
      keterangan_anomali: anomaliResult.keterangan_anomali,
      timeline_status: timeline.status || "Logis",
      alasan_timeline: timeline.alasan,
      display_flags: displayFlags,
    };

    return {
      pegawaiId: BigInt(validated.pegawai_id),
      kendaraanId: BigInt(validated.kendaraan_id),
      tanggal: new Date(validated.tanggal),
      tujuan: validated.tujuan,
      uraian: validated.uraian || null,
      kmLama: jarak === 0 ? parseFloat(validated.km_lama) : parseFloat(validated.km_lama),
      kmBaru: parseFloat(validated.km_baru),
      jarak,
      volLiter,
      hargaPerLiter: parseFloat(validated.harga_per_liter),
      jumlahBiaya: parseFloat(validated.jumlah_biaya),
      noBon: validated.no_bon || null,
      fotoBon: null,
      efisiensi,
      statusEfisiensi: status.charAt(0).toUpperCase() + status.slice(1),
      statusReason,
      fraudScore,
      fraudFlags,
    };
  },

  async create(validated) {
    const payload = await this.buildPayload(validated);

    const perjalanan = await perjalananRepository.create(payload);

    return formatPerjalanan(perjalanan);
  },

  async update(id, validated) {
    const existing = await perjalananRepository.findFirst({
      id, deletedAt: null,
    });

    if (!existing) return null;

    const payload = await this.buildPayload(validated, id);

    const perjalanan = await perjalananRepository.update(id, payload);

    return formatPerjalanan(perjalanan);
  },

  async delete(id) {
    return perjalananRepository.delete(id);
  },

  async getStats() {
    const [total, agg] = await Promise.all([
      perjalananRepository.count({ deletedAt: null }),
      perjalananRepository.getStats({ deletedAt: null }),
    ]);

    return {
      total,
      totalBBM: parseFloat(agg._sum.jumlahBiaya) || 0,
      totalLiter: parseFloat(agg._sum.volLiter) || 0,
      rataEfisiensi: parseFloat(agg._avg.efisiensi) || 0,
    };
  },

  async exportExcel({ bulan, tahun }) {
    const startDate = new Date(`${tahun}-${String(bulan).padStart(2, "0")}-01T00:00:00.000Z`);
    const endDate = new Date(tahun, bulan, 1); // month is 0-indexed in Date, so bulan=7 => August 1

    const where = {
      deletedAt: null,
      tanggal: {
        gte: startDate,
        lt: endDate,
      },
    };

    const data = await perjalananRepository.findExportData({
      where,
      include: { pegawai: true, kendaraan: true },
      orderBy: [{ kendaraanId: "asc" }, { kmBaru: "asc" }],
    });

    return data.map((p) => {
      const flags = p.fraudFlags || {};
      return {
        tanggal: p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "",
        uraian: p.uraian || p.tujuan,
        tujuan: p.tujuan,
        kendaraan: p.kendaraan?.merk || p.kendaraan?.jenis || "-",
        plat_nomor: p.kendaraan?.platNomor || "-",
        vol_liter: parseFloat(p.volLiter) || 0,
        km_lama: parseFloat(p.kmLama) || 0,
        km_baru: parseFloat(p.kmBaru) || 0,
        jarak: parseFloat(p.jarak) || 0,
        harga_per_liter: parseFloat(p.hargaPerLiter) || 0,
        jumlah_biaya: parseFloat(p.jumlahBiaya) || 0,
      };
    });
  },

  buildFlashMessage(payload) {
    const flags = payload.fraudFlags || {};
    const statusAnomali = flags.status_anomali || "Normal";

    if (statusAnomali === "Anomali") {
      return {
        type: "warning",
        message: "Data disimpan. Status: Anomali. Data perjalanan perlu diverifikasi lebih lanjut.",
      };
    }

    if (statusAnomali === "Perlu Verifikasi") {
      return {
        type: "warning",
        message: "Data disimpan. Status: Perlu Verifikasi. Terdapat indikasi yang perlu diperiksa.",
      };
    }

    return {
      type: "success",
      message: "Data perjalanan berhasil disimpan.",
    };
  },
};
