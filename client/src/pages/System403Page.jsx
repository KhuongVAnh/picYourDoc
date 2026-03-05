import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang lỗi 403 khi người dùng truy cập route không đúng quyền.
export function System403Page() {
  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">403 Forbidden</p>
      <h1 className="text-3xl font-bold text-slate-900">Bạn không có quyền truy cập</h1>
      <p className="text-sm text-slate-600">
        Tài khoản hiện tại không được phép truy cập khu vực này. Vui lòng quay lại trang phù hợp.
      </p>
      <Link className="btn-primary inline-flex px-4 py-2 text-sm" to={ROUTES.public.home}>
        Về trang chủ
      </Link>
    </section>
  );
}
