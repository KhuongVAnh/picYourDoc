const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Seed dữ liệu nền cho user, doctor profile và slot mẫu trong 7 ngày.
async function main() {
  console.log("[SEED] Bắt đầu chạy seed dữ liệu...");

  const defaultUsers = [
    {
      email: "patient.demo@picyourdoc.local",
      password: "Patient@123",
      role: "patient",
    },
    {
      email: "doctor.demo@picyourdoc.local",
      password: "Doctor@123",
      role: "doctor",
    },
    {
      email: "admin.demo@picyourdoc.local",
      password: "Admin@123",
      role: "admin",
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
      update: {},
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
    upsertedUsers.push(savedUser);
  }
  console.log(`[SEED] Hoàn tất user nền tảng: ${upsertedUsers.length}`);

  const demoDoctors = [
    {
      email: "doctor.01@picyourdoc.local",
      password: "Doctor@123",
      profile: {
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
      profile: {
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
      profile: {
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
      profile: {
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
      profile: {
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
      profile: {
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
      profile: {
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
      profile: {
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
      profile: {
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
      profile: {
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
  // Seed 10 bác sĩ mẫu và hồ sơ chuyên môn tương ứng.
  console.log(`[SEED] Đang seed ${demoDoctors.length} bác sĩ mẫu...`);
  for (const doctorSeed of demoDoctors) {
    console.log(`[SEED] -> Upsert doctor user/profile: ${doctorSeed.email}`);
    const passwordHash = await bcrypt.hash(doctorSeed.password, 10);
    const doctorUser = await prisma.user.upsert({
      where: { email: doctorSeed.email },
      update: { role: "doctor" },
      create: {
        email: doctorSeed.email,
        passwordHash,
        role: "doctor",
      },
    });

    await prisma.doctorProfile.upsert({
      where: { userId: doctorUser.id },
      update: {
        ...doctorSeed.profile,
      },
      create: {
        userId: doctorUser.id,
        ...doctorSeed.profile,
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
