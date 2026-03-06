const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");
const subscriptionsService = require("../subscriptions/subscriptions.service");

const DOCTOR_ACCESSIBLE_APPOINTMENT_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "COMPLETED",
  "RESCHEDULED",
];

const RECORDS_TRANSACTION_OPTIONS = {
  maxWait: 10000,
  timeout: 20000,
};

const TIMELINE_INCLUDE = {
  attachments: {
    orderBy: {
      createdAt: "asc",
    },
  },
  tags: {
    include: {
      tag: true,
    },
  },
};

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

// Chuẩn hóa ngày tháng đầu vào và trả null nếu không truyền.
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

// Chuẩn hóa payload attachments trước khi lưu vào bảng timeline attachments.
function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      fileName: String(item.fileName || "file").trim(),
      fileUrl: String(item.fileUrl || "").trim(),
      mimeType: String(item.mimeType || "application/octet-stream").trim(),
      fileSizeBytes: Number(item.fileSizeBytes || 0),
      kind: item.kind || "OTHER",
      provider: String(item.provider || "cloudinary").trim(),
    }))
    .filter((item) => item.fileUrl.length > 0);
}

// Chuẩn hóa danh sách mã tag hệ thống để tránh lưu dữ liệu rỗng.
function normalizePredefinedTagCodes(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item || "").trim().toUpperCase())
    .filter((item) => item.length > 0);
}

// Chuẩn hóa danh sách custom tags do người dùng nhập tự do.
function normalizeCustomTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => item.length > 0);
}

