# Buku Panduan Handover — Backend Bensin Monitoring

Dokumen ini ditujukan untuk pengembang yang akan melanjutkan pengembangan dan pemeliharaan aplikasi Backend Bensin Monitoring. Bacalah dokumen ini dengan saksama sebelum memulai.

---

## Daftar Isi

1. [Tentang Aplikasi](#1-tentang-aplikasi)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [Alur Data](#3-alur-data)
4. [Repository Pattern](#4-repository-pattern)
5. [Error Handling](#5-error-handling)
6. [API Endpoints](#6-api-endpoints)
7. [Keamanan](#7-keamanan)
8. [Export Excel](#8-export-excel)
9. [Panduan Pengembangan](#9-panduan-pengembangan)
10. [Menambahkan Fitur Baru](#10-menambahkan-fitur-baru)
11. [Catatan Penting](#11-catatan-penting)

---

## 1. Tentang Aplikasi

Aplikasi **Bensin Monitoring** adalah sistem untuk memantau dan mencatat penggunaan bahan bakar kendaraan operasional di PT. Telkom Akses Binjai. Fitur utama meliputi:

- **Manajemen Pegawai** — CRUD data pegawai
- **Manajemen Kendaraan** — CRUD data kendaraan
- **Pencatatan Perjalanan** — Catat pemakaian BBM setiap perjalanan
- **Deteksi Fraud** — Skor & flag indikasi kecurangan otomatis
- **Dashboard** — Ringkasan data dan statistik
- **Export Excel** — Laporan dalam format spreadsheet

**Tech Stack:**

| Teknologi | Versi | Fungsi |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express.js | 5.x | Web framework |
| Prisma ORM | 7.x | Database ORM |
| MariaDB/MySQL | 10.6+ | Database |
| ExcelJS | 4.x | Generate file Excel |
| Zod | 4.x | Validasi input |
| JWT | — | Autentikasi (cadangan) |
| bcrypt | — | Hashing password |

---

## 2. Arsitektur Aplikasi

Aplikasi menggunakan arsitektur **Layered Architecture** dengan pola **Repository Pattern**:

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                     │
└────────────────────┬────────────────────────────────┘
                     │  HTTP Request
                     ▼
┌─────────────────────────────────────────────────────┐
│                   index.js (Entry Point)              │
│  ├─ helmet (security headers)                        │
│  ├─ cors (CORS dari env)                             │
│  ├─ logger (request logging)                         │
│  ├─ rate-limit (200 request/15 menit)                │
│  ├─ body-parser (limit 1mb)                          │
│  └─ errorHandler (penanganan error)                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                      Routes                           │
│  /api/pegawai, /api/kendaraan, /api/perjalanan,      │
│  /api/dashboard, /api/auth, /api/export              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                   Controllers                         │
│  Handler HTTP: baca req → panggil service → kirim res│
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                    Services                           │
│  Business logic: validasi, perhitungan, fraud deteksi│
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                  Repositories                         │
│  Akses database: query Prisma, return data mentah    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Prisma Client (ORM)                      │
│  Query ke database MariaDB/MySQL                     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                   Database                            │
│  MariaDB/MySQL — database bensin_telkom              │
└──────────────────────────────────────────────────────┘
```

### Alur Request Lengkap

1. Client mengirim HTTP request ke server
2. `index.js` memproses middleware: helmet → cors → logger → rate-limit → body-parser
3. Router mengarahkan ke controller yang sesuai
4. Controller memanggil service untuk business logic
5. Service memanggil repository untuk query database
6. Repository menjalankan query melalui Prisma Client
7. Data dikembalikan ke service, lalu ke controller
8. Controller mengirim response JSON ke client
9. Jika terjadi error, langsung ditangani oleh `errorHandler`

---

## 3. Alur Data

### 3.1. Diagram Database

```
┌─────────────┐     ┌────────────────┐     ┌──────────────┐
│   Pegawai   │     │  Perjalanan    │     │  Kendaraan   │
├─────────────┤     ├────────────────┤     ├──────────────┤
│ id (PK)     │◄────│ pegawai_id (FK)│────►│ id (PK)      │
│ nama        │     │ kendaraan_id   │     │ plat_nomor   │
│ jabatan     │     │ tanggal        │     │ merk         │
│ divisi      │     │ tujuan         │     │ jenis        │
│ no_hp       │     │ uraian         │     │ tahun        │
│ created_at  │     │ km_lama        │     │ created_at   │
│ updated_at  │     │ km_baru        │     │ updated_at   │
│ deleted_at  │     │ jarak          │     │ deleted_at   │
└─────────────┘     │ vol_liter      │     └──────────────┘
                    │ harga_per_liter│
                    │ jumlah_biaya   │
                    │ no_bon         │
                    │ foto_bon       │
                    │ efisiensi      │
                    │ status_efisiensi│
                    │ status_reason  │
                    │ fraud_score    │
                    │ fraud_flags    │
                    │ created_at     │
                    │ updated_at     │
                    │ deleted_at     │
                    └────────────────┘
```

### 3.2. Relasi

- **Pegawai → Perjalanan:** One-to-Many (seorang pegawai bisa memiliki banyak perjalanan)
- **Kendaraan → Perjalanan:** One-to-Many (satu kendaraan bisa dipakai banyak perjalanan)
- Saat Pegawai atau Kendaraan dihapus, semua Perjalanan terkait akan terhapus otomatis (CASCADE)

### 3.3. Enum Status Efisiensi

| Nilai | Arti | Rentang km/L |
|---|---|---|
| `Balance` | Normal / efisien | ≥ 8 |
| `Boros` | Boros (konsumsi tinggi) | 5 – 7.99 |
| `Anomali` | Data mencurigakan | < 5 |

---

## 4. Repository Pattern

### 4.1. Filosofi

Repository pattern memisahkan logika akses database dari business logic. Keuntungan:

- **Testability** — Repository bisa di-mock saat unit testing
- **Maintainability** — Perubahan ORM cukup di satu tempat (repository)
- **Separation of Concern** — Service tidak perlu tahu detail query
- **Consistency** — Format data konsisten dari semua repository

### 4.2. Letak File Repository

Semua repository ada di `src/repositories/`:

| File | Tanggung Jawab |
|---|---|
| `pegawaiRepository.js` | CRUD pegawai |
| `kendaraanRepository.js` | CRUD kendaraan |
| `perjalananRepository.js` | CRUD perjalanan + filter, pagination |
| `authRepository.js` | Query User (auth) |

### 4.3. Contoh Penggunaan

**Repository:** (hanya query, return data mentah)

```javascript
// src/repositories/pegawaiRepository.js
async function findAll() {
  return prisma.pegawai.findMany({ where: { deletedAt: null } })
}
```

**Service:** (business logic, panggil repository)

```javascript
// src/services/pegawaiService.js
async function getAll() {
  const data = await pegawaiRepository.findAll()
  if (!data.length) throw new NotFoundError('Tidak ada pegawai')
  return data
}
```

**Controller:** (HTTP handler tipis)

```javascript
// src/controllers/pegawaiController.js
const getAll = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getAll()
  res.json({ success: true, data: result })
})
```

### 4.4. Aturan Repository

1. Repository hanya menerima parameter dan mengembalikan data mentah dari Prisma
2. Repository TIDAK boleh melempar error (kecuali error database murni)
3. Repository TIDAK boleh melakukan transformasi data
4. Setiap method repository mengembalikan Promise
5. Nama method mencerminkan operasi: `findAll`, `findById`, `create`, `update`, `remove`

---

## 5. Error Handling

### 5.1. Custom Error Classes

Semua error didefinisikan di `src/errors/ApiError.js`:

```javascript
new NotFoundError('Pegawai tidak ditemukan')   // → 404
new ValidationError('Nama harus diisi')         // → 422
new ConflictError('Email sudah terdaftar')      // → 409
new ApiError(500, 'Internal Server Error')      // → 500
```

### 5.2. Async Handler Wrapper

Semua controller harus dibungkus dengan `asyncHandler` untuk menangkap error dari async function:

```javascript
const { asyncHandler } = require('../utils/asyncHandler')

const getById = asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id)
  const data = await pegawaiService.getById(id)
  res.json({ success: true, data })
})
```

### 5.3. Response Error Format

Semua error akan dikembalikan dengan format konsisten:

```json
{
  "success": false,
  "message": "Pegawai tidak ditemukan",
  "errors": null
}
```

### 5.4. Yang Ditangani oleh Error Handler

| Situasi | Status | Handler |
|---|---|---|
| Record tidak ditemukan (P2025) | 404 | Prisma → NotFoundError |
| Validasi gagal | 422 | ValidationError |
| Duplikasi data | 409 | ConflictError |
| Error tidak dikenal | 500 | ApiError |
| Request terlalu cepat (rate-limit) | 429 | express-rate-limit |

---

## 6. API Endpoints

### 6.1. Pegawai

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/pegawai` | Semua pegawai |
| GET | `/api/pegawai/:id` | Detail pegawai |
| POST | `/api/pegawai` | Tambah pegawai |
| PUT | `/api/pegawai/:id` | Edit pegawai |
| DELETE | `/api/pegawai/:id` | Hapus pegawai (soft delete) |

### 6.2. Kendaraan

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/kendaraan` | Semua kendaraan |
| GET | `/api/kendaraan/:id` | Detail kendaraan |
| POST | `/api/kendaraan` | Tambah kendaraan |
| PUT | `/api/kendaraan/:id` | Edit kendaraan |
| DELETE | `/api/kendaraan/:id` | Hapus kendaraan (soft delete) |

### 6.3. Perjalanan

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/perjalanan` | Semua perjalanan (with pagination & filter) |
| GET | `/api/perjalanan/:id` | Detail perjalanan |
| POST | `/api/perjalanan` | Tambah perjalanan |
| PUT | `/api/perjalanan/:id` | Edit perjalanan |
| DELETE | `/api/perjalanan/:id` | Hapus perjalanan |

**Parameter filter GET `/api/perjalanan`:**

| Parameter | Contoh | Keterangan |
|---|---|---|
| `page` | `1` | Halaman (default 1) |
| `limit` | `10` | Data per halaman (default 10) |
| `pegawai_id` | `1` | Filter by pegawai |
| `kendaraan_id` | `3` | Filter by kendaraan |
| `start_date` | `2026-01-01` | Tanggal awal |
| `end_date` | `2026-12-31` | Tanggal akhir |
| `search` | `Honda` | Pencarian teks |

### 6.4. Dashboard

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/dashboard` | Statistik dashboard (total pegawai, kendaraan, perjalanan, fraud) |
| GET | `/api/dashboard/grafik` | Data grafik per bulan |
| GET | `/api/dashboard/ringkasan` | Ringkasan data hari ini |
| GET | `/api/dashboard/peringatan` | Data kendaraan dengan efisiensi mencurigakan |

### 6.5. Export

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/export/excel` | Download laporan Excel |

**Query parameter `/api/export/excel`:**

| Parameter | Wajib | Contoh |
|---|---|---|
| `start_date` | Ya | `2026-01-01` |
| `end_date` | Ya | `2026-12-31` |
| `kendaraan_id` | Tidak | `3` |

### 6.6. Auth (Cadangan)

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/login` | Login (return JWT) |

> **Catatan:** Fitur autentikasi sudah disiapkan (model User, repository, service) tetapi belum diaktifkan secara penuh di frontend. Controller auth sudah ada dan siap digunakan.

---

## 7. Keamanan

### 7.1. Security Headers (Helmet)

Aplikasi menggunakan `helmet` untuk menyetel berbagai header HTTP keamanan:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Strict-Transport-Security` (jika HTTPS)
- Dan lain-lain

### 7.2. CORS

CORS dikonfigurasi dari environment variable `CORS_ORIGIN`. Hanya domain yang tercantum yang bisa mengakses API.

### 7.3. Rate Limiting

- **200 request per 15 menit** per IP
- Jika melebihi batas, akan mendapat response 429
- Dikonfigurasi di `src/index.js`

### 7.4. Body Size Limit

Request body dibatasi maksimal **1 MB** untuk mencegah serangan DoS.

### 7.5. Soft Delete

Semua data (pegawai, kendaraan, perjalanan) menggunakan **soft delete** — data tidak benar-benar dihapus, hanya diisi kolom `deleted_at`. Ini memungkinkan pemulihan data jika terjadi kesalahan penghapusan.

---

## 8. Export Excel

### 8.1. Library

Export Excel menggunakan **ExcelJS** (`npm install exceljs`). Kode export ada di `src/services/perjalananService.js` method `exportExcel`.

### 8.2. Layout Laporan

```
┌─────────────────────────────────────────────────┐
│ BIAYA PEMBELIAN BENSIN RODA 4 OPERASIONAL ...  │ ← Row 1, Bold 16
├─────────────────────────────────────────────────┤
│ Nomor: TIF-2954/...                             │ ← Row 2, Font 12
├─────────────────────────────────────────────────┤
│ Periode: Jan 2026 - Jun 2026                    │ ← Row 3, Font 12
├─────────────────────────────────────────────────┤
│                                                 │ ← Row 4, Spacer (height 10)
├─────────────────────────────────────────────────┤
│ No │ Tgl │ Nama │ Plat │ Tujuan │ Vol │ Harga   │ ← Row 5, Header (red bg, white bold)
├─────────────────────────────────────────────────┤
│ 1  │ ... │ ...  │ ...  │ ...    │ ... │ ...    │ ← Row 6+, Data
├─────────────────────────────────────────────────┤
│ Total                                   50.000  │ ← Total row (pink bg, right align)
├─────────────────────────────────────────────────┤
│                                                 │ ← Row label (tanda tangan, jika diisi)
├─────────────────────────────────────────────────┤
│ (Nama Manager)                                  │ ← Row nama Manager
├─────────────────────────────────────────────────┤
│ (Nama Officer)                                  │ ← Row nama Officer
├─────────────────────────────────────────────────┤
│                                                 │ ← Row kosong
└─────────────────────────────────────────────────┘
│ * Dokumen ini dicetak secara otomatis dari ...   │ ← Footer (italic gray)
└──────────────────────────────────────────────────┘
```

### 8.3. Konfigurasi Signature Row

Baris tanda tangan diatur dinamis menggunakan konstanta:

```javascript
const MIN_SIGNATURE_ROW = 30  // Baris minimum untuk label & nama
let labelRow = Math.max(totalRowNum + 2, MIN_SIGNATURE_ROW)
let nameRow = labelRow + 5
```

Ini memastikan bahwa tanda tangan selalu berada di baris yang cukup ke bawah, bahkan jika jumlah data sedikit.

### 8.4. Environment untuk Export

Beberapa nilai di laporan Excel diambil dari `.env`:

```
PERJALANAN_TIF_PREFIX=TIF-2954
PERJALANAN_MANAGER_NAME=Nama Manager
PERJALANAN_OFFICER_NAME=Nama Officer
PERJALANAN_TITLE=BIAYA PEMBELIAN BENSIN ...
```

---

## 9. Panduan Pengembangan

### 9.1. Menjalankan Mode Development

```bash
npm run dev
# Menggunakan tsx watch → auto-restart saat ada perubahan file
```

### 9.2. Coding Convention

1. **Bahasa**: Kode ditulis dalam Bahasa Inggris (variable, function, comment). Khusus untuk error message dan response API menggunakan Bahasa Indonesia.
2. **Penamaan**: camelCase untuk variabel/fungsi, PascalCase untuk class, UPPER_SNAKE untuk konstanta.
3. **Format response API**:
   - Sukses: `{ success: true, data: ..., meta: ... }`
   - Gagal: `{ success: false, message: "...", errors: ... }`
4. **Error handling**: Gunakan `asyncHandler` + error classes, jangan gunakan try-catch manual di controller.
5. **BigInt**: ID menggunakan tipe `BigInt` di Prisma. Setiap kali membaca `req.params.id` yang berupa BigInt, konversi dengan `BigInt(id)`.
6. **Soft delete**: Selalu filter `deletedAt: null` di query default. Repository sudah menangani ini.

### 9.3. Menambahkan Field di Database

1. Edit `prisma/schema.prisma`
2. Jalankan `npx prisma db push`
3. Jalankan `npx prisma generate`
4. Update repository jika perlu query baru
5. Update service untuk business logic baru
6. Update controller untuk endpoint baru

### 9.4. Test API

Tool yang bisa digunakan untuk test API:
- **curl** (command line)
- **Postman** / **Bruno** (GUI)
- **Thunder Client** (VS Code extension)

---

## 10. Menambahkan Fitur Baru

Panduan langkah demi langkah untuk menambahkan fitur baru:

### 10.1. Fitur Baru dengan Model Baru

1. **Tambah model** di `prisma/schema.prisma`
2. **Generate** Prisma client: `npx prisma generate && npx prisma db push`
3. **Buat repository** di `src/repositories/namaFiturRepository.js`
4. **Buat service** di `src/services/namaFiturService.js`
5. **Buat controller** di `src/controllers/namaFiturController.js`
6. **Daftarkan route** di `src/routes/` (atau tambahkan ke router yang sudah ada)
7. **Test** dengan curl atau Postman

### 10.2. Fitur Baru tanpa Model Baru

1. **Tambah method** di repository yang sesuai
2. **Tambah business logic** di service
3. **Tambah handler** di controller
4. **Tambah route** baru

### 10.3. Template Controller

```javascript
const { asyncHandler } = require('../utils/asyncHandler')
const namaFiturService = require('../services/namaFiturService')
const { NotFoundError } = require('../errors/ApiError')

const getAll = asyncHandler(async (req, res) => {
  const result = await namaFiturService.getAll()
  if (!result.length) throw new NotFoundError('Data tidak ditemukan')
  res.json({ success: true, data: result })
})

const getById = asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id)
  const data = await namaFiturService.getById(id)
  res.json({ success: true, data })
})

const create = asyncHandler(async (req, res) => {
  const data = await namaFiturService.create(req.body)
  res.status(201).json({ success: true, data, message: 'Berhasil ditambahkan' })
})

module.exports = { getAll, getById, create }
```

### 10.4. Template Repository

```javascript
const prisma = require('../config/prisma')

async function findAll() {
  return prisma.namaModel.findMany({ where: { deletedAt: null } })
}

async function findById(id) {
  return prisma.namaModel.findFirst({ where: { id, deletedAt: null } })
}

async function create(data) {
  return prisma.namaModel.create({ data })
}

async function update(id, data) {
  return prisma.namaModel.update({ where: { id }, data })
}

async function remove(id) {
  return prisma.namaModel.update({ where: { id }, data: { deletedAt: new Date() } })
}

module.exports = { findAll, findById, create, update, remove }
```

### 10.5. Template Service

```javascript
const namaRepository = require('../repositories/namaRepository')
const { NotFoundError, ValidationError } = require('../errors/ApiError')

async function getAll() {
  return namaRepository.findAll()
}

async function getById(id) {
  const data = await namaRepository.findById(id)
  if (!data) throw new NotFoundError('Data tidak ditemukan')
  return data
}

module.exports = { getAll, getById }
```

---

## 11. Catatan Penting

### 11.1. Yang Perlu Diketahui

1. **Database dari Laravel** — Database awal dibuat oleh Laravel, jadi ada tabel sistem (`users`, `sessions`, `jobs`, `cache`, dll.) yang tidak dipakai oleh backend ini. Jangan dihapus.

2. **BigInt.toJSON** — Di `src/config/prisma.js`, ada override `BigInt.prototype.toJSON` yang mengubah BigInt menjadi string saat di-serialize ke JSON. Ini penting karena JavaScript tidak bisa merepresentasikan BigInt > 2^53 dengan aman. **Jangan hapus baris ini.**

3. **Prisma Client Path** — Prisma client di-generate ke `../generated/prisma` (bukan default `node_modules/.prisma`). Jika ada error "PrismaClient is not found", jalankan `npx prisma generate`.

4. **Validasi Zod** — Validasi request body menggunakan Zod. Schema validasi ada di `src/middlewares/validate.js`.

5. **Soft Delete** — Method `remove` di repository melakukan UPDATE (set `deleted_at`) bukan DELETE. Data bisa dipulihkan dengan mengosongkan kolom `deleted_at`.

6. **Express v5** — Aplikasi menggunakan Express versi 5. Perhatikan perbedaan dengan Express v4 (misalnya error handling async sudah built-in di v5, tetapi kita tetap menggunakan asyncHandler untuk kompatibilitas dan konsistensi).

### 11.2. Potensi Masalah

| Masalah | Penyebab | Solusi |
|---|---|---|
| `prisma.generate` error | Path output tidak sesuai | Hapus folder `generated/`, jalankan `npx prisma generate` ulang |
| CORS error di browser | `CORS_ORIGIN` tidak sesuai | Setel ke URL frontend yang tepat |
| BigInt error di response | `BigInt.prototype.toJSON` terhapus | Tambahkan kembali override di `prisma.js` |
| Database connection refused | MariaDB/MySQL tidak berjalan | Jalankan service database |
| `bcrypt` build error | Node.js version mismatch | Install `bcryptjs` sebagai alternatif |

### 11.3. Checklist Handover

- [ ] Backup database sebelum perubahan besar
- [ ] Catat semua environment variable yang digunakan
- [ ] Dokumentasikan perubahan kode di file ini
- [ ] Update `DEPLOYMENT.md` jika ada perubahan konfigurasi
- [ ] Test semua endpoint setelah perubahan

---

## Kontak Pengembang

| Peran | Nama | Kontak |
|---|---|---|
| Pengembang Magang | [Nama Pengembang] | [Email/HP] |
| Pembimbing Lapangan | [Nama Pembimbing] | [Email/HP] |

---

*Dokumen ini dibuat untuk keperluan handover project Bensin Monitoring PT. Telkom Akses Binjai.*

*Terima kasih telah melanjutkan pengembangan aplikasi ini. Semoga dokumen ini membantu Anda memahami arsitektur dan alur kerja backend.*

*"Kode yang baik adalah kode yang mudah dibaca dan dirawat oleh orang lain."*

---

*Diperbarui pada: Juli 2026*
