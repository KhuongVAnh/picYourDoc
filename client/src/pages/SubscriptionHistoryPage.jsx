import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelSubscriptionApi,
  getMySubscriptionApi,
  getSubscriptionTransactionsApi,
  getSubscriptionUsageApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trang lịch sử giao dịch subscription và usage quota theo tháng.
export function SubscriptionHistoryPage() {
  const { accessToken } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Tải dữ liệu subscription hiện tại, usage và transaction history.
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [mySubRes, usageRes, txRes] = await Promise.all([
          getMySubscriptionApi({}, accessToken),
          getSubscriptionUsageApi({}, accessToken),
          getSubscriptionTransactionsApi({ page: 1, limit: 20 }, accessToken),
        ]);

        if (!ignore) {
          setSubscription(mySubRes.data);
          setUsage(usageRes.data);
          setTransactions(txRes.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải lịch sử subscription");
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  // Hủy subscription active hiện tại.
  async function handleCancelSubscription() {
    setError("");
    setIsCancelling(true);
    try {
      await cancelSubscriptionApi(accessToken);
      const refreshed = await getMySubscriptionApi({}, accessToken);
      setSubscription(refreshed.data);
    } catch (apiError) {
      setError(apiError.message || "Không thể hủy subscription");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Lịch sử subscription</h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.subscriptionPlans}>
          Quay lại chọn gói
        </Link>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Gói hiện tại</h3>
        {subscription ? (
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>
              Plan: {subscription.plan.name} ({subscription.plan.code})
            </p>
            <p>Trạng thái: {subscription.status}</p>
            <p>Bắt đầu: {subscription.startedAt ? formatDateTime(subscription.startedAt) : "-"}</p>
            <p>Kết thúc: {subscription.endsAt ? formatDateTime(subscription.endsAt) : "-"}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Không có subscription hiện tại.</p>
        )}
        <button className="btn-soft mt-3 px-4 py-2 text-sm" disabled={isCancelling} onClick={handleCancelSubscription} type="button">
          {isCancelling ? "Đang hủy..." : "Hủy subscription"}
        </button>
      </article>

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Usage tháng hiện tại</h3>
        {usage ? (
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>Month: {usage.monthKey}</p>
            <p>Đã dùng: {usage.consultSessionsUsed}</p>
            <p>Còn lại: {usage.consultSessionsRemaining}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu usage.</p>
        )}
      </article>

      <article className="surface-card p-5">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Lịch sử giao dịch</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có giao dịch nào.</p>
        ) : (
          <div className="grid gap-2">
            {transactions.map((transaction) => (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm" key={transaction.id}>
                <p className="font-semibold text-slate-900">
                  {transaction.plan?.name || "N/A"} - {transaction.status}
                </p>
                <p>
                  Số tiền: {Number(transaction.amount).toLocaleString("vi-VN")} {transaction.currency} | Method: {transaction.paymentMethod}
                </p>
                <p>Ref: {transaction.referenceCode}</p>
                <p>Thời gian: {formatDateTime(transaction.createdAt)}</p>
                {transaction.failureReason ? <p className="text-red-600">{transaction.failureReason}</p> : null}
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
