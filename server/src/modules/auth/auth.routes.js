const { Router } = require("express");
const authController = require("./auth.controller");
const { authenticate } = require("../../middlewares/auth.middleware");

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refreshToken);
authRouter.get("/me", authenticate, authController.getMe);
authRouter.patch("/me/profile", authenticate, authController.updateMeProfile);

module.exports = { authRouter };
