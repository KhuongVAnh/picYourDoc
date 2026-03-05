import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoctorPatientsApi } from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Tạo fallback avatar cho bệnh nhân khi chưa có ảnh đại diện.
function buildPatientFallbackAvatar(fullName) {
  const encodedName = encodeURIComponent(fullName || "Patient");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=1DAAA0&color=FFFFFF`;
}

// Trang danh sách bệnh nhân bác sĩ đang theo dõi.
export function DoctorPatientsPage() {
  const { accessToken } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");

  // Tải danh sách bệnh nhân theo keyword tìm kiếm.
  useEffect(() => {
    let ignore = false;

    async function loadPatients() {
      try {
        const response = await getDoctorPatientsApi(
          {
            page: 1,
            limit: 30,
            q: keyword || undefined,
          },
          accessToken
        );
        if (!ignore) {
          setPatients(response.data || []);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải danh sách bệnh nhân");
        }
      }
    }

    loadPatients();
    return () => {
      ignore = true;
    };
  }, [accessToken, keyword]);

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Danh sách bệnh nhân</h2>
        <input
          className="input-base w-[280px]"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên bệnh nhân..."
          value={keyword}
        />
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {patients.length === 0 ? (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500">Chưa có bệnh nhân nào.</p>
        </article>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {patients.map((patient) => (
            <article className="surface-card p-4" key={patient.memberId}>
              <div className="flex items-start gap-3">
                <img
                  alt={patient.fullName}
                  className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                  src={patient.avatarUrl || buildPatientFallbackAvatar(patient.fullName)}
                />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{patient.fullName}</p>
                  <p className="text-sm text-slate-700">
                    {patient.relation} • {patient.gender}
                  </p>
                  <p className="text-sm text-slate-700">
                    Ngày sinh: {patient.dateOfBirth ? formatDateTime(patient.dateOfBirth) : "-"}
                  </p>
                  <p className="text-sm text-slate-700">Family: {patient.familyName}</p>
                  <Link className="btn-soft mt-2 inline-flex px-3 py-1.5 text-xs" to={ROUTES.app.doctor.patientOverview(patient.memberId)}>
                    Mở overview
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
