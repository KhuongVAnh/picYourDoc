import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getDoctorsApi } from "../lib/api";

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

// Trang danh sách bác sĩ có filter, sort, pagination và compare tối đa 3 bác sĩ.
export function DoctorsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [result, setResult] = useState({ data: [], meta: null });
  const [selectedCompareIds, setSelectedCompareIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Đồng bộ form filter từ URL query khi trang load.
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

  // Tải dữ liệu bác sĩ mỗi khi query thay đổi.
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

  // Lấy danh sách bác sĩ đang được chọn để compare.
  const comparedDoctors = useMemo(() => {
    const idSet = new Set(selectedCompareIds);
    return result.data.filter((doctor) => idSet.has(doctor.doctorId));
  }, [result.data, selectedCompareIds]);

  // Cập nhật giá trị filter trên form.
  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  // Áp dụng filter lên URL để trigger query mới.
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
    setSelectedCompareIds((prev) => {
      if (prev.includes(doctorId)) {
        return prev.filter((id) => id !== doctorId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, doctorId];
    });
  }

  // Chuyển trang theo phân trang backend trả về.
  function handleChangePage(nextPage) {
    const current = new URLSearchParams(searchParams);
    current.set("page", String(nextPage));
    setSearchParams(current);
  }

  return (
    <article className="panel space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-slate-900">Tìm kiếm bác sĩ</h2>
        <span className="meta-text">So sánh tối đa 3 bác sĩ</span>
      </header>

      <form className="grid gap-3 md:grid-cols-4" onSubmit={handleApplyFilters}>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="q"
          placeholder="Tên hoặc chuyên khoa"
          value={filters.q}
          onChange={handleFilterChange}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="specialty"
          placeholder="Chuyên khoa"
          value={filters.specialty}
          onChange={handleFilterChange}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="location"
          placeholder="Khu vực"
          value={filters.location}
          onChange={handleFilterChange}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="insurance"
          placeholder="Bảo hiểm"
          value={filters.insurance}
          onChange={handleFilterChange}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="feeMin"
          placeholder="Phí từ"
          value={filters.feeMin}
          onChange={handleFilterChange}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="feeMax"
          placeholder="Phí đến"
          value={filters.feeMax}
          onChange={handleFilterChange}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="sortBy"
          value={filters.sortBy}
          onChange={handleFilterChange}
        >
          <option value="rating">Sắp xếp theo rating</option>
          <option value="fee">Sắp xếp theo phí</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          name="sortOrder"
          value={filters.sortOrder}
          onChange={handleFilterChange}
        >
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
        <button className="app-link md:col-span-4" type="submit">
          Áp dụng bộ lọc
        </button>
      </form>

      {isLoading ? <p className="meta-text">Đang tải danh sách bác sĩ...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-3">
        {result.data.map((doctor) => (
          <div key={doctor.doctorId} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{doctor.fullName}</h3>
                <p className="text-sm text-slate-600">
                  {doctor.specialty} - {doctor.location}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="app-link"
                  type="button"
                  onClick={() => handleToggleCompare(doctor.doctorId)}
                >
                  {selectedCompareIds.includes(doctor.doctorId)
                    ? "Bỏ so sánh"
                    : "So sánh"}
                </button>
                <Link className="app-link" to={`/patient/doctors/${doctor.doctorId}`}>
                  Xem chi tiết
                </Link>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              Phí: {doctor.consultationFee.toLocaleString("vi-VN")}đ - Rating:{" "}
              {doctor.ratingAvg} ({doctor.reviewCount} đánh giá)
            </p>
            <p className="text-sm text-slate-700">
              Kinh nghiệm: {doctor.yearsExperience} năm
            </p>
            <p className="text-sm text-slate-700">
              Bảo hiểm: {(doctor.insurancesAccepted || []).join(", ") || "-"}
            </p>
          </div>
        ))}
      </div>

      {/* Bảng compare hiển thị khi người dùng đã chọn ít nhất 2 bác sĩ. */}
      {comparedDoctors.length >= 2 ? (
        <section className="rounded-xl border border-brand-100 bg-brand-50 p-4">
          <h3 className="mb-3 font-semibold text-brand-700">Bảng so sánh bác sĩ</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-brand-100 p-2 text-left">Tiêu chí</th>
                  {comparedDoctors.map((doctor) => (
                    <th key={doctor.doctorId} className="border border-brand-100 p-2 text-left">
                      {doctor.fullName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-brand-100 p-2">Chuyên khoa</td>
                  {comparedDoctors.map((doctor) => (
                    <td key={doctor.doctorId} className="border border-brand-100 p-2">
                      {doctor.specialty}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-brand-100 p-2">Khu vực</td>
                  {comparedDoctors.map((doctor) => (
                    <td key={doctor.doctorId} className="border border-brand-100 p-2">
                      {doctor.location}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-brand-100 p-2">Phí khám</td>
                  {comparedDoctors.map((doctor) => (
                    <td key={doctor.doctorId} className="border border-brand-100 p-2">
                      {doctor.consultationFee.toLocaleString("vi-VN")}đ
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-brand-100 p-2">Rating</td>
                  {comparedDoctors.map((doctor) => (
                    <td key={doctor.doctorId} className="border border-brand-100 p-2">
                      {doctor.ratingAvg}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-brand-100 p-2">Kinh nghiệm</td>
                  {comparedDoctors.map((doctor) => (
                    <td key={doctor.doctorId} className="border border-brand-100 p-2">
                      {doctor.yearsExperience} năm
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-brand-100 p-2">Bảo hiểm</td>
                  {comparedDoctors.map((doctor) => (
                    <td key={doctor.doctorId} className="border border-brand-100 p-2">
                      {(doctor.insurancesAccepted || []).join(", ") || "-"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result.meta?.totalPages > 1 ? (
        <footer className="flex items-center justify-end gap-2">
          <button
            className="app-link"
            type="button"
            disabled={result.meta.page <= 1}
            onClick={() => handleChangePage(result.meta.page - 1)}
          >
            Trang trước
          </button>
          <span className="meta-text">
            Trang {result.meta.page}/{result.meta.totalPages}
          </span>
          <button
            className="app-link"
            type="button"
            disabled={result.meta.page >= result.meta.totalPages}
            onClick={() => handleChangePage(result.meta.page + 1)}
          >
            Trang sau
          </button>
        </footer>
      ) : null}
    </article>
  );
}
