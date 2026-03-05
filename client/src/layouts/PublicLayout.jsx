import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export function PublicLayout() {
  const { role, setRole } = useAuth();

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1 className="text-3xl font-bold text-brand-700">PickYourDoc</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Vai trò:
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
          >
            <option value="patient">patient</option>
            <option value="doctor">doctor</option>
            <option value="admin">admin</option>
          </select>
        </div>
      </header>

      <nav className="app-nav">
        <Link className="app-link" to="/">
          Trang chủ
        </Link>
        <Link className="app-link" to="/login">
          Đăng nhập
        </Link>
        <Link className="app-link" to="/patient">
          Patient
        </Link>
        <Link className="app-link" to="/doctor">
          Doctor
        </Link>
        <Link className="app-link" to="/admin">
          Admin
        </Link>
      </nav>

      <section className="app-content">
        <Outlet />
      </section>
    </main>
  );
}
