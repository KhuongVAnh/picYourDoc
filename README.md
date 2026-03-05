# PickYourDoc

Nền tảng HealthTech kết nối bác sĩ gia đình với bệnh nhân/gia đình để chăm sóc sức khỏe liên tục.

## Cấu trúc repository
- `server/`: Backend API (`Node.js + Express + Prisma + MySQL`).
- `client/`: Frontend Web App (`React + Vite + TailwindCSS`).
- `task.md`: Bảng điều phối task đa-agent.
- `PRODUCT_FEATURES.md`: Checklist tính năng sản phẩm.
- `docs/`: Tài liệu kiến trúc và conventions.

## Quick Start
### 1) Backend
```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
# User tự tạo/chạy migration theo quy trình riêng (không auto-generate migration)
# Ví dụ sau khi đã có migration:
# npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

### 2) Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Biến môi trường backend
- `DATABASE_URL`: Chuỗi kết nối MySQL.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: Secret cho JWT.
- `APPOINTMENT_CANCEL_WINDOW_HOURS`: Rule hủy/đổi lịch cho bệnh nhân.
- `CLIENT_ORIGIN`: Origin frontend cho CORS/Socket.IO (mặc định `http://localhost:5173`).
- `SMTP_*`: Cấu hình email reminder.

## Biến môi trường frontend
- `VITE_API_BASE_URL`: Base URL backend (mặc định `http://localhost:3000`).
- `VITE_WEBRTC_STUN_URLS`: Danh sách STUN server cho WebRTC.
- `VITE_CLOUDINARY_CLOUD_NAME`: Cloud name Cloudinary.
- `VITE_CLOUDINARY_UNSIGNED_PRESET`: Unsigned preset để upload ảnh từ client.

## Route structure production
- Public:
  - `/`
  - `/doctors`
  - `/pricing`
  - `/about`
  - `/auth/login`
  - `/auth/register`
- App zone:
  - `/app/patient/*`
  - `/app/doctor/*`
  - `/app/admin/*` (tối giản)
- System:
  - `/403`
  - `/404`
  - `/500`

## Tài khoản seed demo
- `patient.demo@picyourdoc.local` / `Patient@123`
- `doctor.demo@picyourdoc.local` / `Doctor@123`
- `admin.demo@picyourdoc.local` / `Admin@123`

## Checklist test nhanh MVP
1. Login patient -> vào `/app/patient/subscription/plans` -> checkout mock.
2. Vào `/app/patient/family` tạo/cập nhật thành viên -> vào hồ sơ để cập nhật health profile.
3. Tìm bác sĩ -> đặt lịch -> doctor confirm lịch.
4. Doctor start consult -> end consult.
5. Kiểm tra patient usage + timeline và doctor income/dashboard.

## Tài liệu kỹ thuật
- Kiến trúc: `docs/ARCHITECTURE.md`
- Quy ước triển khai: `docs/CONVENTIONS.md`

## Ràng buộc làm việc
- Không thay đổi public API/schema/business logic đã có nếu chưa được user phê duyệt.
- Không tự tạo migration file; user sẽ tự tạo migration.
- Mọi tiến độ cần cập nhật đồng bộ vào `task.md` và `PRODUCT_FEATURES.md`.
