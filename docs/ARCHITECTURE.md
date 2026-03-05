# Kiến trúc hệ thống PickYourDoc (MVP)

## 1) Tổng quan
Hệ thống gồm 2 khối chính:
- `client/picYourDoc`: ứng dụng React cho bệnh nhân, bác sĩ, admin.
- `server`: REST API theo kiến trúc module, dùng Prisma kết nối MySQL.

## 2) Backend Architecture

### 2.1 Tech stack
- Node.js + Express
- Prisma ORM
- MySQL
- JWT cho authentication + RBAC

### 2.2 Cấu trúc thư mục
```text
server/
  src/
    app.js
    config/
    lib/
    middlewares/
    routes/
    modules/
      auth/
      doctors/
      appointments/
      consults/
      records/
      subscriptions/
  prisma/
    schema.prisma
    migrations/
```

### 2.3 Luồng request
1. Request vào `app.js`.
2. Parse JSON + CORS.
3. Vào `/api` router tổng.
4. Định tuyến tới module tương ứng.
5. Áp `authenticate`/`authorizeRoles` nếu cần.
6. Trả response chuẩn JSON.
7. Route lỗi và exception đi qua error middleware.

## 3) Frontend Architecture

### 3.1 Tech stack
- React + Vite
- React Router
- TailwindCSS

### 3.2 Điều hướng theo vai trò
- Public routes: trang chủ, login.
- Protected routes theo role:
  - `patient`
  - `doctor`
  - `admin`

### 3.3 Nguyên tắc
- Tách layout theo role để mở rộng dashboard về sau.
- Không khóa chặt logic vào UI để dễ tích hợp auth thật ở các phase tiếp theo.

## 4) Data layer (Phase 1)
- Bảng `users` là nền tảng cho auth.
- Enum `Role`: `patient`, `doctor`, `admin`.
- Các bảng nghiệp vụ khác sẽ được thêm theo phase.

## 5) Bảo mật cơ bản (Phase 1)
- Hash password bằng `bcryptjs`.
- JWT access/refresh token.
- RBAC middleware kiểm tra role trước route nhạy cảm.
