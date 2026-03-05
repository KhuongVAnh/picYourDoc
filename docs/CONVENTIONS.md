# Conventions cho team và agent

## 1) Quy ước mã nguồn
- Dùng JavaScript (không TypeScript) trong giai đoạn hiện tại.
- Backend theo module: mỗi module có `*.routes.js`, và khi cần có `*.controller.js`, `*.service.js`.
- Tên file dùng `kebab-case` hoặc `dot-suffix` nhất quán theo module hiện có.

## 2) Quy ước API
- Prefix API: `/api`.
- JSON response theo dạng:
  - Thành công: `{ data, message }` hoặc object nghiệp vụ.
  - Lỗi: `{ message }`.
- Không thay đổi API public đã có nếu chưa được user phê duyệt.

## 3) Quy ước database
- Prisma schema là nguồn sự thật cho model.
- Mọi thay đổi schema phải có migration tương ứng.
- Không rewrite migration đã áp dụng; chỉ tạo migration mới.
- Công nghệ DB chuẩn của dự án: MySQL.

## 3.1 Quy ước frontend
- UI sử dụng TailwindCSS làm nền tảng style chính.
- Hạn chế CSS custom, chỉ dùng khi Tailwind không đáp ứng hợp lý.

## 4) Quy ước bảo mật
- Không commit file `.env`.
- Chỉ commit `.env.example`.
- Secret JWT phải lấy từ biến môi trường.

## 5) Quy ước cộng tác đa-agent
- Mọi tiến độ cập nhật tại `task.md`.
- Mọi tính năng hoàn thành phải tick trong `PRODUCT_FEATURES.md`.
- Nếu bị chặn hoặc cần đổi API/schema/business logic, ghi rõ `Blockers` và dừng.
