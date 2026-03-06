const { Prisma } = require("@prisma/client");
const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");
const { env } = require("../../config/env");

// Tạo lỗi HTTP chuẩn để đồng bộ cách trả lỗi trong toàn module.
function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Chuẩn hóa danh sách bảo hiểm từ JSON để client hiển thị ổn định.
function normalizeInsuranceList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

// Lấy cấu hình bảng giá thuê bác sĩ gia đình theo chu kỳ tuần/tháng.
function getFamilyDoctorBillingConfig() {
  return {
    WEEKLY: {
      cycle: "WEEKLY",
      label: "Thuê theo tuần",
      price: Number(env.familyDoctorWeeklyFee),
      durationDays: 7,
    },
    MONTHLY: {
      cycle: "MONTHLY",
      label: "Thuê theo tháng",
      price: Number(env.familyDoctorMonthlyFee),
      durationDays: 30,
    },
  };
}

// Tính thời điểm kết thúc hợp đồng dựa trên chu kỳ thuê.
function buildContractEndsAt(contractStartsAt, billingCycle) {
  const config = getFamilyDoctorBillingConfig()[billingCycle];
  if (!config) {
    throw createHttpError("Invalid billingCycle", 400);
  }

  const endsAt = new Date(contractStartsAt);
  endsAt.setDate(endsAt.getDate() + config.durationDays);
  return endsAt;
}

// Lấy doctor profile theo userId, ném lỗi nếu bác sĩ chưa có profile.
async function getDoctorProfileByUserIdOrFail(userId, tx = prisma) {
  const profile = await tx.doctorProfile.findUnique({
    where: { userId },
  });
  if (!profile) {
    throw createHttpError("Doctor profile not found", 404);
  }
  return profile;
}

// Tạo điều kiện lọc bác sĩ cho marketplace theo query người dùng.
function buildMarketplaceWhere(query = {}) {
  const where = {
    isActive: true,
    intakeStatus: "OPEN",
  };

  if (query.q) {
    where.OR = [
      { fullName: { contains: query.q.trim() } },
      { specialty: { contains: query.q.trim() } },
      { location: { contains: query.q.trim() } },
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

  return where;
}

// Đếm số hợp đồng family doctor đang active của một bác sĩ theo thời gian thực.
async function countDoctorActiveContracts(doctorProfileId, tx = prisma) {
  const now = new Date();
  return tx.familyDoctorRequest.count({
    where: {
      doctorProfileId,
      status: "APPROVED",
      contractStartsAt: { lte: now },
      contractEndsAt: { gt: now },
    },
  });
}

// Trả thông tin hướng dẫn thanh toán thủ công cho luồng thuê bác sĩ gia đình.
async function getFamilyDoctorPaymentConfig({ user }) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can view payment config", 403);
  }

  const billingConfig = getFamilyDoctorBillingConfig();
  return {
    data: {
      bankAccount: {
        ownerName: env.familyDoctorAdminBankOwner,
        accountNumber: env.familyDoctorAdminBankAccount,
        bankName: env.familyDoctorAdminBankName,
        transferNoteHint: "FDOC <email> <doctorName>",
      },
      options: [billingConfig.WEEKLY, billingConfig.MONTHLY],
    },
  };
}

// Trả marketplace bác sĩ dành cho patient đang tìm bác sĩ gia đình.
async function listMarketplace({ user, query = {} }) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can access family doctor marketplace", 403);
  }

  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  });

  const where = buildMarketplaceWhere(query);
  const [profiles, total] = await Promise.all([
    prisma.doctorProfile.findMany({
      where,
      orderBy: [{ ratingAvg: "desc" }, { reviewCount: "desc" }],
      skip,
      take: limit,
    }),
    prisma.doctorProfile.count({ where }),
  ]);

  const doctorIds = profiles.map((item) => item.id);
  const activeCounts = doctorIds.length
    ? await prisma.familyDoctorRequest.groupBy({
        by: ["doctorProfileId"],
        where: {
          doctorProfileId: { in: doctorIds },
          status: "APPROVED",
          contractStartsAt: { lte: new Date() },
          contractEndsAt: { gt: new Date() },
        },
        _count: {
          _all: true,
        },
      })
    : [];

  const activeCountMap = new Map(
    activeCounts.map((item) => [item.doctorProfileId, item._count._all])
  );

  return {
    data: profiles.map((item) => ({
      doctorId: item.id,
      userId: item.userId,
      avatarUrl: item.avatarUrl,
      fullName: item.fullName,
      specialty: item.specialty,
      location: item.location,
      consultationFee: Number(item.consultationFee),
      yearsExperience: item.yearsExperience,
      bio: item.bio,
      ratingAvg: item.ratingAvg,
      reviewCount: item.reviewCount,
      insurancesAccepted: normalizeInsuranceList(item.insurancesAccepted),
      intakeStatus: item.intakeStatus,
      activeFamilyCount: activeCountMap.get(item.id) || 0,
      maxFamilySlots: item.maxFamilySlots,
    })),
    meta: buildMeta({ page, limit, total }),
  };
}

