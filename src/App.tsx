import React, { useState, useEffect } from 'react';
import { K_DB } from './types';
import { LoginView } from './components/LoginView';
import { KiaiPanel } from './components/KiaiPanel';
import { YayasanPanel } from './components/YayasanPanel';
import { TabunganPanel } from './components/TabunganPanel';
import { PengajarPanel } from './components/PengajarPanel';
import { WaliPanel } from './components/WaliPanel';
import { MarketPanel } from './components/MarketPanel';
import { KeamananPanel } from './components/KeamananPanel';
import { HomepageView } from './components/HomepageView';
import { MediaPanel } from './components/MediaPanel';
import { LucideIcon } from './components/LucideIcon';

export default function App() {
  const [db, setDb] = useState<K_DB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth state
  const [activeUser, setActiveUser] = useState<{ nama: string; role: string; id_santri?: string } | null>(null);
  const [currentRole, setCurrentRole] = useState<"KIAI" | "YAYASAN" | "TABUNGAN" | "PENGAJAR" | "WALI" | "MARKET" | "KEAMANAN" | "MEDIA">("KIAI");
  const [activeTab, setActiveTab] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    msg: string;
    onConfirm: (result: boolean) => void;
  }>({
    show: false,
    msg: "",
    onConfirm: () => {}
  });

  // Clock
  const [clockStr, setClockClockStr] = useState("12 Juli 2026 • 27 Muharram 1448 H");

  // Load Database on Mount
  useEffect(() => {
    fetchDb();
  }, []);

  const fetchDb = async () => {
    try {
      const res = await fetch("/api/db");
      const data = await res.json();
      
      let updatedData = { ...data };
      let changed = false;

      // Auto ensure "Admin Media" is in users_manajemen
      const hasMediaUser = data.users_manajemen?.some((u: any) => u.role === "Admin Media" || u.username === "media");
      if (!hasMediaUser && data.users_manajemen) {
        const mediaUser = {
          id_user: "USR-006",
          nama: "Sdr. Fatih",
          role: "Admin Media" as const,
          email: "fatih@ponpesqu.com",
          username: "media",
          pass: "media123",
          wa_number: "628533445566"
        };
        updatedData.users_manajemen = [...data.users_manajemen, mediaUser];
        changed = true;
      }

      if (!updatedData.homepage) {
        updatedData.homepage = {
          pesantren_name: "Pesantren Al-Hidayah",
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
          contact_email: "info@ponpesqu.com"
        };
        changed = true;
      }

      // Auto ensure default news exists
      if (updatedData.homepage && !updatedData.homepage.news) {
        updatedData.homepage.news = [
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
            content: "Alhamdulillah, berkat dukungan para donatur and wali santri, pembangunan asrama dan gedung kelas khusus tahfidz putri kini telah mencapai 90%. Semoga membawa berkahan besar bagi seluruh santriwati.",
            date: "10 Juli 2026",
            category: "KEGIATAN",
            image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=800&auto=format&fit=crop"
          }
        ];
        changed = true;
      }

      // Auto ensure default programs exist
      if (updatedData.homepage && !updatedData.homepage.programs) {
        updatedData.homepage.programs = [
          {
            id: "prog-001",
            title: "Tahfidz Al-Qur'an",
            description: "Program Tahfidz Al-Qur'an merupakan program unggulan Pondok Pesantren Al-Hidayah yang dirancang khusus untuk mencetak para penghafal Al-Qur'an yang tidak hanya unggul dalam hafalan, tetapi juga memiliki pemahaman yang mendalam tentang kandungan ayat-ayat suci serta mampu mengimplementasikannya dalam perilaku keseharian. Program ini terbuka bagi seluruh santri putra dan putri yang memiliki tekad kuat untuk menghafal dan mengamalkannya.",
            icon: "book-open"
          },
          {
            id: "prog-002",
            title: "Kitab Kuning",
            description: "Program Kajian Kitab Kuning merupakan program inti di Pondok Pesantren Al-Hidayah yang dirancang untuk membekali para santri dengan pemahaman agama yang komprehensif melalui studi kitab-kitab klasik (kitab kuning). Kitab kuning sebagai warisan intelektual ulama salaf menjadi rujukan utama dalam memahami berbagai disiplin ilmu keislaman, mulai dari fiqih, nahwu-shorof (tata bahasa Arab), hingga akhlak dan tasawuf.",
            icon: "book"
          },
          {
            id: "prog-003",
            title: "Khitobah",
            description: "Program Khitobah merupakan kegiatan rutin di Pondok Pesantren Al-Hidayah yang bertujuan melatih kemampuan public speaking santri dalam menyampaikan ceramah atau pidato. Program ini menjadi wadah bagi santri untuk mengasah keberanian, memperdalam pemahaman agama, serta mempraktikkan ilmu dakwah yang telah dipelajari. Kegiatan Khitobah dilaksanakan setiap malam hari setelah shalat Tarawih selama bulan Ramadhan.",
            icon: "mic"
          }
        ];
        changed = true;
      }

      // Auto ensure default psb_settings exists
      if (updatedData.homepage && !updatedData.homepage.psb_settings) {
        updatedData.homepage.psb_settings = {
          is_open: true,
          registration_url: "https://forms.gle/psb-online-alhidayah",
          year_academic: "2026/2027",
          quota_total: 191,
          quota_accepted: 186,
          quota_remaining: 5,
          quota_alert_text: "Peringatan! Kuota pendaftaran tersisa sedikit (5 kursi). Segera daftar sebelum kehabisan!",
          requirements_umum: [
            "Lulusan MTs/SMP atau sederajat",
            "Usia maksimal 18 tahun per 1 Juli 2026",
            "Sehat jasmani dan rohani",
            "Bersedia tinggal di asrama (mukim)",
            "Mendapat izin dari orang tua/wali",
            "Berkelakuan baik"
          ],
          requirements_khusus: [
            "Bukti diterima di MAN 1 Jembrana (surat keterangan lulus)",
            "Mampu membaca Al-Qur'an dengan baik (akan diuji saat seleksi)",
            "Hafalan minimal Juz 30 (bagian program Tahfidz)"
          ],
          documents: [
            "Fotokopi Kartu Keluarga (KK)",
            "Pas foto berwarna 3x4 (background merah)"
          ],
          steps: [
            { step_num: 1, title: "Registrasi Akun", desc: "Calon santri membuat akun di sistem pendaftaran online dengan mengisi data diri dan email aktif." },
            { step_num: 2, title: "Upload Bukti Diterima Di MAN 1 Jembrana", desc: "Upload bukti diterima di MAN 1 Jembrana (surat keterangan lulus). Admin akan memverifikasi dan memberikan nomor antrian." },
            { step_num: 3, title: "Isi Formulir Pendaftaran", desc: "Setelah mendapat nomor antrian, calon santri mengisi formulir pendaftaran lengkap dengan data pribadi, orang tua, dan program pilihan." },
            { step_num: 4, title: "Upload Berkas", desc: "Upload foto berwarna dan Kartu Keluarga (KK) dalam format yang ditentukan." },
            { step_num: 5, title: "Verifikasi Admin", desc: "Admin akan memverifikasi kelengkapan dan keabsahan data. Proses verifikasi maksimal 2x24 jam." },
            { step_num: 6, title: "Pengumuman & Download Bukti Pendaftaran", desc: "Jika dinyatakan diterima, calon santri dapat mendownload tanda bukti penerimaan." }
          ],
          contact_putra_nama: "Ust. H. Faisal",
          contact_putra_phone: "+62 857-3743-5155",
          contact_putri_nama: "Ust. Iwan Hidayat",
          contact_putri_phone: "+62 812-3540-7745",
          contact_email: "ma'had.alhidayah.jembrana@gmail.com",
          contact_hours: "Senin - Jumat: 08.00 - 15.00 WITA\nSabtu: 08.00 - 12.00 WITA"
        };
        changed = true;
      }

      if (changed) {
        setDb(updatedData);
        syncDbState(updatedData);
      } else {
        setDb(data);
      }
    } catch (err) {
      console.error("Error loading database:", err);
      showToast("Gagal memuat database dari server!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Sync state to backend (extremely responsive and persistent!)
  const syncDbState = async (updatedDb: K_DB) => {
    setDb(updatedDb); // Optimistic UI update
    try {
      const res = await fetch("/api/db/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDb)
      });
      const result = await res.json();
      if (result.success) {
        setDb(result.db);
      }
    } catch (err) {
      console.error("Error syncing state with backend:", err);
    }
  };

  // Reset database completely
  const resetDatabase = async () => {
    try {
      const res = await fetch("/api/db/reset", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setDb(result.db);
        showToast("Database berhasil disetel ulang ke bawaan asli!", "info");
      }
    } catch (err) {
      console.error("Error resetting database:", err);
      showToast("Gagal menyetel ulang database!", "error");
    }
  };

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Confirm helper
  const showConfirm = (msg: string, callback: (yes: boolean) => void) => {
    setConfirmModal({
      show: true,
      msg,
      onConfirm: (result: boolean) => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        callback(result);
      }
    });
  };

  // Login verification
  const handleLogin = async (userVal: string, passVal: string): Promise<boolean> => {
    if (!db) return false;

    const userValClean = userVal.trim().toLowerCase();
    let matchedUser = null;
    let matchedRole: "KIAI" | "YAYASAN" | "TABUNGAN" | "PENGAJAR" | "WALI" | "MARKET" | "KEAMANAN" | "MEDIA" = "KIAI";

    if (userValClean === "kiai" && passVal === (db.settings.kiai_pass || "abah123")) {
      matchedUser = { nama: db.settings.owner_name, role: "Kiai" };
      matchedRole = "KIAI";
    } else {
      // Check for Wali Santri / Student Login (e.g. username snt-001)
      const matchedSantri = db.santri.find(s => s.id_santri.toLowerCase() === userValClean);
      if (matchedSantri && passVal === "santri123") {
        matchedUser = { nama: `Wali ${matchedSantri.nama_santri}`, role: "Wali Santri", id_santri: matchedSantri.id_santri };
        matchedRole = "WALI";
      } else {
        const dbUser = db.users_manajemen.find(u => u.username.toLowerCase() === userValClean && u.pass === passVal);
        if (dbUser) {
          matchedUser = dbUser;
          if (dbUser.role === "Admin Yayasan") {
            matchedRole = "YAYASAN";
          } else if (dbUser.role === "Admin Tabungan") {
            matchedRole = "TABUNGAN";
          } else if (dbUser.role === "Pengajar") {
            matchedRole = "PENGAJAR";
          } else if (dbUser.role === "Admin Market") {
            matchedRole = "MARKET";
          } else if (dbUser.role === "Admin Keamanan") {
            matchedRole = "KEAMANAN";
          } else if (dbUser.role === "Admin Media") {
            matchedRole = "MEDIA";
          } else {
            matchedRole = "KIAI";
          }
        }
      }
    }

    if (matchedUser) {
      setActiveUser(matchedUser);
      setCurrentRole(matchedRole);
      
      // Catat log login ke server secara async
      fetch("/api/login-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: matchedUser.nama, role: matchedUser.role })
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.db) {
            setDb(result.db);
          }
        })
        .catch(err => console.error("Gagal mencatat log login:", err));
      
      // Default tabs
      if (matchedRole === "KIAI") {
        setActiveTab("kiai-dashboard");
      } else if (matchedRole === "YAYASAN") {
        setActiveTab("yayasan-dashboard");
      } else if (matchedRole === "TABUNGAN") {
        setActiveTab("tabungan-dashboard");
      } else if (matchedRole === "PENGAJAR") {
        setActiveTab("pengajar-dashboard");
      } else if (matchedRole === "WALI") {
        setActiveTab("wali-dashboard");
      } else if (matchedRole === "MARKET") {
        setActiveTab("market-dashboard");
      } else if (matchedRole === "KEAMANAN") {
        setActiveTab("keamanan-dashboard");
      } else if (matchedRole === "MEDIA") {
        setActiveTab("media-dashboard");
      }

      showToast(`Sesi login berhasil. Selamat datang ${matchedUser.nama}!`, "success");
      return true;
    } else {
      showToast("Username atau sandi akun salah!", "error");
      return false;
    }
  };

  // Logout
  const handleLogout = () => {
    showConfirm("Abah yakin ingin keluar dari sistem?", (yes) => {
      if (yes) {
        setActiveUser(null);
        setShowLogin(false);
        showToast("Sesi berhasil dikeluarkan.", "info");
      }
    });
  };

  if (isLoading || !db) {
    return (
      <div className="min-h-screen bg-[#02110e] flex flex-col items-center justify-center p-4">
        <div className="relative w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center animate-pulse">
          <span className="text-3xl">🕌</span>
        </div>
        <p className="text-xs text-emerald-500/80 mt-4 font-semibold tracking-wider uppercase font-mono">Loading {(db?.settings?.nama_pesantren || "PONPESQU").toUpperCase()} Portal...</p>
      </div>
    );
  }

  const logoUrl = db.settings.logo_url || "https://placehold.co/150x150/022c22/f59e0b?text=🕌";

  return (
    <div className="flex flex-col min-h-screen bg-[#02110e] text-white">
      
      {/* TOAST CONTAINER */}
      <div id="toast-container">
        {toasts.map(t => {
          let styleClass = "p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-3 transition-all bg-emerald-950 text-gray-100 border-emerald-900";
          let icon = "check-circle-2";
          let iconColor = "text-emerald-400";

          if (t.type === 'error') {
            styleClass = "p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-3 bg-[#1d0505] text-red-200 border-red-950";
            icon = "alert-triangle";
            iconColor = "text-red-400";
          } else if (t.type === 'info') {
            styleClass = "p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-3 bg-emerald-950 text-amber-200 border-amber-950";
            icon = "info";
            iconColor = "text-amber-400";
          }

          return (
            <div key={t.id} className={styleClass}>
              <LucideIcon name={icon} className={`w-4 h-4 ${iconColor}`} />
              <span className="flex-grow">{t.message}</span>
            </div>
          );
        })}
      </div>

      {/* CUSTOM CONFIRMATION LAYER */}
      {confirmModal.show && (
        <div id="custom-confirm-overlay" className="fixed inset-0 bg-black/75 z-[9999] flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-amber-500/20 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <LucideIcon name="help-circle" className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-100" id="confirm-modal-title">Konfirmasi Aksi</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-6">{confirmModal.msg}</p>
            <div className="flex justify-end gap-3">
              <button 
                className="px-4 py-2 bg-emerald-950/50 hover:bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold transition-all" 
                onClick={() => confirmModal.onConfirm(false)}
              >
                Batal
              </button>
              <button 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all" 
                onClick={() => confirmModal.onConfirm(true)}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DECIIDER */}
      {!activeUser ? (
        !showLogin ? (
          <HomepageView db={db} onEnterLogin={() => setShowLogin(true)} />
        ) : (
          <LoginView onLogin={handleLogin} logoUrl={logoUrl} namaPesantren={db?.settings?.nama_pesantren} onBackToHome={() => setShowLogin(false)} />
        )
      ) : (
        <div id="dashboard-view" className="flex-grow flex flex-col max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 pb-24 lg:pb-6">
          
          {/* Header Sistem */}
          {currentRole !== "MARKET" && (
            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 pb-4 border-b border-emerald-950/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-950/80 border border-emerald-500/30 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-emerald-950/50 p-0.5">
                  <img id="app-logo-img" src={logoUrl} alt="Logo Ponpesqu" className="w-full h-full object-cover rounded-lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent font-sans">
                      {(db?.settings?.nama_pesantren || "ponpesqu").toLowerCase()}
                    </h1>
                    <span id="role-badge" className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">ROLE: {activeUser.role.toUpperCase()}</span>
                  </div>
                  <p id="role-subtitle" className="text-xs text-emerald-500/70">
                    {currentRole === "KIAI" && "Panel Pengasuh Kiai & Pengasuh Utama"}
                    {currentRole === "YAYASAN" && "Sistem Keuangan & Akademik Santri"}
                    {currentRole === "TABUNGAN" && "Sistem Tabungan Cashless & Uang Saku"}
                    {currentRole === "PENGAJAR" && "Sistem Pembelajaran & Presensi Asatidzah"}
                    {currentRole === "WALI" && "Portal Informasi Wali Santri & Perkembangan Santri"}
                    {currentRole === "KEAMANAN" && "Panel Komando Kedisiplinan & Dispensasi Limit Saku"}
                    {currentRole === "MEDIA" && "Portal Media Hub & Homepage Editor"}
                  </p>
                </div>
              </div>

              {/* Detail Sesi Aktif */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <LucideIcon name="calendar" className="w-4 h-4" />
                  <span>{clockStr}</span>
                </div>

                <div className="bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                  <span className="pulse-dot"></span>
                  <span>Sesi: <strong className="text-amber-400">{activeUser.nama}</strong></span>
                </div>
                
                <button onClick={handleLogout} className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-900/40 rounded-lg text-xs text-red-400 transition-all flex items-center gap-1">
                  <LucideIcon name="log-out" className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>
            </header>
          )}

          <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SIDEBAR NAVIGATION */}
            {currentRole !== "MARKET" && (
              <aside className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto no-scrollbar lg:overflow-visible pb-2 lg:pb-0" id="sidebar-nav">
                {currentRole === "KIAI" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('kiai-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Dashboard</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-keuangan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-keuangan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="landmark" className="w-5 h-5" /> <span>Keuangan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-perkembangan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-perkembangan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="trending-up" className="w-5 h-5" /> <span>Perkembangan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-keluhan')} 
                      className={`tab-btn flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-keluhan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <LucideIcon name="message-square" className="w-5 h-5" /> <span>Keluhan Wali</span>
                      </div>
                      {db.keluhan.filter(c => c.status === "BARU").length > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'kiai-keluhan' ? 'bg-emerald-950 text-amber-400' : 'bg-red-500 text-white animate-pulse'}`}>
                          {db.keluhan.filter(c => c.status === "BARU").length}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-kontak')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-kontak' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="phone-call" className="w-5 h-5" /> <span>Kontak Staff</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-manajemen-user')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-manajemen-user' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="shield-check" className="w-5 h-5" /> <span>Manajemen User</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-login-logs')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-login-logs' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="history" className="w-5 h-5" /> <span>Riwayat Login</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('kiai-pengaturan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'kiai-pengaturan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="settings" className="w-5 h-5" /> <span>Sistem Kiai</span>
                    </button>
                  </>
                )}

                {currentRole === "YAYASAN" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('yayasan-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-santri')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-santri' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="users" className="w-5 h-5" /> <span>Data Santri</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-tagihan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-tagihan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="receipt" className="w-5 h-5" /> <span>SPP & Syahryah</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-akademik')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-akademik' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="graduation-cap" className="w-5 h-5" /> <span>Akademik/Staff</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-kas')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-kas' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="landmark" className="w-5 h-5" /> <span>Kas & Transfer</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('yayasan-kiriman')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'yayasan-kiriman' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="wallet" className="w-5 h-5" /> <span>Kiriman Santri</span>
                    </button>
                  </>
                )}

                {currentRole === "TABUNGAN" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('tabungan-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('tabungan-loket')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-loket' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="wallet" className="w-5 h-5" /> <span>Loket Kasir</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('tabungan-riwayat')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-riwayat' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="history" className="w-5 h-5" /> <span>Riwayat Mutasi</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('tabungan-limit')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'tabungan-limit' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="sliders" className="w-5 h-5" /> <span>Limit Jajan</span>
                    </button>
                  </>
                )}

                {currentRole === "PENGAJAR" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('pengajar-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-absensikelas')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-absensikelas' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="scan" className="w-5 h-5" /> <span>Absensi Kelas</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-absensisholat')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-absensisholat' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="activity" className="w-5 h-5" /> <span>Absen Sholat</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-perizinan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-perizinan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="file-text" className="w-5 h-5" /> <span>Izin Santri</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-laporan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-laporan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="send" className="w-5 h-5" /> <span>Lapor Santri</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('pengajar-rekap')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'pengajar-rekap' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="trending-up" className="w-5 h-5" /> <span>Rekap Absensi</span>
                    </button>
                  </>
                )}

                {currentRole === "WALI" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('wali-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="layout-dashboard" className="w-5 h-5" /> <span>Ringkasan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-laporan')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-laporan' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="trending-up" className="w-5 h-5" /> <span>Perkembangan</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-absensi')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-absensi' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="scan" className="w-5 h-5" /> <span>Kehadiran</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-aspirasi')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-aspirasi' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="message-square" className="w-5 h-5" /> <span>Aspirasi Wali</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('wali-kontak')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'wali-kontak' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="phone" className="w-5 h-5" /> <span>Kontak Pengurus</span>
                    </button>
                  </>
                )}

                {currentRole === "KEAMANAN" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('keamanan-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'keamanan-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="shield" className="w-5 h-5" /> <span>Pos Keamanan</span>
                    </button>
                  </>
                )}

                {currentRole === "MEDIA" && (
                  <>
                    <button 
                      onClick={() => setActiveTab('media-dashboard')} 
                      className={`tab-btn flex items-center justify-start gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full shrink-0 lg:shrink ${activeTab === 'media-dashboard' ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10' : 'text-emerald-500 hover:bg-emerald-950/30'}`}
                    >
                      <LucideIcon name="globe" className="w-5 h-5" /> <span>Edit Homepage</span>
                    </button>
                  </>
                )}
              </aside>
            )}

            {/* MAIN PANEL CONTENT */}
            <main className={`${currentRole === "MARKET" ? "lg:col-span-12" : "lg:col-span-10"} flex flex-col gap-6`} id="main-content-panel">
              {currentRole === "KIAI" && (
                <KiaiPanel 
                  db={db}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  resetDatabase={resetDatabase}
                />
              )}

              {currentRole === "YAYASAN" && (
                <YayasanPanel 
                  db={db}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "TABUNGAN" && (
                <TabunganPanel 
                  db={db}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "PENGAJAR" && (
                <PengajarPanel 
                  db={db}
                  activeUser={activeUser}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "WALI" && (
                <WaliPanel 
                  db={db}
                  activeUser={activeUser as any}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "MARKET" && (
                <MarketPanel
                  db={db}
                  activeUser={activeUser}
                  activeTab={activeTab}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                  switchTab={setActiveTab}
                />
              )}

              {currentRole === "KEAMANAN" && (
                <KeamananPanel
                  db={db}
                  activeUser={activeUser}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}

              {currentRole === "MEDIA" && (
                <MediaPanel
                  db={db}
                  syncDbState={syncDbState}
                  showToast={showToast}
                  showConfirm={showConfirm}
                />
              )}
            </main>
          </div>

          {/* BOTTOM MOBILE NAV */}
          {currentRole !== "MARKET" && (
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-gold px-4 py-2.5 flex overflow-x-auto no-scrollbar gap-5 items-center z-40 shadow-xl shadow-emerald-950" id="mobile-nav">
            {currentRole === "KIAI" && (
              <>
                <button onClick={() => setActiveTab('kiai-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('kiai-keuangan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-keuangan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="landmark" className="w-4 h-4" /><span>Keuangan</span>
                </button>
                <button onClick={() => setActiveTab('kiai-perkembangan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-perkembangan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="trending-up" className="w-4 h-4" /><span>Laporan</span>
                </button>
                <button onClick={() => setActiveTab('kiai-keluhan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all relative ${activeTab === 'kiai-keluhan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <div className="relative">
                    <LucideIcon name="message-square" className="w-4 h-4" />
                    {db.keluhan.filter(c => c.status === "BARU").length > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] font-extrabold px-1 rounded-full animate-pulse min-w-[12px] text-center">
                        {db.keluhan.filter(c => c.status === "BARU").length}
                      </span>
                    )}
                  </div>
                  <span>Keluhan</span>
                </button>
                <button onClick={() => setActiveTab('kiai-kontak')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-kontak' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="phone-call" className="w-4 h-4" /><span>Kontak</span>
                </button>
                <button onClick={() => setActiveTab('kiai-manajemen-user')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-manajemen-user' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="shield-check" className="w-4 h-4" /><span>User</span>
                </button>
                <button onClick={() => setActiveTab('kiai-login-logs')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-login-logs' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="history" className="w-4 h-4" /><span>Logs</span>
                </button>
                <button onClick={() => setActiveTab('kiai-pengaturan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'kiai-pengaturan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="settings" className="w-4 h-4" /><span>Sistem</span>
                </button>
              </>
            )}

            {currentRole === "YAYASAN" && (
              <>
                <button onClick={() => setActiveTab('yayasan-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-santri')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-santri' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="users" className="w-4 h-4" /><span>Santri</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-tagihan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-tagihan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="receipt" className="w-4 h-4" /><span>Syahryah</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-akademik')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-akademik' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="graduation-cap" className="w-4 h-4" /><span>Akademik</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-kiriman')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-kiriman' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="wallet" className="w-4 h-4" /><span>Kiriman</span>
                </button>
                <button onClick={() => setActiveTab('yayasan-kas')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'yayasan-kas' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="landmark" className="w-4 h-4" /><span>Kas</span>
                </button>
              </>
            )}

            {currentRole === "TABUNGAN" && (
              <>
                <button onClick={() => setActiveTab('tabungan-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('tabungan-loket')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-loket' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="wallet" className="w-4 h-4" /><span>Loket</span>
                </button>
                <button onClick={() => setActiveTab('tabungan-riwayat')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-riwayat' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="history" className="w-4 h-4" /><span>Riwayat</span>
                </button>
                <button onClick={() => setActiveTab('tabungan-limit')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'tabungan-limit' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="sliders" className="w-4 h-4" /><span>Limit</span>
                </button>
              </>
            )}

            {currentRole === "PENGAJAR" && (
              <>
                <button onClick={() => setActiveTab('pengajar-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-absensikelas')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-absensikelas' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="scan" className="w-4 h-4" /><span>Kelas</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-absensisholat')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-absensisholat' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="activity" className="w-4 h-4" /><span>Sholat</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-perizinan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-perizinan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="file-text" className="w-4 h-4" /><span>Izin</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-laporan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-laporan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="send" className="w-4 h-4" /><span>Lapor</span>
                </button>
                <button onClick={() => setActiveTab('pengajar-rekap')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'pengajar-rekap' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="trending-up" className="w-4 h-4" /><span>Rekap</span>
                </button>
              </>
            )}

            {currentRole === "WALI" && (
              <>
                <button onClick={() => setActiveTab('wali-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="layout-dashboard" className="w-4 h-4" /><span>Home</span>
                </button>
                <button onClick={() => setActiveTab('wali-laporan')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-laporan' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="trending-up" className="w-4 h-4" /><span>Lapor</span>
                </button>
                <button onClick={() => setActiveTab('wali-absensi')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-absensi' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="scan" className="w-4 h-4" /><span>Absen</span>
                </button>
                <button onClick={() => setActiveTab('wali-aspirasi')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-aspirasi' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="message-square" className="w-4 h-4" /><span>Aspirasi</span>
                </button>
                <button onClick={() => setActiveTab('wali-kontak')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'wali-kontak' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="phone" className="w-4 h-4" /><span>Kontak</span>
                </button>
              </>
            )}

            {currentRole === "KEAMANAN" && (
              <>
                <button onClick={() => setActiveTab('keamanan-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'keamanan-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="shield" className="w-4 h-4" /><span>Pos Keamanan</span>
                </button>
              </>
            )}

            {currentRole === "MEDIA" && (
              <>
                <button onClick={() => setActiveTab('media-dashboard')} className={`flex flex-col items-center gap-1 text-[10px] min-w-[56px] shrink-0 transition-all ${activeTab === 'media-dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-emerald-500/70'}`}>
                  <LucideIcon name="globe" className="w-4 h-4" /><span>Homepage</span>
                </button>
              </>
            )}
          </nav>
          )}

        </div>
      )}
    </div>
  );
}
