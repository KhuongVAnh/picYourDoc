import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getIncomingFamilyDoctorRequestsApi,
  respondFamilyDoctorRequestApi,
  updateDoctorIntakeStatusApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trang cài đặt bác sĩ với quản lý intake và request bác sĩ gia đình.
export function DoctorSettingsPage() {
  const { accessToken } = useAuth();
  const [intakeStatus, setIntakeStatus] = useState("OPEN");
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [isUpdatingIntake, setIsUpdatingIntake] = useState(false);
  const [respondingId, setRespondingId] = useState("");

  // Tải danh sách yêu cầu bác sĩ gia đình chờ duyệt.
  async function loadIncomingRequests() {
    const response = await getIncomingFamilyDoctorRequestsApi(
      {
        status: "PENDING",
        page: 1,
        limit: 20,
      },
      accessToken
    );
    setRequests(response.data || []);
  }

  // Tải dữ liệu trang settings khi mở trang.
  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setError("");
        await loadIncomingRequests();
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải cài đặt bác sĩ.");
        }
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  // Cập nhật trạng thái mở/đóng nhận bệnh nhân bác sĩ gia đình.
  async function handleUpdateIntakeStatus() {
    setError("");
    setIsUpdatingIntake(true);
    try {
      await updateDoctorIntakeStatusApi({ intakeStatus }, accessToken);
    } catch (apiError) {
      setError(apiError.message || "Không thể cập nhật intake status.");
    } finally {
      setIsUpdatingIntake(false);
    }
  }

  // Phản hồi request bác sĩ gia đình theo hành động approve/reject.
  async function handleRespondRequest(requestId, action) {
    setError("");
    setRespondingId(requestId);
    try {
      await respondFamilyDoctorRequestApi(
        requestId,
        {
          action,
        },
        accessToken
      );
      await loadIncomingRequests();
    } catch (apiError) {
      setError(apiError.message || "Không thể phản hồi yêu cầu.");
    } finally {
      setRespondingId("");
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Cài đặt</h2>
        <p className="mt-1 text-sm text-slate-600">
          Quản lý trạng thái nhận bệnh nhân và duyệt yêu cầu bác sĩ gia đình.
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Trạng thái nhận bệnh nhân mới</h3>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ khi ở trạng thái <span className="font-semibold">OPEN</span> thì bệnh nhân mới gửi được yêu cầu.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select className="input-base w-[220px]" onChange={(event) => setIntakeStatus(event.target.value)} value={intakeStatus}>
            <option value="OPEN">OPEN - Đang nhận bệnh nhân</option>
            <option value="PAUSED">PAUSED - Tạm dừng nhận</option>
          </select>
          <button className="btn-primary px-4 py-2 text-sm" disabled={isUpdatingIntake} onClick={handleUpdateIntakeStatus} type="button">
            {isUpdatingIntake ? "Đang cập nhật..." : "Cập nhật intake"}
          </button>
        </div>
      </article>

      <article className="surface-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">Yêu cầu bác sĩ gia đình chờ duyệt</h3>
          <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.doctor.patients}>
            Mở danh sách bệnh nhân
          </Link>
        </div>

        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">Không có yêu cầu chờ duyệt.</p>
        ) : (
          <div className="grid gap-3">
            {requests.map((request) => (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={request.id}>
                <p className="text-sm font-semibold text-slate-900">
                  {request.patient?.displayName || request.patient?.email || request.patientUserId}
                </p>
                <p className="text-xs text-slate-600">
                  Chu kỳ thuê: {request.billingCycle === "WEEKLY" ? "Theo tuần" : "Theo tháng"}
                </p>
                <p className="text-xs text-slate-600">
                  Số tiền: {Number(request.billingAmount || 0).toLocaleString("vi-VN")} VND
                </p>
                {request.paymentReference ? (
                  <p className="text-xs text-slate-600">Mã giao dịch: {request.paymentReference}</p>
                ) : null}
                <p className="text-xs text-slate-600">Yêu cầu lúc: {formatDateTime(request.requestedAt)}</p>
                {request.requestNote ? (
                  <p className="mt-1 text-sm text-slate-700">Ghi chú: {request.requestNote}</p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn-primary px-3 py-1.5 text-xs"
                    disabled={respondingId === request.id}
                    onClick={() => handleRespondRequest(request.id, "APPROVE")}
                    type="button"
                  >
                    Duyệt
                  </button>
                  <button
                    className="btn-soft px-3 py-1.5 text-xs"
                    disabled={respondingId === request.id}
                    onClick={() => handleRespondRequest(request.id, "REJECT")}
                    type="button"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
