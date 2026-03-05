# TASK BOARD - MVP PickYourDoc

## 0) Bối cảnh nhanh (đọc trong 2 phút)
- Dự án: PickYourDoc (MVP 3 tháng).
- Stack đã chốt:
  - Backend: Node.js + Express.
  - ORM & DB: Prisma + MySQL (schema, migration, seed).
  - Frontend: React + Vite + TailwindCSS.
- Mục tiêu MVP: tìm bác sĩ, đặt/hủy lịch, tư vấn từ xa (chat + video in-app), hồ sơ sức khỏe cá nhân/gia đình, gói dịch vụ + thanh toán giả lập, dashboard bác sĩ cơ bản.
- Trạng thái codebase hiện tại:
  - Phase 1 -> Phase 6 đã triển khai code đầy đủ theo plan MVP.
  - `QA-01` đã hoàn thành; các task còn mở: `QA-02`, `DOC-02`.

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
7. **Không tạo Docker local**; `DATABASE_URL` do user cung cấp.
8. Khi thay đổi database/schema, **không tự động tạo file migration**; user sẽ tự tạo migration.

## 2) Quy ước làm việc đa-agent
- Mỗi task có mã: `BE-xx`, `FE-xx`, `DB-xx`, `QA-xx`, `DOC-xx`.
- Khi bắt đầu task: thêm owner vào task.
- Khi hoàn thành task: tick `[x]`, thêm ngày giờ và commit/reference.
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
- [x] `BE-06` Tích hợp Socket.IO cho chat realtime. Owner: Codex - 2026-03-05
- [x] `BE-07` Signaling WebRTC cho video call in-app 1:1. Owner: Codex - 2026-03-05
- [x] `BE-08` Lưu lịch sử chat theo `consult_session`. Owner: Codex - 2026-03-05
- [x] `FE-04` UI chat theo phiên tư vấn. Owner: Codex - 2026-03-05
- [x] `FE-05` UI video call in-app (start/end, trạng thái kết nối). Owner: Codex - 2026-03-05

### Phase 4 - Health Records & Family (Tuần 8-9)
- [x] `BE-09` API hồ sơ gia đình (CRUD thành viên). Owner: Codex - 2026-03-05
- [x] `BE-10` API timeline điều trị và ghi chú bác sĩ. Owner: Codex - 2026-03-05
- [x] `FE-06` UI quản lý hồ sơ cá nhân/gia đình. Owner: Codex - 2026-03-05
- [x] `FE-07` UI timeline sức khỏe cơ bản. Owner: Codex - 2026-03-05

### Phase 5 - Subscription & Payment Mock (Tuần 10)
- [x] `BE-11` API plans (Free/Premium/Family). Owner: Codex - 2026-03-05
- [x] `BE-12` API checkout mock + transaction log. Owner: Codex - 2026-03-05
- [x] `FE-08` UI chọn gói và thanh toán giả lập. Owner: Codex - 2026-03-05
- [x] `BE-13` Guard theo quyền lợi gói (feature gating). Owner: Codex - 2026-03-05

### Phase 6 - Doctor Dashboard & Hardening (Tuần 11-12)
- [x] `BE-14` API dashboard bác sĩ (lịch, bệnh nhân, follow-up). Owner: Codex - 2026-03-05
- [x] `FE-09` UI dashboard bác sĩ bản cơ bản. Owner: Codex - 2026-03-05
- [x] `QA-01` Test end-to-end cho các luồng chính. Owner: Codex - 2026-03-05
- [ ] `QA-02` Kiểm tra bảo mật cơ bản (RBAC, access boundaries). Owner:
- [ ] `DOC-02` Chuẩn bị kịch bản demo Local/LAN + seed data. Owner:

## 5) Acceptance Criteria MVP
- [x] Người dùng đăng ký/đăng nhập thành công theo role.
- [x] Tìm được bác sĩ theo filter, xem được hồ sơ bác sĩ.
- [x] Đặt lịch, hủy/đổi lịch hoạt động đúng rule.
- [x] Chat và video call in-app hoạt động ổn định trong LAN.
- [x] Lưu/xem lịch sử tư vấn và timeline sức khỏe.
- [x] Đăng ký gói và thanh toán giả lập ghi nhận giao dịch.
- [x] Bác sĩ xem dashboard cơ bản (lịch + bệnh nhân + follow-up).

## 6) KPI theo dõi
- [ ] Tỷ lệ đặt lịch thành công >= 85%.
- [ ] Tỷ lệ tham gia đúng hẹn >= 70%.
- [ ] Thời gian phản hồi trung bình của bác sĩ < 15 phút (trong giờ trực).
- [ ] CSAT sau tư vấn >= 4/5.

## 7) Tiến độ hôm nay
- Ngày: 2026-03-05
- Người cập nhật: Codex
- Đã xong:
  - Hoàn thành code triển khai Phase 4-6:
    - Backend: modules `records`, `subscriptions`, mở rộng `doctors`, `consults`, `appointments`, `auth`.
    - Frontend: đầy đủ page Patient/Doctor theo plan (profile, family, records, plans/checkout/history, doctor schedule/patients/follow-ups/income/sla).
    - Prisma schema + seed mở rộng theo phạm vi MVP còn lại.
  - Hoàn thành lint/build frontend:
    - `npm run lint` (client) pass.
    - `npm run build` (client) pass.
  - Hoàn thành validate backend:
    - `npx prisma validate` (server) pass.
    - `node -e "require('./src/app')"` (server) pass.
  - Hoàn thành QA-01 với smoke test thực thi:
    - API smoke: 34 checks PASS (auth, doctors, appointments, consults, records, subscriptions, doctor dashboard, RBAC).
    - Realtime smoke: Socket.IO PASS (JWT connect, join room, message broadcast, signaling offer).
