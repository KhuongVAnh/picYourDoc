import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { uploadOptimizedImage } from "../lib/cloudinary";

// Trang hồ sơ bác sĩ cho phép upload avatar và cập nhật thông tin tài khoản.
export function DoctorProfilePage() {
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Đồng bộ form từ dữ liệu user hiện tại trong auth context.
  useEffect(() => {
    setDisplayName(user?.displayName || "");
    setPhone(user?.phone || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user]);

  // Upload avatar bác sĩ lên Cloudinary trước khi lưu profile.
  async function handleUploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setSuccess("");
    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadOptimizedImage({
        file,
        folder: "doctors",
      });
      setAvatarUrl(uploadedUrl);
      setSuccess("Đã upload ảnh đại diện thành công.");
    } catch (uploadError) {
      setError(uploadError.message || "Không thể upload ảnh đại diện.");
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = "";
    }
  }

  // Lưu thay đổi profile bác sĩ.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      await updateProfile({ displayName, phone, avatarUrl });
      setSuccess("Đã cập nhật hồ sơ thành công.");
    } catch (apiError) {
      setError(apiError.message || "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="surface-card p-5 md:p-6">
      <h2 className="text-xl font-semibold text-slate-900">Hồ sơ bác sĩ</h2>
      <p className="mt-1 text-sm text-slate-600">
        Cập nhật thông tin hiển thị để bệnh nhân dễ nhận diện trong hệ thống.
      </p>

      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <img
            alt="Avatar bác sĩ"
            className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            src={avatarUrl || "https://ui-avatars.com/api/?name=Doctor&background=0F4C81&color=FFFFFF"}
          />
          <div className="space-y-2">
            <label className="btn-soft inline-flex cursor-pointer px-4 py-2 text-sm">
              {isUploadingAvatar ? "Đang upload..." : "Upload avatar"}
              <input
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={isUploadingAvatar}
                onChange={handleUploadAvatar}
                type="file"
              />
            </label>
            <p className="text-xs text-slate-500">Hỗ trợ jpg/jpeg/png/webp, tối đa 5MB.</p>
          </div>
        </div>

        <label className="text-sm font-medium text-slate-700">
          Họ và tên
          <input
            className="input-base mt-1"
            onChange={(event) => setDisplayName(event.target.value)}
            value={displayName}
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Số điện thoại
          <input className="input-base mt-1" onChange={(event) => setPhone(event.target.value)} value={phone} />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Avatar URL
          <input
            className="input-base mt-1"
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
            value={avatarUrl}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

        <button className="btn-primary px-4 py-2 text-sm" disabled={isSaving || isUploadingAvatar} type="submit">
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
}
