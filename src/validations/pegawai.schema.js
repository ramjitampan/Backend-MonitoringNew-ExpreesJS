import { z } from "zod";

export const storePegawaiSchema = z.object({
  nama: z.string({ required_error: "Nama wajib diisi" })
    .min(1, "Nama wajib diisi")
    .max(255, "Nama maksimal 255 karakter"),

  jabatan: z.string()
    .max(255, "Jabatan maksimal 255 karakter")
    .optional()
    .nullable(),

  divisi: z.string()
    .max(255, "Divisi maksimal 255 karakter")
    .optional()
    .nullable(),

  no_hp: z.string()
    .max(20, "No HP maksimal 20 karakter")
    .optional()
    .nullable(),
});

export const updatePegawaiSchema = storePegawaiSchema;
