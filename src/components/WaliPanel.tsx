import React, { useState } from 'react';
import { K_DB, Santri, Keluhan } from '../types';
import { LucideIcon } from './LucideIcon';

interface WaliPanelProps {
  db: K_DB;
  activeUser: { nama: string; role: string; id_santri?: string };
  activeTab: string;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, callback: (yes: boolean) => void) => void;
  switchTab: (tabId: string) => void;
}

export function WaliPanel({
  db,
  activeUser,
  activeTab,
  syncDbState,
  showToast,
  showConfirm,
  switchTab
}: WaliPanelProps) {
  const todayStr = "2026-07-12";
  
  // Find all children belonging to this Wali
  const currentChildInfo = db.santri.find(s => s.id_santri === (activeUser.id_santri || db.santri[0]?.id_santri));
  const parentName = currentChildInfo?.nama_wali?.toLowerCase().trim() || "";
  const parentWa = currentChildInfo?.wa_wali?.trim() || "";

  const myChildren = db.santri.filter(s => {
    if (s.id_santri === activeUser.id_santri) return true;
    if (parentName && s.nama_wali?.toLowerCase().trim() === parentName) return true;
    if (parentWa && s.wa_wali?.trim() === parentWa) return true;
    return false;
  });

  // Unique list of children
  const uniqueChildren = Array.from(new Map(myChildren.map(item => [item.id_santri, item])).values());

  const [selectedChildId, setSelectedChildId] = useState(activeUser.id_santri || uniqueChildren[0]?.id_santri || db.santri[0]?.id_santri || "");
  const child = db.santri.find(s => s.id_santri === selectedChildId) || db.santri[0];

  // State for new complaint
  const [keluhanIsi, setKeluhanIsi] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wallet Ledger filter states
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerCategory, setLedgerCategory] = useState<"SEMUA" | "MASUK" | "KELUAR" | "BELANJA" | "TARIK">("SEMUA");
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");

  if (!child) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>Data santri untuk wali ini tidak ditemukan.</p>
      </div>
    );
  }

  // Filter child reports (individual and class-wide)
  const childReports = (db.laporan_perkembangan || []).filter(rep => {
    const isIndividual = rep.tipe === "Individu" && rep.sasaran.toLowerCase() === child.nama_santri.toLowerCase();
    const isClass = rep.tipe === "Kelas" && rep.sasaran.toLowerCase() === child.kelas.toLowerCase();
    return isIndividual || isClass;
  });

  // Filter child violations
  const childViolations = (db.pelanggaran_santri || []).filter(v => v.id_santri === child.id_santri);

  // Filter child permissions
  const childAllowances = (db.izin_keamanan || []).filter(i => i.id_santri === child.id_santri);

  // Filter child attendance records
  const childClassAttendance = (db.absensi_kelas || []).filter(a => a.id_santri === child.id_santri);
  const childSholatAttendance = (db.absensi_sholat || []).filter(a => a.id_santri === child.id_santri);

  // Filter child complaints
  const childComplaints = (db.keluhan || []).filter(k => 
    k.nama_wali.toLowerCase().includes(child.nama_santri.toLowerCase()) || 
    k.nama_wali.toLowerCase().includes(child.nama_wali?.toLowerCase() || "") ||
    k.nama_wali === `Wali ${child.nama_santri}`
  );

  // --- COMBINED LEDGER FOR STUDENT WALLET ---
  const walletLedger: {
    id: string;
    tanggal: string;
    tipe: 'MASUK' | 'KELUAR';
    kategori: 'DEPOSIT' | 'PENARIKAN' | 'BELANJA_MARKET';
    nominal: number;
    keterangan: string;
    rincian?: string;
  }[] = [];

  // 1. Add savings transactions (deposits & cash withdrawals)
  (db.transaksi_tabungan || []).forEach(tx => {
    if (tx.id_santri === child.id_santri) {
      walletLedger.push({
        id: tx.id_transaksi,
        tanggal: tx.tanggal,
        tipe: tx.tipe === 'DEPOSIT' ? 'MASUK' : 'KELUAR',
        kategori: tx.tipe === 'DEPOSIT' ? 'DEPOSIT' : 'PENARIKAN',
        nominal: tx.nominal,
        keterangan: tx.keterangan || (tx.tipe === 'DEPOSIT' ? 'Setor Saku / Kiriman Wali' : 'Tarik Tunai via Loket'),
      });
    }
  });

  // 2. Add cashless market purchases (which subtract from saldo_utama)
  (db.transaksi_market || []).forEach(tx => {
    if (tx.id_santri === child.id_santri && tx.metode_pembayaran === 'TABUNGAN') {
      const itemsList = tx.items.map(it => `${it.nama_produk} (x${it.qty})`).join(', ');
      walletLedger.push({
        id: tx.id_transaksi,
        tanggal: tx.tanggal,
        tipe: 'KELUAR',
        kategori: 'BELANJA_MARKET',
        nominal: tx.total,
        keterangan: `Belanja Market Cashless`,
        rincian: itemsList
      });
    }
  });

  // Sort by date descending
  walletLedger.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  // Filter the ledger
  const filteredLedger = walletLedger.filter(item => {
    const itemDate = item.tanggal.slice(0, 10);
    
    // Date ranges
    const matchesStart = ledgerStartDate ? itemDate >= ledgerStartDate : true;
    const matchesEnd = ledgerEndDate ? itemDate <= ledgerEndDate : true;
    
    // Category mapping
    let matchesCat = true;
    if (ledgerCategory === "MASUK") {
      matchesCat = item.tipe === 'MASUK';
    } else if (ledgerCategory === "KELUAR") {
      matchesCat = item.tipe === 'KELUAR';
    } else if (ledgerCategory === "BELANJA") {
      matchesCat = item.kategori === 'BELANJA_MARKET';
    } else if (ledgerCategory === "TARIK") {
      matchesCat = item.kategori === 'PENARIKAN';
    }

    // Search query
    const matchesSearch = ledgerSearch 
      ? item.keterangan.toLowerCase().includes(ledgerSearch.toLowerCase()) || 
        (item.rincian && item.rincian.toLowerCase().includes(ledgerSearch.toLowerCase())) ||
        item.id.toLowerCase().includes(ledgerSearch.toLowerCase())
      : true;

    return matchesStart && matchesEnd && matchesCat && matchesSearch;
  });

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const handleSendKeluhan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keluhanIsi.trim()) {
      showToast("Tulis pesan aspirasi terlebih dahulu!", "error");
      return;
    }

    setIsSubmitting(true);
    const parentName = child.nama_wali || `Wali ${child.nama_santri}`;

    const newKeluhan: Keluhan = {
      id_keluhan: `KLH-${Date.now().toString().slice(-3)}`,
      nama_wali: parentName,
      isi: keluhanIsi.trim(),
      status: "BARU",
      jawaban: "",
      tanggal: todayStr
    };

    const updatedDb: K_DB = {
      ...db,
      keluhan: [newKeluhan, ...(db.keluhan || [])]
    };

    await syncDbState(updatedDb);
    setIsSubmitting(false);
    setKeluhanIsi("");
    showToast("Aspirasi/Keluhan berhasil terkirim ke Kiai & Pengajar.", "success");
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Child Selector if multiple children exist */}
      {uniqueChildren.length > 1 && (
        <div className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <LucideIcon name="users" className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-100">Pilih Akun Anak</h4>
              <p className="text-[10px] text-emerald-500/60 font-medium">Klik untuk beralih data akademik, absensi, & saldo</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            {uniqueChildren.map(c => (
              <button
                key={c.id_santri}
                onClick={() => setSelectedChildId(c.id_santri)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  selectedChildId === c.id_santri
                    ? 'bg-amber-500 text-emerald-950 border-amber-500 shadow-md'
                    : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400 hover:bg-emerald-900/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${selectedChildId === c.id_santri ? 'bg-emerald-950 animate-pulse' : 'bg-emerald-500/50'}`}></span>
                {c.nama_santri} ({c.kelas})
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 1. PORTAL MAIN DASHBOARD */}
      {activeTab === 'wali-dashboard' && (
        <div className="space-y-6">
          
          {/* Welcome Card */}
          <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-[#021814]/80 to-[#03231e]/50">
            <div className="absolute top-0 right-0 p-8 text-7xl opacity-5 select-none pointer-events-none">👨‍👩‍👦</div>
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">Portal Wali Santri</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-100 mt-2">Ahlan Wa Sahlan, {child.nama_wali || `Wali dari ${child.nama_santri}`}</h2>
              <p className="text-xs text-emerald-400/80 mt-1 max-w-xl">Pantau perkembangan akhlak, hafalan Qur'an, kedisplinan sholat, dan saku digital putra-putri Anda secara langsung.</p>
            </div>
          </div>

          {/* Bank Transfer & Confirmation Card */}
          <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">Rekening Resmi Pembayaran & Kiriman Pondok</span>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <LucideIcon name="landmark" className="w-4 h-4 text-amber-400" />
                {db.settings.bank_name || "BANK SYARIAH INDONESIA (BSI)"} - <span className="font-mono text-amber-300">{db.settings.bank_account || "7144028990"}</span>
              </h4>
              <p className="text-xs text-emerald-500/70">A/N: {db.settings.bank_owner || "Yayasan Darul Ma'arif"}</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(db.settings.bank_account || "7144028990");
                  showToast("Nomor rekening disalin ke clipboard!", "success");
                }}
                className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LucideIcon name="copy" className="w-3.5 h-3.5" /> Salin Rekening
              </button>
              <a 
                href={`https://wa.me/${db.settings.phone?.replace(/[^0-9]/g, '') || '6281234567890'}?text=${encodeURIComponent(
                  `Assalamualaikum Pengurus Yayasan, saya Wali dari ${child.nama_santri} (NIS: ${child.id_santri}) ingin mengonfirmasi kiriman uang saku/tabungan untuk anak saya.\n\nNominal Kiriman: Rp \nTanggal Transfer: \n\nMohon bantuannya untuk dimasukkan ke dalam Saldo Tabungan santri. Terima kasih.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              >
                <LucideIcon name="send" className="w-3.5 h-3.5" /> Konfirmasi Kiriman (WA)
              </a>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Child Card */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-extrabold text-amber-400">
                  {child.nama_santri.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-100">{child.nama_santri}</h3>
                  <p className="text-xs text-emerald-500/60 font-medium">Kelas: {child.kelas}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">NIS: {child.id_santri}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-950/50 flex justify-between items-center text-xs">
                <span className="text-gray-400">Barcode Santri:</span>
                <span className="font-mono text-amber-400 font-bold">{child.barcode}</span>
              </div>
            </div>

            {/* Wallet Cashless */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono font-bold block">SALDO WETRUST CASHLESS</span>
                <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatRupiah(child.saldo_utama)}</h3>
              </div>
              <div className="pt-2 border-t border-emerald-950/50 flex justify-between items-center text-[10px] text-gray-400">
                <span>Limit Jajan Harian:</span>
                <span className="font-bold text-amber-400">{child.limit_jajan ? formatRupiah(child.limit_jajan) : 'Tanpa Batas'}</span>
              </div>
            </div>

            {/* Latest Presence State */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono font-bold block">PRESENSI KBM HARI INI</span>
                {(() => {
                  const todayRec = db.absensi_kelas?.find(a => a.tanggal === todayStr && a.id_santri === child.id_santri);
                  const status = todayRec?.status || "BELUM_ABSEN";
                  return (
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        status === "HADIR" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        status === "IZIN" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        status === "SAKIT" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        status === "ALFA" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-gray-800 text-gray-400 border-gray-700"
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                      {status === "HADIR" && (
                        <span className="text-[10px] text-gray-400 font-mono">Pukul 10:06:36</span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="pt-2 border-t border-emerald-950/50 flex justify-between items-center text-[10px] text-gray-400">
                <span>Kehadiran Sholat Hari Ini:</span>
                <span className="font-bold text-amber-400">
                  {db.absensi_sholat?.filter(s => s.tanggal === todayStr && s.id_santri === child.id_santri).length || 0} / 5 Waktu
                </span>
              </div>
            </div>

          </div>

          {/* Riwayat Pengeluaran & Transaksi Saldo */}
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-emerald-950/50 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <LucideIcon name="wallet" className="w-5 h-5 text-amber-400" />
                  Riwayat Pengeluaran & Mutasi Saldo Saku ({child.nama_santri})
                </h3>
                <p className="text-xs text-emerald-500/60 mt-0.5">Daftar lengkap uang keluar (belanja, penarikan) dan kiriman masuk untuk anak Anda.</p>
              </div>
              
              {/* Total Summary Mini Badge */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] text-gray-400">Total Terfilter:</span>
                <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {filteredLedger.length} Transaksi
                </span>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#021814]/40 p-3 rounded-xl border border-emerald-950/60 mb-4 text-xs">
              <div>
                <label className="block text-[9px] text-emerald-500/60 font-semibold mb-1 uppercase">Cari Transaksi</label>
                <div className="relative">
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Barang, keterangan..."
                    className="w-full bg-emerald-950/60 border border-emerald-900/60 text-[11px] pl-7 pr-2 py-1.5 rounded-lg text-emerald-400 focus:outline-none"
                  />
                  <LucideIcon name="search" className="w-3.5 h-3.5 text-emerald-500/40 absolute left-2 top-2.5" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] text-emerald-500/60 font-semibold mb-1 uppercase">Jenis Transaksi</label>
                <select
                  value={ledgerCategory}
                  onChange={(e) => setLedgerCategory(e.target.value as any)}
                  className="w-full bg-emerald-950/60 border border-emerald-900/60 text-[11px] px-2 py-1.5 rounded-lg text-amber-400 focus:outline-none"
                >
                  <option value="SEMUA">Semua Aliran</option>
                  <option value="KELUAR">Semua Pengeluaran</option>
                  <option value="BELANJA">Hanya Belanja Market</option>
                  <option value="TARIK">Hanya Tarik Tunai</option>
                  <option value="MASUK">Semua Kiriman/Setoran</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-emerald-500/60 font-semibold mb-1 uppercase">Dari Tanggal</label>
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="w-full bg-emerald-950/60 border border-emerald-900/60 text-[11px] px-2 py-1.5 rounded-lg text-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] text-emerald-500/60 font-semibold mb-1 uppercase">Sampai Tanggal</label>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="w-full bg-emerald-950/60 border border-emerald-900/60 text-[11px] px-2 py-1.5 rounded-lg text-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Ledger List */}
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
              <table className="w-full text-left border-collapse text-xs text-gray-200">
                <thead>
                  <tr className="border-b border-emerald-950/50 text-[10px] uppercase text-emerald-500/70">
                    <th className="pb-2 font-semibold">Waktu / ID TX</th>
                    <th className="pb-2 font-semibold">Jenis</th>
                    <th className="pb-2 font-semibold">Keterangan / Rincian</th>
                    <th className="pb-2 font-semibold text-right">Jumlah Perubahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/20">
                  {filteredLedger.map((item, idx) => {
                    const isIncome = item.tipe === 'MASUK';
                    return (
                      <tr key={item.id || idx} className="hover:bg-emerald-950/20 transition-colors border-b border-emerald-950/10">
                        <td className="py-2.5">
                          <span className="block text-[11px] font-medium text-gray-200">{item.tanggal}</span>
                          <span className="block text-[9px] font-mono text-emerald-500/50">{item.id}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                            item.kategori === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            item.kategori === 'PENARIKAN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {item.kategori.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="block font-medium text-gray-300">{item.keterangan}</span>
                          {item.rincian && (
                            <span className="block text-[10px] text-gray-400 mt-0.5 italic">{item.rincian}</span>
                          )}
                        </td>
                        <td className={`py-2.5 text-right font-mono font-bold text-[13px] ${isIncome ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isIncome ? '+' : '-'} {formatRupiah(item.nominal)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLedger.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500 italic">
                        Tidak ada riwayat transaksi saku / pengeluaran terdaftar yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Sections Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent Reports */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between gap-4">
              <div>
                <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Laporan Perkembangan Terakhir</h4>
                  <button onClick={() => switchTab('wali-laporan')} className="text-[10px] text-amber-400 hover:underline">Lihat Semua</button>
                </div>
                <div className="space-y-3">
                  {childReports.slice().reverse().slice(0, 2).map(rep => (
                    <div key={rep.id_laporan} className="p-3 bg-[#021c17]/60 border border-emerald-900/40 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/10 font-bold">{rep.tipe}</span>
                        <span className="text-[9px] text-gray-400 font-mono">{rep.tanggal}</span>
                      </div>
                      <h5 className="text-xs font-bold text-gray-200">{rep.subjek}</h5>
                      <p className="text-[11px] text-gray-300 line-clamp-2 italic">"{rep.isi}"</p>
                    </div>
                  ))}
                  {childReports.length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-6 italic">Belum ada laporan perkembangan masuk.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Aspirasi */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2 mb-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Kirim Aspirasi / Pertanyaan ke Ponpes</h4>
                  <button onClick={() => switchTab('wali-aspirasi')} className="text-[10px] text-amber-400 hover:underline">Riwayat</button>
                </div>
                <form onSubmit={handleSendKeluhan} className="space-y-3">
                  <textarea 
                    rows={3}
                    placeholder="Tulis saran, aduan, atau pertanyaan ke pengurus pesantren di sini..."
                    value={keluhanIsi}
                    onChange={(e) => setKeluhanIsi(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                  ></textarea>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all"
                  >
                    {isSubmitting ? "Mengirim..." : "Kirim Aspirasi"}
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. LAPORAN PERKEMBANGAN TAB */}
      {activeTab === 'wali-laporan' && (
        <div className="space-y-6">
          {/* Section 1: Academic & KBM reports */}
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <h2 className="text-base font-bold text-gray-200 border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="trending-up" className="w-5 h-5 text-amber-400" />
              Laporan Perkembangan Santri ({child.nama_santri})
            </h2>
            <p className="text-xs text-gray-400 mt-1">Daftar laporan perkembangan akademik individual maupun laporan aktivitas kelas anak Anda oleh asatidzah.</p>

            <div className="space-y-4 mt-5">
              {childReports.slice().reverse().map(rep => (
                <div key={rep.id_laporan} className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        rep.tipe === "Kelas" 
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        LAPORAN {rep.tipe.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{rep.tanggal}</span>
                    </div>
                    <span className="text-[10px] text-emerald-500/60 font-mono">ID: {rep.id_laporan}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-200">{rep.subjek}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap mt-1 italic p-3 bg-emerald-950/30 rounded-lg">
                      "{rep.isi}"
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-emerald-500/60 pt-2 border-t border-emerald-950/50">
                    <span>Sasaran: <strong className="text-emerald-400">{rep.sasaran}</strong></span>
                    <span>Dilaporkan Oleh: <strong>{rep.pengirim}</strong></span>
                  </div>
                </div>
              ))}

              {childReports.length === 0 && (
                <div className="text-center py-12 text-gray-500 italic">
                  Belum ada laporan perkembangan untuk {child.nama_santri}.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Discipline and Security Violations */}
          <div className="glass-card p-5 rounded-2xl border border-red-500/15">
            <h2 className="text-base font-bold text-red-400 border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="gavel" className="w-5 h-5 text-red-500" />
              Buku Catatan Kedisiplinan & Pelanggaran Santri
            </h2>
            <p className="text-xs text-gray-400 mt-1">Daftar catatan kedisiplinan dan hukuman sanksi mendidik yang dicatat oleh Pos Komando Keamanan Pesantren.</p>

            <div className="space-y-4 mt-5">
              {childViolations.slice().reverse().map(v => (
                <div key={v.id_pelanggaran} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3 relative">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        v.kategori === "BERAT" 
                          ? "bg-red-500/20 text-red-400 border-red-500/30" 
                          : v.kategori === "SEDANG"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}>
                        PELANGGARAN {v.kategori}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{v.tanggal}</span>
                    </div>
                    <span className="text-[10px] text-red-400/60 font-mono">ID: {v.id_pelanggaran}</span>
                  </div>

                  <div>
                    <h4 className="text-xs text-gray-400 uppercase font-bold">Detail Kejadian Pelanggaran:</h4>
                    <p className="text-xs text-gray-200 mt-1 leading-relaxed bg-[#1b0a0a]/50 p-2.5 rounded-lg border border-red-950/30">
                      {v.detail_pelanggaran}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-red-950/20 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                    <div>
                      <span className="text-red-400 font-bold">Sanksi / Hukuman Keamanan: </span>
                      <strong className="text-white underline">{v.hukuman}</strong>
                    </div>
                    <span className="text-[10px] text-emerald-500/50">Dicatat oleh: {v.dicatat_oleh}</span>
                  </div>
                </div>
              ))}

              {childViolations.length === 0 && (
                <div className="text-center py-12 text-emerald-500/40 italic text-xs">
                  Alhamdulillah, tidak ada catatan pelanggaran terdaftar untuk {child.nama_santri}.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Spending Overrides & Permits */}
          <div className="glass-card p-5 rounded-2xl border border-yellow-500/15">
            <h2 className="text-base font-bold text-yellow-400 border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="unlock" className="w-5 h-5 text-yellow-500" />
              Histori Dispensasi Izin Jajan & Belanja Lebih
            </h2>
            <p className="text-xs text-gray-400 mt-1">Daftar dispensasi batas limit belanja di Toko Market / penarikan uang saku di Loket Tabungan yang disetujui oleh Pos Keamanan.</p>

            <div className="space-y-4 mt-5">
              {childAllowances.slice().reverse().map(i => {
                const today = new Date().toISOString().slice(0, 10);
                const isActive = i.tanggal === today;
                return (
                  <div key={i.id_izin_khusus} className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          IZIN {i.tipe_izin}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{i.tanggal}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                        isActive 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-gray-800 text-gray-500 border-gray-700"
                      }`}>
                        {isActive ? "AKTIF HARI INI" : "SUDAH KADALUARSA"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-yellow-950/20 p-2 rounded-lg border border-yellow-950/30">
                      <span className="text-xs text-gray-300">Penyesuaian Jatah Saku/Belanja:</span>
                      <strong className="text-xs text-amber-400 font-mono">
                        {i.is_no_limit ? "BEBAS BEBAS BELANJA (NO LIMIT)" : formatRupiah(i.nominal_disetujui)}
                      </strong>
                    </div>

                    <div className="text-xs">
                      <span className="text-gray-400">Keperluan Izin: </span>
                      <strong className="text-gray-200">"{i.keterangan}"</strong>
                    </div>

                    <span className="text-[10px] text-emerald-500/50 block text-right">Otorisasi oleh: {i.dicatat_oleh}</span>
                  </div>
                );
              })}

              {childAllowances.length === 0 && (
                <div className="text-center py-12 text-emerald-500/40 italic text-xs">
                  Belum ada surat dispensasi khusus yang diterbitkan Pos Keamanan untuk {child.nama_santri}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ABSENSI CALENDAR TAB */}
      {activeTab === 'wali-absensi' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* KBM Attendance */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-2">
                <LucideIcon name="scan" className="w-5 h-5 text-emerald-400" />
                Histori Absensi Kelas (KBM)
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                {childClassAttendance.slice().reverse().map((a, idx) => (
                  <div key={idx} className="p-3 bg-emerald-950/20 border border-emerald-500/5 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono block">{a.tanggal}</span>
                      <span className="text-xs text-gray-200 font-medium">Kelas {a.kelas}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        a.status === "HADIR" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        a.status === "IZIN" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        a.status === "SAKIT" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
                {childClassAttendance.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-8 italic">Belum ada riwayat absensi kelas.</p>
                )}
              </div>
            </div>

            {/* Sholat Attendance */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-2">
                <LucideIcon name="activity" className="w-5 h-5 text-amber-400" />
                Histori Kehadiran Sholat Jamaah
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                {childSholatAttendance.slice().reverse().map((a, idx) => {
                  const pName = db.sholat_rules?.find(s => s.id_sholat === a.sholat)?.nama || a.sholat;
                  return (
                    <div key={idx} className="p-3 bg-emerald-950/20 border border-emerald-500/5 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-gray-400 font-mono block">{a.tanggal}</span>
                        <span className="text-xs text-gray-200 font-medium">{pName}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        a.status === "TEPAT_WAKTU" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        a.status === "MASBUQ" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
                {childSholatAttendance.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-8 italic">Belum ada riwayat absensi sholat.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. ASPIRASI WALI HISTORY TAB */}
      {activeTab === 'wali-aspirasi' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <h2 className="text-base font-bold text-gray-200 border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-2">
              <LucideIcon name="message-square" className="w-5 h-5 text-amber-400" />
              Riwayat Aspirasi & Jawaban Ponpes
            </h2>

            <div className="space-y-4">
              {childComplaints.slice().reverse().map(kel => (
                <div key={kel.id_keluhan} className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded">
                        ID: {kel.id_keluhan}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">Pengirim: {kel.nama_wali}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      kel.status === "SELESAI" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {kel.status === "SELESAI" ? "DIJAWAB" : "PROSES"}
                    </span>
                  </div>

                  <p className="p-3 bg-[#021814]/60 border border-emerald-500/5 rounded-lg text-xs leading-relaxed text-gray-300">
                    "{kel.isi}"
                  </p>

                  {kel.status === "SELESAI" && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs space-y-1">
                      <span className="text-[9px] text-amber-400 font-extrabold uppercase tracking-widest block">TANGGAPAN PENGASUH / USTADZ:</span>
                      <p className="text-gray-200 italic font-medium leading-relaxed">"{kel.jawaban}"</p>
                    </div>
                  )}
                </div>
              ))}

              {childComplaints.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-12 italic">Belum ada aspirasi terdaftar dari Anda.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. KONTAK PENGURUS TAB */}
      {activeTab === 'wali-kontak' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <h2 className="text-base font-bold text-gray-200 border-b border-emerald-950/50 pb-2 mb-4 flex items-center gap-2">
              <LucideIcon name="phone" className="w-5 h-5 text-amber-400" />
              Kontak Darurat & Pengurus Pesantren
            </h2>
            <p className="text-xs text-emerald-500/70 mb-6">Wali santri dapat langsung menghubungi staff atau pengajar pesantren bila ada keperluan mendesak atau koordinasi penting.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Official Staff Emergency Contacts */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Kontak Layanan Utama</h3>
                
                {/* Kontak Yayasan */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-wider block">YAYASAN PESANTREN</span>
                    <h4 className="text-xs font-extrabold text-white">Layanan Umum & Administrasi</h4>
                    <span className="text-[10px] font-mono text-amber-500 block">{db.settings.phone || "081234567890"}</span>
                  </div>
                  <a 
                    href={`https://wa.me/${db.settings.phone?.replace(/[^0-9]/g, '') || '6281234567890'}?text=${encodeURIComponent("Assalamualaikum Pengurus Yayasan, saya Wali dari " + child.nama_santri + " ingin berkomunikasi terkait...")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                  >
                    <LucideIcon name="message-square" className="w-4 h-4" /> Hubungi
                  </a>
                </div>

                {/* Kontak Tabungan */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-wider block">LOKET TABUNGAN / BENDAHARA</span>
                    <h4 className="text-xs font-extrabold text-white">Layanan Keuangan, Saku, & Kartu</h4>
                    <span className="text-[10px] font-mono text-amber-500 block">082345678901</span>
                  </div>
                  <a 
                    href={`https://wa.me/6282345678901?text=${encodeURIComponent("Assalamualaikum Bendahara Tabungan, saya Wali dari " + child.nama_santri + " ingin berkomunikasi terkait saldo/limit...")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                  >
                    <LucideIcon name="message-square" className="w-4 h-4" /> Hubungi
                  </a>
                </div>

                {/* Kontak Layanan Pengajar / Guru */}
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/10 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-wider block">KANTOR ASATIDZAH / PENGAJAR</span>
                    <h4 className="text-xs font-extrabold text-white">Layanan KBM & Kedisplinan Santri</h4>
                    <span className="text-[10px] font-mono text-amber-500 block">083456789012</span>
                  </div>
                  <a 
                    href={`https://wa.me/6283456789012?text=${encodeURIComponent("Assalamualaikum Pengurus Asatidzah, saya Wali dari " + child.nama_santri + " ingin berkomunikasi terkait KBM/Kedisplinan...")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                  >
                    <LucideIcon name="message-square" className="w-4 h-4" /> Hubungi
                  </a>
                </div>

              </div>

              {/* Dynamic Teachers list (Asatidzah Kontak) */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">Kontak Asatidzah / Wali Kelas</h3>
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {db.asatidzah_kontak && db.asatidzah_kontak.length > 0 ? (
                    db.asatidzah_kontak.map(g => (
                      <div key={g.id_guru} className="p-3.5 bg-emerald-950/20 border border-emerald-500/5 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-amber-500 text-xs">
                            {g.nama.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-100">{g.nama}</h4>
                            <p className="text-[9px] text-emerald-500/60 font-medium">{g.jabatan}</p>
                            <span className="text-[9px] text-gray-400 font-mono block mt-0.5">{g.no_wa}</span>
                          </div>
                        </div>
                        <a 
                          href={`https://wa.me/${g.no_wa.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Assalamualaikum Ustadz/Ustadzah " + g.nama + ", saya Wali dari " + child.nama_santri + " ingin berkomunikasi...")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-emerald-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          title="Hubungi via WhatsApp"
                        >
                          <LucideIcon name="message-square" className="w-4 h-4" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-8 italic">Tidak ada daftar pengajar aktif.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
