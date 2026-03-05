const { app } = require("./src/app");
const { env } = require("./src/config/env");
const { startReminderWorker } = require("./src/modules/reminders/reminder.service");

// Khởi động worker nhắc lịch nội bộ chạy nền mỗi phút.
startReminderWorker();

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