// Parse mã tag dạng TYPE:CODE để ánh xạ đúng enum tag type trong DB.
function parsePredefinedTagCode(tagCode) {
  const [type, code] = String(tagCode || "").split(":");
  if (!type || !code) {
    throw createHttpError(`Invalid predefined tag format: ${tagCode}`, 400);
  }

  const allowedTypes = new Set(["SPECIALTY", "DISEASE"]);
  const normalizedType = type.trim().toUpperCase();
  const normalizedCode = code.trim().toUpperCase();
  if (!allowedTypes.has(normalizedType)) {
    throw createHttpError(`Unsupported predefined tag type: ${type}`, 400);
  }

  return {
    type: normalizedType,
    code: normalizedCode,
    label: normalizedCode.replace(/_/g, " "),
  };
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

// Lấy danh sách appointment IDs mà doctor có quan hệ khám với owner hiện tại.
async function getDoctorAppointmentIdsByOwner(doctorUserId, ownerUserId) {
  const appointments = await prisma.appointment.findMany({
    where: {
      patientUserId: ownerUserId,
      status: {
        in: DOCTOR_ACCESSIBLE_APPOINTMENT_STATUSES,
      },
      doctor: {
        userId: doctorUserId,
      },
    },
    select: { id: true },
  });

  return appointments.map((item) => item.id);
}

// Kiểm tra doctor hiện tại có đang là bác sĩ gia đình active của patient owner hay không.
async function isDoctorAssignedFamilyDoctorForOwner(doctorUserId, ownerUserId) {
  const activeContract = await prisma.familyDoctorRequest.findFirst({
    where: {
      patientUserId: ownerUserId,
      doctorUserId,
      status: "APPROVED",
      contractStartsAt: { lte: new Date() },
      contractEndsAt: { gt: new Date() },
    },
    select: {
      id: true,
    },
  });

  return Boolean(activeContract);
}

// Kiểm tra quyền truy cập member theo role và trả thêm access context cho doctor.
async function ensureMemberAccess(memberId, user, options = {}) {
  const { requireDoctorWrite = false, requireDoctorFullAccess = false } = options;
  const member = await getFamilyMemberWithOwner(memberId);
  if (!member) {
    throw createHttpError("Family member not found", 404);
  }

  if (user.role === "admin") {
    return {
      member,
      access: {
        scope: "full",
        appointmentIds: [],
      },
    };
  }

  if (user.role === "patient" && member.familyProfile.ownerUserId === user.userId) {
    return {
      member,
      access: {
        scope: "full",
        appointmentIds: [],
      },
    };
  }

  if (user.role === "doctor") {
    const ownerUserId = member.familyProfile.ownerUserId;
    const [appointmentIds, isFamilyDoctor] = await Promise.all([
      getDoctorAppointmentIdsByOwner(user.userId, ownerUserId),
      isDoctorAssignedFamilyDoctorForOwner(user.userId, ownerUserId),
    ]);

    if (!isFamilyDoctor && appointmentIds.length === 0) {
      throw createHttpError("Forbidden", 403);
    }

    if (requireDoctorWrite === true && !isFamilyDoctor && appointmentIds.length === 0) {
      throw createHttpError("Forbidden", 403);
    }

    if (requireDoctorFullAccess === true && !isFamilyDoctor) {
      throw createHttpError("Only assigned family doctor can access full medical history", 403);
    }

    return {
      member,
      access: {
        scope: isFamilyDoctor ? "full" : "limited",
        appointmentIds,
      },
    };
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

// Lấy danh sách tag IDs từ predefined codes + custom tags để gắn vào timeline entry.
async function resolveTagIds({ tx, predefinedTagCodes = [], customTags = [], userId }) {
  const tagIds = [];

  for (const code of normalizePredefinedTagCodes(predefinedTagCodes)) {
    const parsed = parsePredefinedTagCode(code);
    const tag = await tx.recordTag.upsert({
      where: {
        type_code: {
          type: parsed.type,
          code: parsed.code,
        },
      },
      update: {
        label: parsed.label,
        isActive: true,
      },
      create: {
        type: parsed.type,
        code: parsed.code,
        label: parsed.label,
      },
      select: { id: true },
    });
    tagIds.push(tag.id);
  }

  for (const customLabel of normalizeCustomTags(customTags)) {
    const existing = await tx.recordTag.findFirst({
      where: {
        type: "CUSTOM",
        label: customLabel,
        createdByUserId: userId,
      },
      select: { id: true },
    });

    if (existing) {
      tagIds.push(existing.id);
      continue;
    }

    const created = await tx.recordTag.create({
      data: {
        type: "CUSTOM",
        label: customLabel,
        createdByUserId: userId,
      },
      select: { id: true },
    });
    tagIds.push(created.id);
  }

  return Array.from(new Set(tagIds));
}

// Đồng bộ tags cho một timeline entry theo trạng thái payload hiện tại.
async function syncTimelineEntryTags({ tx, timelineEntryId, predefinedTagCodes, customTags, userId }) {
  const tagIds = await resolveTagIds({
    tx,
    predefinedTagCodes,
    customTags,
    userId,
  });

  await tx.timelineEntryTag.deleteMany({
    where: { timelineEntryId },
  });

  if (tagIds.length === 0) {
    return;
  }

  await tx.timelineEntryTag.createMany({
    data: tagIds.map((tagId) => ({
      timelineEntryId,
      tagId,
    })),
    skipDuplicates: true,
  });
}

// Đồng bộ attachments cho một timeline entry theo payload mới.
async function syncTimelineAttachments({ tx, timelineEntryId, attachments }) {
  const normalized = normalizeAttachments(attachments);

  await tx.timelineAttachment.deleteMany({
    where: { timelineEntryId },
  });

  if (normalized.length === 0) {
    return;
  }

  await tx.timelineAttachment.createMany({
    data: normalized.map((item) => ({
      timelineEntryId,
      fileName: item.fileName,
      fileUrl: item.fileUrl,
      mimeType: item.mimeType,
      fileSizeBytes: Number(item.fileSizeBytes || 0),
      kind: item.kind,
      provider: item.provider,
    })),
  });
}

// Tạo timeline entry kèm attachments/tags trong một transaction duy nhất.
async function createTimelineEntryWithRelations({
  tx = prisma,
  data,
  attachments = [],
  predefinedTagCodes = [],
  customTags = [],
  userId,
}) {
  const created = await tx.timelineEntry.create({
    data,
  });

  await syncTimelineAttachments({
    tx,
    timelineEntryId: created.id,
    attachments,
  });

  await syncTimelineEntryTags({
    tx,
    timelineEntryId: created.id,
    predefinedTagCodes,
    customTags,
    userId,
  });

  return tx.timelineEntry.findUnique({
    where: { id: created.id },
    include: TIMELINE_INCLUDE,
  });
}

// Xây dựng where filter timeline cho doctor one-time theo các record được phép xem.
function buildLimitedDoctorTimelineWhere({ memberId, appointmentIds }) {
  return {
    memberId,
    OR: [
      {
        appointmentId: {
          in: appointmentIds,
        },
      },
      {
        sharedLinks: {
          some: {
            appointmentId: {
              in: appointmentIds,
            },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    ],
  };
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

  const { fullName, relation, gender, dateOfBirth, avatarUrl, isPrimary = false } = payload;
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
  }, RECORDS_TRANSACTION_OPTIONS);
}

// Cập nhật thông tin member thuộc family của patient hiện tại.
async function updateFamilyMember(user, memberId, payload = {}) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can update family member", 403);
  }

  const { member } = await ensureMemberAccess(memberId, user);
  const updateData = {};
  if (payload.fullName) updateData.fullName = payload.fullName.trim();
  if (payload.relation) updateData.relation = payload.relation;
  if (payload.gender) updateData.gender = payload.gender;
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
  }, RECORDS_TRANSACTION_OPTIONS);
}

