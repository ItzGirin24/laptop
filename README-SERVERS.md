# Laptop Collection System - Server Setup

Sistem ini sekarang memiliki **2 server terpisah** untuk kebutuhan yang berbeda:

## 📋 **Server Overview**

### 1. **Server Ngrok + Firebase** (`server-ngrok.js`)
- **Port**: 5001
- **Database**: Firebase Firestore (remote)
- **Kegunaan**: Server remote yang diakses via ngrok untuk sinkronisasi data
- **Fitur**: Full CRUD operations dengan Firebase

### 2. **Server MariaDB Local** (`server-mariadb.js`)
- **Port**: 5000
- **Database**: MariaDB (local)
- **Kegunaan**: Server lokal untuk operasi database lokal
- **Fitur**: Full CRUD operations dengan MariaDB + manual sync

## 🚀 **Cara Menjalankan**

### **Persiapan Environment**

Pastikan file `.env` sudah dikonfigurasi dengan benar:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=laptop_collection

# Firebase Configuration
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----
"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url

# Server Configuration
PORT=5000
```

### **Menjalankan Server Ngrok + Firebase**

```bash
# Terminal 1 - Server Remote (Firebase)
node server-ngrok.js
```

Server akan berjalan di: `http://localhost:5001`

### **Menjalankan Server MariaDB Local**

```bash
# Terminal 2 - Server Local (MariaDB)
node server-mariadb.js
```

Server akan berjalan di: `http://localhost:5000`

## 🔄 **Sinkronisasi Data**

### **Manual Sync** (dari MariaDB ke Firebase)

Untuk menyinkronkan data dari server lokal ke server remote:

```bash
# Kirim request POST ke endpoint sync
curl -X POST http://localhost:5000/api/sync
```

### **Automatic Sync** (hanya di server gabungan)

Server gabungan (`server.js`) memiliki auto-sync setiap 5 menit. Untuk server terpisah, sync harus dilakukan manual.

## 📊 **API Endpoints**

Kedua server memiliki endpoint yang sama:

### **Students**
- `GET /api/students` - Ambil semua siswa
- `POST /api/students` - Tambah siswa baru
- `PUT /api/students/:id` - Update siswa
- `DELETE /api/students/:id` - Hapus siswa

### **Permissions**
- `GET /api/permissions` - Ambil semua izin
- `POST /api/permissions` - Tambah izin baru
- `DELETE /api/permissions/:id` - Hapus izin

### **Confiscations**
- `GET /api/confiscations` - Ambil semua penyitaan
- `POST /api/confiscations` - Tambah penyitaan baru
- `PUT /api/confiscations/:id` - Update penyitaan
- `DELETE /api/confiscations/:id` - Hapus penyitaan

### **Collection History**
- `GET /api/collection-history` - Ambil riwayat pengumpulan
- `POST /api/collection-history` - Tambah riwayat baru
- `DELETE /api/collection-history/:id` - Hapus riwayat

### **Bulk Operations**
- `POST /api/students/bulk-update-status` - Update status banyak siswa
- `POST /api/students/bulk-import` - Import banyak siswa

### **Utilities**
- `GET /api/health` - Health check
- `POST /api/sync` - Manual sync (hanya di MariaDB server)

## 🏗️ **Arsitektur Sistem**

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│  Load Balancer  │
│   (React)       │    │                 │
└─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
        │ MariaDB      │ │ Ngrok       │ │ Firebase  │
        │ Local Server │ │ Tunnel      │ │ Remote DB │
        │ Port 5000    │ │              │ │          │
        └──────────────┘ └─────────────┘ └──────────┘
                │                       │
                └───────────────────────┘
                      Manual Sync
```

## 🔧 **Development vs Production**

### **Development**
- Jalankan kedua server secara terpisah
- Frontend connect ke `localhost:5000` (MariaDB)
- Gunakan ngrok untuk expose server Firebase

### **Production**
- Deploy server Firebase ke cloud
- Deploy server MariaDB ke server lokal
- Konfigurasi CORS dan security sesuai kebutuhan

## 📝 **Catatan**

1. **Server `server.js` asli** masih ada untuk backward compatibility
2. **Environment variables** harus sama untuk kedua server
3. **Database schema** harus sama antara MariaDB dan Firebase
4. **Sync manual** diperlukan untuk menjaga konsistensi data

## 🐛 **Troubleshooting**

### **Port Conflict**
Jika ada konflik port, ubah PORT di environment atau kode server.

### **Database Connection**
Pastikan MariaDB service sedang berjalan dan credentials benar.

### **Firebase Config**
Pastikan private key Firebase dalam format PEM yang benar (dengan newline, bukan `\n` literal).
