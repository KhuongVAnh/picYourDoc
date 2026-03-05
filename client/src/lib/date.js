// Định dạng ngày giờ ISO sang chuỗi dễ đọc theo locale Việt Nam.
function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("vi-VN");
}

// Tính số giờ còn lại đến lịch hẹn để áp dụng rule hủy/đổi lịch.
function getHoursUntil(value) {
  const date = new Date(value);
  const now = new Date();
  return (date.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export { formatDateTime, getHoursUntil };
