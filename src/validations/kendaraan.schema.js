import { z } from "zod";

export const storeKendaraanSchema = z.object({
  plat_nomor: z.string({ required_error: "Plat nomor wajib diisi" })
    .min(1, "Plat nomor wajib diisi")
    .transform((val) => val.toUpperCase()),

  merk: z.string({ required_error: "Merk wajib diisi" })
    .min(1, "Merk wajib diisi")
    .max(255, "Merk maksimal 255 karakter"),

  jenis: z.string({ required_error: "Jenis wajib diisi" })
    .min(1, "Jenis wajib diisi")
    .refine((val) => val === "R4", {
      message: "Jenis harus R4",
    }),

  tahun: z.coerce.number({ required_error: "Tahun wajib diisi" })
    .int("Tahun harus berupa angka")
    .min(1900, "Tahun minimal 1900")
    .max(new Date().getFullYear(), `Tahun maksimal ${new Date().getFullYear()}`),
});

export const updateKendaraanSchema = z.object({
  plat_nomor: z.string({ required_error: "Plat nomor wajib diisi" })
    .min(1, "Plat nomor wajib diisi")
    .transform((val) => val.toUpperCase()),

  merk: z.string({ required_error: "Merk wajib diisi" })
    .min(1, "Merk wajib diisi")
    .max(255, "Merk maksimal 255 karakter"),

  jenis: z.string({ required_error: "Jenis wajib diisi" })
    .min(1, "Jenis wajib diisi")
    .refine((val) => val === "R4", {
      message: "Jenis harus R4",
    }),

  tahun: z.coerce.number({ required_error: "Tahun wajib diisi" })
    .int("Tahun harus berupa angka")
    .min(1900, "Tahun minimal 1900")
    .max(new Date().getFullYear(), `Tahun maksimal ${new Date().getFullYear()}`),
});
