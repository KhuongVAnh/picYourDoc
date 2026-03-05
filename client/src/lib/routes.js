// Khai báo tập trung toàn bộ route để tránh hard-code rải rác trong UI.
const ROUTES = {
  public: {
    home: "/",
    doctors: "/doctors",
    pricing: "/pricing",
    about: "/about",
    login: "/auth/login",
    register: "/auth/register",
  },
  app: {
    patient: {
      overview: "/app/patient/overview",
      doctors: "/app/patient/doctors",
      doctorDetail: (doctorId = ":doctorId") => `/app/patient/doctors/${doctorId}`,
      appointments: "/app/patient/appointments",
      appointmentNew: "/app/patient/appointments/new",
      consult: (appointmentId = ":appointmentId") =>
        `/app/patient/consults/${appointmentId}`,
      family: "/app/patient/family",
      memberRecords: (memberId = ":memberId") => `/app/patient/family/${memberId}/records`,
      subscriptionPlans: "/app/patient/subscription/plans",
      subscriptionCheckout: "/app/patient/subscription/checkout",
      subscriptionHistory: "/app/patient/subscription/history",
      profile: "/app/patient/profile",
      messages: "/app/patient/messages",
      notifications: "/app/patient/notifications",
    },
    doctor: {
      overview: "/app/doctor/overview",
      schedule: "/app/doctor/schedule",
      patients: "/app/doctor/patients",
      patientOverview: (memberId = ":memberId") => `/app/doctor/patients/${memberId}`,
      consult: (appointmentId = ":appointmentId") =>
        `/app/doctor/consults/${appointmentId}`,
      followUps: "/app/doctor/follow-ups",
      sla: "/app/doctor/sla",
      income: "/app/doctor/income",
      messages: "/app/doctor/messages",
      profile: "/app/doctor/profile",
      settings: "/app/doctor/settings",
    },
    admin: {
      overview: "/app/admin/overview",
    },
  },
  system: {
    forbidden: "/403",
    notFound: "/404",
    error: "/500",
  },
};

// Trả về route mặc định theo role để điều hướng sau login/register.
function getDefaultRouteByRole(role) {
  if (role === "doctor") {
    return ROUTES.app.doctor.overview;
  }
  if (role === "admin") {
    return ROUTES.app.admin.overview;
  }
  return ROUTES.app.patient.overview;
}

export { ROUTES, getDefaultRouteByRole };
