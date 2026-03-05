import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCarePlanApi,
  getHealthProfileApi,
  getMemberTimelineApi,
  upsertHealthProfileApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";

// Trả về danh sách URL ảnh hợp lệ từ dữ liệu Json bất kỳ.
function normalizeImageUrls(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

// Trang hồ sơ sức khỏe và timeline của một thành viên gia đình.
export function MemberRecordsPage() {
  const { memberId } = useParams();
  const { accessToken } = useAuth();
  const [healthProfile, setHealthProfile] = useState(null);
  const [carePlan, setCarePlan] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [allergies, setAllergies] = useState("[]");
  const [chronicConditions, setChronicConditions] = useState("[]");
  const [medications, setMedications] = useState("[]");
  const [lifestyle, setLifestyle] = useState("{}");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("{}");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Parse JSON nhập tay và ném lỗi khi định dạng không hợp lệ.
  function parseJsonInput(value, fieldName) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${fieldName} phải là JSON hợp lệ`);
    }
  }

  // Tải health profile, care plan và timeline của member hiện tại.
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!memberId) {
        return;
      }
      setError("");
      try {
        const [healthRes, timelineRes, carePlanRes] = await Promise.all([
          getHealthProfileApi(memberId, accessToken),
          getMemberTimelineApi(memberId, { page: 1, limit: 30 }, accessToken),
          getCarePlanApi(memberId, accessToken),
        ]);

        if (!ignore) {
          setHealthProfile(healthRes.data);
          setCarePlan(carePlanRes.data);
          setTimeline(timelineRes.data || []);

          const profileData = healthRes.data;
          setAllergies(JSON.stringify(profileData?.allergies || [], null, 2));
          setChronicConditions(JSON.stringify(profileData?.chronicConditions || [], null, 2));
          setMedications(JSON.stringify(profileData?.medications || [], null, 2));
          setLifestyle(JSON.stringify(profileData?.lifestyle || {}, null, 2));
          setBloodType(profileData?.bloodType || "");
          setEmergencyContact(JSON.stringify(profileData?.emergencyContact || {}, null, 2));
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải hồ sơ thành viên");
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [memberId, accessToken]);

  // Lưu hồ sơ sức khỏe sau khi parse JSON hợp lệ.
  async function handleSaveHealthProfile(event) {
    event.preventDefault();
    if (!memberId) {
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        allergies: parseJsonInput(allergies, "allergies"),
        chronicConditions: parseJsonInput(chronicConditions, "chronicConditions"),
        medications: parseJsonInput(medications, "medications"),
        lifestyle: parseJsonInput(lifestyle, "lifestyle"),
        bloodType: bloodType || null,
        emergencyContact: parseJsonInput(emergencyContact, "emergencyContact"),
      };

      const response = await upsertHealthProfileApi(memberId, payload, accessToken);
      setHealthProfile(response.data);
    } catch (apiError) {
      setError(apiError.message || "Không thể cập nhật hồ sơ sức khỏe");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Hồ sơ thành viên</h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.family}>
          Quay lại danh sách family
        </Link>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="surface-card p-5">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Health Profile</h3>
        <form className="grid gap-2" onSubmit={handleSaveHealthProfile}>
          <label className="text-sm font-medium text-slate-700">
            Allergies (JSON array)
            <textarea
              className="input-base mt-1 min-h-[88px]"
              onChange={(event) => setAllergies(event.target.value)}
              value={allergies}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Chronic conditions (JSON array)
            <textarea
              className="input-base mt-1 min-h-[88px]"
              onChange={(event) => setChronicConditions(event.target.value)}
              value={chronicConditions}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Medications (JSON array)
            <textarea
              className="input-base mt-1 min-h-[88px]"
              onChange={(event) => setMedications(event.target.value)}
              value={medications}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Lifestyle (JSON object)
            <textarea
              className="input-base mt-1 min-h-[88px]"
              onChange={(event) => setLifestyle(event.target.value)}
              value={lifestyle}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Blood type
            <input className="input-base mt-1" onChange={(event) => setBloodType(event.target.value)} value={bloodType} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Emergency contact (JSON object)
            <textarea
              className="input-base mt-1 min-h-[88px]"
              onChange={(event) => setEmergencyContact(event.target.value)}
              value={emergencyContact}
            />
          </label>
          <button className="btn-primary w-fit px-4 py-2 text-sm" disabled={isSaving} type="submit">
            {isSaving ? "Đang lưu..." : "Lưu health profile"}
          </button>
        </form>

        {healthProfile ? (
          <p className="mt-2 text-xs text-slate-500">
            Cập nhật gần nhất: {formatDateTime(healthProfile.updatedAt)}
          </p>
        ) : null}
      </article>

      <article className="surface-card p-5">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Care Plan</h3>
        {carePlan ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>Trạng thái: {carePlan.status}</p>
            <p>Chu kỳ: {carePlan.frequencyDays} ngày</p>
            <p>
              Lần follow-up tiếp theo: {carePlan.nextFollowUpAt ? formatDateTime(carePlan.nextFollowUpAt) : "-"}
            </p>
            {normalizeImageUrls(carePlan.imageUrls).length > 0 ? (
              <div className="grid gap-2 md:grid-cols-3">
                {normalizeImageUrls(carePlan.imageUrls).map((imageUrl) => (
                  <img className="h-28 w-full rounded-xl object-cover" key={imageUrl} src={imageUrl} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chưa có care plan cho thành viên này.</p>
        )}
      </article>

      <article className="surface-card p-5">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Timeline điều trị</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có timeline entries.</p>
        ) : (
          <div className="grid gap-3">
            {timeline.map((entry) => (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3" key={entry.id}>
                <p className="text-sm font-semibold text-slate-900">
                  {entry.entryType} - {entry.title}
                </p>
                <p className="text-sm text-slate-700">{entry.summary}</p>
                {normalizeImageUrls(entry.imageUrls).length > 0 ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {normalizeImageUrls(entry.imageUrls).map((imageUrl) => (
                      <img className="h-24 w-full rounded-lg object-cover" key={imageUrl} src={imageUrl} />
                    ))}
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