// Tạo yêu cầu thuê bác sĩ gia đình từ phía patient (không phụ thuộc subscription).
async function createFamilyDoctorRequest({ user, payload }) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can create family doctor request", 403);
  }

  const { doctorProfileId, requestNote, billingCycle, paymentReference } = payload || {};
  if (!doctorProfileId || !billingCycle) {
    throw createHttpError("doctorProfileId and billingCycle are required", 400);
  }

  const config = getFamilyDoctorBillingConfig()[billingCycle];
  if (!config) {
    throw createHttpError("billingCycle must be WEEKLY or MONTHLY", 400);
  }

  return prisma.$transaction(async (tx) => {
    const doctor = await tx.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      select: {
        id: true,
        userId: true,
        intakeStatus: true,
        maxFamilySlots: true,
      },
    });

    if (!doctor) {
      throw createHttpError("Doctor profile not found", 404);
    }
    if (doctor.intakeStatus !== "OPEN") {
      throw createHttpError("Doctor is not accepting new family patients", 400);
    }

    const activeCount = await countDoctorActiveContracts(doctor.id, tx);
    if (activeCount >= doctor.maxFamilySlots) {
      throw createHttpError("Doctor has reached family doctor capacity", 409);
    }

    const existingPending = await tx.familyDoctorRequest.findFirst({
      where: {
        patientUserId: user.userId,
        doctorProfileId: doctor.id,
        status: "PENDING",
      },
      select: { id: true },
    });
    if (existingPending) {
      throw createHttpError("Pending request already exists for this doctor", 409);
    }

    const activeContract = await tx.familyDoctorRequest.findFirst({
      where: {
        patientUserId: user.userId,
        doctorProfileId: doctor.id,
        status: "APPROVED",
        contractStartsAt: { lte: new Date() },
        contractEndsAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (activeContract) {
      throw createHttpError("You already have an active contract with this doctor", 409);
    }

    const created = await tx.familyDoctorRequest.create({
      data: {
        patientUserId: user.userId,
        doctorProfileId: doctor.id,
        doctorUserId: doctor.userId,
        billingCycle,
        billingAmount: new Prisma.Decimal(config.price),
        paymentStatus: "PENDING_VERIFICATION",
        paymentReference: paymentReference?.trim() || null,
        status: "PENDING",
        requestNote: requestNote?.trim() || null,
      },
      include: {
        doctorProfile: {
          select: {
            id: true,
            fullName: true,
            specialty: true,
            location: true,
          },
        },
      },
    });

    return {
      data: {
        ...created,
        paymentInstructions: {
          ownerName: env.familyDoctorAdminBankOwner,
          accountNumber: env.familyDoctorAdminBankAccount,
          bankName: env.familyDoctorAdminBankName,
          expectedAmount: config.price,
          cycle: billingCycle,
        },
      },
    };
  });
}

