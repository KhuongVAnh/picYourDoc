import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { RoleLayout } from "./layouts/RoleLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PatientDashboardPage } from "./pages/PatientDashboardPage";
import { DoctorDashboardPage } from "./pages/DoctorDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { DoctorsListPage } from "./pages/DoctorsListPage";
import { DoctorDetailPage } from "./pages/DoctorDetailPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { NewAppointmentPage } from "./pages/NewAppointmentPage";
import { DoctorConsultPage } from "./pages/DoctorConsultPage";
import { PatientConsultPage } from "./pages/PatientConsultPage";

// Khai báo toàn bộ router cho trang public và các dashboard theo role.
function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/doctors" element={<DoctorsListPage />} />
      </Route>

      <Route element={<RoleLayout allowedRoles={["patient"]} roleTitle="Patient" />}>
        <Route path="/patient" element={<PatientDashboardPage />} />
        <Route path="/patient/doctors" element={<DoctorsListPage />} />
        <Route path="/patient/doctors/:doctorId" element={<DoctorDetailPage />} />
        <Route path="/patient/appointments" element={<AppointmentsPage />} />
        <Route path="/patient/appointments/new" element={<NewAppointmentPage />} />
        <Route path="/patient/consults/:appointmentId" element={<PatientConsultPage />} />
      </Route>

      <Route element={<RoleLayout allowedRoles={["doctor"]} roleTitle="Doctor" />}>
        <Route path="/doctor" element={<DoctorDashboardPage />} />
        <Route path="/doctor/consults/:appointmentId" element={<DoctorConsultPage />} />
      </Route>

      <Route element={<RoleLayout allowedRoles={["admin"]} roleTitle="Admin" />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
