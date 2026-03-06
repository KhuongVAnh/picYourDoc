import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { RoleLayout } from "./layouts/RoleLayout";
import { ROUTES } from "./lib/routes";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PricingPage } from "./pages/PricingPage";
import { AboutPage } from "./pages/AboutPage";
import { PatientDashboardPage } from "./pages/PatientDashboardPage";
import { DoctorDashboardPage } from "./pages/DoctorDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { DoctorsListPage } from "./pages/DoctorsListPage";
import { DoctorDetailPage } from "./pages/DoctorDetailPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { NewAppointmentPage } from "./pages/NewAppointmentPage";
import { DoctorConsultPage } from "./pages/DoctorConsultPage";
import { PatientConsultPage } from "./pages/PatientConsultPage";
import { PatientProfilePage } from "./pages/PatientProfilePage";
import { PatientFamilyPage } from "./pages/PatientFamilyPage";
import { MemberRecordsPage } from "./pages/MemberRecordsPage";
import { SubscriptionPlansPage } from "./pages/SubscriptionPlansPage";
import { SubscriptionCheckoutPage } from "./pages/SubscriptionCheckoutPage";
import { SubscriptionHistoryPage } from "./pages/SubscriptionHistoryPage";
import { PatientMessagesPage } from "./pages/PatientMessagesPage";
import { PatientNotificationsPage } from "./pages/PatientNotificationsPage";
import { PatientFamilyDoctorPage } from "./pages/PatientFamilyDoctorPage";
import { DoctorSchedulePage } from "./pages/DoctorSchedulePage";
import { DoctorPatientsPage } from "./pages/DoctorPatientsPage";
import { DoctorPatientOverviewPage } from "./pages/DoctorPatientOverviewPage";
import { DoctorFollowUpsPage } from "./pages/DoctorFollowUpsPage";
import { DoctorIncomePage } from "./pages/DoctorIncomePage";
import { DoctorSlaPage } from "./pages/DoctorSlaPage";
import { DoctorMessagesPage } from "./pages/DoctorMessagesPage";
import { DoctorProfilePage } from "./pages/DoctorProfilePage";
import { DoctorSettingsPage } from "./pages/DoctorSettingsPage";
import { System403Page } from "./pages/System403Page";
import { System404Page } from "./pages/System404Page";
import { System500Page } from "./pages/System500Page";

// Khai báo router production với IA mới theo zone public, app và system pages.
function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<HomePage />} path={ROUTES.public.home} />
        <Route element={<DoctorsListPage />} path={ROUTES.public.doctors} />
        <Route element={<PricingPage />} path={ROUTES.public.pricing} />
        <Route element={<AboutPage />} path={ROUTES.public.about} />
        <Route element={<LoginPage />} path={ROUTES.public.login} />
        <Route element={<RegisterPage />} path={ROUTES.public.register} />
      </Route>

      <Route element={<RoleLayout allowedRoles={["patient"]} />} path="/app/patient">
        <Route element={<Navigate replace to="overview" />} index />
        <Route element={<PatientDashboardPage />} path="overview" />
        <Route element={<PatientProfilePage />} path="profile" />
        <Route element={<DoctorsListPage />} path="doctors" />
        <Route element={<DoctorDetailPage />} path="doctors/:doctorId" />
        <Route element={<AppointmentsPage />} path="appointments" />
        <Route element={<NewAppointmentPage />} path="appointments/new" />
        <Route element={<PatientConsultPage />} path="consults/:appointmentId" />
        <Route element={<PatientFamilyPage />} path="family" />
        <Route element={<MemberRecordsPage />} path="family/:memberId/records" />
        <Route element={<SubscriptionPlansPage />} path="subscription/plans" />
        <Route element={<SubscriptionCheckoutPage />} path="subscription/checkout" />
        <Route element={<SubscriptionHistoryPage />} path="subscription/history" />
        <Route element={<PatientMessagesPage />} path="messages" />
        <Route element={<PatientNotificationsPage />} path="notifications" />
        <Route element={<PatientFamilyDoctorPage />} path="family-doctor" />
      </Route>

      <Route element={<RoleLayout allowedRoles={["doctor"]} />} path="/app/doctor">
        <Route element={<Navigate replace to="overview" />} index />
        <Route element={<DoctorDashboardPage />} path="overview" />
        <Route element={<DoctorSchedulePage />} path="schedule" />
        <Route element={<DoctorPatientsPage />} path="patients" />
        <Route element={<DoctorPatientOverviewPage />} path="patients/:memberId" />
        <Route element={<DoctorConsultPage />} path="consults/:appointmentId" />
        <Route element={<DoctorFollowUpsPage />} path="follow-ups" />
        <Route element={<DoctorSlaPage />} path="sla" />
        <Route element={<DoctorIncomePage />} path="income" />
        <Route element={<DoctorMessagesPage />} path="messages" />
        <Route element={<DoctorProfilePage />} path="profile" />
        <Route element={<DoctorSettingsPage />} path="settings" />
      </Route>

      <Route element={<RoleLayout allowedRoles={["admin"]} />} path="/app/admin">
        <Route element={<Navigate replace to="overview" />} index />
        <Route element={<AdminDashboardPage />} path="overview" />
      </Route>

      <Route element={<System403Page />} path={ROUTES.system.forbidden} />
      <Route element={<System404Page />} path={ROUTES.system.notFound} />
      <Route element={<System500Page />} path={ROUTES.system.error} />

      <Route element={<Navigate replace to={ROUTES.system.notFound} />} path="*" />
    </Routes>
  );
}

export default App;
