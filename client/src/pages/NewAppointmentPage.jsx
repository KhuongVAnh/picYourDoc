import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  createAppointmentApi,
  getDoctorDetailApi,
  getDoctorsApi,
  rescheduleAppointmentApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trang tạo mới/đổi lịch hẹn theo mode slot hoặc đề xuất giờ.
export function NewAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get("doctorId") || "");
  const [doctorDetail, setDoctorDetail] = useState(null);
  const [mode, setMode] = useState("slot");
  const [slotId, setSlotId] = useState("");
  const [proposedStartAt, setProposedStartAt] = useState("");
  const [proposedEndAt, setProposedEndAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rescheduleOf = searchParams.get("rescheduleOf");

  // Tải danh sách bác sĩ để user chọn khi tạo lịch.
  useEffect(() => {
    let ignore = false;

    async function loadDoctors() {
      try {
        const response = await getDoctorsApi({ page: 1, limit: 50, sortBy: "rating" });
        if (!ignore) {
          setDoctors(response.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải danh sách bác sĩ");
        }
      }
    }

    loadDoctors();
    return () => {
      ignore = true;
    };
  }, []);

  // Tải chi tiết bác sĩ để hiển thị slot khả dụng.
  useEffect(() => {
    let ignore = false;

    async function loadDoctorDetail() {
      if (!selectedDoctorId) {
        setDoctorDetail(null);
        return;
      }

      try {
        const response = await getDoctorDetailApi(selectedDoctorId, accessToken);
        if (!ignore) {
          setDoctorDetail(response.data);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải slot bác sĩ");
        }
      }
    }

    loadDoctorDetail();
    return () => {
      ignore = true;
    };
  }, [selectedDoctorId, accessToken]);

  // Submit form tạo lịch mới hoặc đổi lịch.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!selectedDoctorId) {
        throw new Error("Vui lòng chọn bác sĩ");
      }

      let payload;
      if (mode === "slot") {
        if (!slotId) {
          throw new Error("Vui lòng chọn slot");
        }
        payload = {
          doctorId: selectedDoctorId,
          slotId,
          reason,
        };
      } else {
        if (!proposedStartAt || !proposedEndAt) {
          throw new Error("Vui lòng nhập đủ giờ đề xuất");
        }
        payload = {
          doctorId: selectedDoctorId,
          proposedStartAt: new Date(proposedStartAt).toISOString(),
          proposedEndAt: new Date(proposedEndAt).toISOString(),
          reason,
        };
      }

      if (rescheduleOf) {
        // Luồng đổi lịch: gọi endpoint reschedule cho lịch gốc.
        await rescheduleAppointmentApi(
          rescheduleOf,
          {
            ...payload,
            rescheduleReason: "Bệnh nhân chủ động đổi lịch",
          },
          accessToken
        );
      } else {
        // Luồng tạo lịch mới.
        await createAppointmentApi(payload, accessToken);
      }

      navigate(ROUTES.app.patient.appointments);
    } catch (apiError) {
      setError(apiError.message || "Không thể tạo lịch hẹn");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {rescheduleOf ? "Đổi lịch hẹn" : "Tạo lịch hẹn mới"}
        </h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.appointments}>
          Quay lại lịch hẹn
        </Link>
      </header>

      <article className="surface-card p-5">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-slate-700">
            Chọn bác sĩ
            <select
              className="input-base mt-1"
              onChange={(event) => {
                setSelectedDoctorId(event.target.value);
                setSlotId("");
              }}
              value={selectedDoctorId}
            >
              <option value="">-- Chọn bác sĩ --</option>
              {doctors.map((doctor) => (
                <option key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.fullName} - {doctor.specialty} ({doctor.location})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Chế độ đặt lịch
            <select className="input-base mt-1" onChange={(event) => setMode(event.target.value)} value={mode}>
              <option value="slot">Chọn slot có sẵn</option>
              <option value="proposal">Đề xuất giờ</option>
            </select>
          </label>

          {mode === "slot" ? (
            <label className="text-sm font-medium text-slate-700">
              Chọn slot
              <select className="input-base mt-1" onChange={(event) => setSlotId(event.target.value)} value={slotId}>
                <option value="">-- Chọn khung giờ --</option>
                {(doctorDetail?.availableSlots || []).map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Giờ bắt đầu đề xuất
                <input
                  className="input-base mt-1"
                  onChange={(event) => setProposedStartAt(event.target.value)}
                  type="datetime-local"
                  value={proposedStartAt}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Giờ kết thúc đề xuất
                <input
                  className="input-base mt-1"
                  onChange={(event) => setProposedEndAt(event.target.value)}
                  type="datetime-local"
                  value={proposedEndAt}
                />
              </label>
            </div>
          )}

          <label className="text-sm font-medium text-slate-700">
            Lý do khám
            <textarea
              className="input-base mt-1 min-h-[96px]"
              onChange={(event) => setReason(event.target.value)}
              placeholder="Mô tả triệu chứng hoặc nhu cầu tư vấn"
              value={reason}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button className="btn-primary w-fit px-4 py-2 text-sm" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang xử lý..." : rescheduleOf ? "Xác nhận đổi lịch" : "Tạo lịch hẹn"}
          </button>
        </form>
      </article>
    </section>
  );
}
