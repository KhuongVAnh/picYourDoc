const { Prisma } = require("@prisma/client");
const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");
const { toMonthKey } = require("../subscriptions/subscriptions.service");

// Chuẩn hóa tham số sắp xếp danh sách bác sĩ public.
function parseSort(sortBy, sortOrder) {
  const normalizedSortBy = sortBy === "fee" ? "fee" : "rating";
  const normalizedSortOrder = sortOrder === "asc" ? "asc" : "desc";
  return { normalizedSortBy, normalizedSortOrder };
}

// Chuẩn hóa danh sách bảo hiểm từ dữ liệu JSON.
function normalizeInsuranceList(jsonValue) {
  if (!jsonValue || !Array.isArray(jsonValue)) {
    return [];
  }
  return jsonValue;
}

// Parse thời gian range filter cho dashboard bác sĩ.
function parseDateRange(query = {}) {
  const now = new Date();
  const from = query.from ? new Date(query.from) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    const error = new Error("Invalid from/to range");
    error.statusCode = 400;
    throw error;
  }
  return { from, to };
}

// Parse khung thời gian cho dashboard v2 theo week/month.
function parseDashboardV2Range(query = {}) {
  const now = new Date();
  const range = query.range === "month" ? "month" : "week";
  const from = query.from ? new Date(query.from) : now;
  const to = query.to
    ? new Date(query.to)
    : new Date(now.getTime() + (range === "month" ? 30 : 7) * 24 * 60 * 60 * 1000);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    const error = new Error("Invalid dashboard range");
    error.statusCode = 400;
    throw error;
  }

  return { range, from, to };
}

// Lấy hồ sơ doctor profile theo userId và ném lỗi khi không tồn tại.
async function getDoctorProfileByUserIdOrFail(userId) {
  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      avatarUrl: true,
      fullName: true,
      specialty: true,
      location: true,
    },
  });

  if (!doctorProfile) {
    const error = new Error("Doctor profile not found");
    error.statusCode = 404;
    throw error;
  }
  return doctorProfile;
}

// Lấy ngữ cảnh quyền truy cập bệnh nhân của bác sĩ: full (family doctor) hoặc limited (one-time).
async function resolveDoctorMemberAccess(doctorUserId, memberId) {
  const member = await prisma.familyMember.findUnique({
    where: { id: memberId },
    include: {
      familyProfile: {
        select: { ownerUserId: true },
      },
    },
  });

  if (!member) {
    const error = new Error("Family member not found");
    error.statusCode = 404;
    throw error;
  }

  const ownerUserId = member.familyProfile.ownerUserId;

  // Lấy toàn bộ appointment liên quan để xác định one-time doctor có quyền đọc giới hạn.
  const appointments = await prisma.appointment.findMany({
    where: {
      patientUserId: ownerUserId,
      doctor: { userId: doctorUserId },
      status: {
        in: ["REQUESTED", "CONFIRMED", "COMPLETED", "RESCHEDULED"],
      },
    },
    select: {
      id: true,
    },
  });

  // Kiểm tra bác sĩ có đang được gán family doctor active cho chủ hồ sơ hay không.
  const activeFamilyContract = await prisma.familyDoctorRequest.findFirst({
    where: {
      patientUserId: ownerUserId,
      doctorUserId,
      status: "APPROVED",
      contractStartsAt: { lte: new Date() },
      contractEndsAt: { gt: new Date() },
    },
    select: { id: true },
  });

  const appointmentIds = appointments.map((item) => item.id);
  const scope = activeFamilyContract ? "full" : "limited";
  if (!activeFamilyContract && appointmentIds.length === 0) {
    const error = new Error("Forbidden");
    error.statusCode = 403;
    throw error;
  }

  return {
    member,
    scope,
    appointmentIds,
  };
}

