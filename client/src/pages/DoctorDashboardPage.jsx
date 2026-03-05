import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAppointmentsApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";

// Dashboard bác sĩ: hiển thị lịch hẹn và lối vào nhanh cho phòng tư vấn online.
export function DoctorDashboardPage() {
  const { accessToken, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải danh sách lịch hẹn của bác sĩ để chọn ca bắt đầu tư vấn.
  useEffect(() => {
    let ignore = false;

    async function loadAppointments() {
      if (!isAuthenticated || !accessToken) {
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await getAppointmentsApi({ page: 1, limit: 30 }, accessToken);
        if (!ignore) {
          setAppointments(response.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải lịch hẹn của bác sĩ");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadAppointments();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, accessToken]);

  // Tách nhóm lịch CONFIRMED để ưu tiên luồng bắt đầu phiên tư vấn.
  const confirmedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "CONFIRMED"),
    [appointments]
  );

  return (
    <article className="panel space-y-4">
      <header>
        <h2 className="mb-2 text-xl font-semibold text-slate-900">Doctor Dashboard</h2>
        <p className="text-slate-700">
          Danh sách lịch hẹn đã xác nhận để bắt đầu tư vấn trực tuyến.
        </p>
      </header>

      {isLoading ? <p className="meta-text">Đang tải lịch hẹn...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && confirmedAppointments.length === 0 ? (
        <p className="meta-text">Chưa có lịch hẹn CONFIRMED để mở phiên tư vấn.</p>
      ) : null}

      <div className="grid gap-3">
        {confirmedAppointments.map((appointment) => (
          <div key={appointment.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">
                Bệnh nhân: {appointment.patientUserId}
              </p>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {appointment.status}
              </span>
            </div>
            <p className="text-sm text-slate-700">
              Thời gian: {formatDateTime(appointment.startAt)} -{" "}
              {formatDateTime(appointment.endAt)}
            </p>
            <p className="text-sm text-slate-700">Lý do: {appointment.reason || "-"}</p>
            <Link className="app-link mt-3 inline-block" to={`/doctor/consults/${appointment.id}`}>
              Bắt đầu tư vấn
            </Link>
          </div>
        ))}
      </div>
    </article>
  );
}