- Đang làm:
  - QA-02 (security checks: IDOR, role escalation, cross-family data leak).
- Kế tiếp:
  - Hoàn thiện `DOC-02` (kịch bản demo Local/LAN + seed account + script test nhanh).
  - Chốt QA-02 và cập nhật checklist cuối cùng.

## 8) Blockers / Risks
- Mã blocker: Không có blocker đang mở.
- Mô tả: `BLK-004` đã được gỡ sau khi user migrate + generate Prisma client.
- Ảnh hưởng: Không còn chặn `QA-01`; chỉ còn `QA-02` và `DOC-02` cần hoàn tất.
- Cần ai quyết định: N/A
- Deadline quyết định: N/A

## 9) Handoff cho agent tiếp theo
- Task đang dở:
  - `QA-02`, `DOC-02`.
- Bối cảnh kỹ thuật cần biết:
  - Gating đã được gắn vào consult start (`quota theo tháng`) và family member create (`familyMemberLimit`).
  - Settlement khi end consult đã ghi `UsageCounterMonthly` và `DoctorIncomeLedger`.
  - Records đã có ownership guard patient/doctor/admin và timeline auto cho confirm appointment + end consult.
  - Doctor dashboard đã có `summaryCards`, `upcomingAppointments`, `followUpTasks`, `slaMetrics`, `incomeMetrics`.
- File đã động vào:
  - `server/prisma/schema.prisma`
  - `server/prisma/seed.js`
  - `server/src/modules/auth/*`
  - `server/src/modules/appointments/appointments.service.js`
  - `server/src/modules/consults/consults.service.js`
  - `server/src/modules/doctors/*`
  - `server/src/modules/records/*`
  - `server/src/modules/subscriptions/*`
  - `client/src/App.jsx`
  - `client/src/auth/AuthContext.jsx`
  - `client/src/layouts/RoleLayout.jsx`
  - `client/src/layouts/PublicLayout.jsx`
  - `client/src/lib/api.js`
  - `client/src/lib/constants/plans.js`
  - `client/src/components/ConsultRoom.jsx`
  - `client/src/pages/*` (đã thêm đầy đủ page Patient + Doctor trong phạm vi MVP)
- Việc tiếp theo cụ thể:
  - Thực hiện `QA-02` theo checklist bảo mật (IDOR, role escalation, cross-family data leak).
  - Hoàn thiện `DOC-02` và chuẩn hóa script demo Local/LAN.
  - Tick `QA-02`, `DOC-02` khi hoàn thành.
- Lưu ý tránh phá vỡ API/schema/business logic:
  - Không thay đổi API auth/appointments/doctors đã có.
  - Không sửa migration cũ; chỉ thêm migration mới do user tạo.

## 11) Agent Rules
- Khi viết hoặc sửa hàm, bắt buộc thêm comment ngắn ngay trên đầu hàm để mô tả tác dụng; các module nhỏ trong hàm cũng cần comment tác dụng.
- Comment trong code phải dùng tiếng Việt có dấu.

## 12) Cập nhật thêm 2026-03-05 (UI Production Redesign)
- [x] Refactor route production theo IA mới:
  - Public: `/`, `/doctors`, `/pricing`, `/about`, `/auth/login`, `/auth/register`.
  - App zone: `/app/patient/*`, `/app/doctor/*`, `/app/admin/*`.
  - System pages: `/403`, `/404`, `/500`.
- [x] Dựng lại layout theo phong cách clinical dashboard:
  - Patient: top navigation sáng + quick cards + dashboard gần mẫu.
  - Doctor: sidebar xanh đậm + KPI cards + bảng lịch hẹn data-first.
- [x] Chuẩn hóa design system Tailwind:
  - Token màu/typography/box-shadow mới.
  - Component class dùng chung: `surface-card`, `btn-primary`, `btn-soft`, `btn-warning`, `input-base`.
- [x] Tích hợp Cloudinary unsigned upload phía client (`users/`, `doctors/`, `family/`, `timeline/`, `care-plans/`).
- [x] Mở rộng backend theo hướng additive cho media fields (không phá API cũ):
  - `DoctorProfile.avatarUrl`
  - `FamilyMember.avatarUrl`
  - `TimelineEntry.imageUrls`
  - `CarePlan.imageUrls`
  - `SubscriptionPlan.thumbnailUrl`
- [x] Cập nhật service/backend response để FE nhận và hiển thị ảnh end-to-end.
- [x] Cập nhật seed mẫu có avatar/thumbnail để demo UI.
- [x] Kiểm tra kỹ thuật:
  - `client`: `npm run lint` pass, `npm run build` pass.
  - `server`: `npx prisma validate` pass, app bootstrap pass.
- [ ] Việc user cần làm sau pull code:
  - Tự tạo/chạy migration cho các field mới trong `schema.prisma`.
  - Seed lại dữ liệu nếu muốn có avatar/thumbnail demo.
