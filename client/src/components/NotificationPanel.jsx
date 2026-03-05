import { useEffect, useMemo, useState } from "react";
import { getNotificationsApi, markNotificationReadApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";

// Panel hiển thị thông báo in-app và cho phép đánh dấu đã đọc.
export function NotificationPanel() {
  const { accessToken, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải danh sách thông báo mới nhất cho user đang đăng nhập.
  useEffect(() => {
    let ignore = false;

    async function loadNotifications() {
      if (!isAuthenticated || !accessToken) {
        setNotifications([]);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await getNotificationsApi({ page: 1, limit: 8 }, accessToken);
        if (!ignore) {
          setNotifications(response.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải thông báo");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadNotifications();
    return () => {
      ignore = true;
    };
  }, [accessToken, isAuthenticated]);

  // Tính số lượng thông báo chưa đọc để hiển thị badge.
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications]
  );

  // Đánh dấu một thông báo đã đọc ngay trên UI.
  async function handleMarkRead(notificationId) {
    try {
      await markNotificationReadApi(notificationId, accessToken);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
    } catch (apiError) {
      setError(apiError.message || "Không thể cập nhật thông báo");
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Thông báo</h3>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Chưa đọc: {unreadCount}
        </span>
      </div>

      {isLoading ? <p className="meta-text">Đang tải thông báo...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!isLoading && notifications.length === 0 ? (
        <p className="meta-text">Chưa có thông báo nào.</p>
      ) : null}

      <ul className="space-y-3">
        {notifications.map((item) => (
          <li
            key={item.id}
            className={`rounded-xl border p-3 ${
              item.readAt ? "border-slate-200 bg-slate-50" : "border-brand-100 bg-brand-50"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="font-medium text-slate-900">{item.title}</p>
              {!item.readAt ? (
                <button
                  className="text-xs font-semibold text-brand-700 underline"
                  type="button"
                  onClick={() => handleMarkRead(item.id)}
                >
                  Đánh dấu đã đọc
                </button>
              ) : null}
            </div>
            <p className="text-sm text-slate-700">{item.content}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
