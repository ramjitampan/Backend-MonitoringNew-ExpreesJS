export const efisiensiService = {
  hitungJarak(kmLama, kmBaru) {
    return Math.max(0, parseFloat((kmBaru - kmLama).toFixed(2)));
  },

  hitungVolumeLiter(jumlahBiaya, hargaPerLiter) {
    if (hargaPerLiter <= 0) return 0;
    return parseFloat((jumlahBiaya / hargaPerLiter).toFixed(2));
  },

  hitungEfisiensi(jarak, volLiter) {
    if (volLiter <= 0) return 0;
    return parseFloat((jarak / volLiter).toFixed(2));
  },

  getBatasEfisiensi(tipe, bbm = null) {
    if (tipe === "R2") {
      return { anomaliAtas: 60, balance: 25, boros: 10, anomaliBawah: 3 };
    }
    if (bbm === "solar" || bbm === "pertamina_dex") {
      return { anomaliAtas: 14, balance: 6, boros: 3, anomaliBawah: 1.5 };
    }
    return { anomaliAtas: 20, balance: 10, boros: 5, anomaliBawah: 2 };
  },

  tentukanStatus(efisiensi, tipe = "R4", bbm = null) {
    const b = this.getBatasEfisiensi(tipe, bbm);
    if (efisiensi > b.anomaliAtas || efisiensi < b.anomaliBawah) return "anomali";
    if (efisiensi >= b.balance) return "balance";
    if (efisiensi >= b.boros) return "boros";
    return "anomali";
  },

  inferBBM(hargaPerLiter) {
    if (hargaPerLiter <= 7500) return "solar";
    if (hargaPerLiter <= 10500) return "pertalite";
    if (hargaPerLiter <= 13500) return "pertamax";
    if (hargaPerLiter <= 14500) return "pertamax_turbo";
    return "pertamina_dex";
  },

  generateStatusReason(efisiensi, tipe, status, bbm = null) {
    const b = this.getBatasEfisiensi(tipe, bbm);
    const unit = "km/liter";
    const bbmLabel = bbm ? bbm.toUpperCase() : tipe === "R2" ? "BENSIN" : "BENSIN";

    switch (status) {
      case "balance":
        return `Efisiensi ${efisiensi.toFixed(2)} ${unit} tergolong normal untuk ${tipe} ${bbmLabel} (batas ≥ ${b.balance} ${unit}).`;
      case "boros":
        return `Efisiensi ${efisiensi.toFixed(2)} ${unit} di bawah normal untuk ${tipe} ${bbmLabel} (batas normal ${b.balance} ${unit}). Konsumsi BBM lebih tinggi dari standar.`;
      case "anomali":
        return efisiensi > b.anomaliAtas
          ? `Efisiensi ${efisiensi.toFixed(2)} ${unit} melebihi batas atas anomali (${b.anomaliAtas} ${unit} untuk ${tipe} ${bbmLabel}). Perlu verifikasi data.`
          : `Efisiensi ${efisiensi.toFixed(2)} ${unit} di bawah batas minimum untuk ${tipe} ${bbmLabel} (${b.anomaliBawah} ${unit}). Konsumsi BBM tidak wajar.`;
      default:
        return `Efisiensi ${efisiensi.toFixed(2)} ${unit} tidak dapat dikategorikan.`;
    }
  },
};
