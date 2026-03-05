const nodemailer = require("nodemailer");
const { prisma } = require("../../lib/prisma");
const { env } = require("../../config/env");

const REMINDER_CHANNELS = ["IN_APP", "EMAIL"];
const REMINDER_HOURS = [24, 1];
const REMINDER_TYPE = "APPOINTMENT_REMINDER";
let workerInitialized = false;

// Tạo SMTP transporter khi có đủ biến môi trường, ngược lại trả về null.
function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.smtpFrom) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

// Tính 2 mốc reminder (24h và 1h) trước giờ bắt đầu lịch hẹn.
function buildReminderTimes(startAt) {
  return REMINDER_HOURS.map((hours) => {
    const scheduledFor = new Date(startAt);
    scheduledFor.setHours(scheduledFor.getHours() - hours);
    return scheduledFor;
  });
}

// Tạo reminder log cho appointment đã CONFIRMED, tránh trùng bằng unique key.
async function scheduleReminderLogsForAppointment(appointment) {
  const reminderTimes = buildReminderTimes(appointment.startAt);

  for (const scheduledFor of reminderTimes) {
    // Bỏ qua mốc nhắc đã nằm trong quá khứ.
    if (scheduledFor <= new Date()) {
      continue;
    }

    // Tạo đồng thời 2 kênh in-app và email cho mỗi mốc thời gian.
    for (const channel of REMINDER_CHANNELS) {
      await prisma.reminderLog.upsert({
        where: {
          appointmentId_channel_scheduledFor: {
            appointmentId: appointment.id,
            channel,
            scheduledFor,
          },
        },
        update: {
          status: "PENDING",
          errorMessage: null,
        },
        create: {
          appointmentId: appointment.id,
          channel,
          scheduledFor,
          status: "PENDING",
        },
      });
    }
  }
}

// Gửi nhắc lịch bằng thông báo in-app cho bệnh nhân sở hữu lịch hẹn.
async function processInAppReminder(reminderLog) {
  const { appointment } = reminderLog;

  await prisma.inAppNotification.create({
    data: {
      userId: appointment.patientUserId,
      type: REMINDER_TYPE,
      title: "Nhắc lịch khám",
      content: `Bạn có lịch hẹn với bác sĩ vào ${appointment.startAt.toISOString()}.`,
    },
  });
}

// Gửi nhắc lịch qua email; nếu thiếu SMTP thì ném lỗi để ghi FAILED log.
async function processEmailReminder(reminderLog, transporter) {
  const { appointment } = reminderLog;

  if (!transporter) {
    const error = new Error("SMTP configuration is missing");
    error.code = "SMTP_MISSING";
    throw error;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to: appointment.patient.email,
    subject: "[PickYourDoc] Nhắc lịch hẹn khám",
    text: `Xin chào, bạn có lịch hẹn với bác sĩ vào ${appointment.startAt.toISOString()}.`,
  });
}

// Xử lý queue reminder đến hạn: gửi thông báo và cập nhật trạng thái log.
async function processReminderQueue() {
  const now = new Date();
  const transporter = getTransporter();

  const pendingReminders = await prisma.reminderLog.findMany({
    where: {
      status: "PENDING",
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      appointment: {
        include: {
          patient: {
            select: { id: true, email: true },
          },
        },
      },
    },
    take: 100,
    orderBy: { scheduledFor: "asc" },
  });

  for (const reminderLog of pendingReminders) {
    try {
      // Tách nhánh xử lý theo từng kênh reminder.
      if (reminderLog.channel === "IN_APP") {
        await processInAppReminder(reminderLog);
      } else if (reminderLog.channel === "EMAIL") {
        await processEmailReminder(reminderLog, transporter);
      }

      // Đánh dấu thành công khi gửi xong.
      await prisma.reminderLog.update({
        where: { id: reminderLog.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      // Đánh dấu thất bại nhưng không làm crash toàn bộ worker.
      await prisma.reminderLog.update({
        where: { id: reminderLog.id },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      });
    }
  }
}

// Khởi động worker nhắc lịch chạy lặp mỗi phút, chỉ khởi tạo một lần.
function startReminderWorker() {
  if (workerInitialized) {
    return;
  }

  // Không khởi động worker nếu DATABASE_URL chưa được cấu hình hợp lệ.
  if (!env.databaseUrl || env.databaseUrl.includes("<")) {
    console.warn("[ReminderWorker] DATABASE_URL chưa sẵn sàng, tạm không khởi động worker.");
    return;
  }

  workerInitialized = true;

  setInterval(async () => {
    try {
      await processReminderQueue();
    } catch (error) {
      console.error("[ReminderWorker] process failed:", error.message);
    }
  }, 60 * 1000);
}

module.exports = { scheduleReminderLogsForAppointment, startReminderWorker };
