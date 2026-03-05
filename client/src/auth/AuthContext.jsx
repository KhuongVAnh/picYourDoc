import { useMemo, useState } from "react";
import { AuthContext } from "./authContextObject";

export function AuthProvider({ children }) {
  const [role, setRole] = useState("patient");

  const value = useMemo(
    () => ({
      role,
      setRole,
      isAuthenticated: true,
    }),
    [role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
