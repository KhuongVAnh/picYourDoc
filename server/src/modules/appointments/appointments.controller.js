const appointmentsService = require("./appointments.service");

// Xử lý API tạo lịch hẹn mới cho bệnh nhân.
async function createAppointment(req, res, next) {
  try {
    const data = await appointmentsService.createAppointment({
      user: req.user,
      payload: req.body,
    });
    return res.status(201).json({ data });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy danh sách lịch hẹn theo vai trò.
async function listAppointments(req, res, next) {
  try {
    const result = await appointmentsService.listAppointments({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API xác nhận lịch hẹn bởi bác sĩ.
async function confirmAppointment(req, res, next) {
  try {
    const data = await appointmentsService.confirmAppointment({
      appointmentId: req.params.id,
      user: req.user,
    });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API từ chối lịch hẹn bởi bác sĩ.
async function rejectAppointment(req, res, next) {
  try {
    const data = await appointmentsService.rejectAppointment({
      appointmentId: req.params.id,
      user: req.user,
      reason: req.body.reason,
    });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API hủy lịch hẹn.
async function cancelAppointment(req, res, next) {
  try {
    const data = await appointmentsService.cancelAppointment({
      appointmentId: req.params.id,
      user: req.user,
      reason: req.body.reason,
    });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API đổi lịch hẹn.
async function rescheduleAppointment(req, res, next) {
  try {
    const data = await appointmentsService.rescheduleAppointment({
      appointmentId: req.params.id,
      user: req.user,
      payload: req.body,
    });
    return res.status(200).json({ data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAppointment,
  listAppointments,
  confirmAppointment,
  rejectAppointment,
  cancelAppointment,
  rescheduleAppointment,
};
