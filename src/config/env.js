export const env = {
  PORT: parseInt(process.env.PORT) || 5000,

  DB_HOST: process.env.DB_HOST || "127.0.0.1",
  DB_PORT: parseInt(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "bensin_telkom",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  PERJALANAN_TIF_PREFIX: process.env.PERJALANAN_TIF_PREFIX || "TIF-2954",
  PERJALANAN_MANAGER_NAME: process.env.PERJALANAN_MANAGER_NAME || "Nama Manager",
  PERJALANAN_OFFICER_NAME: process.env.PERJALANAN_OFFICER_NAME || "Nama Officer",
  PERJALANAN_TITLE:
    process.env.PERJALANAN_TITLE ||
    "BIAYA PEMBELIAN BENSIN RODA 4 OPERASIONAL PEKERJAAN NODE B, GAMAS DAN MTEL LOKASI BINJAI",
};
