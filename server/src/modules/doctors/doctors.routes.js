const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");
const doctorsController = require("./doctors.controller");

const doctorsRouter = Router();

// Public API danh sách bác sĩ cho người dùng chưa đăng nhập.
doctorsRouter.get("/", doctorsController.listDoctors);

// Nhóm API dashboard dành riêng cho bác sĩ (đặt trước route /:doctorId để tránh xung đột).
doctorsRouter.get(
  "/dashboard",
  authenticate,
  authorizeRoles("doctor"),
  doctorsController.getDoctorDashboard
);
doctorsRouter.get(
  "/patients",
  authenticate,
  authorizeRoles("doctor"),
  doctorsController.listDoctorPatients
);
doctorsRouter.get(
  "/patients/:memberId/overview",
  authenticate,
  authorizeRoles("doctor"),
  doctorsController.getDoctorPatientOverview
);
doctorsRouter.get(
  "/income",
  authenticate,
  authorizeRoles("doctor"),
  doctorsController.getDoctorIncome
);

// API chi tiết bác sĩ cần đăng nhập.
doctorsRouter.get("/:doctorId", authenticate, doctorsController.getDoctorDetail);

module.exports = { doctorsRouter };
