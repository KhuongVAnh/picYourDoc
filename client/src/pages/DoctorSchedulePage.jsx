import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAppointmentsApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trả class badge trạng thái lịch khám trong trang schedule của bác sĩ.
function getStatusBadgeClass(status) {
  if (status === "CONFIRMED") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "REQUESTED") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "COMPLETED") {
    return "bg-sky-100 text-sky-700";
  }
  if (status === "CANCELLED") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-100 text-slate-700";
}

// Trang lịch làm việc bác sĩ để xem toàn bộ ca theo trạng thái.
export function DoctorSchedulePage() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  // Tải danh sách appointment của bác sĩ theo filter trạng thái.
  useEffect(() => {
    let ignore = false;

    async function loadAppointments() {
      try {
        const response = await getAppointmentsApi(
          {
            page: 1,
            limit: 30,
            status: status || undefined,
          },
          accessToken
        );
        if (!ignore) {
          setAppointments(response.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải lịch làm việc");
        }
      }
    }

    loadAppointments();
    return () => {
      ignore = true;
    };
  }, [accessToken, status]);

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Lịch làm việc</h2>
        <select className="input-base w-[220px]" onChange={(event) => setStatus(event.target.value)} value={status}>
          <option value="">Tất cả</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {appointments.length === 0 ? (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500">Không có lịch hẹn nào.</p>
        </article>
      ) : (
        <div className="grid gap-3">
          {appointments.map((item) => (
            <article className="surface-card p-4" key={item.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">Patient: {item.patientUserId}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-slate-700">
                {formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}
              </p>
              {item.status === "CONFIRMED" ? (
                <Link className="btn-primary mt-3 inline-flex px-3 py-2 text-sm" to={ROUTES.app.doctor.consult(item.id)}>
                  Vào phòng tư vấn
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
