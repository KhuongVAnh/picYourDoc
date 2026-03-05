const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");
const subscriptionsService = require("../subscriptions/subscriptions.service");

const DOCTOR_ACCESSIBLE_APPOINTMENT_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "RESCHEDULED",
];

// Tạo lỗi HTTP chuẩn để các endpoint records trả lỗi nhất quán.
function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Chuẩn hóa object Json cho các trường hồ sơ sức khỏe.
function normalizeJsonValue(value, fallback = []) {
  if (value === null || value === undefined) {
    return fallback;
  }
  return value;
}

// Chuẩn hóa danh sách URL ảnh cho timeline/care plan để lưu Json đồng nhất.
function normalizeImageUrls(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item) => typeof item === "string" && item.trim().length > 0);
}

// Parse ngày tháng đầu vào cho các trường dateOfBirth/nextFollowUpAt.
function ensureDateOrNull(value, fieldName) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw createHttpError(`${fieldName} is invalid`, 400);
  }
  return parsed;
}

// Lấy family profile theo owner user ID.
async function getFamilyProfileByOwnerUserId(ownerUserId) {
  return prisma.familyProfile.findUnique({
    where: { ownerUserId },
    include: {
      members: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}

// Đảm bảo patient có family profile trước khi thao tác member/hồ sơ.
async function ensureFamilyProfile(ownerUserId, defaultName) {
  const existing = await getFamilyProfileByOwnerUserId(ownerUserId);
  if (existing) {
    return existing;
  }

  return prisma.familyProfile.create({
    data: {
      ownerUserId,
      name: defaultName || "Gia đình của tôi",
    },
    include: {
      members: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });
}

// Lấy member theo ID kèm owner để kiểm tra quyền truy cập.
async function getFamilyMemberWithOwner(memberId) {
  return prisma.familyMember.findUnique({
    where: { id: memberId },
    include: {
      familyProfile: {
        select: {
          id: true,
          ownerUserId: true,
          name: true,
        },
      },
      healthProfile: true,
    },
  });
}

// Kiểm tra doctor có quan hệ điều trị với owner user của member hay không.
async function hasDoctorAccessToOwner(doctorUserId, ownerUserId) {
  const count = await prisma.appointment.count({
    where: {
      patientUserId: ownerUserId,
      status: { in: DOCTOR_ACCESSIBLE_APPOINTMENT_STATUSES },
      doctor: {
        userId: doctorUserId,
      },
    },
  });
  return count > 0;
}

// Kiểm tra quyền truy cập member theo role patient/doctor/admin.
async function ensureMemberAccess(memberId, user, options = {}) {
  const { requireDoctorWrite = false } = options;
  const member = await getFamilyMemberWithOwner(memberId);
  if (!member) {
    throw createHttpError("Family member not found", 404);
  }

  if (user.role === "admin") {
    return member;
  }

  if (user.role === "patient" && member.familyProfile.ownerUserId === user.userId) {
    return member;
  }

  if (user.role === "doctor") {
    const doctorHasAccess = await hasDoctorAccessToOwner(
      user.userId,
      member.familyProfile.ownerUserId
    );
    if (!doctorHasAccess) {
      throw createHttpError("Forbidden", 403);
    }
    if (requireDoctorWrite === true) {
      return member;
    }
    return member;
  }

  throw createHttpError("Forbidden", 403);
}

// Lấy primary member của owner để gắn timeline tự động cho appointment/consult.
async function getPrimaryMemberByOwnerUserId(ownerUserId) {
  return prisma.familyMember.findFirst({
    where: {
      familyProfile: {
        ownerUserId,
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  });
}

// Tạo timeline entry dùng chung cho các sự kiện từ hệ thống.
async function createTimelineEntry(payload) {
  return prisma.timelineEntry.create({
    data: payload,
  });
}

// Tạo timeline tự động khi lịch hẹn đã được bác sĩ xác nhận.
async function createTimelineEntryForAppointmentConfirmed(appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        select: {
          userId: true,
          fullName: true,
        },
      },
    },
  });
  if (!appointment) {
    return null;
  }

  const primaryMember = await getPrimaryMemberByOwnerUserId(appointment.patientUserId);
  if (!primaryMember) {
    return null;
  }

  return createTimelineEntry({
    memberId: primaryMember.id,
    appointmentId: appointment.id,
    doctorUserId: appointment.doctor.userId,
    entryType: "VISIT",
    title: "Lịch hẹn đã được xác nhận",
    summary: `Bác sĩ ${appointment.doctor.fullName} đã xác nhận lịch hẹn.`,
    payload: {
      appointmentId: appointment.id,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      reason: appointment.reason,
    },
  });
}

// Tạo timeline tự động khi phiên tư vấn kết thúc thành công.
async function createTimelineEntryForConsultCompleted(sessionId) {
  const session = await prisma.consultSession.findUnique({
    where: { id: sessionId },
    include: {
      appointment: {
        include: {
          doctor: {
            select: {
              userId: true,
              fullName: true,
            },
          },
        },
      },
    },
  });
  if (!session) {
    return null;
  }

  const primaryMember = await getPrimaryMemberByOwnerUserId(
    session.appointment.patientUserId
  );
  if (!primaryMember) {
    return null;
  }

  return createTimelineEntry({
    memberId: primaryMember.id,
    appointmentId: session.appointment.id,
    consultSessionId: session.id,
    doctorUserId: session.appointment.doctor.userId,
    entryType: "FOLLOW_UP",
    title: "Phiên tư vấn đã hoàn thành",
    summary: `Bác sĩ ${session.appointment.doctor.fullName} đã kết thúc phiên tư vấn.`,
    payload: {
      appointmentId: session.appointment.id,
      consultSessionId: session.id,
      endedAt: session.endedAt,
    },
  });
}

// Lấy hồ sơ family hiện tại của patient.
async function getFamily(user) {
  if (user.role !== "patient" && user.role !== "admin") {
    throw createHttpError("Only patient or admin can view family profile", 403);
  }

  const profile = await getFamilyProfileByOwnerUserId(user.userId);
  if (!profile) {
    return { data: null };
  }

  return { data: profile };
}

// Tạo hoặc cập nhật tên family profile cho patient.
async function createFamily(user, payload = {}) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can create family profile", 403);
  }

  const familyName = payload.name?.trim() || "Gia đình của tôi";
  const existing = await getFamilyProfileByOwnerUserId(user.userId);
  if (existing) {
    const updated = await prisma.familyProfile.update({
      where: { id: existing.id },
      data: { name: familyName },
      include: {
        members: {
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
    });
    return { data: updated };
  }

  const created = await ensureFamilyProfile(user.userId, familyName);
  return { data: created };
}

// Thêm member mới vào family profile và kiểm tra giới hạn theo gói.
async function createFamilyMember(user, payload = {}) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can add family member", 403);
  }

  const {
    fullName,
    relation,
    gender,
    dateOfBirth,
    avatarUrl,
    isPrimary = false,
  } = payload;
  if (!fullName || !relation || !gender) {
    throw createHttpError("fullName, relation, gender are required", 400);
  }

  const profile = await ensureFamilyProfile(user.userId, "Gia đình của tôi");
  const currentMemberCount = profile.members.length;
  await subscriptionsService.ensureFamilyMemberLimitOrThrow({
    userId: user.userId,
    nextMemberCount: currentMemberCount + 1,
  });

  const shouldPrimary = currentMemberCount === 0 ? true : Boolean(isPrimary);

  return prisma.$transaction(async (tx) => {
    if (shouldPrimary) {
      await tx.familyMember.updateMany({
        where: { familyProfileId: profile.id },
        data: { isPrimary: false },
      });
    }

    const created = await tx.familyMember.create({
      data: {
        familyProfileId: profile.id,
        fullName: fullName.trim(),
        avatarUrl: avatarUrl?.trim() || null,
        relation,
        gender,
        dateOfBirth: ensureDateOrNull(dateOfBirth, "dateOfBirth"),
        isPrimary: shouldPrimary,
      },
    });

    return { data: created };
  });
}

