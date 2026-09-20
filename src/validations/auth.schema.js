import { z } from "zod";

export const loginSchema = z.object({
  email: z.string({ required_error: "Email wajib diisi" })
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),

  password: z.string({ required_error: "Password wajib diisi" })
    .min(1, "Password wajib diisi"),
});
