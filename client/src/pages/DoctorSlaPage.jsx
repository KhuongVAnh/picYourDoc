import { useEffect, useState } from "react";
import { getDoctorDashboardApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";

// Trang theo dõi SLA phản hồi dựa trên thống kê dashboard.
export function DoctorSlaPage() {
  const { accessToken } = useAuth();
  const [slaMetrics, setSlaMetrics] = useState(null);
  const [error, setError] = useState("");

  // Tải dữ liệu SLA từ dashboard API.
  useEffect(() => {
    let ignore = false;

    async function loadSla() {
      try {
        const response = await getDoctorDashboardApi({}, accessToken);
        if (!ignore) {
          setSlaMetrics(response.data?.slaMetrics || null);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải SLA metrics");
        }
      }
    }

    loadSla();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  return (
    <section className="space-y-4">
      <header className="surface-card p-4">
        <h2 className="text-xl font-semibold text-slate-900">SLA phản hồi</h2>
      </header>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!slaMetrics ? (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-600">Đang tải SLA metrics...</p>
        </article>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          <article className="surface-card p-4">
            <p className="text-xs text-slate-500">Avg response</p>
            <p className="text-xl font-semibold text-slate-900">{slaMetrics.avgResponseMinutes ?? "-"} phút</p>
          </article>
          <article className="surface-card p-4">
            <p className="text-xs text-slate-500">Within 15 phút</p>
            <p className="text-xl font-semibold text-slate-900">{slaMetrics.within15mCount}</p>
          </article>
          <article className="surface-card p-4">
            <p className="text-xs text-slate-500">Tổng mẫu đo</p>
            <p className="text-xl font-semibold text-slate-900">{slaMetrics.totalMeasured}</p>
          </article>
        </div>
      )}
    </section>
  );
}
