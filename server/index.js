const http = require("http");
const { app } = require("./src/app");
const { env } = require("./src/config/env");
const { startReminderWorker } = require("./src/modules/reminders/reminder.service");
const { initializeSocketServer } = require("./src/realtime/socket");

const httpServer = http.createServer(app);

// Khởi tạo Socket.IO server dùng chung cho chat realtime và signaling WebRTC.
initializeSocketServer(httpServer);

// Khởi động worker nhắc lịch nội bộ chạy nền mỗi phút.
startReminderWorker();

httpServer.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
