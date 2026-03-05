# PickYourDoc - Checklist tính năng sản phẩm

## 1) Mục tiêu tài liệu
- Dùng làm checklist tính năng để toàn đội cập nhật tiến độ thực thi theo thời gian thực.
- Đồng bộ với `task.md` để tránh lệch trạng thái giữa task kỹ thuật và feature sản phẩm.

## 2) Quy ước checklist
- `[ ]` Chưa làm
- `[-]` Đang làm
- `[x]` Hoàn thành
- `[!]` Bị chặn
- `[MVP]` Thuộc phạm vi MVP 3 tháng
- `[POST-MVP]` Thuộc phase sau MVP
- `[FOUNDATION]` Hạ tầng nền tảng để mở khóa các feature MVP

## 3) Checklist tính năng

### A) Foundation (hạ tầng mở khóa MVP)
- [x] `FND-01` [FOUNDATION] Backend tách module (`auth`, `doctors`, `appointments`, `consults`, `records`, `subscriptions`).
- [x] `FND-02` [FOUNDATION] Auth nền tảng: đăng ký/đăng nhập JWT + RBAC theo role.
- [x] `FND-03` [FOUNDATION] ORM & DB: Prisma + MySQL schema + migration + seed script.
- [x] `FND-04` [FOUNDATION] Frontend setup React Router + layout theo role.
- [x] `FND-05` [FOUNDATION] Frontend setup TailwindCSS.

### B) Giao diện người dùng (Bệnh nhân/Gia đình)
- [x] `USER-01` [MVP] Tìm bác sĩ theo chuyên khoa/triệu chứng/khu vực/phí/bảo hiểm.
- [x] `USER-02` [MVP] Xem hồ sơ bác sĩ (bằng cấp, kinh nghiệm, phí khám, đánh giá).
- [x] `USER-03` [MVP] Đặt lịch khám online theo khung giờ trống.
- [x] `USER-04` [MVP] Hủy/đổi lịch khám theo chính sách thời gian.
- [x] `USER-05` [MVP] Nhắc lịch tự động (in-app, email; SMS/push để mở rộng).
- [x] `USER-06` [MVP] Chat tư vấn với bác sĩ trong phiên khám.
- [x] `USER-07` [MVP] Video call in-app với bác sĩ.
- [x] `USER-08` [MVP] Lưu lịch sử tư vấn theo `consult_session`.
- [ ] `USER-09` [MVP] Hồ sơ sức khỏe cá nhân (bệnh nền, dị ứng, thuốc, kết quả xét nghiệm).
- [ ] `USER-10` [MVP] Hồ sơ sức khỏe gia đình (quản lý nhiều thành viên).
- [ ] `USER-11` [MVP] Timeline điều trị cơ bản cho cá nhân/gia đình.
- [ ] `USER-12` [MVP] Thanh toán online cho gói dịch vụ.
- [ ] `USER-13` [MVP] Đăng ký gói Free/Premium/Family.
- [ ] `USER-14` [POST-MVP] Theo dõi chỉ số sức khỏe nâng cao (nhập tay/đồng bộ thiết bị).
- [ ] `USER-15` [POST-MVP] Dashboard sức khỏe nâng cao với biểu đồ xu hướng.
- [ ] `USER-16` [POST-MVP] Nội dung y khoa kiểm duyệt (bài viết/video/infographic).
- [ ] `USER-17` [POST-MVP] Hỏi đáp công khai cộng đồng (upvote, bình luận, theo dõi chủ đề).
- [ ] `USER-18` [POST-MVP] CSKH/Chatbot nâng cao.

### C) Giao diện bác sĩ
- [ ] `DOC-01` [MVP] PHR tập trung: xem bệnh sử, xét nghiệm, đơn thuốc, timeline.
- [ ] `DOC-02` [MVP] Quản lý kế hoạch chăm sóc định kỳ (nhắc tái khám, nhắc thuốc, follow-up).
- [x] `DOC-03` [MVP] Kênh liên lạc đa phương thức (chat/video) lưu trữ thành bệnh án.
- [x] `DOC-04` [MVP] Lịch biểu thông minh (ngày/tuần/tháng, slots đặt lịch).
- [ ] `DOC-05` [MVP] Quản lý gói dịch vụ và SLA phản hồi.
- [x] `DOC-06` [MVP] Quản lý lịch khám online/offline.
- [ ] `DOC-07` [MVP] Quản lý thu nhập cơ bản theo số ca và giờ trực.
- [ ] `DOC-08` [POST-MVP] Dashboard theo dõi real-time ECG/SpO2 từ Ironman Holter.
- [ ] `DOC-09` [POST-MVP] Cảnh báo tức thì khi phát hiện chỉ số bất thường.
- [ ] `DOC-10` [POST-MVP] Giám sát chỉ số sức khỏe bệnh nhân từ dữ liệu nhập/thiết bị.
- [ ] `DOC-11` [POST-MVP] Gán nhãn dữ liệu y khoa với hỗ trợ AI.

## 4) Quy tắc cập nhật khi hoàn thành
- Khi hoàn thành một task trong `task.md`, bắt buộc tick feature tương ứng trong file này.
- Nếu một task kỹ thuật chạm nhiều feature, phải cập nhật toàn bộ feature liên quan.
- Nếu feature chưa thể hoàn thành do phụ thuộc, đổi trạng thái thành `[!]` và ghi chi tiết ở `Blockers` trong `task.md`.
- Không tự ý đổi mã feature (`FND-xx`, `USER-xx`, `DOC-xx`) nếu chưa thống nhất toàn đội.

## 5) Mapping nhanh giữa task và feature
- `DOC-01` -> `FND-01`
- `BE-01` -> `FND-01`
- `DB-01` -> `FND-03`
- `BE-02` -> `FND-02`
- `FE-01` -> `FND-04`, `FND-05`
- `BE-03`, `BE-04`, `FE-02` -> `USER-01`, `USER-02`
- `BE-05`, `FE-03` -> `USER-03`, `USER-04`, `USER-05`, `DOC-04`, `DOC-06`
- `BE-06`, `BE-07`, `BE-08`, `FE-04`, `FE-05` -> `USER-06`, `USER-07`, `USER-08`, `DOC-03`
- `BE-09`, `BE-10`, `FE-06`, `FE-07` -> `USER-09`, `USER-10`, `USER-11`, `DOC-01`, `DOC-02`
- `BE-11`, `BE-12`, `BE-13`, `FE-08` -> `USER-12`, `USER-13`, `DOC-05`
- `BE-14`, `FE-09` -> `DOC-02`, `DOC-04`, `DOC-05`, `DOC-06`, `DOC-07`
