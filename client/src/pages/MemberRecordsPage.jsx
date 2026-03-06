import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  createTimelineNoteApi,
  getCarePlanApi,
  getHealthProfileApi,
  getMemberDocumentsApi,
  getMemberTimelineApi,
  upsertHealthProfileApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { formatDateTime } from "../lib/date";
import { ROUTES } from "../lib/routes";
import { uploadMedicalDocument } from "../lib/cloudinary";

// Chuẩn hóa dữ liệu tags để render an toàn ở UI.
function normalizeEntryTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => item?.tag?.label)
    .filter((item) => typeof item === "string" && item.trim().length > 0);
}

// Parse chuỗi tags phân tách dấu phẩy thành mảng.
function parseTagInput(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

// Trang Medical Vault: quản lý timeline, tài liệu và nhập hồ sơ thủ công.
export function MemberRecordsPage() {
  const { memberId } = useParams();
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab] = useState("timeline");
  const [healthProfile, setHealthProfile] = useState(null);
  const [carePlan, setCarePlan] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [allergies, setAllergies] = useState("[]");
  const [chronicConditions, setChronicConditions] = useState("[]");
  const [medications, setMedications] = useState("[]");
  const [lifestyle, setLifestyle] = useState("{}");
  const [bloodType, setBloodType] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("{}");

  const [entryType, setEntryType] = useState("NOTE");
  const [entryTitle, setEntryTitle] = useState("");
  const [entrySummary, setEntrySummary] = useState("");
  const [entryDiagnosis, setEntryDiagnosis] = useState("");
  const [entrySpecialtyCode, setEntrySpecialtyCode] = useState("");
  const [entryPredefinedTags, setEntryPredefinedTags] = useState("DISEASE:HYPERTENSION");
  const [entryCustomTags, setEntryCustomTags] = useState("");
  const [entryAttachments, setEntryAttachments] = useState([]);

  const [timelineFrom, setTimelineFrom] = useState("");
  const [timelineTo, setTimelineTo] = useState("");
  const [timelineTag, setTimelineTag] = useState("");
  const [timelineSpecialty, setTimelineSpecialty] = useState("");

  const [docKind, setDocKind] = useState("");
  const [docTag, setDocTag] = useState("");
  const [docFrom, setDocFrom] = useState("");
  const [docTo, setDocTo] = useState("");

  const [error, setError] = useState("");
  const [isSavingHealth, setIsSavingHealth] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);

  // Parse JSON nhập tay và ném lỗi khi định dạng không hợp lệ.
  function parseJsonInput(value, fieldName) {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`${fieldName} phải là JSON hợp lệ`);
    }
  }

  // Tải đồng thời health profile, care plan, timeline và danh sách tài liệu.
  async function loadRecordsData() {
    if (!memberId) {
      return;
    }

    const [healthRes, carePlanRes, timelineRes, documentsRes] = await Promise.all([
      getHealthProfileApi(memberId, accessToken),
      getCarePlanApi(memberId, accessToken),
      getMemberTimelineApi(
        memberId,
        {
          page: 1,
          limit: 50,
          from: timelineFrom || undefined,
          to: timelineTo || undefined,
          tag: timelineTag || undefined,
          specialtyCode: timelineSpecialty || undefined,
        },
        accessToken
      ),
      getMemberDocumentsApi(
        memberId,
        {
          page: 1,
          limit: 50,
          kind: docKind || undefined,
          from: docFrom || undefined,
          to: docTo || undefined,
          tag: docTag || undefined,
        },
        accessToken
      ),
    ]);

    setHealthProfile(healthRes.data);
    setCarePlan(carePlanRes.data);
    setTimeline(timelineRes.data || []);
    setDocuments(documentsRes.data || []);

    const profileData = healthRes.data;
    setAllergies(JSON.stringify(profileData?.allergies || [], null, 2));
    setChronicConditions(JSON.stringify(profileData?.chronicConditions || [], null, 2));
    setMedications(JSON.stringify(profileData?.medications || [], null, 2));
    setLifestyle(JSON.stringify(profileData?.lifestyle || {}, null, 2));
    setBloodType(profileData?.bloodType || "");
    setEmergencyContact(JSON.stringify(profileData?.emergencyContact || {}, null, 2));
  }

  // Tải dữ liệu ban đầu và khi filter thay đổi.
  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        setError("");
        await loadRecordsData();
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải Medical Vault");
        }
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, [
    memberId,
    accessToken,
    timelineFrom,
    timelineTo,
    timelineTag,
    timelineSpecialty,
    docKind,
    docTag,
    docFrom,
    docTo,
  ]);

  // Upload nhiều file tài liệu y tế và lưu tạm metadata vào form tạo timeline entry.
  async function handleUploadMedicalFiles(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    setError("");
    setIsUploadingDocument(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const metadata = await uploadMedicalDocument({
          file,
          folder: "timeline",
        });
        uploaded.push(metadata);
      }

      setEntryAttachments((prev) => [...prev, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError.message || "Không thể upload tài liệu.");
    } finally {
      setIsUploadingDocument(false);
      event.target.value = "";
    }
  }

  // Lưu hồ sơ sức khỏe sau khi parse JSON hợp lệ.
  async function handleSaveHealthProfile(event) {
    event.preventDefault();
    if (!memberId) {
      return;
    }
    setError("");
    setIsSavingHealth(true);
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
      setIsSavingHealth(false);
    }
  }

  // Tạo timeline entry mới từ form nhập tay + file upload + tag.
  async function handleCreateTimelineEntry(event) {
    event.preventDefault();
    if (!memberId) {
      return;
    }

    setError("");
    setIsCreatingEntry(true);
    try {
      await createTimelineNoteApi(
        memberId,
        {
          entryType,
          title: entryTitle,
          summary: entrySummary,
          diagnosis: entryDiagnosis || null,
          specialtyCode: entrySpecialtyCode || null,
          sourceType: entryAttachments.length > 0 ? "PATIENT_UPLOAD" : "PATIENT_MANUAL",
          payload: {},
          attachments: entryAttachments,
          predefinedTagCodes: parseTagInput(entryPredefinedTags),
          customTags: parseTagInput(entryCustomTags),
        },
        accessToken
      );

      setEntryTitle("");
      setEntrySummary("");
      setEntryDiagnosis("");
      setEntrySpecialtyCode("");
      setEntryCustomTags("");
      setEntryAttachments([]);
      setActiveTab("timeline");
      await loadRecordsData();
    } catch (apiError) {
      setError(apiError.message || "Không thể tạo hồ sơ timeline");
    } finally {
      setIsCreatingEntry(false);
    }
  }

  // Tạo bản tóm tắt hiển thị metadata care plan.
  const carePlanSummary = useMemo(() => {
    if (!carePlan) {
      return "Chưa có care plan cho thành viên này.";
    }
    return `Trạng thái ${carePlan.status} • Chu kỳ ${carePlan.frequencyDays} ngày • Follow-up ${carePlan.nextFollowUpAt ? formatDateTime(carePlan.nextFollowUpAt) : "-"}`;
  }, [carePlan]);

  return (
    <section className="space-y-4">
      <header className="surface-card flex flex-wrap items-center justify-between gap-2 p-4">
        <h2 className="text-xl font-semibold text-slate-900">Medical Vault</h2>
        <Link className="btn-soft px-4 py-2 text-sm" to={ROUTES.app.patient.family}>
          Quay lại danh sách family
        </Link>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="surface-card p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          <button className={`px-4 py-2 text-sm ${activeTab === "timeline" ? "btn-primary" : "btn-soft"}`} onClick={() => setActiveTab("timeline")} type="button">
            Timeline
          </button>
          <button className={`px-4 py-2 text-sm ${activeTab === "documents" ? "btn-primary" : "btn-soft"}`} onClick={() => setActiveTab("documents")} type="button">
            Tài liệu
          </button>
          <button className={`px-4 py-2 text-sm ${activeTab === "create" ? "btn-primary" : "btn-soft"}`} onClick={() => setActiveTab("create")} type="button">
            Thêm hồ sơ
          </button>
        </div>

        {activeTab === "timeline" ? (
          <div className="space-y-3">
            <div className="grid gap-2 md:grid-cols-4">
              <input className="input-base" onChange={(event) => setTimelineFrom(event.target.value)} type="date" value={timelineFrom} />
              <input className="input-base" onChange={(event) => setTimelineTo(event.target.value)} type="date" value={timelineTo} />
              <input className="input-base" onChange={(event) => setTimelineTag(event.target.value)} placeholder="Lọc theo tag" value={timelineTag} />
              <input className="input-base" onChange={(event) => setTimelineSpecialty(event.target.value)} placeholder="Lọc theo chuyên khoa code" value={timelineSpecialty} />
            </div>

            <p className="text-xs text-slate-500">Care plan: {carePlanSummary}</p>

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
                    {entry.diagnosis ? <p className="mt-1 text-sm text-slate-700">Chẩn đoán: {entry.diagnosis}</p> : null}
                    {normalizeEntryTags(entry.tags).length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">Tags: {normalizeEntryTags(entry.tags).join(", ")}</p>
                    ) : null}
                    {entry.attachments?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {entry.attachments.map((file) => (
                          <a className="text-xs text-brand-700 underline" href={file.fileUrl} key={file.id} rel="noreferrer" target="_blank">
                            {file.fileName} ({file.kind})
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "documents" ? (
          <div className="space-y-3">
            <div className="grid gap-2 md:grid-cols-4">
              <select className="input-base" onChange={(event) => setDocKind(event.target.value)} value={docKind}>
                <option value="">Tất cả loại</option>
                <option value="PDF">PDF</option>
                <option value="IMAGE">IMAGE</option>
                <option value="LAB_RESULT">LAB_RESULT</option>
                <option value="PRESCRIPTION">PRESCRIPTION</option>
                <option value="DIAGNOSIS">DIAGNOSIS</option>
              </select>
              <input className="input-base" onChange={(event) => setDocFrom(event.target.value)} type="date" value={docFrom} />
              <input className="input-base" onChange={(event) => setDocTo(event.target.value)} type="date" value={docTo} />
              <input className="input-base" onChange={(event) => setDocTag(event.target.value)} placeholder="Lọc theo tag" value={docTag} />
            </div>

            {documents.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có tài liệu.</p>
            ) : (
              <div className="grid gap-2">
                {documents.map((doc) => (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={doc.id}>
                    <a className="text-sm font-semibold text-brand-700 underline" href={doc.fileUrl} rel="noreferrer" target="_blank">
                      {doc.fileName}
                    </a>
                    <p className="text-xs text-slate-500">
                      {doc.kind} • {doc.mimeType} • {doc.fileSizeBytes} bytes
                    </p>
                    <p className="text-xs text-slate-500">Timeline: {doc.timelineEntry?.title || "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "create" ? (
          <form className="grid gap-3" onSubmit={handleCreateTimelineEntry}>
            <div className="grid gap-2 md:grid-cols-2">
              <select className="input-base" onChange={(event) => setEntryType(event.target.value)} value={entryType}>
                <option value="NOTE">NOTE</option>
                <option value="VISIT">VISIT</option>
                <option value="PRESCRIPTION">PRESCRIPTION</option>
                <option value="LAB_RESULT">LAB_RESULT</option>
                <option value="FOLLOW_UP">FOLLOW_UP</option>
              </select>
              <input className="input-base" onChange={(event) => setEntrySpecialtyCode(event.target.value)} placeholder="specialtyCode (VD: CARDIOLOGY)" value={entrySpecialtyCode} />
            </div>

            <input className="input-base" onChange={(event) => setEntryTitle(event.target.value)} placeholder="Tiêu đề hồ sơ" required value={entryTitle} />
            <textarea className="input-base min-h-[100px]" onChange={(event) => setEntrySummary(event.target.value)} placeholder="Mô tả hồ sơ bệnh sử" required value={entrySummary} />
            <input className="input-base" onChange={(event) => setEntryDiagnosis(event.target.value)} placeholder="Chẩn đoán (tùy chọn)" value={entryDiagnosis} />
            <input className="input-base" onChange={(event) => setEntryPredefinedTags(event.target.value)} placeholder="Predefined tags, ví dụ: DISEASE:HYPERTENSION,SPECIALTY:CARDIOLOGY" value={entryPredefinedTags} />
            <input className="input-base" onChange={(event) => setEntryCustomTags(event.target.value)} placeholder="Custom tags, ví dụ: đau đầu,mất ngủ" value={entryCustomTags} />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="btn-soft inline-flex cursor-pointer px-4 py-2 text-sm">
                {isUploadingDocument ? "Đang upload..." : "Upload PDF/Ảnh"}
                <input
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={isUploadingDocument}
                  multiple
                  onChange={handleUploadMedicalFiles}
                  type="file"
                />
              </label>
              {entryAttachments.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {entryAttachments.map((file, index) => (
                    <li key={`${file.fileUrl}-${index}`}>{file.fileName} ({file.kind})</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <button className="btn-primary w-fit px-4 py-2 text-sm" disabled={isCreatingEntry} type="submit">
              {isCreatingEntry ? "Đang tạo..." : "Tạo hồ sơ timeline"}
            </button>
          </form>
        ) : null}
      </article>

      <article className="surface-card p-5">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Health Profile (nhập tay)</h3>
        <form className="grid gap-2" onSubmit={handleSaveHealthProfile}>
          <label className="text-sm font-medium text-slate-700">
            Allergies (JSON array)
            <textarea className="input-base mt-1 min-h-[88px]" onChange={(event) => setAllergies(event.target.value)} value={allergies} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Chronic conditions (JSON array)
            <textarea className="input-base mt-1 min-h-[88px]" onChange={(event) => setChronicConditions(event.target.value)} value={chronicConditions} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Medications (JSON array)
            <textarea className="input-base mt-1 min-h-[88px]" onChange={(event) => setMedications(event.target.value)} value={medications} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Lifestyle (JSON object)
            <textarea className="input-base mt-1 min-h-[88px]" onChange={(event) => setLifestyle(event.target.value)} value={lifestyle} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Blood type
            <input className="input-base mt-1" onChange={(event) => setBloodType(event.target.value)} value={bloodType} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Emergency contact (JSON object)
            <textarea className="input-base mt-1 min-h-[88px]" onChange={(event) => setEmergencyContact(event.target.value)} value={emergencyContact} />
          </label>
          <button className="btn-primary w-fit px-4 py-2 text-sm" disabled={isSavingHealth} type="submit">
            {isSavingHealth ? "Đang lưu..." : "Lưu health profile"}
          </button>
        </form>

        {healthProfile ? (
          <p className="mt-2 text-xs text-slate-500">Cập nhật gần nhất: {formatDateTime(healthProfile.updatedAt)}</p>
        ) : null}
      </article>
    </section>
  );
}
