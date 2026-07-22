import { ApiError } from "../errors/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Data tidak ditemukan",
    });
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
