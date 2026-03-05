import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getDoctorDetailApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Tạo fallback avatar để hiển thị khi bác sĩ chưa có ảnh chân dung.
function buildDoctorFallbackAvatar(fullName) {
  const encodedName = encodeURIComponent(fullName || "Doctor");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0F4C81&color=FFFFFF`;
}

// Trang chi tiết bác sĩ private, hiển thị profile và slot còn trống.
export function DoctorDetailPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải chi tiết bác sĩ; nếu token không hợp lệ thì chuyển về trang đăng nhập.
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
            navigate(ROUTES.public.login, { replace: true });
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
    return <Navigate replace to={ROUTES.public.login} />;
  }

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Chi tiết bác sĩ</h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.doctors}>
          Quay lại danh sách
        </Link>
      </header>

      {isLoading ? <p className="text-sm text-slate-600">Đang tải hồ sơ bác sĩ...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {doctor ? (
        <>
          <article className="surface-card p-5">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <img
                alt={doctor.fullName}
                className="h-52 w-full rounded-2xl object-cover"
                src={doctor.avatarUrl || buildDoctorFallbackAvatar(doctor.fullName)}
              />
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">{doctor.fullName}</h3>
                <p className="text-sm text-slate-600">
                  {doctor.specialty} • {doctor.location}
                </p>
                <p className="text-sm text-slate-600">
                  Phí khám: <span className="font-semibold text-slate-800">{doctor.consultationFee.toLocaleString("vi-VN")}đ</span>
                </p>
                <p className="text-sm text-slate-600">
                  Kinh nghiệm: {doctor.yearsExperience} năm • Rating: {doctor.ratingAvg} ({doctor.reviewCount} đánh giá)
                </p>
                <p className="text-sm text-slate-600">
                  Bảo hiểm: {(doctor.insurancesAccepted || []).join(", ") || "-"}
                </p>
                <p className="pt-1 text-sm text-slate-700">{doctor.bio}</p>
              </div>
            </div>
          </article>

          <article className="surface-card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Khung giờ khả dụng (7 ngày)</h3>
              <Link
                className="btn-primary px-4 py-2 text-sm"
                to={`${ROUTES.app.patient.appointmentNew}?doctorId=${doctor.doctorId}`}
              >
                Đặt lịch ngay
              </Link>
            </div>

            {doctor.availableSlots?.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {doctor.availableSlots.map((slot) => (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={slot.id}>
                    <p className="text-sm text-slate-700">
                      {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Hiện chưa có slot trống trong 7 ngày tới.</p>
            )}
          </article>
        </>
      ) : null}
    </section>
  );
}
