const { Prisma } = require("@prisma/client");
const { prisma } = require("../../lib/prisma");
const { parsePagination, buildMeta } = require("../../lib/pagination");

// Chuẩn hóa tham số sắp xếp danh sách bác sĩ.
function parseSort(sortBy, sortOrder) {
  const normalizedSortBy = sortBy === "fee" ? "fee" : "rating";
  const normalizedSortOrder = sortOrder === "asc" ? "asc" : "desc";
  return { normalizedSortBy, normalizedSortOrder };
}

// Chuẩn hóa danh sách bảo hiểm từ dữ liệu JSON.
function normalizeInsuranceList(jsonValue) {
  if (!jsonValue) {
    return [];
  }
  if (Array.isArray(jsonValue)) {
    return jsonValue;
  }
  return [];
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
        normalizeInsuranceList(profile.insurancesAccepted).some(
          (insurance) =>
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

module.exports = { listDoctors, getDoctorDetailById };
