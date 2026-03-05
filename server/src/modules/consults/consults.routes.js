const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");
const consultsController = require("./consults.controller");

const consultsRouter = Router();

consultsRouter.use(authenticate);

consultsRouter.get(
  "/appointments/:appointmentId/session",
  authorizeRoles("patient", "doctor", "admin"),
  consultsController.getConsultSessionByAppointment
);
consultsRouter.post(
  "/appointments/:appointmentId/start",
  authorizeRoles("doctor"),
  consultsController.startConsultSession
);
consultsRouter.get(
  "/sessions/:sessionId/messages",
  authorizeRoles("patient", "doctor", "admin"),
  consultsController.getConsultMessages
);
consultsRouter.patch(
  "/sessions/:sessionId/end",
  authorizeRoles("doctor"),
  consultsController.endConsultSession
);

module.exports = { consultsRouter };
