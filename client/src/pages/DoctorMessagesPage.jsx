import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang tin nhắn doctor cho MVP: nhấn mạnh luồng chat/video theo lịch khám đã xác nhận.
export function DoctorMessagesPage() {
  return (
    <section className="space-y-4">
      <header className="surface-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Tin nhắn bác sĩ</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tin nhắn realtime được đồng bộ theo từng phiên tư vấn trong Consult Room.
        </p>
      </header>
      <article className="surface-card p-5">
        <p className="text-sm text-slate-600">
          Bạn có thể mở phòng tư vấn trực tiếp từ lịch khám ở trạng thái CONFIRMED.
        </p>
        <Link className="btn-primary mt-4 inline-flex px-4 py-2 text-sm" to={ROUTES.app.doctor.schedule}>
          Mở lịch khám
        </Link>
      </article>
    </section>
  );
}
