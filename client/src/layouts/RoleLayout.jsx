import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function RoleLayout({ allowedRoles, roleTitle }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1 className="text-3xl font-bold text-brand-700">{roleTitle} Dashboard</h1>
        <p className="meta-text">Quyền hiện tại: {role}</p>
      </header>
      <nav className="app-nav">
        <Link className="app-link" to="/">
          Về trang chủ
        </Link>
      </nav>
      <section className="app-content">
        <Outlet />
      </section>
    </main>
  );
}
