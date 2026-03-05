const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
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

  for (const user of defaultUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
