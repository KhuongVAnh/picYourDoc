# AGENT PLAYBOOK - PickYourDoc

## 1) Mục tiêu tài liệu
- Đây là tài liệu điều phối chuẩn cho tất cả agent khi làm việc trong dự án.
- Mục tiêu: không phá vỡ quy tắc, cập nhật tiến độ minh bạch, handoff nhanh cho agent kế tiếp.
- Tài liệu nguồn cần đọc trước khi làm:
  - `task.md` (single source of truth cho tiến độ task).
  - `PRODUCT_FEATURES.md` (single source of truth cho checklist tính năng).

## 2) Quy tắc bất biến (NON-NEGOTIABLE)
- [ ] Dùng tiếng Việt có dấu, đúng chính tả cho mô tả và comment.
- [ ] Thuật ngữ kỹ thuật giữ English khi cần: API, schema, business logic, JWT, WebRTC...
- [ ] Không thay đổi public API, schema, business logic đã có nếu chưa được user phê duyệt.
- [ ] Không tự tạo migration file; user tự tạo và chạy migration.
- [ ] Không dùng Docker local.
- [ ] Khi sửa hoặc viết hàm: bắt buộc có comment tiếng Việt có dấu ngay trên đầu hàm; các khối xử lý chính trong hàm cũng cần comment ngắn.
- [ ] Hoàn thành task nào phải tick checklist tương ứng trong cả `task.md` và `PRODUCT_FEATURES.md`.

## 3) Quy trình chuẩn cho mỗi phiên làm việc

### 3.1 Checklist trước khi code (Pre-flight)
- [ ] Đọc `task.md` để xác định task đang mở và mức ưu tiên.
- [ ] Đọc `PRODUCT_FEATURES.md` để map task -> feature cần tick.
- [ ] Xác nhận phạm vi thay đổi là additive, không phá contract cũ.
- [ ] Nếu có rủi ro phải đổi API/schema/business logic: dừng và ghi vào `Blockers` trong `task.md`.

### 3.2 Checklist trong khi code (Execution)
- [ ] Chỉ sửa file liên quan trực tiếp đến task.
- [ ] Giữ naming, coding style, và conventions hiện có của project.
- [ ] Thêm comment tiếng Việt có dấu cho hàm mới/hàm sửa.
- [ ] Không xóa lịch sử hoặc ghi đè thông tin tiến độ cũ trong tài liệu.

### 3.3 Checklist sau khi code (Post-flight)
- [ ] Tự test tối thiểu luồng vừa sửa (API/UI/unit/smoke tùy task).
- [ ] Cập nhật `task.md`:
  - Đánh dấu trạng thái task (`[x]`, `[-]`, `[!]`).
  - Cập nhật `Tiến độ hôm nay`.
  - Cập nhật `Blockers` nếu có.
  - Cập nhật `Handoff cho agent tiếp theo`.
- [ ] Cập nhật `PRODUCT_FEATURES.md` và tick đúng feature hoàn thành.
- [ ] Ghi rõ file đã động vào để agent kế tiếp theo dõi.

## 4) Quy tắc checklist và timeline (bắt buộc)
- Không được sửa checklist bằng cách xóa lịch sử cũ.
- Mọi cập nhật timeline phải append bản ghi mới, không ghi đè bản ghi cũ.
- Mỗi bản ghi timeline phải có đủ:
  - `Ngày giờ`.
  - `Agent`.
  - `Task ID`.
  - `Kết quả`.
  - `Files changed`.
  - `Next action`.

## 5) Mẫu timeline chuẩn (copy để dùng)

```md
## Timeline cập nhật

- [ ] 2026-03-06 10:00 | Agent: codex
  - Task ID: BE-xx
  - Trạng thái: [-]
  - Kết quả: Đang triển khai...
  - Files changed: `server/src/...`
  - Next action: Hoàn tất test API

- [x] 2026-03-06 11:30 | Agent: codex
  - Task ID: BE-xx
  - Trạng thái: [x]
  - Kết quả: Đã hoàn tất endpoint + test pass
  - Files changed: `server/src/...`, `task.md`, `PRODUCT_FEATURES.md`
  - Next action: Handoff FE-yy
```

## 6) Mẫu prompt chuẩn cho user (để agent không phá quy tắc)

### 6.1 Prompt bắt đầu task mới
```text
Thực hiện task [TASK_ID] trong task.md.
Ràng buộc bắt buộc:
1) Không đổi public API/schema/business logic hiện có.
2) Không tự tạo migration, tôi sẽ tự tạo.
3) Comment trong code bằng tiếng Việt có dấu.
4) Xong task phải cập nhật checklist ở task.md và PRODUCT_FEATURES.md.
Yêu cầu: báo các giả định trước khi làm nếu có rủi ro phá vỡ rule.
```

### 6.2 Prompt yêu cầu cập nhật tiến độ
```text
Cập nhật tiến độ theo mẫu timeline trong AGENT_PLAYBOOK.md:
- Đã xong
- Đang làm
- Blockers
- Next actions
Đồng thời cập nhật trạng thái checklist trong task.md và PRODUCT_FEATURES.md.
```

### 6.3 Prompt khi cần phê duyệt thay đổi nhạy cảm
```text
Nếu cần đổi API/schema/business logic để tiếp tục, dừng lại và ghi Blocker chi tiết vào task.md.
Chỉ thực hiện tiếp sau khi tôi trả lời "APPROVED".
```

### 6.4 Prompt review an toàn trước khi merge
```text
Review thay đổi theo hướng tìm bug/risk/regression.
Bắt buộc liệt kê:
1) Finding theo mức độ nghiêm trọng.
2) File/line liên quan.
3) Test còn thiếu.
Không tự sửa gì thêm nếu chưa có xác nhận của tôi.
```

## 7) Anti-pattern prompts (tránh dùng)
- "Cứ làm toàn bộ luôn, tự quyết định mọi thứ" -> dễ vượt phạm vi và phá contract.
- "Sửa schema cho tiện rồi update API luôn" -> vi phạm rule bất biến.
- "Bỏ qua checklist giúp mình" -> làm mất khả năng theo dõi đa-agent.
- "Xóa log cũ cho gọn" -> mất timeline và khả năng audit.

## 8) Definition of Done cho mỗi task
- [ ] Code hoàn tất theo đúng phạm vi task.
- [ ] Test liên quan đã chạy và có kết quả.
- [ ] Không vi phạm các quy tắc bất biến.
- [ ] `task.md` đã cập nhật trạng thái + timeline + handoff.
- [ ] `PRODUCT_FEATURES.md` đã tick đúng feature hoàn thành.
- [ ] Có ghi chú ngắn cho agent kế tiếp biết bước tiếp theo.

## 9) Quy tắc handoff bắt buộc
- Task đang dở ghi rõ mức hoàn thành (% hoặc trạng thái).
- Nêu chính xác file đã sửa.
- Nêu lệnh test đã chạy và kết quả pass/fail.
- Nêu rủi ro còn tồn tại và cách xử lý đề xuất.
- Nêu hành động cụ thể tiếp theo để agent mới làm ngay.
