import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang cài đặt doctor cho MVP, tập trung các cấu hình ưu tiên truy cập nhanh.
export function DoctorSettingsPage() {
  return (
    <section className="space-y-4">
      <header className="surface-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Cài đặt</h2>
        <p className="mt-1 text-sm text-slate-600">
          Quản lý thông tin tài khoản và khu vực làm việc của bác sĩ.
        </p>
      </header>

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Tài khoản</h3>
        <p className="mt-1 text-sm text-slate-600">
          Cập nhật thông tin cá nhân và ảnh đại diện bác sĩ.
        </p>
        <Link className="btn-primary mt-4 inline-flex px-4 py-2 text-sm" to={ROUTES.app.doctor.profile}>
          Mở hồ sơ bác sĩ
        </Link>
      </article>
    </section>
  );
}
