import React, { useState } from 'react';
import { K_DB, Santri, PelanggaranSantri, IzinKeamanan } from '../types';
import { LucideIcon } from './LucideIcon';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface KeamananPanelProps {
  db: K_DB;
  activeUser: { nama: string; role: string } | null;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
}

export function KeamananPanel({
  db,
  activeUser,
  syncDbState,
  showToast,
  showConfirm
}: KeamananPanelProps) {
  const [activeTab, setActiveTab] = useState<'pelanggaran' | 'izin-khusus'>('pelanggaran');

  // --- STUDENT SELECTION (SHARED SCANNER / MANUAL LOOKUP) ---
  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // --- VIOLATION FORM STATE ---
  const [violationCategory, setViolationCategory] = useState<'RINGAN' | 'SEDANG' | 'BERAT'>('RINGAN');
  const [violationDetail, setViolationDetail] = useState('');
  const [violationPunishment, setViolationPunishment] = useState('');

  // --- SPECIAL ALLOWANCE FORM STATE ---
  const [allowanceType, setAllowanceType] = useState<'JAJAN' | 'BELANJA'>('JAJAN');
  const [allowanceAmount, setAllowanceAmount] = useState<number | ''>('');
  const [isNoLimit, setIsNoLimit] = useState(false);
  const [allowanceReason, setAllowanceReason] = useState('');

  // --- HISTORIC FILTERS ---
  const [searchViolations, setSearchViolations] = useState('');
  const [filterViolationCategory, setFilterViolationCategory] = useState<'ALL' | 'RINGAN' | 'SEDANG' | 'BERAT'>('ALL');
  const [violationStartDate, setViolationStartDate] = useState('');
  const [violationEndDate, setViolationEndDate] = useState('');

  const [searchAllowances, setSearchAllowances] = useState('');
  const [filterAllowanceType, setFilterAllowanceType] = useState<'ALL' | 'JAJAN' | 'BELANJA'>('ALL');
  const [allowanceStartDate, setAllowanceStartDate] = useState('');
  const [allowanceEndDate, setAllowanceEndDate] = useState('');

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const handleSelectSantri = (s: Santri) => {
    setSelectedSantri(s);
    setSearchQuery('');
    setShowDropdown(false);
    showToast(`✓ Santri ${s.nama_santri} berhasil dimuat!`, 'success');
  };

  const handleRemoveSelectedSantri = () => {
    setSelectedSantri(null);
  };

  // --- 1. RECORD VIOLATION SUBMIT ---
  const handleSubmitViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    if (!violationDetail.trim()) {
      showToast('Detail pelanggaran tidak boleh kosong!', 'error');
      return;
    }
    if (!violationPunishment.trim()) {
      showToast('Keterangan hukuman wajib diisi!', 'error');
      return;
    }

    const confirmMsg = `Catat pelanggaran ${violationCategory} untuk santri ${selectedSantri.nama_santri}?`;
    showConfirm(confirmMsg, async (yes) => {
      if (yes) {
        const today = new Date().toISOString().slice(0, 10);
        const newViolation: PelanggaranSantri = {
          id_pelanggaran: `PLG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          id_santri: selectedSantri.id_santri,
          nama_santri: selectedSantri.nama_santri,
          kelas: selectedSantri.kelas,
          kategori: violationCategory,
          detail_pelanggaran: violationDetail.trim(),
          hukuman: violationPunishment.trim(),
          tanggal: today,
          dicatat_oleh: activeUser?.nama || 'Admin Keamanan'
        };

        const updatedDb = {
          ...db,
          pelanggaran_santri: [newViolation, ...(db.pelanggaran_santri || [])]
        };

        await syncDbState(updatedDb);
        showToast(`✓ Pelanggaran ${selectedSantri.nama_santri} berhasil dicatat!`, 'success');

        // Reset Form
        setViolationDetail('');
        setViolationPunishment('');
        setSelectedSantri(null);
      }
    });
  };

  // --- 2. RECORD SPECIAL ALLOWANCE SUBMIT ---
  const handleSubmitAllowance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      showToast('Pilih santri terlebih dahulu!', 'error');
      return;
    }
    if (!isNoLimit && (allowanceAmount === '' || Number(allowanceAmount) <= 0)) {
      showToast('Tentukan nominal izin belanja/jajan yang disetujui!', 'error');
      return;
    }
    if (!allowanceReason.trim()) {
      showToast('Berikan alasan/keterangan pemberian izin khusus!', 'error');
      return;
    }

    const finalAmount = isNoLimit ? 9999999 : Number(allowanceAmount);
    const labelNominal = isNoLimit ? 'NO LIMIT' : formatRupiah(finalAmount);
    const confirmMsg = `Berikan Izin ${allowanceType} sebesar ${labelNominal} untuk ${selectedSantri.nama_santri} hari ini?`;

    showConfirm(confirmMsg, async (yes) => {
      if (yes) {
        const today = new Date().toISOString().slice(0, 10);
        
        // Remove existing active izin of same type for this student today
        const clearedIzinList = (db.izin_keamanan || []).filter(
          iz => !(iz.id_santri === selectedSantri.id_santri && iz.tipe_izin === allowanceType && iz.tanggal === today)
        );

        const newAllowance: IzinKeamanan = {
          id_izin_khusus: `IZK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          id_santri: selectedSantri.id_santri,
          nama_santri: selectedSantri.nama_santri,
          kelas: selectedSantri.kelas,
          tipe_izin: allowanceType,
          nominal_disetujui: finalAmount,
          is_no_limit: isNoLimit,
          tanggal: today,
          keterangan: allowanceReason.trim(),
          dicatat_oleh: activeUser?.nama || 'Admin Keamanan'
        };

        const updatedDb = {
          ...db,
          izin_keamanan: [newAllowance, ...clearedIzinList]
        };

        await syncDbState(updatedDb);
        showToast(`✓ Izin khusus berhasil diberikan untuk ${selectedSantri.nama_santri}!`, 'success');

        // Reset Form
        setAllowanceAmount('');
        setIsNoLimit(false);
        setAllowanceReason('');
        setSelectedSantri(null);
      }
    });
  };

  // --- DELETE OPERATORS ---
  const handleDeleteViolation = (id: string, name: string) => {
    showConfirm(`Hapus catatan pelanggaran untuk ${name}?`, async (yes) => {
      if (yes) {
        const filtered = (db.pelanggaran_santri || []).filter(v => v.id_pelanggaran !== id);
        await syncDbState({ ...db, pelanggaran_santri: filtered });
        showToast('Catatan pelanggaran berhasil dihapus.', 'info');
      }
    });
  };

  const handleDeleteAllowance = (id: string, name: string) => {
    showConfirm(`Batalkan surat izin khusus untuk ${name}?`, async (yes) => {
      if (yes) {
        const filtered = (db.izin_keamanan || []).filter(i => i.id_izin_khusus !== id);
        await syncDbState({ ...db, izin_keamanan: filtered });
        showToast('Izin khusus berhasil dibatalkan.', 'info');
      }
    });
  };

  // --- PRINT FUNCTIONALITIES ---
  const handlePrintViolations = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filtered = (db.pelanggaran_santri || []).filter(v => {
      const matchesSearch = v.nama_santri.toLowerCase().includes(searchViolations.toLowerCase()) || v.kelas.toLowerCase().includes(searchViolations.toLowerCase());
      const matchesCategory = filterViolationCategory === 'ALL' || v.kategori === filterViolationCategory;
      const matchesStart = violationStartDate ? v.tanggal >= violationStartDate : true;
      const matchesEnd = violationEndDate ? v.tanggal <= violationEndDate : true;
      return matchesSearch && matchesCategory && matchesStart && matchesEnd;
    });

    let tableRows = '';
    filtered.forEach((v, index) => {
      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${v.tanggal}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>${v.nama_santri}</strong><br><small>${v.kelas}</small></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
            <span style="font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: ${v.kategori === 'BERAT' ? '#fecaca' : v.kategori === 'SEDANG' ? '#feebc8' : '#e6fffa'}; color: ${v.kategori === 'BERAT' ? '#991b1b' : v.kategori === 'SEDANG' ? '#c05621' : '#006d5b'};">
              ${v.kategori}
            </span>
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">${v.detail_pelanggaran}</td>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #991b1b;">${v.hukuman}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><small>${v.dicatat_oleh}</small></td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>LAPORAN PELANGGARAN SANTRI</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 2px; text-transform: uppercase; }
            h2 { text-align: center; font-size: 12px; font-weight: normal; margin-top: 0; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { border: 1px solid #ddd; padding: 8px; background-color: #f7fafc; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <h1>LAPORAN PELANGGARAN SANTRI</h1>
          <h2>Pesantren PonpesQu - Dicetak pada ${new Date().toLocaleDateString('id-ID')}</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">No</th>
                <th>Tanggal</th>
                <th>Santri & Kelas</th>
                <th style="text-align: center;">Kategori</th>
                <th>Detail Pelanggaran</th>
                <th>Sanksi / Hukuman Keamanan</th>
                <th>Petugas</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #888;">Tidak ada data pelanggaran yang sesuai filter.</td></tr>'}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllowances = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filtered = (db.izin_keamanan || []).filter(i => {
      const matchesSearch = i.nama_santri.toLowerCase().includes(searchAllowances.toLowerCase()) || i.kelas.toLowerCase().includes(searchAllowances.toLowerCase());
      const matchesType = filterAllowanceType === 'ALL' || i.tipe_izin === filterAllowanceType;
      const matchesStart = allowanceStartDate ? i.tanggal >= allowanceStartDate : true;
      const matchesEnd = allowanceEndDate ? i.tanggal <= allowanceEndDate : true;
      return matchesSearch && matchesType && matchesStart && matchesEnd;
    });

    let tableRows = '';
    filtered.forEach((i, index) => {
      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px;">${i.tanggal}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>${i.nama_santri}</strong><br><small>${i.kelas}</small></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><strong>${i.tipe_izin}</strong></td>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; color: #c05621;">
            ${i.is_no_limit ? 'BEBAS LIMIT (NO LIMIT)' : formatRupiah(i.nominal_disetujui)}
          </td>
          <td style="border: 1px solid #ddd; padding: 8px;">${i.keterangan}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><small>${i.dicatat_oleh}</small></td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>LAPORAN SURAT IZIN KHUSUS KEAMANAN</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; font-size: 18px; margin-bottom: 2px; text-transform: uppercase; }
            h2 { text-align: center; font-size: 12px; font-weight: normal; margin-top: 0; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { border: 1px solid #ddd; padding: 8px; background-color: #f7fafc; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <h1>LAPORAN SURAT IZIN KHUSUS KEAMANAN (SPENDING OVERRIDES)</h1>
          <h2>Pesantren PonpesQu - Dicetak pada ${new Date().toLocaleDateString('id-ID')}</h2>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">No</th>
                <th>Tanggal</th>
                <th>Santri & Kelas</th>
                <th style="text-align: center;">Tipe Izin</th>
                <th>Nominal Disetujui</th>
                <th>Keterangan / Alasan Override</th>
                <th>Petugas Keamanan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #888;">Tidak ada surat izin khusus yang sesuai filter.</td></tr>'}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter lists
  const query = searchQuery.toLowerCase().trim();
  const matchingSantri = db.santri.filter(s =>
    s.nama_santri.toLowerCase().includes(query) ||
    s.kelas.toLowerCase().includes(query) ||
    s.barcode.toLowerCase().includes(query)
  );

  const displayedViolations = (db.pelanggaran_santri || []).filter(v => {
    const matchesSearch = v.nama_santri.toLowerCase().includes(searchViolations.toLowerCase()) || v.kelas.toLowerCase().includes(searchViolations.toLowerCase());
    const matchesCategory = filterViolationCategory === 'ALL' || v.kategori === filterViolationCategory;
    const matchesStart = violationStartDate ? v.tanggal >= violationStartDate : true;
    const matchesEnd = violationEndDate ? v.tanggal <= violationEndDate : true;
    return matchesSearch && matchesCategory && matchesStart && matchesEnd;
  });

  const displayedAllowances = (db.izin_keamanan || []).filter(i => {
    const matchesSearch = i.nama_santri.toLowerCase().includes(searchAllowances.toLowerCase()) || i.kelas.toLowerCase().includes(searchAllowances.toLowerCase());
    const matchesType = filterAllowanceType === 'ALL' || i.tipe_izin === filterAllowanceType;
    const matchesStart = allowanceStartDate ? i.tanggal >= allowanceStartDate : true;
    const matchesEnd = allowanceEndDate ? i.tanggal <= allowanceEndDate : true;
    return matchesSearch && matchesType && matchesStart && matchesEnd;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Upper Welcome Banner */}
      <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
          <span>👮</span> Assalamualaikum, {activeUser?.nama || 'Admin Keamanan'}
        </h2>
        <p className="text-xs text-emerald-500/80 mt-1">
          Dinas Pos Komando Keamanan Pesantren. Layanan pencatatan kedisiplinan (pelanggaran harian) & penerbitan dispensasi limitasi (izin ambil uang & jajan berlebih) secara tersinkronisasi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-emerald-950/40 gap-1">
        <button
          onClick={() => { setActiveTab('pelanggaran'); setSelectedSantri(null); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${activeTab === 'pelanggaran' ? 'bg-emerald-950/40 text-amber-400 border-b-2 border-amber-500' : 'text-emerald-500 hover:text-emerald-400'}`}
        >
          <LucideIcon name="gavel" className="w-4 h-4" />
          <span>Sanksi & Pelanggaran Santri</span>
        </button>
        <button
          onClick={() => { setActiveTab('izin-khusus'); setSelectedSantri(null); }}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 ${activeTab === 'izin-khusus' ? 'bg-emerald-950/40 text-amber-400 border-b-2 border-amber-500' : 'text-emerald-500 hover:text-emerald-400'}`}
        >
          <LucideIcon name="unlock" className="w-4 h-4" />
          <span>Izin Belanja & Jajan Lebih</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: BARCODE SCANNER & FORM ENTRY (4 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Card 1: Scanner Input */}
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
              <LucideIcon name="scan-line" className="w-4 h-4 text-amber-500" />
              <span>Cari / Scan Kartu Santri</span>
            </h3>

            {/* Always on scanner */}
            <div className="relative group">
              <LiveBarcodeScanner
                title="Pindai Kartu Keamanan"
                subtitle="Dekatkan ID Card santri ke kamera"
                isInline={true}
                onScanSuccess={(decoded) => {
                  const s = db.santri.find(x => x.barcode.toLowerCase() === decoded.trim().toLowerCase());
                  if (s) {
                    handleSelectSantri(s);
                  } else {
                    showToast(`Kartu barcode "${decoded}" tidak dikenali!`, 'error');
                  }
                }}
                dummyOptions={db.santri.map(s => ({
                  label: s.nama_santri,
                  code: s.barcode,
                  subLabel: s.kelas
                }))}
              />
            </div>

            {/* Manual Lookup Input */}
            <div className="relative">
              <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Lookup Nama Santri</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-emerald-500/50 text-xs">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Ketik nama, kelas, atau barcode..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {showDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-[160px] overflow-y-auto bg-emerald-950 border border-emerald-900 rounded-xl p-1 shadow-xl no-scrollbar">
                  {matchingSantri.length === 0 ? (
                    <p className="text-[10px] text-emerald-600 italic text-center py-4">Nama tidak ditemukan.</p>
                  ) : (
                    matchingSantri.map(s => (
                      <div
                        key={s.id_santri}
                        onClick={() => handleSelectSantri(s)}
                        className="p-2 hover:bg-emerald-900/50 cursor-pointer text-xs rounded-lg flex justify-between items-center text-gray-200 transition-colors"
                      >
                        <div>
                          <strong className="block text-white">{s.nama_santri}</strong>
                          <span className="text-[10px] text-emerald-500">{s.kelas}</span>
                        </div>
                        <span className="text-[9px] bg-emerald-900 px-1.5 py-0.5 rounded font-mono text-amber-400">{s.barcode}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Loaded Student Profile Card */}
            {selectedSantri && (
              <div className="bg-emerald-950/60 border border-amber-500/20 p-3 rounded-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedSantri.foto_profil || "https://placehold.co/150x200/022c22/f59e0b?text=SNT"}
                      alt="Loaded Profile"
                      className="w-10 h-12 rounded-lg object-cover border border-amber-500/10 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">{selectedSantri.nama_santri}</h4>
                      <p className="text-[10px] text-amber-400 font-semibold">{selectedSantri.kelas}</p>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/15">
                          Saku: {formatRupiah(selectedSantri.saldo_utama)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveSelectedSantri}
                    className="p-1 hover:bg-emerald-900 text-emerald-500 hover:text-red-400 rounded-lg text-xs"
                  >
                    ✕
                  </button>
                </div>
                
                {/* student violations list */}
                {(() => {
                  const studentViolations = (db.pelanggaran_santri || []).filter(v => v.id_santri === selectedSantri.id_santri);
                  return (
                    <div className="pt-2 border-t border-emerald-900/50 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                        <LucideIcon name="gavel" className="w-3.5 h-3.5" />
                        <span>Riwayat Pelanggaran & Hukuman ({studentViolations.length})</span>
                      </span>
                      {studentViolations.length === 0 ? (
                        <p className="text-[9px] text-emerald-500/40 italic">Bersih / belum ada catatan pelanggaran.</p>
                      ) : (
                        <div className="max-h-[150px] overflow-y-auto no-scrollbar flex flex-col gap-1.5">
                          {studentViolations.slice().reverse().map(v => (
                            <div key={v.id_pelanggaran} className="p-2 rounded-lg bg-red-950/20 border border-red-900/20 text-[10px] flex flex-col gap-0.5">
                              <div className="flex justify-between text-[8px] font-mono text-emerald-500/50">
                                <span>{v.tanggal}</span>
                                <span className="font-extrabold text-red-400">{v.kategori}</span>
                              </div>
                              <p className="text-gray-200 leading-tight font-medium mt-0.5">{v.detail_pelanggaran}</p>
                              <div className="text-amber-400 font-bold mt-0.5">Hukuman: {v.hukuman}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Card 2: Interactive Form Entry */}
          <div className="glass-card p-5 rounded-2xl">
            {activeTab === 'pelanggaran' ? (
              <form onSubmit={handleSubmitViolation} className="space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                  <LucideIcon name="gavel" className="w-4 h-4 text-red-500" />
                  <span>Input Laporan Pelanggaran</span>
                </h3>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1.5">Kategori Pelanggaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['RINGAN', 'SEDANG', 'BERAT'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setViolationCategory(cat)}
                        className={`py-2 text-[10px] font-bold rounded-xl transition-all border ${
                          violationCategory === cat
                            ? cat === 'BERAT'
                              ? 'bg-red-500/20 text-red-400 border-red-500/50 shadow'
                              : cat === 'SEDANG'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow'
                            : 'bg-emerald-950/30 text-emerald-500 border-emerald-900/40 hover:bg-emerald-950/60'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Detail Tindakan Pelanggaran</label>
                  <textarea
                    required
                    value={violationDetail}
                    onChange={(e) => setViolationDetail(e.target.value)}
                    placeholder="Contoh: Terlambat sholat berjamaah 3 kali berturut-turut, atau keluar asrama tanpa izin."
                    className="w-full h-20 bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Sanksi & Hukuman Yang Diberikan</label>
                  <input
                    type="text"
                    required
                    value={violationPunishment}
                    onChange={(e) => setViolationPunishment(e.target.value)}
                    placeholder="Contoh: Hafalan Surat Yasin / Piket membersihkan masjid"
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSantri}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow transition-all ${
                    selectedSantri
                      ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
                      : 'bg-emerald-950 text-emerald-600 border border-emerald-900/60 cursor-not-allowed'
                  }`}
                >
                  Catat & Laporkan Sanksi
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmitAllowance} className="space-y-4">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                  <LucideIcon name="unlock" className="w-4 h-4 text-yellow-500" />
                  <span>Input Izin Belanja / Jajan Lebih</span>
                </h3>

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1.5">Tipe Dispensasi Izin</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['JAJAN', 'BELANJA'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setAllowanceType(type);
                          if (type === 'JAJAN') setIsNoLimit(false); // No limit is only for belanja
                        }}
                        className={`py-2 text-[10px] font-bold rounded-xl transition-all border ${
                          allowanceType === type
                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow'
                            : 'bg-emerald-950/30 text-emerald-500 border-emerald-900/40 hover:bg-emerald-950/60'
                        }`}
                      >
                        IZIN {type}
                      </button>
                    ))}
                  </div>
                </div>

                {allowanceType === 'BELANJA' && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-950/50 rounded-xl border border-emerald-900/40">
                    <input
                      type="checkbox"
                      id="checkbox-no-limit"
                      checked={isNoLimit}
                      onChange={(e) => setIsNoLimit(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 border-emerald-900 focus:ring-amber-500 bg-emerald-950"
                    />
                    <label htmlFor="checkbox-no-limit" className="text-[11px] text-amber-400 font-bold cursor-pointer select-none">
                      Bebas Limit Belanja Hari Ini (No Limit)
                    </label>
                  </div>
                )}

                {!isNoLimit && (
                  <div>
                    <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">
                      Nominal Jatah Hari Ini Disetujui (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      value={allowanceAmount}
                      onChange={(e) => setAllowanceAmount(Number(e.target.value) || '')}
                      placeholder="Contoh: 75000"
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 text-yellow-400 font-bold font-mono"
                    />
                    <p className="text-[9px] text-emerald-500/50 mt-1 leading-tight">
                      * Nominal ini akan menggantikan limit standar harian santri tersebut khusus untuk hari ini saja.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-emerald-500/80 text-[10px] uppercase font-bold mb-1">Alasan Pemberian Izin</label>
                  <input
                    type="text"
                    required
                    value={allowanceReason}
                    onChange={(e) => setAllowanceReason(e.target.value)}
                    placeholder="Contoh: Membeli modul kitab baru / sikat gigi & sabun asrama"
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 text-gray-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedSantri}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs shadow transition-all ${
                    selectedSantri
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-emerald-950 cursor-pointer'
                      : 'bg-emerald-950 text-emerald-600 border border-emerald-900/60 cursor-not-allowed'
                  }`}
                >
                  Penerbitan Surat Izin Khusus
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: LIST LOGS AND HISTORIES (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {activeTab === 'pelanggaran' ? (
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-emerald-950/50 pb-2 gap-2">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <LucideIcon name="gavel" className="w-4.5 h-4.5" />
                  <span>Daftar Pelanggaran & Hukuman Santri</span>
                </h3>
                <button
                  onClick={handlePrintViolations}
                  className="px-3 py-1 bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <LucideIcon name="printer" className="w-3.5 h-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>

              {/* Filtering bar */}
              <div className="flex flex-col gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={searchViolations}
                    onChange={(e) => setSearchViolations(e.target.value)}
                    placeholder="Cari nama santri / kelas..."
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <select
                    value={filterViolationCategory}
                    onChange={(e) => setFilterViolationCategory(e.target.value as any)}
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-amber-400 focus:outline-none"
                  >
                    <option value="ALL">Semua Kategori Pelanggaran</option>
                    <option value="RINGAN">Pelanggaran Ringan</option>
                    <option value="SEDANG">Pelanggaran Sedang</option>
                    <option value="BERAT">Pelanggaran Berat</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-900/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">Dari:</span>
                    <input
                      type="date"
                      value={violationStartDate}
                      onChange={(e) => setViolationStartDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">S/D:</span>
                    <input
                      type="date"
                      value={violationEndDate}
                      onChange={(e) => setViolationEndDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Log Tables */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Tanggal</th>
                      <th className="py-2.5">Santri</th>
                      <th className="py-2.5 text-center">Tingkat</th>
                      <th className="py-2.5">Keterangan & Sanksi</th>
                      <th className="py-2.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/20">
                    {displayedViolations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-emerald-600/60 italic">Tidak ada catatan pelanggaran terdaftar.</td>
                      </tr>
                    ) : (
                      displayedViolations.slice().reverse().map(v => (
                        <tr key={v.id_pelanggaran} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-all">
                          <td className="py-3 font-mono text-[10px] text-emerald-500/80">{v.tanggal}</td>
                          <td className="py-3">
                            <span className="font-bold text-gray-200 block leading-tight">{v.nama_santri}</span>
                            <span className="text-[10px] text-emerald-500/50">{v.kelas}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border ${
                              v.kategori === 'BERAT'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : v.kategori === 'SEDANG'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                              {v.kategori}
                            </span>
                          </td>
                          <td className="py-3 leading-relaxed">
                            <p className="text-gray-300 text-[11px]">{v.detail_pelanggaran}</p>
                            <div className="text-[10px] text-red-400 font-bold mt-0.5">
                              Sanksi: <span className="underline">{v.hukuman}</span>
                            </div>
                            <span className="text-[9px] text-emerald-500/40 block mt-0.5">Pencatat: {v.dicatat_oleh}</span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              onClick={() => handleDeleteViolation(v.id_pelanggaran, v.nama_santri)}
                              className="p-1 hover:bg-red-950/30 text-emerald-600 hover:text-red-400 rounded-md transition-colors"
                              title="Hapus Laporan"
                            >
                              <LucideIcon name="trash" className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-emerald-950/50 pb-2 gap-2">
                <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                  <LucideIcon name="unlock" className="w-4.5 h-4.5" />
                  <span>Daftar Izin Khusus & Spending Overrides</span>
                </h3>
                <button
                  onClick={handlePrintAllowances}
                  className="px-3 py-1 bg-emerald-900 border border-emerald-800 text-amber-400 rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <LucideIcon name="printer" className="w-3.5 h-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>

              {/* Filtering bar */}
              <div className="flex flex-col gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={searchAllowances}
                    onChange={(e) => setSearchAllowances(e.target.value)}
                    placeholder="Cari nama santri / kelas..."
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500/50"
                  />
                  <select
                    value={filterAllowanceType}
                    onChange={(e) => setFilterAllowanceType(e.target.value as any)}
                    className="bg-emerald-950/60 border border-emerald-900 text-xs px-3 py-1.5 rounded-lg text-yellow-400 focus:outline-none"
                  >
                    <option value="ALL">Semua Tipe Izin</option>
                    <option value="JAJAN">Izin Jajan (Tabungan)</option>
                    <option value="BELANJA">Izin Belanja (Market)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-900/10">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">Dari:</span>
                    <input
                      type="date"
                      value={allowanceStartDate}
                      onChange={(e) => setAllowanceStartDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-emerald-500/60 font-semibold shrink-0">S/D:</span>
                    <input
                      type="date"
                      value={allowanceEndDate}
                      onChange={(e) => setAllowanceEndDate(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900/60 text-xs px-2.5 py-1 rounded-lg text-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Log Tables */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Tanggal</th>
                      <th className="py-2.5">Santri</th>
                      <th className="py-2.5 text-center">Tipe Izin</th>
                      <th className="py-2.5 text-right">Nominal Baru</th>
                      <th className="py-2.5">Keterangan / Alasan</th>
                      <th className="py-2.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-950/20">
                    {displayedAllowances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-emerald-600/60 italic">Tidak ada surat izin khusus diterbitkan.</td>
                      </tr>
                    ) : (
                      displayedAllowances.slice().reverse().map(i => {
                        const today = new Date().toISOString().slice(0, 10);
                        const isActiveToday = i.tanggal === today;
                        return (
                          <tr key={i.id_izin_khusus} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-all">
                            <td className="py-3 font-mono text-[10px]">
                              <span className="text-emerald-500 block">{i.tanggal}</span>
                              {isActiveToday ? (
                                <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1 py-0.2 rounded border border-amber-500/20 font-bold tracking-wide mt-0.5 inline-block">AKTIF</span>
                              ) : (
                                <span className="text-[8px] bg-emerald-950/40 text-emerald-500/40 px-1 py-0.2 rounded border border-emerald-900/10 font-bold tracking-wide mt-0.5 inline-block">EXPIRED</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span className="font-bold text-gray-200 block leading-tight">{i.nama_santri}</span>
                              <span className="text-[10px] text-emerald-500/50">{i.kelas}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase inline-block border ${
                                i.tipe_izin === 'JAJAN'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }`}>
                                {i.tipe_izin}
                              </span>
                            </td>
                            <td className="py-3 text-right font-bold text-amber-400 font-mono">
                              {i.is_no_limit ? (
                                <span className="text-yellow-400 font-extrabold animate-pulse">NO LIMIT</span>
                              ) : (
                                formatRupiah(i.nominal_disetujui)
                              )}
                            </td>
                            <td className="py-3 leading-relaxed">
                              <p className="text-gray-300 text-[11px]">{i.keterangan}</p>
                              <span className="text-[9px] text-emerald-500/40 block mt-0.5">Oleh: {i.dicatat_oleh}</span>
                            </td>
                            <td className="py-3 text-center">
                              <button
                                onClick={() => handleDeleteAllowance(i.id_izin_khusus, i.nama_santri)}
                                className="p-1 hover:bg-red-950/30 text-emerald-600 hover:text-red-400 rounded-md transition-colors"
                                title="Batalkan Izin"
                              >
                                <LucideIcon name="x-circle" className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
