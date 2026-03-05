const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Tạo chuỗi tháng YYYY-MM phục vụ usage counter seed.
function toMonthKey(dateValue = new Date()) {
  const date = new Date(dateValue);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Tạo dữ liệu seed nền cho user, doctor profile, slot và subscription plans.
async function main() {
  console.log("[SEED] Bắt đầu chạy seed dữ liệu...");

  const defaultUsers = [
    {
      email: "patient.demo@picyourdoc.local",
      password: "Patient@123",
      role: "patient",
      displayName: "Patient Demo",
    },
    {
      email: "doctor.demo@picyourdoc.local",
      password: "Doctor@123",
      role: "doctor",
      displayName: "Doctor Demo",
    },
    {
      email: "admin.demo@picyourdoc.local",
      password: "Admin@123",
      role: "admin",
      displayName: "Admin Demo",
    },
  ];

  const upsertedUsers = [];
  // Seed bộ user nền tảng cho patient/doctor/admin.
  console.log(`[SEED] Đang seed ${defaultUsers.length} user nền tảng...`);
  for (const user of defaultUsers) {
    console.log(`[SEED] -> Upsert user: ${user.email}`);
    const passwordHash = await bcrypt.hash(user.password, 10);
    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role: user.role,
        displayName: user.displayName,
      },
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
        displayName: user.displayName,
      },
    });
    upsertedUsers.push(savedUser);
  }
  console.log(`[SEED] Hoàn tất user nền tảng: ${upsertedUsers.length}`);

  const demoDoctors = [
    {
      email: "doctor.01@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Trần Minh An",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Trần Minh An",
        specialty: "Tim mạch",
        location: "TP.HCM",
        consultationFee: 350000,
        yearsExperience: 12,
        bio: "Chuyên tư vấn bệnh tim mạch và quản lý tăng huyết áp.",
        ratingAvg: 4.8,
        reviewCount: 220,
        insurancesAccepted: ["BHYT", "PVI"],
      },
    },
    {
      email: "doctor.02@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Nguyễn Hữu Phúc",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Nguyễn Hữu Phúc",
        specialty: "Nội tổng quát",
        location: "TP.HCM",
        consultationFee: 280000,
        yearsExperience: 8,
        bio: "Khám nội tổng quát và theo dõi sức khỏe định kỳ.",
        ratingAvg: 4.6,
        reviewCount: 175,
        insurancesAccepted: ["BHYT"],
      },
    },
    {
      email: "doctor.03@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Lê Thu Hà",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Lê Thu Hà",
        specialty: "Nhi khoa",
        location: "Hà Nội",
        consultationFee: 320000,
        yearsExperience: 10,
        bio: "Theo dõi sức khỏe trẻ nhỏ và tư vấn dinh dưỡng.",
        ratingAvg: 4.9,
        reviewCount: 305,
        insurancesAccepted: ["BHYT", "Bảo Minh"],
      },
    },
    {
      email: "doctor.04@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Phạm Quốc Bảo",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Phạm Quốc Bảo",
        specialty: "Thần kinh",
        location: "Đà Nẵng",
        consultationFee: 400000,
        yearsExperience: 14,
        bio: "Chuyên điều trị đau đầu mạn tính và rối loạn giấc ngủ.",
        ratingAvg: 4.7,
        reviewCount: 132,
        insurancesAccepted: ["PVI", "Bảo Việt"],
      },
    },
    {
      email: "doctor.05@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Vũ Mai Hương",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1604881991720-f91add269bed?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Vũ Mai Hương",
        specialty: "Nội tiết",
        location: "Hà Nội",
        consultationFee: 360000,
        yearsExperience: 11,
        bio: "Theo dõi tiểu đường và rối loạn chuyển hóa.",
        ratingAvg: 4.8,
        reviewCount: 208,
        insurancesAccepted: ["BHYT", "PVI", "Bảo Việt"],
      },
    },
    {
      email: "doctor.06@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Đỗ Thành Nam",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Đỗ Thành Nam",
        specialty: "Hô hấp",
        location: "TP.HCM",
        consultationFee: 300000,
        yearsExperience: 9,
        bio: "Điều trị hen suyễn và bệnh phổi tắc nghẽn mạn tính.",
        ratingAvg: 4.5,
        reviewCount: 98,
        insurancesAccepted: ["BHYT", "Bảo Minh"],
      },
    },
    {
      email: "doctor.07@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Hoàng Gia Linh",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Hoàng Gia Linh",
        specialty: "Da liễu",
        location: "Cần Thơ",
        consultationFee: 270000,
        yearsExperience: 7,
        bio: "Điều trị các bệnh lý da liễu và tư vấn chăm sóc da.",
        ratingAvg: 4.4,
        reviewCount: 76,
        insurancesAccepted: ["PVI"],
      },
    },
    {
      email: "doctor.08@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Trịnh Khánh Vy",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Trịnh Khánh Vy",
        specialty: "Sản phụ khoa",
        location: "TP.HCM",
        consultationFee: 380000,
        yearsExperience: 13,
        bio: "Theo dõi sức khỏe phụ nữ và tư vấn tiền sản.",
        ratingAvg: 4.9,
        reviewCount: 260,
        insurancesAccepted: ["BHYT", "Bảo Việt"],
      },
    },
    {
      email: "doctor.09@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Phan Ngọc Sơn",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Phan Ngọc Sơn",
        specialty: "Tai mũi họng",
        location: "Hà Nội",
        consultationFee: 290000,
        yearsExperience: 8,
        bio: "Khám và tư vấn bệnh tai mũi họng người lớn, trẻ em.",
        ratingAvg: 4.6,
        reviewCount: 114,
        insurancesAccepted: ["BHYT", "PVI"],
      },
    },
    {
      email: "doctor.10@picyourdoc.local",
      password: "Doctor@123",
      displayName: "BS. Nguyễn Hải Đăng",
      profile: {
        avatarUrl: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80",
        fullName: "BS. Nguyễn Hải Đăng",
        specialty: "Cơ xương khớp",
        location: "Đà Nẵng",
        consultationFee: 340000,
        yearsExperience: 10,
        bio: "Tư vấn đau cột sống, thoái hóa và phục hồi chức năng.",
        ratingAvg: 4.7,
        reviewCount: 149,
        insurancesAccepted: ["BHYT", "Bảo Minh"],
      },
    },
  ];

  const allDoctorUsers = [];
  // Seed bác sĩ mẫu và hồ sơ chuyên môn tương ứng.
  console.log(`[SEED] Đang seed ${demoDoctors.length} bác sĩ mẫu...`);
  for (const doctorSeed of demoDoctors) {
    console.log(`[SEED] -> Upsert doctor user/profile: ${doctorSeed.email}`);
    const passwordHash = await bcrypt.hash(doctorSeed.password, 10);
    const doctorUser = await prisma.user.upsert({
      where: { email: doctorSeed.email },
      update: {
        role: "doctor",
        displayName: doctorSeed.displayName,
      },
      create: {
        email: doctorSeed.email,
        passwordHash,
        role: "doctor",
        displayName: doctorSeed.displayName,
      },
    });

    await prisma.doctorProfile.upsert({
      where: { userId: doctorUser.id },
      update: {
        ...doctorSeed.profile,
        avatarUrl:
          doctorSeed.profile.avatarUrl ||
          "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=1200&q=80",
      },
      create: {
        userId: doctorUser.id,
        ...doctorSeed.profile,
        avatarUrl:
          doctorSeed.profile.avatarUrl ||
          "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=1200&q=80",
      },
    });

    allDoctorUsers.push(doctorUser);
  }
  console.log(`[SEED] Hoàn tất hồ sơ bác sĩ: ${allDoctorUsers.length}`);

  // Lấy danh sách profile để tạo slot làm việc mẫu cho từng bác sĩ.
  const doctorProfiles = await prisma.doctorProfile.findMany({
    where: { userId: { in: allDoctorUsers.map((user) => user.id) } },
    select: { id: true },
  });
  console.log(`[SEED] Số profile bác sĩ sẽ tạo slot: ${doctorProfiles.length}`);

  const now = new Date();
  const baseHour = 8;
  let createdOrUpdatedSlots = 0;

  // Tạo 4 slot/ngày trong 7 ngày tới cho mỗi bác sĩ.
  for (const profile of doctorProfiles) {
    console.log(`[SEED] -> Tạo slot cho doctorProfileId=${profile.id}`);
    for (let dayOffset = 1; dayOffset <= 7; dayOffset += 1) {
      for (let shift = 0; shift < 4; shift += 1) {
        const startAt = new Date(now);
        startAt.setDate(now.getDate() + dayOffset);
        startAt.setHours(baseHour + shift * 2, 0, 0, 0);

        const endAt = new Date(startAt);
        endAt.setHours(startAt.getHours() + 1);

        await prisma.doctorSlot.upsert({
          where: {
            doctorId_startAt_endAt: {
              doctorId: profile.id,
              startAt,
              endAt,
            },
          },
          update: {
            isActive: true,
          },
          create: {
            doctorId: profile.id,
            startAt,
            endAt,
            isActive: true,
            isBooked: false,
          },
        });
        createdOrUpdatedSlots += 1;
      }
    }
  }

  console.log(`[SEED] Hoàn tất tạo/cập nhật slot: ${createdOrUpdatedSlots}`);

  // Seed bảng plan chuẩn cho MVP.
  console.log("[SEED] Đang seed subscription plans...");
  const planSeeds = [
    {
      code: "FREE",
      name: "Free",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1581595219315-a187dd40c322?auto=format&fit=crop&w=600&q=80",
      monthlyPrice: 0,
      consultSessionQuota: 0,
      familyMemberLimit: 1,
      slaMinutes: null,
      isPriority: false,
    },
    {
      code: "PREMIUM",
      name: "Premium",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=600&q=80",
      monthlyPrice: 299000,
      consultSessionQuota: 4,
      familyMemberLimit: 2,
      slaMinutes: 30,
      isPriority: true,
    },
    {
      code: "FAMILY",
      name: "Family",
      thumbnailUrl:
        "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80",
      monthlyPrice: 799000,
      consultSessionQuota: 12,
      familyMemberLimit: 6,
      slaMinutes: 15,
      isPriority: true,
    },
  ];

  for (const plan of planSeeds) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        thumbnailUrl: plan.thumbnailUrl,
        monthlyPrice: plan.monthlyPrice,
        consultSessionQuota: plan.consultSessionQuota,
        familyMemberLimit: plan.familyMemberLimit,
        slaMinutes: plan.slaMinutes,
        isPriority: plan.isPriority,
        isActive: true,
      },
      create: {
        ...plan,
        isActive: true,
      },
    });
  }
  console.log("[SEED] Hoàn tất subscription plans.");

  const patientDemo = upsertedUsers.find((item) => item.email === "patient.demo@picyourdoc.local");
  const premiumPlan = await prisma.subscriptionPlan.findUnique({
    where: { code: "PREMIUM" },
  });

  if (patientDemo && premiumPlan) {
    // Seed subscription active cho patient demo để test luồng consult không bị chặn quota.
    await prisma.userSubscription.updateMany({
      where: {
        userId: patientDemo.id,
        status: "ACTIVE",
      },
      data: {
        status: "EXPIRED",
        autoRenew: false,
      },
    });

    const startedAt = new Date();
    const endsAt = new Date(startedAt);
    endsAt.setUTCMonth(endsAt.getUTCMonth() + 1);

    const activeSubscription = await prisma.userSubscription.create({
      data: {
        userId: patientDemo.id,
        planId: premiumPlan.id,
        status: "ACTIVE",
        startedAt,
        endsAt,
        autoRenew: true,
      },
    });

    await prisma.usageCounterMonthly.upsert({
      where: {
        userSubscriptionId_monthKey: {
          userSubscriptionId: activeSubscription.id,
          monthKey: toMonthKey(startedAt),
        },
      },
      update: {},
      create: {
        userSubscriptionId: activeSubscription.id,
        monthKey: toMonthKey(startedAt),
        consultSessionsUsed: 0,
      },
    });
  }

  if (patientDemo) {
    // Seed family profile + primary member để test records/timeline.
    const familyProfile = await prisma.familyProfile.upsert({
      where: { ownerUserId: patientDemo.id },
      update: {
        name: "Gia đình Patient Demo",
      },
      create: {
        ownerUserId: patientDemo.id,
        name: "Gia đình Patient Demo",
      },
    });

    const existingPrimary = await prisma.familyMember.findFirst({
      where: {
        familyProfileId: familyProfile.id,
        isPrimary: true,
      },
    });

    if (!existingPrimary) {
      await prisma.familyMember.create({
        data: {
          familyProfileId: familyProfile.id,
          fullName: "Patient Demo",
          avatarUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
          relation: "SELF",
          gender: "OTHER",
          isPrimary: true,
        },
      });
    } else {
      await prisma.familyMember.update({
        where: { id: existingPrimary.id },
        data: {
          avatarUrl:
            existingPrimary.avatarUrl ||
            "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
        },
      });
    }
  }

  console.log("[SEED] Seed dữ liệu thành công.");
}

main()
  .then(async () => {
    console.log("[SEED] Đóng kết nối Prisma...");
    await prisma.$disconnect();
    console.log("[SEED] Kết thúc.");
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
