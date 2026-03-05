const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Tạo URL hoàn chỉnh cho API theo môi trường hiện tại.
function buildApiUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

// Gọi API chuẩn với hỗ trợ query/body/token và trả JSON.
async function apiRequest(path, options = {}) {
  const { method = "GET", query, body, accessToken, headers = {} } = options;

  const response = await fetch(buildApiUrl(path, query), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// API đăng ký user mới theo role.
function registerApi(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

// API đăng nhập user theo email/password.
function loginApi(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

// API lấy profile hiện tại sau khi đăng nhập.
function getMeApi(accessToken) {
  return apiRequest("/api/auth/me", { accessToken });
}

// API cập nhật profile cơ bản của user hiện tại.
function updateMyProfileApi(payload, accessToken) {
  return apiRequest("/api/auth/me/profile", {
    method: "PATCH",
    body: payload,
    accessToken,
  });
}

// API lấy danh sách bác sĩ công khai.
function getDoctorsApi(query) {
  return apiRequest("/api/doctors", { query });
}

// API lấy chi tiết bác sĩ (cần auth).
function getDoctorDetailApi(doctorId, accessToken) {
  return apiRequest(`/api/doctors/${doctorId}`, { accessToken });
}

// API lấy dashboard tổng hợp cho bác sĩ.
function getDoctorDashboardApi(query, accessToken) {
  return apiRequest("/api/doctors/dashboard", { query, accessToken });
}

// API lấy danh sách bệnh nhân doctor đang theo dõi.
function getDoctorPatientsApi(query, accessToken) {
  return apiRequest("/api/doctors/patients", { query, accessToken });
}

// API lấy overview hồ sơ bệnh nhân theo memberId.
function getDoctorPatientOverviewApi(memberId, accessToken) {
  return apiRequest(`/api/doctors/patients/${memberId}/overview`, { accessToken });
}

// API lấy báo cáo thu nhập bác sĩ theo tháng.
function getDoctorIncomeApi(query, accessToken) {
  return apiRequest("/api/doctors/income", { query, accessToken });
}

// API lấy danh sách lịch hẹn theo user hiện tại.
function getAppointmentsApi(query, accessToken) {
  return apiRequest("/api/appointments", { query, accessToken });
}

// API tạo lịch hẹn mới.
function createAppointmentApi(payload, accessToken) {
  return apiRequest("/api/appointments", {
    method: "POST",
    body: payload,
    accessToken,
  });
}

// API hủy lịch hẹn.
function cancelAppointmentApi(appointmentId, payload, accessToken) {
  return apiRequest(`/api/appointments/${appointmentId}/cancel`, {
    method: "PATCH",
    body: payload,
    accessToken,
  });
}

// API đổi lịch hẹn.
function rescheduleAppointmentApi(appointmentId, payload, accessToken) {
  return apiRequest(`/api/appointments/${appointmentId}/reschedule`, {
    method: "PATCH",
    body: payload,
    accessToken,
  });
}

// API lấy thông báo in-app của user.
function getNotificationsApi(query, accessToken) {
  return apiRequest("/api/notifications", { query, accessToken });
}

// API đánh dấu thông báo đã đọc.
function markNotificationReadApi(notificationId, accessToken) {
  return apiRequest(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    accessToken,
  });
}

// API doctor bắt đầu hoặc lấy lại consult session từ một appointment CONFIRMED.
function startConsultSessionApi(appointmentId, accessToken) {
  return apiRequest(`/api/consults/appointments/${appointmentId}/start`, {
    method: "POST",
    accessToken,
  });
}

// API lấy consult session hiện tại theo appointment cho patient/doctor/admin.
function getConsultSessionByAppointmentApi(appointmentId, accessToken) {
  return apiRequest(`/api/consults/appointments/${appointmentId}/session`, {
    accessToken,
  });
}

// API lấy lịch sử chat của một consult session có phân trang.
function getConsultMessagesApi(sessionId, query, accessToken) {
  return apiRequest(`/api/consults/sessions/${sessionId}/messages`, {
    query,
    accessToken,
  });
}

// API doctor kết thúc một consult session đang ACTIVE.
function endConsultSessionApi(sessionId, accessToken) {
  return apiRequest(`/api/consults/sessions/${sessionId}/end`, {
    method: "PATCH",
    accessToken,
  });
}

// API lấy family profile của patient hiện tại.
function getFamilyApi(accessToken) {
  return apiRequest("/api/records/family", { accessToken });
}

// API tạo/cập nhật family profile.
function upsertFamilyApi(payload, accessToken) {
  return apiRequest("/api/records/family", {
    method: "POST",
    body: payload,
    accessToken,
  });
}

// API thêm member mới vào family.
function createFamilyMemberApi(payload, accessToken) {
  return apiRequest("/api/records/family/members", {
    method: "POST",
    body: payload,
    accessToken,
  });
}

// API cập nhật member hiện có.
function updateFamilyMemberApi(memberId, payload, accessToken) {
  return apiRequest(`/api/records/family/members/${memberId}`, {
    method: "PATCH",
    body: payload,
    accessToken,
  });
}

// API xóa member khỏi family.
function deleteFamilyMemberApi(memberId, accessToken) {
  return apiRequest(`/api/records/family/members/${memberId}`, {
    method: "DELETE",
    accessToken,
  });
}

// API lấy health profile của member.
function getHealthProfileApi(memberId, accessToken) {
  return apiRequest(`/api/records/members/${memberId}/health-profile`, {
    accessToken,
  });
}

// API cập nhật health profile của member.
function upsertHealthProfileApi(memberId, payload, accessToken) {
  return apiRequest(`/api/records/members/${memberId}/health-profile`, {
    method: "PUT",
    body: payload,
    accessToken,
  });
}

// API lấy timeline entries của member.
function getMemberTimelineApi(memberId, query, accessToken) {
  return apiRequest(`/api/records/members/${memberId}/timeline`, {
    query,
    accessToken,
  });
}

// API tạo timeline note thủ công (doctor/admin).
function createTimelineNoteApi(memberId, payload, accessToken) {
  return apiRequest(`/api/records/members/${memberId}/timeline`, {
    method: "POST",
    body: payload,
    accessToken,
  });
}

// API lấy care plan của member.
function getCarePlanApi(memberId, accessToken) {
  return apiRequest(`/api/records/members/${memberId}/care-plan`, {
    accessToken,
  });
}

// API cập nhật care plan của member (doctor).
function upsertCarePlanApi(memberId, payload, accessToken) {
  return apiRequest(`/api/records/members/${memberId}/care-plan`, {
    method: "PUT",
    body: payload,
    accessToken,
  });
}

// API lấy danh sách gói subscription.
function getSubscriptionPlansApi(accessToken) {
  return apiRequest("/api/subscriptions/plans", { accessToken });
}

// API lấy gói hiện tại của user.
function getMySubscriptionApi(query, accessToken) {
  return apiRequest("/api/subscriptions/me", { query, accessToken });
}

// API checkout mock success/fail.
function checkoutMockApi(payload, accessToken) {
  return apiRequest("/api/subscriptions/checkout/mock", {
    method: "POST",
    body: payload,
    accessToken,
  });
}

// API lấy lịch sử transaction subscription.
function getSubscriptionTransactionsApi(query, accessToken) {
  return apiRequest("/api/subscriptions/transactions", {
    query,
    accessToken,
  });
}

// API lấy usage quota theo tháng.
function getSubscriptionUsageApi(query, accessToken) {
  return apiRequest("/api/subscriptions/usage", {
    query,
    accessToken,
  });
}

// API hủy subscription active hiện tại.
function cancelSubscriptionApi(accessToken) {
  return apiRequest("/api/subscriptions/cancel", {
    method: "POST",
    accessToken,
  });
}

export {
  API_BASE_URL,
  apiRequest,
  registerApi,
  loginApi,
  getMeApi,
  updateMyProfileApi,
  getDoctorsApi,
  getDoctorDetailApi,
  getDoctorDashboardApi,
  getDoctorPatientsApi,
  getDoctorPatientOverviewApi,
  getDoctorIncomeApi,
  getAppointmentsApi,
  createAppointmentApi,
  cancelAppointmentApi,
  rescheduleAppointmentApi,
  getNotificationsApi,
  markNotificationReadApi,
  startConsultSessionApi,
  getConsultSessionByAppointmentApi,
  getConsultMessagesApi,
  endConsultSessionApi,
  getFamilyApi,
  upsertFamilyApi,
  createFamilyMemberApi,
  updateFamilyMemberApi,
  deleteFamilyMemberApi,
  getHealthProfileApi,
  upsertHealthProfileApi,
  getMemberTimelineApi,
  createTimelineNoteApi,
  getCarePlanApi,
  upsertCarePlanApi,
  getSubscriptionPlansApi,
  getMySubscriptionApi,
  checkoutMockApi,
  getSubscriptionTransactionsApi,
  getSubscriptionUsageApi,
  cancelSubscriptionApi,
};
