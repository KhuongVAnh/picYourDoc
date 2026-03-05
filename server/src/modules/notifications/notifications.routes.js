const { Router } = require("express");
const { authenticate } = require("../../middlewares/auth.middleware");
const notificationsController = require("./notifications.controller");

const notificationsRouter = Router();

// Bảo vệ toàn bộ route thông báo bằng JWT.
notificationsRouter.use(authenticate);

// Lấy danh sách thông báo in-app của user hiện tại.
notificationsRouter.get("/", notificationsController.listNotifications);

// Đánh dấu một thông báo cụ thể đã đọc.
notificationsRouter.patch("/:id/read", notificationsController.markAsRead);

module.exports = { notificationsRouter };
