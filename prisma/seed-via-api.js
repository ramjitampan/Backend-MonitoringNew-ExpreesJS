const API = "http://localhost:5000/api";

function rnd(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function pad(n) { return String(n).padStart(2, "0"); }

function rndGanjilRibuan(min, max) {
  // angka yang habis dibagi 1000 TAPI tidak habis dibagi 10000
  // contoh: 1000, 3000, 5000, 7000, 9000, 11000, 13000, ...
  const base = Math.floor(rnd(min / 1000, max / 1000)) * 1000;
  if (base % 10000 === 0) return base + 1000;
  return base;
}

const tujuanList = [
  "Kantor Telkom Binjai","Plasa Telkom Binjai","Gudang Operasional Binjai",
  "Kantor Telkom Medan","Plasa Telkom Medan","Gudang Operasional Medan",
  "Site Node B Stabat","Site Node B Tanjung Pura","Site Node B Kuala",
  "Site Node B Lubuk Pakam","Site Node B Deli Tua","Site Node B Sunggal",
  "Gamas Binjai","Gamas Medan","Gamas Stabat",
  "MTEL Binjai","MTEL Medan","MTEL Deli Serdang",
  "Pertamina Binjai","Pertamina Medan","Pertamina Stabat",
  "SPBU Binjai Kota","SPBU Medan Amplas","SPBU Lubuk Pakam",
  "Kantor Kecamatan Binjai","Kantor Kecamatan Medan Sunggal",
  "Pool Kendaraan Binjai","Pool Kendaraan Medan",
  "Workshop Mitra Binjai","Workshop Mitra Medan",
];

const uraianList = [
  "Pengisian BBM rutin","Perjalanan dinas","Monitoring site",
  "Pengantaran logistik","Perawatan berkala","Inspeksi lapangan","Koordinasi proyek",
];

let noBonCounter = 1;

function generateTrips(bulan, tahun, count) {
  const trips = [];
  for (let i = 0; i < count; i++) {
    const hari = Math.floor(Math.random() * 25) + 1;
    const tanggal = `${tahun}-${pad(bulan)}-${pad(hari)}`;
    const pegawaiId = Math.floor(Math.random() * 32) + 1;
    const kendaraanId = Math.floor(Math.random() * 11) + 1;
    const tujuan = tujuanList[Math.floor(Math.random() * tujuanList.length)];
    const uraian = uraianList[Math.floor(Math.random() * uraianList.length)];
    const kmLama = rnd(1000, 80000);
    const jarak = rnd(5, 200);
    const kmBaru = kmLama + jarak;
    const hargaPerLiter = rnd(12000, 15400);
    const volLiter = rnd(1, Math.round(jarak / 5 * 100) / 100);
    const jumlahBiaya = rndGanjilRibuan(volLiter * hargaPerLiter * 0.9, volLiter * hargaPerLiter * 1.1);
    const noBon = `BN/${tahun}/${pad(bulan)}/${String(noBonCounter++).padStart(4, "0")}`;

    trips.push({
      pegawai_id: pegawaiId,
      kendaraan_id: kendaraanId,
      tanggal,
      tujuan,
      uraian,
      km_lama: kmLama,
      km_baru: kmBaru,
      harga_per_liter: hargaPerLiter,
      jumlah_biaya: jumlahBiaya,
      no_bon: noBon,
    });
  }
  return trips;
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const allTrips = [];
  allTrips.push(...generateTrips(12, 2025, 35));
  for (let m = 1; m <= 12; m++) {
    const count = m === 12 ? 35 : Math.floor(Math.random() * 16) + 55;
    allTrips.push(...generateTrips(m, 2026, count));
  }

  console.log(`Total ${allTrips.length} perjalanan akan di-seed via API\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < allTrips.length; i++) {
    const trip = allTrips[i];
    try {
      const res = await fetch(`${API}/perjalanan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trip),
      });
      if (res.ok) {
        success++;
      } else {
        failed++;
        const err = await res.json().catch(() => ({}));
        const msg = err?.errors?.[0]?.message || err?.message || JSON.stringify(err).slice(0, 100);
        console.log(`  ✗ [${i + 1}] ${trip.tanggal} ${trip.pegawai_id} ${trip.no_bon} → ${res.status} ${msg}`);
      }
    } catch (e) {
      failed++;
      console.log(`  ✗ [${i + 1}] ${trip.tanggal} → NETWORK ERROR: ${e.message}`);
    }

    if ((i + 1) % 50 === 0 || i === allTrips.length - 1) {
      console.log(`  → ${i + 1}/${allTrips.length} (sukses: ${success}, gagal: ${failed})`);
    }

    await sleep(80);
  }

  console.log(`\n✅ Selesai!`);
  console.log(`  Sukses: ${success}`);
  console.log(`  Gagal: ${failed}`);
}

main().catch(console.error);
