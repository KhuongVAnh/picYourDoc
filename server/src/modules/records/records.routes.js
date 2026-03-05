const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");

const recordsRouter = Router();

recordsRouter.use(authenticate);

recordsRouter.get(
  "/",
  authorizeRoles("patient", "doctor", "admin"),
  (req, res) => {
    return res.status(200).json({
      data: [],
      message:
        "Records module scaffolded. Health records APIs will be implemented in Phase 4.",
    });
  }
);

module.exports = { recordsRouter };
