const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");
const subscriptionsService = require("../subscriptions/subscriptions.service");
const recordsService = require("../records/records.service");

// Tạo lỗi HTTP chuẩn để đồng bộ xử lý ở controller/middleware.
function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Xây dựng dữ liệu chi tiết phiên tư vấn để tái sử dụng cho API/socket.
function toConsultSessionDetail(session) {
  return {
    id: session.id,
    appointmentId: session.appointmentId,
    status: session.status,
    startedByUserId: session.startedByUserId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    completedAt: session.completedAt,
    incomeSettledAt: session.incomeSettledAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    patientUserId: session.appointment.patientUserId,
    doctorUserId: session.appointment.doctor.userId,
    doctorProfileId: session.appointment.doctorId,
  };
}

// Chuẩn hóa dữ liệu message trước khi trả về client.
function toConsultMessageDetail(message) {
  return {
    id: message.id,
    sessionId: message.sessionId,
    senderUserId: message.senderUserId,
    senderRole: message.sender.role,
    senderEmail: message.sender.email,
    messageType: message.messageType,
    content: message.content,
    createdAt: message.createdAt,
  };
}

// Lấy appointment kèm thông tin cần thiết để kiểm tra quyền truy cập.
async function getAppointmentById(appointmentId) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        select: {
          id: true,
          userId: true,
          fullName: true,
        },
      },
    },
  });
}

// Kiểm tra quyền truy cập appointment theo role hiện tại.
function assertAppointmentAccess(appointment, user, allowAdmin = false) {
  if (!appointment) {
    throw createHttpError("Appointment not found", 404);
  }

  if (allowAdmin && user.role === "admin") {
    return;
  }

  if (user.role === "patient" && appointment.patientUserId === user.userId) {
    return;
  }

  if (user.role === "doctor" && appointment.doctor.userId === user.userId) {
    return;
  }

  throw createHttpError("Forbidden", 403);
}

// Lấy session theo appointment và gắn include để dùng được cho response.
async function getSessionByAppointmentId(appointmentId) {
  return prisma.consultSession.findUnique({
    where: { appointmentId },
    include: {
      appointment: {
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              fullName: true,
            },
          },
        },
      },
    },
  });
}

// Lấy session theo ID với quan hệ appointment/doctor cho kiểm tra quyền.
async function getSessionById(sessionId) {
  return prisma.consultSession.findUnique({
    where: { id: sessionId },
    include: {
      appointment: {
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              fullName: true,
            },
          },
        },
      },
    },
  });
}

// Kiểm tra quyền truy cập consult session theo role và ownership.
function assertSessionAccess(session, user, allowAdmin = false) {
  if (!session) {
    throw createHttpError("Consult session not found", 404);
  }

  if (allowAdmin && user.role === "admin") {
    return;
  }

  if (user.role === "patient" && session.appointment.patientUserId === user.userId) {
    return;
  }

  if (user.role === "doctor" && session.appointment.doctor.userId === user.userId) {
    return;
  }

  throw createHttpError("Forbidden", 403);
}

// Chỉ định user đích có thuộc phiên tư vấn hiện tại hay không.
function isUserInSession(session, userId) {
  return (
    session.appointment.patientUserId === userId ||
    session.appointment.doctor.userId === userId
  );
}

// Kiểm tra dữ liệu nội dung tin nhắn trước khi lưu.
function validateMessageContent(content) {
  if (typeof content !== "string") {
    throw createHttpError("content must be a string", 400);
  }

  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 1000) {
    throw createHttpError("content length must be between 1 and 1000", 400);
  }

  return trimmed;
}

