const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");
const recordsController = require("./records.controller");

const recordsRouter = Router();

// Bảo vệ toàn bộ route records vì đều là dữ liệu sức khỏe cá nhân.
recordsRouter.use(authenticate);

recordsRouter.get(
  "/family",
  authorizeRoles("patient", "admin"),
  recordsController.getFamily
);
recordsRouter.post(
  "/family",
  authorizeRoles("patient"),
  recordsController.createFamily
);
recordsRouter.post(
  "/family/members",
  authorizeRoles("patient"),
  recordsController.createFamilyMember
);
recordsRouter.patch(
  "/family/members/:memberId",
  authorizeRoles("patient"),
  recordsController.updateFamilyMember
);
recordsRouter.delete(
  "/family/members/:memberId",
  authorizeRoles("patient"),
  recordsController.deleteFamilyMember
);
recordsRouter.get(
  "/members/:memberId/health-profile",
  authorizeRoles("patient", "doctor", "admin"),
  recordsController.getHealthProfile
);
recordsRouter.put(
  "/members/:memberId/health-profile",
  authorizeRoles("patient", "doctor", "admin"),
  recordsController.upsertHealthProfile
);
recordsRouter.get(
  "/members/:memberId/timeline",
  authorizeRoles("patient", "doctor", "admin"),
  recordsController.getTimelineEntries
);
recordsRouter.post(
  "/members/:memberId/timeline",
  authorizeRoles("doctor", "admin"),
  recordsController.createTimelineNote
);
recordsRouter.get(
  "/members/:memberId/care-plan",
  authorizeRoles("patient", "doctor", "admin"),
  recordsController.getCarePlan
);
recordsRouter.put(
  "/members/:memberId/care-plan",
  authorizeRoles("doctor"),
  recordsController.upsertCarePlan
);

module.exports = { recordsRouter };
