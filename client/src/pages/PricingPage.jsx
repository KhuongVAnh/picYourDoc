import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

const PLAN_CARDS = [
  {
    code: "FREE",
    name: "Free",
    price: "0đ/tháng",
    features: ["Đặt lịch theo từng lần", "Xem kiến thức sức khỏe", "1 thành viên gia đình"],
  },
  {
    code: "PREMIUM",
    name: "Premium",
    price: "299.000đ/tháng",
    features: ["4 phiên tư vấn/tháng", "Ưu tiên phản hồi", "2 thành viên gia đình"],
  },
  {
    code: "FAMILY",
    name: "Family",
    price: "799.000đ/tháng",
    features: ["12 phiên tư vấn/tháng", "SLA ưu tiên", "6 thành viên gia đình"],
  },
];

// Trang bảng giá public để giới thiệu plan trước khi người dùng đăng ký.
export function PricingPage() {
  return (
    <section className="space-y-6">
      <header className="surface-card p-6">
        <h2 className="text-2xl font-bold text-slate-900">Bảng Giá PickYourDoc</h2>
        <p className="mt-2 text-sm text-slate-600">
          Chọn gói phù hợp để quản lý sức khỏe chủ động cho cá nhân và gia đình.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLAN_CARDS.map((plan) => (
          <article key={plan.code} className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{plan.code}</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{plan.name}</h3>
            <p className="mt-1 text-lg font-semibold text-teal-600">{plan.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Link className="btn-primary mt-4 inline-flex px-4 py-2 text-sm" to={ROUTES.public.register}>
              Đăng ký ngay
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
