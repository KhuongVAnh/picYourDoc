import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMySubscriptionApi, getSubscriptionPlansApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../lib/routes";

// Tạo ảnh fallback theo mã gói để luôn có thumbnail cho plan card.
function buildPlanFallbackThumbnail(planCode) {
  const encodedText = encodeURIComponent(planCode || "Plan");
  return `https://ui-avatars.com/api/?name=${encodedText}&background=0F4C81&color=FFFFFF&size=320`;
}

// Trang chọn gói subscription cho patient.
export function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [error, setError] = useState("");

  // Tải danh sách plan và gói hiện tại để so sánh quyền lợi.
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [plansRes, mySubRes] = await Promise.all([
          getSubscriptionPlansApi(accessToken),
          getMySubscriptionApi({}, accessToken),
        ]);

        if (!ignore) {
          setPlans(plansRes.data || []);
          setCurrentSubscription(mySubRes.data || null);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải danh sách gói");
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  // Điều hướng sang trang checkout mock với planCode đã chọn.
  function handleSelectPlan(planCode) {
    navigate(`${ROUTES.app.patient.subscriptionCheckout}?planCode=${planCode}`);
  }

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Chọn gói dịch vụ</h2>
          <p className="text-sm text-slate-600">
            Gói hiện tại: <span className="font-semibold">{currentSubscription?.plan?.name || "N/A"}</span>
          </p>
        </div>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.subscriptionHistory}>
          Lịch sử giao dịch
        </Link>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article className="surface-card overflow-hidden p-0" key={plan.id}>
            <img
              alt={plan.name}
              className="h-36 w-full object-cover"
              src={plan.thumbnailUrl || buildPlanFallbackThumbnail(plan.code)}
            />
            <div className="space-y-2 p-4">
              <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-600">Mã gói: {plan.code}</p>
              <p className="text-sm text-slate-600">
                Giá/tháng: <span className="font-semibold">{Number(plan.monthlyPrice).toLocaleString("vi-VN")}đ</span>
              </p>
              <p className="text-sm text-slate-600">Quota tư vấn: {plan.consultSessionQuota} phiên/tháng</p>
              <p className="text-sm text-slate-600">Family member limit: {plan.familyMemberLimit}</p>
              <p className="text-sm text-slate-600">
                SLA: {plan.slaMinutes ? `${plan.slaMinutes} phút` : "Không cam kết"}
              </p>
              <button className="btn-primary mt-2 w-full px-4 py-2 text-sm" onClick={() => handleSelectPlan(plan.code)} type="button">
                Chọn gói này
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
