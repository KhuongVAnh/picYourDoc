import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { NotificationPanel } from "../components/NotificationPanel";

// Layout bảo vệ route theo trạng thái đăng nhập và role được phép.
export function RoleLayout({ allowedRoles, roleTitle }) {
  const { role, isAuthenticated, logout, user } = useAuth();

  // Chặn truy cập nếu chưa đăng nhập.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Chặn truy cập nếu role không nằm trong danh sách được phép.
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1 className="text-3xl font-bold text-brand-700">{roleTitle} Dashboard</h1>
        <div className="text-right">
          <p className="meta-text">Quyền hiện tại: {role}</p>
          <p className="meta-text">{user?.email}</p>
        </div>
      </header>
      <nav className="app-nav">
        <Link className="app-link" to="/">
          Về trang chủ
        </Link>
        <button className="app-link" type="button" onClick={logout}>
          Đăng xuất
        </button>
      </nav>
      <section className="app-content">
        {/* Hiển thị panel thông báo để theo dõi reminder lịch hẹn. */}
        <NotificationPanel />
        <Outlet />
      </section>
    </main>
  );
}
