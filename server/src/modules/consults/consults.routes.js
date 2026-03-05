const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");

const consultsRouter = Router();

consultsRouter.use(authenticate);

consultsRouter.get(
  "/",
  authorizeRoles("patient", "doctor", "admin"),
  (req, res) => {
    return res.status(200).json({
      data: [],
      message:
        "Consults module scaffolded. Realtime chat/video endpoints will be implemented in Phase 3.",
    });
  }
);

module.exports = { consultsRouter };
