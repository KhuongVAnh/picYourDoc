# Hướng Dẫn Điền ENV (Client + Server)

## 1) Mục tiêu
- Chuẩn hóa cách cấu hình biến môi trường cho dự án `PickYourDoc`.
- Giảm lỗi khi chạy local/LAN giữa nhiều máy/agent.

## 2) Cách tạo file `.env`

### Server
```bash
cd server
cp .env.example .env
```

### Client
```bash
cd client
cp .env.example .env
```

Nếu dùng PowerShell trên Windows:
```powershell
Copy-Item .env.example .env
```

## 3) Cấu hình cho `server/.env`

| Biến | Bắt buộc | Ví dụ | Ghi chú |
|---|---|---|---|
| `NODE_ENV` | Không | `development` | Môi trường chạy app. |
| `PORT` | Không | `3000` | Cổng backend. |
| `DATABASE_URL` | Có | `mysql://user:pass@localhost:3306/picyourdoc` | Chuỗi kết nối MySQL. |
| `JWT_ACCESS_SECRET` | Có | `replace_with_strong_secret` | Secret ký access token. |
| `JWT_REFRESH_SECRET` | Có | `replace_with_strong_secret` | Secret ký refresh token. |
| `JWT_ACCESS_EXPIRES_IN` | Không | `1h` | Hạn access token. |
| `JWT_REFRESH_EXPIRES_IN` | Không | `7d` | Hạn refresh token. |
| `APPOINTMENT_CANCEL_WINDOW_HOURS` | Không | `6` | Rule hủy/đổi lịch cho patient. |
| `CLIENT_ORIGIN` | Không | `http://localhost:5173` | Origin frontend để CORS/Socket hoạt động đúng. |
| `SMTP_HOST` | Không | `smtp.gmail.com` | Dùng cho reminder email. |
| `SMTP_PORT` | Không | `587` | Cổng SMTP. |
| `SMTP_USER` | Không | `your_mail@example.com` | User SMTP. |
| `SMTP_PASS` | Không | `app_password` | Password SMTP/app password. |
| `SMTP_FROM` | Không | `PickYourDoc <no-reply@pyd.local>` | Địa chỉ gửi email. |
| `FAMILY_DOCTOR_ADMIN_BANK_OWNER` | Có (nếu bật luồng thuê bác sĩ gia đình) | `CONG TY PICKYOURDOC` | Tên chủ tài khoản nhận chuyển khoản. |
| `FAMILY_DOCTOR_ADMIN_BANK_ACCOUNT` | Có (nếu bật luồng thuê bác sĩ gia đình) | `000000000000` | Số tài khoản quản trị viên. |
| `FAMILY_DOCTOR_ADMIN_BANK_NAME` | Có (nếu bật luồng thuê bác sĩ gia đình) | `Vietcombank` | Tên ngân hàng quản trị viên. |
| `FAMILY_DOCTOR_WEEKLY_FEE` | Có (nếu bật luồng thuê bác sĩ gia đình) | `349000` | Giá thuê bác sĩ theo tuần (VND). |
| `FAMILY_DOCTOR_MONTHLY_FEE` | Có (nếu bật luồng thuê bác sĩ gia đình) | `1199000` | Giá thuê bác sĩ theo tháng (VND). |

## 4) Cấu hình cho `client/.env`

| Biến | Bắt buộc | Ví dụ | Ghi chú |
|---|---|---|---|
| `VITE_API_BASE_URL` | Có | `http://localhost:3000` | URL backend API. |
| `VITE_WEBRTC_STUN_URLS` | Không | `stun:stun.l.google.com:19302` | STUN cho WebRTC. |
| `VITE_CLOUDINARY_CLOUD_NAME` | Có (nếu dùng upload ảnh/tài liệu) | `your_cloud_name` | Cloudinary cloud name. |
| `VITE_CLOUDINARY_UNSIGNED_PRESET` | Có (nếu dùng upload ảnh) | `unsigned_image_preset` | Unsigned preset cho ảnh. |
| `VITE_CLOUDINARY_UNSIGNED_PRESET_RAW` | Có (nếu dùng upload PDF/tài liệu) | `unsigned_raw_preset` | Unsigned preset cho file raw/PDF. |

## 5) Checklist kiểm tra sau khi điền ENV

### Backend
```bash
cd server
npm run prisma:generate
node -e "require('./src/app'); console.log('backend app load ok')"
```

### Frontend
```bash
cd client
npm run build
```

Nếu bạn đã migrate + seed:
```bash
cd server
npm run test:security
```

## 6) Lỗi thường gặp
- `P2021 table does not exist`: Chưa chạy migration hoặc `DATABASE_URL` trỏ sai DB.
- `CORS` lỗi khi gọi API: `CLIENT_ORIGIN` không khớp domain frontend.
- Upload Cloudinary lỗi `401/400`: Sai `cloud_name` hoặc sai unsigned preset.
- WebRTC không kết nối: STUN không hợp lệ hoặc mạng LAN/firewall chặn.
