const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");
const familyDoctorController = require("./family-doctor.controller");

const familyDoctorRouter = Router();

// Bảo vệ toàn bộ route family doctor vì đều cần dữ liệu người dùng đăng nhập.
familyDoctorRouter.use(authenticate);

familyDoctorRouter.get(
  "/pricing",
  authorizeRoles("patient"),
  familyDoctorController.getFamilyDoctorPaymentConfig
);
familyDoctorRouter.get(
  "/marketplace",
  authorizeRoles("patient"),
  familyDoctorController.listMarketplace
);
familyDoctorRouter.post(
  "/requests",
  authorizeRoles("patient"),
  familyDoctorController.createFamilyDoctorRequest
);
familyDoctorRouter.get(
  "/requests/me",
  authorizeRoles("patient"),
  familyDoctorController.listMyFamilyDoctorRequests
);
familyDoctorRouter.get(
  "/requests/incoming",
  authorizeRoles("doctor"),
  familyDoctorController.listIncomingFamilyDoctorRequests
);
familyDoctorRouter.patch(
  "/requests/:requestId/respond",
  authorizeRoles("doctor"),
  familyDoctorController.respondFamilyDoctorRequest
);
familyDoctorRouter.patch(
  "/intake",
  authorizeRoles("doctor"),
  familyDoctorController.updateDoctorIntakeStatus
);
familyDoctorRouter.get(
  "/contract/me",
  authorizeRoles("patient"),
  familyDoctorController.getMyFamilyDoctorContract
);

module.exports = { familyDoctorRouter };
