import "dotenv/config";
import prisma from "../src/config/prisma.js";
import { authService } from "../src/services/authService.js";

const ADMIN_EMAIL = "admin@telkomakses.co.id";
const ADMIN_PASSWORD = "admin123";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    console.log(`Akun admin sudah ada: ${ADMIN_EMAIL}`);
    return;
  }

  const hashed = await authService.hashPassword(ADMIN_PASSWORD);

  await prisma.user.create({
    data: {
      name: "Administrator",
      email: ADMIN_EMAIL,
      password: hashed,
    },
  });

  console.log("Akun admin berhasil dibuat");
  console.log(`  Email    : ${ADMIN_EMAIL}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Gagal membuat akun admin:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
