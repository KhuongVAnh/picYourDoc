import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

// Layout công khai cho trang chủ và đăng nhập.
export function PublicLayout() {
  const { role, setRole, isAuthenticated, user, logout } = useAuth();

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1 className="text-3xl font-bold text-brand-700">PickYourDoc</h1>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="text-right">
                <p className="meta-text">{user?.email}</p>
                <p className="meta-text">Role: {role}</p>
              </div>
              <button className="app-link" type="button" onClick={logout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor="role" className="text-sm font-medium text-slate-700">
                Vai trò demo:
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
          )}
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
        <Link className="app-link" to="/doctors">
          Danh sách bác sĩ
        </Link>
      </nav>

      <section className="app-content">
        <Outlet />
      </section>
    </main>
  );
}
