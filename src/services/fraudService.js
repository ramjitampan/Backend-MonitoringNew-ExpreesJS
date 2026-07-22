import { kendaraanRepository } from "../repositories/kendaraanRepository.js";
import { efisiensiService } from "./efisiensiService.js";
import { validasiService } from "./validasiService.js";

const TOLERANCE_RATIO = 0.4;

export const fraudService = {
  async hitungIndikasiVerifikasi(data, excludeId = null, tipe = null) {
    const indikasi = [];
    let totalBobot = 0;

    if (!tipe) {
      const kendaraan = await kendaraanRepository.findByIdWithJenis(BigInt(data.kendaraan_id));
      tipe = kendaraan?.jenis || "R4";
    }

    const bbm = efisiensiService.inferBBM(parseFloat(data.harga_per_liter || 0));

    if (!validasiService.isNominalGanjil(parseFloat(data.jumlah_biaya))) {
      indikasi.push("nominal_bon_kelipatan_bulat");
      totalBobot += 30;
    }

    if (data.no_bon && await validasiService.isDuplicateBon(data.no_bon, data.kendaraan_id, excludeId)) {
      indikasi.push("no_bon_duplikat");
      totalBobot += 40;
    }

    if (!await validasiService.isJarakWajar(parseFloat(data.jarak), tipe, data.tanggal, data.kendaraan_id, excludeId)) {
      indikasi.push("jarak_melebihi_batas_harian");
      totalBobot += 25;
    }

    const hargaPerLiter = parseFloat(data.harga_per_liter || 0);
    if (hargaPerLiter > 0 && (hargaPerLiter < 6000 || hargaPerLiter > 20000)) {
      indikasi.push("harga_tidak_wajar");
      totalBobot += 20;
    }

    const efisiensi = parseFloat(data.efisiensi);
    const batas = efisiensiService.getBatasEfisiensi(tipe, bbm);

    if (efisiensi > batas.anomaliAtas || efisiensi < batas.anomaliBawah) {
      indikasi.push("efisiensi_di_luar_batas_mutlak");
      totalBobot += 15;
    }

    return {
      total_bobot: totalBobot,
      indikasi,
      tingkat: this.interpretasiTingkatVerifikasi(totalBobot),
    };
  },

  interpretasiTingkatVerifikasi(bobot) {
    if (bobot === 0) return "Normal";
    if (bobot <= 20) return "Perhatian";
    if (bobot <= 50) return "Perlu Verifikasi";
    return "Anomali";
  },

  hitungAnomali(jarak, volLiter, efisiensi, tipe = "R4", bbm = "pertalite", indikasi = [], statusEfisiensi = "balance") {
    const batas = efisiensiService.getBatasEfisiensi(tipe, bbm);

    const efisiensiWajar = (batas.balance + batas.anomaliAtas) / 2;
    const nilaiSewajarnya = volLiter > 0 ? parseFloat((volLiter * efisiensiWajar).toFixed(2)) : 0;

    const deviasi = parseFloat(Math.abs(nilaiSewajarnya - jarak).toFixed(2));
    const toleransi = parseFloat((TOLERANCE_RATIO * Math.max(nilaiSewajarnya, 1)).toFixed(2));

    const rasioDeviasi = toleransi > 0 ? deviasi / toleransi : 0;
    let status;
    if (rasioDeviasi <= 1.0) {
      status = "Normal";
    } else if (rasioDeviasi <= 2.0) {
      status = "Perlu Verifikasi";
    } else {
      status = "Anomali";
    }

    const keterangan = this.generateKeteranganAnomali(
      jarak, nilaiSewajarnya, deviasi, toleransi,
      status, indikasi, statusEfisiensi
    );

    return {
      hasil_sewajarnya: nilaiSewajarnya,
      deviasi,
      status_anomali: status,
      keterangan_anomali: keterangan,
    };
  },

  generateKeteranganAnomali(jarak, nilaiSewajarnya, deviasi, toleransi, status, indikasi, statusEfisiensi) {
    if (status === "Normal") {
      return "Data dalam batas normal. Tidak ditemukan indikasi yang memerlukan verifikasi.";
    }

    const alasan = [];

    if (jarak > nilaiSewajarnya && deviasi > toleransi) {
      alasan.push(`Jarak tempuh (${jarak} km) melebihi nilai sewajarnya (${nilaiSewajarnya} km)`);
    } else if (jarak < nilaiSewajarnya && deviasi > toleransi) {
      alasan.push(`Jarak tempuh (${jarak} km) lebih rendah dari nilai sewajarnya (${nilaiSewajarnya} km)`);
    }

    if (deviasi > toleransi) {
      const persen = Math.round((deviasi / Math.max(nilaiSewajarnya, 1)) * 100);
      alasan.push(`Selisih ${deviasi} km (${persen}%) melebihi batas toleransi ${toleransi} km`);
    }

    if (indikasi.includes("jarak_melebihi_batas_harian")) {
      alasan.push("Pemakaian BBM lebih cepat dari estimasi normal");
    }

    if (indikasi.includes("efisiensi_di_luar_batas_mutlak")) {
      alasan.push("Perbedaan odometer tidak wajar");
    }

    if (indikasi.includes("nominal_bon_kelipatan_bulat")) {
      alasan.push("Nominal bon merupakan kelipatan genap");
    }

    if (indikasi.includes("no_bon_duplikat")) {
      alasan.push("Nomor bon duplikat dengan transaksi sebelumnya");
    }

    if (indikasi.includes("harga_tidak_wajar")) {
      alasan.push("Harga per liter tidak sesuai range harga BBM");
    }

    if (statusEfisiensi === "anomali" && alasan.length === 0) {
      alasan.push("Efisiensi BBM berada di luar batas wajar");
    }

    if (alasan.length === 0) {
      return "Data perjalanan perlu diverifikasi lebih lanjut.";
    }

    return alasan.join(". ") + ".";
  },

  resolveDisplayFlags(indikasi, timelineStatus) {
    const flags = [];
    for (const code of indikasi) {
      switch (code) {
        case "no_bon_duplikat": flags.push("Bon Duplikat"); break;
        case "harga_tidak_wajar": flags.push("Harga Tidak Wajar"); break;
        case "nominal_bon_kelipatan_bulat": flags.push("Nominal Bon Bulat"); break;
        case "jarak_melebihi_batas_harian": flags.push("Jarak Tidak Wajar"); break;
        case "efisiensi_di_luar_batas_mutlak": flags.push("Efisiensi Tidak Wajar"); break;
      }
    }
    if (timelineStatus === "Tidak Logis") flags.push("Timeline Tidak Logis");
    if (timelineStatus === "Perlu Verifikasi") flags.push("Odometer Mundur");
    return [...new Set(flags.filter(Boolean))];
  },
};
