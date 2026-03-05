const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UNSIGNED_PRESET = import.meta.env.VITE_CLOUDINARY_UNSIGNED_PRESET || "";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Tạo object lỗi chuẩn để hiển thị thông báo upload nhất quán ở UI.
function createUploadError(message) {
  return new Error(message);
}

// Kiểm tra file ảnh đầu vào theo mime-type và kích thước tối đa cho phép.
function validateImageFile(file) {
  if (!file) {
    throw createUploadError("Vui lòng chọn một tệp ảnh.");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw createUploadError("Chỉ hỗ trợ định dạng jpg, jpeg, png hoặc webp.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw createUploadError("Kích thước ảnh tối đa là 5MB.");
  }
}

// Đọc file ảnh và trả về đối tượng HTMLImageElement để phục vụ resize.
function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    // Tạo blob URL tạm để browser giải mã ảnh.
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(createUploadError("Không thể đọc tệp ảnh."));
    };
    image.src = objectUrl;
  });
}

// Resize ảnh về max-width để giảm dung lượng trước khi upload Cloudinary.
async function resizeImageFile(file, maxWidth = 1600) {
  const image = await loadImageElement(file);

  // Tính kích thước đích, chỉ thu nhỏ khi chiều rộng vượt ngưỡng.
  const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
  const targetWidth = Math.round(image.width * ratio);
  const targetHeight = Math.round(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw createUploadError("Không thể xử lý ảnh trên trình duyệt hiện tại.");
  }

  // Vẽ ảnh lên canvas để tạo ảnh mới theo kích thước tối ưu.
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(createUploadError("Không thể tối ưu ảnh trước khi upload."));
          return;
        }
        resolve(blob);
      },
      file.type === "image/png" ? "image/png" : "image/jpeg",
      0.9
    );
  });
}

// Upload blob ảnh lên Cloudinary bằng unsigned preset theo folder đã định.
async function uploadImageToCloudinary({ blob, folder, originalFileName }) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UNSIGNED_PRESET) {
    throw createUploadError("Thiếu cấu hình Cloudinary trong biến môi trường frontend.");
  }

  const formData = new FormData();
  formData.append("file", blob, originalFileName || "upload-image.jpg");
  formData.append("upload_preset", CLOUDINARY_UNSIGNED_PRESET);
  if (folder) {
    formData.append("folder", folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.secure_url) {
    throw createUploadError(payload.error?.message || "Upload ảnh thất bại.");
  }

  return payload.secure_url;
}

// Validate + resize + upload ảnh và trả về secure URL đã lưu trên Cloudinary.
async function uploadOptimizedImage({ file, folder }) {
  validateImageFile(file);
  const optimizedBlob = await resizeImageFile(file, 1600);
  return uploadImageToCloudinary({
    blob: optimizedBlob,
    folder,
    originalFileName: file.name,
  });
}

export {
  validateImageFile,
  resizeImageFile,
  uploadImageToCloudinary,
  uploadOptimizedImage,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
};
