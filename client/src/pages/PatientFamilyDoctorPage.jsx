import { useEffect, useMemo, useState } from "react";
import {
  createFamilyDoctorRequestApi,
  getFamilyDoctorMarketplaceApi,
  getFamilyDoctorPricingApi,
  getMyFamilyDoctorContractApi,
  getMyFamilyDoctorRequestsApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";

// Tạo fallback avatar để hiển thị bác sĩ khi thiếu ảnh.
function buildDoctorFallbackAvatar(fullName) {
  const encodedName = encodeURIComponent(fullName || "Doctor");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0F4C81&color=FFFFFF`;
}

// Chuyển mã chu kỳ thuê thành nhãn tiếng Việt để hiển thị trong UI.
function getBillingCycleLabel(cycle) {
  if (cycle === "WEEKLY") {
    return "Theo tuần";
  }
  if (cycle === "MONTHLY") {
    return "Theo tháng";
  }
  return cycle || "-";
}

// Trang patient quản lý hợp đồng, payment info và request bác sĩ gia đình.
export function PatientFamilyDoctorPage() {
  const { accessToken } = useAuth();
  const [contractData, setContractData] = useState({ activeContracts: [], pendingRequests: [] });
  const [requests, setRequests] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [requestNote, setRequestNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [billingCycle, setBillingCycle] = useState("WEEKLY");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [submittingDoctorId, setSubmittingDoctorId] = useState("");
  const [error, setError] = useState("");

  // Tạo map option giá để tra cứu số tiền theo chu kỳ ngay tại màn hình.
  const pricingMap = useMemo(() => {
    const map = new Map();
    (pricing?.options || []).forEach((item) => {
      map.set(item.cycle, item);
    });
    return map;
  }, [pricing]);

  // Tải dữ liệu tổng hợp cho màn hình bác sĩ gia đình.
  async function loadData() {
    const [contractRes, requestsRes, marketplaceRes, pricingRes] = await Promise.all([
      getMyFamilyDoctorContractApi(accessToken),
      getMyFamilyDoctorRequestsApi(accessToken),
      getFamilyDoctorMarketplaceApi({ page: 1, limit: 12 }, accessToken),
      getFamilyDoctorPricingApi(accessToken),
    ]);

    setContractData(contractRes.data || { activeContracts: [], pendingRequests: [] });
    setRequests(requestsRes.data || []);
    setMarketplace(marketplaceRes.data || []);
    setPricing(pricingRes.data || null);
  }

  // Tải dữ liệu khi mở trang.
  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setError("");
        await loadData();
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải dữ liệu bác sĩ gia đình.");
        }
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  // Chọn bác sĩ để mở khối thanh toán thủ công và gửi yêu cầu.
  function handleSelectDoctorForPayment(doctor) {
    setSelectedDoctor(doctor);
    setBillingCycle("WEEKLY");
    setPaymentReference("");
    setRequestNote("");
    setError("");
  }

  // Đóng khối thanh toán khi user hủy thao tác gửi yêu cầu.
  function handleClosePaymentPanel() {
    setSelectedDoctor(null);
    setBillingCycle("WEEKLY");
    setPaymentReference("");
    setRequestNote("");
  }

  // Gửi yêu cầu thuê bác sĩ gia đình sau khi user đã chọn gói tuần/tháng và nhập mã giao dịch.
  async function handleCreateRequest() {
    if (!selectedDoctor?.doctorId) {
      setError("Vui lòng chọn bác sĩ trước khi gửi yêu cầu.");
      return;
    }

    setError("");
    setSubmittingDoctorId(selectedDoctor.doctorId);
    try {
      await createFamilyDoctorRequestApi(
        {
          doctorProfileId: selectedDoctor.doctorId,
          billingCycle,
          paymentReference: paymentReference || null,
          requestNote: requestNote || null,
        },
        accessToken
      );
      handleClosePaymentPanel();
      await loadData();
    } catch (apiError) {
      setError(apiError.message || "Không thể gửi yêu cầu bác sĩ gia đình.");
    } finally {
      setSubmittingDoctorId("");
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Bác sĩ gia đình</h2>
        <p className="mt-1 text-sm text-slate-600">
          Thuê bác sĩ theo tuần/tháng, chuyển khoản thủ công và theo dõi nhiều hợp đồng cùng lúc.
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Hợp đồng đang hoạt động</h3>
        {(contractData.activeContracts || []).length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Hiện chưa có hợp đồng đang hoạt động.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {contractData.activeContracts.map((contract) => (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3" key={contract.id}>
                <p className="text-sm font-semibold text-slate-900">{contract.doctor.fullName}</p>
                <p className="text-xs text-slate-600">
                  {contract.doctor.specialty} • {contract.doctor.location}
                </p>
                <p className="text-xs text-slate-600">
                  Gói: {getBillingCycleLabel(contract.billingCycle)} •{" "}
                  {Number(contract.billingAmount).toLocaleString("vi-VN")} VND
                </p>
                <p className="text-xs text-slate-600">
                  Hiệu lực: {formatDateTime(contract.contractStartsAt)} -{" "}
                  {formatDateTime(contract.contractEndsAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Yêu cầu của tôi</h3>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Chưa có yêu cầu nào.</p>
        ) : (
          <div className="mt-2 grid gap-2">
            {requests.map((request) => (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={request.id}>
                <p className="text-sm font-semibold text-slate-900">
                  {request.doctor?.fullName || "Bác sĩ chưa xác định"}
                </p>
                <p className="text-xs text-slate-600">
                  Trạng thái: {request.status} • Chu kỳ: {getBillingCycleLabel(request.billingCycle)}
                </p>
                <p className="text-xs text-slate-600">
                  Số tiền: {Number(request.billingAmount || 0).toLocaleString("vi-VN")} VND • Thanh toán:{" "}
                  {request.paymentStatus}
                </p>
                <p className="text-xs text-slate-600">
                  Gửi lúc: {formatDateTime(request.requestedAt)}
                </p>
                {request.responseNote ? (
                  <p className="text-xs text-slate-600">Phản hồi: {request.responseNote}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </article>

      {selectedDoctor ? (
        <article className="surface-card border border-sky-200 bg-sky-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Thanh toán thuê bác sĩ: {selectedDoctor.fullName}
              </h3>
              <p className="text-sm text-slate-600">
                Chọn chu kỳ thuê và chuyển khoản theo thông tin tài khoản quản trị viên.
              </p>
            </div>
            <button className="btn-soft px-3 py-1.5 text-xs" onClick={handleClosePaymentPanel} type="button">
              Đóng
            </button>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
            <p>
              Chủ tài khoản: <span className="font-semibold">{pricing?.bankAccount?.ownerName || "-"}</span>
            </p>
            <p>
              Số tài khoản: <span className="font-semibold">{pricing?.bankAccount?.accountNumber || "-"}</span>
            </p>
            <p>
              Ngân hàng: <span className="font-semibold">{pricing?.bankAccount?.bankName || "-"}</span>
            </p>
            <p>
              Nội dung chuyển khoản gợi ý:{" "}
              <span className="font-semibold">{pricing?.bankAccount?.transferNoteHint || "-"}</span>
            </p>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {(pricing?.options || []).map((option) => (
              <label
                className={`cursor-pointer rounded-lg border p-3 text-sm ${
                  billingCycle === option.cycle
                    ? "border-sky-500 bg-sky-100"
                    : "border-slate-200 bg-white"
                }`}
                key={option.cycle}
              >
                <input
                  checked={billingCycle === option.cycle}
                  className="mr-2"
                  name="billingCycle"
                  onChange={() => setBillingCycle(option.cycle)}
                  type="radio"
                />
                <span className="font-semibold">{option.label}</span>
                <span className="ml-2 text-slate-600">
                  {Number(option.price || 0).toLocaleString("vi-VN")} VND
                </span>
              </label>
            ))}
          </div>

          <p className="mt-2 text-sm font-medium text-slate-800">
            Số tiền cần chuyển:{" "}
            {Number(pricingMap.get(billingCycle)?.price || 0).toLocaleString("vi-VN")} VND
          </p>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Mã giao dịch / nội dung chuyển khoản
            <input
              className="input-base mt-1"
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder="Ví dụ: VCB123456789"
              value={paymentReference}
            />
          </label>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Ghi chú cho bác sĩ
            <textarea
              className="input-base mt-1 min-h-[88px]"
              onChange={(event) => setRequestNote(event.target.value)}
              placeholder="Ví dụ: cần theo dõi huyết áp cho mẹ, tái khám mỗi tuần..."
              value={requestNote}
            />
          </label>

          <button
            className="btn-primary mt-3 px-4 py-2 text-sm"
            disabled={submittingDoctorId === selectedDoctor.doctorId}
            onClick={handleCreateRequest}
            type="button"
          >
            {submittingDoctorId === selectedDoctor.doctorId
              ? "Đang gửi yêu cầu..."
              : "Xác nhận đã thanh toán và gửi yêu cầu"}
          </button>
        </article>
      ) : null}

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Marketplace bác sĩ gia đình</h3>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ hiện bác sĩ đang mở nhận bệnh nhân mới.
        </p>

        {marketplace.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Hiện chưa có bác sĩ mở nhận.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {marketplace.map((doctor) => (
              <article className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={doctor.doctorId}>
                <div className="flex items-start gap-3">
                  <img
                    alt={doctor.fullName}
                    className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                    src={doctor.avatarUrl || buildDoctorFallbackAvatar(doctor.fullName)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{doctor.fullName}</p>
                    <p className="text-xs text-slate-600">
                      {doctor.specialty} • {doctor.location}
                    </p>
                    <p className="text-xs text-slate-600">
                      Rating {doctor.ratingAvg} • {doctor.reviewCount} đánh giá
                    </p>
                    <p className="text-xs text-slate-600">
                      Slot gia đình: {doctor.activeFamilyCount}/{doctor.maxFamilySlots}
                    </p>
                    <button
                      className="btn-primary mt-2 px-3 py-1.5 text-xs"
                      onClick={() => handleSelectDoctorForPayment(doctor)}
                      type="button"
                    >
                      Thuê bác sĩ
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
