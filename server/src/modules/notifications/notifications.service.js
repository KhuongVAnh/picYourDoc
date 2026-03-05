const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");

// Lấy danh sách thông báo in-app theo user hiện tại, có phân trang.
async function listNotifications({ userId, query }) {
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  });

  const where = { userId };

  // Truy vấn song song danh sách và tổng số lượng để tối ưu thời gian phản hồi.
  const [items, total] = await Promise.all([
    prisma.inAppNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.inAppNotification.count({ where }),
  ]);

  return {
    data: items,
    meta: buildMeta({ page, limit, total }),
  };
}

// Đánh dấu một thông báo đã đọc, chỉ cho phép owner thực hiện.
async function markNotificationAsRead({ notificationId, userId }) {
  const notification = await prisma.inAppNotification.findUnique({
    where: { id: notificationId },
    select: { id: true, userId: true },
  });

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId !== userId) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  return prisma.inAppNotification.update({
    where: { id: notification.id },
    data: { readAt: new Date() },
  });
}

module.exports = { listNotifications, markNotificationAsRead };
