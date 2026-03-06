# Kịch bản Demo Local/LAN - PickYourDoc

## 1) Mục tiêu tài liệu
- Chuẩn hóa cách chạy demo MVP trong môi trường local/LAN.
- Cung cấp checklist kiểm tra nhanh để nhiều agent có thể handoff và demo đồng nhất.

## 2) Điều kiện tiên quyết
- [ ] MySQL đã chạy và `DATABASE_URL` hợp lệ trong `server/.env`.
- [ ] User đã tự tạo/chạy migration theo quy trình riêng.
- [ ] Đã cài dependency cho cả `server` và `client`.
- [ ] Đã cấu hình `client/.env`:
  - `VITE_API_BASE_URL`
  - `VITE_CLOUDINARY_CLOUD_NAME`
  - `VITE_CLOUDINARY_UNSIGNED_PRESET`
  - `VITE_CLOUDINARY_UNSIGNED_PRESET_RAW`

## 3) Khởi động hệ thống
### Backend
```bash
cd server
npm install
npm run prisma:generate
npm run prisma:seed
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 4) Tài khoản seed demo
### Nhóm cơ bản
- `patient.demo@picyourdoc.local` / `Patient@123`
- `admin.demo@picyourdoc.local` / `Admin@123`

### Nhóm bác sĩ có profile/slot đầy đủ
- `doctor.01@picyourdoc.local` / `Doctor@123`
- `doctor.02@picyourdoc.local` / `Doctor@123`
- `doctor.03@picyourdoc.local` / `Doctor@123`

## 5) Checklist demo MVP end-to-end
- [ ] Đăng nhập patient và kiểm tra route `/app/patient/overview`.
- [ ] Vào `/app/patient/subscription/plans`, thực hiện checkout mock.
- [ ] Vào `/app/patient/family`, tạo/cập nhật member.
- [ ] Vào `/app/patient/family/:memberId/records`, thêm timeline note + upload tài liệu.
- [ ] Vào `/app/patient/doctors`, tìm bác sĩ và đặt lịch.
- [ ] Đăng nhập doctor (`doctor.01`), xác nhận lịch từ dashboard/schedule.
- [ ] Doctor bấm bắt đầu consult, patient vào phòng tư vấn.
- [ ] Chat + video call hoạt động, doctor kết thúc phiên.
- [ ] Kiểm tra patient timeline đã có event consult hoàn thành.
- [ ] Kiểm tra doctor dashboard có cập nhật số liệu lịch/follow-up/thu nhập.

## 6) Checklist ACL quan trọng (family doctor vs one-time)
- [ ] One-time doctor không xem được full `health profile` nếu chưa là family doctor.
- [ ] One-time doctor chỉ xem được record đã share cho appointment hoặc record phát sinh trong appointment liên quan.
- [ ] Patient revoke share thì doctor mất quyền đọc record đó ngay.

## 7) Lệnh test nhanh nên chạy trước khi demo
```bash
cd server
node -e "require('./src/app'); console.log('backend app load ok')"
npm run test:security

cd ../client
npm run build
```

## 8) Troubleshooting nhanh
- Lỗi Prisma client:
  - Chạy lại `npm run prisma:generate`.
- Lỗi thiếu bảng:
  - User cần tự chạy migration trước khi seed.
- Lỗi ảnh không upload:
  - Kiểm tra Cloudinary `cloud name`, unsigned preset image/raw và giới hạn dung lượng file.
- Lỗi WebRTC trong LAN:
  - Kiểm tra network nội bộ, firewall và `VITE_WEBRTC_STUN_URLS`.
