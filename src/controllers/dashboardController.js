import { dashboardService } from "../services/dashboardService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboardController = {
  index: asyncHandler(async (req, res) => {
    const data = await dashboardService.getData();

    res.json({
      success: true,
      message: "Data dashboard berhasil diambil",
      data,
    });
  }),
};
