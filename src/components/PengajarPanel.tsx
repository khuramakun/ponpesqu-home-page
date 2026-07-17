import React, { useState } from 'react';
import { K_DB, Santri, AbsensiKelas, AbsensiSholat, Perizinan, LaporanPerkembangan, Keluhan } from '../types';
import { LucideIcon } from './LucideIcon';
import { LiveViewfinder } from './LiveViewfinder';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface PengajarPanelProps {
  db: K_DB;
  activeUser: { nama: string; role: string; id_santri?: string } | null;
  activeTab: string;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, callback: (yes: boolean) => void) => void;
  switchTab: (tabId: string) => void;
}

export function PengajarPanel({
  db,
  activeUser,
  activeTab,
  syncDbState,
  showToast,
  showConfirm,
  switchTab
}: PengajarPanelProps) {
  const todayStr = "2026-07-12";
  const currentUstadz = activeUser?.nama || "Ustadz Ahmad";

  // Safe accessor fallbacks
  const santriList = db.santri || [];
  const kelasList = db.kelas_list || [];
  const sholatRules = db.sholat_rules || [];
  const laporanList = db.laporan_perkembangan || [];
  const keluhanList = db.keluhan || [];
  const absensiKelasList = db.absensi_kelas || [];
  const absensiSholatList = db.absensi_sholat || [];
  const perizinanList = db.perizinan || [];
  const tutupAbsenKelas = db.tutup_absen_kelas || {};
  const tutupAbsenSholat = db.tutup_absen_sholat || {};

  // --- LOCAL RECORDED SCAN TIMESTAMPS (FOR REALISTIC UI MATCHES) ---
  const [scannedClassTimes, setScannedClassTimes] = useState<Record<string, string>>({
    "SNT-002": "10:06:36",
    "SNT-003": "10:14:21"
  });
  const [scannedPrayerTimes, setScannedPrayerTimes] = useState<Record<string, string>>({});
  const [isKbmScanOpen, setIsKbmScanOpen] = useState(false);
  const [isSholatScanOpen, setIsSholatScanOpen] = useState(false);

  // --- TAB: ABSENSI KELAS STATE ---
  const [selectedClassId, setSelectedClassId] = useState<string>(kelasList[0]?.id_kelas || "");
  const currentClass = kelasList.find(c => c.id_kelas === selectedClassId) || kelasList[0];
  const classStudents = currentClass 
    ? santriList.filter(s => s.kelas === currentClass.nama_kelas)
    : [];

  // --- TAB: ABSEN SHOLAT STATE ---
  const [selectedPrayerId, setSelectedPrayerId] = useState<string>(sholatRules[0]?.id_sholat || "");
  const currentPrayer = sholatRules.find(p => p.id_sholat === selectedPrayerId) || sholatRules[0];
  const [simulatedScanTime, setSimulatedScanTime] = useState("18:05");

  // --- TAB: CONTROLS & IZIN STATES ---
  const [isIzinModalOpen, setIsIzinModalOpen] = useState(false);
  const [newIzinSantriId, setNewIzinSantriId] = useState(santriList[0]?.id_santri || "");
  const [newIzinTipe, setNewIzinTipe] = useState<"SAKIT" | "IZIN">("IZIN");
  const [newIzinMulai, setNewIzinMulai] = useState(todayStr);
  const [newIzinSelesai, setNewIzinSelesai] = useState(todayStr);
  const [newIzinKeterangan, setNewIzinKeterangan] = useState("");

  // --- TAB: LAPORAN PERKEMBANGAN STATES ---
  const [laporScope, setLaporScope] = useState<"Individu" | "Kelas">("Individu");
  const [laporSantriId, setLaporSantriId] = useState(santriList[0]?.id_santri || "");
  const [laporClassId, setLaporClassId] = useState(kelasList[0]?.id_kelas || "");
  const [laporTanggal, setLaporTanggal] = useState(todayStr);
  const [laporSubjek, setLaporSubjek] = useState("");
  const [laporIsi, setLaporIsi] = useState("");

  // --- TAB: REKAP FILTERS STATES ---
  const [rekapTab, setRekapTab] = useState<"KBM" | "SHOLAT">("KBM");
  const [filterClass, setFilterClass] = useState("Semua Kelas");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterDate, setFilterDate] = useState(todayStr);

  // --- TAB: PRINT DIALOG STATE ---
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // --- TAB: ASPIRASI / KELUHAN WALI RESPONSE STATE ---
  const [jawabanTexts, setJawabanTexts] = useState<Record<string, string>>({});

  // Helper formats
  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  // Helper prayer time status detection
  const calculatePrayerStatus = (scanTimeStr: string, prayerTimeStr: string, toleranceMin: number): "TEPAT_WAKTU" | "MASBUQ" => {
    try {
      const [scanH, scanM] = scanTimeStr.split(":").map(Number);
      const [prayerH, prayerM] = prayerTimeStr.split(":").map(Number);
      if (isNaN(scanH) || isNaN(scanM) || isNaN(prayerH) || isNaN(prayerM)) return "TEPAT_WAKTU";
      const scanTotal = scanH * 60 + scanM;
      const prayerTotal = prayerH * 60 + prayerM;
      if (scanTotal <= prayerTotal + toleranceMin) {
        return "TEPAT_WAKTU";
      }
      return "MASBUQ";
    } catch {
      return "TEPAT_WAKTU";
    }
  };

  // Get current timestamp format e.g. "18:06:36"
  const getNowTimeStr = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  // --- ACTIONS: ABSENSI KELAS ---
  const handleClassScan = (santri: Santri) => {
    if (!currentClass) return;
    const key = `${todayStr}_${currentClass.id_kelas}`;
    if (tutupAbsenKelas[key]) {
      showToast("Sesi absensi untuk kelas ini hari ini sudah dikunci & ditutup!", "error");
      return;
    }

    const timeStr = getNowTimeStr();
    setScannedClassTimes(prev => ({ ...prev, [santri.id_santri]: timeStr }));

    const updatedAbsensi = [...absensiKelasList];
    const existingIndex = updatedAbsensi.findIndex(
      a => a.tanggal === todayStr && a.id_santri === santri.id_santri
    );

    if (existingIndex > -1) {
      updatedAbsensi[existingIndex].status = "HADIR";
    } else {
      updatedAbsensi.push({
        tanggal: todayStr,
        kelas: currentClass.nama_kelas,
        id_santri: santri.id_santri,
        status: "HADIR",
        locked: false
      });
    }

    const updatedDb: K_DB = {
      ...db,
      absensi_kelas: updatedAbsensi
    };

    syncDbState(updatedDb).then(() => {
      showToast(`Scan Barcode Berhasil: ${santri.nama_santri} dicatat HADIR (${timeStr}).`, "success");
    });
  };

  const handleClassStatusChange = (santriId: string, newStatus: "HADIR" | "IZIN" | "SAKIT" | "ALFA") => {
    if (!currentClass) return;
    const key = `${todayStr}_${currentClass.id_kelas}`;
    if (tutupAbsenKelas[key]) {
      showToast("Sesi absensi sudah terkunci!", "error");
      return;
    }

    if (newStatus === "HADIR" && !scannedClassTimes[santriId]) {
      setScannedClassTimes(prev => ({ ...prev, [santriId]: getNowTimeStr() }));
    }

    const updatedAbsensi = [...absensiKelasList];
    const existingIndex = updatedAbsensi.findIndex(
      a => a.tanggal === todayStr && a.id_santri === santriId
    );

    if (existingIndex > -1) {
      updatedAbsensi[existingIndex].status = newStatus;
    } else {
      updatedAbsensi.push({
        tanggal: todayStr,
        kelas: currentClass.nama_kelas,
        id_santri: santriId,
        status: newStatus,
        locked: false
      });
    }

    const updatedDb: K_DB = {
      ...db,
      absensi_kelas: updatedAbsensi
    };

    syncDbState(updatedDb).then(() => {
      showToast(`Status kehadiran manual berhasil diubah ke ${newStatus}.`, "success");
    });
  };

  const closeClassAttendance = () => {
    if (!currentClass) return;
    showConfirm(`Tutup absensi & kunci sesi kelas ${currentClass.nama_kelas} hari ini? Santri yang belum terekam otomatis di-ALFA.`, (yes) => {
      if (yes) {
        const key = `${todayStr}_${currentClass.id_kelas}`;
        const newTutup = { ...tutupAbsenKelas, [key]: true };
        
        // Auto-fill ALFA for missing class students
        const updatedAbsensi = [...absensiKelasList];
        classStudents.forEach(student => {
          const hasRecord = updatedAbsensi.some(
            a => a.tanggal === todayStr && a.id_santri === student.id_santri
          );
          if (!hasRecord) {
            updatedAbsensi.push({
              tanggal: todayStr,
              kelas: currentClass.nama_kelas,
              id_santri: student.id_santri,
              status: "ALFA",
              locked: true
            });
          } else {
            // Lock existing ones
            const idx = updatedAbsensi.findIndex(
              a => a.tanggal === todayStr && a.id_santri === student.id_santri
            );
            if (idx > -1) {
              updatedAbsensi[idx].locked = true;
            }
          }
        });

        const updatedDb: K_DB = {
          ...db,
          absensi_kelas: updatedAbsensi,
          tutup_absen_kelas: newTutup
        };

        syncDbState(updatedDb).then(() => {
          showToast(`Sesi kelas ${currentClass.nama_kelas} berhasil dikunci dan ditutup!`, "info");
        });
      }
    });
  };

  // --- ACTIONS: ABSEN SHOLAT ---
  const handlePrayerScan = (santri: Santri) => {
    if (!currentPrayer) return;
    const key = `${todayStr}_${currentPrayer.id_sholat}`;
    if (tutupAbsenSholat[key]) {
      showToast("Sesi sholat ini sudah dikunci & ditutup!", "error");
      return;
    }

    const computedStatus = calculatePrayerStatus(
      simulatedScanTime,
      currentPrayer.waktu,
      currentPrayer.toleransi
    );

    const timeStr = `${simulatedScanTime}:00`;
    setScannedPrayerTimes(prev => ({ ...prev, [santri.id_santri]: timeStr }));

    const updatedAbsensi = [...absensiSholatList];
    const existingIndex = updatedAbsensi.findIndex(
      a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === santri.id_santri
    );

    if (existingIndex > -1) {
      updatedAbsensi[existingIndex].status = computedStatus;
    } else {
      updatedAbsensi.push({
        tanggal: todayStr,
        sholat: currentPrayer.id_sholat,
        id_santri: santri.id_santri,
        status: computedStatus,
        locked: false
      });
    }

    const updatedDb: K_DB = {
      ...db,
      absensi_sholat: updatedAbsensi
    };

    syncDbState(updatedDb).then(() => {
      showToast(`Scan Sholat Berhasil: ${santri.nama_santri} dicatat ${computedStatus.replace('_', ' ')} (Pukul ${simulatedScanTime}).`, "success");
    });
  };

  const handlePrayerStatusChange = (santriId: string, newStatus: "TEPAT_WAKTU" | "MASBUQ" | "TIDAK_HADIR") => {
    if (!currentPrayer) return;
    const key = `${todayStr}_${currentPrayer.id_sholat}`;
    if (tutupAbsenSholat[key]) {
      showToast("Sesi sholat sudah terkunci!", "error");
      return;
    }

    if (newStatus !== "TIDAK_HADIR" && !scannedPrayerTimes[santriId]) {
      setScannedPrayerTimes(prev => ({ ...prev, [santriId]: `${simulatedScanTime}:00` }));
    }

    const updatedAbsensi = [...absensiSholatList];
    const existingIndex = updatedAbsensi.findIndex(
      a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === santriId
    );

    if (existingIndex > -1) {
      updatedAbsensi[existingIndex].status = newStatus;
    } else {
      updatedAbsensi.push({
        tanggal: todayStr,
        sholat: currentPrayer.id_sholat,
        id_santri: santriId,
        status: newStatus,
        locked: false
      });
    }

    const updatedDb: K_DB = {
      ...db,
      absensi_sholat: updatedAbsensi
    };

    syncDbState(updatedDb).then(() => {
      showToast(`Status sholat manual berhasil diubah.`, "success");
    });
  };

  const closePrayerAttendance = () => {
    if (!currentPrayer) return;
    showConfirm(`Tutup absensi sholat ${currentPrayer.nama} hari ini? Santri yang belum terekam otomatis di-TIDAK HADIR.`, (yes) => {
      if (yes) {
        const key = `${todayStr}_${currentPrayer.id_sholat}`;
        const newTutup = { ...tutupAbsenSholat, [key]: true };

        // Auto-fill TIDAK HADIR for missing students
        const updatedAbsensi = [...absensiSholatList];
        santriList.forEach(student => {
          const hasRecord = updatedAbsensi.some(
            a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === student.id_santri
          );
          if (!hasRecord) {
            updatedAbsensi.push({
              tanggal: todayStr,
              sholat: currentPrayer.id_sholat,
              id_santri: student.id_santri,
              status: "TIDAK_HADIR",
              locked: true
            });
          } else {
            const idx = updatedAbsensi.findIndex(
              a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === student.id_santri
            );
            if (idx > -1) {
              updatedAbsensi[idx].locked = true;
            }
          }
        });

        const updatedDb: K_DB = {
          ...db,
          absensi_sholat: updatedAbsensi,
          tutup_absen_sholat: newTutup
        };

        syncDbState(updatedDb).then(() => {
          showToast(`Sesi sholat ${currentPrayer.nama} berhasil dikunci dan ditutup!`, "info");
        });
      }
    });
  };

  // --- ACTIONS: PERIZINAN / LEAVE PERMITS ---
  const handleAddIzin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIzinSantriId) {
      showToast("Pilih santri terlebih dahulu!", "error");
      return;
    }

    const santriObj = santriList.find(s => s.id_santri === newIzinSantriId);
    if (!santriObj) return;

    const newIzin: Perizinan = {
      id_izin: `IZN-${Date.now().toString().slice(-4)}`,
      id_santri: newIzinSantriId,
      tipe: newIzinTipe,
      tanggal_mulai: newIzinMulai,
      tanggal_selesai: newIzinSelesai,
      keterangan: newIzinKeterangan,
      status: "BARU"
    };

    const updatedDb: K_DB = {
      ...db,
      perizinan: [newIzin, ...perizinanList]
    };

    syncDbState(updatedDb).then(() => {
      showToast(`Izin baru berhasil diajukan untuk ${santriObj.nama_santri}.`, "success");
      setIsIzinModalOpen(false);
      setNewIzinKeterangan("");
    });
  };

  const handleApproveIzin = (izin: Perizinan) => {
    showConfirm(`Setujui pengajuan izin ${izin.tipe} untuk santri ini? Status absensi kelas tanggal terkait otomatis terisi.`, (yes) => {
      if (yes) {
        const updatedPerizinan = perizinanList.map(p => {
          if (p.id_izin === izin.id_izin) {
            return { ...p, status: "DISETUJUI" as const };
          }
          return p;
        });

        const santriObj = santriList.find(s => s.id_santri === izin.id_santri);
        const updatedAbsensi = [...absensiKelasList];
        
        if (santriObj) {
          const attendanceStatus = izin.tipe === "SAKIT" ? "SAKIT" as const : "IZIN" as const;
          const existingIdx = updatedAbsensi.findIndex(
            a => a.tanggal === todayStr && a.id_santri === izin.id_santri
          );
          if (existingIdx > -1) {
            updatedAbsensi[existingIdx].status = attendanceStatus;
          } else {
            updatedAbsensi.push({
              tanggal: todayStr,
              kelas: santriObj.kelas,
              id_santri: izin.id_santri,
              status: attendanceStatus,
              locked: false
            });
          }
        }

        const updatedDb: K_DB = {
          ...db,
          perizinan: updatedPerizinan,
          absensi_kelas: updatedAbsensi
        };

        syncDbState(updatedDb).then(() => {
          showToast("Izin telah disetujui & disinkronisasikan ke sistem presensi KBM.", "success");
        });
      }
    });
  };

  const handleDeleteIzin = (idIzin: string) => {
    showConfirm("Hapus data perizinan ini?", (yes) => {
      if (yes) {
        const updated = perizinanList.filter(p => p.id_izin !== idIzin);
        syncDbState({ ...db, perizinan: updated }).then(() => {
          showToast("Data perizinan berhasil dihapus.", "info");
        });
      }
    });
  };

  // --- ACTIONS: LAPORAN PERKEMBANGAN (INDIVIDUAL / KELAS) ---
  const handleAddLaporan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laporSubjek.trim() || !laporIsi.trim()) {
      showToast("Mohon lengkapi subjek dan isi laporan perkembangan!", "error");
      return;
    }

    let targetSasaran = "";
    if (laporScope === "Individu") {
      const targetSantri = santriList.find(s => s.id_santri === laporSantriId);
      if (!targetSantri) return;
      targetSasaran = targetSantri.nama_santri;
    } else {
      const targetClassObj = kelasList.find(c => c.id_kelas === laporClassId);
      if (!targetClassObj) return;
      targetSasaran = targetClassObj.nama_kelas;
    }

    const newLaporan: LaporanPerkembangan = {
      id_laporan: `REP-${Date.now().toString().slice(-3)}`,
      tanggal: laporTanggal,
      pengirim: currentUstadz,
      tipe: laporScope,
      sasaran: targetSasaran,
      subjek: laporSubjek,
      isi: laporIsi,
      status: "AKTIF"
    };

    const updatedDb: K_DB = {
      ...db,
      laporan_perkembangan: [newLaporan, ...laporanList]
    };

    syncDbState(updatedDb).then(() => {
      showToast(`Laporan perkembangan ${laporScope} berhasil dikirim dan diarsipkan.`, "success");
      setLaporSubjek("");
      setLaporIsi("");
    });
  };

  const handleDeleteLaporan = (idLapor: string) => {
    showConfirm("Hapus laporan perkembangan ini?", (yes) => {
      if (yes) {
        const updated = laporanList.filter(l => l.id_laporan !== idLapor);
        syncDbState({ ...db, laporan_perkembangan: updated }).then(() => {
          showToast("Laporan berhasil dihapus.", "info");
        });
      }
    });
  };

  // --- ACTIONS: RESPOND TO KELUHAN (ASPIRASI WALI) ---
  const handleRespondKeluhan = (idKeluhan: string) => {
    const responseText = jawabanTexts[idKeluhan];
    if (!responseText || !responseText.trim()) {
      showToast("Ketik jawaban tanggapan terlebih dahulu!", "error");
      return;
    }

    const updatedKeluhan = keluhanList.map(k => {
      if (k.id_keluhan === idKeluhan) {
        return {
          ...k,
          status: "SELESAI" as const,
          jawaban: responseText
        };
      }
      return k;
    });

    const updatedDb: K_DB = {
      ...db,
      keluhan: updatedKeluhan
    };

    syncDbState(updatedDb).then(() => {
      showToast("Tanggapan aspirasi berhasil dikirim ke Wali Santri.", "success");
      setJawabanTexts({
        ...jawabanTexts,
        [idKeluhan]: ""
      });
    });
  };

  // --- REKAP & JURNAL FILTER LOGIC ---
  const getFilteredLogs = () => {
    if (rekapTab === "KBM") {
      return absensiKelasList.filter(log => {
        const sObj = santriList.find(s => s.id_santri === log.id_santri);
        if (!sObj) return false;

        const matchesClass = filterClass === "Semua Kelas" || sObj.kelas === filterClass;
        const matchesStatus = filterStatus === "Semua Status" || log.status === filterStatus;
        const matchesDate = !filterDate || log.tanggal === filterDate;

        return matchesClass && matchesStatus && matchesDate;
      }).map(log => {
        const sObj = santriList.find(s => s.id_santri === log.id_santri);
        const recordedTime = scannedClassTimes[log.id_santri] || "07:30:00";
        return {
          waktu: `${log.tanggal} (${recordedTime})`,
          nama: sObj?.nama_santri || "N/A",
          kelas: sObj?.kelas || "N/A",
          status: log.status,
          rawStatus: log.status
        };
      });
    } else {
      return absensiSholatList.filter(log => {
        const sObj = santriList.find(s => s.id_santri === log.id_santri);
        if (!sObj) return false;

        const pObj = sholatRules.find(p => p.id_sholat === log.sholat);
        const matchesClass = filterClass === "Semua Kelas" || sObj.kelas === filterClass;
        
        let matchesStatus = true;
        if (filterStatus !== "Semua Status") {
          matchesStatus = log.status === filterStatus;
        }

        const matchesDate = !filterDate || log.tanggal === filterDate;
        return matchesClass && matchesStatus && matchesDate;
      }).map(log => {
        const sObj = santriList.find(s => s.id_santri === log.id_santri);
        const pObj = sholatRules.find(p => p.id_sholat === log.sholat);
        const recordedTime = scannedPrayerTimes[log.id_santri] || `${pObj?.waktu || '18:00'}:00`;
        return {
          waktu: `${log.tanggal} (${recordedTime})`,
          nama: sObj?.nama_santri || "N/A",
          kelas: `${sObj?.kelas || 'N/A'} - [${pObj?.nama || 'Isya'}]`,
          status: log.status.replace('_', ' '),
          rawStatus: log.status
        };
      });
    }
  };

  const filteredLogs = getFilteredLogs();

  // Export Filtered Logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast("Tidak ada entri log untuk diekspor!", "error");
      return;
    }

    const headers = ["Waktu Perekaman", "Nama Lengkap", "Kelas/Sesi", "Status Presensi"];
    const rows = filteredLogs.map(log => [
      log.waktu,
      log.nama,
      log.kelas,
      log.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Jurnal_Presensi_${rekapTab}_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("File jurnal berhasil diekspor sebagai CSV.", "success");
  };

  return (
    <div className="w-full">
      
      {/* 1. DASHBOARD TAB */}
      {activeTab === 'pengajar-dashboard' && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-[#021814]/80 to-[#03231e]/50">
            <div className="absolute top-0 right-0 p-8 text-7xl opacity-5 select-none pointer-events-none">🕌</div>
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">Panel Asatidzah</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-100 mt-2">Ahlan Wa Sahlan, {currentUstadz}</h2>
              <p className="text-xs text-emerald-400/80 mt-1 max-w-xl">Mari bimbing akhlak, kawal absensi harian, dan setoran hafalan santri secara takdzim, profesional, serta akuntabel.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-emerald-500/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <LucideIcon name="users" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono font-bold">Total Santri</p>
                <h3 className="text-lg font-black text-gray-100">{santriList.length} Anak</h3>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-emerald-500/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <LucideIcon name="check-square" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-amber-500/60 uppercase tracking-wider font-mono font-bold">KBM Terabsen</p>
                <h3 className="text-lg font-black text-gray-100">
                  {absensiKelasList.filter(a => a.tanggal === todayStr && a.status === "HADIR").length} Santri
                </h3>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-emerald-500/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <LucideIcon name="trending-up" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-emerald-500/60 uppercase tracking-wider font-mono font-bold">Laporan Dikirim</p>
                <h3 className="text-lg font-black text-gray-100">{laporanList.length} Berkas</h3>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-emerald-500/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <LucideIcon name="message-square" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-amber-500/60 uppercase tracking-wider font-mono font-bold">Keluhan Wali</p>
                <h3 className="text-lg font-black text-gray-100">
                  {keluhanList.filter(k => k.status === "BARU").length} Masukan
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Quick Actions */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 space-y-4">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-emerald-950/50 pb-2">Akses Cepat Presensi Cerdas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => switchTab('pengajar-absensikelas')}
                  className="p-4 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 transition-all text-left flex gap-3 items-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all">
                    <LucideIcon name="scan" className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-200">Presensi Kelas</h5>
                    <p className="text-[10px] text-emerald-500/60 mt-0.5">Pemindai KBM Pintu</p>
                  </div>
                </button>

                <button 
                  onClick={() => switchTab('pengajar-absensisholat')}
                  className="p-4 rounded-xl border border-amber-500/10 hover:border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/20 transition-all text-left flex gap-3 items-center group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all">
                    <LucideIcon name="activity" className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-200">Presensi Sholat</h5>
                    <p className="text-[10px] text-amber-500/60 mt-0.5">Toleransi Masbuq Cerdas</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Reports */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Laporan Perkembangan Terakhir</h4>
                <button 
                  onClick={() => switchTab('pengajar-laporan')} 
                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                >
                  Buat Lapor Baru
                </button>
              </div>
              <div className="space-y-3 max-h-[180px] overflow-y-auto no-scrollbar">
                {laporanList.slice().reverse().slice(0, 3).map(lap => (
                  <div key={lap.id_laporan} className="p-3 bg-emerald-950/10 border border-emerald-500/5 rounded-xl flex justify-between items-center gap-2">
                    <div className="truncate">
                      <h5 className="text-xs font-bold text-gray-200 truncate">{lap.subjek}</h5>
                      <p className="text-[10px] text-emerald-500/60 truncate mt-0.5">Sasaran: {lap.sasaran} • {lap.tanggal}</p>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 font-mono">
                      {lap.tipe}
                    </span>
                  </div>
                ))}
                {laporanList.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Belum ada laporan perkembangan yang terkirim.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 2. ABSENSI KELAS TAB */}
      {activeTab === 'pengajar-absensikelas' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-emerald-950/50">
              <div>
                <h2 className="text-lg font-black text-gray-200">Pemindai Barcode KBM Kelas</h2>
                <p className="text-xs text-gray-400 mt-0.5">Proteksi anti double-scan otomatis aktif terintegrasi cloud.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-2 bg-emerald-950/80 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  {kelasList.map(c => (
                    <option key={c.id_kelas} value={c.id_kelas}>{c.nama_kelas} (Wali: {c.wali_kelas})</option>
                  ))}
                </select>

                <span className="text-xs text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10 font-mono">
                  Petugas: {currentUstadz}
                </span>
              </div>
            </div>

            {/* Simulated Live Viewfinder */}
            {currentClass && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left: Always-on Scanner */}
                <div className="md:col-span-5 relative group">
                  <LiveBarcodeScanner
                    title="Presensi KBM via Barcode"
                    subtitle="Dekatkan kartu barcode/ID Card santri"
                    isInline={true}
                    onScanSuccess={(decodedText) => {
                      const cleaned = decodedText.trim();
                      const foundAll = db.santri.find(s => s.barcode.toLowerCase() === cleaned.toLowerCase());
                      if (foundAll) {
                        const foundInClass = classStudents.find(s => s.barcode.toLowerCase() === cleaned.toLowerCase());
                        if (foundInClass) {
                          handleClassScan(foundInClass);
                        } else {
                          showToast(`Santri "${foundAll.nama_santri}" terdaftar di kelas ${foundAll.kelas}, bukan kelas ini!`, "error");
                        }
                      } else {
                        showToast(`Barcode "${decodedText}" tidak terdaftar di sistem!`, "error");
                      }
                    }}
                    dummyOptions={classStudents.map(s => ({
                      label: s.nama_santri,
                      code: s.barcode,
                      subLabel: s.kelas
                    }))}
                  />
                </div>

                {/* Right: Real-time Monitor */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-emerald-950/30 pb-2 mb-3">
                      <span className="text-xs font-extrabold uppercase text-gray-300 font-mono tracking-wider">
                        MONITOR PRESENSI KBM HARI INI:
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {classStudents.filter(s => absensiKelasList.some(a => a.tanggal === todayStr && a.id_santri === s.id_santri && a.status === "HADIR")).length} / {classStudents.length} Terabsen
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 mb-4">Simulasikan penempelan fisik Kartu Pintar Santri (RFID Tag/Barcode) dengan mengklik nama santri di bawah ini.</p>

                    {/* Student cards list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
                      {classStudents.map(student => {
                        const record = absensiKelasList.find(
                          a => a.tanggal === todayStr && a.id_santri === student.id_santri
                        );
                        const status = record?.status || "BELUM_REKAM";
                        const timeRecorded = scannedClassTimes[student.id_santri];
                        const isLocked = !!tutupAbsenKelas[`${todayStr}_${currentClass.id_kelas}`];

                        return (
                          <div 
                            key={student.id_santri}
                            onClick={() => !isLocked && status !== "HADIR" && handleClassScan(student)}
                            className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                              isLocked ? 'bg-gray-900/30 border-gray-800 opacity-60 cursor-not-allowed' :
                              status === "HADIR" ? 'bg-blue-950/20 border-blue-500/30 hover:bg-blue-950/30 cursor-pointer' :
                              'bg-emerald-950/10 border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-950/30 cursor-pointer'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <h4 className="text-xs font-bold text-gray-200 truncate">{student.nama_santri}</h4>
                              <p className="text-[10px] text-emerald-500/60 font-medium">Kelas {student.kelas}</p>
                            </div>
                            <span className={`text-[10px] font-mono shrink-0 font-bold ${
                              status === "HADIR" ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {status === "HADIR" ? `[${timeRecorded || '10:06:36'}]` : '[BELUM]'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-950/50 flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-mono">
                      {classStudents.filter(s => absensiKelasList.some(a => a.tanggal === todayStr && a.id_santri === s.id_santri && a.status === "HADIR")).length} Santri Sukses Ter-scan Jurnal
                    </span>

                    <button 
                      onClick={() => switchTab('pengajar-dashboard')}
                      className="px-5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LucideIcon name="layout-dashboard" className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* Complete Manual Ledger Table below */}
            {currentClass && (
              <div className="mt-8 space-y-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Lembar Kehadiran Manual Hari Ini ({todayStr})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-950/50 text-emerald-500/70 font-mono">
                        <th className="py-2.5 px-3">NIS/ID</th>
                        <th className="py-2.5 px-3">Nama Lengkap</th>
                        <th className="py-2.5 px-3">Barcode</th>
                        <th className="py-2.5 px-3 text-center">Kehadiran</th>
                        <th className="py-2.5 px-3 text-right">Opsi Pengubahan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map(student => {
                        const record = absensiKelasList.find(
                          a => a.tanggal === todayStr && a.id_santri === student.id_santri
                        );
                        const status = record?.status || "BELUM_REKAM";
                        const isLocked = !!tutupAbsenKelas[`${todayStr}_${currentClass.id_kelas}`];

                        return (
                          <tr key={student.id_santri} className="border-b border-emerald-950/30 hover:bg-emerald-950/10">
                            <td className="py-3 px-3 font-mono text-[11px]">{student.id_santri}</td>
                            <td className="py-3 px-3 font-medium text-gray-100">{student.nama_santri}</td>
                            <td className="py-3 px-3 font-mono text-[10px] text-gray-400">{student.barcode}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                                status === "HADIR" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                status === "IZIN" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                status === "SAKIT" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                status === "ALFA" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                "bg-gray-800 text-gray-400 border-gray-700"
                              }`}>
                                {status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {isLocked ? (
                                <span className="text-[10px] text-gray-500 italic">Sesi Terkunci</span>
                              ) : (
                                <select 
                                  value={record?.status || ""}
                                  onChange={(e) => handleClassStatusChange(student.id_santri, e.target.value as any)}
                                  className="px-2 py-1 bg-emerald-950/50 border border-emerald-900 rounded-lg text-[10px] text-gray-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                  <option value="" disabled>-- Set Kehadiran --</option>
                                  <option value="HADIR">Hadir</option>
                                  <option value="IZIN">Izin</option>
                                  <option value="SAKIT">Sakit</option>
                                  <option value="ALFA">Alfa (Tanpa Keterangan)</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* 3. ABSEN SHOLAT TAB */}
      {activeTab === 'pengajar-absensisholat' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-emerald-950/50">
              <div>
                <h2 className="text-lg font-black text-gray-200">Pemindai Barcode Sholat Jamaah</h2>
                <p className="text-xs text-gray-400 mt-0.5">Pencatatan kehadiran sholat wajib/sunnah aman ganda.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select 
                  value={selectedPrayerId}
                  onChange={(e) => setSelectedPrayerId(e.target.value)}
                  className="px-3 py-2 bg-emerald-950/80 border border-emerald-900 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                >
                  {sholatRules.map(s => (
                    <option key={s.id_sholat} value={s.id_sholat}>Sholat {s.nama} ({s.tipe})</option>
                  ))}
                </select>

                <div className="flex items-center gap-2 bg-emerald-950 px-2.5 py-1.5 rounded-xl border border-emerald-900 text-xs">
                  <span className="text-gray-400 text-[10px]">Jam Scan:</span>
                  <input 
                    type="time" 
                    value={simulatedScanTime}
                    onChange={(e) => setSimulatedScanTime(e.target.value)}
                    className="bg-transparent text-amber-400 font-mono focus:outline-none w-14"
                  />
                </div>
              </div>
            </div>

            {/* Simulated Live Viewfinder */}
            {currentPrayer && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left: Always-on Scanner */}
                <div className="md:col-span-5 relative group">
                  <LiveBarcodeScanner
                    title="Presensi Sholat via Barcode"
                    subtitle="Dekatkan kartu barcode/ID Card santri"
                    isInline={true}
                    onScanSuccess={(decodedText) => {
                      const cleaned = decodedText.trim();
                      const found = db.santri.find(s => s.barcode.toLowerCase() === cleaned.toLowerCase());
                      if (found) {
                        handlePrayerScan(found);
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

                {/* Right: Real-time Monitor */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-emerald-950/30 pb-2 mb-3">
                      <span className="text-xs font-extrabold uppercase text-gray-300 font-mono tracking-wider">
                        MONITOR ABSEN SHOLAT [{currentPrayer.nama}]:
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {santriList.filter(s => absensiSholatList.some(a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === s.id_santri && (a.status === "TEPAT_WAKTU" || a.status === "MASBUQ"))).length} / {santriList.length} Masuk Masjid
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 mb-4">
                      Sistem otomatis mendeteksi santri sebagai <strong className="text-emerald-400">TEPAT WAKTU</strong> jika scan sebelum atau pas batas toleransi. Lebih dari itu dicatat <strong className="text-amber-500">MASBUQ (TELAT)</strong>.
                    </p>

                    {/* Student cards list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
                      {santriList.map(student => {
                        const record = absensiSholatList.find(
                          a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === student.id_santri
                        );
                        const status = record?.status || "BELUM_ABSEN";
                        const timeRecorded = scannedPrayerTimes[student.id_santri];
                        const isLocked = !!tutupAbsenSholat[`${todayStr}_${currentPrayer.id_sholat}`];

                        return (
                          <div 
                            key={student.id_santri}
                            onClick={() => !isLocked && status === "BELUM_ABSEN" && handlePrayerScan(student)}
                            className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                              isLocked ? 'bg-gray-900/30 border-gray-800 opacity-60 cursor-not-allowed' :
                              status === "TEPAT_WAKTU" ? 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/30 cursor-pointer' :
                              status === "MASBUQ" ? 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/30 cursor-pointer' :
                              'bg-emerald-950/10 border-emerald-500/10 hover:border-emerald-500/30 hover:bg-emerald-950/30 cursor-pointer'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <h4 className="text-xs font-bold text-gray-200 truncate">{student.nama_santri}</h4>
                              <p className="text-[10px] text-emerald-500/60 font-medium">{student.kelas}</p>
                            </div>
                            <span className={`text-[10px] font-mono shrink-0 font-bold ${
                              status !== "BELUM_ABSEN" && status !== "TIDAK_HADIR" ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {status !== "BELUM_ABSEN" && status !== "TIDAK_HADIR" ? `[${timeRecorded || simulatedScanTime}]` : '[BELUM]'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-emerald-950/50 flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-mono">
                      {santriList.filter(s => absensiSholatList.some(a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === s.id_santri && (a.status === "TEPAT_WAKTU" || a.status === "MASBUQ"))).length} Santri Ter-scan Jurnal Sholat
                    </span>

                    <button 
                      onClick={closePrayerAttendance}
                      disabled={!!tutupAbsenSholat[`${todayStr}_${currentPrayer.id_sholat}`]}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        tutupAbsenSholat[`${todayStr}_${currentPrayer.id_sholat}`]
                          ? 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed'
                          : 'bg-red-500/20 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-400'
                      }`}
                    >
                      <LucideIcon name="lock" className="w-3.5 h-3.5" />
                      <span>Tutup & Auto-Alfa Sholat {currentPrayer.nama}</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* Complete Manual Ledger Table below */}
            {currentPrayer && (
              <div className="mt-8 space-y-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Hasil Absensi Sholat Jamaah ({todayStr})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-emerald-950/50 text-emerald-500/70 font-mono">
                        <th className="py-2.5 px-3">NIS/ID</th>
                        <th className="py-2.5 px-3">Nama Santri</th>
                        <th className="py-2.5 px-3">Kelas</th>
                        <th className="py-2.5 px-3 text-center">Status Ibadah</th>
                        <th className="py-2.5 px-3 text-right">Penyesuaian Manual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {santriList.map(student => {
                        const record = absensiSholatList.find(
                          a => a.tanggal === todayStr && a.sholat === currentPrayer.id_sholat && a.id_santri === student.id_santri
                        );
                        const status = record?.status || "BELUM_ABSEN";
                        const isLocked = !!tutupAbsenSholat[`${todayStr}_${currentPrayer.id_sholat}`];

                        return (
                          <tr key={student.id_santri} className="border-b border-emerald-950/30 hover:bg-emerald-950/10">
                            <td className="py-3 px-3 font-mono text-[11px]">{student.id_santri}</td>
                            <td className="py-3 px-3 font-medium text-gray-100">{student.nama_santri}</td>
                            <td className="py-3 px-3 text-gray-400">{student.kelas}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                                status === "TEPAT_WAKTU" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                status === "MASBUQ" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                status === "TIDAK_HADIR" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                "bg-gray-800 text-gray-400 border-gray-700"
                              }`}>
                                {status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {isLocked ? (
                                <span className="text-[10px] text-gray-500 italic">Sesi Terkunci</span>
                              ) : (
                                <select 
                                  value={record?.status || ""}
                                  onChange={(e) => handlePrayerStatusChange(student.id_santri, e.target.value as any)}
                                  className="px-2 py-1 bg-emerald-950/50 border border-emerald-900 rounded-lg text-[10px] text-gray-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                  <option value="" disabled>-- Set Kehadiran --</option>
                                  <option value="TEPAT_WAKTU">Tepat Waktu</option>
                                  <option value="MASBUQ">Masbuq (Keterlambatan)</option>
                                  <option value="TIDAK_HADIR">Tidak Hadir (Alfa)</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* 4. KONTROL HARIAN & PERIZINAN SYAR'I TAB */}
      {activeTab === 'pengajar-perizinan' && (
        <div className="space-y-6">
          
          {/* Top Title */}
          <div>
            <h2 className="text-xl font-black text-gray-200">Kontrol Harian & Izin Syar'i</h2>
            <p className="text-xs text-gray-400 mt-1">Registrasi santri sakit/izin harian, dan lakukan penutupan presensi kelas Anda.</p>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Card: Leave Registration */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                  <LucideIcon name="file-text" className="w-4 h-4 text-amber-400" />
                  Pendaftaran Surat Izin / Sakit
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Daftarkan surat izin agar tidak terhitung Alfa saat jurnal harian KBM dikunci. Data ini disinkronisasikan otomatis dengan laporan asatidzah.
                </p>
              </div>
              <div className="pt-6">
                <button 
                  onClick={() => setIsIzinModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LucideIcon name="plus" className="w-4 h-4" />
                  <span>Registrasikan Izin Santri</span>
                </button>
              </div>
            </div>

            {/* Right Card: Auto-Alfa Closer */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-1.5">
                  <LucideIcon name="lock" className="w-4 h-4 text-red-400" />
                  Proses Auto-Alfa Harian KBM
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Kunci pengisian log KBM per kelas yang Anda ajar hari ini. Sisanya otomatis menjadi Alfa (tanpa keterangan) di sistem jurnal.
                </p>
              </div>
              <div className="pt-6">
                <button 
                  onClick={closeClassAttendance}
                  className="w-full sm:w-auto px-5 py-2.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LucideIcon name="lock" className="w-4 h-4" />
                  <span>Tutup Absen & Set Auto-Alfa KBM</span>
                </button>
              </div>
            </div>

          </div>

          {/* Lower Permits Table list */}
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <div className="flex justify-between items-center border-b border-emerald-950/50 pb-3 mb-4">
              <h3 className="text-xs font-extrabold uppercase text-gray-300 font-mono tracking-wider">
                BERKAS IZIN / SAKIT TERDAFTAR HARI INI ({todayStr})
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400">
                {perizinanList.filter(p => p.tanggal_mulai <= todayStr && p.tanggal_selesai >= todayStr).length} Santri Berhalangan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-emerald-950/50 text-emerald-500/70 font-mono">
                    <th className="py-2.5 px-3">ID SURAT</th>
                    <th className="py-2.5 px-3">Nama Santri</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Tipe Izin</th>
                    <th className="py-2.5 px-3">Mulai</th>
                    <th className="py-2.5 px-3">Selesai</th>
                    <th className="py-2.5 px-3">Status Verifikasi</th>
                    <th className="py-2.5 px-3">Keterangan / Alasan</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {perizinanList.map((izin) => {
                    const santriObj = santriList.find(s => s.id_santri === izin.id_santri);
                    return (
                      <tr key={izin.id_izin} className="border-b border-emerald-950/30 hover:bg-emerald-950/10">
                        <td className="py-3 px-3 font-mono text-gray-400">{izin.id_izin}</td>
                        <td className="py-3 px-3 font-medium text-gray-100">{santriObj?.nama_santri || 'N/A'}</td>
                        <td className="py-3 px-3 text-gray-300">{santriObj?.kelas || 'N/A'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            izin.tipe === "SAKIT" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {izin.tipe}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-400">{izin.tanggal_mulai}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-400">{izin.tanggal_selesai}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            izin.status === "DISETUJUI" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}>
                            {izin.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-300 truncate max-w-[150px]" title={izin.keterangan}>
                          {izin.keterangan}
                        </td>
                        <td className="py-2 px-3 text-right flex items-center justify-end gap-1.5">
                          {izin.status === "BARU" && (
                            <button 
                              onClick={() => handleApproveIzin(izin)}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold cursor-pointer"
                              title="Setujui perizinan"
                            >
                              <LucideIcon name="check" className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteIzin(izin.id_izin)}
                            className="p-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/20 rounded-lg cursor-pointer"
                          >
                            <LucideIcon name="trash" className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {perizinanList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500 italic text-xs">
                        Belum ada dokumen permohonon izin syar'i masuk hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Permit Dialog */}
          {isIzinModalOpen && (
            <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-md flex items-center justify-center">
              <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full">
                <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                  <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                    <LucideIcon name="file-text" className="w-4 h-4" /> Registrasikan Izin Santri Baru
                  </h3>
                  <button onClick={() => setIsIzinModalOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                    <LucideIcon name="x" className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddIzin} className="space-y-4 text-xs text-gray-300">
                  <div className="space-y-1">
                    <label className="text-emerald-500/80 font-bold block">NAMA SANTRI</label>
                    <select 
                      value={newIzinSantriId}
                      onChange={(e) => setNewIzinSantriId(e.target.value)}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    >
                      {santriList.map(s => (
                        <option key={s.id_santri} value={s.id_santri}>{s.nama_santri} ({s.kelas})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-emerald-500/80 font-bold block">TIPE PERIZINAN</label>
                    <select 
                      value={newIzinTipe}
                      onChange={(e) => setNewIzinTipe(e.target.value as any)}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                    >
                      <option value="IZIN">Izin Syar'i (Bepergian/Kepentingan Keluarga)</option>
                      <option value="SAKIT">Izin Sakit (Klinik/Surat Dokter)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-emerald-500/80 font-bold block">TANGGAL MULAI</label>
                      <input 
                        type="date" 
                        value={newIzinMulai}
                        onChange={(e) => setNewIzinMulai(e.target.value)}
                        className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-emerald-500/80 font-bold block">TANGGAL SELESAI</label>
                      <input 
                        type="date" 
                        value={newIzinSelesai}
                        onChange={(e) => setNewIzinSelesai(e.target.value)}
                        className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-emerald-500/80 font-bold block">KETERANGAN / ALASAN</label>
                    <textarea 
                      rows={3} 
                      value={newIzinKeterangan}
                      onChange={(e) => setNewIzinKeterangan(e.target.value)}
                      placeholder="Tulis alasan izin, cth: Menghadiri pernikahan kakak kandung di Surabaya..."
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                      required
                    ></textarea>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setIsIzinModalOpen(false)} className="w-1/2 py-2.5 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                    <button type="submit" className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold shadow-md">Simpan Berkas</button>
                  </div>
                </form>
              </div>
            </dialog>
          )}

        </div>
      )}


      {/* 5. LAPOR PERKEMBANGAN SANTRI TAB */}
      {activeTab === 'pengajar-laporan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form */}
            <div className="lg:col-span-5 glass-card p-5 rounded-2xl border border-emerald-500/15 h-fit">
              <h2 className="text-base font-bold text-gray-200 border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                <LucideIcon name="send" className="w-5 h-5 text-amber-400" />
                Lapor Perkembangan Santri
              </h2>
              <form onSubmit={handleAddLaporan} className="space-y-4 mt-4">
                
                {/* Individual vs Class Scope selection */}
                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-400 font-mono">CAKUPAN LAPORAN</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLaporScope("Individu")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        laporScope === "Individu"
                          ? 'bg-amber-500 text-emerald-950 border-amber-400'
                          : 'bg-emerald-950 border-emerald-900 text-gray-400 hover:text-white'
                      }`}
                    >
                      Individual Santri
                    </button>
                    <button
                      type="button"
                      onClick={() => setLaporScope("Kelas")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        laporScope === "Kelas"
                          ? 'bg-amber-500 text-emerald-950 border-amber-400'
                          : 'bg-emerald-950 border-emerald-900 text-gray-400 hover:text-white'
                      }`}
                    >
                      Laporan Kelas (Kolektif)
                    </button>
                  </div>
                </div>

                {laporScope === "Individu" ? (
                  <div className="space-y-1">
                    <label className="text-[10px] text-emerald-400 font-mono">PILIH SANTRI SASARAN</label>
                    <select 
                      value={laporSantriId}
                      onChange={(e) => setLaporSantriId(e.target.value)}
                      className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                    >
                      {santriList.map(s => (
                        <option key={s.id_santri} value={s.id_santri}>{s.nama_santri} ({s.kelas})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] text-emerald-400 font-mono">PILIH KELAS SASARAN</label>
                    <select 
                      value={laporClassId}
                      onChange={(e) => setLaporClassId(e.target.value)}
                      className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                    >
                      {kelasList.map(c => (
                        <option key={c.id_kelas} value={c.id_kelas}>{c.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-400 font-mono">TANGGAL LAPORAN</label>
                  <input 
                    type="date" 
                    value={laporTanggal}
                    onChange={(e) => setLaporTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-400 font-mono">SUBJEK LAPORAN (JUDUL)</label>
                  <input 
                    type="text" 
                    placeholder="cth: Kelancaran Setoran Hafalan Baru"
                    value={laporSubjek}
                    onChange={(e) => setLaporSubjek(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-400 font-mono">ISI DESKRIPSI LAPORAN PERKEMBANGAN</label>
                  <textarea 
                    rows={4}
                    placeholder="Tulis sedetail mungkin perkembangan hafalan, nilai kelas, ataupun evaluasi sikap..."
                    value={laporIsi}
                    onChange={(e) => setLaporIsi(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  Kirim Laporan & Arsipkan
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-7 glass-card p-5 rounded-2xl border border-emerald-500/15">
              <h2 className="text-base font-bold text-gray-200 border-b border-emerald-950/50 pb-2">Arsip Riwayat Laporan Terkirim</h2>
              <div className="space-y-4 mt-4 max-h-[500px] overflow-y-auto no-scrollbar">
                {laporanList.slice().reverse().map(lap => (
                  <div key={lap.id_laporan} className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl relative space-y-2">
                    <button 
                      onClick={() => handleDeleteLaporan(lap.id_laporan)}
                      className="absolute top-4 right-4 p-1.5 hover:bg-red-500/10 text-red-400 rounded-lg transition-all cursor-pointer"
                      title="Hapus laporan"
                    >
                      <LucideIcon name="trash" className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        lap.tipe === "Kelas" 
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {lap.tipe}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">{lap.tanggal}</span>
                    </div>

                    <h3 className="text-xs font-bold text-gray-200 pr-8">{lap.subjek}</h3>
                    <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{lap.isi}</p>
                    
                    <div className="flex justify-between items-center text-[10px] text-emerald-500/60 pt-2 border-t border-emerald-950/50">
                      <span>Sasaran: <strong className="text-emerald-400 font-medium">{lap.sasaran}</strong></span>
                      <span>Oleh: <strong>{lap.pengirim}</strong></span>
                    </div>
                  </div>
                ))}
                {laporanList.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-12 italic">Belum ada laporan perkembangan santri yang terkirim.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 6. JURNAL & REKAPITULASI PRESENSI TAB */}
      {activeTab === 'pengajar-rekap' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-emerald-950/50">
              <div>
                <h2 className="text-lg font-black text-gray-200">Jurnal & Rekapitulasi Presensi</h2>
                <p className="text-xs text-gray-400 mt-0.5">Analisis data masuk rekap secara menyeluruh harian.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleExportCSV}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LucideIcon name="download" className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LucideIcon name="printer" className="w-3.5 h-3.5" />
                  <span>Cetak Jurnal</span>
                </button>
              </div>
            </div>

            {/* Inner Subtabs */}
            <div className="flex gap-2 border-b border-emerald-950/30 py-3 mb-4">
              <button
                onClick={() => setRekapTab("KBM")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  rekapTab === "KBM"
                    ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-emerald-950/20'
                }`}
              >
                Jurnal Kelas KBM
              </button>
              <button
                onClick={() => setRekapTab("SHOLAT")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  rekapTab === "SHOLAT"
                    ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-emerald-950/20'
                }`}
              >
                Jurnal Sholat
              </button>
            </div>

            {/* Filters Bar inside beautiful dark container */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-900/40 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-emerald-400 font-mono tracking-wider block mb-1">FILTER KELAS</label>
                <select 
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {kelasList.map(c => (
                    <option key={c.id_kelas} value={c.nama_kelas}>{c.nama_kelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-emerald-400 font-mono tracking-wider block mb-1">STATUS KEHADIRAN</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Semua Status">Semua Status</option>
                  {rekapTab === "KBM" ? (
                    <>
                      <option value="HADIR">Hadir</option>
                      <option value="IZIN">Izin</option>
                      <option value="SAKIT">Sakit</option>
                      <option value="ALFA">Alfa (Absen)</option>
                    </>
                  ) : (
                    <>
                      <option value="TEPAT_WAKTU">Tepat Waktu</option>
                      <option value="MASBUQ">Masbuq (Masjid)</option>
                      <option value="TIDAK_HADIR">Tidak Hadir (Alfa)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-emerald-400 font-mono tracking-wider block mb-1">PILIH TANGGAL REKAP</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Logs Count */}
            <div className="flex justify-between items-center mt-6 mb-3 border-b border-emerald-950/30 pb-2">
              <span className="text-xs font-bold text-gray-300 font-mono uppercase tracking-wider">Lembar Riwayat Presensi</span>
              <span className="text-xs font-mono font-bold text-cyan-400">{filteredLogs.length} Entri Log Terfilter</span>
            </div>

            {/* Table of logs */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-emerald-950/50 text-emerald-500/70 font-mono">
                    <th className="py-2.5 px-3">WAKTU SCAN/PENGISIAN</th>
                    <th className="py-2.5 px-3">NAMA LENGKAP</th>
                    <th className="py-2.5 px-3">KELAS/SESI</th>
                    <th className="py-2.5 px-3 text-center">STATUS</th>
                    <th className="py-2.5 px-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice().reverse().map((log, index) => (
                    <tr key={index} className="border-b border-emerald-950/30 hover:bg-emerald-950/10">
                      <td className="py-3 px-3 font-mono text-gray-400">{log.waktu}</td>
                      <td className="py-3 px-3 font-medium text-gray-100">{log.nama}</td>
                      <td className="py-3 px-3 text-gray-300">{log.kelas}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block border ${
                          log.rawStatus === "HADIR" || log.rawStatus === "TEPAT_WAKTU" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          log.rawStatus === "IZIN" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          log.rawStatus === "SAKIT" || log.rawStatus === "MASBUQ" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                          "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-500">-</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500 italic text-xs">
                        Tidak ada catatan presensi yang cocok dengan filter pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}


      {/* 7. ASPIRASI WALI TAB */}
      {activeTab === 'pengajar-keluhan' && (
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-emerald-500/15">
            <div>
              <h2 className="text-base font-bold text-gray-200">Pusat Aspirasi & Tanggapan Masukan Wali Santri</h2>
              <p className="text-xs text-gray-400 mt-0.5">Berikan tanggapan solutif atas aduan, keluhan, dan saran yang dikirim wali santri.</p>
            </div>

            <div className="mt-5 space-y-4">
              {keluhanList.slice().reverse().map(kel => (
                <div key={kel.id_keluhan} className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-xl space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded">
                        KASUS: {kel.id_keluhan}
                      </span>
                      <h4 className="text-xs font-bold text-gray-200 mt-1">Pengirim Wali: <strong className="text-amber-400">{kel.nama_wali}</strong></h4>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      kel.status === "SELESAI" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {kel.status}
                    </span>
                  </div>

                  <div className="p-3 bg-[#021814]/60 border border-emerald-500/5 rounded-lg text-xs leading-relaxed text-gray-300">
                    "{kel.isi}"
                  </div>

                  {kel.status === "SELESAI" ? (
                    <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg space-y-1">
                      <p className="text-[9px] text-emerald-400 font-mono">TANGGAPAN PENGASUH (TERKIRIM):</p>
                      <p className="text-xs text-gray-200 leading-relaxed italic">"{kel.jawaban}"</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-emerald-950/50">
                      <textarea 
                        rows={2}
                        placeholder="Ketik jawaban/tanggapan solusi ustadz kepada wali santri..."
                        value={jawabanTexts[kel.id_keluhan] || ""}
                        onChange={(e) => setJawabanTexts({
                          ...jawabanTexts,
                          [kel.id_keluhan]: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-emerald-950 border border-emerald-900 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-amber-500"
                      ></textarea>
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handleRespondKeluhan(kel.id_keluhan)}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-[10px] font-extrabold cursor-pointer"
                        >
                          Kirim Tanggapan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {keluhanList.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-12 italic">Belum ada aspirasi atau keluhan masuk dari wali santri.</p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* PRINT DIALOG / REPORT DOCUMENT PREVIEW */}
      {isPrintModalOpen && (
        <dialog open className="printable-dialog backdrop:bg-[#02110e]/80 fixed inset-0 z-[999] bg-transparent focus:outline-none p-4 w-full max-w-4xl flex items-start justify-center overflow-y-auto">
          <div id="print-journal-wrapper" className="bg-white text-black p-8 rounded-2xl w-full max-w-4xl shadow-2xl space-y-6 my-6 relative print:p-0 print:my-0 print:shadow-none">
            
            {/* Close Button & Print Command Triggers */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 print:hidden">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <LucideIcon name="printer" className="w-5 h-5 text-blue-600" />
                Preview Dokumen Cetak Laporan Presensi
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Tutup Preview
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cetak Sekarang (Ctrl+P)
                </button>
              </div>
            </div>

            {/* Real Formal School Letterhead Header */}
            <div className="text-center space-y-1 pb-4 border-b-4 border-double border-gray-800">
              <h2 className="text-xl font-black uppercase tracking-wider font-sans">Pondok Pesantren Tahfidhul Qur'an</h2>
              <h1 className="text-2xl font-black uppercase tracking-tight text-emerald-800 font-sans">{(db.settings.nama_pesantren || "PONPESQU").toUpperCase()}</h1>
              <p className="text-[11px] text-gray-600 italic">{db.settings.address || "Malang, Jawa Timur"} • Telp: {db.settings.phone || "(0341) 555123"} • Email: info@{(db.settings.nama_pesantren || "ponpesqu").toLowerCase()}.sch.id</p>
            </div>

            {/* Document Title Metadata */}
            <div className="flex justify-between items-start text-xs pt-2">
              <div>
                <p><strong>Laporan Dokumen:</strong> Jurnal Presensi Santri ({rekapTab})</p>
                <p><strong>Periode Tanggal:</strong> {filterDate}</p>
                <p><strong>Filter Kelas:</strong> {filterClass}</p>
              </div>
              <div className="text-right">
                <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
                <p><strong>Petugas/Asatidzah:</strong> {currentUstadz}</p>
                <p><strong>Status Filter:</strong> {filterStatus}</p>
              </div>
            </div>

            {/* Printable logs table */}
            <div className="pt-2">
              <table className="w-full text-left text-xs border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-400 text-gray-800">
                    <th className="py-2 px-3 border border-gray-400 font-bold">No</th>
                    <th className="py-2 px-3 border border-gray-400 font-bold">Waktu Scan/Perekaman</th>
                    <th className="py-2 px-3 border border-gray-400 font-bold">Nama Lengkap Santri</th>
                    <th className="py-2 px-3 border border-gray-400 font-bold">Kelas / Sesi</th>
                    <th className="py-2 px-3 border border-gray-400 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice().reverse().map((log, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="py-2 px-3 border border-gray-300 font-mono text-center">{index + 1}</td>
                      <td className="py-2 px-3 border border-gray-300 font-mono">{log.waktu}</td>
                      <td className="py-2 px-3 border border-gray-300 font-medium">{log.nama}</td>
                      <td className="py-2 px-3 border border-gray-300">{log.kelas}</td>
                      <td className="py-2 px-3 border border-gray-300 text-center font-bold">{log.status}</td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                        Tidak ada catatan log presensi terfilter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-6 pt-12 text-center text-xs">
              <div>
                <p className="text-gray-500">Mengetahui,</p>
                <p className="font-bold text-gray-800 mt-1">Pengasuh Pondok Pesantren</p>
                <div className="h-16"></div>
                <p className="font-bold underline text-gray-900">KH. HASAN ABDULLAH</p>
              </div>
              <div>
                <p className="text-gray-500">Malang, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold text-gray-800 mt-1">Ustadz Pembimbing Kelas</p>
                <div className="h-16"></div>
                <p className="font-bold underline text-gray-900">{currentUstadz}</p>
              </div>
            </div>

          </div>
        </dialog>
      )}

      {isKbmScanOpen && (
        <LiveBarcodeScanner
          title="Presensi KBM via Barcode"
          subtitle="Pindai kartu pintar / ID Card santri"
          onScanSuccess={(decodedText) => {
            const cleaned = decodedText.trim();
            const foundAll = db.santri.find(s => s.barcode.toLowerCase() === cleaned.toLowerCase());
            if (foundAll) {
              const foundInClass = classStudents.find(s => s.barcode.toLowerCase() === cleaned.toLowerCase());
              if (foundInClass) {
                handleClassScan(foundInClass);
                setIsKbmScanOpen(false);
              } else {
                showToast(`Santri "${foundAll.nama_santri}" terdaftar di kelas ${foundAll.kelas}, bukan kelas ini!`, "error");
                setIsKbmScanOpen(false);
              }
            } else {
              showToast(`Barcode "${decodedText}" tidak terdaftar di sistem!`, "error");
              setIsKbmScanOpen(false);
            }
          }}
          onClose={() => setIsKbmScanOpen(false)}
          dummyOptions={classStudents.map(s => ({
            label: s.nama_santri,
            code: s.barcode,
            subLabel: s.kelas
          }))}
        />
      )}

      {isSholatScanOpen && (
        <LiveBarcodeScanner
          title="Presensi Sholat via Barcode"
          subtitle="Pindai kartu pintar / ID Card santri"
          onScanSuccess={(decodedText) => {
            const cleaned = decodedText.trim();
            const found = db.santri.find(s => s.barcode.toLowerCase() === cleaned.toLowerCase());
            if (found) {
              handlePrayerScan(found);
              setIsSholatScanOpen(false);
            } else {
              showToast(`Barcode "${decodedText}" tidak terdaftar di sistem!`, "error");
              setIsSholatScanOpen(false);
            }
          }}
          onClose={() => setIsSholatScanOpen(false)}
          dummyOptions={db.santri.map(s => ({
            label: s.nama_santri,
            code: s.barcode,
            subLabel: s.kelas
          }))}
        />
      )}

    </div>
  );
}
