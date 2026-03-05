import { Link } from "react-router-dom";
import { ROUTES } from "../lib/routes";

// Trang lỗi 500 để hiển thị fallback khi có sự cố hệ thống.
export function System500Page() {
  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">500 Server Error</p>
      <h1 className="text-3xl font-bold text-slate-900">Hệ thống đang gặp sự cố</h1>
      <p className="text-sm text-slate-600">
        Vui lòng thử lại sau vài phút. Nếu lỗi lặp lại, hãy liên hệ đội hỗ trợ kỹ thuật.
      </p>
      <Link className="btn-primary inline-flex px-4 py-2 text-sm" to={ROUTES.public.home}>
        Về trang chủ
      </Link>
    </section>
  );
}