// Lấy danh sách bác sĩ public có filter/sort/pagination.
async function listDoctors(query) {
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  });

  const { normalizedSortBy, normalizedSortOrder } = parseSort(
    query.sortBy,
    query.sortOrder
  );

  const where = {
    isActive: true,
  };

  if (query.q) {
    where.OR = [
      { fullName: { contains: query.q.trim() } },
      { specialty: { contains: query.q.trim() } },
    ];
  }

  if (query.specialty) {
    where.specialty = { contains: query.specialty.trim() };
  }

  if (query.location) {
    where.location = { contains: query.location.trim() };
  }

  if (query.feeMin || query.feeMax) {
    where.consultationFee = {};
    if (query.feeMin) {
      where.consultationFee.gte = new Prisma.Decimal(query.feeMin);
    }
    if (query.feeMax) {
      where.consultationFee.lte = new Prisma.Decimal(query.feeMax);
    }
  }

  const profiles = await prisma.doctorProfile.findMany({
    where,
    select: {
      id: true,
      avatarUrl: true,
      fullName: true,
      specialty: true,
      location: true,
      consultationFee: true,
      ratingAvg: true,
      reviewCount: true,
      yearsExperience: true,
      insurancesAccepted: true,
    },
  });

  // Áp dụng filter bảo hiểm ở lớp ứng dụng để tương thích MySQL JSON.
  const insuranceQuery = query.insurance?.trim().toLowerCase();
  const filteredProfiles = insuranceQuery
    ? profiles.filter((profile) =>
        normalizeInsuranceList(profile.insurancesAccepted).some((insurance) =>
          String(insurance).toLowerCase().includes(insuranceQuery)
        )
      )
    : profiles;

  filteredProfiles.sort((a, b) => {
    let compare = 0;
    if (normalizedSortBy === "fee") {
      compare =
        Number(a.consultationFee) > Number(b.consultationFee)
          ? 1
          : Number(a.consultationFee) < Number(b.consultationFee)
          ? -1
          : 0;
    } else {
      compare =
        a.ratingAvg > b.ratingAvg ? 1 : a.ratingAvg < b.ratingAvg ? -1 : 0;
    }
    return normalizedSortOrder === "asc" ? compare : compare * -1;
  });

  const total = filteredProfiles.length;
  const data = filteredProfiles.slice(skip, skip + limit).map((profile) => ({
    doctorId: profile.id,
    avatarUrl: profile.avatarUrl,
    fullName: profile.fullName,
    specialty: profile.specialty,
    location: profile.location,
    consultationFee: Number(profile.consultationFee),
    ratingAvg: profile.ratingAvg,
    reviewCount: profile.reviewCount,
    yearsExperience: profile.yearsExperience,
    insurancesAccepted: normalizeInsuranceList(profile.insurancesAccepted),
  }));

  return {
    data,
    meta: buildMeta({ page, limit, total }),
  };
}

// Lấy hồ sơ chi tiết bác sĩ kèm slot khả dụng 7 ngày (private detail).
async function getDoctorDetailById(doctorId) {
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(now.getDate() + 7);

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      userId: true,
      avatarUrl: true,
      fullName: true,
      specialty: true,
      location: true,
      consultationFee: true,
      yearsExperience: true,
      bio: true,
      ratingAvg: true,
      reviewCount: true,
      insurancesAccepted: true,
      slots: {
        where: {
          isActive: true,
          isBooked: false,
          startAt: {
            gte: now,
            lte: sevenDaysLater,
          },
        },
        orderBy: { startAt: "asc" },
        select: {
          id: true,
          startAt: true,
          endAt: true,
        },
      },
    },
  });

  if (!doctor) {
    const error = new Error("Doctor not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    doctorId: doctor.id,
    userId: doctor.userId,
    avatarUrl: doctor.avatarUrl,
    fullName: doctor.fullName,
    specialty: doctor.specialty,
    location: doctor.location,
    consultationFee: Number(doctor.consultationFee),
    yearsExperience: doctor.yearsExperience,
    bio: doctor.bio,
    ratingAvg: doctor.ratingAvg,
    reviewCount: doctor.reviewCount,
    insurancesAccepted: normalizeInsuranceList(doctor.insurancesAccepted),
    availableSlots: doctor.slots,
  };
}

