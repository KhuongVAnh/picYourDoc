const doctorsService = require("./doctors.service");

// Xử lý API danh sách bác sĩ public.
async function listDoctors(req, res, next) {
  try {
    const result = await doctorsService.listDoctors(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API chi tiết bác sĩ yêu cầu đăng nhập.
async function getDoctorDetail(req, res, next) {
  try {
    const result = await doctorsService.getDoctorDetailById(req.params.doctorId);
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}

// Xử lý API dashboard tổng hợp cho bác sĩ.
async function getDoctorDashboard(req, res, next) {
  try {
    const result = await doctorsService.getDoctorDashboard({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API dashboard v2 với 3 vùng quản trị dành cho bác sĩ.
async function getDoctorDashboardV2(req, res, next) {
  try {
    const result = await doctorsService.getDoctorDashboardV2({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API danh sách bệnh nhân bác sĩ đang theo dõi.
async function listDoctorPatients(req, res, next) {
  try {
    const result = await doctorsService.listDoctorPatients({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API overview hồ sơ bệnh nhân cho bác sĩ.
async function getDoctorPatientOverview(req, res, next) {
  try {
    const result = await doctorsService.getDoctorPatientOverview({
      user: req.user,
      memberId: req.params.memberId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API báo cáo thu nhập bác sĩ theo tháng.
async function getDoctorIncome(req, res, next) {
  try {
    const result = await doctorsService.getDoctorIncome({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listDoctors,
  getDoctorDetail,
  getDoctorDashboard,
  getDoctorDashboardV2,
  listDoctorPatients,
  getDoctorPatientOverview,
  getDoctorIncome,
};
