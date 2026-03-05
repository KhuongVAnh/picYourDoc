import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAppointmentsApi, getDoctorsApi, getFamilyApi, getMySubscriptionApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Tạo fallback avatar theo tên bác sĩ khi thiếu ảnh từ server.
function buildDoctorFallbackAvatar(fullName) {
  const encodedName = encodeURIComponent(fullName || "Doctor");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0F4C81&color=FFFFFF`;
}

// Trang tổng quan patient theo bố cục clinical dashboard gần mẫu tham chiếu.
export function PatientDashboardPage() {
  const { accessToken, user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [family, setFamily] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [error, setError] = useState("");

  // Tải dữ liệu tổng quan để hiển thị card nhanh và bác sĩ nổi bật.
  useEffect(() => {
    let ignore = false;

    async function loadOverviewData() {
      try {
        const [appointmentsRes, familyRes, subscriptionRes, doctorsRes] = await Promise.all([
          getAppointmentsApi({ page: 1, limit: 8 }, accessToken),
          getFamilyApi(accessToken),
          getMySubscriptionApi({}, accessToken),
          getDoctorsApi({ page: 1, limit: 6, sortBy: "rating", sortOrder: "desc" }),
        ]);

        if (!ignore) {
          setAppointments(appointmentsRes.data || []);
          setFamily(familyRes.data || null);
          setSubscription(subscriptionRes.data || null);
          setFeaturedDoctors(doctorsRes.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải dữ liệu tổng quan.");
        }
      }
    }

    loadOverviewData();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  // Chọn lịch hẹn gần nhất để hiển thị trong quick card.
  const nextAppointment = useMemo(() => {
    return appointments
      .filter((item) => ["REQUESTED", "CONFIRMED"].includes(item.status))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  }, [appointments]);

  return (
    <section className="space-y-4">
      <article className="surface-card relative overflow-hidden p-5 md:p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[220px] bg-gradient-to-l from-brand-100/70 to-transparent" />
        <div className="grid gap-4 md:grid-cols-[1.5fr_220px] md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Xin chào, {user?.displayName || "bạn"}!</h2>
            <p className="mt-2 text-sm text-slate-600">
              Chào mừng đến với hệ thống chăm sóc sức khỏe gia đình PickYourDoc.
            </p>
          </div>
          <div className="hidden md:block">
            <img
              alt="Bác sĩ gia đình"
              className="h-[150px] w-full rounded-2xl object-cover"
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=640&q=80"
            />
          </div>
        </div>
      </article>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="surface-card border-l-4 border-l-brand-600 p-4">
          <p className="text-sm font-semibold text-brand-700">Lịch hẹn sắp tới</p>
          {nextAppointment ? (
            <>
              <p className="mt-2 text-xl font-bold text-slate-900">{formatDateTime(nextAppointment.startAt)}</p>
              <p className="mt-1 text-sm text-slate-600">{nextAppointment.reason || "Khám tổng quát"}</p>
              <Link className="btn-primary mt-3 inline-flex px-4 py-2 text-sm" to={ROUTES.app.patient.appointments}>
                Xem chi tiết
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">Bạn chưa có lịch hẹn sắp tới.</p>
              <Link className="btn-primary mt-3 inline-flex px-4 py-2 text-sm" to={ROUTES.app.patient.appointmentNew}>
                Đặt lịch mới
              </Link>
            </>
          )}
        </article>

        <article className="surface-card border-l-4 border-l-teal-500 p-4">
          <p className="text-sm font-semibold text-teal-700">Quản lý gia đình</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{family?.members?.length || 0}</p>
          <p className="mt-1 text-sm text-slate-600">Thành viên trong family profile</p>
          <Link className="btn-soft mt-3 inline-flex px-4 py-2 text-sm" to={ROUTES.app.patient.family}>
            Xem gia đình
          </Link>
        </article>

        <article className="surface-card border-l-4 border-l-orange-400 p-4">
          <p className="text-sm font-semibold text-orange-600">Gói dịch vụ</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{subscription?.plan?.name || "Free"}</p>
          <p className="mt-1 text-sm text-slate-600">
            Quota còn lại: {subscription?.usage?.consultSessionsRemaining ?? 0} phiên
          </p>
          <Link className="btn-warning mt-3 inline-flex px-4 py-2 text-sm" to={ROUTES.app.patient.subscriptionPlans}>
            Quản lý gói
          </Link>
        </article>
      </div>

      <article className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Bác sĩ nổi bật</h3>
          <Link className="text-sm font-semibold text-brand-700 underline" to={ROUTES.app.patient.doctors}>
            Xem tất cả
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featuredDoctors.slice(0, 4).map((doctor) => (
            <article key={doctor.doctorId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img
                alt={doctor.fullName}
                className="h-36 w-full object-cover"
                src={doctor.avatarUrl || buildDoctorFallbackAvatar(doctor.fullName)}
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-900">{doctor.fullName}</p>
                <p className="text-xs text-slate-500">{doctor.specialty}</p>
                <Link
                  className="mt-3 inline-flex text-sm font-semibold text-brand-700"
                  to={ROUTES.app.patient.doctorDetail(doctor.doctorId)}
                >
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