// Lấy dashboard tổng hợp cho doctor gồm lịch, SLA, thu nhập và follow-up tasks.
async function getDoctorDashboard({ user, query }) {
  if (user.role !== "doctor") {
    const error = new Error("Only doctor can access doctor dashboard");
    error.statusCode = 403;
    throw error;
  }

  const doctorProfile = await getDoctorProfileByUserIdOrFail(user.userId);
  const { from, to } = parseDateRange(query);
  const now = new Date();

  const [appointments, followUpTasks, incomeRows] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId: doctorProfile.id,
        startAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        doctor: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.carePlan.findMany({
      where: {
        doctorId: user.userId,
        status: "ACTIVE",
        nextFollowUpAt: {
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 20,
    }),
    prisma.doctorIncomeLedger.findMany({
      where: {
        doctorUserId: user.userId,
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const summaryCards = {
    totalAppointments: appointments.length,
    confirmedAppointments: appointments.filter((item) => item.status === "CONFIRMED").length,
    completedAppointments: appointments.filter((item) => item.status === "COMPLETED").length,
    requestedAppointments: appointments.filter((item) => item.status === "REQUESTED").length,
  };

  const upcomingAppointments = appointments
    .filter((item) => item.startAt >= now)
    .slice(0, 15)
    .map((item) => ({
      id: item.id,
      patientUserId: item.patientUserId,
      startAt: item.startAt,
      endAt: item.endAt,
      status: item.status,
      reason: item.reason,
    }));

  const slaSamples = appointments
    .filter((item) => item.confirmedAt && item.createdAt)
    .map((item) => (item.confirmedAt.getTime() - item.createdAt.getTime()) / (1000 * 60));
  const avgResponseMinutes =
    slaSamples.length > 0
      ? Number((slaSamples.reduce((acc, cur) => acc + cur, 0) / slaSamples.length).toFixed(2))
      : null;
  const within15mCount = slaSamples.filter((minutes) => minutes <= 15).length;

  const totalIncome = incomeRows.reduce((acc, row) => acc + Number(row.amount), 0);
  const incomeMetrics = {
    totalIncome,
    consultSessionsCount: incomeRows.length,
    currency: "VND",
  };

  return {
    data: {
      doctor: doctorProfile,
      summaryCards,
      upcomingAppointments,
      followUpTasks: followUpTasks.map((task) => ({
        id: task.id,
        memberId: task.member.id,
        memberName: task.member.fullName,
        nextFollowUpAt: task.nextFollowUpAt,
        frequencyDays: task.frequencyDays,
      })),
      slaMetrics: {
        avgResponseMinutes,
        within15mCount,
        totalMeasured: slaSamples.length,
      },
      incomeMetrics,
    },
  };
}

// Lấy danh sách bệnh nhân doctor đang theo dõi dựa trên lịch điều trị.
async function listDoctorPatients({ user, query }) {
  if (user.role !== "doctor") {
    const error = new Error("Only doctor can list patients");
    error.statusCode = 403;
    throw error;
  }

  const doctorProfile = await getDoctorProfileByUserIdOrFail(user.userId);
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: doctorProfile.id,
      status: { in: ["REQUESTED", "CONFIRMED", "COMPLETED", "RESCHEDULED"] },
    },
    select: {
      patientUserId: true,
    },
    distinct: ["patientUserId"],
  });

  const patientUserIds = appointments.map((item) => item.patientUserId);
  if (patientUserIds.length === 0) {
    return {
      data: [],
      meta: buildMeta({ page, limit, total: 0 }),
    };
  }

  const whereMember = {
    familyProfile: {
      ownerUserId: { in: patientUserIds },
    },
    isPrimary: true,
  };
  if (query.q) {
    whereMember.fullName = { contains: query.q.trim() };
  }

  const [members, total] = await Promise.all([
    prisma.familyMember.findMany({
      where: whereMember,
      include: {
        familyProfile: {
          select: {
            ownerUserId: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.familyMember.count({ where: whereMember }),
  ]);

  return {
    data: members.map((member) => ({
      memberId: member.id,
      fullName: member.fullName,
      avatarUrl: member.avatarUrl,
      relation: member.relation,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      ownerUserId: member.familyProfile.ownerUserId,
      familyName: member.familyProfile.name,
    })),
    meta: buildMeta({ page, limit, total }),
  };
}

// Lấy overview bệnh nhân gồm hồ sơ sức khỏe, timeline và care plan.
async function getDoctorPatientOverview({ user, memberId }) {
  if (user.role !== "doctor") {
    const error = new Error("Only doctor can view patient overview");
    error.statusCode = 403;
    throw error;
  }

  const access = await resolveDoctorMemberAccess(user.userId, memberId);

  // Family doctor được xem full timeline; one-time doctor chỉ xem record thuộc appointment/share còn hạn.
  const timelineWhere =
    access.scope === "full"
      ? { memberId: access.member.id }
      : {
          memberId: access.member.id,
          OR: [
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
          ],
        };

  const [healthProfile, timeline, carePlan] = await Promise.all([
    access.scope === "full"
      ? prisma.healthProfile.findUnique({
          where: { memberId: access.member.id },
        })
      : Promise.resolve(null),
    prisma.timelineEntry.findMany({
      where: timelineWhere,
      include: {
        attachments: {
          orderBy: { createdAt: "asc" },
        },
        tags: {
          include: { tag: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    access.scope === "full"
      ? prisma.carePlan.findFirst({
          where: {
            memberId: access.member.id,
            doctorId: user.userId,
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  return {
    data: {
      member: access.member,
      accessScope: access.scope,
      healthProfile,
      timeline,
      carePlan,
    },
  };
}

// Lấy báo cáo thu nhập bác sĩ theo tháng để hiển thị trang income.
async function getDoctorIncome({ user, query }) {
  if (user.role !== "doctor") {
    const error = new Error("Only doctor can access income report");
    error.statusCode = 403;
    throw error;
  }

  const monthKey = query.month || toMonthKey(new Date());
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!year || !month || month < 1 || month > 12) {
    const error = new Error("month must be YYYY-MM");
    error.statusCode = 400;
    throw error;
  }

  const rangeFrom = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const rangeTo = new Date(Date.UTC(year, month, 1, 0, 0, 0));

  const rows = await prisma.doctorIncomeLedger.findMany({
    where: {
      doctorUserId: user.userId,
      createdAt: {
        gte: rangeFrom,
        lt: rangeTo,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amount), 0);

  return {
    data: {
      month: monthKey,
      totalAmount,
      currency: "VND",
      rows: rows.map((row) => ({
        id: row.id,
        consultSessionId: row.consultSessionId,
        patientUserId: row.patientUserId,
        planCode: row.planCode,
        amount: Number(row.amount),
        createdAt: row.createdAt,
      })),
    },
  };
}

// Lấy dashboard v2 cho bác sĩ với 3 vùng quản trị: monitoring, family-doctor, one-time.
async function getDoctorDashboardV2({ user, query }) {
  if (user.role !== "doctor") {
    const error = new Error("Only doctor can access doctor dashboard");
    error.statusCode = 403;
    throw error;
  }

  const doctorProfile = await getDoctorProfileByUserIdOrFail(user.userId);
  const { range, from, to } = parseDashboardV2Range(query);
  const serviceTypeFilter = query.serviceType || "all";
  const statusFilter = query.status || null;
  const tagFilter = query.tag?.trim() || null;

  const appointmentWhere = {
    doctorId: doctorProfile.id,
    startAt: {
      gte: from,
      lte: to,
    },
  };
  if (statusFilter) {
    appointmentWhere.status = statusFilter;
  }
  if (serviceTypeFilter === "family") {
    appointmentWhere.serviceType = "FAMILY_DOCTOR";
  } else if (serviceTypeFilter === "one-time") {
    appointmentWhere.serviceType = "ONE_TIME";
  }

  const [appointments, followUpTasksRaw, familyContracts] = await Promise.all([
    prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        doctor: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.carePlan.findMany({
      where: {
        doctorId: user.userId,
        status: "ACTIVE",
        nextFollowUpAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            familyProfile: {
              select: {
                ownerUserId: true,
              },
            },
          },
        },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 100,
    }),
    prisma.familyDoctorRequest.findMany({
      where: {
        doctorProfileId: doctorProfile.id,
        status: "APPROVED",
        contractStartsAt: { lte: new Date() },
        contractEndsAt: { gt: new Date() },
      },
      include: {
        patient: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { contractEndsAt: "asc" },
    }),
  ]);

  const oneTimeAppointments = appointments.filter((item) => item.serviceType === "ONE_TIME");
  const familyAppointments = appointments.filter(
    (item) => item.serviceType === "FAMILY_DOCTOR"
  );

  const oneTimePanel = oneTimeAppointments.map((item) => ({
    appointmentId: item.id,
    patientUserId: item.patientUserId,
    reason: item.reason,
    status: item.status,
    startAt: item.startAt,
    endAt: item.endAt,
  }));

  const familyDoctorPanel = familyContracts.map((item) => ({
    requestId: item.id,
    patientUserId: item.patientUserId,
    patientDisplayName: item.patient.displayName,
    patientEmail: item.patient.email,
    patientAvatarUrl: item.patient.avatarUrl,
    billingCycle: item.billingCycle,
    billingAmount: Number(item.billingAmount),
    contractEndsAt: item.contractEndsAt,
  }));

  const followUpMemberIds = followUpTasksRaw.map((item) => item.member.id);
  let taggedMemberIdSet = null;
  if (tagFilter && followUpMemberIds.length > 0) {
    const taggedEntries = await prisma.timelineEntry.findMany({
      where: {
        memberId: { in: followUpMemberIds },
        tags: {
          some: {
            tag: {
              label: {
                contains: tagFilter,
              },
            },
          },
        },
      },
      select: {
        memberId: true,
      },
      distinct: ["memberId"],
    });
    taggedMemberIdSet = new Set(taggedEntries.map((item) => item.memberId));
  }

  const monitoringQueue = followUpTasksRaw
    .filter((item) => (taggedMemberIdSet ? taggedMemberIdSet.has(item.member.id) : true))
    .map((item) => ({
      carePlanId: item.id,
      memberId: item.member.id,
      memberName: item.member.fullName,
      ownerUserId: item.member.familyProfile.ownerUserId,
      nextFollowUpAt: item.nextFollowUpAt,
      frequencyDays: item.frequencyDays,
      status: item.status,
    }));

  const summaryCards = {
    totalAppointments: appointments.length,
    familyDoctorAppointments: familyAppointments.length,
    oneTimeAppointments: oneTimeAppointments.length,
    activeFamilyPatients: familyDoctorPanel.length,
    monitoringTasks: monitoringQueue.length,
  };

  return {
    data: {
      doctor: doctorProfile,
      summaryCards,
      monitoringQueue,
      familyDoctorPanel,
      oneTimePanel,
      filtersApplied: {
        range,
        serviceType: serviceTypeFilter,
        status: statusFilter,
        tag: tagFilter,
        from,
        to,
      },
    },
  };
}

module.exports = {
  listDoctors,
  getDoctorDetailById,
  getDoctorDashboard,
  listDoctorPatients,
  getDoctorPatientOverview,
  getDoctorIncome,
  getDoctorDashboardV2,
};
