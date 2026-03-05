const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");
const { env } = require("../../config/env");
const { scheduleReminderLogsForAppointment } = require("../reminders/reminder.service");
const { ACTIVE_APPOINTMENT_STATUSES } = require("./appointments.constants");
const APPOINTMENT_STATUS_SET = new Set([
  "REQUESTED",
  "CONFIRMED",
  "REJECTED",
  "CANCELLED",
  "RESCHEDULED",
  "COMPLETED",
]);

// Chuyển input sang Date và chặn trường hợp dữ liệu ngày giờ không hợp lệ.
function ensureDate(value, fieldName) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} is invalid`);
    error.statusCode = 400;
    throw error;
  }
  return date;
}

// Đảm bảo khoảng thời gian lịch hẹn hợp lệ (start < end).
function ensureTimeRange(startAt, endAt) {
  if (startAt >= endAt) {
    const error = new Error("startAt must be earlier than endAt");
    error.statusCode = 400;
    throw error;
  }
}

// Lấy hồ sơ bác sĩ theo ID, nếu không tồn tại thì trả lỗi 404.
async function getDoctorProfileOrFail(doctorId) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    select: { id: true, userId: true, fullName: true },
  });

  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    throw error;
  }
  return doctor;
}

// Kiểm tra bác sĩ có lịch active bị chồng chéo trong khoảng thời gian yêu cầu hay không.
async function checkDoctorConflict({ doctorId, startAt, endAt, excludeAppointmentId }) {
  const where = {
    doctorId,
    status: { in: ACTIVE_APPOINTMENT_STATUSES },
    startAt: { lt: endAt },
    endAt: { gt: startAt },
  };

  if (excludeAppointmentId) {
    where.id = { not: excludeAppointmentId };
  }

  const count = await prisma.appointment.count({ where });
  return count > 0;
}

// Tạo lịch hẹn theo slot có sẵn; vẫn tạo REQUESTED nếu phát hiện xung đột.
async function createAppointmentBySlot({ patientUserId, doctorId, slotId, reason }) {
  const doctor = await getDoctorProfileOrFail(doctorId);
  const slot = await prisma.doctorSlot.findFirst({
    where: {
      id: slotId,
      doctorId: doctor.id,
    },
  });

  if (!slot) {
    const error = new Error("Slot not found");
    error.statusCode = 404;
    throw error;
  }

  const overlapConflict = await checkDoctorConflict({
    doctorId: doctor.id,
    startAt: slot.startAt,
    endAt: slot.endAt,
  });

  const conflictFlag = overlapConflict || slot.isBooked || !slot.isActive;

  const appointment = await prisma.appointment.create({
    data: {
      patientUserId,
      doctorId: doctor.id,
      sourceType: "SLOT",
      status: "REQUESTED",
      startAt: slot.startAt,
      endAt: slot.endAt,
      reason: reason || null,
      conflictFlag,
      slotId: slot.id,
    },
    include: {
      doctor: {
        select: {
          id: true,
          fullName: true,
          specialty: true,
        },
      },
      slot: true,
    },
  });

  return appointment;
}

// Tạo lịch hẹn theo giờ đề xuất; nếu trùng thì đánh dấu conflictFlag.
async function createAppointmentByProposal({
  patientUserId,
  doctorId,
  proposedStartAt,
  proposedEndAt,
  reason,
}) {
  const doctor = await getDoctorProfileOrFail(doctorId);
  const startAt = ensureDate(proposedStartAt, "proposedStartAt");
  const endAt = ensureDate(proposedEndAt, "proposedEndAt");
  ensureTimeRange(startAt, endAt);

  const conflictFlag = await checkDoctorConflict({
    doctorId: doctor.id,
    startAt,
    endAt,
  });

  const appointment = await prisma.appointment.create({
    data: {
      patientUserId,
      doctorId: doctor.id,
      sourceType: "PROPOSAL",
      status: "REQUESTED",
      startAt,
      endAt,
      reason: reason || null,
      conflictFlag,
    },
    include: {
      doctor: {
        select: {
          id: true,
          fullName: true,
          specialty: true,
        },
      },
    },
  });

  return appointment;
}

// Điểm vào tạo lịch hẹn theo 2 mode: SLOT hoặc PROPOSAL.
async function createAppointment({ user, payload }) {
  if (user.role !== "patient") {
    const error = new Error("Only patient can create appointment");
    error.statusCode = 403;
    throw error;
  }

  if (!payload.doctorId) {
    const error = new Error("doctorId is required");
    error.statusCode = 400;
    throw error;
  }

  if (payload.slotId) {
    return createAppointmentBySlot({
      patientUserId: user.userId,
      doctorId: payload.doctorId,
      slotId: payload.slotId,
      reason: payload.reason,
    });
  }

  if (payload.proposedStartAt && payload.proposedEndAt) {
    return createAppointmentByProposal({
      patientUserId: user.userId,
      doctorId: payload.doctorId,
      proposedStartAt: payload.proposedStartAt,
      proposedEndAt: payload.proposedEndAt,
      reason: payload.reason,
    });
  }

  const error = new Error("Either slotId or proposedStartAt/proposedEndAt is required");
  error.statusCode = 400;
  throw error;
}

// Lấy danh sách lịch hẹn theo vai trò user với phân trang và bộ lọc thời gian.
async function listAppointments({ user, query }) {
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  });

  const where = {};

  if (user.role === "patient") {
    where.patientUserId = user.userId;
  } else if (user.role === "doctor") {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!doctorProfile) {
      return { data: [], meta: buildMeta({ page, limit, total: 0 }) };
    }

    where.doctorId = doctorProfile.id;
  }

  if (query.status) {
    // Validate status để tránh query sai enum gây lỗi hệ thống.
    if (!APPOINTMENT_STATUS_SET.has(query.status)) {
      const error = new Error("Invalid status filter");
      error.statusCode = 400;
      throw error;
    }
    where.status = query.status;
  }

  if (query.from || query.to) {
    where.startAt = {};
    if (query.from) {
      where.startAt.gte = ensureDate(query.from, "from");
    }
    if (query.to) {
      where.startAt.lte = ensureDate(query.to, "to");
    }
  }

  const [items, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            location: true,
          },
        },
        slot: {
          select: { id: true, startAt: true, endAt: true },
        },
      },
      orderBy: { startAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    data: items,
    meta: buildMeta({ page, limit, total }),
  };
}

// Lấy lịch hẹn và kiểm tra quyền truy cập theo vai trò hiện tại.
async function getAppointmentWithOwnership(appointmentId, user) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        select: {
          id: true,
          userId: true,
          fullName: true,
        },
      },
      slot: true,
    },
  });

  if (!appointment) {
    const error = new Error("Appointment not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "patient" && appointment.patientUserId !== user.userId) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  if (user.role === "doctor" && appointment.doctor.userId !== user.userId) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  return appointment;
}

// Doctor xác nhận lịch REQUESTED; re-check xung đột và khóa slot nếu cần.
async function confirmAppointment({ appointmentId, user }) {
  if (user.role !== "doctor") {
    const error = new Error("Only doctor can confirm appointment");
    error.statusCode = 403;
    throw error;
  }

  const appointment = await getAppointmentWithOwnership(appointmentId, user);

  if (appointment.status !== "REQUESTED") {
    const error = new Error("Only requested appointment can be confirmed");
    error.statusCode = 400;
    throw error;
  }

  const hasConflict = await checkDoctorConflict({
    doctorId: appointment.doctorId,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    excludeAppointmentId: appointment.id,
  });

  if (appointment.slotId) {
    const slot = await prisma.doctorSlot.findUnique({
      where: { id: appointment.slotId },
      select: { isBooked: true, isActive: true },
    });
    if (!slot || !slot.isActive || slot.isBooked) {
      const error = new Error("Slot is no longer available");
      error.statusCode = 409;
      throw error;
    }
  }

  if (hasConflict) {
    const error = new Error("Schedule conflict detected");
    error.statusCode = 409;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const confirmedAppointment = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "CONFIRMED",
        conflictFlag: false,
        confirmedAt: new Date(),
      },
    });

    if (appointment.slotId) {
      await tx.doctorSlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: true },
      });
    }

    return confirmedAppointment;
  });

  // Lên lịch reminder sau khi xác nhận thành công.
  await scheduleReminderLogsForAppointment(updated);

  return updated;
}

// Doctor từ chối lịch REQUESTED và lưu lý do từ chối.
async function rejectAppointment({ appointmentId, user, reason }) {
  if (user.role !== "doctor") {
    const error = new Error("Only doctor can reject appointment");
    error.statusCode = 403;
    throw error;
  }

  const appointment = await getAppointmentWithOwnership(appointmentId, user);
  if (appointment.status !== "REQUESTED") {
    const error = new Error("Only requested appointment can be rejected");
    error.statusCode = 400;
    throw error;
  }

  return prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "REJECTED",
      cancelReason: reason || null,
    },
  });
}

// Kiểm tra bệnh nhân còn trong cửa sổ cho phép hủy/đổi lịch hay không.
function canPatientUpdateAppointment(appointmentStartAt) {
  const now = new Date();
  const diffInMs = appointmentStartAt.getTime() - now.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  return diffInHours > env.appointmentCancelWindowHours;
}

// Hủy lịch theo rule vai trò; bệnh nhân chỉ được hủy trước mốc 6 giờ.
async function cancelAppointment({ appointmentId, user, reason }) {
  const appointment = await getAppointmentWithOwnership(appointmentId, user);
  if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)) {
    const error = new Error("Appointment cannot be cancelled in current status");
    error.statusCode = 400;
    throw error;
  }

  if (user.role === "patient" && !canPatientUpdateAppointment(appointment.startAt)) {
    const error = new Error("Patient can only cancel before 6 hours");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "CANCELLED",
        cancelReason: reason || null,
        cancelledAt: new Date(),
      },
    });

    if (appointment.slotId) {
      await tx.doctorSlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }

    return updated;
  });
}

// Tạo lịch hẹn mới trong luồng đổi lịch dựa trên slot hoặc giờ đề xuất.
async function createRescheduledAppointment({ appointment, payload }) {
  if (payload.slotId) {
    return createAppointmentBySlot({
      patientUserId: appointment.patientUserId,
      doctorId: appointment.doctorId,
      slotId: payload.slotId,
      reason: payload.reason || appointment.reason,
    });
  }

  if (payload.proposedStartAt && payload.proposedEndAt) {
    return createAppointmentByProposal({
      patientUserId: appointment.patientUserId,
      doctorId: appointment.doctorId,
      proposedStartAt: payload.proposedStartAt,
      proposedEndAt: payload.proposedEndAt,
      reason: payload.reason || appointment.reason,
    });
  }

  const error = new Error("Either slotId or proposedStartAt/proposedEndAt is required");
  error.statusCode = 400;
  throw error;
}

// Đổi lịch: tạo lịch mới REQUESTED và cập nhật lịch cũ sang RESCHEDULED.
async function rescheduleAppointment({ appointmentId, user, payload }) {
  const appointment = await getAppointmentWithOwnership(appointmentId, user);
  if (!ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status)) {
    const error = new Error("Appointment cannot be rescheduled in current status");
    error.statusCode = 400;
    throw error;
  }

  if (user.role === "patient" && !canPatientUpdateAppointment(appointment.startAt)) {
    const error = new Error("Patient can only reschedule before 6 hours");
    error.statusCode = 400;
    throw error;
  }

  const newAppointment = await createRescheduledAppointment({
    appointment,
    payload,
  });

  const oldAppointment = await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: "RESCHEDULED",
        rescheduleReason: payload.rescheduleReason || null,
      },
    });

    if (appointment.slotId) {
      await tx.doctorSlot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });
    }

    return updated;
  });

  return { oldAppointment, newAppointment };
}

module.exports = {
  createAppointment,
  listAppointments,
  confirmAppointment,
  rejectAppointment,
  cancelAppointment,
  rescheduleAppointment,
};