// Doctor bắt đầu phiên tư vấn từ lịch hẹn CONFIRMED theo cơ chế idempotent.
async function startConsultSession({ appointmentId, user }) {
  if (user.role !== "doctor") {
    throw createHttpError("Only doctor can start consult session", 403);
  }

  const appointment = await getAppointmentById(appointmentId);
  assertAppointmentAccess(appointment, user, false);

  if (appointment.status !== "CONFIRMED") {
    throw createHttpError("Only confirmed appointment can start consult session", 400);
  }

  const existingSession = await getSessionByAppointmentId(appointmentId);
  if (existingSession) {
    if (existingSession.status === "ACTIVE") {
      return toConsultSessionDetail(existingSession);
    }
    throw createHttpError("Consult session already ended", 409);
  }

  // Chặn mở phiên khi quota tư vấn của bệnh nhân đã hết.
  await subscriptionsService.ensureConsultQuotaOrThrow(appointment.patientUserId, new Date());

  const created = await prisma.consultSession.create({
    data: {
      appointmentId,
      status: "ACTIVE",
      startedByUserId: user.userId,
      startedAt: new Date(),
    },
    include: {
      appointment: {
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  return toConsultSessionDetail(created);
}

// Lấy phiên tư vấn theo appointment cho patient/doctor/admin.
async function getConsultSessionByAppointment({ appointmentId, user }) {
  const appointment = await getAppointmentById(appointmentId);
  assertAppointmentAccess(appointment, user, true);

  const session = await getSessionByAppointmentId(appointmentId);
  if (!session) {
    throw createHttpError("Consult session not found", 404);
  }

  return toConsultSessionDetail(session);
}

// Lấy lịch sử tin nhắn theo session có phân trang.
async function getConsultMessages({ sessionId, user, query }) {
  const session = await getSessionById(sessionId);
  assertSessionAccess(session, user, true);

  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 50,
    maxLimit: 100,
  });

  const [messages, total] = await Promise.all([
    prisma.consultMessage.findMany({
      where: { sessionId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.consultMessage.count({
      where: { sessionId },
    }),
  ]);

  return {
    data: messages.map(toConsultMessageDetail),
    meta: buildMeta({ page, limit, total }),
  };
}

// Doctor kết thúc phiên tư vấn đang ACTIVE và settle usage/income.
async function endConsultSession({ sessionId, user }) {
  if (user.role !== "doctor") {
    throw createHttpError("Only doctor can end consult session", 403);
  }

  const session = await getSessionById(sessionId);
  assertSessionAccess(session, user, false);

  if (session.status !== "ACTIVE") {
    throw createHttpError("Consult session is not active", 409);
  }

  const endedAt = new Date();
  const updated = await prisma.consultSession.update({
    where: { id: sessionId },
    data: {
      status: "ENDED",
      endedAt,
      completedAt: endedAt,
    },
    include: {
      appointment: {
        include: {
          doctor: {
            select: {
              id: true,
              userId: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  // Cộng usage theo tháng và ghi nhận thu nhập bác sĩ theo plan.
  await subscriptionsService.settleConsultUsageAndIncome({
    sessionId: updated.id,
    settledAt: endedAt,
  });
  // Tạo timeline tự động cho thành viên primary của bệnh nhân.
  await recordsService.createTimelineEntryForConsultCompleted(updated.id);

  const refreshed = await getSessionById(updated.id);
  return toConsultSessionDetail(refreshed);
}

// Xác thực thành viên socket có quyền join/gửi sự kiện trong phiên ACTIVE.
async function ensureRealtimeSessionAccess({ sessionId, user }) {
  const session = await getSessionById(sessionId);
  assertSessionAccess(session, user, false);

  if (session.status !== "ACTIVE") {
    throw createHttpError("Consult session is not active", 409);
  }

  return session;
}

// Lưu tin nhắn realtime sau khi đã xác thực quyền và trạng thái phiên.
async function saveRealtimeMessage({ sessionId, user, content }) {
  const normalizedContent = validateMessageContent(content);
  const session = await ensureRealtimeSessionAccess({ sessionId, user });

  const created = await prisma.consultMessage.create({
    data: {
      sessionId: session.id,
      senderUserId: user.userId,
      messageType: "TEXT",
      content: normalizedContent,
    },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return toConsultMessageDetail(created);
}

// Kiểm tra user nhận tín hiệu WebRTC có nằm trong cùng consult session hay không.
async function ensureSignalRecipient({ sessionId, user, toUserId }) {
  const session = await ensureRealtimeSessionAccess({ sessionId, user });

  if (!toUserId || typeof toUserId !== "string") {
    throw createHttpError("toUserId is required", 400);
  }

  if (!isUserInSession(session, toUserId)) {
    throw createHttpError("Recipient is not in this consult session", 400);
  }

  return session;
}

module.exports = {
  startConsultSession,
  getConsultSessionByAppointment,
  getConsultMessages,
  endConsultSession,
  ensureRealtimeSessionAccess,
  saveRealtimeMessage,
  ensureSignalRecipient,
  toConsultSessionDetail,
  toConsultMessageDetail,
};
