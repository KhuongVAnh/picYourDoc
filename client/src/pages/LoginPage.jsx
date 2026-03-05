import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

// Trang đăng nhập bằng email/password và điều hướng theo role.
export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, authError } = useAuth();
  const [email, setEmail] = useState("patient.demo@picyourdoc.local");
  const [password, setPassword] = useState("Patient@123");
  const [localError, setLocalError] = useState("");

  // Submit login form, sau đó chuyển đến dashboard đúng role.
  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");
    try {
      const user = await login(email, password);
      if (user.role === "doctor") {
        navigate("/doctor");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/patient");
      }
    } catch (error) {
      setLocalError(error.message || "Đăng nhập thất bại");
    }
  }

  return (
    <article className="panel">
      <h2 className="mb-2 text-xl font-semibold text-slate-900">Đăng nhập</h2>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Mật khẩu
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {localError ? <p className="text-sm text-red-600">{localError}</p> : null}
        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

        <button className="app-link" disabled={isLoading} type="submit">
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </article>
  );
}
