import "dotenv/config";

// BigInt serialization fix untuk JSON response
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./middlewares/logger.js";
import { authenticate } from "./middlewares/auth.js";
import authRoutes from "./routes/auth.js";
import pegawaiRoutes from "./routes/pegawai.js";
import kendaraanRoutes from "./routes/kendaraan.js";
import perjalananRoutes from "./routes/perjalanan.js";
import dashboardRoutes from "./routes/dashboard.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { success: false, message: "Terlalu banyak permintaan, coba lagi nanti" },
});

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(logger);
app.use(limiter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", (req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/pegawai", authenticate, pegawaiRoutes);
app.use("/api/kendaraan", authenticate, kendaraanRoutes);
app.use("/api/perjalanan", authenticate, perjalananRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Bensin Monitoring API" });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
