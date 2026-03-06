import { useState } from "react";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../lib/routes";

const PATIENT_NAV_ITEMS = [
  { label: "Bảng điều khiển", to: ROUTES.app.patient.overview, icon: "🏠" },
  { label: "Tìm bác sĩ", to: ROUTES.app.patient.doctors, icon: "🔎" },
  { label: "Lịch hẹn", to: ROUTES.app.patient.appointments, icon: "📅" },
  { label: "Hồ sơ gia đình", to: ROUTES.app.patient.family, icon: "👨‍👩‍👧‍👦" },
  { label: "Bác sĩ gia đình", to: ROUTES.app.patient.familyDoctor, icon: "🩺" },
  { label: "Tin nhắn", to: ROUTES.app.patient.messages, icon: "💬" },
  { label: "Thông báo", to: ROUTES.app.patient.notifications, icon: "🔔" },
  { label: "Gói dịch vụ", to: ROUTES.app.patient.subscriptionPlans, icon: "💳" },
  { label: "Tài khoản", to: ROUTES.app.patient.profile, icon: "👤" },
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

// Trả class cho link trong sidebar để dùng chung cho patient/doctor.
function getSidebarNavClass({ isActive }) {
  if (isActive) {
    return "flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 text-sm font-semibold text-white no-underline";
  }
  return "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white hover:no-underline";
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

// Render shell sidebar dùng chung cho các role cần giao diện kiểu console.
function SidebarShell({ navItems, shellTitle, shellSubtitle, heading, description, user, onLogout }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Đóng drawer mobile sau khi chọn một mục để tránh che nội dung.
  function handleCloseDrawer() {
    setIsDrawerOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 bg-gradient-to-b from-brand-700 via-brand-800 to-brand-900 p-5 text-white lg:block">
          <div className="mb-6 border-b border-white/20 pb-4">
            <p className="text-2xl font-bold tracking-tight">PickYourDoc</p>
            <p className="mt-1 text-xs text-blue-100">{shellSubtitle}</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} className={getSidebarNavClass} to={item.to}>
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
                  <h1 className="text-xl font-bold text-slate-900">{heading}</h1>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <UserAvatar user={user} />
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-slate-900">
                    Chào, {user?.displayName || shellTitle}
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
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      className={getSidebarNavClass}
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

// Shell riêng cho patient dùng side navigation kiểu console.
function PatientShell({ user, onLogout }) {
  return (
    <SidebarShell
      description="Quản lý lịch hẹn và hồ sơ sức khỏe gia đình"
      heading="Bảng Điều Khiển Bệnh Nhân"
      navItems={PATIENT_NAV_ITEMS}
      onLogout={onLogout}
      shellSubtitle="Patient Console"
      shellTitle="Bạn"
      user={user}
    />
  );
}

// Shell riêng cho doctor với side navigation dữ liệu.
function DoctorShell({ user, onLogout }) {
  return (
    <SidebarShell
      description="Theo dõi lịch khám và phiên tư vấn"
      heading="Bảng Điều Khiển Bác Sĩ"
      navItems={DOCTOR_NAV_ITEMS}
      onLogout={onLogout}
      shellSubtitle="Doctor Console"
      shellTitle="Bác sĩ"
      user={user}
    />
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
