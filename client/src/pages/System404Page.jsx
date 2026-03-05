import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang lỗi 404 cho route không tồn tại.
export function System404Page() {
  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">404 Not Found</p>
      <h1 className="text-3xl font-bold text-slate-900">Không tìm thấy trang</h1>
      <p className="text-sm text-slate-600">
        Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi trong bản release mới.
      </p>
      <Link className="btn-primary inline-flex px-4 py-2 text-sm" to={ROUTES.public.home}>
        Quay lại trang chủ
      </Link>
    </section>
  );
}
