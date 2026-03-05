import { useEffect, useState } from "react";
import { AuthContext } from "./authContextObject";
import { getMeApi, loginApi, registerApi, updateMyProfileApi } from "../lib/api";

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
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [authError, setAuthError] = useState("");

  // Đồng bộ state auth lên localStorage mỗi khi có thay đổi.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Đồng bộ profile thực từ API /auth/me sau khi có token.
  useEffect(() => {
    let ignore = false;

    async function bootstrapFromMe() {
      if (!state.accessToken) {
        return;
      }
      setIsBootstrapping(true);
      try {
        const response = await getMeApi(state.accessToken);
        if (!ignore) {
          setState((current) => ({
            ...current,
            user: response.user,
            role: response.user?.role || current.role,
          }));
        }
      } catch {
        if (!ignore) {
          setState({
            accessToken: "",
            refreshToken: "",
            user: null,
            role: "patient",
          });
        }
      } finally {
        if (!ignore) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapFromMe();
    return () => {
      ignore = true;
    };
  }, [state.accessToken]);

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

  // Thực hiện đăng ký tài khoản mới và tự động đăng nhập.
  async function register(payload) {
    setIsLoading(true);
    setAuthError("");
    try {
      const result = await registerApi(payload);
      setState({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        role: result.user.role,
      });
      return result.user;
    } catch (error) {
      setAuthError(error.message || "Đăng ký thất bại");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Cập nhật profile của user hiện tại.
  async function updateProfile(payload) {
    if (!state.accessToken) {
      throw new Error("Unauthorized");
    }
    const response = await updateMyProfileApi(payload, state.accessToken);
    setState((current) => ({
      ...current,
      user: response.user,
      role: response.user?.role || current.role,
    }));
    return response.user;
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

  // Đóng gói context value trực tiếp để tránh sai dependency của hook useMemo.
  const value = {
    role: state.role,
    setRole,
    user: state.user,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    isAuthenticated: Boolean(state.accessToken),
    isLoading,
    isBootstrapping,
    authError,
    login,
    register,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
