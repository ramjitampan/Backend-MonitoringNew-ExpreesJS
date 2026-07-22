# Panduan Deployment — Backend Bensin Monitoring

Dokumen ini menjelaskan langkah-langkah untuk menyiapkan, menjalankan, dan men-deploy backend aplikasi Bensin Monitoring.

---

## Daftar Isi

1. [Persyaratan Sistem](#1-persyaratan-sistem)
2. [Struktur Folder](#2-struktur-folder)
3. [Instalasi](#3-instalasi)
4. [Konfigurasi Environment](#4-konfigurasi-environment)
5. [Database](#5-database)
6. [Menjalankan Server](#6-menjalankan-server)
7. [Production Deployment](#7-production-deployment)
8. [Pemecahan Masalah](#8-pemecahan-masalah)

---

## 1. Persyaratan Sistem

| Komponen | Versi Minimal | Keterangan |
|---|---|---|
| Node.js | 18.x atau lebih baru | Runtime JavaScript |
| MariaDB | 10.6 atau lebih baru | Database (kompatibel dengan MySQL) |
| NPM | 9.x atau lebih baru | Package manager |
| Git | 2.x | Version control (opsional) |

> **Catatan:** Aplikasi ini menggunakan MariaDB sebagai database utama. Namun, karena menggunakan Prisma ORM, Anda dapat mengganti ke MySQL atau PostgreSQL hanya dengan mengubah konfigurasi (lihat [Panduan Handover](./HANDBOOK.md)).

---

## 2. Struktur Folder

```
backend/
├── prisma/                  # Schema database & migrasi
│   └── schema.prisma        # Definisi tabel & relasi
├── src/
│   ├── config/
│   │   ├── env.js           # Baca konfigurasi dari .env
│   │   └── prisma.js        # Inisialisasi koneksi database
│   ├── controllers/         # Handler HTTP (tipis, hanya routing response)
│   ├── errors/
│   │   └── ApiError.js      # Custom error classes
│   ├── middlewares/
│   │   ├── errorHandler.js  # Penanganan error terpusat
│   │   ├── logger.js        # Request logger
│   │   └── validate.js      # Validasi request body
│   ├── repositories/        # Layer akses database
│   ├── routes/              # Definisi endpoint API
│   ├── services/            # Business logic
│   ├── utils/
│   │   └── asyncHandler.js  # Wrapper async handler
│   └── index.js             # Entry point aplikasi
├── .env                     # Konfigurasi lingkungan
├── DEPLOYMENT.md            # Dokumen ini
├── HANDBOOK.md              # Panduan untuk developer baru
└── package.json
```

---

## 3. Instalasi

Langkah-langkah untuk menyiapkan backend di lingkungan baru:

```bash
# 1. Clone atau salin project ke server
git clone <url-repository> backend
cd backend

# 2. Install semua dependensi
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. (Opsional) Jalankan migrasi database
npx prisma db push
```

> Jika Anda menggunakan database yang sudah ada (Laravel migration), cukup jalankan `npx prisma generate` dan `npx prisma db pull` untuk menarik skema yang sudah ada.

---

## 4. Konfigurasi Environment

Salin file `.env` yang sudah disediakan. Berikut penjelasan setiap variabel:

| Variabel | Wajib | Default | Deskripsi |
|---|---|---|---|
| `DATABASE_URL` | Ya | — | URL koneksi database untuk Prisma |
| `DB_HOST` | Ya | `127.0.0.1` | Host database |
| `DB_PORT` | Ya | `3306` | Port database |
| `DB_USER` | Ya | `root` | User database |
| `DB_PASSWORD` | Tidak | `""` | Password database |
| `DB_NAME` | Ya | `bensin_telkom` | Nama database |
| `PORT` | Tidak | `5000` | Port server API |
| `CORS_ORIGIN` | Ya | `http://localhost:5173` | Domain frontend yang diizinkan |
| `PERJALANAN_TIF_PREFIX` | Tidak | `TIF-2954` | Prefix nomor surat |
| `PERJALANAN_MANAGER_NAME` | Tidak | `Nama Manager` | Nama manager di laporan Excel |
| `PERJALANAN_OFFICER_NAME` | Tidak | `Nama Officer` | Nama officer di laporan Excel |
| `PERJALANAN_TITLE` | Tidak | — | Judul laporan Excel |

**Contoh .env untuk production:**

```env
DATABASE_URL="mysql://root@192.168.1.100:3306/bensin_telkom"
DB_HOST=192.168.1.100
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bensin_telkom

PORT=5000
CORS_ORIGIN=http://dashboard.perusahaan.com

PERJALANAN_TIF_PREFIX=TIF-2954
PERJALANAN_MANAGER_NAME=Nama Manager
PERJALANAN_OFFICER_NAME=Nama Officer
PERJALANAN_TITLE=BIAYA PEMBELIAN BENSIN RODA 4 OPERASIONAL PEKERJAAN NODE B, GAMAS DAN MTEL LOKASI BINJAI
```

---

## 5. Database

### 5.1. Menggunakan Database yang Sudah Ada (Laravel)

Aplikasi ini didesain kompatibel dengan database yang dibuat oleh Laravel. Jika Anda sudah memiliki database dari sistem sebelumnya:

```bash
# Tarik skema dari database yang sudah ada
npx prisma db pull

# Generate Prisma client
npx prisma generate
```

### 5.2. Migrasi dari Awal (Database Baru)

```bash
# Push skema ke database (buat tabel baru)
npx prisma db push
```

### 5.3. Melihat Data di Database

```bash
# Buka Prisma Studio (GUI untuk melihat data)
npx prisma studio
```

---

## 6. Menjalankan Server

### 6.1. Mode Pengembangan (Development)

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000` dan otomatis restart saat ada perubahan kode.

### 6.2. Mode Produksi (Production)

```bash
npm start
```

### 6.3. Verifikasi Server Berjalan

```bash
curl http://localhost:5000/
# Output: {"message":"Bensin Monitoring API"}
```

### 6.4. Cek Endpoint API

```bash
# Cek pegawai
curl http://localhost:5000/api/pegawai

# Cek kendaraan
curl http://localhost:5000/api/kendaraan

# Cek perjalanan
curl http://localhost:5000/api/perjalanan

# Cek dashboard
curl http://localhost:5000/api/dashboard
```

---

## 7. Production Deployment

### 7.1. Menggunakan Process Manager (PM2)

PM2 direkomendasikan untuk menjaga server tetap berjalan di production.

```bash
# Install PM2 global
npm install -g pm2

# Jalankan backend dengan PM2
pm2 start npm --name "bensin-api" -- start

# Simpan konfigurasi PM2 agar auto-restart saat reboot
pm2 save
pm2 startup
```

### 7.2. Menggunakan Nginx sebagai Reverse Proxy (Opsional)

```nginx
server {
    listen 80;
    server_name api.perusahaan.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.3. Checklist Sebelum Deployment

- [ ] Ubah `CORS_ORIGIN` ke domain frontend yang sesuai
- [ ] Ubah `PERJALANAN_MANAGER_NAME` dan `PERJALANAN_OFFICER_NAME`
- [ ] Pastikan kredensial database aman
- [ ] Nonaktifkan debug mode jika ada
- [ ] Gunakan PM2 atau systemd untuk auto-restart

---

## 8. Pemecahan Masalah

### Server tidak bisa start

```bash
# Cek error
npm start 2>&1

# Pastikan database berjalan
mysqladmin ping -h 127.0.0.1 -u root

# Pastikan .env sudah benar
cat .env
```

### Database connection failed

```bash
# Cek kredensial database
# Pastikan DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME benar

# Cek apakah MariaDB/MySQL berjalan
netstat -an | findstr 3306
```

### CORS error di frontend

Pastikan `CORS_ORIGIN` di `.env` sama persis dengan URL frontend (termasuk port jika berbeda).

```env
CORS_ORIGIN=http://localhost:5173
# atau jika sudah production:
CORS_ORIGIN=https://dashboard.perusahaan.com
```

### Error "P2025" (Record not found)

Error ini normal terjadi ketika data yang diminta tidak ditemukan. Aplikasi sudah menangani ini dengan response 404 yang sesuai.

---

## Kontak & Dukungan

Jika mengalami kendala teknis, silakan hubungi tim pengembang atau buka issue di repository project.

---

*Dokumen ini diperbarui pada: Juli 2026*
