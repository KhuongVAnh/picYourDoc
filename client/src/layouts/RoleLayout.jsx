import { useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../lib/routes";

const PATIENT_NAV_ITEMS = [
  { label: "Tìm bác sĩ", to: ROUTES.app.patient.doctors },
  { label: "Lịch hẹn", to: ROUTES.app.patient.appointments },
  { label: "Hồ sơ sức khỏe", to: ROUTES.app.patient.family },
  { label: "Tin nhắn", to: ROUTES.app.patient.messages },
  { label: "Gói dịch vụ", to: ROUTES.app.patient.subscriptionPlans },
];

const PATIENT_MOBILE_ITEMS = [
  { label: "Tổng quan", to: ROUTES.app.patient.overview },
  { label: "Bác sĩ", to: ROUTES.app.patient.doctors },
  { label: "Lịch", to: ROUTES.app.patient.appointments },
  { label: "Gia đình", to: ROUTES.app.patient.family },
  { label: "Gói", to: ROUTES.app.patient.subscriptionPlans },
];

const DOCTOR_NAV_ITEMS = [
  { label: "Bảng điều khiển", to: ROUTES.app.doctor.overview, icon: "📊" },
  { label: "Lịch khám", to: ROUTES.app.doctor.schedule, icon: "📅" },
  { label: "Bệnh nhân", to: ROUTES.app.doctor.patients, icon: "👨‍⚕️" },
  { label: "Tin nhắn", to: ROUTES.app.doctor.messages, icon: "💬" },
  { label: "SLA", to: ROUTES.app.doctor.sla, icon: "⏱️" },
  { label: "Thu nhập", to: ROUTES.app.doctor.income, icon: "💰" },
  { label: "Cài đặt", to: ROUTES.app.doctor.settings, icon: "⚙️" },
];

// Trả class cho link ở top nav patient.
function getPatientNavClass({ isActive }) {
  if (isActive) {
    return "rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 no-underline";
  }
  return "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 hover:no-underline";
}

// Trả class cho link trong sidebar doctor.
function getDoctorNavClass({ isActive }) {
  if (isActive) {
    return "flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white no-underline";
  }
  return "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white hover:no-underline";
}

// Trả class cho tab mobile patient.
function getPatientMobileNavClass({ isActive }) {
  if (isActive) {
    return "rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white no-underline";
  }
  return "rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 no-underline";
}

// Render avatar fallback theo tên/email user khi chưa có ảnh.
function UserAvatar({ user }) {
  if (user?.avatarUrl) {
    return (
      <img
        alt="avatar"
        className="h-10 w-10 rounded-full border border-slate-200 object-cover"
        src={user.avatarUrl}
      />
    );
  }

  const fallbackText = (user?.displayName || user?.email || "U").slice(0, 1).toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
      {fallbackText}
    </div>
  );
}

