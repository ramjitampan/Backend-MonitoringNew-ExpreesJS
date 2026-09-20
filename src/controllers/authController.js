import { authService } from "../services/authService.js";

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.validated;

      const result = await authService.login({ email, password });

      if (!result) {
        return res.status(401).json({
          success: false,
          message: "Email atau password salah",
        });
      }

      return res.json({
        success: true,
        message: "Login berhasil",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
