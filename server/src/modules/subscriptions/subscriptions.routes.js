const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");

const subscriptionsRouter = Router();

subscriptionsRouter.use(authenticate);

subscriptionsRouter.get(
  "/plans",
  authorizeRoles("patient", "doctor", "admin"),
  (req, res) => {
    return res.status(200).json({
      data: [],
      message:
        "Subscriptions module scaffolded. Plans and payment mock APIs will be implemented in Phase 5.",
    });
  }
);

module.exports = { subscriptionsRouter };
