import express from "express";
import path from "path";
import fs from "fs";
import { tmpdir } from 'os';
import { createServer as createViteServer } from "vite";

const PORT = 3000;
// Ganti dengan ini:
const PORT = 3000;
const DB_FILE = path.join(tmpdir(), "db.json");

// Tambahkan CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const DEFAULT_K_DB = {
  kas_market: 1250000,
  kas_yayasan: 5800000,
  
  santri: [
    { id_santri: "SNT-001", nama_santri: "Ahmad Rayhan", kelas: "7A - Salafiyah", barcode: "SNT992211", saldo_utama: 150000, nama_wali: "Bpk. Slamet", wa_wali: "6281234567890", limit_jajan: 25000, limit_belanja: 50000, foto_profil: "" },
    { id_santri: "SNT-002", nama_santri: "Zulfa Azzahra", kelas: "8B - Tahfidz", barcode: "SNT883311", saldo_utama: 320000, nama_wali: "Ibu Aminah", wa_wali: "6285711223344", limit_jajan: 30000, limit_belanja: 60000, foto_profil: "" },
    { id_santri: "SNT-003", nama_santri: "M. Farhan Al-Ghifari", kelas: "9A - Aliyah", barcode: "SNT774411", saldo_utama: 12000, nama_wali: "Bpk. Jaka", wa_wali: "6281987654321", limit_jajan: 20000, limit_belanja: 40000, foto_profil: "" }
  ],

  keluhan: [
    { id_keluhan: "KLH-001", nama_wali: "Bpk. Slamet", isi: "Mohon agar sabun mandi santri dipantau terus ketersediaannya di koperasi.", status: "BARU", jawaban: "" }
  ],

  laporan_perkembangan: [
    { id_laporan: "REP-001", tanggal: "2026-07-10", pengirim: "Ustadz Ahmad", tipe: "Individu", sasaran: "Ahmad Rayhan", subjek: "Kelancaran Setoran Baru", isi: "Alhamdulillah, Ahmad hari ini sangat lancar menyetorkan hafalan Juz 6.", status: "AKTIF" }
  ],

  asatidzah_kontak: [
    { id_guru: "GUR-001", nama: "Ustadz Ahmad", jabatan: "Tahfidz", no_wa: "628571234567", alamat: "Ujung Berung, Bandung", username: "ahmad.tahfidz", pass: "ahmad123", foto_profil: "" },
    { id_guru: "GUR-002", nama: "Ustadz Yusuf", jabatan: "Bahasa Arab", no_wa: "628587654321", alamat: "Cibiru, Bandung", username: "yusuf.bahasa", pass: "yusuf123", foto_profil: "" }
  ],

  kelas_list: [
    { id_kelas: "KLS-001", nama_kelas: "7A - Salafiyah", wali_kelas: "Ustadz Yusuf" },
    { id_kelas: "KLS-002", nama_kelas: "8B - Tahfidz", wali_kelas: "Ustadz Ahmad" },
    { id_kelas: "KLS-003", nama_kelas: "9A - Aliyah", wali_kelas: "Ustadz Yusuf" }
  ],

  sholat_rules: [
    { id_sholat: "SLT-001", nama: "Sholat SUBUH", tipe: "WAJIB", waktu: "04:35", toleransi: 15 },
    { id_sholat: "SLT-002", nama: "Sholat DZUHUR", tipe: "WAJIB", waktu: "12:05", toleransi: 15 },
    { id_sholat: "SLT-003", nama: "Sholat ASHAR", tipe: "WAJIB", waktu: "15:25", toleransi: 15 }
  ],

  users_manajemen: [
    { id_user: "USR-001", nama: "Ust. H. Ridwan", role: "Admin Yayasan", email: "ridwan@ponpesqu.com", username: "ridwan", pass: "ridwan123", wa_number: "62812345678" },
    { id_user: "USR-002", nama: "Ust. M. Jafar", role: "Admin Tabungan", email: "jafar@ponpesqu.com", username: "jafar", pass: "jafar123", wa_number: "62856789012" },
    { id_user: "USR-003", nama: "Ust. Ahmad", role: "Pengajar", email: "ahmad@ponpesqu.com", username: "ahmad", pass: "ahmad123", wa_number: "628571234567" },
    { id_user: "USR-004", nama: "Ummi Halimah", role: "Admin Market", email: "halimah@ponpesqu.com", username: "halimah", pass: "halimah123", wa_number: "628511223344" },
    { id_user: "USR-005", nama: "Ust. Syakir", role: "Admin Keamanan", email: "syakir@ponpesqu.com", username: "keamanan", pass: "keamanan123", wa_number: "628522334455" },
    { id_user: "USR-006", nama: "Sdr. Fatih", role: "Admin Media", email: "fatih@ponpesqu.com", username: "media", pass: "media123", wa_number: "628533445566" }
  ],

  yayasan_kas_logs: [
    { tanggal: "2026-07-09", tipe: "MASUK", nominal: 150000, keterangan: "Penerimaan Syahryah (SPP) Zulfa Azzahra" }
  ],

  market_kas_logs: [
    { tanggal: "2026-07-10", tipe: "MASUK", nominal: 250000, keterangan: "Profit Penjualan Grosir ATK" }
  ],

  transaksi_tabungan: [
    { id_transaksi: "TX-TAB-001", id_santri: "SNT-001", nama_santri: "Ahmad Rayhan", kelas: "7A - Salafiyah", tipe: "DEPOSIT", nominal: 100000, tanggal: "2026-07-09 14:15", keterangan: "Setoran tabungan saku perdana" }
  ],

  tagihan: [
    { id_tagihan: "TGH-001", id_santri: "SNT-001", nama_santri: "Ahmad Rayhan", kelas: "7A - Salafiyah", nama_tagihan: "Syahryah (SPP) Juli 2026", nominal: 150000, status_tagihan: "BELUM_BAYAR", metode_pembayaran: "-", tanggal_bayar: "-" }
  ],

  settings: {
    shop_name: "Koperasi Pesantren Darul Ma'arif",
    owner_name: "Kiai M. Hasan",
    address: "Bandung, Jawa Barat",
    phone: "6281234567890",
    bank_name: "BSI",
    bank_account: "7144028990",
    bank_owner: "YAYASAN DARUL MA'ARIF PONPESQU",
    logo_url: "",
    nama_pesantren: "PONPESQU"
  },
  absensi_kelas: [
    { tanggal: "2026-07-10", kelas: "7A - Salafiyah", id_santri: "SNT-001", status: "HADIR", locked: false },
    { tanggal: "2026-07-10", kelas: "8B - Tahfidz", id_santri: "SNT-002", status: "SAKIT", locked: false }
  ],
  absensi_sholat: [
    { tanggal: "2026-07-10", sholat: "SLT-001", id_santri: "SNT-001", status: "TEPAT_WAKTU", locked: false },
    { tanggal: "2026-07-10", sholat: "SLT-001", id_santri: "SNT-002", status: "MASBUQ", locked: false }
  ],
  perizinan: [
    { id_izin: "IZN-001", id_santri: "SNT-002", tipe: "SAKIT", tanggal_mulai: "2026-07-10", tanggal_selesai: "2026-07-12", keterangan: "Sakit demam berdarah", status: "DISETUJUI" }
  ],
  tutup_absen_kelas: {},
  tutup_absen_sholat: {},

  produk_market: [
    { id_produk: "PRD-001", nama_produk: "Suku Ultra Milk 250ml", kategori: "Minuman", harga_beli: 5200, harga_jual: 6500, stok: 45, satuan: "pcs", barcode: "899100110201", foto_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop", min_stock: 10, large_unit: "KARDUS", multiplier: 40 },
    { id_produk: "PRD-002", nama_produk: "Roti Kasur Sari Roti", kategori: "Makanan", harga_beli: 11000, harga_jual: 13500, stok: 12, satuan: "pcs", barcode: "899100110202", foto_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop", min_stock: 5, large_unit: "PACK", multiplier: 10 },
    { id_produk: "PRD-003", nama_produk: "Buku Tulis Sinar Dunia 38", kategori: "ATK", harga_beli: 3000, harga_jual: 4000, stok: 120, satuan: "pcs", barcode: "899100110203", foto_url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=150&auto=format&fit=crop", min_stock: 20, large_unit: "PACK", multiplier: 10 },
    { id_produk: "PRD-004", nama_produk: "Kitab Safinatun Najah (Saku)", kategori: "Kitab", harga_beli: 6000, harga_jual: 8500, stok: 15, satuan: "pcs", barcode: "899100110204", foto_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&auto=format&fit=crop", min_stock: 3, large_unit: "SLOP", multiplier: 10 },
    { id_produk: "PRD-005", nama_produk: "Sabun Mandi Lifebuoy", kategori: "Kebersihan", harga_beli: 3200, harga_jual: 4500, stok: 24, satuan: "pcs", barcode: "899100110205", foto_url: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=150&auto=format&fit=crop", min_stock: 5, large_unit: "DUS", multiplier: 24 }
  ],

  stok_market: [
    { id_log: "STK-0001", id_produk: "PRD-001", tipe: "MASUK", jumlah: 50, keterangan: "Kulakan Grosir Sejahtera", tanggal: "2026-07-09 08:30" },
    { id_log: "STK-0002", id_produk: "PRD-004", tipe: "MASUK", jumlah: 10, keterangan: "Pengadaan Kitab Yayasan", tanggal: "2026-07-09 09:12" }
  ],

  transaksi_market: [
    { id_transaksi: "TX-MKT-001", tanggal: "2026-07-10 10:15", id_santri: "SNT-001", nama_santri: "Ahmad Rayhan", total: 13000, profit: 2600, kas_masuk: 13000, metode_pembayaran: "TABUNGAN", items: [{ id_produk: "PRD-001", qty: 2, harga: 6500, unit: "PCS", multiplier: 1, harga_jual: 6500, harga_beli: 5200 }] }
  ],
  pelanggaran_santri: [
    { id_pelanggaran: "PLG-001", id_santri: "SNT-003", nama_santri: "M. Farhan Al-Ghifari", kelas: "9A - Aliyah", kategori: "RINGAN", detail_pelanggaran: "Terlambat mengikuti kegiatan jamaah sholat subuh.", hukuman: "Membaca Surat Al-Kahfi sebanyak 1 kali.", tanggal: "2026-07-13", dicatat_oleh: "Ust. Syakir" }
  ],
  izin_keamanan: [
    { id_izin_khusus: "IZK-001", id_santri: "SNT-001", nama_santri: "Ahmad Rayhan", kelas: "7A - Salafiyah", tipe_izin: "JAJAN", nominal_disetujui: 75000, tanggal: "2026-07-14", keterangan: "Izin membeli buku modul tambahan.", dicatat_oleh: "Ust. Syakir" }
  ],
  login_logs: [],
  homepage: {
    pesantren_name: "Pesantren Database",
    logo_url: "https://placehold.co/150x150/022c22/f59e0b?text=🕌",
    hero_title: "Database Pondok Pesantren Terpercaya",
    hero_subtitle: "Kelola data santri dengan mudah, cepat, dan akurat.",
    hero_btn_text: "Cari Data Santri",
    hero_image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=1200&auto=format&fit=crop",
    cards: [
      { title: "Pencarian Santri", description: "Cari data santri dengan cepat dan aktual.", icon: "search" },
      { title: "Profil Pesantren", description: "Informasi lengkap tentang pondok pesantren.", icon: "landmark" },
      { title: "Aman & Terpercaya", description: "Sistem yang aman dan terproteksi.", icon: "shield" }
    ],
    about_title: "Tentang Pesantren Kami",
    about_subtitle: "Membangun Generasi Islami yang Berakhlak Mulia",
    about_description: "Pesantren Al-Hikmah. Pondok pesantren kami berkomitmen untuk mendidik santri menjadi generasi yang beriman, berilmu, dan berakhlak mulia.",
    about_stats_1: "500+ Santri Aktif",
    about_stats_2: "25+ Tahun Berdiri",
    about_image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=800&auto=format&fit=crop",
    contact_address: "Bandung, Jawa Barat",
    contact_phone: "6281234567890",
    contact_email: "info@ponpesqu.com",
    news: [
      {
        id: "news-001",
        title: "Penerimaan Santri Baru Tahun Ajaran 2026/2027 Resmi Dibuka",
        content: "Pondok Pesantren kini resmi membuka pendaftaran santri baru dengan program unggulan Tahfidz Quran, Kitab Kuning, dan Madrasah Aliyah Sains. Silakan hubungi sekretariat pendaftaran untuk informasi lengkap.",
        date: "12 Juli 2026",
        category: "PENGUMUMAN",
        image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=800&auto=format&fit=crop"
      },
      {
        id: "news-002",
        title: "Pembangunan Gedung Tahfidz Putri Tahap Akhir",
        content: "Alhamdulillah, berkat dukungan para donatur dan wali santri, pembangunan asrama dan gedung kelas khusus tahfidz putri kini telah mencapai 90%. Semoga membawa berkahan besar bagi seluruh santriwati.",
        date: "10 Juli 2026",
        category: "KEGIATAN",
        image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=800&auto=format&fit=crop"
      }
    ]
  }
};

// Database handlers (Local db.json only)
function loadDBLocal() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database file, resetting to default:", error);
  }
  saveDBLocal(DEFAULT_K_DB);
  return DEFAULT_K_DB;
}

function saveDBLocal(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

async function startServer() {
  const app = express();
 // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  // Allow high limits for base64 image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // REST API endpoints
  app.get("/api/db", async (req, res) => {
    try {
      const db = loadDBLocal();
      res.json(db);
    } catch (err) {
      console.error("Error in GET /api/db:", err);
      res.status(500).json({ error: "Gagal memuat database" });
    }
  });

  app.post("/api/db/sync", async (req, res) => {
    const newDb = req.body;
    if (!newDb || typeof newDb !== "object") {
      return res.status(400).json({ error: "Invalid database state" });
    }
    try {
      saveDBLocal(newDb);
      res.json({ success: true, db: newDb });
    } catch (err) {
      console.error("Error in POST /api/db/sync:", err);
      res.status(500).json({ error: "Gagal menyimpan database" });
    }
  });

  app.post("/api/db/reset", async (req, res) => {
    try {
      saveDBLocal(DEFAULT_K_DB);
      res.json({ success: true, db: DEFAULT_K_DB });
    } catch (err) {
      console.error("Error in POST /api/db/reset:", err);
      res.status(500).json({ error: "Gagal menyetel ulang database" });
    }
  });

  app.post("/api/login-log", async (req, res) => {
    const { nama, role } = req.body;
    if (!nama || !role) {
      return res.status(400).json({ error: "Missing nama or role" });
    }
    try {
      const db = loadDBLocal();
      if (!db.login_logs) {
        db.login_logs = [];
      }
      
      const ipAddress = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();
      
      // Timestamp WIB/GMT+7
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const wibTime = new Date(utcTime + (3600000 * 7));
      const year = wibTime.getFullYear();
      const month = String(wibTime.getMonth() + 1).padStart(2, "0");
      const date = String(wibTime.getDate()).padStart(2, "0");
      const hours = String(wibTime.getHours()).padStart(2, "0");
      const minutes = String(wibTime.getMinutes()).padStart(2, "0");
      const seconds = String(wibTime.getSeconds()).padStart(2, "0");
      const dateStr = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

      const newLog = {
        id_log: "LOG-" + Date.now() + Math.random().toString(36).substring(2, 5).toUpperCase(),
        tanggal: dateStr,
        nama,
        role,
        ip_address: ipAddress
      };

      db.login_logs.push(newLog);

      if (db.login_logs.length > 500) {
        db.login_logs = db.login_logs.slice(-500);
      }

      saveDBLocal(db);
      res.json({ success: true, db });
    } catch (err) {
      console.error("Error in POST /api/login-log:", err);
      res.status(500).json({ error: "Gagal mencatat log login" });
    }
  });

  // Handle Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PONPESQU Backend] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
