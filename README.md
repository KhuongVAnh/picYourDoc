# PickYourDoc

Nền tảng HealthTech kết nối bác sĩ gia đình với bệnh nhân/gia đình để chăm sóc sức khỏe liên tục.

## Cấu trúc repository
- `server/`: Backend API (Express + Prisma + MySQL).
- `client/`: Frontend Web App (React + Vite).
- `PRODUCT_FEATURES.md`: Checklist tính năng sản phẩm.
- `task.md`: Bảng điều phối task đa-agent (single source of truth).
- `docs/`: Tài liệu kiến trúc và conventions.

## Quick Start (Phase 1)

### 1) Cấu hình backend
```bash
cd server
cp .env.example .env
# Cập nhật DATABASE_URL theo MySQL của bạn
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 2) Cấu hình frontend
```bash
cd client
npm install
npm run dev
```

## Tài liệu kỹ thuật
- Kiến trúc tổng quan: `docs/ARCHITECTURE.md`
- Quy ước triển khai: `docs/CONVENTIONS.md`

## Ràng buộc làm việc
- Không thay đổi API public/schema/business logic đã có nếu chưa được phê duyệt.
- Mọi cập nhật tiến độ phải đồng bộ ở `task.md` và `PRODUCT_FEATURES.md`.