// Xóa member thuộc family của patient và đảm bảo luôn còn một primary hợp lệ nếu có.
async function deleteFamilyMember(user, memberId) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can delete family member", 403);
  }

  const { member } = await ensureMemberAccess(memberId, user);

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
  }, RECORDS_TRANSACTION_OPTIONS);
}

// Lấy hồ sơ sức khỏe của một member theo quyền patient/family doctor/admin.
async function getHealthProfile(user, memberId) {
  const { member, access } = await ensureMemberAccess(memberId, user, {
    requireDoctorFullAccess: user.role === "doctor",
  });

  if (user.role === "doctor" && access.scope !== "full") {
    throw createHttpError("Only family doctor can view full health profile", 403);
  }

  if (!member.healthProfile) {
    return { data: null };
  }
  return { data: member.healthProfile };
}

// Tạo hoặc cập nhật hồ sơ sức khỏe member.
async function upsertHealthProfile(user, memberId, payload = {}) {
  const { member, access } = await ensureMemberAccess(memberId, user, {
    requireDoctorWrite: user.role === "doctor",
    requireDoctorFullAccess: user.role === "doctor",
  });

  if (user.role === "doctor" && access.scope !== "full") {
    throw createHttpError("Only family doctor can update full health profile", 403);
  }

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

// Lấy timeline theo member có phân trang, filter và ACL theo loại doctor access.
async function getTimelineEntries(user, memberId, query = {}) {
  const { access } = await ensureMemberAccess(memberId, user);
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  });

  const where =
    user.role === "doctor" && access.scope === "limited"
      ? buildLimitedDoctorTimelineWhere({ memberId, appointmentIds: access.appointmentIds })
      : { memberId };

  if (query.entryType) where.entryType = query.entryType;
  if (query.serviceType) where.serviceType = query.serviceType;
  if (query.sourceType) where.sourceType = query.sourceType;
  if (query.specialtyCode) where.specialtyCode = query.specialtyCode;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = ensureDateOrNull(query.from, "from");
    if (query.to) where.createdAt.lte = ensureDateOrNull(query.to, "to");
  }

  if (query.tag) {
    where.tags = {
      some: {
        tag: {
          label: {
            contains: String(query.tag).trim(),
          },
        },
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.timelineEntry.findMany({
      where,
      include: TIMELINE_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.timelineEntry.count({ where }),
  ]);

  return {
    data: items,
    meta: buildMeta({ page, limit, total }),
  };
}

// Tạo timeline note thủ công cho patient/doctor/admin theo ACL tương ứng.
async function createTimelineNote(user, memberId, payload = {}) {
  if (!["patient", "doctor", "admin"].includes(user.role)) {
    throw createHttpError("Forbidden", 403);
  }

  const { access } = await ensureMemberAccess(memberId, user, {
    requireDoctorWrite: user.role === "doctor",
  });

  const title = payload.title?.trim();
  const summary = payload.summary?.trim();
  if (!title || !summary) {
    throw createHttpError("title and summary are required", 400);
  }

  const appointmentId = payload.appointmentId || null;
  if (user.role === "doctor" && access.scope === "limited") {
    if (!appointmentId) {
      throw createHttpError("appointmentId is required for one-time doctor note", 400);
    }
    if (!access.appointmentIds.includes(appointmentId)) {
      throw createHttpError("Forbidden appointment scope", 403);
    }
  }

  const sourceType =
    payload.sourceType || (user.role === "patient" ? "PATIENT_MANUAL" : "DOCTOR_NOTE");
  const serviceType =
    payload.serviceType ||
    (user.role === "doctor" ? (access.scope === "full" ? "FAMILY_DOCTOR" : "ONE_TIME") : null);

  const created = await prisma.$transaction(async (tx) => {
    return createTimelineEntryWithRelations({
      tx,
      userId: user.userId,
      data: {
        memberId,
        appointmentId,
        consultSessionId: payload.consultSessionId || null,
        doctorUserId: user.role === "doctor" ? user.userId : null,
        sourceType,
        serviceType,
        diagnosis: payload.diagnosis?.trim() || null,
        specialtyCode: payload.specialtyCode?.trim() || null,
        visibility: payload.visibility || "PRIVATE_TO_PATIENT_AND_FAMILY_DOCTOR",
        entryType: payload.entryType || "NOTE",
        title,
        summary,
        payload: normalizeJsonValue(payload.payload, {}),
      },
      attachments: payload.attachments,
      predefinedTagCodes: payload.predefinedTagCodes,
      customTags: payload.customTags,
    });
  }, RECORDS_TRANSACTION_OPTIONS);

  return { data: created };
}

// Cập nhật timeline entry theo quyền của patient/family doctor/admin.
async function updateTimelineEntry(user, entryId, payload = {}) {
  const existing = await prisma.timelineEntry.findUnique({
    where: { id: entryId },
    include: {
      member: {
        include: {
          familyProfile: {
            select: {
              ownerUserId: true,
            },
          },
        },
      },
      ...TIMELINE_INCLUDE,
    },
  });

  if (!existing) {
    throw createHttpError("Timeline entry not found", 404);
  }

  if (user.role === "patient") {
    if (existing.member.familyProfile.ownerUserId !== user.userId) {
      throw createHttpError("Forbidden", 403);
    }
  } else if (user.role === "doctor") {
    const { access } = await ensureMemberAccess(existing.memberId, user, {
      requireDoctorWrite: true,
    });
    if (access.scope !== "full") {
      throw createHttpError("Only family doctor can update timeline entries", 403);
    }
  } else if (user.role !== "admin") {
    throw createHttpError("Forbidden", 403);
  }

  const updateData = {};
  if (payload.entryType) updateData.entryType = payload.entryType;
  if (payload.title !== undefined) updateData.title = payload.title?.trim() || existing.title;
  if (payload.summary !== undefined) updateData.summary = payload.summary?.trim() || existing.summary;
  if (payload.diagnosis !== undefined) updateData.diagnosis = payload.diagnosis?.trim() || null;
  if (payload.specialtyCode !== undefined) updateData.specialtyCode = payload.specialtyCode?.trim() || null;
  if (payload.sourceType !== undefined) updateData.sourceType = payload.sourceType;
  if (payload.serviceType !== undefined) updateData.serviceType = payload.serviceType || null;
  if (payload.visibility !== undefined) updateData.visibility = payload.visibility;
  if (payload.payload !== undefined) updateData.payload = normalizeJsonValue(payload.payload, {});

  const updated = await prisma.$transaction(async (tx) => {
    await tx.timelineEntry.update({
      where: { id: existing.id },
      data: updateData,
    });

    if (payload.attachments !== undefined) {
      await syncTimelineAttachments({
        tx,
        timelineEntryId: existing.id,
        attachments: payload.attachments,
      });
    }

    if (payload.predefinedTagCodes !== undefined || payload.customTags !== undefined) {
      await syncTimelineEntryTags({
        tx,
        timelineEntryId: existing.id,
        predefinedTagCodes: payload.predefinedTagCodes,
        customTags: payload.customTags,
        userId: user.userId,
      });
    }

    return tx.timelineEntry.findUnique({
      where: { id: existing.id },
      include: TIMELINE_INCLUDE,
    });
  }, RECORDS_TRANSACTION_OPTIONS);

  return { data: updated };
}

// Lấy danh sách tài liệu theo hướng document-centric cho patient/doctor/admin.
async function getMemberDocuments(user, memberId, query = {}) {
  const { access } = await ensureMemberAccess(memberId, user);
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  });

  const where = {
    timelineEntry: {
      memberId,
    },
  };

  if (query.kind) where.kind = query.kind;

  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = ensureDateOrNull(query.from, "from");
    if (query.to) where.createdAt.lte = ensureDateOrNull(query.to, "to");
  }

  if (query.tag) {
    where.timelineEntry.tags = {
      some: {
        tag: {
          label: {
            contains: String(query.tag).trim(),
          },
        },
      },
    };
  }

  if (user.role === "doctor" && access.scope === "limited") {
    where.timelineEntry.OR = [
      {
        appointmentId: {
          in: access.appointmentIds,
        },
      },
      {
        sharedLinks: {
          some: {
            appointmentId: {
              in: access.appointmentIds,
            },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.timelineAttachment.findMany({
      where,
      include: {
        timelineEntry: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.timelineAttachment.count({ where }),
  ]);

  return {
    data: items,
    meta: buildMeta({ page, limit, total }),
  };
}

// Tạo danh sách record links để chia sẻ hồ sơ tạm cho cuộc hẹn one-time.
async function shareRecordsForAppointment(user, appointmentId, payload = {}) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can share records for appointment", 403);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      patientUserId: true,
      serviceType: true,
      startAt: true,
    },
  });
  if (!appointment) {
    throw createHttpError("Appointment not found", 404);
  }
  if (appointment.patientUserId !== user.userId) {
    throw createHttpError("Forbidden", 403);
  }

  const timelineEntryIds = Array.isArray(payload.timelineEntryIds)
    ? payload.timelineEntryIds.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];

  if (timelineEntryIds.length === 0) {
    throw createHttpError("timelineEntryIds is required", 400);
  }

  const entries = await prisma.timelineEntry.findMany({
    where: {
      id: {
        in: timelineEntryIds,
      },
      member: {
        familyProfile: {
          ownerUserId: user.userId,
        },
      },
    },
    select: { id: true },
  });

  if (entries.length !== timelineEntryIds.length) {
    throw createHttpError("Some timeline entries are invalid or not owned by patient", 400);
  }

  const expiresAt = ensureDateOrNull(payload.expiresAt, "expiresAt");
  const scope = payload.scope || "TEMPORARY";

  await prisma.appointmentRecordLink.createMany({
    data: timelineEntryIds.map((timelineEntryId) => ({
      appointmentId,
      timelineEntryId,
      scope,
      expiresAt,
      createdByUserId: user.userId,
    })),
    skipDuplicates: true,
  });

  const rows = await prisma.appointmentRecordLink.findMany({
    where: {
      appointmentId,
    },
    include: {
      timelineEntry: {
        include: TIMELINE_INCLUDE,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: rows };
}

// Lấy danh sách hồ sơ đang được chia sẻ cho một appointment cụ thể.
async function getSharedRecordsForAppointment(user, appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: {
        select: {
          userId: true,
        },
      },
    },
  });
  if (!appointment) {
    throw createHttpError("Appointment not found", 404);
  }

  if (
    user.role !== "admin" &&
    appointment.patientUserId !== user.userId &&
    appointment.doctor.userId !== user.userId
  ) {
    throw createHttpError("Forbidden", 403);
  }

  const rows = await prisma.appointmentRecordLink.findMany({
    where: {
      appointmentId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      timelineEntry: {
        include: TIMELINE_INCLUDE,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { data: rows };
}

// Thu hồi một bản ghi chia sẻ hồ sơ tạm của patient cho appointment.
async function revokeSharedRecordForAppointment(user, appointmentId, linkId) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can revoke shared records", 403);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      patientUserId: true,
      startAt: true,
    },
  });

  if (!appointment) {
    throw createHttpError("Appointment not found", 404);
  }
  if (appointment.patientUserId !== user.userId) {
    throw createHttpError("Forbidden", 403);
  }

  const link = await prisma.appointmentRecordLink.findUnique({
    where: { id: linkId },
  });
  if (!link || link.appointmentId !== appointmentId) {
    throw createHttpError("Shared record link not found", 404);
  }

  await prisma.appointmentRecordLink.delete({
    where: { id: linkId },
  });

  return { data: { revokedId: linkId } };
}

