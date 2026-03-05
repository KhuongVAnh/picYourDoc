import { useEffect, useMemo, useState } from "react";
import { getDoctorIncomeApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";

// Trang thu nhập theo tháng cho bác sĩ.
export function DoctorIncomePage() {
  const { accessToken } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const [income, setIncome] = useState(null);
  const [error, setError] = useState("");

  const totalRows = useMemo(() => income?.rows?.length || 0, [income]);

  // Tải báo cáo thu nhập theo tháng đang chọn.
  useEffect(() => {
    let ignore = false;

    async function loadIncome() {
      try {
        const response = await getDoctorIncomeApi({ month }, accessToken);
        if (!ignore) {
          setIncome(response.data);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải báo cáo thu nhập");
        }
      }
    }

    loadIncome();
    return () => {
      ignore = true;
    };
  }, [accessToken, month]);

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Thu nhập bác sĩ</h2>
        <input className="input-base w-[220px]" onChange={(event) => setMonth(event.target.value)} type="month" value={month} />
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {income ? (
        <>
          <article className="surface-card p-5">
            <p className="text-sm text-slate-600">Tháng: {income.month}</p>
            <p className="text-2xl font-semibold text-slate-900">{income.totalAmount.toLocaleString("vi-VN")}đ</p>
            <p className="text-sm text-slate-600">Số ca ghi nhận: {totalRows}</p>
          </article>

          <article className="surface-card p-5">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Chi tiết ledger</h3>
            {income.rows.length === 0 ? (
              <p className="text-sm text-slate-500">Không có bản ghi thu nhập trong tháng này.</p>
            ) : (
              <div className="grid gap-2">
                {income.rows.map((row) => (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={row.id}>
                    <p className="text-sm font-semibold text-slate-900">Session: {row.consultSessionId}</p>
                    <p className="text-sm text-slate-700">
                      Plan: {row.planCode} | Amount: {row.amount.toLocaleString("vi-VN")}đ
                    </p>
                    <p className="text-sm text-slate-700">Patient: {row.patientUserId}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(row.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </>
      ) : (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-600">Đang tải báo cáo thu nhập...</p>
        </article>
      )}
    </section>
  );
}
