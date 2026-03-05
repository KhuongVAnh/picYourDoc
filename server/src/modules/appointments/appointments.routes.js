const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");

const appointmentsRouter = Router();

appointmentsRouter.use(authenticate);

appointmentsRouter.get(
  "/",
  authorizeRoles("patient", "doctor", "admin"),
  (req, res) => {
    return res.status(200).json({
      data: [],
      message:
        "Appointments module scaffolded. API detail will be implemented in Phase 2.",
    });
  }
);

module.exports = { appointmentsRouter };
