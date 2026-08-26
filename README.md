# QRISGate — QRIS Payment Gateway System

Sistem gateway pembayaran QRIS lengkap dengan dashboard web, backend API, dan aplikasi Android native.

## 📁 Struktur Project

```
qrisgate-fullstack/
├── src/                  # Dashboard Web (React + Vite)
│   ├── App.tsx           # Main dashboard UI
│   ├── Invoice.tsx       # Invoice/struk generator
│   └── ...
├── backend/              # Backend API (Node.js + Express)
│   ├── server.js         # Main API server
│   ├── settings.js       # Configuration
│   └── ...
├── mobile/               # Aplikasi Android (React Native / Expo)
│   ├── android/          # Native Android code (Notification Listener)
│   ├── App.js            # Main React Native UI
│   └── ...
├── index.html            # Vite entry point
├── package.json          # Dashboard dependencies
└── vite.config.ts        # Vite configuration
```

## 🚀 Deploy Dashboard ke Vercel

1. Push repo ini ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import project
3. Framework: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy!

## 📱 Aplikasi Mobile (React Native)

Aplikasi mobile ini di-build dengan **React Native (Expo)** dan memiliki UI yang **identik dengan web dashboard**.

**Fitur Mobile:**
- 🎧 **Notification Listener (Kotlin)** — Native background service membaca notifikasi E-Wallet otomatis
- 💰 **Filter Otomatis** — Mirip MacroDroid, tapi didesain khusus mendeteksi pembayaran dari GoPay, DANA, OVO, ShopeePay, LinkAja, BCA, dll.
- ⚙️ **Webhook & API Key** — Sinkron dengan backend/dashboard (login akun yang sama)
- 📊 **UI Identik** — Dashboard penuh kontrol langsung di genggaman Anda

**Download APK:**
Silakan unduh APK rilis terbaru dari [GitHub Releases repository ini](https://github.com/SanzXtech/qrisgate-fullstack/releases).

```bash
cd backend
npm install
node server.js
```

## Fitur

### Dashboard Web
- 📊 Statistik transaksi real-time
- ⚡ Generate QRIS dinamis
- 📋 Riwayat transaksi
- 🔧 Pengaturan & integrasi API

### Aplikasi Android
- 🎧 **Notification Listener** — baca notifikasi E-Wallet otomatis
- 📊 **Dashboard WebView** — kontrol dashboard dari HP
- ⚙️ **Settings** — konfigurasi server & API key
- 🔄 **Auto-start** setelah reboot
- 💰 Deteksi pembayaran: GoPay, DANA, OVO, ShopeePay, LinkAja, BCA, BRI, Mandiri, BNI

### Backend API
- 🔐 JWT Authentication
- 📡 Webhook receiver
- 💳 QRIS generator
- 📊 Dashboard data API
