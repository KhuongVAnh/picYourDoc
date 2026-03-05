# TASK BOARD - MVP PickYourDoc

## 0) Bối cảnh nhanh (đọc trong 2 phút)
- Dự án: PickYourDoc (MVP 3 tháng).
- Stack đã chốt:
  - Backend: Node.js + Express.
  - ORM & DB: Prisma + MySQL (schema, migration, seed).
  - Frontend: React + Vite + TailwindCSS.
- Mục tiêu MVP: tìm bác sĩ, đặt/hủy lịch, tư vấn từ xa (chat + video in-app), hồ sơ sức khỏe cá nhân/gia đình, gói dịch vụ + thanh toán giả lập, dashboard bác sĩ cơ bản.
- Trạng thái codebase hiện tại:
  - Phase 1 và Phase 2 đã hoàn thành.
  - Phase 3 đã triển khai code (REST + Socket + UI), cần user chạy migration và test E2E trên DB thực tế.

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
  - Hoàn thành code Phase 3:
    - Backend: `consults` REST API (start/get session/get messages/end session), Socket.IO auth + room + chat realtime + signaling WebRTC + event phiên kết thúc.
    - Frontend: trang consult cho doctor/patient, chat realtime, video call 1:1, nút vào phòng tư vấn từ lịch hẹn và dashboard bác sĩ.
  - Cập nhật `README.md` và `.env.example` với `CLIENT_ORIGIN`.
  - Cập nhật checklist task + feature theo Phase 3.
- Đang làm:
  - Chờ user chạy migration mới cho schema consult trên DB thực tế.
- Kế tiếp:
  - Chạy test scenario API/socket/video trên môi trường đã migrate.
  - Bắt đầu Phase 4 sau khi xác nhận Phase 3 pass E2E.

## 8) Blockers / Risks
- Mã blocker: BLK-003
- Mô tả: `npm run prisma:generate` bị lỗi `EPERM` do file query engine đang bị lock trên Windows/OneDrive.
- Ảnh hưởng: Chưa xác nhận được vòng kiểm tra Prisma generate sau khi sửa schema.
- Cần ai quyết định: User
- Deadline quyết định: Trước khi chạy E2E Phase 3.

## 9) Handoff cho agent tiếp theo
- Task đang dở:
  - QA scenario Phase 3 trên DB đã migrate.
- Bối cảnh kỹ thuật cần biết:
  - `consult_session` chỉ được tạo khi doctor gọi `POST /api/consults/appointments/:appointmentId/start`.
  - Patient vào phòng tư vấn qua route `/patient/consults/:appointmentId`, nếu chưa có session sẽ ở trạng thái chờ.
  - Socket events đã có: join/leave/message/send/signal offer-answer-ice/call end.
  - WebRTC hiện tại LAN-first (STUN tối thiểu), chưa có TURN.
- File đã động vào:
  - `server/prisma/schema.prisma`
  - `server/src/modules/consults/*`
  - `server/src/realtime/socket.js`
  - `server/index.js`, `server/src/config/env.js`
  - `client/src/components/ConsultRoom.jsx`
  - `client/src/pages/DoctorConsultPage.jsx`
  - `client/src/pages/PatientConsultPage.jsx`
  - `client/src/pages/DoctorDashboardPage.jsx`
  - `client/src/pages/AppointmentsPage.jsx`
  - `client/src/lib/api.js`, `client/src/lib/socket.js`, `client/src/App.jsx`
- Việc tiếp theo cụ thể:
  - User chạy migration cho schema consult.
  - Re-run `prisma:generate` khi không còn lock file.
  - Test checklist Phase 3 mục 7.1 -> 7.4.
- Lưu ý tránh phá vỡ API/schema/business logic:
  - Không thay đổi API auth/appointments/doctors đã có.
  - Không sửa migration cũ; chỉ thêm migration mới do user tạo.

## 11) Agent Rules
- Khi viết hoặc sửa hàm, bắt buộc thêm comment ngắn ngay trên đầu hàm để mô tả tác dụng; các module nhỏ trong hàm cũng cần comment tác dụng.
- Comment trong code phải dùng tiếng Việt có dấu.
