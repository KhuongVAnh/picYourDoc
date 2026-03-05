import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContextObject";
import { loginApi } from "../lib/api";

const STORAGE_KEY = "pyd_auth_state";

// Đọc trạng thái auth từ localStorage để giữ phiên đăng nhập sau khi reload.
function getInitialAuthState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        accessToken: "",
        refreshToken: "",
        user: null,
        role: "patient",
      };
    }
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed.accessToken || "",
      refreshToken: parsed.refreshToken || "",
      user: parsed.user || null,
      role: parsed.user?.role || "patient",
    };
  } catch {
    return {
      accessToken: "",
      refreshToken: "",
      user: null,
      role: "patient",
    };
  }
}

// Cung cấp state + hành động auth cho toàn bộ ứng dụng.
export function AuthProvider({ children }) {
  const [state, setState] = useState(getInitialAuthState);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Đồng bộ state auth lên localStorage mỗi khi có thay đổi.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Thực hiện đăng nhập và lưu token/user vào context.
  async function login(email, password) {
    setIsLoading(true);
    setAuthError("");
    try {
      const result = await loginApi({ email, password });
      setState({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        role: result.user.role,
      });
      return result.user;
    } catch (error) {
      setAuthError(error.message || "Đăng nhập thất bại");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Đăng xuất và xóa toàn bộ dữ liệu phiên người dùng.
  function logout() {
    setState({
      accessToken: "",
      refreshToken: "",
      user: null,
      role: "patient",
    });
    setAuthError("");
  }

  // Cho phép set role thủ công phục vụ demo role-based layout.
  function setRole(role) {
    setState((prev) => ({
      ...prev,
      role,
      user: prev.user ? { ...prev.user, role } : prev.user,
    }));
  }

  const value = useMemo(
    () => ({
      role: state.role,
      setRole,
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      isAuthenticated: Boolean(state.accessToken),
      isLoading,
      authError,
      login,
      logout,
    }),
    [state, isLoading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
