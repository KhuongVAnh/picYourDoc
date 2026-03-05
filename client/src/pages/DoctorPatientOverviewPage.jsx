import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createTimelineNoteApi,
  getDoctorPatientOverviewApi,
  upsertCarePlanApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";
import { uploadOptimizedImage } from "../lib/cloudinary";

// Chuẩn hóa mảng URL ảnh để render timeline/care plan an toàn.
function normalizeImageUrls(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

// Trang overview bệnh nhân cho bác sĩ gồm PHR, timeline và care plan editor.
export function DoctorPatientOverviewPage() {
  const { memberId } = useParams();
  const { accessToken } = useAuth();
  const [overview, setOverview] = useState(null);
  const [carePlanStatus, setCarePlanStatus] = useState("ACTIVE");
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [medicationPlan, setMedicationPlan] = useState("{}");
  const [lifestyleGoals, setLifestyleGoals] = useState("{}");
  const [carePlanImageUrls, setCarePlanImageUrls] = useState([]);
  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineSummary, setTimelineSummary] = useState("");
  const [timelineImageUrls, setTimelineImageUrls] = useState([]);
  const [isUploadingCarePlanImage, setIsUploadingCarePlanImage] = useState(false);
  const [isUploadingTimelineImage, setIsUploadingTimelineImage] = useState(false);
  const [error, setError] = useState("");

  // Parse JSON nhập tay cho form care plan.
  function parseJsonInput(value, fieldName) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${fieldName} phải là JSON hợp lệ`);
    }
  }

  // Tải overview bệnh nhân và đồng bộ form từ care plan hiện tại.
  useEffect(() => {
    let ignore = false;

    async function loadOverview() {
      if (!memberId) {
        return;
      }
      setError("");
      try {
        const response = await getDoctorPatientOverviewApi(memberId, accessToken);
        if (!ignore) {
          setOverview(response.data);
          const carePlan = response.data?.carePlan;
          if (carePlan) {
            setCarePlanStatus(carePlan.status || "ACTIVE");
            setFrequencyDays(carePlan.frequencyDays || 30);
            setNextFollowUpAt(
              carePlan.nextFollowUpAt
                ? new Date(carePlan.nextFollowUpAt).toISOString().slice(0, 16)
                : ""
            );
            setMedicationPlan(JSON.stringify(carePlan.medicationPlan || {}, null, 2));
            setLifestyleGoals(JSON.stringify(carePlan.lifestyleGoals || {}, null, 2));
            setCarePlanImageUrls(normalizeImageUrls(carePlan.imageUrls));
          }
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải overview bệnh nhân");
        }
      }
    }

    loadOverview();
    return () => {
      ignore = true;
    };
  }, [memberId, accessToken]);

  // Upload ảnh minh họa cho care plan.
  async function handleUploadCarePlanImage(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingCarePlanImage(true);
    try {
      const imageUrl = await uploadOptimizedImage({
        file,
        folder: "care-plans",
      });
      setCarePlanImageUrls((previous) => [...previous, imageUrl]);
    } catch (uploadError) {
      setError(uploadError.message || "Không thể upload ảnh care plan.");
    } finally {
      setIsUploadingCarePlanImage(false);
      event.target.value = "";
    }
  }

  // Upload ảnh minh họa cho timeline note.
  async function handleUploadTimelineImage(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingTimelineImage(true);
    try {
      const imageUrl = await uploadOptimizedImage({
        file,
        folder: "timeline",
      });
      setTimelineImageUrls((previous) => [...previous, imageUrl]);
    } catch (uploadError) {
      setError(uploadError.message || "Không thể upload ảnh timeline.");
    } finally {
      setIsUploadingTimelineImage(false);
      event.target.value = "";
    }
  }

  // Lưu care plan cập nhật cho bệnh nhân.
  async function handleSaveCarePlan(event) {
    event.preventDefault();
    if (!memberId) {
      return;
    }
    setError("");
    try {
      await upsertCarePlanApi(
        memberId,
        {
          status: carePlanStatus,
          frequencyDays: Number(frequencyDays),
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
          medicationPlan: parseJsonInput(medicationPlan, "medicationPlan"),
          lifestyleGoals: parseJsonInput(lifestyleGoals, "lifestyleGoals"),
          imageUrls: carePlanImageUrls,
        },
        accessToken
      );
      const refreshed = await getDoctorPatientOverviewApi(memberId, accessToken);
      setOverview(refreshed.data);
    } catch (apiError) {
      setError(apiError.message || "Không thể cập nhật care plan");
    }
  }

  // Tạo timeline note thủ công cho bệnh nhân.
  async function handleCreateTimelineNote(event) {
    event.preventDefault();
    if (!memberId) {
      return;
    }
    setError("");
    try {
      await createTimelineNoteApi(
        memberId,
        {
          title: timelineTitle,
          summary: timelineSummary,
          entryType: "NOTE",
          payload: {},
          imageUrls: timelineImageUrls,
        },
        accessToken
      );
      setTimelineTitle("");
      setTimelineSummary("");
      setTimelineImageUrls([]);
      const refreshed = await getDoctorPatientOverviewApi(memberId, accessToken);
      setOverview(refreshed.data);
    } catch (apiError) {
      setError(apiError.message || "Không thể tạo timeline note");
    }
  }

  // Tạo object health profile để render JSON ngắn gọn trên UI.
  const healthProfileJson = useMemo(() => {
    if (!overview?.healthProfile) {
      return "";
    }
    return JSON.stringify(overview.healthProfile, null, 2);
  }, [overview?.healthProfile]);

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Patient Overview</h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.doctor.patients}>
          Quay lại danh sách bệnh nhân
        </Link>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!overview ? (
        <article className="surface-card p-5">
          <p className="text-sm text-slate-600">Đang tải overview...</p>
        </article>
      ) : (
        <>
          <article className="surface-card p-5">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Thông tin thành viên</h3>
            <p className="text-sm text-slate-700">Họ tên: {overview.member.fullName}</p>
            <p className="text-sm text-slate-700">
              Quan hệ: {overview.member.relation} • {overview.member.gender}
            </p>
            <p className="text-sm text-slate-700">
              Ngày sinh: {overview.member.dateOfBirth ? formatDateTime(overview.member.dateOfBirth) : "-"}
            </p>
          </article>

          <article className="surface-card p-5">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Health Profile</h3>
            {healthProfileJson ? (
              <pre className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                {healthProfileJson}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">Chưa có health profile.</p>
            )}
          </article>

          <article className="surface-card p-5">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Cập nhật Care Plan</h3>
            <form className="grid gap-2" onSubmit={handleSaveCarePlan}>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  className="input-base mt-1"
                  onChange={(event) => setCarePlanStatus(event.target.value)}
                  value={carePlanStatus}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Frequency days
                <input
                  className="input-base mt-1"
                  min={1}
                  onChange={(event) => setFrequencyDays(event.target.value)}
                  type="number"
                  value={frequencyDays}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Next follow-up
                <input
                  className="input-base mt-1"
                  onChange={(event) => setNextFollowUpAt(event.target.value)}
                  type="datetime-local"
                  value={nextFollowUpAt}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Medication plan (JSON)
                <textarea
                  className="input-base mt-1 min-h-[90px]"
                  onChange={(event) => setMedicationPlan(event.target.value)}
                  value={medicationPlan}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Lifestyle goals (JSON)
                <textarea
                  className="input-base mt-1 min-h-[90px]"
                  onChange={(event) => setLifestyleGoals(event.target.value)}
                  value={lifestyleGoals}
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="btn-soft inline-flex cursor-pointer px-4 py-2 text-sm">
                  {isUploadingCarePlanImage ? "Đang upload ảnh..." : "Upload ảnh care plan"}
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploadingCarePlanImage}
                    onChange={handleUploadCarePlanImage}
                    type="file"
                  />
                </label>
                {carePlanImageUrls.length > 0 ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {carePlanImageUrls.map((imageUrl) => (
                      <img className="h-24 w-full rounded-lg object-cover" key={imageUrl} src={imageUrl} />
                    ))}
                  </div>
                ) : null}
              </div>

              <button className="btn-primary w-fit px-4 py-2 text-sm" type="submit">
                Lưu care plan
              </button>
            </form>
          </article>

          <article className="surface-card p-5">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Tạo timeline note</h3>
            <form className="grid gap-2" onSubmit={handleCreateTimelineNote}>
              <label className="text-sm font-medium text-slate-700">
                Tiêu đề
                <input
                  className="input-base mt-1"
                  onChange={(event) => setTimelineTitle(event.target.value)}
                  required
                  value={timelineTitle}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Nội dung
                <textarea
                  className="input-base mt-1 min-h-[90px]"
                  onChange={(event) => setTimelineSummary(event.target.value)}
                  required
                  value={timelineSummary}
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="btn-soft inline-flex cursor-pointer px-4 py-2 text-sm">
                  {isUploadingTimelineImage ? "Đang upload ảnh..." : "Upload ảnh timeline"}
                  <input
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploadingTimelineImage}
                    onChange={handleUploadTimelineImage}
                    type="file"
                  />
                </label>
                {timelineImageUrls.length > 0 ? (
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {timelineImageUrls.map((imageUrl) => (
                      <img className="h-24 w-full rounded-lg object-cover" key={imageUrl} src={imageUrl} />
                    ))}
                  </div>
                ) : null}
              </div>

              <button className="btn-primary w-fit px-4 py-2 text-sm" type="submit">
                Tạo note
              </button>
            </form>
          </article>

          <article className="surface-card p-5">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Timeline gần nhất</h3>
            {overview.timeline?.length ? (
              <div className="grid gap-2">
                {overview.timeline.map((entry) => (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={entry.id}>
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
            ) : (
              <p className="text-sm text-slate-500">Chưa có timeline.</p>
            )}
          </article>
        </>
      )}
    </section>
  );
}
