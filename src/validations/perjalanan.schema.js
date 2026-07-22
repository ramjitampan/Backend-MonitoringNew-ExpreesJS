import { z } from "zod";

export const storePerjalananSchema = z.object({
  pegawai_id: z.coerce.number({ required_error: "Pegawai wajib diisi" })
    .int("Pegawai tidak valid"),

  kendaraan_id: z.coerce.number({ required_error: "Kendaraan wajib diisi" })
    .int("Kendaraan tidak valid"),

  tanggal: z.string({ required_error: "Tanggal wajib diisi" })
    .min(1, "Tanggal wajib diisi")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),

  tujuan: z.string({ required_error: "Tujuan wajib diisi" })
    .min(1, "Tujuan wajib diisi")
    .max(255, "Tujuan maksimal 255 karakter"),

  uraian: z.string()
    .max(255, "Uraian maksimal 255 karakter")
    .optional()
    .nullable(),

  km_lama: z.coerce.number({ required_error: "KM Lama wajib diisi" })
    .min(0, "KM Lama minimal 0"),

  km_baru: z.coerce.number({ required_error: "KM Baru wajib diisi" })
    .min(0, "KM Baru minimal 0"),

  jumlah_biaya: z.coerce.number({ required_error: "Jumlah biaya wajib diisi" })
    .min(1000, "Jumlah biaya minimal Rp1.000"),

  harga_per_liter: z.coerce.number({ required_error: "Harga per liter wajib diisi" })
    .min(1, "Harga per liter minimal 1"),

  no_bon: z.string()
    .max(100, "No bon maksimal 100 karakter")
    .optional()
    .nullable(),
}).refine((data) => data.km_baru > data.km_lama, {
  message: "KM Baru harus lebih besar dari KM Lama",
  path: ["km_baru"],
});

export const updatePerjalananSchema = storePerjalananSchema;
