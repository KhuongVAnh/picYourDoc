import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ROUTES, getDefaultRouteByRole } from "../lib/routes";

const PUBLIC_NAV_ITEMS = [
  { label: "Trang chủ", to: ROUTES.public.home },
  { label: "Tìm bác sĩ", to: ROUTES.public.doctors },
  { label: "Bảng giá", to: ROUTES.public.pricing },
  { label: "Giới thiệu", to: ROUTES.public.about },
];

// Trả class cho item menu public theo trạng thái active để đồng bộ style.
function getPublicNavClass({ isActive }) {
  if (isActive) {
    return "rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 no-underline";
  }
  return "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 hover:no-underline";
}

// Layout public cho zone marketing + auth theo phong cách clinical sáng.
export function PublicLayout() {
  const { isAuthenticated, user, role, logout } = useAuth();
  const appEntry = getDefaultRouteByRole(role);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link className="no-underline" to={ROUTES.public.home}>
            <span className="text-2xl font-extrabold tracking-tight text-brand-700">
              PickYourDoc
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} className={getPublicNavClass} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-slate-900">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <Link className="btn-primary px-4 py-2 text-sm" to={appEntry}>
                  Vào ứng dụng
                </Link>
                <button className="btn-soft px-4 py-2 text-sm" onClick={logout} type="button">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.public.login}>
                  Đăng nhập
                </Link>
                <Link className="btn-primary px-4 py-2 text-sm" to={ROUTES.public.register}>
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 lg:hidden">
          <div className="mx-auto flex w-full max-w-[1280px] gap-2 overflow-x-auto">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} className={getPublicNavClass} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}
