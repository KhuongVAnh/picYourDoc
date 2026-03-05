import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctorDashboardApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trả style badge trạng thái lịch hẹn để bảng lịch dễ quét nhanh.
function getAppointmentStatusBadgeClass(status) {
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

// Trang tổng quan doctor theo bố cục data-first gần mẫu tham chiếu.
export function DoctorDashboardPage() {
  const { accessToken } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  // Tải dữ liệu dashboard bác sĩ để hiển thị KPI + bảng lịch hẹn.
  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const response = await getDoctorDashboardApi({}, accessToken);
        if (!ignore) {
          setDashboard(response.data);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải dashboard bác sĩ");
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  // Tính số lịch hẹn diễn ra trong ngày hiện tại cho card KPI.
  const todayAppointments = useMemo(() => {
    if (!dashboard?.upcomingAppointments) {
      return 0;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    return dashboard.upcomingAppointments.filter((item) => {
      return new Date(item.startAt).toISOString().slice(0, 10) === todayKey;
    }).length;
  }, [dashboard]);

  return (
    <section className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {dashboard ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Bệnh nhân</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{dashboard.summaryCards.totalAppointments}</p>
            </article>
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Tin nhắn chờ</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{dashboard.summaryCards.requestedAppointments}</p>
            </article>
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Lịch hẹn hôm nay</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{todayAppointments}</p>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <article className="surface-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Lịch Hẹn Sắp Tới</h3>
                <Link className="text-sm font-semibold text-brand-700 underline" to={ROUTES.app.doctor.schedule}>
                  Xem tất cả
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] table-auto border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-3 py-2 font-semibold">Bệnh nhân</th>
                      <th className="px-3 py-2 font-semibold">Thời gian</th>
                      <th className="px-3 py-2 font-semibold">Trạng thái</th>
                      <th className="px-3 py-2 font-semibold">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.upcomingAppointments.slice(0, 8).map((item) => (
                      <tr key={item.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 text-slate-900">{item.patientUserId}</td>
                        <td className="px-3 py-3 text-slate-700">{formatDateTime(item.startAt)}</td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getAppointmentStatusBadgeClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {item.status === "CONFIRMED" ? (
                            <Link className="btn-primary inline-flex px-3 py-1.5 text-xs" to={ROUTES.app.doctor.consult(item.id)}>
                              Bắt đầu tư vấn
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <div className="space-y-4">
              <article className="surface-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">SLA Snapshot</h3>
                <p className="mt-2 text-sm text-slate-700">
                  Avg response: <span className="font-semibold">{dashboard.slaMetrics.avgResponseMinutes ?? "-"} phút</span>
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  Within 15m: {dashboard.slaMetrics.within15mCount}/{dashboard.slaMetrics.totalMeasured}
                </p>
                <Link className="btn-soft mt-3 inline-flex px-4 py-2 text-sm" to={ROUTES.app.doctor.sla}>
                  Mở trang SLA
                </Link>
              </article>

              <article className="surface-card p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Follow-up</h3>
                {dashboard.followUpTasks.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-600">Không có task overdue trong 7 ngày tới.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    {dashboard.followUpTasks.slice(0, 4).map((task) => (
                      <li key={task.id} className="rounded-lg bg-slate-50 p-2">
                        <p className="font-semibold">{task.memberName}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(task.nextFollowUpAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link className="btn-soft mt-3 inline-flex px-4 py-2 text-sm" to={ROUTES.app.doctor.followUps}>
                  Xem follow-up
                </Link>
              </article>
            </div>
          </div>
        </>
      ) : (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-600">Đang tải dữ liệu dashboard...</p>
        </article>
      )}
    </section>
  );
}
