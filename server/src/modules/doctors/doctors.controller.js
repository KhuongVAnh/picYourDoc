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

module.exports = { listDoctors, getDoctorDetail };
