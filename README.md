# PickYourDoc

Nền tảng HealthTech kết nối bác sĩ gia đình với bệnh nhân/gia đình để chăm sóc sức khỏe liên tục.

## Cấu trúc repository
- `server/`: Backend API (`Node.js + Express + Prisma + MySQL`).
- `client/`: Frontend Web App (`React + Vite + TailwindCSS`).
- `task.md`: Bảng điều phối task đa-agent.
- `PRODUCT_FEATURES.md`: Checklist tính năng sản phẩm.
- `docs/`: Tài liệu kiến trúc và conventions.

## Quick Start
## 1) Backend
```bash
cd server
cp .env.example .env
npm install
npm run prisma:generate
# User tự chạy migration theo quy trình riêng
npm run prisma:seed
npm run dev
```

## 2) Frontend
```bash
cd client
npm install
npm run dev
```

## Biến môi trường backend
- `DATABASE_URL`: Chuỗi kết nối MySQL.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: Secret cho JWT.
- `APPOINTMENT_CANCEL_WINDOW_HOURS`: Rule hủy/đổi lịch cho bệnh nhân.
- `CLIENT_ORIGIN`: Origin frontend cho CORS/Socket.IO (mặc định `http://localhost:5173`).
- `SMTP_*`: Cấu hình email reminder.

## Tài liệu kỹ thuật
- Kiến trúc: `docs/ARCHITECTURE.md`
- Quy ước triển khai: `docs/CONVENTIONS.md`

## Ràng buộc làm việc
- Không thay đổi public API/schema/business logic đã có nếu chưa được user phê duyệt.
- Không tự tạo migration file; user sẽ tự tạo migration.
- Mọi tiến độ cần cập nhật đồng bộ vào `task.md` và `PRODUCT_FEATURES.md`.
