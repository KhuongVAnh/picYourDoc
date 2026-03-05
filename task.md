# TASK BOARD - MVP PickYourDoc

## 0) Bối cảnh nhanh (đọc trong 2 phút)
- Dự án: PickYourDoc (MVP 3 tháng).
- Mục tiêu MVP: tìm bác sĩ, đặt/hủy lịch, tư vấn từ xa (chat + video in-app), hồ sơ sức khỏe cá nhân/gia đình, gói dịch vụ + thanh toán giả lập, dashboard bác sĩ cơ bản.
- Stack đã chốt:
  - Backend: Node.js + Express.
  - ORM & DB: Prisma + MySQL (schema, migration, seed).
  - Frontend: React + Vite + TailwindCSS.
- Trạng thái hiện tại codebase:
  - Backend đã có module nền tảng và module Phase 2.
  - Frontend đã có React Router + role layout + màn hình Phase 2.
  - Tài liệu kỹ thuật: `README.md`, `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`.
  - Checklist tính năng: `PRODUCT_FEATURES.md`.

## 1) Ràng buộc bắt buộc (NON-NEGOTIABLE)
1. Ngôn ngữ tài liệu và mô tả task: **tiếng Việt có dấu, đúng chính tả**.
2. Thuật ngữ kỹ thuật giữ English khi cần (API, schema, business logic, WebRTC, JWT...).
3. **Không đổi API public, schema, hoặc business logic đã sẵn có** (do user hoặc agent khác đã thiết kế).
4. Được phép sáng tạo với phần tạo mới, miễn không vi phạm mục (3).
5. Nếu phát hiện cần đổi API/schema/business logic để tiếp tục:
   - Dừng task đang làm.
   - Ghi rõ vào mục `Blockers`.
   - Chỉ tiếp tục sau khi user phê duyệt.
6. Khi hoàn thành bất kỳ task nào, **bắt buộc cập nhật checklist feature tương ứng trong `PRODUCT_FEATURES.md`**.
7. **Không tạo Docker local**; `DATABASE_URL` sẽ do user tự cung cấp sau.

## 2) Quy ước làm việc đa-agent
- Mỗi task có mã: `BE-xx`, `FE-xx`, `DB-xx`, `QA-xx`, `DOC-xx`.
- Khi bắt đầu task: thêm tên người làm vào dòng task.
- Khi hoàn thành task: tick checkbox `[x]`, thêm ngày giờ và commit/reference.
- Khi hoàn thành task: tick luôn feature tương ứng trong `PRODUCT_FEATURES.md` (không được bỏ qua).
- Không xóa lịch sử; chỉ cập nhật trạng thái.
- Mỗi phiên làm việc phải cập nhật:
  - `Tiến độ hôm nay`
  - `Blockers`
  - `Next actions`

## 3) Định nghĩa trạng thái
- `[ ]` Chưa làm
- `[-]` Đang làm
- `[x]` Hoàn thành
- `[!]` Bị chặn

## 4) MVP Master Checklist

### Phase 1 - Foundation (Tuần 1-2)
- [x] `DOC-01` Chuẩn hóa cấu trúc tài liệu kỹ thuật (README root, kiến trúc, conventions). Owner: Codex - 2026-03-05
- [x] `BE-01` Tách backend thành module (`auth`, `doctors`, `appointments`, `consults`, `records`, `subscriptions`). Owner: Codex - 2026-03-05
- [x] `DB-01` Khởi tạo Prisma + MySQL schema + migration đầu tiên + seed script. Owner: Codex - 2026-03-05
- [x] `BE-02` Thiết lập JWT auth + RBAC (`patient`, `doctor`, `admin`). Owner: Codex - 2026-03-05
- [x] `FE-01` Setup React Router + layout theo role + TailwindCSS. Owner: Codex - 2026-03-05

### Phase 2 - Doctor Discovery & Appointments (Tuần 3-4)
- [x] `BE-03` API danh sách bác sĩ + filter (specialty/location/fee). Owner: Codex - 2026-03-05
- [x] `BE-04` API chi tiết hồ sơ bác sĩ. Owner: Codex - 2026-03-05
- [x] `BE-05` API đặt/hủy/đổi lịch với rule thời gian. Owner: Codex - 2026-03-05
- [x] `FE-02` UI tìm kiếm, lọc, so sánh bác sĩ. Owner: Codex - 2026-03-05
- [x] `FE-03` UI đặt/hủy/đổi lịch và lịch hẹn của bệnh nhân. Owner: Codex - 2026-03-05

### Phase 3 - Remote Consult (Tuần 5-7)
- [ ] `BE-06` Tích hợp Socket.IO cho chat realtime. Owner:
- [ ] `BE-07` Signaling WebRTC cho video call in-app 1:1. Owner:
- [ ] `BE-08` Lưu lịch sử chat theo `consult_session`. Owner:
- [ ] `FE-04` UI chat theo phiên tư vấn. Owner:
- [ ] `FE-05` UI video call in-app (start/end, trạng thái kết nối). Owner:

