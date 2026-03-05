import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getDoctorsApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { ROUTES } from "../lib/routes";

const INITIAL_FILTERS = {
  q: "",
  specialty: "",
  location: "",
  feeMin: "",
  feeMax: "",
  insurance: "",
  sortBy: "rating",
  sortOrder: "desc",
};

// Tạo fallback avatar theo tên để card bác sĩ luôn có hình đại diện.
function buildDoctorFallbackAvatar(fullName) {
  const encodedName = encodeURIComponent(fullName || "Doctor");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=0F4C81&color=FFFFFF`;
}

// Trả URL chi tiết bác sĩ theo ngữ cảnh public hay app zone.
function buildDoctorDetailRoute({ pathname, doctorId, isAuthenticated, role }) {
  if (pathname.startsWith("/app/patient")) {
    return ROUTES.app.patient.doctorDetail(doctorId);
  }

  if (isAuthenticated && role === "patient") {
    return ROUTES.app.patient.doctorDetail(doctorId);
  }

  if (isAuthenticated && role === "doctor") {
    return ROUTES.app.doctor.overview;
  }

  return `${ROUTES.public.login}?redirect=${encodeURIComponent(
    ROUTES.app.patient.doctorDetail(doctorId)
  )}`;
}

// Trang danh sách bác sĩ có filter, pagination và compare tối đa 3 bác sĩ.
export function DoctorsListPage() {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [result, setResult] = useState({ data: [], meta: null });
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Đồng bộ form filter từ URL query để giữ trạng thái khi share đường dẫn.
  useEffect(() => {
    setFilters({
      q: searchParams.get("q") || "",
      specialty: searchParams.get("specialty") || "",
      location: searchParams.get("location") || "",
      feeMin: searchParams.get("feeMin") || "",
      feeMax: searchParams.get("feeMax") || "",
      insurance: searchParams.get("insurance") || "",
      sortBy: searchParams.get("sortBy") || "rating",
      sortOrder: searchParams.get("sortOrder") || "desc",
    });
  }, [searchParams]);

  // Tải danh sách bác sĩ khi query thay đổi.
  useEffect(() => {
    let ignore = false;

    async function loadDoctors() {
      setIsLoading(true);
      setError("");
      try {
        const response = await getDoctorsApi({
          q: searchParams.get("q") || "",
          specialty: searchParams.get("specialty") || "",
          location: searchParams.get("location") || "",
          feeMin: searchParams.get("feeMin") || "",
          feeMax: searchParams.get("feeMax") || "",
          insurance: searchParams.get("insurance") || "",
          sortBy: searchParams.get("sortBy") || "rating",
          sortOrder: searchParams.get("sortOrder") || "desc",
          page: searchParams.get("page") || "1",
          limit: searchParams.get("limit") || "10",
        });

        if (!ignore) {
          setResult(response);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải danh sách bác sĩ");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDoctors();
    return () => {
      ignore = true;
    };
  }, [searchParams]);

  // Lấy danh sách bác sĩ được chọn để hiển thị bảng so sánh.
  const comparedDoctors = useMemo(() => {
    const idSet = new Set(selectedCompareIds);
    return result.data.filter((doctor) => idSet.has(doctor.doctorId));
  }, [result.data, selectedCompareIds]);

  // Cập nhật filter trên form.
  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  // Áp dụng filter lên URL để trigger query mới từ backend.
  function handleApplyFilters(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      }
    });
    next.set("page", "1");
    next.set("limit", searchParams.get("limit") || "10");
    setSearchParams(next);
  }

  // Chọn hoặc bỏ chọn bác sĩ để compare, tối đa 3 người.
  function handleToggleCompare(doctorId) {
    setSelectedCompareIds((previous) => {
      if (previous.includes(doctorId)) {
        return previous.filter((id) => id !== doctorId);
      }
      if (previous.length >= 3) {
        return previous;
      }
      return [...previous, doctorId];
    });
  }

  // Chuyển trang theo phân trang backend.
  function handleChangePage(nextPage) {
    const current = new URLSearchParams(searchParams);
    current.set("page", String(nextPage));
    setSearchParams(current);
  }

  return (
    <section className="space-y-4">
      <article className="surface-card sticky top-[84px] z-20 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Tìm bác sĩ phù hợp</h2>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            So sánh tối đa 3 bác sĩ
          </span>
        </div>

        <form className="grid gap-2 md:grid-cols-4" onSubmit={handleApplyFilters}>
          <input
            className="input-base"
            name="q"
            onChange={handleFilterChange}
            placeholder="Tên hoặc chuyên khoa"
            value={filters.q}
          />
          <input
            className="input-base"
            name="specialty"
            onChange={handleFilterChange}
            placeholder="Chuyên khoa"
            value={filters.specialty}
          />
          <input
            className="input-base"
            name="location"
            onChange={handleFilterChange}
            placeholder="Khu vực"
            value={filters.location}
          />
          <input
            className="input-base"
            name="insurance"
            onChange={handleFilterChange}
            placeholder="Bảo hiểm"
            value={filters.insurance}
          />
          <input
            className="input-base"
            name="feeMin"
            onChange={handleFilterChange}
            placeholder="Phí từ"
            value={filters.feeMin}
          />
          <input
            className="input-base"
            name="feeMax"
            onChange={handleFilterChange}
            placeholder="Phí đến"
            value={filters.feeMax}
          />
          <select className="input-base" name="sortBy" onChange={handleFilterChange} value={filters.sortBy}>
            <option value="rating">Sort: Rating</option>
            <option value="fee">Sort: Fee</option>
          </select>
          <select
            className="input-base"
            name="sortOrder"
            onChange={handleFilterChange}
            value={filters.sortOrder}
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>

          <button className="btn-primary md:col-span-4 px-4 py-2 text-sm" type="submit">
            Áp dụng bộ lọc
          </button>
        </form>
      </article>

      {isLoading ? <p className="text-sm text-slate-600">Đang tải danh sách bác sĩ...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {result.data.map((doctor) => {
          const detailRoute = buildDoctorDetailRoute({
            pathname: location.pathname,
            doctorId: doctor.doctorId,
            isAuthenticated,
            role,
          });

          return (
            <article key={doctor.doctorId} className="surface-card overflow-hidden p-0">
              <img
                alt={doctor.fullName}
                className="h-44 w-full object-cover"
                src={doctor.avatarUrl || buildDoctorFallbackAvatar(doctor.fullName)}
              />
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{doctor.fullName}</p>
                  <p className="text-sm text-slate-600">
                    {doctor.specialty} • {doctor.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-semibold text-slate-700">Phí khám</p>
                    <p>{doctor.consultationFee.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="font-semibold text-slate-700">Rating</p>
                    <p>
                      {doctor.ratingAvg} ({doctor.reviewCount})
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Bảo hiểm: {(doctor.insurancesAccepted || []).join(", ") || "-"}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-soft px-3 py-2 text-xs"
                    onClick={() => handleToggleCompare(doctor.doctorId)}
                    type="button"
                  >
                    {selectedCompareIds.includes(doctor.doctorId) ? "Bỏ so sánh" : "So sánh"}
                  </button>
                  <Link className="btn-primary px-3 py-2 text-xs" to={detailRoute}>
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {comparedDoctors.length >= 2 ? (
        <article className="surface-card overflow-hidden p-0">
          <div className="border-b border-brand-100 bg-brand-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-brand-700">Bảng so sánh bác sĩ</h3>
          </div>
          <div className="overflow-x-auto px-4 py-3">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-slate-200 p-2 text-left">Tiêu chí</th>
                  {comparedDoctors.map((doctor) => (
                    <th className="border border-slate-200 p-2 text-left" key={doctor.doctorId}>
                      {doctor.fullName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-2">Chuyên khoa</td>
                  {comparedDoctors.map((doctor) => (
                    <td className="border border-slate-200 p-2" key={doctor.doctorId}>
                      {doctor.specialty}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">Khu vực</td>
                  {comparedDoctors.map((doctor) => (
                    <td className="border border-slate-200 p-2" key={doctor.doctorId}>
                      {doctor.location}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">Phí khám</td>
                  {comparedDoctors.map((doctor) => (
                    <td className="border border-slate-200 p-2" key={doctor.doctorId}>
                      {doctor.consultationFee.toLocaleString("vi-VN")}đ
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">Rating</td>
                  {comparedDoctors.map((doctor) => (
                    <td className="border border-slate-200 p-2" key={doctor.doctorId}>
                      {doctor.ratingAvg}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">Kinh nghiệm</td>
                  {comparedDoctors.map((doctor) => (
                    <td className="border border-slate-200 p-2" key={doctor.doctorId}>
                      {doctor.yearsExperience} năm
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {result.meta?.totalPages > 1 ? (
        <footer className="flex items-center justify-end gap-2">
          <button
            className="btn-soft px-4 py-2 text-sm"
            disabled={result.meta.page <= 1}
            onClick={() => handleChangePage(result.meta.page - 1)}
            type="button"
          >
            Trang trước
          </button>
          <span className="text-sm text-slate-500">
            Trang {result.meta.page}/{result.meta.totalPages}
          </span>
          <button
            className="btn-soft px-4 py-2 text-sm"
            disabled={result.meta.page >= result.meta.totalPages}
            onClick={() => handleChangePage(result.meta.page + 1)}
            type="button"
          >
            Trang sau
          </button>
        </footer>
      ) : null}
    </section>
  );
}
