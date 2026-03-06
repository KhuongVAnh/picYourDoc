import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctorDashboardV2Api } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trang dashboard v2 cho bác sĩ với 3 vùng quản trị theo loại dịch vụ.
export function DoctorDashboardPage() {
  const { accessToken } = useAuth();
  const [range, setRange] = useState("week");
  const [serviceType, setServiceType] = useState("all");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  // Tải dashboard v2 theo bộ lọc hiện tại.
  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const response = await getDoctorDashboardV2Api(
          {
            range,
            serviceType,
            status: status || undefined,
            tag: tag || undefined,
          },
          accessToken
        );
        if (!ignore) {
          setDashboard(response.data);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải dashboard v2");
        }
      }
    }

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [accessToken, range, serviceType, status, tag]);

  return (
    <section className="space-y-4">
      <header className="surface-card p-4">
        <h2 className="text-xl font-semibold text-slate-900">Doctor Dashboard V2</h2>
        <p className="mt-1 text-sm text-slate-600">
          Quản trị theo dõi theo thời gian, bệnh nhân dài hạn và khám một lần.
        </p>

        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <select className="input-base" onChange={(event) => setRange(event.target.value)} value={range}>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
          <select className="input-base" onChange={(event) => setServiceType(event.target.value)} value={serviceType}>
            <option value="all">Tất cả dịch vụ</option>
            <option value="family">Bác sĩ gia đình</option>
            <option value="one-time">Khám một lần</option>
          </select>
          <input className="input-base" onChange={(event) => setStatus(event.target.value)} placeholder="Lọc status" value={status} />
          <input className="input-base" onChange={(event) => setTag(event.target.value)} placeholder="Lọc tag bệnh lý" value={tag} />
        </div>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!dashboard ? (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-600">Đang tải dashboard...</p>
        </article>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Tổng lịch</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.summaryCards.totalAppointments}</p>
            </article>
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Lịch gia đình</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.summaryCards.familyDoctorAppointments}</p>
            </article>
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Lịch khám lẻ</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.summaryCards.oneTimeAppointments}</p>
            </article>
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Bệnh nhân dài hạn</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.summaryCards.activeFamilyPatients}</p>
            </article>
            <article className="surface-card p-4">
              <p className="text-sm text-slate-500">Task theo dõi</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{dashboard.summaryCards.monitoringTasks}</p>
            </article>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <article className="surface-card p-5">
              <h3 className="text-base font-semibold text-slate-900">Theo dõi theo thời gian</h3>
              {dashboard.monitoringQueue.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Không có task theo dõi trong phạm vi đã chọn.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {dashboard.monitoringQueue.map((task) => (
                    <li className="rounded-lg border border-slate-200 bg-slate-50 p-2" key={task.carePlanId}>
                      <p className="text-sm font-semibold text-slate-900">{task.memberName}</p>
                      <p className="text-xs text-slate-600">
                        Follow-up: {task.nextFollowUpAt ? formatDateTime(task.nextFollowUpAt) : "-"}
                      </p>
                      <Link className="text-xs text-brand-700 underline" to={ROUTES.app.doctor.patientOverview(task.memberId)}>
                        Mở hồ sơ
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="surface-card p-5">
              <h3 className="text-base font-semibold text-slate-900">Bệnh nhân bác sĩ gia đình</h3>
              {dashboard.familyDoctorPanel.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Chưa có bệnh nhân dài hạn active.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {dashboard.familyDoctorPanel.map((item) => (
                    <li className="rounded-lg border border-slate-200 bg-slate-50 p-2" key={item.requestId}>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.patientDisplayName || item.patientEmail || item.patientUserId}
                      </p>
                      <p className="text-xs text-slate-600">
                        Thuê {item.billingCycle === "WEEKLY" ? "theo tuần" : "theo tháng"} •{" "}
                        {Number(item.billingAmount || 0).toLocaleString("vi-VN")} VND
                      </p>
                      <p className="text-xs text-slate-500">
                        Hiệu lực đến: {formatDateTime(item.contractEndsAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="surface-card p-5">
              <h3 className="text-base font-semibold text-slate-900">Bệnh nhân khám một lần</h3>
              {dashboard.oneTimePanel.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Không có lịch khám một lần trong phạm vi đã chọn.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {dashboard.oneTimePanel.map((item) => (
                    <li className="rounded-lg border border-slate-200 bg-slate-50 p-2" key={item.appointmentId}>
                      <p className="text-sm font-semibold text-slate-900">
                        Patient: {item.patientUserId}
                      </p>
                      <p className="text-xs text-slate-600">{item.reason || "Không có lý do khám"}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(item.startAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}
