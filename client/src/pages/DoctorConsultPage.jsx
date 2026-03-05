import { Link, useParams } from "react-router-dom";
import { ConsultRoom } from "../components/ConsultRoom";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../lib/routes";

// Trang tư vấn dành cho bác sĩ, tự mở phiên khi vào room.
export function DoctorConsultPage() {
  const { appointmentId } = useParams();
  const { accessToken } = useAuth();

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h1 className="text-2xl font-semibold text-slate-900">Doctor Consult Room</h1>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.doctor.overview}>
          Quay lại dashboard bác sĩ
        </Link>
      </header>
      <ConsultRoom accessToken={accessToken} appointmentId={appointmentId || ""} mode="doctor" />
    </section>
  );
}
