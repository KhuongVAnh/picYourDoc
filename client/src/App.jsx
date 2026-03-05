import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { RoleLayout } from "./layouts/RoleLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PatientDashboardPage } from "./pages/PatientDashboardPage";
import { DoctorDashboardPage } from "./pages/DoctorDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<RoleLayout allowedRoles={["patient"]} roleTitle="Patient" />}>
        <Route path="/patient" element={<PatientDashboardPage />} />
      </Route>

      <Route element={<RoleLayout allowedRoles={["doctor"]} roleTitle="Doctor" />}>
        <Route path="/doctor" element={<DoctorDashboardPage />} />
      </Route>

      <Route element={<RoleLayout allowedRoles={["admin"]} roleTitle="Admin" />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
