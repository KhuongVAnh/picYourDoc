import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang giới thiệu public, mô tả định hướng sản phẩm cho người dùng mới.
export function AboutPage() {
  return (
    <section className="space-y-6">
      <header className="surface-card p-6">
        <h2 className="text-2xl font-bold text-slate-900">Về PickYourDoc</h2>
        <p className="mt-2 text-sm text-slate-600">
          PickYourDoc xây dựng hệ sinh thái bác sĩ gia đình với trải nghiệm số hiện đại, minh bạch và
          dễ dùng cho mọi thế hệ trong gia đình.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Liên tục</h3>
          <p className="mt-2 text-sm text-slate-600">
            Theo dõi sức khỏe theo thời gian, không đứt gãy dữ liệu giữa các lần khám.
          </p>
        </article>
        <article className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Chủ động</h3>
          <p className="mt-2 text-sm text-slate-600">
            Nhắc lịch, cảnh báo, và tư vấn từ xa giúp xử lý sớm trước khi bệnh tiến triển.
          </p>
        </article>
        <article className="surface-card p-5">
          <h3 className="text-base font-semibold text-slate-900">Tin cậy</h3>
          <p className="mt-2 text-sm text-slate-600">
            Quy trình tư vấn chuyên nghiệp, lưu hồ sơ tập trung và bảo vệ quyền riêng tư dữ liệu.
          </p>
        </article>
      </div>

      <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-sm text-slate-600">Bạn đã sẵn sàng bắt đầu hành trình chăm sóc sức khỏe chủ động?</p>
        <Link className="btn-primary px-4 py-2 text-sm" to={ROUTES.public.register}>
          Tạo tài khoản
        </Link>
      </div>
    </section>
  );
}
