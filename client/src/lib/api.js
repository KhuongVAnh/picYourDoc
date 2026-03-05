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
  const {
    method = "GET",
    query,
    body,
    accessToken,
    headers = {},
  } = options;

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

// API đăng nhập user theo email/password.
function loginApi(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: payload,
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

export {
  API_BASE_URL,
  apiRequest,
  loginApi,
  getDoctorsApi,
  getDoctorDetailApi,
  getAppointmentsApi,
  createAppointmentApi,
  cancelAppointmentApi,
  rescheduleAppointmentApi,
  getNotificationsApi,
  markNotificationReadApi,
};
