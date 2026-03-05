import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang tin nhắn patient cho MVP: điều hướng nhanh đến luồng tư vấn theo lịch hẹn.
export function PatientMessagesPage() {
  return (
    <section className="space-y-4">
      <header className="surface-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Tin nhắn</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tin nhắn realtime hoạt động theo từng phiên tư vấn. Bạn có thể vào từ trang lịch hẹn.
        </p>
      </header>

      <article className="surface-card p-5">
        <p className="text-sm text-slate-600">
          Để bắt đầu trao đổi với bác sĩ, vui lòng chọn lịch hẹn đã được xác nhận và vào phòng tư vấn.
        </p>
        <Link className="btn-primary mt-4 inline-flex px-4 py-2 text-sm" to={ROUTES.app.patient.appointments}>
          Mở lịch hẹn của tôi
        </Link>
      </article>
    </section>
  );
}
