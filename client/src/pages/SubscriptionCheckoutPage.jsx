import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { checkoutMockApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../lib/routes";

// Trang checkout mock cho phép test cả nhánh success/fail.
export function SubscriptionCheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("VNPAY");
  const [mockResult, setMockResult] = useState("SUCCESS");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  const planCode = useMemo(() => searchParams.get("planCode") || "PREMIUM", [searchParams]);

  // Gọi checkout mock và hiển thị kết quả transaction.
  async function handleCheckout(event) {
    event.preventDefault();
    setError("");
    setResultMessage("");
    setIsSubmitting(true);
    try {
      const response = await checkoutMockApi({ planCode, paymentMethod, mockResult }, accessToken);
      setResultMessage(
        `Checkout hoàn tất. transactionStatus=${response.data.transactionStatus}`
      );
      setTimeout(() => {
        navigate(ROUTES.app.patient.subscriptionHistory);
      }, 1000);
    } catch (apiError) {
      setError(apiError.message || "Checkout thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Checkout mock</h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.subscriptionPlans}>
          Quay lại chọn gói
        </Link>
      </header>

      <article className="surface-card p-5">
        <p className="text-sm text-slate-600">
          Gói đang thanh toán: <span className="font-semibold">{planCode}</span>
        </p>

        <form className="mt-3 grid gap-3" onSubmit={handleCheckout}>
          <label className="text-sm font-medium text-slate-700">
            Payment method
            <select
              className="input-base mt-1"
              onChange={(event) => setPaymentMethod(event.target.value)}
              value={paymentMethod}
            >
              <option value="VNPAY">VNPAY</option>
              <option value="MOMO">MOMO</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Mock result
            <select
              className="input-base mt-1"
              onChange={(event) => setMockResult(event.target.value)}
              value={mockResult}
            >
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {resultMessage ? <p className="text-sm text-emerald-700">{resultMessage}</p> : null}

          <button className="btn-primary w-fit px-4 py-2 text-sm" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang xử lý..." : "Xác nhận thanh toán mock"}
          </button>
        </form>
      </article>
    </section>
  );
}
