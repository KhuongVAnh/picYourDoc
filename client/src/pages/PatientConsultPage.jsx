import { Link, useParams } from "react-router-dom";
import { ConsultRoom } from "../components/ConsultRoom";
import { useAuth } from "../auth/useAuth";

// Trang tư vấn dành cho bệnh nhân, chờ bác sĩ mở phiên rồi mới tham gia.
export function PatientConsultPage() {
  const { appointmentId } = useParams();
  const { accessToken } = useAuth();

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Patient Consult Room</h1>
        <Link className="app-link" to="/patient/appointments">
          Quay lại lịch hẹn
        </Link>
      </header>
      <ConsultRoom mode="patient" appointmentId={appointmentId || ""} accessToken={accessToken} />
    </section>
  );
}
