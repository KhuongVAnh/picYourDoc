const recordsService = require("./records.service");

// Xử lý API lấy family profile của user hiện tại.
async function getFamily(req, res, next) {
  try {
    const result = await recordsService.getFamily(req.user);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API tạo hoặc cập nhật family profile.
async function createFamily(req, res, next) {
  try {
    const result = await recordsService.createFamily(req.user, req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API thêm member mới vào family.
async function createFamilyMember(req, res, next) {
  try {
    const result = await recordsService.createFamilyMember(req.user, req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API cập nhật member hiện có.
async function updateFamilyMember(req, res, next) {
  try {
    const result = await recordsService.updateFamilyMember(
      req.user,
      req.params.memberId,
      req.body
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API xóa member khỏi family hiện tại.
async function deleteFamilyMember(req, res, next) {
  try {
    const result = await recordsService.deleteFamilyMember(req.user, req.params.memberId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy health profile của member.
async function getHealthProfile(req, res, next) {
  try {
    const result = await recordsService.getHealthProfile(req.user, req.params.memberId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API upsert health profile của member.
async function upsertHealthProfile(req, res, next) {
  try {
    const result = await recordsService.upsertHealthProfile(
      req.user,
      req.params.memberId,
      req.body
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy timeline entries có phân trang.
async function getTimelineEntries(req, res, next) {
  try {
    const result = await recordsService.getTimelineEntries(
      req.user,
      req.params.memberId,
      req.query
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API doctor/admin tạo timeline note thủ công.
async function createTimelineNote(req, res, next) {
  try {
    const result = await recordsService.createTimelineNote(
      req.user,
      req.params.memberId,
      req.body
    );
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API lấy care plan của member.
async function getCarePlan(req, res, next) {
  try {
    const result = await recordsService.getCarePlan(req.user, req.params.memberId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

// Xử lý API doctor cập nhật care plan của member.
async function upsertCarePlan(req, res, next) {
  try {
    const result = await recordsService.upsertCarePlan(
      req.user,
      req.params.memberId,
      req.body
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getFamily,
  createFamily,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getHealthProfile,
  upsertHealthProfile,
  getTimelineEntries,
  createTimelineNote,
  getCarePlan,
  upsertCarePlan,
};
