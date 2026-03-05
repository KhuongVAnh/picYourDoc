import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ROUTES, getDefaultRouteByRole } from "../lib/routes";

// Trang đăng nhập bằng email/password và điều hướng theo role sau khi xác thực.
export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, authError } = useAuth();
  const [email, setEmail] = useState("patient.demo@picyourdoc.local");
  const [password, setPassword] = useState("Patient@123");
  const [localError, setLocalError] = useState("");

  // Submit form đăng nhập và chuyển đến dashboard mặc định theo role.
  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    try {
      const user = await login(email, password);
      // Ưu tiên redirect URL được truyền từ trang yêu cầu đăng nhập trước đó.
      const redirectPath = searchParams.get("redirect");
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
        return;
      }

      navigate(getDefaultRouteByRole(user.role), { replace: true });
    } catch (error) {
      setLocalError(error.message || "Đăng nhập thất bại");
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <article className="surface-card p-6 md:p-7">
        <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
        <p className="mt-1 text-sm text-slate-600">Truy cập dashboard chăm sóc sức khỏe của bạn.</p>

        <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              className="input-base mt-1"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            Mật khẩu
            <input
              className="input-base mt-1"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>

          {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
          {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

          <button className="btn-primary mt-1 px-4 py-2 text-sm" disabled={isLoading} type="submit">
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Chưa có tài khoản?{" "}
          <Link className="font-semibold text-brand-700 underline" to={ROUTES.public.register}>
            Đăng ký ngay
          </Link>
        </p>
      </article>
    </section>
  );
}
