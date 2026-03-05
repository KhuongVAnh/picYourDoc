const { Router } = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../../middlewares/auth.middleware");
const subscriptionsController = require("./subscriptions.controller");

const subscriptionsRouter = Router();

// Bảo vệ toàn bộ route subscriptions bằng JWT để truy xuất dữ liệu cá nhân.
subscriptionsRouter.use(authenticate);

subscriptionsRouter.get(
  "/plans",
  authorizeRoles("patient", "doctor", "admin"),
  subscriptionsController.listPlans
);
subscriptionsRouter.get(
  "/me",
  authorizeRoles("patient", "doctor", "admin"),
  subscriptionsController.getMySubscription
);
subscriptionsRouter.post(
  "/checkout/mock",
  authorizeRoles("patient"),
  subscriptionsController.checkoutMock
);
subscriptionsRouter.get(
  "/transactions",
  authorizeRoles("patient", "doctor", "admin"),
  subscriptionsController.listTransactions
);
subscriptionsRouter.get(
  "/usage",
  authorizeRoles("patient", "doctor", "admin"),
  subscriptionsController.getUsage
);
subscriptionsRouter.post(
  "/cancel",
  authorizeRoles("patient"),
  subscriptionsController.cancelSubscription
);

module.exports = { subscriptionsRouter };
