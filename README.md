# Backend Bensin Monitoring - Express.js

Backend API untuk aplikasi monitoring penggunaan bahan bakar kendaraan operasional PT. Telkom Akses Binjai.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5
- **ORM:** Prisma 7
- **Database:** MariaDB / MySQL
- **Validasi:** Zod
- **Keamanan:** Helmet, CORS, Rate Limiting

## Instalasi

```bash
npm install
npx prisma generate
cp .env.example .env   # sesuaikan konfigurasi database
npm run dev
```

## Dokumentasi Lengkap

- [Panduan Deployment](./DEPLOYMENT.md)
- [Buku Handover](./HANDBOOK.md)
