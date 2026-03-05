import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createFamilyMemberApi,
  deleteFamilyMemberApi,
  getFamilyApi,
  getMySubscriptionApi,
  upsertFamilyApi,
} from "../lib/api";
import { useAuth } from "../auth/useAuth";
import { uploadOptimizedImage } from "../lib/cloudinary";
import { ROUTES } from "../lib/routes";

const RELATION_OPTIONS = ["SELF", "SPOUSE", "CHILD", "PARENT", "SIBLING", "OTHER"];
const GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER"];

// Tạo fallback avatar cho member gia đình khi chưa có ảnh cá nhân.
function buildMemberFallbackAvatar(fullName) {
  const encodedName = encodeURIComponent(fullName || "Member");
  return `https://ui-avatars.com/api/?name=${encodedName}&background=1DAAA0&color=FFFFFF`;
}

// Trang quản lý thành viên gia đình cho patient, có kiểm tra giới hạn theo plan.
export function PatientFamilyPage() {
  const { accessToken } = useAuth();
  const [family, setFamily] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [familyName, setFamilyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [relation, setRelation] = useState("SELF");
  const [gender, setGender] = useState("OTHER");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Tải family profile và entitlement hiện tại để hiển thị limit thành viên.
  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [familyRes, subscriptionRes] = await Promise.all([
          getFamilyApi(accessToken),
          getMySubscriptionApi({}, accessToken),
        ]);
        if (!ignore) {
          setFamily(familyRes.data);
          setFamilyName(familyRes.data?.name || "");
          setSubscription(subscriptionRes.data);
        }
      } catch (apiError) {
        if (!ignore) {
          setError(apiError.message || "Không thể tải dữ liệu gia đình");
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [accessToken]);

  // Tính số thành viên hiện có và giới hạn theo gói để hiển thị cảnh báo sớm.
  const memberStats = useMemo(() => {
    const count = family?.members?.length || 0;
    const limit = subscription?.plan?.familyMemberLimit ?? 0;
    return {
      count,
      limit,
      canAddMore: count < limit,
    };
  }, [family, subscription]);

  // Upload avatar thành viên gia đình lên Cloudinary trước khi tạo member.
  async function handleUploadMemberAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadOptimizedImage({
        file,
        folder: "family",
      });
      setAvatarUrl(uploadedUrl);
    } catch (uploadError) {
      setError(uploadError.message || "Không thể upload ảnh thành viên.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  // Tạo hoặc cập nhật tên family profile.
  async function handleSaveFamilyName(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const response = await upsertFamilyApi({ name: familyName }, accessToken);
      setFamily(response.data);
    } catch (apiError) {
      setError(apiError.message || "Không thể lưu family profile");
    } finally {
      setIsSaving(false);
    }
  }

  // Thêm member mới vào family hiện tại.
  async function handleAddMember(event) {
    event.preventDefault();
    setError("");
    if (!memberStats.canAddMore) {
      setError("Đã đạt giới hạn thành viên của gói hiện tại.");
      return;
    }

    setIsSaving(true);
    try {
      await createFamilyMemberApi(
        {
          fullName,
          relation,
          gender,
          dateOfBirth: dateOfBirth || null,
          avatarUrl: avatarUrl || null,
        },
        accessToken
      );

      const refreshed = await getFamilyApi(accessToken);
      setFamily(refreshed.data);
      setFullName("");
      setRelation("SELF");
      setGender("OTHER");
      setDateOfBirth("");
      setAvatarUrl("");
    } catch (apiError) {
      setError(apiError.message || "Không thể thêm thành viên");
    } finally {
      setIsSaving(false);
    }
  }

  // Xóa member khỏi family và tải lại danh sách sau khi thành công.
  async function handleDeleteMember(memberId) {
    setError("");
    try {
      await deleteFamilyMemberApi(memberId, accessToken);
      const refreshed = await getFamilyApi(accessToken);
      setFamily(refreshed.data);
    } catch (apiError) {
      setError(apiError.message || "Không thể xóa thành viên");
    }
  }

  return (
    <section className="space-y-4">
      <header className="surface-card p-5">
        <h2 className="text-xl font-semibold text-slate-900">Quản lý gia đình</h2>
        <p className="mt-1 text-sm text-slate-600">
          Gói hiện tại: <span className="font-semibold">{subscription?.plan?.name || "N/A"}</span> ({memberStats.count}/{memberStats.limit} thành viên)
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <article className="surface-card p-5">
        <form className="grid gap-2" onSubmit={handleSaveFamilyName}>
          <label className="text-sm font-medium text-slate-700">
            Tên family profile
            <input
              className="input-base mt-1"
              onChange={(event) => setFamilyName(event.target.value)}
              placeholder="Gia đình của tôi"
              value={familyName}
            />
          </label>
          <button className="btn-soft w-fit px-4 py-2 text-sm" disabled={isSaving} type="submit">
            Lưu tên family
          </button>
        </form>
      </article>

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Thêm thành viên</h3>
        <form className="mt-3 grid gap-2" onSubmit={handleAddMember}>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <img
              alt="Avatar thành viên"
              className="h-14 w-14 rounded-full border border-slate-200 object-cover"
              src={avatarUrl || "https://ui-avatars.com/api/?name=Member&background=1DAAA0&color=FFFFFF"}
            />
            <label className="btn-soft inline-flex cursor-pointer px-4 py-2 text-sm">
              {isUploadingAvatar ? "Đang upload..." : "Upload ảnh thành viên"}
              <input
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={isUploadingAvatar}
                onChange={handleUploadMemberAvatar}
                type="file"
              />
            </label>
          </div>

          <label className="text-sm font-medium text-slate-700">
            Họ và tên
            <input
              className="input-base mt-1"
              onChange={(event) => setFullName(event.target.value)}
              required
              value={fullName}
            />
          </label>

          <div className="grid gap-2 md:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Quan hệ
              <select className="input-base mt-1" onChange={(event) => setRelation(event.target.value)} value={relation}>
                {RELATION_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Giới tính
              <select className="input-base mt-1" onChange={(event) => setGender(event.target.value)} value={gender}>
                {GENDER_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Ngày sinh
              <input
                className="input-base mt-1"
                onChange={(event) => setDateOfBirth(event.target.value)}
                type="date"
                value={dateOfBirth}
              />
            </label>
          </div>

          <button
            className="btn-primary w-fit px-4 py-2 text-sm"
            disabled={isSaving || isUploadingAvatar || !memberStats.canAddMore}
            type="submit"
          >
            {memberStats.canAddMore ? "Thêm thành viên" : "Đã đạt giới hạn gói"}
          </button>
        </form>
      </article>

      <article className="surface-card p-5">
        <h3 className="text-base font-semibold text-slate-900">Danh sách thành viên</h3>
        {!family?.members?.length ? (
          <p className="mt-2 text-sm text-slate-500">Chưa có thành viên nào trong family profile.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {family.members.map((member) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" key={member.id}>
                <div className="flex items-start gap-3">
                  <img
                    alt={member.fullName}
                    className="h-14 w-14 rounded-full border border-slate-200 object-cover"
                    src={member.avatarUrl || buildMemberFallbackAvatar(member.fullName)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {member.fullName} {member.isPrimary ? "(Primary)" : ""}
                    </p>
                    <p className="text-sm text-slate-600">
                      {member.relation} • {member.gender}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Link className="btn-soft px-3 py-1.5 text-xs" to={ROUTES.app.patient.memberRecords(member.id)}>
                        Mở hồ sơ
                      </Link>
                      <button className="btn-soft px-3 py-1.5 text-xs" onClick={() => handleDeleteMember(member.id)} type="button">
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
