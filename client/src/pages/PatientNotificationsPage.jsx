import { NotificationPanel } from "../components/NotificationPanel";

// Trang thông báo patient hiển thị danh sách reminder và cập nhật trạng thái đã đọc.
export function PatientNotificationsPage() {
  return (
    <section className="space-y-4">
      <header className="surface-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Thông báo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi nhắc lịch hẹn và các cảnh báo quan trọng từ hệ thống.
        </p>
      </header>
      <NotificationPanel />
    </section>
  );
}
