import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ROUTES, getDefaultRouteByRole } from "../lib/routes";

// Trang đăng ký tài khoản mới và điều hướng theo role sau khi tạo thành công.
export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, authError } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [localError, setLocalError] = useState("");

  // Submit form đăng ký và chuyển thẳng đến app zone tương ứng role.
  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    try {
      const user = await register({ displayName, email, password, role });
      navigate(getDefaultRouteByRole(user.role), { replace: true });
    } catch (error) {
      setLocalError(error.message || "Đăng ký thất bại");
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <article className="surface-card p-6 md:p-7">
        <h2 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tạo tài khoản để bắt đầu quản lý sức khỏe cùng PickYourDoc.
        </p>

        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-700">
            Họ và tên
            <input
              className="input-base mt-1"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Nguyễn Văn A"
              value={displayName}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              className="input-base mt-1"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Mật khẩu
            <input
              className="input-base mt-1"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Vai trò
            <select
              className="input-base mt-1"
              onChange={(event) => setRole(event.target.value)}
              value={role}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </label>

          {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
          {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

          <button className="btn-primary mt-1 px-4 py-2 text-sm" disabled={isLoading} type="submit">
            {isLoading ? "Đang xử lý..." : "Tạo tài khoản"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link className="font-semibold text-brand-700 underline" to={ROUTES.public.login}>
            Đăng nhập
          </Link>
        </p>
      </article>
    </section>
  );
}
