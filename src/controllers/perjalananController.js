import { perjalananService } from "../services/perjalananService.js";
import { validasiService } from "../services/validasiService.js";
import { efisiensiService } from "../services/efisiensiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError, ValidationError, ConflictError } from "../errors/ApiError.js";
import { env } from "../config/env.js";

export const perjalananController = {
  index: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = Math.min(parseInt(req.query.perPage) || 15, 100);

    const result = await perjalananService.getAll({
      page,
      perPage,
      pegawai_id: req.query.pegawai_id,
      kendaraan_id: req.query.kendaraan_id,
      status: req.query.status,
      status_validasi: req.query.status_validasi,
      tanggal_dari: req.query.tanggal_dari,
      tanggal_sampai: req.query.tanggal_sampai,
    });

    res.json({
      success: true,
      message: "Data perjalanan berhasil diambil",
      data: result.data,
      meta: result.meta,
    });
  }),

  show: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const perjalanan = await perjalananService.getById(id);

    if (!perjalanan) throw new NotFoundError("Perjalanan");

    res.json({
      success: true,
      message: "Detail perjalanan berhasil diambil",
      data: perjalanan,
    });
  }),

  store: asyncHandler(async (req, res) => {
    const validated = req.validated;

    const nominalGanjil = validasiService.isNominalGanjil(parseFloat(validated.jumlah_biaya));
    if (!nominalGanjil) {
      throw new ValidationError([
        {
          field: "jumlah_biaya",
          message: "Nominal bon harus ganjil-ribuan sesuai aturan Pertamina. Contoh: Rp51.000, Rp101.000.",
        },
      ]);
    }

    if (validated.no_bon && (await validasiService.isDuplicateBon(validated.no_bon, parseInt(validated.kendaraan_id)))) {
      throw new ValidationError([
        {
          field: "no_bon",
          message: "Nomor bon ini sudah pernah diinput untuk kendaraan ini. Kemungkinan bon duplikat.",
        },
      ]);
    }

    const volLiter = efisiensiService.hitungVolumeLiter(parseFloat(validated.jumlah_biaya), parseFloat(validated.harga_per_liter));

    if (await validasiService.isDuplicateRecord(validated.tanggal, parseInt(validated.kendaraan_id), parseFloat(validated.km_lama), parseFloat(validated.km_baru), volLiter)) {
      throw new ConflictError("Data duplikat.");
    }

    const perjalanan = await perjalananService.create(validated);

    res.status(201).json({
      success: true,
      message: "Data perjalanan berhasil disimpan",
      data: perjalanan,
    });
  }),

  update: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const validated = req.validated;

    const nominalGanjil = validasiService.isNominalGanjil(parseFloat(validated.jumlah_biaya));
    if (!nominalGanjil) {
      throw new ValidationError([
        {
          field: "jumlah_biaya",
          message: "Nominal bon harus ganjil-ribuan sesuai aturan Pertamina. Contoh: Rp51.000, Rp101.000.",
        },
      ]);
    }

    if (validated.no_bon && (await validasiService.isDuplicateBon(validated.no_bon, parseInt(validated.kendaraan_id), id))) {
      throw new ValidationError([
        {
          field: "no_bon",
          message: "Nomor bon ini sudah pernah diinput untuk kendaraan ini. Kemungkinan bon duplikat.",
        },
      ]);
    }

    const volLiter = efisiensiService.hitungVolumeLiter(parseFloat(validated.jumlah_biaya), parseFloat(validated.harga_per_liter));

    if (await validasiService.isDuplicateRecord(validated.tanggal, parseInt(validated.kendaraan_id), parseFloat(validated.km_lama), parseFloat(validated.km_baru), volLiter, id)) {
      throw new ConflictError("Data duplikat.");
    }

    const perjalanan = await perjalananService.update(id, validated);

    if (!perjalanan) throw new NotFoundError("Perjalanan");

    res.json({
      success: true,
      message: "Data perjalanan berhasil diupdate",
      data: perjalanan,
    });
  }),

  exportExcel: asyncHandler(async (req, res) => {
    const bulan = parseInt(req.query.bulan);
    const tahun = parseInt(req.query.tahun);

    if (!bulan || bulan < 1 || bulan > 12) {
      return res.status(400).json({
        success: false,
        message: "Parameter 'bulan' wajib diisi (1-12)",
      });
    }
    if (!tahun || tahun < 2000 || tahun > 2100) {
      return res.status(400).json({
        success: false,
        message: "Parameter 'tahun' wajib diisi (2000-2100)",
      });
    }

    const rows = await perjalananService.exportExcel({ bulan, tahun });
    const fs = await import("fs");
    const path = await import("path");
    const ExcelJS = require("exceljs");

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bensin Monitoring";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Laporan BBM");
    sheet.pageSetup.orientation = "landscape";
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 1;
    sheet.pageSetup.margins = {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3,
    };

    const tifPrefix = env.PERJALANAN_TIF_PREFIX;
    const namaManager = env.PERJALANAN_MANAGER_NAME;
    const namaOfficer = env.PERJALANAN_OFFICER_NAME;
    const judul = env.PERJALANAN_TITLE;

    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][bulan - 1];

    // ── Logo ──
    const logoPath = path.join(process.cwd(), "public", "foto", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoId = workbook.addImage({
        buffer: logoBuffer,
        extension: "png",
      });
      sheet.addImage(logoId, {
        tl: { col: 0.25, row: 0.25 },
        ext: { width: 100, height: 40 },
      });
    }

    // ── Kop Laporan ──
    sheet.mergeCells("A1:L1");
    const titleCell = sheet.getRow(1).getCell(1);
    titleCell.value = judul;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 50;

    sheet.mergeCells("A2:L2");
    const infoRow2 = sheet.getRow(2);
    infoRow2.height = 20;
    infoRow2.getCell(1).value = `Nomor: ${tifPrefix}/${tahun}`;
    infoRow2.getCell(1).font = { size: 12 };
    infoRow2.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

    sheet.mergeCells("A3:L3");
    const infoRow3 = sheet.getRow(3);
    infoRow3.height = 20;
    infoRow3.getCell(1).value = `Periode: ${namaBulan} ${tahun}`;
    infoRow3.getCell(1).font = { size: 12 };
    infoRow3.getCell(1).alignment = { vertical: "middle", horizontal: "center" };

    // ── Spacer ──
    sheet.getRow(4).height = 10;

    // ── Header Tabel ──
    const headers = ["NO", "TANGGAL", "URAIAN", "TUJUAN", "KENDARAAN", "NO POLISI", "VOLUME (L)", "KM LAMA", "KM BARU", "SELISIH", "HARGA/LITER", "JUMLAH"];
    const headerRow = sheet.getRow(5);
    headers.forEach((h, i) => {
      headerRow.getCell(i + 1).value = h;
    });
    headerRow.height = 30;
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 9 };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD71920" } };
    headerRow.alignment = { horizontal: "center", vertical: "center", wrapText: true };

    // ── Data ──
    sheet.views = [
      {
        style: "pageBreakPreview",
      },
    ];
    const dataStartRow = 6;
    const center = { vertical: "center", horizontal: "center" };
    const right = { vertical: "center", horizontal: "right" };

    rows.forEach((item, idx) => {
      const r = dataStartRow + idx;
      const row = sheet.getRow(r);

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = item.tanggal;
      row.getCell(3).value = item.uraian || "";
      row.getCell(4).value = item.tujuan || "";
      row.getCell(5).value = item.kendaraan || "";
      row.getCell(6).value = item.plat_nomor || "";
      row.getCell(7).value = item.vol_liter;
      row.getCell(8).value = item.km_lama;
      row.getCell(9).value = item.km_baru;
      row.getCell(10).value = item.jarak;
      row.getCell(11).value = item.harga_per_liter;
      row.getCell(12).value = item.jumlah_biaya;

      row.alignment = { vertical: "center", wrapText: true };
      [1, 2, 5, 6, 7, 8, 9, 10].forEach((c) => {
        row.getCell(c).alignment = center;
      });
      [11, 12].forEach((c) => {
        row.getCell(c).alignment = right;
      });

      row.getCell(7).numFmt = "#,##0.00";
      row.getCell(8).numFmt = "#,##0";
      row.getCell(9).numFmt = "#,##0";
      row.getCell(10).numFmt = "#,##0";
      row.getCell(11).numFmt = "#,##0";
      row.getCell(12).numFmt = "#,##0";
    });

    const lastDataRow = dataStartRow + rows.length - 1;
    const totalRowNum = lastDataRow + 1;

    // ── Total ──
    const totalRow = sheet.getRow(totalRowNum);
    for (let c = 1; c <= 12; c++) {
      totalRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E8" } };
    }
    totalRow.getCell(11).value = "TOTAL";
    totalRow.getCell(11).alignment = right;
    totalRow.getCell(11).font = { bold: true, size: 10 };
    totalRow.getCell(12).value = rows.length > 0 ? { formula: `SUM(L${dataStartRow}:L${lastDataRow})` } : 0;
    totalRow.getCell(12).numFmt = "#,##0";
    totalRow.getCell(12).font = { bold: true, size: 10 };

    // ── Border konsisten untuk seluruh tabel (header s.d. TOTAL) ──
    const thinBorder = {
      top: { style: "thin", color: { argb: "FF888888" } },
      left: { style: "thin", color: { argb: "FF888888" } },
      bottom: { style: "thin", color: { argb: "FF888888" } },
      right: { style: "thin", color: { argb: "FF888888" } },
    };
    for (let r = 5; r <= totalRowNum; r++) {
      for (let c = 1; c <= 12; c++) {
        sheet.getRow(r).getCell(c).border = thinBorder;
      }
    }

    // ── Dynamic Spacing ──
    const MIN_SIGNATURE_ROW = 30;
    const labelRow = Math.max(totalRowNum + 2, MIN_SIGNATURE_ROW);
    const nameRow = labelRow + 5;

    // ── Signature ──
    sheet.mergeCells(`A${labelRow}:F${labelRow}`);
    sheet.mergeCells(`G${labelRow}:L${labelRow}`);
    sheet.mergeCells(`A${nameRow}:F${nameRow}`);
    sheet.mergeCells(`G${nameRow}:L${nameRow}`);

    sheet.getRow(labelRow).getCell(1).value = "Mgr. Branch Binjai";
    sheet.getRow(labelRow).getCell(7).value = "Officer 3 Business Support Branch Binjai";
    sheet.getRow(labelRow).alignment = center;
    sheet.getRow(labelRow).font = { bold: true, size: 10 };

    for (let i = 1; i <= 4; i++) {
      sheet.getRow(labelRow + i).height = 30;
    }

    sheet.getRow(nameRow).getCell(1).value = `(${namaManager})`;
    sheet.getRow(nameRow).getCell(7).value = `(${namaOfficer})`;
    sheet.getRow(nameRow).alignment = center;
    sheet.getRow(nameRow).font = { size: 10 };

    const generatedByRow = nameRow + 2;
    const footerInfoRow = generatedByRow + 1;

    sheet.mergeCells(`A${generatedByRow}:L${generatedByRow}`);
    sheet.getRow(generatedByRow).getCell(1).value = "Generated by Sistem Monitoring BBM";
    sheet.getRow(generatedByRow).getCell(1).font = { size: 8, color: { argb: "FF999999" }, italic: true };
    sheet.getRow(generatedByRow).getCell(1).alignment = { horizontal: "right", vertical: "middle" };

    sheet.mergeCells(`A${footerInfoRow}:L${footerInfoRow}`);
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const tanggalCetak = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    sheet.getRow(footerInfoRow).getCell(1).value = `Dicetak pada: ${tanggalCetak} WIB`;
    sheet.getRow(footerInfoRow).getCell(1).font = { size: 8, color: { argb: "FF999999" }, italic: true };
    sheet.getRow(footerInfoRow).getCell(1).alignment = { horizontal: "right", vertical: "middle" };

    // ── Column Widths ──
    [5, 13, 40, 28, 16, 14, 12, 12, 12, 10, 14, 16].forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    const filename = `laporan-perjalanan-${tahun}-${String(bulan).padStart(2, "0")}.xlsx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  }),

  destroy: asyncHandler(async (req, res) => {
    const id = BigInt(req.params.id);
    const deleted = await perjalananService.delete(id);

    if (!deleted) throw new NotFoundError("Perjalanan");

    res.json({
      success: true,
      message: "Data perjalanan berhasil dihapus",
    });
  }),
};
