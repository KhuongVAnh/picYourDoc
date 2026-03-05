import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctorDashboardApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trang follow-up tasks cho bác sĩ dựa trên care plan active.
export function DoctorFollowUpsPage() {
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  // Tải follow-up tasks từ dashboard API để tránh lặp query FE.
  useEffect(() => {
    let ignore = false;

    async function loadTasks() {
      try {
        const response = await getDoctorDashboardApi({}, accessToken);
        if (!ignore) {
          setTasks(response.data?.followUpTasks || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải follow-up tasks");
        }
      }
    }

    loadTasks();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Follow-up tasks</h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.doctor.patients}>
          Mở danh sách bệnh nhân
        </Link>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {tasks.length === 0 ? (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500">Không có follow-up task nào trong 7 ngày tới.</p>
        </article>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {tasks.map((task) => (
            <article className="surface-card p-4" key={task.id}>
              <p className="font-semibold text-slate-900">{task.memberName}</p>
              <p className="text-sm text-slate-700">
                Follow-up: {task.nextFollowUpAt ? formatDateTime(task.nextFollowUpAt) : "-"}
              </p>
              <p className="text-sm text-slate-700">Chu kỳ: {task.frequencyDays} ngày</p>
              <Link className="btn-soft mt-2 inline-flex px-3 py-1.5 text-xs" to={ROUTES.app.doctor.patientOverview(task.memberId)}>
                Xem overview
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
