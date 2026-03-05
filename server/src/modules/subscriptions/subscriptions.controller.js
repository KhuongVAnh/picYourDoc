const subscriptionsService = require("./subscriptions.service");

// Xử lý API lấy danh sách plans đang active cho toàn bộ role đã đăng nhập.
async function listPlans(req, res, next) {
  try {
    const result = await subscriptionsService.listPlans();
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy subscription hiện tại của user đăng nhập.
async function getMySubscription(req, res, next) {
  try {
    const result = await subscriptionsService.getMySubscription(
      req.user.userId,
      req.query
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API checkout mock success/fail để tạo transaction log và subscription.
async function checkoutMock(req, res, next) {
  try {
    const result = await subscriptionsService.checkoutMock({
      userId: req.user.userId,
      payload: req.body,
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API xem lịch sử transaction có phân trang.
async function listTransactions(req, res, next) {
  try {
    const result = await subscriptionsService.listTransactions({
      userId: req.user.userId,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy usage quota theo tháng.
async function getUsage(req, res, next) {
  try {
    const result = await subscriptionsService.getUsage({
      userId: req.user.userId,
      month: req.query.month,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API hủy subscription active hiện tại.
async function cancelSubscription(req, res, next) {
  try {
    const result = await subscriptionsService.cancelSubscription(req.user.userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPlans,
  getMySubscription,
  checkoutMock,
  listTransactions,
  getUsage,
  cancelSubscription,
};