// Cập nhật thông tin member thuộc family của patient hiện tại.
async function updateFamilyMember(user, memberId, payload = {}) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can update family member", 403);
  }

  const member = await ensureMemberAccess(memberId, user);
  const updateData = {};
  if (payload.fullName) {
    updateData.fullName = payload.fullName.trim();
  }
  if (payload.relation) {
    updateData.relation = payload.relation;
  }
  if (payload.gender) {
    updateData.gender = payload.gender;
  }
  if (payload.dateOfBirth !== undefined) {
    updateData.dateOfBirth = ensureDateOrNull(payload.dateOfBirth, "dateOfBirth");
  }
  if (payload.avatarUrl !== undefined) {
    updateData.avatarUrl = payload.avatarUrl?.trim() || null;
  }

  return prisma.$transaction(async (tx) => {
    if (payload.isPrimary === true) {
      await tx.familyMember.updateMany({
        where: { familyProfileId: member.familyProfile.id },
        data: { isPrimary: false },
      });
      updateData.isPrimary = true;
    }

    const updated = await tx.familyMember.update({
      where: { id: member.id },
      data: updateData,
    });
    return { data: updated };
  });
}

// Xóa member thuộc family của patient và đảm bảo luôn còn một primary hợp lệ nếu có.
async function deleteFamilyMember(user, memberId) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can delete family member", 403);
  }

  const member = await ensureMemberAccess(memberId, user);

  return prisma.$transaction(async (tx) => {
    await tx.familyMember.delete({ where: { id: member.id } });

    const remainingMembers = await tx.familyMember.findMany({
      where: { familyProfileId: member.familyProfile.id },
      orderBy: { createdAt: "asc" },
    });

    const hasPrimary = remainingMembers.some((item) => item.isPrimary);
    if (!hasPrimary && remainingMembers.length > 0) {
      await tx.familyMember.update({
        where: { id: remainingMembers[0].id },
        data: { isPrimary: true },
      });
    }

    return { data: { deletedId: member.id } };
  });
}

