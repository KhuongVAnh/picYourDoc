import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  cancelAppointmentApi,
  getAppointmentsApi,
  getSharedRecordsForAppointmentApi,
  revokeSharedRecordForAppointmentApi,
  shareRecordsForAppointmentApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime, getHoursUntil } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trả class badge trạng thái lịch hẹn để UI dễ đọc theo mức ưu tiên.
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
  if (status === "CANCELLED" || status === "REJECTED") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-slate-100 text-slate-700";
}

// Trang lịch hẹn của bệnh nhân, hỗ trợ hủy/đổi lịch và vào phòng tư vấn online.
export function AppointmentsPage() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sharingAppointmentId, setSharingAppointmentId] = useState("");
  const [timelineEntryIdsInput, setTimelineEntryIdsInput] = useState("");
  const [sharedRecords, setSharedRecords] = useState([]);
  const [error, setError] = useState("");

  // Tải danh sách lịch hẹn theo bộ lọc trạng thái hiện tại.
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

  // Tính cờ cho phép bệnh nhân hủy/đổi lịch theo rule lớn hơn 6 giờ.
  const enrichedAppointments = useMemo(
    () =>
      appointments.map((item) => ({
        ...item,
        canPatientUpdate:
          ["REQUESTED", "CONFIRMED"].includes(item.status) && getHoursUntil(item.startAt) > 6,
      })),
    [appointments]
  );

  // Gọi API hủy lịch hẹn và cập nhật trạng thái tại danh sách hiện tại.
  async function handleCancelAppointment(appointmentId) {
    try {
      await cancelAppointmentApi(
        appointmentId,
        { reason: "Bệnh nhân hủy lịch qua ứng dụng" },
        accessToken
      );

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointmentId ? { ...item, status: "CANCELLED" } : item
        )
      );
    } catch (apiError) {
      setError(apiError.message || "Không thể hủy lịch");
    }
  }

  // Chuyển sang màn hình đổi lịch và truyền context lịch gốc qua query string.
  function handleGoReschedule(appointment) {
    const search = new URLSearchParams({
      doctorId: appointment.doctorId,
      rescheduleOf: appointment.id,
    });
    navigate(`${ROUTES.app.patient.appointmentNew}?${search.toString()}`);
  }

  // Parse chuỗi ID timeline thành mảng để gửi API share record.
  function parseTimelineEntryIds(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  // Mở panel chia sẻ hồ sơ cho một appointment và tải dữ liệu đã share.
  async function handleOpenSharePanel(appointmentId) {
    try {
      setError("");
      setSharingAppointmentId(appointmentId);
      setTimelineEntryIdsInput("");
      const response = await getSharedRecordsForAppointmentApi(appointmentId, accessToken);
      setSharedRecords(response.data || []);
    } catch (apiError) {
      setError(apiError.message || "Không thể tải danh sách hồ sơ đã chia sẻ.");
    }
  }

  // Gửi yêu cầu chia sẻ hồ sơ tạm cho appointment one-time.
  async function handleShareRecords() {
    if (!sharingAppointmentId) {
      return;
    }
    const timelineEntryIds = parseTimelineEntryIds(timelineEntryIdsInput);
    if (timelineEntryIds.length === 0) {
      setError("Vui lòng nhập ít nhất một timelineEntryId để chia sẻ.");
      return;
    }

    try {
      setError("");
      const response = await shareRecordsForAppointmentApi(
        sharingAppointmentId,
        {
          timelineEntryIds,
          scope: "TEMPORARY",
        },
        accessToken
      );
      setSharedRecords(response.data || []);
      setTimelineEntryIdsInput("");
    } catch (apiError) {
      setError(apiError.message || "Không thể chia sẻ hồ sơ.");
    }
  }

  // Thu hồi một hồ sơ đã chia sẻ cho appointment.
  async function handleRevokeSharedRecord(linkId) {
    if (!sharingAppointmentId) {
      return;
    }
    try {
      setError("");
      await revokeSharedRecordForAppointmentApi(sharingAppointmentId, linkId, accessToken);
      const response = await getSharedRecordsForAppointmentApi(sharingAppointmentId, accessToken);
      setSharedRecords(response.data || []);
    } catch (apiError) {
      setError(apiError.message || "Không thể thu hồi hồ sơ đã chia sẻ.");
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Lịch hẹn của tôi</h2>
        <Link className="btn-primary px-4 py-2 text-sm" to={ROUTES.app.patient.appointmentNew}>
          Tạo lịch hẹn mới
        </Link>
      </header>

      <article className="surface-card flex flex-wrap items-center gap-2 p-4">
        <label className="text-sm font-medium text-slate-700" htmlFor="statusFilter">
          Trạng thái:
        </label>
        <select
          className="input-base w-[220px]"
          id="statusFilter"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="">Tất cả</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="RESCHEDULED">RESCHEDULED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </article>

      {isLoading ? <p className="text-sm text-slate-600">Đang tải lịch hẹn...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && enrichedAppointments.length === 0 ? (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500">Chưa có lịch hẹn nào.</p>
        </article>
      ) : null}

      <div className="grid gap-3">
        {enrichedAppointments.map((appointment) => (
          <article className="surface-card p-4" key={appointment.id}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{appointment.doctor?.fullName || "Bác sĩ"}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(appointment.status)}`}>
                {appointment.status}
              </span>
            </div>

            <p className="text-sm text-slate-700">
              Thời gian: {formatDateTime(appointment.startAt)} - {formatDateTime(appointment.endAt)}
            </p>
            <p className="text-sm text-slate-700">
              Nguồn tạo lịch: {appointment.sourceType}
              {appointment.conflictFlag ? " (Có xung đột cần xác nhận)" : ""}
            </p>
            <p className="text-sm text-slate-700">Lý do: {appointment.reason || "-"}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="btn-soft px-3 py-2 text-sm"
                disabled={!appointment.canPatientUpdate}
                onClick={() => handleCancelAppointment(appointment.id)}
                type="button"
              >
                Hủy lịch
              </button>
              <button
                className="btn-soft px-3 py-2 text-sm"
                disabled={!appointment.canPatientUpdate}
                onClick={() => handleGoReschedule(appointment)}
                type="button"
              >
                Đổi lịch
              </button>
              {appointment.status === "CONFIRMED" ? (
                <Link className="btn-primary px-3 py-2 text-sm" to={ROUTES.app.patient.consult(appointment.id)}>
                  Vào phòng tư vấn
                </Link>
              ) : null}
              <button
                className="btn-soft px-3 py-2 text-sm"
                onClick={() => handleOpenSharePanel(appointment.id)}
                type="button"
              >
                Chia sẻ hồ sơ
              </button>
            </div>

            {!appointment.canPatientUpdate && ["REQUESTED", "CONFIRMED"].includes(appointment.status) ? (
              <p className="mt-2 text-xs text-red-600">
                Bạn chỉ được hủy/đổi lịch khi còn hơn 6 giờ trước thời gian hẹn.
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {sharingAppointmentId ? (
        <article className="surface-card p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Chia sẻ hồ sơ cho lịch hẹn</h3>
            <button
              className="btn-soft px-3 py-1.5 text-xs"
              onClick={() => {
                setSharingAppointmentId("");
                setTimelineEntryIdsInput("");
                setSharedRecords([]);
              }}
              type="button"
            >
              Đóng
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Nhập danh sách `timelineEntryId` phân tách bằng dấu phẩy để chia sẻ tạm thời cho lịch hẹn này.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              className="input-base min-w-[320px] flex-1"
              onChange={(event) => setTimelineEntryIdsInput(event.target.value)}
              placeholder="Ví dụ: cmabc123,cmxyz456"
              value={timelineEntryIdsInput}
            />
            <button className="btn-primary px-4 py-2 text-sm" onClick={handleShareRecords} type="button">
              Chia sẻ
            </button>
          </div>

          {sharedRecords.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {sharedRecords.map((row) => (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={row.id}>
                  <p className="text-sm font-semibold text-slate-900">
                    {row.timelineEntry?.title || "Timeline entry"}
                  </p>
                  <p className="text-xs text-slate-600">
                    Scope: {row.scope} • Hết hạn: {row.expiresAt ? formatDateTime(row.expiresAt) : "Không đặt"}
                  </p>
                  <button
                    className="btn-soft mt-2 px-3 py-1 text-xs"
                    onClick={() => handleRevokeSharedRecord(row.id)}
                    type="button"
                  >
                    Thu hồi
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Chưa có hồ sơ nào được chia sẻ.</p>
          )}
        </article>
      ) : null}
    </section>
  );
}
