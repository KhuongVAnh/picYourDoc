import { Link, useParams } from "react-router-dom";
import { ConsultRoom } from "../components/ConsultRoom";
import { useAuth } from "../auth/useAuth";

// Trang tư vấn dành cho bác sĩ, tự mở phiên khi vào room.
export function DoctorConsultPage() {
  const { appointmentId } = useParams();
  const { accessToken } = useAuth();

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Doctor Consult Room</h1>
        <Link className="app-link" to="/doctor">
          Quay lại dashboard bác sĩ
        </Link>
      </header>
      <ConsultRoom mode="doctor" appointmentId={appointmentId || ""} accessToken={accessToken} />
    </section>
  );
}
