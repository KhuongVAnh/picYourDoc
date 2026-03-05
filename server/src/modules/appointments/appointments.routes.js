const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");
const appointmentsController = require("./appointments.controller");

const appointmentsRouter = Router();

appointmentsRouter.use(authenticate);

appointmentsRouter.get(
  "/",
  authorizeRoles("patient", "doctor", "admin"),
  appointmentsController.listAppointments
);
appointmentsRouter.post(
  "/",
  authorizeRoles("patient"),
  appointmentsController.createAppointment
);
appointmentsRouter.patch(
  "/:id/confirm",
  authorizeRoles("doctor"),
  appointmentsController.confirmAppointment
);
appointmentsRouter.patch(
  "/:id/reject",
  authorizeRoles("doctor"),
  appointmentsController.rejectAppointment
);
appointmentsRouter.patch(
  "/:id/cancel",
  authorizeRoles("patient", "doctor"),
  appointmentsController.cancelAppointment
);
appointmentsRouter.patch(
  "/:id/reschedule",
  authorizeRoles("patient", "doctor"),
  appointmentsController.rescheduleAppointment
);

module.exports = { appointmentsRouter };