// Lấy hồ sơ sức khỏe của một member theo quyền patient/doctor/admin.
async function getHealthProfile(user, memberId) {
  const member = await ensureMemberAccess(memberId, user);
  if (!member.healthProfile) {
    return { data: null };
  }
  return { data: member.healthProfile };
}

// Tạo hoặc cập nhật hồ sơ sức khỏe member.
async function upsertHealthProfile(user, memberId, payload = {}) {
  const member = await ensureMemberAccess(memberId, user, { requireDoctorWrite: true });

  const data = {
    allergies: normalizeJsonValue(payload.allergies, []),
    chronicConditions: normalizeJsonValue(payload.chronicConditions, []),
    medications: normalizeJsonValue(payload.medications, []),
    lifestyle: normalizeJsonValue(payload.lifestyle, {}),
    bloodType: payload.bloodType || null,
    emergencyContact: normalizeJsonValue(payload.emergencyContact, {}),
    updatedByUserId: user.userId,
  };

  const saved = await prisma.healthProfile.upsert({
    where: { memberId: member.id },
    update: data,
    create: {
      memberId: member.id,
      ...data,
    },
  });

  return { data: saved };
}

// Lấy timeline theo member có phân trang và bảo vệ quyền truy cập.
async function getTimelineEntries(user, memberId, query = {}) {
  await ensureMemberAccess(memberId, user);
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  });

  const [items, total] = await Promise.all([
    prisma.timelineEntry.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.timelineEntry.count({ where: { memberId } }),
  ]);

  return {
    data: items,
    meta: buildMeta({ page, limit, total }),
  };
}

// Doctor/Admin tạo timeline note thủ công cho member trong phạm vi điều trị.
async function createTimelineNote(user, memberId, payload = {}) {
  if (user.role !== "doctor" && user.role !== "admin") {
    throw createHttpError("Only doctor or admin can create timeline note", 403);
  }

  await ensureMemberAccess(memberId, user, { requireDoctorWrite: true });
  const title = payload.title?.trim();
  const summary = payload.summary?.trim();
  if (!title || !summary) {
    throw createHttpError("title and summary are required", 400);
  }

  const created = await createTimelineEntry({
    memberId,
    doctorUserId: user.role === "doctor" ? user.userId : null,
    entryType: payload.entryType || "NOTE",
    title,
    summary,
    payload: normalizeJsonValue(payload.payload, {}),
    imageUrls: normalizeImageUrls(payload.imageUrls),
  });

  return { data: created };
}

// Lấy care plan active gần nhất của member.
async function getCarePlan(user, memberId) {
  await ensureMemberAccess(memberId, user);
  const carePlan = await prisma.carePlan.findFirst({
    where: { memberId },
    orderBy: { updatedAt: "desc" },
  });
  return { data: carePlan };
}

// Doctor cập nhật care plan và đồng thời tạo timeline event follow-up.
async function upsertCarePlan(user, memberId, payload = {}) {
  if (user.role !== "doctor") {
    throw createHttpError("Only doctor can update care plan", 403);
  }

  await ensureMemberAccess(memberId, user, { requireDoctorWrite: true });

  const existing = await prisma.carePlan.findFirst({
    where: {
      memberId,
      doctorId: user.userId,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    frequencyDays: Number(payload.frequencyDays || 30),
    nextFollowUpAt: ensureDateOrNull(payload.nextFollowUpAt, "nextFollowUpAt"),
    medicationPlan: normalizeJsonValue(payload.medicationPlan, {}),
    lifestyleGoals: normalizeJsonValue(payload.lifestyleGoals, {}),
    status: payload.status || "ACTIVE",
  };
  if (payload.imageUrls !== undefined) {
    data.imageUrls = normalizeImageUrls(payload.imageUrls);
  }

  const saved = existing
    ? await prisma.carePlan.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.carePlan.create({
        data: {
          memberId,
          doctorId: user.userId,
          ...data,
        },
      });

  await createTimelineEntry({
    memberId,
    doctorUserId: user.userId,
    entryType: "FOLLOW_UP",
    title: "Cập nhật kế hoạch chăm sóc",
    summary: "Bác sĩ đã cập nhật care plan cho thành viên.",
    payload: {
      carePlanId: saved.id,
      nextFollowUpAt: saved.nextFollowUpAt,
      status: saved.status,
    },
  });

  return { data: saved };
}

module.exports = {
  getFamily,
  createFamily,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  getHealthProfile,
  upsertHealthProfile,
  getTimelineEntries,
  createTimelineNote,
  getCarePlan,
  upsertCarePlan,
  createTimelineEntryForAppointmentConfirmed,
  createTimelineEntryForConsultCompleted,
};
