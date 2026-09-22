const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.pegawai.findFirst({ where: { id: 1 } });
  console.log(JSON.stringify({ id: p.id, nama: p.nama, jabatan: p.jabatan, divisi: p.divisi }));
  await prisma.$disconnect();
}
main();