### Phase 4 - Health Records & Family (Tuần 8-9)
- [ ] `BE-09` API hồ sơ gia đình (CRUD thành viên). Owner:
- [ ] `BE-10` API timeline điều trị và ghi chú bác sĩ. Owner:
- [ ] `FE-06` UI quản lý hồ sơ cá nhân/gia đình. Owner:
- [ ] `FE-07` UI timeline sức khỏe cơ bản. Owner:

### Phase 5 - Subscription & Payment Mock (Tuần 10)
- [ ] `BE-11` API plans (Free/Premium/Family). Owner:
- [ ] `BE-12` API checkout mock + transaction log. Owner:
- [ ] `FE-08` UI chọn gói và thanh toán giả lập. Owner:
- [ ] `BE-13` Guard theo quyền lợi gói (feature gating). Owner:

### Phase 6 - Doctor Dashboard & Hardening (Tuần 11-12)
- [ ] `BE-14` API dashboard bác sĩ (lịch, bệnh nhân, follow-up). Owner:
- [ ] `FE-09` UI dashboard bác sĩ bản cơ bản. Owner:
- [ ] `QA-01` Test end-to-end cho các luồng chính. Owner:
- [ ] `QA-02` Kiểm tra bảo mật cơ bản (RBAC, access boundaries). Owner:
- [ ] `DOC-02` Chuẩn bị kịch bản demo Local/LAN + seed data. Owner:

## 5) Acceptance Criteria MVP
- [ ] Người dùng đăng ký/đăng nhập thành công theo role.
- [x] Tìm được bác sĩ theo filter, xem được hồ sơ bác sĩ.
- [x] Đặt lịch, hủy/đổi lịch hoạt động đúng rule.
- [ ] Chat và video call in-app hoạt động ổn định trong LAN.
- [ ] Lưu/xem lịch sử tư vấn và timeline sức khỏe.
- [ ] Đăng ký gói và thanh toán giả lập ghi nhận giao dịch.
- [ ] Bác sĩ xem dashboard cơ bản (lịch + bệnh nhân + follow-up).

## 6) KPI theo dõi
- [ ] Tỷ lệ đặt lịch thành công >= 85%.
- [ ] Tỷ lệ tham gia đúng hẹn >= 70%.
- [ ] Thời gian phản hồi trung bình của bác sĩ < 15 phút (trong giờ trực).
- [ ] CSAT sau tư vấn >= 4/5.

## 7) Tiến độ hôm nay
- Ngày: 2026-03-05
- Người cập nhật: Codex
- Đã xong:
  - Hoàn tất toàn bộ Phase 2 theo plan đã chốt.
  - Mở rộng Prisma schema + migration + seed cho doctors/appointments/notifications/reminders.
  - Implement API BE-03/BE-04/BE-05 và reminder worker in-app + email (fallback log nếu thiếu SMTP).
  - Implement UI FE-02/FE-03: doctor listing/filter/compare, doctor detail private, create/cancel/reschedule appointments, notification panel.
  - Chạy kiểm tra `client` lint/build + `server` prisma generate/validate + backend bootstrap.
- Đang làm:
  - Chuẩn bị handoff sang Phase 3.
- Kế tiếp:
  - Bắt đầu `BE-06`, `BE-07`, `FE-04`.

## 8) Blockers / Risks
- Mã blocker: BLK-002
- Mô tả: Chưa chạy migrate/seed thật trên môi trường production của user.
- Ảnh hưởng: Chưa có dữ liệu thật để QA end-to-end với DB live.
- Cần ai quyết định: User
- Deadline quyết định: Trước khi chuyển sang test tích hợp Phase 3.

## 9) Handoff cho agent tiếp theo
- Task đang dở: Chưa bắt đầu Phase 3 (`BE-06`, `BE-07`, `BE-08`, `FE-04`, `FE-05`).
- Bối cảnh kỹ thuật cần biết:
  - `GET /api/doctors` là public, `GET /api/doctors/:doctorId` yêu cầu JWT.
  - Appointment hỗ trợ hybrid: slot hoặc proposal, trạng thái `REQUESTED -> CONFIRMED`.
  - Reminder chạy mỗi phút, gửi in-app và email theo mốc 24h + 1h.
- File đã động vào:
  - `server/src/*`
  - `server/prisma/*`
  - `client/src/*`
  - `PRODUCT_FEATURES.md`, `task.md`
- Việc tiếp theo cụ thể:
  - Tích hợp Socket.IO cho consult room.
  - Tích hợp signaling WebRTC cho call 1:1.
  - Tạo chat timeline theo `consult_session`.
- Lưu ý tránh phá vỡ API/schema/business logic:
  - Không đổi auth contract `/api/auth/*`.
  - Không sửa migration đã có; chỉ thêm migration mới.

## 11) Agent Rules
- Khi viết hoặc sửa hàm, bắt buộc thêm comment ngắn ngay trên đầu hàm để mô tả tác dụng, các module nhỏ trong hàm cũng cần comment tác dụng.
- Comment trong code phải dùng tiếng Việt có dấu.
- Khi thay đổi database/schema, **không tự động tạo file migration**; user sẽ tự tạo migration.
