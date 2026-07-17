import React, { useState } from 'react';
import { K_DB, Keluhan, UserManajemen } from '../types';
import { LucideIcon } from './LucideIcon';

interface KiaiPanelProps {
  db: K_DB;
  activeTab: string;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, callback: (yes: boolean) => void) => void;
  resetDatabase: () => Promise<void>;
}

export function KiaiPanel({
  db,
  activeTab,
  syncDbState,
  showToast,
  showConfirm,
  resetDatabase
}: KiaiPanelProps) {
  // Local modal states
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Keluhan | null>(null);
  const [replyText, setReplyText] = useState("");
  const [complaintFilter, setComplaintFilter] = useState<'ALL' | 'BARU' | 'SELESAI'>('ALL');

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nama: "",
    email: "",
    username: "",
    pass: "",
    role: "Admin Yayasan" as any,
    wa_number: ""
  });

  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManajemen | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    shop_name: db.settings.shop_name,
    owner_name: db.settings.owner_name,
    bank_name: db.settings.bank_name,
    bank_account: db.settings.bank_account,
    bank_owner: db.settings.bank_owner,
    nama_pesantren: db.settings.nama_pesantren || "PONPESQU",
    kiai_pass: db.settings.kiai_pass || "abah123"
  });

  // Local state for clearing history
  const [clearGeneralStart, setClearGeneralStart] = useState("");
  const [clearGeneralEnd, setClearGeneralEnd] = useState("");
  const [clearViolationsStart, setClearViolationsStart] = useState("");
  const [clearViolationsEnd, setClearViolationsEnd] = useState("");

  const handleClearGeneralHistory = async () => {
    const rangeDesc = (clearGeneralStart || clearGeneralEnd)
      ? `periode ${clearGeneralStart || 'Awal'} s/d ${clearGeneralEnd || 'Akhir'}`
      : "Seluruh Periode";

    showConfirm(`⚠️ PERINGATAN KUNING: Apakah Abah yakin ingin menghapus semua riwayat (transaksi market/tabungan, laporan perkembangan, izin belanja/jajan, absensi sholat & kelas, aspirasi/keluhan wali, riwayat sesi login, serta log kas) untuk ${rangeDesc}? Tindakan ini permanen!`, async (yes) => {
      if (yes) {
        const filterFn = (dateStr: string) => {
          if (!dateStr) return false;
          const d = dateStr.slice(0, 10);
          const matchesStart = clearGeneralStart ? d >= clearGeneralStart : true;
          const matchesEnd = clearGeneralEnd ? d <= clearGeneralEnd : true;
          return matchesStart && matchesEnd;
        };

        const updatedDb: K_DB = {
          ...db,
          transaksi_market: (db.transaksi_market || []).filter(tx => !filterFn(tx.tanggal)),
          transaksi_tabungan: (db.transaksi_tabungan || []).filter(tx => !filterFn(tx.tanggal)),
          laporan_perkembangan: (db.laporan_perkembangan || []).filter(rep => !filterFn(rep.tanggal)),
          izin_keamanan: (db.izin_keamanan || []).filter(i => !filterFn(i.tanggal)),
          absensi_kelas: (db.absensi_kelas || []).filter(a => !filterFn(a.tanggal)),
          absensi_sholat: (db.absensi_sholat || []).filter(a => !filterFn(a.tanggal)),
          yayasan_kas_logs: (db.yayasan_kas_logs || []).filter(log => !filterFn(log.tanggal)),
          market_kas_logs: (db.market_kas_logs || []).filter(log => !filterFn(log.tanggal)),
          keluhan: (db.keluhan || []).filter(c => {
            if (c.tanggal) {
              return !filterFn(c.tanggal);
            }
            return !(!clearGeneralStart && !clearGeneralEnd);
          }),
          login_logs: (db.login_logs || []).filter(log => !filterFn(log.tanggal)),
        };

        await syncDbState(updatedDb);
        showToast("Semua riwayat transaksi dan aktivitas berhasil dibersihkan!", "success");
        setClearGeneralStart("");
        setClearGeneralEnd("");
      }
    });
  };

  const handleClearViolationsHistory = async () => {
    const rangeDesc = (clearViolationsStart || clearViolationsEnd)
      ? `periode ${clearViolationsStart || 'Awal'} s/d ${clearViolationsEnd || 'Akhir'}`
      : "Seluruh Periode";

    showConfirm(`⚠️ PERINGATAN KUNING: Apakah Abah yakin ingin menghapus catatan pelanggaran santri untuk ${rangeDesc}? Catatan kedisiplinan & hukuman ini akan dihapus permanen!`, async (yes) => {
      if (yes) {
        const filterFn = (dateStr: string) => {
          if (!dateStr) return false;
          const d = dateStr.slice(0, 10);
          const matchesStart = clearViolationsStart ? d >= clearViolationsStart : true;
          const matchesEnd = clearViolationsEnd ? d <= clearViolationsEnd : true;
          return matchesStart && matchesEnd;
        };

        const updatedDb: K_DB = {
          ...db,
          pelanggaran_santri: (db.pelanggaran_santri || []).filter(v => !filterFn(v.tanggal)),
        };

        await syncDbState(updatedDb);
        showToast("Catatan pelanggaran santri berhasil dibersihkan!", "success");
        setClearViolationsStart("");
        setClearViolationsEnd("");
      }
    });
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const copyBankAccount = () => {
    const accountNum = db.settings.bank_account || "7144028990";
    navigator.clipboard.writeText(accountNum);
    showToast(`Nomor Rekening ${accountNum} disalin ke clipboard!`, "success");
  };

  // Reply to complaint
  const openReply = (klh: Keluhan) => {
    setSelectedComplaint(klh);
    setReplyText("");
    setIsReplyOpen(true);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const updatedKeluhan = db.keluhan.map(c => {
      if (c.id_keluhan === selectedComplaint.id_keluhan) {
        return { ...c, status: "SELESAI" as const, jawaban: replyText };
      }
      return c;
    });

    await syncDbState({
      ...db,
      keluhan: updatedKeluhan
    });

    setIsReplyOpen(false);
    setSelectedComplaint(null);
    showToast("Tanggapan Abah Kiai berhasil dikirimkan!", "success");
  };

  // Add new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const usernameClean = newUser.username.trim().toLowerCase();
    
    const isDuplicate = db.users_manajemen.some(u => u.username.toLowerCase() === usernameClean) || usernameClean === "kiai";
    if (isDuplicate) {
      showToast("ID Pengguna (username) sudah digunakan!", "error");
      return;
    }

    const created: UserManajemen = {
      id_user: "USR-0" + (db.users_manajemen.length + 1),
      nama: newUser.nama.trim(),
      email: newUser.email.trim(),
      username: usernameClean,
      pass: newUser.pass,
      role: newUser.role,
      wa_number: newUser.wa_number.trim()
    };

    await syncDbState({
      ...db,
      users_manajemen: [...db.users_manajemen, created]
    });

    setIsAddUserOpen(false);
    setNewUser({
      nama: "",
      email: "",
      username: "",
      pass: "",
      role: "Admin Yayasan",
      wa_number: ""
    });
    showToast(`User baru "${created.nama}" sukses dibuat!`, "success");
  };

  const updateUserRole = async (index: number, newRole: any) => {
    const updatedUsers = [...db.users_manajemen];
    updatedUsers[index] = { ...updatedUsers[index], role: newRole };

    await syncDbState({
      ...db,
      users_manajemen: updatedUsers
    });
    showToast(`Otoritas diubah menjadi: ${newRole}`, "success");
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const usernameClean = editingUser.username.trim().toLowerCase();
    
    const isDuplicate = db.users_manajemen.some(u => u.username.toLowerCase() === usernameClean && u.id_user !== editingUser.id_user) || usernameClean === "kiai";
    if (isDuplicate) {
      showToast("ID Pengguna (username) sudah digunakan!", "error");
      return;
    }

    const updatedUsers = db.users_manajemen.map(u => {
      if (u.id_user === editingUser.id_user) {
        return {
          ...editingUser,
          nama: editingUser.nama.trim(),
          email: editingUser.email.trim(),
          username: usernameClean,
          wa_number: editingUser.wa_number?.trim() || ""
        };
      }
      return u;
    });

    await syncDbState({
      ...db,
      users_manajemen: updatedUsers
    });

    setIsEditUserOpen(false);
    setEditingUser(null);
    showToast(`User "${editingUser.nama}" sukses diperbarui!`, "success");
  };

  const handleDeleteUser = async (id_user: string, nama: string) => {
    showConfirm(`Apakah Abah yakin ingin menghapus pengguna "${nama}" dari sistem? Tindakan ini permanen!`, async (yes) => {
      if (yes) {
        const updatedUsers = db.users_manajemen.filter(u => u.id_user !== id_user);
        await syncDbState({
          ...db,
          users_manajemen: updatedUsers
        });
        showToast(`User "${nama}" berhasil dihapus!`, "success");
      }
    });
  };

  // Save Settings
  const saveSettings = async () => {
    await syncDbState({
      ...db,
      settings: {
        ...db.settings,
        ...settingsForm
      }
    });
    showToast("Konfigurasi Pesantren berhasil disimpan!", "success");
  };

  // Upload Logo
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        await syncDbState({
          ...db,
          settings: {
            ...db.settings,
            logo_url: e.target.result as string
          }
        });
        showToast("Logo pesantren berhasil diperbarui!", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerReset = () => {
    showConfirm("🚨 PERINGATAN KERAS (MERAH): Menyetel ulang seluruh database akan menghapus SEMUA data santri, semua akun keuangan, laporan, perizinan, dan absensi pesantren! Data akan dikembalikan bersih ke setelan bawaan pabrik. Apakah Abah Kiai benar-benar yakin 100%?", async (yes) => {
      if (yes) {
        showConfirm("🚨 APAKAH BENAR-BENAR YAKIN? Sekali lagi, semua data aktif pesantren saat ini akan hilang selamanya!", async (yesAgain) => {
          if (yesAgain) {
            await resetDatabase();
          }
        });
      }
    });
  };

  if (activeTab === 'kiai-dashboard') {
    const unreadCount = db.keluhan.filter(c => c.status === "BARU").length;
    const totalSaku = db.santri.reduce((sum, s) => sum + (Number(s.saldo_utama) || 0), 0);
    const totalKas = db.kas_yayasan + db.kas_market;

    return (
      <section id="tab-kiai-dashboard" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
          <h2 className="text-base font-bold text-gray-100">Assalamualaikum, <span id="welcome-kiai-name">{db.settings.owner_name}</span></h2>
          <p className="text-xs text-emerald-500/80 mt-1">Laporan makro kondisi spiritual, akademik, dan finansial Pondok Pesantren hari ini.</p>
        </div>

        {/* Grid Statistik Utama */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <LucideIcon name="users" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Santri Aktif</span>
              <span className="text-lg font-bold text-gray-200 block">{db.santri.length}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <LucideIcon name="landmark" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Kas Yayasan</span>
              <span className="text-lg font-bold text-emerald-400 block">{formatRupiah(db.kas_yayasan)}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <LucideIcon name="shopping-bag" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Kas Market</span>
              <span className="text-lg font-bold text-amber-400 block">{formatRupiah(db.kas_market)}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <LucideIcon name="message-square" className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500/60 uppercase block">Keluhan Baru</span>
              <span className="text-lg font-bold text-red-400 block">{unreadCount}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Neraca Kas & Likuiditas</h3>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-500/80">Kas Utama Yayasan</span>
                  <span className="font-bold">{formatRupiah(db.kas_yayasan)}</span>
                </div>
                <div className="w-full bg-emerald-950/50 rounded-full h-2.5 border border-emerald-900">
                  <div 
                    className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full" 
                    style={{ width: `${totalKas > 0 ? (db.kas_yayasan / totalKas) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-amber-500/80">Kas Unit Koperasi (Market)</span>
                  <span className="font-bold">{formatRupiah(db.kas_market)}</span>
                </div>
                <div className="w-full bg-emerald-950/50 rounded-full h-2.5 border border-emerald-900">
                  <div 
                    className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full" 
                    style={{ width: `${totalKas > 0 ? (db.kas_market / totalKas) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Laporan Perkembangan Terakhir</h3>
            <div className="space-y-3">
              {db.laporan_perkembangan.slice().reverse().slice(0, 3).map((rep) => (
                <div key={rep.id_laporan} className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-200 block">{rep.subjek}</span>
                    <span className="text-[10px] text-emerald-500/60 block">Oleh: {rep.pengirim}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">{rep.tipe}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-keuangan') {
    return (
      <section id="tab-kiai-keuangan" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-2">Buku Besar Kas & Log Pembayaran Syahryah</h3>
          <p className="text-xs text-emerald-500/70">Histori mutasi kas terpusat yayasan, syahryah bulanan, serta setoran tunai cashless.</p>
        </div>

        <div id="bank-reference-card" className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Rekening Resmi Pembayaran Pondok</span>
            <h4 className="text-sm font-extrabold text-white mt-1">{db.settings.bank_name} - {db.settings.bank_account}</h4>
            <p className="text-xs text-emerald-500/70">A/N: {db.settings.bank_owner}</p>
          </div>
          <button onClick={copyBankAccount} className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-900 text-amber-400 rounded-xl transition-all flex items-center gap-2 text-xs font-bold">
            <LucideIcon name="copy" className="w-4 h-4" />
            <span>Salin Rekening</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-emerald-950/50 pb-3">
              <h4 className="text-xs font-bold uppercase text-emerald-400">Kas Operasional Yayasan</h4>
              <span className="text-sm font-extrabold text-white">{formatRupiah(db.kas_yayasan)}</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
              {db.yayasan_kas_logs.slice().reverse().slice(0, 5).map((log, index) => (
                <div key={index} className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/50 text-xs flex justify-between items-center">
                  <div>
                    <strong className="text-gray-200 block">{log.keterangan}</strong>
                    <span className="text-[9px] text-emerald-500/50">{log.tanggal}</span>
                  </div>
                  <span className={`font-bold ${log.tipe === "MASUK" ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.tipe === "MASUK" ? "+" : "-"} {formatRupiah(log.nominal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-emerald-950/50 pb-3">
              <h4 className="text-xs font-bold uppercase text-amber-400">Kas Unit Market / Koperasi</h4>
              <span className="text-sm font-extrabold text-white">{formatRupiah(db.kas_market)}</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar">
              {db.market_kas_logs.slice().reverse().slice(0, 5).map((log, index) => (
                <div key={index} className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/50 text-xs flex justify-between items-center">
                  <div>
                    <strong className="text-gray-200 block">{log.keterangan}</strong>
                    <span className="text-[9px] text-emerald-500/50">{log.tanggal}</span>
                  </div>
                  <span className={`font-bold ${log.tipe === "MASUK" ? 'text-emerald-400' : 'text-red-400'}`}>
                    {log.tipe === "MASUK" ? "+" : "-"} {formatRupiah(log.nominal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-perkembangan') {
    const allViolations = (db.pelanggaran_santri || []).slice().reverse();
    const allAllowances = (db.izin_keamanan || []).slice().reverse();

    return (
      <section id="tab-kiai-perkembangan" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-2">Laporan Perkembangan, Kedisiplinan & Dispensasi Santri</h3>
          <p className="text-xs text-emerald-500/70">Catatan perkembangan khusus dari asatidzah serta rekapitulasi pelanggaran dan dispensasi limit oleh tim Keamanan.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN: Academic Progress Reports */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="trending-up" className="w-4 h-4 text-emerald-400" />
              Laporan Perkembangan Akademik & Aktivitas
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {db.laporan_perkembangan.slice().reverse().map((rep) => (
                <div key={rep.id_laporan} className="glass-card p-4 rounded-xl border border-emerald-900/40 flex flex-col gap-2 relative bg-emerald-950/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">{rep.tipe}</span>
                      <h4 className="text-xs font-bold text-gray-100 mt-1.5">{rep.subjek}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 font-semibold">{rep.sasaran}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed bg-emerald-950/30 p-2.5 rounded-xl italic">"{rep.isi}"</p>
                  <div className="flex justify-between items-center text-[9px] text-emerald-500/50 mt-1">
                    <span>Oleh: {rep.pengirim}</span>
                    <span className="font-mono">{rep.tanggal}</span>
                  </div>
                </div>
              ))}
              {db.laporan_perkembangan.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-10 italic">Belum ada laporan perkembangan masuk.</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Discipline Violations */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="gavel" className="w-4 h-4 text-red-500" />
              Buku Hitam Pelanggaran Santri (Keamanan)
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {allViolations.map((v) => {
                const sInfo = db.santri.find(s => s.id_santri === v.id_santri);
                return (
                  <div key={v.id_pelanggaran} className="glass-card p-4 rounded-xl border border-red-500/25 flex flex-col gap-2 relative bg-red-500/5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          v.kategori === "BERAT" 
                            ? "bg-red-500/20 text-red-400 border-red-500/30" 
                            : v.kategori === "SEDANG"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}>
                          {v.kategori}
                        </span>
                        <span className="text-xs font-bold text-gray-100">{sInfo?.nama_santri || "Santri"}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono">{v.tanggal}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#1b0a0a]/50 p-2.5 rounded-xl">
                      <strong>Detail:</strong> {v.detail_pelanggaran}
                    </p>
                    <div className="pt-1.5 border-t border-red-950/20 text-xs text-amber-300">
                      <strong>Hukuman/Sanksi:</strong> <span className="underline font-medium text-white">{v.hukuman}</span>
                    </div>
                    <div className="text-[9px] text-emerald-500/50 flex justify-between">
                      <span>ID: {v.id_pelanggaran}</span>
                      <span>Dicatat oleh: {v.dicatat_oleh}</span>
                    </div>
                  </div>
                );
              })}
              {allViolations.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-10 italic">Alhamdulillah, tidak ada catatan pelanggaran keamanan.</p>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Active Spending Overrides */}
        <div className="glass-card p-5 rounded-2xl border border-yellow-500/10 mt-2">
          <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-widest border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-2">
            <LucideIcon name="unlock" className="w-4 h-4 text-yellow-500" />
            Daftar Dispensasi Batas Jajan & Belanja Lebih Santri
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allAllowances.map((i) => {
              const sInfo = db.santri.find(s => s.id_santri === i.id_santri);
              const today = new Date().toISOString().slice(0, 10);
              const isActive = i.tanggal === today;
              return (
                <div key={i.id_izin_khusus} className="p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl space-y-2.5 relative text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-100 block">{sInfo?.nama_santri}</span>
                      <span className="text-[9px] text-emerald-500/50 font-mono block">Kelas: {sInfo?.kelas}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                      isActive 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-gray-800 text-gray-500 border-gray-700"
                    }`}>
                      {isActive ? "AKTIF" : "KADALUARSA"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-yellow-950/20 p-2 rounded-lg border border-yellow-950/30 text-xs">
                    <span className="text-gray-400 font-medium">Tipe: <strong className="text-yellow-400">{i.tipe_izin}</strong></span>
                    <strong className="text-yellow-400 font-mono">
                      {i.is_no_limit ? "BEBAS (NO LIMIT)" : formatRupiah(i.nominal_disetujui)}
                    </strong>
                  </div>

                  <div className="text-[11px] leading-relaxed text-gray-300">
                    <strong>Keterangan:</strong> "{i.keterangan}"
                  </div>

                  <div className="flex justify-between text-[9px] text-emerald-500/50 pt-1.5 border-t border-yellow-950/20">
                    <span>Otorisasi: {i.dicatat_oleh}</span>
                    <span>Tgl: {i.tanggal}</span>
                  </div>
                </div>
              );
            })}
            {allAllowances.length === 0 && (
              <p className="text-xs text-gray-500 text-center col-span-2 py-6 italic">Belum ada dispensasi limit belanja/jajan yang diterbitkan.</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-kontak') {
    return (
      <section id="tab-kiai-kontak" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-2">Buku Kontak WhatsApp Pesantren</h3>
          <p className="text-xs text-emerald-500/70">Hubungi pengajar dan penanggung jawab otoritas secara instan langsung via WhatsApp.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asatidzah */}
          {db.asatidzah_kontak.map((tch) => (
            <div key={tch.id_guru} className="glass-card p-4 rounded-2xl border border-emerald-900/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src={tch.foto_profil || "https://placehold.co/150x150/022c22/f59e0b?text=Ustadz"} className="w-12 h-12 rounded-xl object-cover border border-amber-500/20 shadow-md" />
                <div>
                  <h5 className="text-xs font-bold text-gray-100 block">{tch.nama}</h5>
                  <span className="text-[10px] text-emerald-400 font-semibold block">{tch.jabatan}</span>
                  <span className="text-[9px] text-emerald-500/60 block mt-0.5">Alamat: {tch.alamat || '-'}</span>
                </div>
              </div>
              <a href={`https://wa.me/${tch.no_wa}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-md">
                <LucideIcon name="message-circle" className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>
            </div>
          ))}

          {/* Users */}
          {db.users_manajemen.map((usr) => {
            if (!usr.wa_number) return null;
            return (
              <div key={usr.id_user} className="glass-card p-4 rounded-2xl border border-amber-500/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950 flex items-center justify-center text-amber-500 border border-emerald-900 font-bold text-xs uppercase">
                    {usr.nama.charAt(0) + (usr.nama.split(" ")[1]?.charAt(0) || usr.nama.charAt(1))}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-100 block">{usr.nama}</h5>
                    <span className="text-[10px] text-amber-400 font-semibold block">Otoritas: {usr.role}</span>
                    <span className="text-[9px] text-emerald-500/60 block mt-0.5">ID: {usr.username}</span>
                  </div>
                </div>
                <a href={`https://wa.me/${usr.wa_number}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] flex items-center gap-1 shadow-md">
                  <LucideIcon name="message-circle" className="w-3.5 h-3.5" />
                  <span>Chat WA</span>
                </a>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-manajemen-user') {
    return (
      <section id="tab-kiai-manajemen-user" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <LucideIcon name="shield-alert" className="w-6 h-6" />
                <h3 className="text-base font-bold text-amber-500">Manajemen Pengguna (Otoritas)</h3>
              </div>
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                Tentukan penugasan role khusus Admin Yayasan, Admin Tabungan, dan Admin Market di bawah.
              </p>
            </div>
            <button onClick={() => setIsAddUserOpen(true)} className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-md">
              <LucideIcon name="user-plus" className="w-4 h-4" /> Tambah Pengguna Baru
            </button>
          </div>
          
          <div className="space-y-4">
            {db.users_manajemen.map((usr, idx) => (
              <div key={usr.id_user} className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl flex items-center justify-between flex-wrap gap-4 transition-all hover:bg-emerald-950/30 text-xs">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-100">{usr.nama}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      {usr.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500/60 font-mono block mt-1">ID: {usr.username} • {usr.email} • WA: +{usr.wa_number || '-'}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => {
                      setEditingUser({ ...usr });
                      setIsEditUserOpen(true);
                    }}
                    className="p-2 bg-emerald-900/30 hover:bg-emerald-900/60 text-amber-400 rounded-xl transition-colors border border-emerald-900/40 flex items-center gap-1 font-semibold"
                    title="Edit Pengguna"
                  >
                    <LucideIcon name="pencil" className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(usr.id_user, usr.nama)}
                    className="p-2 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-xl transition-colors border border-red-900/20 flex items-center gap-1 font-semibold"
                    title="Hapus Pengguna"
                  >
                    <LucideIcon name="trash-2" className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add User Dialog */}
        {isAddUserOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="user-plus" className="w-4 h-4" /> Tambah Pengguna Baru
                </h3>
                <button onClick={() => setIsAddUserOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.nama}
                    onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                    placeholder="Contoh: Ust. H. Ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">WhatsApp Pengguna</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.wa_number}
                    onChange={(e) => setNewUser({ ...newUser, wa_number: e.target.value })}
                    placeholder="Contoh: 62812345678" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Alamat Email</label>
                  <input 
                    type="email" 
                    required 
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="ridwan@ponpesqu.com" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">ID Pengguna (Username)</label>
                  <input 
                    type="text" 
                    required 
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Kata Sandi (Password)</label>
                  <input 
                    type="password" 
                    required 
                    value={newUser.pass}
                    onChange={(e) => setNewUser({ ...newUser, pass: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Otoritas Penugasan (Role)</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-amber-400 focus:outline-none"
                  >
                    <option value="Admin Yayasan">Admin Yayasan</option>
                    <option value="Admin Tabungan">Admin Tabungan</option>
                    <option value="Admin Market">Admin Market</option>
                    <option value="Pengajar">Pengajar</option>
                    <option value="Admin Keamanan">Admin Keamanan</option>
                    <option value="Admin Media">Admin Media</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddUserOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Pengguna</button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Edit User Dialog */}
        {isEditUserOpen && editingUser && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="pencil" className="w-4 h-4" /> Edit Pengguna
                </h3>
                <button onClick={() => { setIsEditUserOpen(false); setEditingUser(null); }} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.nama}
                    onChange={(e) => setEditingUser({ ...editingUser, nama: e.target.value })}
                    placeholder="Contoh: Ust. H. Ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">WhatsApp Pengguna</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.wa_number || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, wa_number: e.target.value })}
                    placeholder="Contoh: 62812345678" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Alamat Email</label>
                  <input 
                    type="email" 
                    required 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="ridwan@ponpesqu.com" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">ID Pengguna (Username)</label>
                  <input 
                    type="text" 
                    required 
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    placeholder="ridwan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Kata Sandi (Password)</label>
                  <input 
                    type="password" 
                    required 
                    value={editingUser.pass}
                    onChange={(e) => setEditingUser({ ...editingUser, pass: e.target.value })}
                    placeholder="••••••••" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Otoritas Penugasan (Role)</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-amber-400 focus:outline-none"
                  >
                    <option value="Admin Yayasan">Admin Yayasan</option>
                    <option value="Admin Tabungan">Admin Tabungan</option>
                    <option value="Admin Market">Admin Market</option>
                    <option value="Pengajar">Pengajar</option>
                    <option value="Admin Keamanan">Admin Keamanan</option>
                    <option value="Admin Media">Admin Media</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setIsEditUserOpen(false); setEditingUser(null); }} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'kiai-keluhan') {
    const complaints = db.keluhan || [];
    const filteredComplaints = complaints.filter(c => {
      if (complaintFilter === 'BARU') return c.status === 'BARU';
      if (complaintFilter === 'SELESAI') return c.status === 'SELESAI';
      return true;
    });

    return (
      <section id="tab-kiai-keluhan" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <LucideIcon name="message-square" className="w-6 h-6" />
                <h3 className="text-base font-bold text-amber-500">Aspirasi & Keluhan Wali Santri</h3>
              </div>
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                Abah Kiai dapat memantau dan memberikan jawaban langsung atas masukan, keluhan, maupun saran dari wali santri.
              </p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 bg-emerald-950/60 p-1 rounded-xl border border-emerald-900/40 text-xs">
              <button
                onClick={() => setComplaintFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${complaintFilter === 'ALL' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-500/80 hover:text-emerald-400'}`}
              >
                Semua ({complaints.length})
              </button>
              <button
                onClick={() => setComplaintFilter('BARU')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${complaintFilter === 'BARU' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-500/80 hover:text-emerald-400'}`}
              >
                Baru ({complaints.filter(c => c.status === 'BARU').length})
              </button>
              <button
                onClick={() => setComplaintFilter('SELESAI')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${complaintFilter === 'SELESAI' ? 'bg-amber-500 text-emerald-950 font-bold' : 'text-emerald-500/80 hover:text-emerald-400'}`}
              >
                Selesai ({complaints.filter(c => c.status === 'SELESAI').length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredComplaints.slice().reverse().map((c) => (
              <div key={c.id_keluhan} className="p-5 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl flex flex-col gap-4 transition-all hover:bg-emerald-950/30 text-xs">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-amber-500 font-bold">
                      {c.nama_wali.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-100 block">{c.nama_wali}</span>
                      <span className="text-[10px] text-emerald-500/50 block mt-0.5">ID Keluhan: {c.id_keluhan}</span>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${
                    c.status === "BARU" 
                      ? "bg-red-500/10 text-red-400 border-red-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    {c.status === "BARU" ? "BELUM DITANGGAPI" : "SUDAH DITANGGAPI"}
                  </span>
                </div>

                <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-900/30 text-gray-200 italic leading-relaxed">
                  "{c.isi}"
                </div>

                {c.jawaban ? (
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold">
                      <LucideIcon name="message-square" className="w-3.5 h-3.5" />
                      Tanggapan Abah Kiai:
                    </div>
                    <p className="text-gray-300 leading-relaxed font-medium">
                      {c.jawaban}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => openReply(c)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <LucideIcon name="pen-tool" className="w-3.5 h-3.5" /> Tanggapi Keluhan
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredComplaints.length === 0 && (
              <div className="text-center py-12 text-gray-500 italic">
                Belum ada keluhan wali santri dalam kategori ini.
              </div>
            )}
          </div>
        </div>

        {/* Reply Complaint Dialog */}
        {isReplyOpen && selectedComplaint && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-md flex items-center justify-center">
            <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="message-square" className="w-4 h-4" /> Berikan Tanggapan
                </h3>
                <button onClick={() => { setIsReplyOpen(false); setSelectedComplaint(null); }} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-2 text-gray-300">
                <div>
                  <span className="text-emerald-500/70 block">Wali Santri:</span>
                  <span className="font-bold text-gray-100">{selectedComplaint.nama_wali}</span>
                </div>
                <div>
                  <span className="text-emerald-500/70 block">Isi Keluhan:</span>
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/40 italic text-gray-300">
                    "{selectedComplaint.isi}"
                  </div>
                </div>
              </div>

              <form onSubmit={handleReplySubmit} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1 font-bold">Tanggapan / Jawaban Abah Kiai</label>
                  <textarea
                    required
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tulis tanggapan atau solusi di sini..."
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setIsReplyOpen(false); setSelectedComplaint(null); }} className="w-1/2 py-2.5 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold cursor-pointer">Batal</button>
                  <button type="submit" className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md cursor-pointer">Kirim Tanggapan</button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'kiai-pengaturan') {
    return (
      <section id="tab-kiai-pengaturan" className="tab-content flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 border-b border-emerald-950/50 pb-3">
              <LucideIcon name="settings-2" className="w-5 h-5" /> Identitas & Atribut Pondok
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-500/80 mb-1">Nama Pondok Pesantren</label>
                <input 
                  type="text" 
                  value={settingsForm.shop_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, shop_name: e.target.value })}
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-emerald-500/80 mb-1">Nama Singkat / Brand Pesantren (Contoh: PONPESQU)</label>
                <input 
                  type="text" 
                  value={settingsForm.nama_pesantren}
                  onChange={(e) => setSettingsForm({ ...settingsForm, nama_pesantren: e.target.value })}
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  placeholder="PONPESQU"
                />
              </div>
              <div>
                <label className="block text-emerald-500/80 mb-1">Nama Pemilik / Pengasuh (Kiai)</label>
                <input 
                  type="text" 
                  value={settingsForm.owner_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, owner_name: e.target.value })}
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Bank</label>
                  <input 
                    type="text" 
                    value={settingsForm.bank_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_name: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nomor Rekening</label>
                  <input 
                    type="text" 
                    value={settingsForm.bank_account}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_account: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Atas Nama (A/N)</label>
                  <input 
                    type="text" 
                    value={settingsForm.bank_owner}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_owner: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-950/30">
                <label className="block text-emerald-500/80 mb-1 font-bold">Sandi Pengaman Akun Kiai (Login Kiai)</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={settingsForm.kiai_pass}
                    onChange={(e) => setSettingsForm({ ...settingsForm, kiai_pass: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl pl-3 pr-10 py-2.5 text-xs text-gray-200 focus:outline-none font-mono tracking-widest"
                    placeholder="Sandi baru Kiai (contoh: abah123)"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/70 hover:text-emerald-400 cursor-pointer p-1"
                  >
                    <LucideIcon name={showPassword ? "eye-off" : "eye"} className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-500/50 mt-1">Sandi awal/standar adalah <code className="bg-emerald-950/80 px-1 py-0.5 rounded text-amber-400">abah123</code>. Ganti untuk memperkuat keamanan database pesantren.</p>
              </div>
              <button onClick={saveSettings} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors mt-2 shadow-md">
                Simpan Konfigurasi Pesantren
              </button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/50 pb-3">
                <LucideIcon name="image" className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-100">Logo Ikonik Aplikasi</h3>
              </div>
              <p className="text-xs text-emerald-500/70 leading-relaxed">
                Ganti file branding logo aplikasi Android/iOS ponpesqu langsung menggunakan Cloud Uploader pesantren.
              </p>

              <div className="p-4 bg-emerald-950/30 rounded-xl border border-emerald-900/60 flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <img 
                    src={db.settings.logo_url || "https://placehold.co/150x150/022c22/f59e0b?text=🕌"} 
                    alt="Logo Pesantren" 
                    className="w-12 h-12 rounded-xl object-cover border border-amber-500/20 shadow-md shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-200 block">Logo Ikonik Aktif</span>
                    <span className="text-[10px] text-emerald-500/60 font-medium">Ganti berkas logo (.png / .jpg)</span>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  id="logo-uploader-input" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload}
                />
                <button 
                  onClick={() => document.getElementById('logo-uploader-input')?.click()} 
                  className="px-4 py-2 bg-emerald-950/50 hover:bg-emerald-950 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <LucideIcon name="upload" className="w-4 h-4" /> Ganti Logo
                </button>
              </div>
            </div>

            <div className="border-t border-emerald-950/50 pt-5 space-y-5">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                <LucideIcon name="settings-2" className="w-4 h-4 text-red-400" />
                Sistem Pemeliharaan & Pembersihan Database
              </h3>

              {/* 1. Pembersihan Riwayat Transaksi & Laporan */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <LucideIcon name="alert-triangle" className="w-4 h-4 text-amber-400" />
                  Pembersihan Riwayat Transaksi & Laporan Umum (Kuning)
                </div>
                <p className="text-[11px] text-amber-500/70 leading-relaxed">
                  Menghapus riwayat transaksi market, transaksi tabungan, laporan perkembangan, izin jajan, absensi sholat & kelas, keluhan wali santri, riwayat sesi login, serta kas log. Akun santri dan saldo saku utama tetap aman dan tidak akan terhapus.
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="block text-amber-500/60 mb-1">Dari Tanggal (Mulai)</label>
                    <input
                      type="date"
                      value={clearGeneralStart}
                      onChange={(e) => setClearGeneralStart(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-500/60 mb-1">Sampai Tanggal (Akhir)</label>
                    <input
                      type="date"
                      value={clearGeneralEnd}
                      onChange={(e) => setClearGeneralEnd(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleClearGeneralHistory}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Bersihkan Riwayat Transaksi & Laporan
                </button>
              </div>

              {/* 2. Pembersihan Riwayat Pelanggaran Santri */}
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <LucideIcon name="shield-alert" className="w-4 h-4 text-amber-400" />
                  Pembersihan Riwayat Pelanggaran Santri (Kuning)
                </div>
                <p className="text-[11px] text-amber-500/70 leading-relaxed">
                  Menghapus riwayat kedisiplinan dan hukuman santri dari database kedisiplinan keamanan secara permanen.
                </p>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <label className="block text-amber-500/60 mb-1">Dari Tanggal (Mulai)</label>
                    <input
                      type="date"
                      value={clearViolationsStart}
                      onChange={(e) => setClearViolationsStart(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-500/60 mb-1">Sampai Tanggal (Akhir)</label>
                    <input
                      type="date"
                      value={clearViolationsEnd}
                      onChange={(e) => setClearViolationsEnd(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-900/60 text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  onClick={handleClearViolationsHistory}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Bersihkan Riwayat Pelanggaran Santri
                </button>
              </div>

              {/* 3. Stel Ulang Seluruh Database */}
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-xs space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-black uppercase tracking-wider animate-pulse">
                  <LucideIcon name="flame" className="w-4 h-4 text-red-500 animate-bounce" />
                  Zona Bahaya Keras: Stel Ulang Database (Merah)
                </div>
                <p className="text-[11px] text-red-300/80 leading-relaxed">
                  Tindakan ini akan memformat seluruh database pondok pesantren dan mengembalikan semua santri, keuangan, tabungan, koperasi, dan konfigurasi ke pengaturan awal bawaan.
                </p>
                <button
                  onClick={triggerReset}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold border border-red-500/30 rounded-xl text-xs transition-all shadow-lg hover:shadow-red-900/30 cursor-pointer"
                >
                  Setel Ulang Seluruh Database Ponpesqu
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>
    );
  }

  if (activeTab === 'kiai-login-logs') {
    const logs = db.login_logs || [];
    return (
      <section id="tab-kiai-login-logs" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-6 rounded-[24px] border border-emerald-900/40">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 text-amber-500 mb-2">
                <LucideIcon name="history" className="w-6 h-6" />
                <h3 className="text-base font-bold text-amber-500">Riwayat Sesi Login</h3>
              </div>
              <p className="text-xs text-emerald-500/80 leading-relaxed">
                Abah Kiai dapat memantau siapa saja yang masuk ke dalam sistem, beserta peran (role), waktu masuk, dan alamat IP perangkat yang digunakan.
              </p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#031d17] text-amber-500 uppercase font-bold border-b border-emerald-900/60">
                <tr>
                  <th className="p-3">Waktu (WIB)</th>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Otoritas / Role</th>
                  <th className="p-3">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/30">
                {logs.slice().reverse().map((log) => (
                  <tr key={log.id_log} className="hover:bg-emerald-950/25 transition-all">
                    <td className="p-3 font-mono">{log.tanggal}</td>
                    <td className="p-3 font-semibold text-gray-100">{log.nama}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{log.ip_address}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">
                      Belum ada riwayat login tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