// Lấy danh sách request của patient hiện tại.
async function listMyFamilyDoctorRequests({ user }) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can view own requests", 403);
  }

  const rows = await prisma.familyDoctorRequest.findMany({
    where: { patientUserId: user.userId },
    include: {
      doctorProfile: {
        select: {
          id: true,
          avatarUrl: true,
          fullName: true,
          specialty: true,
          location: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return {
    data: rows.map((row) => ({
      id: row.id,
      status: row.status,
      billingCycle: row.billingCycle,
      billingAmount: Number(row.billingAmount),
      paymentStatus: row.paymentStatus,
      paymentReference: row.paymentReference,
      requestNote: row.requestNote,
      responseNote: row.responseNote,
      requestedAt: row.requestedAt,
      respondedAt: row.respondedAt,
      contractStartsAt: row.contractStartsAt,
      contractEndsAt: row.contractEndsAt,
      doctor: row.doctorProfile,
    })),
  };
}

// Lấy danh sách request chờ duyệt của bác sĩ hiện tại.
async function listIncomingFamilyDoctorRequests({ user, query = {} }) {
  if (user.role !== "doctor") {
    throw createHttpError("Only doctor can view incoming requests", 403);
  }

  const doctorProfile = await getDoctorProfileByUserIdOrFail(user.userId);
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  });

  const where = {
    doctorProfileId: doctorProfile.id,
    status: query.status || "PENDING",
  };

  const [rows, total] = await Promise.all([
    prisma.familyDoctorRequest.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.familyDoctorRequest.count({ where }),
  ]);

  return {
    data: rows.map((row) => ({
      ...row,
      billingAmount: Number(row.billingAmount),
    })),
    meta: buildMeta({ page, limit, total }),
  };
}

// Bật/tắt trạng thái bác sĩ đang nhận thêm bệnh nhân gia đình.
async function updateDoctorIntakeStatus({ user, payload }) {
  if (user.role !== "doctor") {
    throw createHttpError("Only doctor can update intake status", 403);
  }

  const intakeStatus = payload?.intakeStatus;
  if (!["OPEN", "PAUSED"].includes(intakeStatus)) {
    throw createHttpError("intakeStatus must be OPEN or PAUSED", 400);
  }

  const doctorProfile = await getDoctorProfileByUserIdOrFail(user.userId);
  const activeCount = await countDoctorActiveContracts(doctorProfile.id);
  const updated = await prisma.doctorProfile.update({
    where: { id: doctorProfile.id },
    data: {
      intakeStatus,
      activeFamilyCount: activeCount,
    },
    select: {
      id: true,
      intakeStatus: true,
      activeFamilyCount: true,
      maxFamilySlots: true,
    },
  });

  return { data: updated };
}

// Doctor duyệt hoặc từ chối request family doctor gửi tới mình.
async function respondFamilyDoctorRequest({ user, requestId, payload }) {
  if (user.role !== "doctor") {
    throw createHttpError("Only doctor can respond requests", 403);
  }

  const action = payload?.action;
  if (!["APPROVE", "REJECT"].includes(action)) {
    throw createHttpError("action must be APPROVE or REJECT", 400);
  }

  const doctorProfile = await getDoctorProfileByUserIdOrFail(user.userId);

  return prisma.$transaction(async (tx) => {
    const request = await tx.familyDoctorRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw createHttpError("Family doctor request not found", 404);
    }
    if (request.doctorProfileId !== doctorProfile.id) {
      throw createHttpError("Forbidden", 403);
    }
    if (request.status !== "PENDING") {
      throw createHttpError("Only pending request can be responded", 409);
    }

    if (action === "APPROVE") {
      const activeCount = await countDoctorActiveContracts(doctorProfile.id, tx);
      if (activeCount >= doctorProfile.maxFamilySlots) {
        throw createHttpError("Doctor has reached family doctor capacity", 409);
      }

      const startsAt = new Date();
      const endsAt = buildContractEndsAt(startsAt, request.billingCycle);
      const approved = await tx.familyDoctorRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          paymentStatus: "VERIFIED",
          paymentConfirmedAt: startsAt,
          contractStartsAt: startsAt,
          contractEndsAt: endsAt,
          responseNote: payload?.responseNote?.trim() || null,
          respondedAt: startsAt,
        },
      });

      await tx.doctorProfile.update({
        where: { id: doctorProfile.id },
        data: {
          activeFamilyCount: activeCount + 1,
        },
      });

      return {
        data: {
          ...approved,
          billingAmount: Number(approved.billingAmount),
        },
      };
    }

    const rejected = await tx.familyDoctorRequest.update({
      where: { id: request.id },
      data: {
        status: "REJECTED",
        paymentStatus: "REJECTED",
        responseNote: payload?.responseNote?.trim() || null,
        respondedAt: new Date(),
      },
    });

    return {
      data: {
        ...rejected,
        billingAmount: Number(rejected.billingAmount),
      },
    };
  });
}

// Lấy danh sách hợp đồng family doctor active của patient để hiển thị trang tổng quan.
async function getMyFamilyDoctorContract({ user }) {
  if (user.role !== "patient") {
    throw createHttpError("Only patient can view own family doctor contract", 403);
  }

  const now = new Date();
  const [activeContracts, pendingRequests] = await Promise.all([
    prisma.familyDoctorRequest.findMany({
      where: {
        patientUserId: user.userId,
        status: "APPROVED",
        contractStartsAt: { lte: now },
        contractEndsAt: { gt: now },
      },
      include: {
        doctorProfile: {
          select: {
            id: true,
            avatarUrl: true,
            fullName: true,
            specialty: true,
            location: true,
            consultationFee: true,
          },
        },
      },
      orderBy: { contractEndsAt: "asc" },
    }),
    prisma.familyDoctorRequest.findMany({
      where: {
        patientUserId: user.userId,
        status: "PENDING",
      },
      include: {
        doctorProfile: {
          select: {
            id: true,
            avatarUrl: true,
            fullName: true,
            specialty: true,
            location: true,
            consultationFee: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  return {
    data: {
      activeContracts: activeContracts.map((item) => ({
        id: item.id,
        status: item.status,
        billingCycle: item.billingCycle,
        billingAmount: Number(item.billingAmount),
        paymentStatus: item.paymentStatus,
        contractStartsAt: item.contractStartsAt,
        contractEndsAt: item.contractEndsAt,
        doctor: {
          ...item.doctorProfile,
          consultationFee: Number(item.doctorProfile.consultationFee),
        },
      })),
      pendingRequests: pendingRequests.map((item) => ({
        id: item.id,
        status: item.status,
        billingCycle: item.billingCycle,
        billingAmount: Number(item.billingAmount),
        paymentStatus: item.paymentStatus,
        paymentReference: item.paymentReference,
        requestNote: item.requestNote,
        requestedAt: item.requestedAt,
        doctor: {
          ...item.doctorProfile,
          consultationFee: Number(item.doctorProfile.consultationFee),
        },
      })),
    },
  };
}

module.exports = {
  getFamilyDoctorPaymentConfig,
  listMarketplace,
  createFamilyDoctorRequest,
  listMyFamilyDoctorRequests,
  listIncomingFamilyDoctorRequests,
  updateDoctorIntakeStatus,
  respondFamilyDoctorRequest,
  getMyFamilyDoctorContract,
};
