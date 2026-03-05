import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getDoctorDetailApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";

// Trang chi tiết bác sĩ (private), hiển thị profile và slot khả dụng 7 ngày tới.
export function DoctorDetailPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải chi tiết bác sĩ; nếu token không hợp lệ thì chuyển về login.
  useEffect(() => {
    let ignore = false;

    async function loadDoctorDetail() {
      if (!doctorId || !isAuthenticated || !accessToken) {
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const response = await getDoctorDetailApi(doctorId, accessToken);
        if (!ignore) {
          setDoctor(response.data);
        }
      } catch (apiError) {
        if (!ignore) {
          if (apiError.status === 401) {
            navigate("/login", { replace: true });
            return;
          }
          setError(apiError.message || "Không thể tải hồ sơ bác sĩ");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDoctorDetail();
    return () => {
      ignore = true;
    };
  }, [doctorId, accessToken, isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <article className="panel space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Chi tiết bác sĩ</h2>
        <Link className="app-link" to="/patient/doctors">
          Quay lại danh sách
        </Link>
      </header>

      {isLoading ? <p className="meta-text">Đang tải hồ sơ bác sĩ...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {doctor ? (
        <>
          <section className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-lg font-semibold text-slate-900">{doctor.fullName}</h3>
            <p className="text-sm text-slate-700">
              {doctor.specialty} - {doctor.location}
            </p>
            <p className="text-sm text-slate-700">
              Phí khám: {doctor.consultationFee.toLocaleString("vi-VN")}đ
            </p>
            <p className="text-sm text-slate-700">
              Kinh nghiệm: {doctor.yearsExperience} năm
            </p>
            <p className="text-sm text-slate-700">
              Rating: {doctor.ratingAvg} ({doctor.reviewCount} đánh giá)
            </p>
            <p className="text-sm text-slate-700">Bảo hiểm: {doctor.insurancesAccepted.join(", ")}</p>
            <p className="mt-2 text-sm text-slate-700">{doctor.bio}</p>
          </section>

          <section className="rounded-xl border border-brand-100 bg-brand-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-brand-700">Khung giờ khả dụng</h3>
              <Link
                className="app-link"
                to={`/patient/appointments/new?doctorId=${doctor.doctorId}`}
              >
                Đặt lịch ngay
              </Link>
            </div>
            {doctor.availableSlots?.length ? (
              <ul className="space-y-2">
                {doctor.availableSlots.map((slot) => (
                  <li key={slot.id} className="rounded-lg border border-brand-100 bg-white p-3">
                    <p className="text-sm text-slate-800">
                      {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-700">Hiện chưa có slot trống trong 7 ngày tới.</p>
            )}
          </section>
        </>
      ) : null}
    </article>
  );
}
