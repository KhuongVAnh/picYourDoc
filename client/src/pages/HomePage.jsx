import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang chủ public với hero rõ giá trị cốt lõi và CTA đi vào luồng chính.
export function HomePage() {
  return (
    <section className="space-y-6">
      <article className="surface-card relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-100/60 blur-2xl" />
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">HealthTech Platform</p>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Chăm sóc sức khỏe gia đình theo chuẩn hiện đại, liên tục và chủ động.
            </h1>
            <p className="text-sm text-slate-600 md:text-base">
              PickYourDoc giúp bạn tìm bác sĩ phù hợp, đặt lịch nhanh, tư vấn từ xa và quản lý hồ sơ
              gia đình trong một hệ sinh thái thống nhất.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-primary px-4 py-2 text-sm" to={ROUTES.public.register}>
                Tạo tài khoản
              </Link>
              <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.public.doctors}>
                Tìm bác sĩ ngay
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 p-5 text-white">
            <h2 className="text-lg font-semibold">Điểm nổi bật MVP</h2>
            <ul className="mt-3 space-y-2 text-sm text-blue-50">
              <li>• Đặt/hủy/đổi lịch với rule nghiệp vụ rõ ràng.</li>
              <li>• Chat + video call in-app theo phiên tư vấn.</li>
              <li>• Theo dõi hồ sơ cá nhân và gia đình dài hạn.</li>
              <li>• Subscription + thanh toán mock + usage tracking.</li>
            </ul>
          </div>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Tìm bác sĩ đúng chuyên khoa</h3>
          <p className="mt-2 text-sm text-slate-600">Lọc theo khu vực, mức phí, bảo hiểm và đánh giá.</p>
        </article>
        <article className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Tư vấn từ xa linh hoạt</h3>
          <p className="mt-2 text-sm text-slate-600">Trao đổi nhanh qua chat/video, lưu lịch sử tư vấn đầy đủ.</p>
        </article>
        <article className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Theo dõi dài hạn cho gia đình</h3>
          <p className="mt-2 text-sm text-slate-600">Quản lý timeline sức khỏe và kế hoạch chăm sóc theo thành viên.</p>
        </article>
      </div>
    </section>
  );
}
