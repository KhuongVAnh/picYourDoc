import { Link } from "react-router-dom";

// Trang tổng quan patient với shortcut vào các luồng Phase 2.
export function PatientDashboardPage() {
  return (
    <article className="panel space-y-3">
      <h2 className="mb-2 text-xl font-semibold text-slate-900">Patient Dashboard</h2>
      <p className="text-slate-700">
        Chọn luồng cần thao tác để bắt đầu với tính năng Phase 2.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link className="app-link" to="/patient/doctors">
          Tìm bác sĩ
        </Link>
        <Link className="app-link" to="/patient/appointments">
          Lịch hẹn của tôi
        </Link>
        <Link className="app-link" to="/patient/appointments/new">
          Tạo lịch hẹn
        </Link>
      </div>
    </article>
  );
}
