import React, { useState } from 'react';
import { K_DB, Santri, TransaksiTabungan } from '../types';
import { LucideIcon } from './LucideIcon';
import { LiveViewfinder } from './LiveViewfinder';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface TabunganPanelProps {
  db: K_DB;
  activeTab: string;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, callback: (yes: boolean) => void) => void;
  switchTab: (tabId: string) => void;
}

export function TabunganPanel({
  db,
  activeTab,
  syncDbState,
  showToast,
  showConfirm,
  switchTab
}: TabunganPanelProps) {
  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  // --- TABUNGAN LOCAL SEARCH & FILTERS STATE ---
  const [mutationSearch, setMutationSearch] = useState("");
  const [mutationTypeFilter, setMutationTypeFilter] = useState("ALL");
  const [limitSearch, setLimitSearch] = useState("");
  const [loketSearch, setLoketSearch] = useState("");

  // --- TRANSACTIONS & MODALS STATE ---
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [txType, setTxType] = useState<"DEPOSIT" | "PENARIKAN">("DEPOSIT");
  const [txAmount, setTxAmount] = useState<number | "">("");
  const [txKeterangan, setTxKeterangan] = useState("");

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<"DEPOSIT" | "PENARIKAN" | "LOKET_SCAN">("LOKET_SCAN");

  // Saving Slip Preview State
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [previewTx, setPreviewTx] = useState<TransaksiTabungan | null>(null);
  const [previewBalance, setPreviewBalance] = useState(0);

  // Custom Limit Modal State
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const [limitSantri, setPreviewLimitSantri] = useState<Santri | null>(null);
  const [customLimitVal, setCustomLimitVal] = useState(25000);
  const [customMarketLimitVal, setCustomMarketLimitVal] = useState(50000);

  // --- RFID/SCAN SIMULATOR TRIGGER ---
  const triggerScan = (mode: "DEPOSIT" | "PENARIKAN" | "LOKET_SCAN") => {
    setScannerMode(mode);
    setIsScannerOpen(true);
  };

  const handleScanSelect = (s: Santri) => {
    setSelectedSantri(s);
    setIsScannerOpen(false);
    showToast(`Pindaian kartu terbaca: ${s.barcode}`, "success");
    if (scannerMode === "DEPOSIT") {
      setTxType("DEPOSIT");
    } else if (scannerMode === "PENARIKAN") {
      setTxType("PENARIKAN");
    }
  };

  // --- SUBMIT TRANSACTION ---
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast("Kartu santri belum dipindai!", "error");
      return;
    }

    const amountNum = Number(txAmount);
    if (!amountNum || amountNum <= 0) {
      showToast("Nominal transaksi tidak boleh kosong!", "error");
      return;
    }

    if (txType === 'PENARIKAN') {
      if (selectedSantri.saldo_utama < amountNum) {
        showToast(`Uang saku ${selectedSantri.nama_santri} tidak mencukupi!`, "error");
        return;
      }

      // Enforce Daily Withdrawal Limit
      const today = new Date().toISOString().slice(0, 10);
      const todayWithdrawals = db.transaksi_tabungan
        .filter(t => t.id_santri === selectedSantri.id_santri && t.tipe === "PENARIKAN" && t.tanggal.startsWith(today))
        .reduce((sum, t) => sum + t.nominal, 0);

      const activeJajanIzin = (db.izin_keamanan || [])
        .find(iz => iz.id_santri === selectedSantri.id_santri && iz.tipe_izin === "JAJAN" && iz.tanggal === today);

      const standardLimit = selectedSantri.limit_jajan || 25000;
      const allowedToday = activeJajanIzin ? activeJajanIzin.nominal_disetujui : standardLimit;
      const isOverride = !!activeJajanIzin;

      if (todayWithdrawals + amountNum > allowedToday) {
        showToast(
          `Gagal! Penarikan sebesar ${formatRupiah(amountNum)} melebihi sisa jatah jajan hari ini (Batas Harian: ${formatRupiah(allowedToday)}${isOverride ? " [Izin Keamanan]" : ""}, Sudah diambil hari ini: ${formatRupiah(todayWithdrawals)}). Hubungi Admin Keamanan jika ingin mendapatkan Izin Ambil Uang Lebih.`,
          "error"
        );
        return;
      }
    }

    const confirmMsg = txType === 'DEPOSIT'
      ? `Lakukan deposit saku sebesar ${formatRupiah(amountNum)} untuk ${selectedSantri.nama_santri}?`
      : `Lakukan penarikan uang saku sebesar ${formatRupiah(amountNum)} untuk ${selectedSantri.nama_santri}?`;

    showConfirm(confirmMsg, async (yes) => {
      if (yes) {
        const targetSantri = db.santri.find(x => x.id_santri === selectedSantri.id_santri);
        if (!targetSantri) return;

        const newBalance = txType === "DEPOSIT" 
          ? targetSantri.saldo_utama + amountNum 
          : targetSantri.saldo_utama - amountNum;

        // Update target santri balance
        const updatedSantri = db.santri.map(x => {
          if (x.id_santri === selectedSantri.id_santri) {
            return { ...x, saldo_utama: newBalance };
          }
          return x;
        });

        // Create transaction payload
        const newTxId = "TX-TAB-0" + (db.transaksi_tabungan.length + 1 + Math.floor(Math.random() * 100));
        const timestamp = new Date().toISOString().slice(0, 10) + " " + new Date().toTimeString().slice(0, 5);

        const newTx: TransaksiTabungan = {
          id_transaksi: newTxId,
          id_santri: selectedSantri.id_santri,
          nama_santri: selectedSantri.nama_santri,
          kelas: selectedSantri.kelas,
          tipe: txType,
          nominal: amountNum,
          tanggal: timestamp,
          keterangan: txKeterangan || (txType === "DEPOSIT" ? "Setoran loket" : "Penarikan tunai loket")
        };

        const updatedDb = {
          ...db,
          santri: updatedSantri,
          transaksi_tabungan: [newTx, ...db.transaksi_tabungan]
        };

        await syncDbState(updatedDb);

        // Update selected local santri view
        setSelectedSantri({
          ...selectedSantri,
          saldo_utama: newBalance
        });

        // Reset inputs
        setTxAmount("");
        setTxKeterangan("");

        showToast("Proses penyesuaian saldo uang saku santri Berhasil!", "success");

        // Open transaction slip modal automatically
        setPreviewTx(newTx);
        setPreviewBalance(newBalance);
        setIsSlipOpen(true);
      }
    });
  };

  // --- LIMIT MANAGERS ---
  const saveQuickLimit = async (s: Santri, amount: number) => {
    const updatedSantri = db.santri.map(x => {
      if (x.id_santri === s.id_santri) {
        return { ...x, limit_jajan: amount };
      }
      return x;
    });

    await syncDbState({
      ...db,
      santri: updatedSantri
    });
    showToast(`Limit harian jajan ${s.nama_santri} diubah menjadi ${formatRupiah(amount)}!`, "success");
  };

  const openCustomLimit = (s: Santri) => {
    setPreviewLimitSantri(s);
    setCustomLimitVal(s.limit_jajan || 25000);
    setCustomMarketLimitVal(s.limit_belanja || 50000);
    setIsLimitOpen(true);
  };

  const submitCustomLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitSantri) return;

    if (customLimitVal < 0 || customMarketLimitVal < 0) {
      showToast("Aturan limit tidak boleh minus!", "error");
      return;
    }

    const updatedSantri = db.santri.map(x => {
      if (x.id_santri === limitSantri.id_santri) {
        return { ...x, limit_jajan: customLimitVal, limit_belanja: customMarketLimitVal };
      }
      return x;
    });

    await syncDbState({
      ...db,
      santri: updatedSantri
    });

    setIsLimitOpen(false);
    showToast(`Sukses mengubah limit jajan kustom menjadi ${formatRupiah(customLimitVal)} & limit belanja menjadi ${formatRupiah(customMarketLimitVal)} untuk ${limitSantri.nama_santri}!`, "success");
  };

  // --- TAB RENDER CONDITIONS ---
  if (activeTab === 'tabungan-dashboard') {
    const totalSaku = db.santri.reduce((sum, s) => sum + (Number(s.saldo_utama) || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    
    const depositToday = db.transaksi_tabungan
      .filter(t => t.tanggal.startsWith(today) && t.tipe === 'DEPOSIT')
      .reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);

    const tarikToday = db.transaksi_tabungan
      .filter(t => t.tanggal.startsWith(today) && t.tipe === 'PENARIKAN')
      .reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);

    return (
      <section id="tab-tabungan-dashboard" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
          <h2 className="text-base font-bold text-gray-100">Assalamualaikum, Ust. Jafar</h2>
          <p className="text-xs text-emerald-500/80 mt-1">Layanan administrasi keuangan saku santri. Kelola setoran (deposit), penarikan tunai harian, serta limitasi jajan kantin secara real-time.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <LucideIcon name="users" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-500/60 uppercase block">Total Santri</span>
              <span className="text-base font-bold text-gray-200 block">{db.santri.length}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <LucideIcon name="wallet" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-500/60 uppercase block">Total Saku Santri</span>
              <span className="text-sm font-bold text-emerald-400 block">{formatRupiah(totalSaku)}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <LucideIcon name="arrow-up-right" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-500/60 uppercase block">Deposit Hari Ini</span>
              <span className="text-sm font-bold text-amber-400 block">{formatRupiah(depositToday)}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
              <LucideIcon name="arrow-down-left" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-500/60 uppercase block">Tarik Tunai Hari Ini</span>
              <span className="text-sm font-bold text-red-400 block">{formatRupiah(tarikToday)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4 justify-between">
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Aksi Cepat Loket Tabungan</h3>
              <p className="text-xs text-emerald-500/80 leading-relaxed mb-4">Mulai proses deposit atau tarik tunai santri secara aman dengan menembak ID Barcode kartu fisik mereka.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { switchTab('tabungan-loket'); triggerScan('DEPOSIT'); }} className="py-3 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                <LucideIcon name="arrow-up-circle" className="w-4 h-4" /> Deposit Saku
              </button>
              <button onClick={() => { switchTab('tabungan-loket'); triggerScan('PENARIKAN'); }} className="py-3 bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 text-red-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                <LucideIcon name="arrow-down-circle" className="w-4 h-4" /> Tarik Tunai
              </button>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Aktivitas Tabungan Terakhir</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
              {db.transaksi_tabungan.slice().reverse().slice(0, 4).map((log, index) => {
                const isDeposit = log.tipe === "DEPOSIT";
                return (
                  <div key={index} className="p-3 bg-emerald-950/40 rounded-xl flex justify-between items-center text-xs border border-emerald-900/30">
                    <div>
                      <span className="font-bold text-gray-200 block">{log.nama_santri}</span>
                      <span className="text-[9px] text-emerald-500/50 block">{log.keterangan}</span>
                    </div>
                    <span className={`font-bold ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isDeposit ? '+' : '-'} {formatRupiah(log.nominal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (activeTab === 'tabungan-loket') {
    const query = loketSearch.toLowerCase().trim();
    const matchedSantriList = db.santri.filter(s => 
      s.nama_santri.toLowerCase().includes(query) || 
      s.kelas.toLowerCase().includes(query) || 
      s.barcode.toLowerCase().includes(query) ||
      (s.alamat && s.alamat.toLowerCase().includes(query))
    );

    const selectedSantriHistory = selectedSantri
      ? db.transaksi_tabungan.filter(t => t.id_santri === selectedSantri.id_santri)
      : [];

    const handleSelectSantriFromScanner = (s: Santri) => {
      setSelectedSantri(s);
      showToast(`Kartu santri ${s.nama_santri} berhasil ter-pindai!`, "success");
    };

    return (
      <section id="tab-tabungan-loket" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-1 font-sans">Loket Transaksi Uang Saku</h3>
          <p className="text-xs text-emerald-500/70">Pindai kartu santri melalui pemindai kamera depan aktif atau cari secara manual untuk mengelola setoran & penarikan saku.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Always-On Camera Viewfinder & Manual Search */}
          <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="scan-line" className="w-4 h-4 text-amber-500" /> Pemindai Kamera Depan
            </h4>

            {/* Inline Always-on Barcode Scanner */}
            <div className="relative group">
              <LiveBarcodeScanner
                title="Pemindai Kartu Tabungan"
                subtitle="Dekatkan kartu barcode/ID Card santri"
                isInline={true}
                onScanSuccess={(decodedText) => {
                  const found = db.santri.find(s => s.barcode.toLowerCase() === decodedText.trim().toLowerCase());
                  if (found) {
                    handleScanSelect(found);
                  } else {
                    showToast(`Barcode "${decodedText}" tidak terdaftar di sistem!`, "error");
                  }
                }}
                dummyOptions={db.santri.map(s => ({
                  label: s.nama_santri,
                  code: s.barcode,
                  subLabel: s.kelas
                }))}
              />
            </div>

            {/* Manual Search Section */}
            <div className="flex flex-col gap-2">
              <label className="block text-emerald-500/80 text-xs font-bold">Pencarian Santri Manual</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-emerald-500/50 text-xs">🔍</span>
                <input 
                  type="text" 
                  value={loketSearch}
                  onChange={(e) => setLoketSearch(e.target.value)}
                  placeholder="Cari nama, kelas, atau barcode..." 
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-xs text-white focus:outline-none focus:border-amber-500/80"
                />
              </div>

              {/* Scrollable search results */}
              <div className="max-h-[160px] overflow-y-auto no-scrollbar border border-emerald-950/60 rounded-xl bg-emerald-950/10 p-1.5 flex flex-col gap-1">
                {matchedSantriList.length === 0 ? (
                  <p className="text-[10px] text-emerald-500/40 text-center py-4">Tidak ada santri yang cocok.</p>
                ) : (
                  matchedSantriList.map(s => {
                    const isSelected = selectedSantri?.id_santri === s.id_santri;
                    return (
                      <button
                        key={s.id_santri}
                        type="button"
                        onClick={() => handleSelectSantriFromScanner(s)}
                        className={`w-full p-2 rounded-lg text-left transition-all flex justify-between items-center ${isSelected ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-emerald-950/30 hover:bg-emerald-950/60 border border-transparent'}`}
                      >
                        <div className="truncate">
                          <span className="text-xs font-bold text-gray-200 block truncate">{s.nama_santri}</span>
                          <span className="text-[10px] text-amber-500/70 font-semibold">
                            {s.kelas}
                            {s.alamat && ` • 📍 ${s.alamat}`}
                          </span>
                        </div>
                        <span className="text-[9px] bg-emerald-950 border border-emerald-900/60 px-1.5 py-0.5 rounded font-mono text-emerald-400 shrink-0">{s.barcode}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Selected Student Profile & Transaction History */}
          <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="user-check" className="w-4 h-4 text-emerald-500" /> Profil & Riwayat Transaksi
            </h4>

            {!selectedSantri ? (
              <div className="py-16 text-center flex flex-col items-center justify-center text-emerald-500/40">
                <span className="text-3xl mb-2 animate-pulse">📇</span>
                <p className="text-[11px]">Gunakan kamera di kiri atau ketik di kolom pencarian manual untuk memuat data santri.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Profile card */}
                <div className="flex items-center gap-3 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20">
                  <img src={selectedSantri.foto_profil || "https://placehold.co/150x200/022c22/f59e0b?text=SNT"} alt="Foto Santri" className="w-12 h-14 rounded-lg object-cover border border-amber-500/20 shrink-0" />
                  <div className="truncate">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wide truncate">{selectedSantri.nama_santri}</h5>
                    <p className="text-[10px] text-amber-400 font-semibold">
                      {selectedSantri.kelas}
                      {selectedSantri.alamat && ` • 📍 ${selectedSantri.alamat}`}
                    </p>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono inline-block mt-1">ID: {selectedSantri.barcode}</span>
                  </div>
                </div>

                {/* Balances */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-emerald-950/50 rounded-xl border border-emerald-900/30">
                    <span className="text-[8px] text-emerald-500/60 block uppercase font-mono">Saldo Utama</span>
                    <span className="text-xs font-bold text-emerald-400">{formatRupiah(selectedSantri.saldo_utama)}</span>
                  </div>
                  <div className="p-2 bg-emerald-950/50 rounded-xl border border-emerald-900/30">
                    <span className="text-[8px] text-emerald-500/60 block uppercase font-mono">Limit Jajan Harian</span>
                    <span className="text-xs font-bold text-amber-400">
                      {(() => {
                        const today = new Date().toISOString().slice(0, 10);
                        const activeJajanIzin = (db.izin_keamanan || []).find(iz => iz.id_santri === selectedSantri.id_santri && iz.tipe_izin === "JAJAN" && iz.tanggal === today);
                        if (activeJajanIzin) {
                          return (
                            <span className="text-yellow-400 animate-pulse">
                              Rp {activeJajanIzin.nominal_disetujui.toLocaleString()} *
                            </span>
                          );
                        }
                        return formatRupiah(selectedSantri.limit_jajan || 25000);
                      })()}
                    </span>
                  </div>
                </div>

                {/* Overridden Alert Notification */}
                {(() => {
                  const today = new Date().toISOString().slice(0, 10);
                  const activeJajanIzin = (db.izin_keamanan || []).find(iz => iz.id_santri === selectedSantri.id_santri && iz.tipe_izin === "JAJAN" && iz.tanggal === today);
                  if (activeJajanIzin) {
                    return (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 font-bold">
                          <span>⚠️</span>
                          <span>IZIN KHUSUS KEAMANAN AKTIF</span>
                        </div>
                        <p className="leading-tight">
                          Diberikan jatah jajan khusus <strong>Rp {activeJajanIzin.nominal_disetujui.toLocaleString()}</strong> hari ini.
                        </p>
                        <span className="text-[9px] opacity-75 mt-0.5">• Keterangan: {activeJajanIzin.keterangan}</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* HISTORIC TRANSACTIONS LIST */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <span className="text-[10px] font-bold text-emerald-500/80 block">Mutasi Buku Tabungan Santri</span>
                  <div className="max-h-[140px] overflow-y-auto no-scrollbar border border-emerald-950/60 rounded-xl bg-emerald-950/20 p-1.5 flex flex-col gap-1.5">
                    {selectedSantriHistory.length === 0 ? (
                      <p className="text-[9px] text-emerald-500/40 text-center py-6">Belum ada riwayat transaksi.</p>
                    ) : (
                      selectedSantriHistory.slice().reverse().map(tx => {
                        const isDep = tx.tipe === "DEPOSIT";
                        return (
                          <div key={tx.id_transaksi} className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-900/10 flex justify-between items-center text-[9px]">
                            <div className="truncate">
                              <span className="font-bold text-gray-200 block truncate">{tx.keterangan}</span>
                              <span className="text-[8px] text-emerald-500/40 block font-mono">{tx.tanggal}</span>
                            </div>
                            <span className={`font-mono font-extrabold shrink-0 pl-2 ${isDep ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isDep ? '+' : '-'}{formatRupiah(tx.nominal)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Transaction Input */}
          <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="coins" className="w-4 h-4 text-amber-500" /> Form Mutasi Saku
            </h4>

            <form onSubmit={handleTransactionSubmit} className="space-y-4 text-xs text-gray-300">
              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-bold">Jenis Transaksi Keuangan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setTxType("DEPOSIT")}
                    className={`py-2 rounded-xl font-bold border text-[11px] transition-all ${txType === "DEPOSIT" ? "text-emerald-500 border-emerald-500 bg-emerald-500/10" : "text-emerald-500 border-emerald-800 hover:bg-emerald-950/30"}`}
                  >
                    📥 Setoran (Deposit)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTxType("PENARIKAN")}
                    className={`py-2 rounded-xl font-bold border text-[11px] transition-all ${txType === "PENARIKAN" ? "text-red-500 border-red-500 bg-red-500/10" : "text-red-500 border-red-950 hover:bg-red-950/30"}`}
                  >
                    📤 Penarikan Tunai
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1 font-bold">Nominal Transaksi (Rp)</label>
                <input 
                  type="number" 
                  required 
                  value={txAmount}
                  onChange={(e) => setTxAmount(Number(e.target.value) || "")}
                  placeholder="Rp..." 
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
                
                {/* Quick Amount Selections */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[10000, 20000, 50000, 100000].map(amt => (
                    <button 
                      key={amt}
                      type="button" 
                      onClick={() => setTxAmount(amt)}
                      className="py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-900/40 rounded-lg text-[9px] font-bold"
                    >
                      {amt / 1000}K
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1">Catatan Keterangan / Sumber Dana</label>
                <input 
                  type="text" 
                  required 
                  value={txKeterangan}
                  onChange={(e) => setTxKeterangan(e.target.value)}
                  placeholder="Contoh: Titipan Uang Saku Bulanan" 
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white focus:border-amber-500/50"
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5">
                <LucideIcon name="check-circle-2" className="w-4 h-4" /> Proses Mutasi Tabungan
              </button>
            </form>
          </div>
        </div>

        {/* Scan Simulator Modal */}
        {isScannerOpen && (
          <LiveBarcodeScanner
            title="Pemindaian Kartu Tabungan"
            subtitle="Arahkan kamera ke barcode ID Card santri"
            onScanSuccess={(decodedText) => {
              const found = db.santri.find(s => s.barcode.toLowerCase() === decodedText.trim().toLowerCase());
              if (found) {
                handleScanSelect(found);
              } else {
                showToast(`Barcode "${decodedText}" tidak terdaftar di sistem!`, "error");
                setIsScannerOpen(false);
              }
            }}
            onClose={() => setIsScannerOpen(false)}
            dummyOptions={db.santri.map(s => ({
              label: s.nama_santri,
              code: s.barcode,
              subLabel: s.kelas
            }))}
          />
        )}

        {/* Saving Slip Dialog */}
        {isSlipOpen && previewTx && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="bg-amber-50 text-emerald-950 p-6 rounded-2xl shadow-2xl relative font-mono text-xs flex flex-col gap-4 border border-amber-200 w-full">
              <div id="print-area-saving-slip-wrapper" className="w-full">
                <div id="print-area-saving-slip" className="p-3 bg-white text-black rounded border border-gray-300 w-full">
                  <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wide leading-tight">YAYASAN {(db.settings.nama_pesantren || "PONPESQU").toUpperCase()} DARUL MA'ARIF</h2>
                    <p className="text-[8px] text-gray-500 leading-none mt-1">LOKET TABUNGAN SAKU CASHLESS</p>
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-2">
                      {previewTx.tipe === "DEPOSIT" ? "SLIP SETORAN TABUNGAN" : "SLIP PENARIKAN TUNAI"}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] my-3 leading-relaxed">
                    <div className="flex justify-between"><span>No. Referensi:</span><span className="font-bold">{previewTx.id_transaksi}</span></div>
                    <div className="flex justify-between"><span>Tanggal/Waktu:</span><span>{previewTx.tanggal}</span></div>
                    <div className="flex justify-between"><span>Nama Santri:</span><span className="font-bold uppercase">{previewTx.nama_santri}</span></div>
                    <div className="flex justify-between"><span>Kelas Santri:</span><span>{previewTx.kelas}</span></div>
                    <div className="flex justify-between"><span>Keterangan:</span><span className="italic">{previewTx.keterangan}</span></div>
                  </div>

                  <div className="border-t border-b border-dashed border-gray-400 py-2 my-2 text-center">
                    <span className="text-[9px] text-gray-500 block uppercase tracking-wider">
                      {previewTx.tipe === "DEPOSIT" ? "Jumlah Setoran" : "Jumlah Penarikan"}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-950 block">{formatRupiah(previewTx.nominal)}</span>
                  </div>

                  <div className="flex justify-between text-[10px] mt-2">
                    <span>Saldo Akhir Saku:</span>
                    <span className="font-bold text-emerald-800">{formatRupiah(previewBalance)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[9px] mt-4 pt-2 border-t border-dashed border-gray-400">
                    <div className="text-center w-20">
                      <span className="block">Santri</span>
                      <div className="h-6"></div>
                      <span className="border-t border-black pt-1 block font-bold text-[8px]">{previewTx.nama_santri.split(' ')[0]}</span>
                    </div>
                    <div className="text-center w-24 font-mono text-[6px] text-gray-500">
                      *Simpan bukti ini sebagai tanda terima sah*
                    </div>
                    <div className="text-center w-20">
                      <span className="block">Bendahara</span>
                      <div className="h-6"></div>
                      <span className="border-t border-black pt-1 block font-bold text-[8px]">Ustadz Jafar</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setIsSlipOpen(false)} className="w-1/2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all">Tutup</button>
                <button onClick={() => window.print()} className="w-1/2 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1">
                  <LucideIcon name="printer" className="w-3.5 h-3.5" /> Cetak Bukti
                </button>
              </div>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'tabungan-riwayat') {
    const q = mutationSearch.toLowerCase();
    const filteredMutations = db.transaksi_tabungan.filter(t => {
      const matchesSearch = t.nama_santri.toLowerCase().includes(q) || t.keterangan.toLowerCase().includes(q);
      const matchesType = mutationTypeFilter === "ALL" || t.tipe === mutationTypeFilter;
      return matchesSearch && matchesType;
    });

    return (
      <section id="tab-tabungan-riwayat" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-1">Buku Tabungan & Rekap Mutasi</h3>
          <p className="text-xs text-emerald-500/70">Daftar rekam histori setoran masuk, penarikan, pemotongan Syahryah (SPP), dan rincian pembukuan tabungan santri.</p>
        </div>

        {/* Filter & Search Panel */}
        <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-3 text-emerald-500/50 text-xs">🔍</span>
            <input 
              type="text" 
              value={mutationSearch}
              onChange={(e) => setMutationSearch(e.target.value)}
              placeholder="Cari berdasarkan nama santri atau keterangan..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-sm focus:outline-none text-white"
            />
          </div>
          <select 
            value={mutationTypeFilter}
            onChange={(e) => setMutationTypeFilter(e.target.value)}
            className="bg-emerald-950/60 border border-emerald-900 text-xs rounded-xl px-3 py-2 text-emerald-400 focus:outline-none"
          >
            <option value="ALL">Semua Aliran</option>
            <option value="DEPOSIT">Hanya Setoran (Kredit)</option>
            <option value="PENARIKAN">Hanya Penarikan (Debet)</option>
          </select>
        </div>

        {/* Mutation Ledger Table */}
        <div className="glass-card p-5 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                <th className="py-3">Waktu Transaksi</th>
                <th className="py-3">Santri / Kelas</th>
                <th className="py-3">Rincian Deskripsi</th>
                <th className="py-3 text-center">Status Aliran</th>
                <th className="py-3 text-right">Debit (Keluar)</th>
                <th className="py-3 text-right">Kredit (Masuk)</th>
                <th className="py-3 text-center">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/20">
              {filteredMutations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-emerald-600 italic">Riwayat transaksi tidak ditemukan.</td>
                </tr>
              ) : (
                filteredMutations.slice().reverse().map((t, idx) => {
                  const isDeposit = t.tipe === "DEPOSIT";
                  const s = db.santri.find(x => x.id_santri === t.id_santri) || { saldo_utama: 0 };
                  return (
                    <tr key={idx} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-colors">
                      <td className="py-3 text-emerald-500/80 font-mono">{t.tanggal}</td>
                      <td className="py-3">
                        <span className="font-bold text-gray-200 block">{t.nama_santri}</span>
                        <span className="text-[9px] text-emerald-500/60">{t.kelas}</span>
                      </td>
                      <td className="py-3 text-emerald-500/80 italic">"{t.keterangan}"</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isDeposit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {t.tipe}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-red-400">{!isDeposit ? formatRupiah(t.nominal) : '-'}</td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-400">{isDeposit ? formatRupiah(t.nominal) : '-'}</td>
                      <td className="py-3 text-center">
                        <button 
                          onClick={() => {
                            setPreviewTx(t);
                            setPreviewBalance(s.saldo_utama);
                            setIsSlipOpen(true);
                          }} 
                          className="p-1.5 bg-emerald-900/40 hover:bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg"
                        >
                          <LucideIcon name="printer" className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Re-use saving slip dialog in mutations */}
        {isSlipOpen && previewTx && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="bg-amber-50 text-emerald-950 p-6 rounded-2xl shadow-2xl relative font-mono text-xs flex flex-col gap-4 border border-amber-200 w-full">
              <div id="print-area-saving-slip-wrapper" className="w-full">
                <div id="print-area-saving-slip" className="p-3 bg-white text-black rounded border border-gray-300 w-full">
                  <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wide leading-tight">YAYASAN {(db.settings.nama_pesantren || "PONPESQU").toUpperCase()} DARUL MA'ARIF</h2>
                    <p className="text-[8px] text-gray-500 leading-none mt-1">LOKET TABUNGAN SAKU CASHLESS</p>
                    <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-2">
                      {previewTx.tipe === "DEPOSIT" ? "SLIP SETORAN TABUNGAN" : "SLIP PENARIKAN TUNAI"}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] my-3 leading-relaxed">
                    <div className="flex justify-between"><span>No. Referensi:</span><span className="font-bold">{previewTx.id_transaksi}</span></div>
                    <div className="flex justify-between"><span>Tanggal/Waktu:</span><span>{previewTx.tanggal}</span></div>
                    <div className="flex justify-between"><span>Nama Santri:</span><span className="font-bold uppercase">{previewTx.nama_santri}</span></div>
                    <div className="flex justify-between"><span>Kelas Santri:</span><span>{previewTx.kelas}</span></div>
                    <div className="flex justify-between"><span>Keterangan:</span><span className="italic">{previewTx.keterangan}</span></div>
                  </div>

                  <div className="border-t border-b border-dashed border-gray-400 py-2 my-2 text-center">
                    <span className="text-[9px] text-gray-500 block uppercase tracking-wider">
                      {previewTx.tipe === "DEPOSIT" ? "Jumlah Setoran" : "Jumlah Penarikan"}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-950 block">{formatRupiah(previewTx.nominal)}</span>
                  </div>

                  <div className="flex justify-between text-[10px] mt-2">
                    <span>Saldo Akhir Saku:</span>
                    <span className="font-bold text-emerald-800">{formatRupiah(previewBalance)}</span>
                  </div>

                  <div className="flex justify-between items-center text-[9px] mt-4 pt-2 border-t border-dashed border-gray-400">
                    <div className="text-center w-20">
                      <span className="block">Santri</span>
                      <div className="h-6"></div>
                      <span className="border-t border-black pt-1 block font-bold text-[8px]">{previewTx.nama_santri.split(' ')[0]}</span>
                    </div>
                    <div className="text-center w-24 font-mono text-[6px] text-gray-500">
                      *Simpan bukti ini sebagai tanda terima sah*
                    </div>
                    <div className="text-center w-20">
                      <span className="block">Bendahara</span>
                      <div className="h-6"></div>
                      <span className="border-t border-black pt-1 block font-bold text-[8px]">Ustadz Jafar</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setIsSlipOpen(false)} className="w-1/2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-all">Tutup</button>
                <button onClick={() => window.print()} className="w-1/2 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1">
                  <LucideIcon name="printer" className="w-3.5 h-3.5" /> Cetak Bukti
                </button>
              </div>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'tabungan-limit') {
    const q = limitSearch.toLowerCase();
    const filteredSantri = db.santri.filter(s => {
      return s.nama_santri.toLowerCase().includes(q) || 
             s.kelas.toLowerCase().includes(q) ||
             (s.alamat && s.alamat.toLowerCase().includes(q));
    });

    return (
      <section id="tab-tabungan-limit" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-sm font-bold text-amber-500 mb-1">Pengaturan Limit Belanja Harian</h3>
          <p className="text-xs text-emerald-500/70">Atur batasan belanja harian santri di kantin/koperasi pondok demi menjaga kemandirian finansial dan kebiasaan hemat santri.</p>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-4 rounded-2xl">
          <div className="relative w-full">
            <span className="absolute left-3 top-3 text-emerald-500/50 text-xs">🔍</span>
            <input 
              type="text" 
              value={limitSearch}
              onChange={(e) => setLimitSearch(e.target.value)}
              placeholder="Cari nama santri atau kelas..." 
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-sm focus:outline-none text-white"
            />
          </div>
        </div>

        {/* Limit Table Grid */}
        <div className="glass-card p-5 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                <th className="py-3">Santri / Kelas</th>
                <th className="py-3 text-right">Saldo Uang Saku</th>
                <th className="py-3 text-right">Limit Jajan Harian</th>
                <th className="py-3 text-right">Limit Belanja Market</th>
                <th className="py-3 text-center">Tindakan Cepat Jajan</th>
                <th className="py-3 text-center">Atur Kustom</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/20">
              {filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-emerald-600 italic">Santri tidak ditemukan.</td>
                </tr>
              ) : (
                filteredSantri.map(s => {
                  const currentLimit = s.limit_jajan || 25000;
                  const currentMarketLimit = s.limit_belanja || 50000;
                  return (
                    <tr key={s.id_santri} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-colors">
                      <td className="py-3 flex items-center gap-2.5">
                        <img src={s.foto_profil || 'https://placehold.co/150/02110e/f59e0b?text=SNT'} className="w-8 h-8 rounded-full object-cover border border-emerald-900" alt="Santri" />
                        <div>
                          <span className="font-bold text-gray-200 block">{s.nama_santri}</span>
                          <span className="text-[10px] text-emerald-500/60">
                            {s.kelas}
                            {s.alamat && ` • 📍 ${s.alamat}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-semibold text-gray-200 font-mono">{formatRupiah(s.saldo_utama)}</td>
                      <td className="py-3 text-right font-extrabold text-amber-400 font-mono">{formatRupiah(currentLimit)}</td>
                      <td className="py-3 text-right font-extrabold text-yellow-500 font-mono">{formatRupiah(currentMarketLimit)}</td>
                      <td className="py-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => saveQuickLimit(s, 15000)} className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-900 text-[10px] rounded hover:bg-emerald-900 text-emerald-400 font-semibold">Set 15K</button>
                          <button onClick={() => saveQuickLimit(s, 25000)} className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-900 text-[10px] rounded hover:bg-emerald-900 text-emerald-400 font-semibold">Set 25K</button>
                          <button onClick={() => saveQuickLimit(s, 50000)} className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-900 text-[10px] rounded hover:bg-emerald-900 text-emerald-400 font-semibold">Set 50K</button>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <button onClick={() => openCustomLimit(s)} className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-[10px]">
                          Kustom
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Limit Dialog */}
        {isLimitOpen && limitSantri && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                  <LucideIcon name="sliders" className="w-4 h-4" /> Atur Limit Harian Kustom
                </h3>
                <button onClick={() => setIsLimitOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitCustomLimit} className="space-y-3 text-xs text-gray-300">
                <div>
                  <span className="text-[10px] text-emerald-500/60 block">Santri Terkait:</span>
                  <strong className="text-xs text-gray-100 uppercase">{limitSantri.nama_santri}</strong>
                  <p className="text-[10px] text-amber-400">{limitSantri.kelas}</p>
                </div>

                <div>
                  <label className="block text-emerald-500/80 mb-1">Limit Jajan Harian Baru (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={customLimitVal}
                    onChange={(e) => setCustomLimitVal(Number(e.target.value) || 0)}
                    placeholder="Rp..." 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-amber-400 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-emerald-500/80 mb-1">Limit Belanja Market Baru (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={customMarketLimitVal}
                    onChange={(e) => setCustomMarketLimitVal(Number(e.target.value) || 0)}
                    placeholder="Rp..." 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-yellow-400 font-bold font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsLimitOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Aturan</button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  return null;
}
