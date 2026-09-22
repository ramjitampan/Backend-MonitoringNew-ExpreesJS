import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Prisma } from "../generated/prisma/client.ts";

const adapter = new PrismaMariaDb({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "tesweabsite",
  connectionLimit: 5,
});

const db = new PrismaClient({ adapter });

function rnd(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function pad(n) { return String(n).padStart(2, "0"); }

const tujuanList = [
  "Kantor Telkom Binjai", "Plasa Telkom Binjai", "Gudang Operasional Binjai",
  "Kantor Telkom Medan", "Plasa Telkom Medan", "Gudang Operasional Medan",
  "Site Node B Stabat", "Site Node B Tanjung Pura", "Site Node B Kuala",
  "Site Node B Lubuk Pakam", "Site Node B Deli Tua", "Site Node B Sunggal",
  "Gamas Binjai", "Gamas Medan", "Gamas Stabat",
  "MTEL Binjai", "MTEL Medan", "MTEL Deli Serdang",
  "Pertamina Binjai", "Pertamina Medan", "Pertamina Stabat",
  "SPBU Binjai Kota", "SPBU Medan Amplas", "SPBU Lubuk Pakam",
  "Kantor Kecamatan Binjai", "Kantor Kecamatan Medan Sunggal",
  "Pool Kendaraan Binjai", "Pool Kendaraan Medan",
  "Workshop Mitra Binjai", "Workshop Mitra Medan",
];

const uraianList = [null, "Pengisian BBM rutin", "Perjalanan dinas", "Monitoring site", "Pengantaran logistik", "Perawatan berkala", "Inspeksi lapangan", "Koordinasi proyek"];

async function seed() {
  console.log("Mulai seeding...");

  // ── PEGAWAI (32) ──
  const namaPegawai = [
    "Ahmad Fauzi", "Budi Santoso", "Citra Dewi", "Dedi Irwansyah",
    "Eka Putri", "Fajar Ramadhan", "Gita Puspitasari", "Hendra Gunawan",
    "Indah Permata", "Joko Susilo", "Kartika Sari", "Lukman Hakim",
    "Maya Anggraini", "Nurdin Syahputra", "Olivia Sinaga", "Pramono Adi",
    "Ratna Sari Dewi", "Rizky Pratama", "Siti Khadijah", "Taufik Hidayat",
    "Umi Kalsum", "Vega Ardiansyah", "Wawan Setiawan", "Yanti Purnama",
    "Zulkifli Nasution", "Andi Pratama", "Bella Aprilia", "Candra Wijaya",
    "Dian Permata Sari", "Eko Prasetyo", "Fitriani Lubis", "Gilang Ramadhan",
  ];
  const jabatan = ["Staff", "Driver", "Koordinator", "Supervisor", "Kepala Unit"];
  const divisi = ["Operasional", "Logistik", "Teknik", "Umum", "Transportasi"];

  const pegawais = namaPegawai.map((nama, i) => ({
    nama,
    jabatan: jabatan[i % jabatan.length],
    divisi: divisi[i % divisi.length],
    noHp: `0812${String(10000000 + i).slice(0, 8)}`,
  }));
  await db.pegawai.createMany({ data: pegawais });
  console.log(`✓ ${pegawais.length} pegawai`);

  // ── KENDARAAN (11 R4) ──
  const kendaraans = [
    { platNomor: "BK 1000 ABC", merk: "Toyota Avanza", jenis: "R4", tahun: 2020 },
    { platNomor: "BK 1001 DEF", merk: "Daihatsu Xenia", jenis: "R4", tahun: 2021 },
    { platNomor: "BK 1002 GHI", merk: "Suzuki Carry", jenis: "R4", tahun: 2019 },
    { platNomor: "BK 1003 JKL", merk: "Mitsubishi L300", jenis: "R4", tahun: 2022 },
    { platNomor: "BK 1004 MNO", merk: "Toyota Innova", jenis: "R4", tahun: 2020 },
    { platNomor: "BK 1005 PQR", merk: "Daihatsu GranMax", jenis: "R4", tahun: 2021 },
    { platNomor: "BK 1006 STU", merk: "Suzuki APV", jenis: "R4", tahun: 2018 },
    { platNomor: "BK 1007 VWX", merk: "Isuzu Traga", jenis: "R4", tahun: 2023 },
    { platNomor: "BK 1008 YZA", merk: "Honda Mobilio", jenis: "R4", tahun: 2022 },
    { platNomor: "BK 1009 BCD", merk: "Toyota Hilux", jenis: "R4", tahun: 2021 },
    { platNomor: "BK 1010 EFG", merk: "Daihatsu Terios", jenis: "R4", tahun: 2022 },
  ];
  await db.kendaraan.createMany({ data: kendaraans });
  console.log(`✓ ${kendaraans.length} kendaraan`);

  // ── PERJALANAN ──
  const perjalanans = [];
  let noBonCounter = 1;

  function generateTrips(bulan, tahun, count) {
    for (let i = 0; i < count; i++) {
      const hari = Math.floor(Math.random() * 25) + 1;
      const tanggal = `${tahun}-${pad(bulan)}-${pad(hari)}`;
      const pegawaiId = BigInt(Math.floor(Math.random() * 32) + 1);
      const kendaraanId = BigInt(Math.floor(Math.random() * 11) + 1);
      const tujuan = tujuanList[Math.floor(Math.random() * tujuanList.length)];
      const uraian = uraianList[Math.floor(Math.random() * uraianList.length)];
      const kmLama = rnd(1000, 80000);
      const jarak = rnd(5, 200);
      const kmBaru = kmLama + jarak;
      const hargaPerLiter = rnd(12000, 15400);
      const efisiensi = rnd(5, 14);
      const volLiter = rnd(1, Math.round(jarak / 5 * 100) / 100);
      const jumlahBiaya = rnd(volLiter * hargaPerLiter * 0.9, volLiter * hargaPerLiter * 1.1);

      let statusEfisiensi;
      if (efisiensi >= 8) statusEfisiensi = "Balance";
      else if (efisiensi >= 5) statusEfisiensi = "Boros";
      else statusEfisiensi = "Anomali";

      const noBon = `BN/${tahun}/${pad(bulan)}/${String(noBonCounter++).padStart(4, "0")}`;

      perjalanans.push({
        pegawaiId,
        kendaraanId,
        tanggal: new Date(tanggal),
        tujuan,
        uraian,
        kmLama: new Prisma.Decimal(kmLama),
        kmBaru: new Prisma.Decimal(kmBaru),
        jarak: new Prisma.Decimal(jarak),
        volLiter: new Prisma.Decimal(volLiter),
        hargaPerLiter: new Prisma.Decimal(hargaPerLiter),
        jumlahBiaya: new Prisma.Decimal(jumlahBiaya),
        noBon,
        fotoBon: null,
        efisiensi: new Prisma.Decimal(efisiensi),
        statusEfisiensi,
        statusReason: null,
        fraudScore: 0,
        fraudFlags: Prisma.JsonNull,
      });
    }
  }

  generateTrips(12, 2025, 35);
  for (let m = 1; m <= 12; m++) {
    const count = m === 12 ? 35 : Math.floor(Math.random() * 16) + 55;
    generateTrips(m, 2026, count);
  }

  for (let i = 0; i < perjalanans.length; i += 50) {
    const batch = perjalanans.slice(i, i + 50);
    await db.perjalanan.createMany({ data: batch });
  }
  console.log(`✓ ${perjalanans.length} perjalanan`);

  console.log("\n✅ Seeding selesai!");
  console.log(`  Pegawai: ${pegawais.length}`);
  console.log(`  Kendaraan: ${kendaraans.length}`);
  console.log(`  Perjalanan: ${perjalanans.length}`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
