const consultsService = require("./consults.service");
const { emitConsultSessionEnded } = require("../../realtime/socket");

// Xử lý API doctor bắt đầu (hoặc lấy lại) phiên tư vấn theo appointment.
async function startConsultSession(req, res, next) {
  try {
    const data = await consultsService.startConsultSession({
      appointmentId: req.params.appointmentId,
      user: req.user,
    });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy consult session theo appointment cho patient/doctor/admin.
async function getConsultSessionByAppointment(req, res, next) {
  try {
    const data = await consultsService.getConsultSessionByAppointment({
      appointmentId: req.params.appointmentId,
      user: req.user,
    });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy lịch sử chat theo consult session có phân trang.
async function getConsultMessages(req, res, next) {
  try {
    const result = await consultsService.getConsultMessages({
      sessionId: req.params.sessionId,
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API doctor kết thúc phiên tư vấn và broadcast realtime.
async function endConsultSession(req, res, next) {
  try {
    const data = await consultsService.endConsultSession({
      sessionId: req.params.sessionId,
      user: req.user,
    });

    // Phát sự kiện realtime để các client trong room đồng bộ trạng thái phiên.
    emitConsultSessionEnded(data);
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  startConsultSession,
  getConsultSessionByAppointment,
  getConsultMessages,
  endConsultSession,
};
