# API Configuration Guide

Aplikasi ini mendukung 3 mode koneksi data:

## 1. **Direct Firebase (Default)**
```bash
# Tidak perlu environment variable
# Data langsung dari Firebase Firestore
```

## 2. **Firebase API Server**
```bash
# URL akan diambil otomatis dari GitHub
# https://github.com/ItzGirin24/abbskp/blob/main/laptop.txt
VITE_USE_FIREBASE_API=true
VITE_USE_MARIADB=false

# Fallback jika GitHub tidak bisa diakses:
# VITE_API_BASE_URL=http://localhost:5001/api
```

## 3. **MariaDB API Server**
```bash
# Gunakan MariaDB server
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_FIREBASE_API=false
VITE_USE_MARIADB=true
```

## Setup Environment

1. **Copy file environment:**
```bash
cp .env.example .env
```

2. **Edit `.env` sesuai kebutuhan**

3. **Restart development server:**
```bash
npm run dev
```

## Data Migration

### Migrasi dari Firestore ke Ngrok API

Jika Anda sudah memiliki data di Firestore dan ingin memindahkannya ke server ngrok:

1. **Akses halaman migrasi** (admin only):
   ```
   http://localhost:3000/migrasi
   ```

2. **Klik "Start Migration"** untuk memindahkan semua data:
   - Students (siswa)
   - Permissions (izin laptop)
   - Confiscations (sita laptop)
   - Collection History (riwayat pengumpulan)

3. **Verifikasi hasil** dengan klik "Verify Data"

### Auto URL Configuration

URL ngrok diambil otomatis dari:
```
https://raw.githubusercontent.com/ItzGirin24/abbskp/main/laptop.txt
```

## Testing

### Test Direct Firebase:
```bash
# Hapus semua VITE_USE_* variables atau set false
```

### Test Firebase API:
```bash
# Jalankan server Firebase terlebih dahulu
node server-ngrok.js

# Frontend otomatis baca URL dari GitHub
VITE_USE_FIREBASE_API=true
```

### Test MariaDB API:
```bash
# Jalankan server MariaDB terlebih dahulu
node server-mariadb.js

# Set environment variables
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_MARIADB=true
```

## Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Add student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Permissions
- `GET /api/permissions` - Get all permissions
- `POST /api/permissions` - Add permission
- `PUT /api/permissions/:id` - Update permission
- `DELETE /api/permissions/:id` - Delete permission

### Confiscations
- `GET /api/confiscations` - Get all confiscations
- `POST /api/confiscations` - Add confiscation
- `PUT /api/confiscations/:id` - Update confiscation
- `DELETE /api/confiscations/:id` - Delete confiscation

### Collection History
- `GET /api/collection-history` - Get all history
- `POST /api/collection-history` - Add history
- `DELETE /api/collection-history/:id` - Delete history
