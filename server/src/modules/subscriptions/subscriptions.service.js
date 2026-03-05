const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");

const PLAN_INCOME_AMOUNT_MAP = {
  FREE: 0,
  PREMIUM: 120000,
  FAMILY: 100000,
};

// Tạo lỗi HTTP chuẩn để đồng bộ cách trả lỗi giữa các service.
function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Chuẩn hóa khóa tháng theo định dạng YYYY-MM để đếm usage quota.
function toMonthKey(dateValue = new Date()) {
  const date = new Date(dateValue);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Sinh mã tham chiếu giao dịch mock để truy vết đối soát.
function buildReferenceCode(prefix = "TXN") {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${random}`;
}

// Lấy plan FREE làm mặc định fallback khi user chưa mua gói.
async function getFreePlanOrFail(tx = prisma) {
  const freePlan = await tx.subscriptionPlan.findUnique({
    where: { code: "FREE" },
  });
  if (!freePlan) {
    throw createHttpError("FREE plan is not configured", 500);
  }
  return freePlan;
}

// Lấy subscription active hiện tại của user theo mốc thời gian chỉ định.
async function getActiveSubscriptionByUserId(userId, at = new Date(), tx = prisma) {
  return tx.userSubscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      startedAt: { lte: at },
      endsAt: { gte: at },
    },
    include: {
      plan: true,
      assignedDoctorProfile: {
        select: { id: true, fullName: true, specialty: true },
      },
    },
    orderBy: { endsAt: "desc" },
  });
}

// Chuẩn hóa dữ liệu subscription + usage để FE hiển thị quyền lợi còn lại.
function toSubscriptionView({ subscription, plan, usage }) {
  const quota = plan.consultSessionQuota;
  const used = usage?.consultSessionsUsed || 0;
  const remaining = quota < 0 ? -1 : Math.max(quota - used, 0);

  return {
    subscriptionId: subscription?.id || null,
    status: subscription?.status || "EXPIRED",
    startedAt: subscription?.startedAt || null,
    endsAt: subscription?.endsAt || null,
    autoRenew: subscription?.autoRenew || false,
    assignedDoctor: subscription?.assignedDoctorProfile || null,
    plan: {
      code: plan.code,
      name: plan.name,
      thumbnailUrl: plan.thumbnailUrl,
      monthlyPrice: Number(plan.monthlyPrice),
      consultSessionQuota: plan.consultSessionQuota,
      familyMemberLimit: plan.familyMemberLimit,
      slaMinutes: plan.slaMinutes,
      isPriority: plan.isPriority,
    },
    usage: {
      monthKey: usage?.monthKey || toMonthKey(),
      consultSessionsUsed: used,
      consultSessionsRemaining: remaining,
    },
  };
}

// Lấy danh sách plan đang active để hiển thị trên trang chọn gói.
async function listPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { monthlyPrice: "asc" },
  });

  return {
    data: plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      thumbnailUrl: plan.thumbnailUrl,
      monthlyPrice: Number(plan.monthlyPrice),
      consultSessionQuota: plan.consultSessionQuota,
      familyMemberLimit: plan.familyMemberLimit,
      slaMinutes: plan.slaMinutes,
      isPriority: plan.isPriority,
      isActive: plan.isActive,
    })),
  };
}

// Lấy thông tin gói hiện tại + usage theo tháng của user đăng nhập.
async function getMySubscription(userId, query = {}) {
  const monthKey = query.month || toMonthKey();
  const now = new Date();

  const activeSubscription = await getActiveSubscriptionByUserId(userId, now);
  const plan = activeSubscription?.plan || (await getFreePlanOrFail());

  let usage = null;
  if (activeSubscription) {
    usage = await prisma.usageCounterMonthly.findUnique({
      where: {
        userSubscriptionId_monthKey: {
          userSubscriptionId: activeSubscription.id,
          monthKey,
        },
      },
    });
  }

  return {
    data: toSubscriptionView({
      subscription: activeSubscription,
      plan,
      usage,
    }),
  };
}

// Tạo giao dịch checkout mock theo nhánh success/fail và cập nhật subscription.
async function checkoutMock({ userId, payload }) {
  const { planCode, paymentMethod, mockResult = "SUCCESS" } = payload || {};
  if (!planCode || !paymentMethod) {
    throw createHttpError("planCode and paymentMethod are required", 400);
  }

  if (!["SUCCESS", "FAILED"].includes(mockResult)) {
    throw createHttpError("mockResult must be SUCCESS or FAILED", 400);
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { code: planCode },
  });

  if (!plan || !plan.isActive) {
    throw createHttpError("Selected plan is not available", 404);
  }

  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setUTCMonth(endsAt.getUTCMonth() + 1);

  return prisma.$transaction(async (tx) => {
    if (mockResult === "SUCCESS") {
      // Đóng các subscription active cũ trước khi kích hoạt gói mới.
      await tx.userSubscription.updateMany({
        where: {
          userId,
          status: "ACTIVE",
        },
        data: {
          status: "EXPIRED",
          autoRenew: false,
          updatedAt: now,
        },
      });

      const subscription = await tx.userSubscription.create({
        data: {
          userId,
          planId: plan.id,
          status: "ACTIVE",
          startedAt: now,
          endsAt,
          autoRenew: true,
        },
      });

      const transaction = await tx.paymentTransaction.create({
        data: {
          userId,
          userSubscriptionId: subscription.id,
          amount: plan.monthlyPrice,
          currency: "VND",
          paymentMethod,
          mockResult: "SUCCESS",
          status: "SUCCESS",
          referenceCode: buildReferenceCode("PAY"),
        },
      });

      return {
        data: {
          subscriptionId: subscription.id,
          transactionId: transaction.id,
          transactionStatus: transaction.status,
        },
      };
    }

    // Nhánh fail vẫn tạo giao dịch và bản ghi subscription ở trạng thái CANCELLED để audit.
    const failedSubscription = await tx.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "CANCELLED",
        startedAt: now,
        endsAt,
        autoRenew: false,
      },
    });

    const failedTransaction = await tx.paymentTransaction.create({
      data: {
        userId,
        userSubscriptionId: failedSubscription.id,
        amount: plan.monthlyPrice,
        currency: "VND",
        paymentMethod,
        mockResult: "FAILED",
        status: "FAILED",
        failureReason: "Mock payment failed by scenario",
        referenceCode: buildReferenceCode("FAIL"),
      },
    });

    return {
      data: {
        subscriptionId: failedSubscription.id,
        transactionId: failedTransaction.id,
        transactionStatus: failedTransaction.status,
      },
    };
  });
}

// Lấy lịch sử transaction có phân trang cho user hiện tại.
async function listTransactions({ userId, query = {} }) {
  const { page, limit, skip } = parsePagination(query, {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 50,
  });

  const [items, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where: { userId },
      include: {
        userSubscription: {
          include: { plan: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.paymentTransaction.count({ where: { userId } }),
  ]);

  return {
    data: items.map((item) => ({
      id: item.id,
      status: item.status,
      mockResult: item.mockResult,
      amount: Number(item.amount),
      currency: item.currency,
      paymentMethod: item.paymentMethod,
      failureReason: item.failureReason,
      referenceCode: item.referenceCode,
      createdAt: item.createdAt,
      plan: item.userSubscription?.plan
        ? {
            code: item.userSubscription.plan.code,
            name: item.userSubscription.plan.name,
            thumbnailUrl: item.userSubscription.plan.thumbnailUrl,
          }
        : null,
    })),
    meta: buildMeta({ page, limit, total }),
  };
}

// Lấy usage theo tháng cho user dựa trên subscription active hiện tại.
async function getUsage({ userId, month }) {
  const monthKey = month || toMonthKey();
  const activeSubscription = await getActiveSubscriptionByUserId(userId, new Date());
  const plan = activeSubscription?.plan || (await getFreePlanOrFail());

  if (!activeSubscription) {
    return {
      data: {
        monthKey,
        consultSessionsUsed: 0,
        consultSessionsRemaining: plan.consultSessionQuota,
      },
    };
  }

  const usage = await prisma.usageCounterMonthly.findUnique({
    where: {
      userSubscriptionId_monthKey: {
        userSubscriptionId: activeSubscription.id,
        monthKey,
      },
    },
  });

  const used = usage?.consultSessionsUsed || 0;
  return {
    data: {
      monthKey,
      consultSessionsUsed: used,
      consultSessionsRemaining: Math.max(plan.consultSessionQuota - used, 0),
    },
  };
}

// Hủy subscription active của user hiện tại theo thao tác thủ công.
async function cancelSubscription(userId) {
  const activeSubscription = await getActiveSubscriptionByUserId(userId, new Date());
  if (!activeSubscription) {
    throw createHttpError("No active subscription to cancel", 404);
  }

  const updated = await prisma.userSubscription.update({
    where: { id: activeSubscription.id },
    data: {
      status: "CANCELLED",
      autoRenew: false,
    },
  });

  return { data: updated };
}

// Lấy entitlement hiện tại của user để dùng chung cho gating và UI guard.
async function getCurrentEntitlement(userId, at = new Date(), tx = prisma) {
  const activeSubscription = await getActiveSubscriptionByUserId(userId, at, tx);
  const plan = activeSubscription?.plan || (await getFreePlanOrFail(tx));
  const monthKey = toMonthKey(at);

  let usage = null;
  if (activeSubscription) {
    usage = await tx.usageCounterMonthly.findUnique({
      where: {
        userSubscriptionId_monthKey: {
          userSubscriptionId: activeSubscription.id,
          monthKey,
        },
      },
    });
  }

  return { activeSubscription, plan, usage, monthKey };
}

// Chặn thao tác tạo consult session khi quota tháng đã hết.
async function ensureConsultQuotaOrThrow(userId, at = new Date()) {
  const { activeSubscription, plan, usage } = await getCurrentEntitlement(userId, at);

  const quota = plan.consultSessionQuota;
  const used = usage?.consultSessionsUsed || 0;
  if (!activeSubscription || quota <= 0 || used >= quota) {
    throw createHttpError(
      `Consult session quota exceeded for current plan (${plan.code})`,
      403
    );
  }

  return { activeSubscription, plan, used };
}

// Chặn thao tác thêm thành viên gia đình khi vượt giới hạn của gói.
async function ensureFamilyMemberLimitOrThrow({ userId, nextMemberCount }) {
  const { plan } = await getCurrentEntitlement(userId, new Date());
  if (nextMemberCount > plan.familyMemberLimit) {
    throw createHttpError(
      `Family member limit exceeded for current plan (${plan.code})`,
      403
    );
  }
  return { plan };
}

// Tăng usage theo tháng và ghi nhận thu nhập bác sĩ khi consult session kết thúc.
async function settleConsultUsageAndIncome({ sessionId, settledAt = new Date() }) {
  return prisma.$transaction(
    // Gom toàn bộ bước settle vào một transaction để đảm bảo tính nhất quán usage/income.
    async (tx) => {
      const session = await tx.consultSession.findUnique({
        where: { id: sessionId },
        include: {
          appointment: {
            include: {
              doctor: {
                select: { userId: true },
              },
            },
          },
        },
      });

      if (!session) {
        throw createHttpError("Consult session not found", 404);
      }

      if (session.incomeSettledAt) {
        return { settled: false };
      }

      const { activeSubscription, plan, monthKey } = await getCurrentEntitlement(
        session.appointment.patientUserId,
        settledAt,
        tx
      );

      // Chỉ tăng usage nếu tại thời điểm settle user có subscription active.
      if (activeSubscription) {
        await tx.usageCounterMonthly.upsert({
          where: {
            userSubscriptionId_monthKey: {
              userSubscriptionId: activeSubscription.id,
              monthKey,
            },
          },
          update: {
            consultSessionsUsed: { increment: 1 },
          },
          create: {
            userSubscriptionId: activeSubscription.id,
            monthKey,
            consultSessionsUsed: 1,
          },
        });
      }

      const incomeAmount = PLAN_INCOME_AMOUNT_MAP[plan.code] || 0;
      if (incomeAmount > 0) {
        await tx.doctorIncomeLedger.create({
          data: {
            doctorUserId: session.appointment.doctor.userId,
            patientUserId: session.appointment.patientUserId,
            consultSessionId: session.id,
            planCode: plan.code,
            amount: incomeAmount,
            currency: "VND",
          },
        });
      }

      await tx.consultSession.update({
        where: { id: session.id },
        data: {
          incomeSettledAt: settledAt,
        },
      });

      return {
        settled: true,
        planCode: plan.code,
        incomeAmount,
      };
    },
    {
      // Tăng timeout để tránh fail ở môi trường DB có độ trễ cao.
      maxWait: 10000,
      timeout: 30000,
    }
  );
}

module.exports = {
  listPlans,
  getMySubscription,
  checkoutMock,
  listTransactions,
  getUsage,
  cancelSubscription,
  ensureConsultQuotaOrThrow,
  ensureFamilyMemberLimitOrThrow,
  settleConsultUsageAndIncome,
  getCurrentEntitlement,
  toMonthKey,
};
