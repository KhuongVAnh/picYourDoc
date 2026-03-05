import { Link } from "react-router-dom";

// Trang chủ public, điều hướng nhanh tới luồng khám bác sĩ.
export function HomePage() {
  return (
    <article className="panel space-y-3">
      <h2 className="mb-2 text-xl font-semibold text-slate-900">
        Foundation Phase đã sẵn sàng
      </h2>
      <p className="text-slate-700">
        Bạn có thể bắt đầu tìm kiếm bác sĩ ngay từ trang công khai hoặc đăng nhập
        để xem chi tiết và đặt lịch.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link className="app-link" to="/doctors">
          Xem danh sách bác sĩ
        </Link>
        <Link className="app-link" to="/login">
          Đăng nhập
        </Link>
      </div>
    </article>
  );
}