// Lấy care plan active gần nhất của member.
async function getCarePlan(user, memberId) {
  const { access } = await ensureMemberAccess(memberId, user, {
    requireDoctorFullAccess: user.role === "doctor",
  });

  if (user.role === "doctor" && access.scope !== "full") {
    throw createHttpError("Only family doctor can view full care plan", 403);
  }

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

  const { access } = await ensureMemberAccess(memberId, user, {
    requireDoctorWrite: true,
    requireDoctorFullAccess: true,
  });

  if (access.scope !== "full") {
    throw createHttpError("Only family doctor can update care plan", 403);
  }

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
    data.imageUrls = Array.isArray(payload.imageUrls)
      ? payload.imageUrls.filter((item) => typeof item === "string" && item.trim().length > 0)
      : [];
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

  await createTimelineEntryWithRelations({
    tx: prisma,
    userId: user.userId,
    data: {
      memberId,
      doctorUserId: user.userId,
      sourceType: "DOCTOR_NOTE",
      serviceType: "FAMILY_DOCTOR",
      entryType: "FOLLOW_UP",
      title: "Cập nhật kế hoạch chăm sóc",
      summary: "Bác sĩ đã cập nhật care plan cho thành viên.",
      payload: {
        carePlanId: saved.id,
        nextFollowUpAt: saved.nextFollowUpAt,
        status: saved.status,
      },
    },
  });

  return { data: saved };
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

  return createTimelineEntryWithRelations({
    tx: prisma,
    userId: appointment.patientUserId,
    data: {
      memberId: primaryMember.id,
      appointmentId: appointment.id,
      doctorUserId: appointment.doctor.userId,
      sourceType: "SYSTEM_EVENT",
      serviceType: appointment.serviceType,
      entryType: "VISIT",
      title: "Lịch hẹn đã được xác nhận",
      summary: `Bác sĩ ${appointment.doctor.fullName} đã xác nhận lịch hẹn.`,
      payload: {
        appointmentId: appointment.id,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        reason: appointment.reason,
      },
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

  return createTimelineEntryWithRelations({
    tx: prisma,
    userId: session.appointment.patientUserId,
    data: {
      memberId: primaryMember.id,
      appointmentId: session.appointment.id,
      consultSessionId: session.id,
      doctorUserId: session.appointment.doctor.userId,
      sourceType: "SYSTEM_EVENT",
      serviceType: session.appointment.serviceType,
      entryType: "FOLLOW_UP",
      title: "Phiên tư vấn đã hoàn thành",
      summary: `Bác sĩ ${session.appointment.doctor.fullName} đã kết thúc phiên tư vấn.`,
      payload: {
        appointmentId: session.appointment.id,
        consultSessionId: session.id,
        endedAt: session.endedAt,
      },
    },
  });
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
  updateTimelineEntry,
  getMemberDocuments,
  shareRecordsForAppointment,
  getSharedRecordsForAppointment,
  revokeSharedRecordForAppointment,
  getCarePlan,
  upsertCarePlan,
  createTimelineEntryForAppointmentConfirmed,
  createTimelineEntryForConsultCompleted,
};
