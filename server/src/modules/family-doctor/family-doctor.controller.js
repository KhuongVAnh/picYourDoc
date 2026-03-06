const familyDoctorService = require("./family-doctor.service");

// Xử lý API trả thông tin thanh toán thủ công cho luồng thuê bác sĩ gia đình.
async function getFamilyDoctorPaymentConfig(req, res, next) {
  try {
    const result = await familyDoctorService.getFamilyDoctorPaymentConfig({
      user: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API marketplace bác sĩ gia đình dành cho patient.
async function listMarketplace(req, res, next) {
  try {
    const result = await familyDoctorService.listMarketplace({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API tạo yêu cầu gán bác sĩ gia đình.
async function createFamilyDoctorRequest(req, res, next) {
  try {
    const result = await familyDoctorService.createFamilyDoctorRequest({
      user: req.user,
      payload: req.body,
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API danh sách yêu cầu bác sĩ gia đình của patient.
async function listMyFamilyDoctorRequests(req, res, next) {
  try {
    const result = await familyDoctorService.listMyFamilyDoctorRequests({
      user: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API danh sách request incoming của bác sĩ.
async function listIncomingFamilyDoctorRequests(req, res, next) {
  try {
    const result = await familyDoctorService.listIncomingFamilyDoctorRequests({
      user: req.user,
      query: req.query,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API cập nhật trạng thái intake OPEN/PAUSED của bác sĩ.
async function updateDoctorIntakeStatus(req, res, next) {
  try {
    const result = await familyDoctorService.updateDoctorIntakeStatus({
      user: req.user,
      payload: req.body,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API bác sĩ phản hồi request approve/reject.
async function respondFamilyDoctorRequest(req, res, next) {
  try {
    const result = await familyDoctorService.respondFamilyDoctorRequest({
      user: req.user,
      requestId: req.params.requestId,
      payload: req.body,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy hợp đồng bác sĩ gia đình hiện tại của patient.
async function getMyFamilyDoctorContract(req, res, next) {
  try {
    const result = await familyDoctorService.getMyFamilyDoctorContract({
      user: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getFamilyDoctorPaymentConfig,
  listMarketplace,
  createFamilyDoctorRequest,
  listMyFamilyDoctorRequests,
  listIncomingFamilyDoctorRequests,
  updateDoctorIntakeStatus,
  respondFamilyDoctorRequest,
  getMyFamilyDoctorContract,
};
