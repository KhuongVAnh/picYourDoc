const notificationsService = require("./notifications.service");

// Xử lý API lấy danh sách thông báo cho user đã đăng nhập.
async function listNotifications(req, res, next) {
  try {
    const result = await notificationsService.listNotifications({
      userId: req.user.userId,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API đánh dấu thông báo đã đọc.
async function markAsRead(req, res, next) {
  try {
    const data = await notificationsService.markNotificationAsRead({
      notificationId: req.params.id,
      userId: req.user.userId,
    });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listNotifications, markAsRead };
