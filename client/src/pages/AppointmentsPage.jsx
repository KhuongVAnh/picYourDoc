import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  cancelAppointmentApi,
  getAppointmentsApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime, getHoursUntil } from "../lib/date";

// Trang lịch hẹn của bệnh nhân, hỗ trợ hủy và chuyển sang luồng đổi lịch.
export function AppointmentsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải danh sách lịch hẹn theo bộ lọc trạng thái.
  useEffect(() => {
    let ignore = false;

    async function loadAppointments() {
      if (!isAuthenticated || !accessToken) {
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await getAppointmentsApi(
          { page: 1, limit: 20, status: status || undefined },
          accessToken
        );
        if (!ignore) {
          setAppointments(response.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải lịch hẹn");
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
  }, [status, accessToken, isAuthenticated]);

  // Tính lịch còn cho phép hủy/đổi theo rule >6 giờ.
  const enrichedAppointments = useMemo(
    () =>
      appointments.map((item) => ({
        ...item,
        canPatientUpdate:
          ["REQUESTED", "CONFIRMED"].includes(item.status) && getHoursUntil(item.startAt) > 6,
      })),
    [appointments]
  );

  // Hủy lịch hẹn và refresh danh sách tại chỗ.
  async function handleCancelAppointment(appointmentId) {
    try {
      await cancelAppointmentApi(
        appointmentId,
        { reason: "Bệnh nhân hủy lịch qua ứng dụng" },
        accessToken
      );
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId ? { ...item, status: "CANCELLED" } : item
        )
      );
    } catch (apiError) {
      setError(apiError.message || "Không thể hủy lịch");
    }
  }

  // Điều hướng đến trang đổi lịch với context lịch gốc.
  function handleGoReschedule(appointment) {
    const search = new URLSearchParams({
      doctorId: appointment.doctorId,
      rescheduleOf: appointment.id,
    });
    navigate(`/patient/appointments/new?${search.toString()}`);
  }

  return (
    <article className="panel space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Lịch hẹn của tôi</h2>
        <Link className="app-link" to="/patient/appointments/new">
          Tạo lịch hẹn mới
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="statusFilter">
          Trạng thái:
        </label>
        <select
          id="statusFilter"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="RESCHEDULED">RESCHEDULED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {isLoading ? <p className="meta-text">Đang tải lịch hẹn...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && enrichedAppointments.length === 0 ? (
        <p className="meta-text">Chưa có lịch hẹn nào.</p>
      ) : null}

      <div className="grid gap-3">
        {enrichedAppointments.map((appointment) => (
          <div key={appointment.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{appointment.doctor?.fullName}</p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {appointment.status}
              </span>
            </div>

            <p className="text-sm text-slate-700">
              Thời gian: {formatDateTime(appointment.startAt)} -{" "}
              {formatDateTime(appointment.endAt)}
            </p>
            <p className="text-sm text-slate-700">
              Nguồn tạo lịch: {appointment.sourceType}
              {appointment.conflictFlag ? " (Có xung đột cần xác nhận)" : ""}
            </p>
            <p className="text-sm text-slate-700">Lý do: {appointment.reason || "-"}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="app-link"
                type="button"
                disabled={!appointment.canPatientUpdate}
                onClick={() => handleCancelAppointment(appointment.id)}
              >
                Hủy lịch
              </button>
              <button
                className="app-link"
                type="button"
                disabled={!appointment.canPatientUpdate}
                onClick={() => handleGoReschedule(appointment)}
              >
                Đổi lịch
              </button>
            </div>

            {!appointment.canPatientUpdate &&
            ["REQUESTED", "CONFIRMED"].includes(appointment.status) ? (
              <p className="mt-2 text-xs text-red-600">
                Bạn chỉ được hủy/đổi lịch khi còn hơn 6 giờ trước thời gian hẹn.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}