// Shell riêng cho patient: top navigation sáng giống mẫu clinical dashboard.
function PatientShell({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-6">
            <NavLink className="no-underline" to={ROUTES.app.patient.overview}>
              <span className="text-2xl font-extrabold tracking-tight text-brand-700">PickYourDoc</span>
            </NavLink>
            <nav className="hidden items-center gap-1 lg:flex">
              {PATIENT_NAV_ITEMS.map((item) => (
                <NavLink key={item.to} className={getPatientNavClass} to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <UserAvatar user={user} />
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-slate-900">
                Chào, {user?.displayName || "Bạn"}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <NavLink className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.profile}>
              Tài khoản
            </NavLink>
            <button className="btn-soft px-4 py-2 text-sm" onClick={onLogout} type="button">
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 lg:hidden">
          <div className="mx-auto flex w-full max-w-[1320px] gap-2 overflow-x-auto">
            {PATIENT_MOBILE_ITEMS.map((item) => (
              <NavLink key={item.to} className={getPatientMobileNavClass} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}

// Shell riêng cho doctor: sidebar xanh đậm + topbar dữ liệu.
function DoctorShell({ user, onLogout }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Đóng drawer mobile sau khi chọn một mục để tránh che màn hình.
  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 bg-gradient-to-b from-brand-700 via-brand-800 to-brand-900 p-5 text-white lg:block">
          <div className="mb-6 border-b border-white/20 pb-4">
            <p className="text-2xl font-bold tracking-tight">PickYourDoc</p>
            <p className="mt-1 text-xs text-blue-100">Doctor Console</p>
          </div>
          <nav className="space-y-1">
            {DOCTOR_NAV_ITEMS.map((item) => (
              <NavLink key={item.to} className={getDoctorNavClass} to={item.to}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  className="btn-soft px-3 py-2 text-sm lg:hidden"
                  onClick={() => setIsDrawerOpen(true)}
                  type="button"
                >
                  Menu
                </button>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Bảng Điều Khiển Bác Sĩ</h1>
                  <p className="text-sm text-slate-500">Theo dõi lịch khám và phiên tư vấn</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserAvatar user={user} />
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-slate-900">
                    Chào, {user?.displayName || "Bác sĩ"}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <button className="btn-soft px-4 py-2 text-sm" onClick={onLogout} type="button">
                  Đăng xuất
                </button>
              </div>
            </div>
          </header>

          {isDrawerOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                className="absolute inset-0 bg-black/40"
                onClick={handleCloseDrawer}
                type="button"
              />
              <aside className="absolute left-0 top-0 h-full w-[280px] bg-gradient-to-b from-brand-700 via-brand-800 to-brand-900 p-5 text-white shadow-2xl">
                <div className="mb-6 flex items-center justify-between border-b border-white/20 pb-4">
                  <p className="text-2xl font-bold tracking-tight">PickYourDoc</p>
                  <button
                    className="rounded-lg bg-white/20 px-3 py-1 text-sm"
                    onClick={handleCloseDrawer}
                    type="button"
                  >
                    Đóng
                  </button>
                </div>
                <nav className="space-y-1">
                  {DOCTOR_NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.to}
                      className={getDoctorNavClass}
                      onClick={handleCloseDrawer}
                      to={item.to}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </nav>
              </aside>
            </div>
          ) : null}

          <main className="flex-1 px-4 py-6 md:px-6">
            <div className="mx-auto w-full max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// Layout bảo vệ route theo role và render shell tương ứng cho từng khu vực app.
export function RoleLayout({ allowedRoles }) {
  const { role, isAuthenticated, logout, user, isBootstrapping } = useAuth();

  // Chờ bootstrap profile hoàn tất để tránh điều hướng nhầm khi reload.
  if (isBootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Đang đồng bộ phiên đăng nhập...</p>
      </main>
    );
  }

  // Chặn truy cập nếu chưa đăng nhập.
  if (!isAuthenticated) {
    return <Navigate replace to={ROUTES.public.login} />;
  }

  // Chặn truy cập nếu role hiện tại không có quyền vào khu vực này.
  if (!allowedRoles.includes(role)) {
    return <Navigate replace to={ROUTES.system.forbidden} />;
  }

  // Chọn shell đúng theo role để giữ trải nghiệm nhất quán toàn app.
  if (role === "doctor") {
    return <DoctorShell onLogout={logout} user={user} />;
  }

  if (role === "patient") {
    return <PatientShell onLogout={logout} user={user} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Admin Zone</h2>
        <p className="mt-1 text-sm text-slate-600">Khu vực admin đang ở chế độ tối giản cho MVP.</p>
        <div className="mt-4 flex gap-2">
          <NavLink className="btn-primary px-4 py-2 text-sm" to={ROUTES.app.admin.overview}>
            Vào dashboard
          </NavLink>
          <button className="btn-soft px-4 py-2 text-sm" onClick={logout} type="button">
            Đăng xuất
          </button>
        </div>
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

