import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { K_DB, Santri, Tagihan, AsatidzahKontak, Kelas, SholatRule, KasLog, TransaksiTabungan } from '../types';
import { LucideIcon } from './LucideIcon';
import { BarcodeSVG } from './BarcodeSVG';
import { LiveViewfinder } from './LiveViewfinder';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface YayasanPanelProps {
  db: K_DB;
  activeTab: string;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (message: string, callback: (yes: boolean) => void) => void;
  switchTab: (tabId: string) => void;
}

export function YayasanPanel({
  db,
  activeTab,
  syncDbState,
  showToast,
  showConfirm,
  switchTab
}: YayasanPanelProps) {
  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  // --- STATE FOR SEARCH & FILTERS ---
  const [santriSearch, setSantriSearch] = useState("");
  const [santriClassFilter, setSantriClassFilter] = useState("ALL");
  const [tagihanSearch, setTagihanSearch] = useState("");
  const [tagihanStatusFilter, setTagihanStatusFilter] = useState("ALL");

  // --- EXCEL IMPORT/EXPORT STATES ---
  const [isImportSantriOpen, setIsImportSantriOpen] = useState(false);
  const [importedSantriList, setImportedSantriList] = useState<any[]>([]);
  const [importSantriFile, setImportSantriFile] = useState<File | null>(null);

  // --- KAS REPORT PRINTING STATES ---
  const [kasPrintStartDate, setKasPrintStartDate] = useState("2026-06-01");
  const [kasPrintEndDate, setKasPrintEndDate] = useState("2026-07-12");
  const [kasPrintType, setKasPrintType] = useState<"ALL" | "MASUK" | "KELUAR">("ALL");
  const [isKasReportPrintOpen, setIsKasReportPrintOpen] = useState(false);

  // --- MODAL & FORM STATES ---
  // 1. Santri Modal (Add / Edit)
  const [isSantriOpen, setIsSantriOpen] = useState(false);
  const [editSantriId, setEditSantriId] = useState("");
  const [santriForm, setSantriForm] = useState({
    nama_santri: "",
    kelas: db.kelas_list[0]?.nama_kelas || "7A - Salafiyah",
    barcode: "",
    nama_wali: "",
    wa_wali: "",
    alamat: "",
    saldo_utama: 0,
    limit_jajan: 25000,
    limit_belanja: 50000,
    foto_profil: ""
  });

  // 2. Teacher Modal
  const [isTeacherOpen, setIsTeacherOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    nama: "",
    jabatan: "",
    no_wa: "",
    alamat: "",
    username: "",
    pass: "",
    foto_profil: ""
  });

  // 3. Tagihan Modal
  const [isTagihanOpen, setIsTagihanOpen] = useState(false);
  const [tagihanForm, setTagihanForm] = useState({
    targetType: "INDIVIDU" as "INDIVIDU" | "KELAS" | "SEMUA",
    targetSantriId: db.santri[0]?.id_santri || "",
    targetKelas: db.kelas_list[0]?.nama_kelas || "",
    nama_tagihan: "",
    nominal: 150000
  });

  // 4. Kas Modal
  const [isKasOpen, setIsKasOpen] = useState(false);
  const [kasForm, setKasForm] = useState({
    tipe: "MASUK" as "MASUK" | "KELUAR",
    keterangan: "",
    nominal: 0
  });

  // 5. Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    direction: "YAYASAN_TO_MARKET" as "YAYASAN_TO_MARKET" | "MARKET_TO_YAYASAN",
    nominal: 0,
    keterangan: ""
  });

  // 6. Class Modal
  const [isClassOpen, setIsClassOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    nama_kelas: "",
    wali_kelas: db.asatidzah_kontak[0]?.nama || ""
  });

  // 7. Prayer Modal
  const [isPrayerOpen, setIsPrayerOpen] = useState(false);
  const [prayerForm, setPrayerForm] = useState({
    nama: "",
    tipe: "WAJIB" as "WAJIB" | "SUNNAH",
    waktu: "",
    toleransi: 15
  });

  // 8. ID Card Preview
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [previewSantri, setPreviewSantri] = useState<Santri | null>(null);

  // 9. Receipt Modal
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [previewTagihan, setPreviewTagihan] = useState<Tagihan | null>(null);

  // 10. Kiriman (Remittance/Deposit) Tab states
  const [kirimanSearch, setKirimanSearch] = useState("");
  const [selectedSantriKiriman, setSelectedSantriKiriman] = useState<Santri | null>(null);
  const [kirimanAmount, setKirimanAmount] = useState<number>(0);
  const [kirimanType, setKirimanType] = useState<"MASUK" | "KELUAR">("MASUK");
  const [kirimanNote, setKirimanNote] = useState("");

  // 10. Scan Simulator for Santri Search
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isKirimanScanOpen, setIsKirimanScanOpen] = useState(false);
  const [isFormScanOpen, setIsFormScanOpen] = useState(false);

  // --- SANTRI LOGIC ---
  const generateBarcode = () => {
    return "SNT" + Math.floor(100000 + Math.random() * 900000);
  };

  const openAddSantri = () => {
    setEditSantriId("");
    setSantriForm({
      nama_santri: "",
      kelas: db.kelas_list[0]?.nama_kelas || "7A - Salafiyah",
      barcode: generateBarcode(),
      nama_wali: "",
      wa_wali: "",
      alamat: "",
      saldo_utama: 100000,
      limit_jajan: 25000,
      limit_belanja: 50000,
      foto_profil: ""
    });
    setIsSantriOpen(true);
  };

  const openEditSantri = (s: Santri) => {
    setEditSantriId(s.id_santri);
    setSantriForm({
      nama_santri: s.nama_santri,
      kelas: s.kelas,
      barcode: s.barcode,
      nama_wali: s.nama_wali || "",
      wa_wali: s.wa_wali || "",
      alamat: s.alamat || "",
      saldo_utama: s.saldo_utama,
      limit_jajan: s.limit_jajan || 25000,
      limit_belanja: s.limit_belanja || 50000,
      foto_profil: s.foto_profil || ""
    });
    setIsSantriOpen(true);
  };

  const saveSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedSantri = [...db.santri];

    if (editSantriId) {
      updatedSantri = updatedSantri.map(s => {
        if (s.id_santri === editSantriId) {
          return { ...s, ...santriForm };
        }
        return s;
      });
      showToast("Data santri berhasil diperbarui!", "success");
    } else {
      const newId = "SNT-0" + (db.santri.length + 1);
      updatedSantri.push({
        id_santri: newId,
        ...santriForm
      });
      showToast("Santri baru berhasil didaftarkan!", "success");
    }

    await syncDbState({ ...db, santri: updatedSantri });
    setIsSantriOpen(false);
  };

  const deleteSantri = (id: string) => {
    showConfirm("Abah yakin ingin menghapus data santri ini?", async (yes) => {
      if (yes) {
        const filtered = db.santri.filter(s => s.id_santri !== id);
        await syncDbState({ ...db, santri: filtered });
        showToast("Data santri telah dihapus dari sistem.", "info");
      }
    });
  };

  const handleSantriPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSantriForm(prev => ({ ...prev, foto_profil: e.target?.result as string }));
        showToast("✓ Foto Profil terbaca!", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  // --- DOWNLOAD SANTRI EXCEL TEMPLATE ---
  const downloadSantriTemplate = () => {
    const templateData = [
      {
        "Nama Santri": "Ahmad Fauzi",
        "Kelas": db.kelas_list[0]?.nama_kelas || "7A - Salafiyah",
        "Nama Wali": "H. Slamet",
        "WhatsApp Wali": "081234567890",
        "Alamat": "Cirebon, Jawa Barat",
        "Saldo Awal (Rp)": 150000,
        "Limit Jajan Harian (Rp)": 30000,
        "Barcode": "SNT123456"
      },
      {
        "Nama Santri": "Siti Aminah",
        "Kelas": db.kelas_list[0]?.nama_kelas || "7B - Salafiyah",
        "Nama Wali": "Hj. Fatimah",
        "WhatsApp Wali": "082345678901",
        "Alamat": "Indramayu, Jawa Barat",
        "Saldo Awal (Rp)": 100000,
        "Limit Jajan Harian (Rp)": 25000,
        "Barcode": "SNT654321"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Santri");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_santri.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Template Excel berhasil diunduh!", "success");
  };

  // --- EXPORT SANTRI LIST TO EXCEL ---
  const handleExportSantriExcel = () => {
    if (db.santri.length === 0) {
      showToast("Tidak ada data santri untuk diexport!", "error");
      return;
    }
    const exportData = db.santri.map(s => ({
      "ID Santri": s.id_santri,
      "Nama Santri": s.nama_santri,
      "Kelas": s.kelas,
      "Barcode": s.barcode,
      "Alamat": s.alamat || "",
      "Saldo Utama": s.saldo_utama,
      "Nama Wali": s.nama_wali || "",
      "WhatsApp Wali": s.wa_wali || "",
      "Limit Jajan Harian": s.limit_jajan || 25000
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'data_santri_pesantren.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Data santri berhasil diexport ke Excel!", "success");
  };

  // --- PROCESS IMPORT SANTRI FILE ---
  const handleImportSantriFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportSantriFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        if (json.length === 0) {
          showToast("File Excel kosong atau tidak terbaca!", "error");
          return;
        }

        const mapped = json.map((row, idx) => {
          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(x => x.toLowerCase().trim() === k.toLowerCase());
              if (matchedKey) return row[matchedKey];
            }
            return undefined;
          };

          const nama = getVal(["nama santri", "nama_santri", "nama", "name"]);
          const kelas = getVal(["kelas", "class", "tingkat"]);
          const namaWali = getVal(["nama wali", "nama_wali", "wali", "parent"]);
          const waWali = getVal(["whatsapp wali", "wa_wali", "wa wali", "no wa wali", "phone wali", "parent phone"]);
          const alamat = getVal(["alamat", "address", "tempat tinggal", "asal", "kota asal"]);
          const saldo = getVal(["saldo awal", "saldo_awal", "saldo utama", "saldo_utama", "saldo saku", "saldo awal (rp)", "saldo"]);
          const limit = getVal(["limit jajan", "limit_jajan", "limit jajan harian", "limit jajan harian (rp)", "limit"]);
          const barcode = getVal(["barcode", "kode barcode", "id barcode", "code"]);

          return {
            no: idx + 1,
            nama_santri: nama ? String(nama).trim() : "",
            kelas: kelas ? String(kelas).trim() : (db.kelas_list[0]?.nama_kelas || "7A - Salafiyah"),
            nama_wali: namaWali ? String(namaWali).trim() : "",
            wa_wali: waWali ? String(waWali).trim() : "",
            alamat: alamat ? String(alamat).trim() : "",
            saldo_utama: saldo !== undefined ? Number(saldo) : 100000,
            limit_jajan: limit !== undefined ? Number(limit) : 25000,
            barcode: barcode ? String(barcode).trim() : "SNT" + Math.floor(100000 + Math.random() * 900000),
            isValid: !!nama
          };
        });

        setImportedSantriList(mapped);
        showToast(`✓ Berhasil membaca ${mapped.length} baris data santri!`, "info");
      } catch (err) {
        console.error(err);
        showToast("Gagal memproses file Excel!", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- SAVE IMPORTED SANTRI LIST TO DB ---
  const saveImportedSantri = async () => {
    const validRows = importedSantriList.filter(r => r.isValid);
    if (validRows.length === 0) {
      showToast("Tidak ada data santri valid untuk diimport!", "error");
      return;
    }

    const updatedSantri = [...db.santri];
    let addedCount = 0;
    let updatedCount = 0;

    validRows.forEach(row => {
      // Check if existing
      const existingIdx = updatedSantri.findIndex(s => s.barcode === row.barcode || s.nama_santri.toLowerCase().trim() === row.nama_santri.toLowerCase().trim());
      
      const payload: Santri = {
        id_santri: existingIdx > -1 ? updatedSantri[existingIdx].id_santri : `SNT-0${db.santri.length + addedCount + 1}`,
        nama_santri: row.nama_santri,
        kelas: row.kelas,
        barcode: row.barcode,
        saldo_utama: row.saldo_utama,
        nama_wali: row.nama_wali,
        wa_wali: row.wa_wali,
        alamat: row.alamat,
        limit_jajan: row.limit_jajan
      };

      if (existingIdx > -1) {
        updatedSantri[existingIdx] = payload;
        updatedCount++;
      } else {
        updatedSantri.push(payload);
        addedCount++;
      }
    });

    await syncDbState({ ...db, santri: updatedSantri });
    showToast(`✓ Import Berhasil! ${addedCount} santri baru didaftarkan, ${updatedCount} diperbarui!`, "success");
    setIsImportSantriOpen(false);
    setImportedSantriList([]);
    setImportSantriFile(null);
  };

  const openIDCard = (s: Santri) => {
    setPreviewSantri(s);
    setIsIdCardOpen(true);
  };

  // --- TEACHER LOGIC ---
  const saveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = "GUR-0" + (db.asatidzah_kontak.length + 1);
    const added: AsatidzahKontak = {
      id_guru: newId,
      nama: teacherForm.nama.trim(),
      jabatan: teacherForm.jabatan.trim(),
      no_wa: teacherForm.no_wa.trim(),
      alamat: teacherForm.alamat.trim(),
      username: teacherForm.username.trim().toLowerCase(),
      pass: teacherForm.pass,
      foto_profil: teacherForm.foto_profil
    };

    await syncDbState({
      ...db,
      asatidzah_kontak: [...db.asatidzah_kontak, added]
    });

    setIsTeacherOpen(false);
    setTeacherForm({ nama: "", jabatan: "", no_wa: "", alamat: "", username: "", pass: "", foto_profil: "" });
    showToast(`Pengajar baru "${added.nama}" sukses disimpan!`, "success");
  };

  const deleteTeacher = (id: string) => {
    showConfirm("Hapus data pengajar ini?", async (yes) => {
      if (yes) {
        const filtered = db.asatidzah_kontak.filter(t => t.id_guru !== id);
        await syncDbState({ ...db, asatidzah_kontak: filtered });
        showToast("Pengajar berhasil dihapus", "info");
      }
    });
  };

  const handleTeacherPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setTeacherForm(prev => ({ ...prev, foto_profil: e.target?.result as string }));
        showToast("✓ Foto pengajar terunggah!", "info");
      }
    };
    reader.readAsDataURL(file);
  };

  // --- BILLS / TAGIHAN LOGIC ---
  const saveTagihan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { targetType, targetSantriId, targetKelas, nama_tagihan, nominal } = tagihanForm;
    let newTagihan = [...db.tagihan];

    const generateBillObj = (s: Santri): Tagihan => ({
      id_tagihan: "TGH-0" + (newTagihan.length + 1 + Math.floor(Math.random() * 1000)),
      id_santri: s.id_santri,
      nama_santri: s.nama_santri,
      kelas: s.kelas,
      nama_tagihan,
      nominal,
      status_tagihan: "BELUM_BAYAR",
      metode_pembayaran: "-",
      tanggal_bayar: "-"
    });

    if (targetType === 'INDIVIDU') {
      const s = db.santri.find(x => x.id_santri === targetSantriId);
      if (s) newTagihan.unshift(generateBillObj(s));
    } else if (targetType === 'KELAS') {
      const targets = db.santri.filter(x => x.kelas === targetKelas);
      if (targets.length === 0) {
        showToast("Tidak ada santri di kelas tersebut!", "error");
        return;
      }
      targets.forEach(s => newTagihan.unshift(generateBillObj(s)));
    } else {
      db.santri.forEach(s => newTagihan.unshift(generateBillObj(s)));
    }

    await syncDbState({ ...db, tagihan: newTagihan });
    setIsTagihanOpen(false);
    showToast("Distribusi tagihan sukses dijalankan!", "success");
  };

  const payViaTabungan = (bill: Tagihan) => {
    const s = db.santri.find(x => x.id_santri === bill.id_santri);
    if (!s) return;

    if (s.saldo_utama < bill.nominal) {
      showToast("Saldo saku santri tidak mencukupi!", "error");
      return;
    }

    showConfirm(`Potong tabungan saku ${s.nama_santri} sebesar ${formatRupiah(bill.nominal)}?`, async (yes) => {
      if (yes) {
        const updatedSantri = db.santri.map(x => {
          if (x.id_santri === s.id_santri) {
            return { ...x, saldo_utama: x.saldo_utama - bill.nominal };
          }
          return x;
        });

        const newKasLog: KasLog = {
          tanggal: new Date().toISOString().slice(0, 10),
          tipe: "MASUK",
          nominal: bill.nominal,
          keterangan: `Bayar SPP via Tabungan: ${s.nama_santri}`
        };

        const updatedTagihan = db.tagihan.map(t => {
          if (t.id_tagihan === bill.id_tagihan) {
            return {
              ...t,
              status_tagihan: "LUNAS" as const,
              metode_pembayaran: "TABUNGAN",
              tanggal_bayar: new Date().toISOString().slice(0, 10) + " " + new Date().toTimeString().slice(0, 5)
            };
          }
          return t;
        });

        await syncDbState({
          ...db,
          santri: updatedSantri,
          kas_yayasan: db.kas_yayasan + bill.nominal,
          yayasan_kas_logs: [newKasLog, ...db.yayasan_kas_logs],
          tagihan: updatedTagihan
        });

        showToast("Pelunasan SPP Berhasil!", "success");
      }
    });
  };

  const openReceipt = (t: Tagihan) => {
    setPreviewTagihan(t);
    setIsReceiptOpen(true);
  };

  // --- KAS & MUTASI LOGIC ---
  const saveKasMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    const { tipe, keterangan, nominal } = kasForm;
    if (nominal <= 0 || !keterangan) {
      showToast("Lengkapi parameter mutasi kas secara benar!", "error");
      return;
    }

    let newKasYayasan = db.kas_yayasan;
    if (tipe === "MASUK") {
      newKasYayasan += nominal;
    } else {
      if (newKasYayasan < nominal) {
        showToast("Saldo kas yayasan tidak mencukupi!", "error");
        return;
      }
      newKasYayasan -= nominal;
    }

    const log: KasLog = {
      tanggal: new Date().toISOString().slice(0, 10),
      tipe,
      nominal,
      keterangan
    };

    await syncDbState({
      ...db,
      kas_yayasan: newKasYayasan,
      yayasan_kas_logs: [log, ...db.yayasan_kas_logs]
    });

    setIsKasOpen(false);
    setKasForm({ tipe: "MASUK", keterangan: "", nominal: 0 });
    showToast("Berhasil mencatat mutasi kas!", "success");
  };

  const executeUnitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { direction, nominal, keterangan } = transferForm;
    if (nominal <= 0 || !keterangan) {
      showToast("Masukkan data mutasi kas secara valid!", "error");
      return;
    }

    let newKasYayasan = db.kas_yayasan;
    let newKasMarket = db.kas_market;
    let newYayasanLogs = [...db.yayasan_kas_logs];

    if (direction === "YAYASAN_TO_MARKET") {
      if (newKasYayasan < nominal) {
        showToast("Saldo kas yayasan tidak mencukupi!", "error");
        return;
      }
      newKasYayasan -= nominal;
      newKasMarket += nominal;
      newYayasanLogs.unshift({
        tanggal: new Date().toISOString().slice(0, 10),
        tipe: "KELUAR",
        nominal,
        keterangan: `Subsidi ke Market: ${keterangan}`
      });
    } else {
      if (newKasMarket < nominal) {
        showToast("Saldo kas koperasi tidak mencukupi!", "error");
        return;
      }
      newKasMarket -= nominal;
      newKasYayasan += nominal;
      newYayasanLogs.unshift({
        tanggal: new Date().toISOString().slice(0, 10),
        tipe: "MASUK",
        nominal,
        keterangan: `Penyetoran profit Market: ${keterangan}`
      });
    }

    await syncDbState({
      ...db,
      kas_yayasan: newKasYayasan,
      kas_market: newKasMarket,
      yayasan_kas_logs: newYayasanLogs
    });

    setIsTransferOpen(false);
    setTransferForm({ direction: "YAYASAN_TO_MARKET", nominal: 0, keterangan: "" });
    showToast("Mutasi pengiriman saldo antar unit sukses!", "success");
  };

  // --- CLASSES & PRAYERS ---
  const saveCustomClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const added: Kelas = {
      id_kelas: "KLS-0" + (db.kelas_list.length + 1),
      nama_kelas: classForm.nama_kelas.trim(),
      wali_kelas: classForm.wali_kelas
    };

    await syncDbState({
      ...db,
      kelas_list: [...db.kelas_list, added]
    });

    setIsClassOpen(false);
    setClassForm({ nama_kelas: "", wali_kelas: db.asatidzah_kontak[0]?.nama || "" });
    showToast("Kelas baru berhasil didaftarkan!", "success");
  };

  const deleteCustomClass = (id: string) => {
    showConfirm("Hapus kelas ini dari struktur pondok?", async (yes) => {
      if (yes) {
        const filtered = db.kelas_list.filter(c => c.id_kelas !== id);
        await syncDbState({ ...db, kelas_list: filtered });
        showToast("Kelas berhasil dihapus", "info");
      }
    });
  };

  const saveCustomPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const added: SholatRule = {
      id_sholat: "SLT-0" + (db.sholat_rules.length + 1),
      nama: prayerForm.nama.trim(),
      tipe: prayerForm.tipe,
      waktu: prayerForm.waktu.trim(),
      toleransi: Number(prayerForm.toleransi) || 15
    };

    await syncDbState({
      ...db,
      sholat_rules: [...db.sholat_rules, added]
    });

    setIsPrayerOpen(false);
    setPrayerForm({ nama: "", tipe: "WAJIB", waktu: "", toleransi: 15 });
    showToast("Jadwal aturan sholat baru berhasil disimpan!", "success");
  };

  const deletePrayerRule = (id: string) => {
    showConfirm("Hapus aturan sholat jamaah ini?", async (yes) => {
      if (yes) {
        const filtered = db.sholat_rules.filter(p => p.id_sholat !== id);
        await syncDbState({ ...db, sholat_rules: filtered });
        showToast("Jadwal aturan sholat berhasil dihapus", "info");
      }
    });
  };

  // --- VIEW RENDERS ---
  if (activeTab === 'yayasan-dashboard') {
    // Reconstruct balance history for sparkline
    const totalLogs = db.yayasan_kas_logs.length;
    const historyBalances: number[] = [db.kas_yayasan];
    let tempBal = db.kas_yayasan;
    for (let i = 0; i < Math.min(totalLogs, 15); i++) {
      const log = db.yayasan_kas_logs[i];
      if (log.tipe === "MASUK") {
        tempBal -= log.nominal;
      } else {
        tempBal += log.nominal;
      }
      historyBalances.push(tempBal);
    }
    historyBalances.reverse();
    const sparkPoints = historyBalances.slice(-10);
    while (sparkPoints.length < 5) {
      sparkPoints.unshift(sparkPoints[0] || db.kas_yayasan);
    }

    const minS = Math.min(...sparkPoints);
    const maxS = Math.max(...sparkPoints);
    const rangeS = (maxS - minS) || 1;
    const pointsForSparkline = sparkPoints.map((val, idx) => {
      const x = (idx * 200) / (sparkPoints.length - 1 || 1);
      const y = 35 - ((val - minS) * 30) / rangeS;
      return `${x},${y}`;
    }).join(' ');

    const totalPemasukan = db.yayasan_kas_logs.filter(l => l.tipe === "MASUK").reduce((s, l) => s + l.nominal, 0);
    const totalPengeluaran = db.yayasan_kas_logs.filter(l => l.tipe === "KELUAR").reduce((s, l) => s + l.nominal, 0);
    const netChange = totalPemasukan - totalPengeluaran;

    return (
      <section id="tab-yayasan-dashboard" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-500">
          <h2 className="text-base font-bold text-gray-100 font-sans">Assalamualaikum, Ust. Ridwan</h2>
          <p className="text-xs text-emerald-500/80 mt-1">Sistem manajemen pendaftaran santri baru, pencetakan kartu fisik, dan pelunasan tagihan Syahryah.</p>
        </div>

        {/* Statistik Yayasan */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <LucideIcon name="users" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-500/60 uppercase block">Total Santri</span>
              <span className="text-base font-bold text-gray-200">{db.santri.length}</span>
            </div>
          </div>

          {/* DYNAMIC KAS YAYASAN CARD WITH ADVANCED TRENDS & SPARKLINE */}
          <div className="glass-card p-4 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none text-emerald-400">
              <LucideIcon name="landmark" className="w-24 h-24" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <LucideIcon name="landmark" className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-emerald-500/60 uppercase block font-mono">Kas Yayasan</span>
                  <span className="text-sm font-extrabold text-emerald-400">{formatRupiah(db.kas_yayasan)}</span>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-lg text-[8px] font-bold flex items-center gap-1 shrink-0 ${netChange >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                <span>{netChange >= 0 ? '▲' : '▼'}</span>
                <span>{netChange >= 0 ? 'Bertambah' : 'Berkurang'}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-2 border-t border-emerald-950/20 flex flex-col gap-1">
              <div className="flex justify-between items-center text-[8px] text-emerald-500/50">
                <span>Tren Arus Kas (10 Mutasi)</span>
                <span className={`font-mono font-semibold ${netChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netChange >= 0 ? '+' : ''}{formatRupiah(netChange)}
                </span>
              </div>
              <div className="h-8 w-full mt-1">
                <svg viewBox="0 0 200 40" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={netChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={netChange >= 0 ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,40 ${pointsForSparkline} 200,40`}
                    fill="url(#sparklineGrad)"
                  />
                  <polyline
                    fill="none"
                    stroke={netChange >= 0 ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsForSparkline}
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <LucideIcon name="shopping-bag" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-500/60 uppercase block">Kas Market</span>
              <span className="text-sm font-bold text-amber-400">{formatRupiah(db.kas_market)}</span>
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <LucideIcon name="alert-circle" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-500/60 uppercase block">Tagihan Unpaid</span>
              <span className="text-base font-bold text-red-400">{db.tagihan.filter(t => t.status_tagihan === "BELUM_BAYAR").length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4 justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Aksi Cepat Admin Yayasan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => { switchTab('yayasan-santri'); openAddSantri(); }} className="py-3 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                <LucideIcon name="user-plus" className="w-4 h-4" /> Registrasi Santri Baru
              </button>
              <button onClick={() => { switchTab('yayasan-tagihan'); setIsTagihanOpen(true); }} className="py-3 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                <LucideIcon name="plus-circle" className="w-4 h-4" /> Buat Tagihan Baru
              </button>
              <button onClick={() => switchTab('yayasan-akademik')} className="py-3 bg-emerald-900/30 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                <LucideIcon name="graduation-cap" className="w-4 h-4" /> Kelola Guru & Kelas
              </button>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-4">Kas Masuk/Keluar Yayasan</h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
              {db.yayasan_kas_logs.slice().reverse().slice(0, 4).map((log, index) => {
                const isMasuk = log.tipe === "MASUK";
                return (
                  <div key={index} className="p-3 bg-emerald-950/40 rounded-xl flex justify-between items-center text-xs border border-emerald-900/30">
                    <div>
                      <span className="font-bold text-gray-200 block">{log.keterangan}</span>
                      <span className="text-[10px] text-emerald-500/50 block">{log.tanggal}</span>
                    </div>
                    <span className={`font-bold ${isMasuk ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isMasuk ? '+' : '-'} {formatRupiah(log.nominal)}
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

  if (activeTab === 'yayasan-santri') {
    const query = santriSearch.toLowerCase().trim();
    const filteredSantri = db.santri.filter(s => {
      const matchesSearch = s.nama_santri.toLowerCase().includes(query) || 
                            s.barcode.toLowerCase().includes(query) || 
                            (s.nama_wali && s.nama_wali.toLowerCase().includes(query)) ||
                            (s.alamat && s.alamat.toLowerCase().includes(query));
      const matchesClass = (santriClassFilter === 'ALL' || s.kelas === santriClassFilter);
      return matchesSearch && matchesClass;
    });

    return (
      <section id="tab-yayasan-santri" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-500 mb-1 font-sans">Manajemen & Registrasi Santri</h3>
            <p className="text-xs text-emerald-500/70">Kelola pendaftaran santri baru, pembuatan barcode identitas, dan pencetakan ID card pesantren.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleExportSantriExcel} 
              className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900/60 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <LucideIcon name="download" className="w-4 h-4" /> Export Excel
            </button>
            <button 
              onClick={() => setIsImportSantriOpen(true)} 
              className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900/60 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <LucideIcon name="upload" className="w-4 h-4" /> Import Excel / CSV
            </button>
            <button 
              onClick={openAddSantri} 
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <LucideIcon name="user-plus" className="w-4 h-4" /> Registrasi Santri Baru
            </button>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow flex gap-2">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-3 text-emerald-500/50 text-xs">🔍</span>
              <input 
                type="text" 
                value={santriSearch}
                onChange={(e) => setSantriSearch(e.target.value)}
                placeholder="Cari santri berdasarkan nama, kelas, atau barcode..." 
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-xs text-white focus:outline-none"
              />
            </div>
            
            <select 
              value={santriClassFilter}
              onChange={(e) => setSantriClassFilter(e.target.value)}
              className="bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 text-xs rounded-xl px-3 py-2.5 focus:outline-none"
            >
              <option value="ALL">Semua Kelas</option>
              {db.kelas_list.map(cls => (
                <option key={cls.id_kelas} value={cls.nama_kelas}>{cls.nama_kelas}</option>
              ))}
            </select>

            <button 
              onClick={() => setIsScanOpen(true)} 
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow"
            >
              <LucideIcon name="scan-line" className="w-4 h-4" />
              <span>Scan</span>
            </button>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                <th className="py-3 px-2">Foto</th>
                <th className="py-3">Santri & Kelas</th>
                <th className="py-3">ID Barcode</th>
                <th className="py-3">Wali Santri & WA</th>
                <th className="py-3 text-right">Limit Jajan</th>
                <th className="py-3 text-right">Limit Belanja</th>
                <th className="py-3 text-right">Saldo Saku</th>
                <th className="py-3 text-center">Aksi Administrasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/20">
              {filteredSantri.map(s => (
                <tr key={s.id_santri} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-colors">
                  <td className="py-3 px-2">
                    <img src={s.foto_profil || "https://placehold.co/150x150/022c22/f59e0b?text=Santri"} className="w-8 h-8 rounded-full object-cover border border-amber-500/30" />
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-gray-200 block">{s.nama_santri}</span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-emerald-500/60">{s.kelas}</span>
                      {s.alamat && (
                        <>
                          <span className="text-[10px] text-emerald-500/30">•</span>
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-medium border border-amber-500/10">📍 {s.alamat}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3 font-mono text-amber-400 font-semibold">{s.barcode}</td>
                  <td className="py-3">
                    <span className="text-gray-200 block text-xs">{s.nama_wali || '-'}</span>
                    <span className="text-[10px] text-emerald-500/60 block">+{s.wa_wali || '-'}</span>
                  </td>
                  <td className="py-3 text-right text-amber-500 font-mono">{formatRupiah(s.limit_jajan || 25000)}</td>
                  <td className="py-3 text-right text-yellow-500 font-mono">{formatRupiah(s.limit_belanja || 50000)}</td>
                  <td className="py-3 text-right font-mono font-semibold text-emerald-400">{formatRupiah(s.saldo_utama || 0)}</td>
                  <td className="py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openIDCard(s)} className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold">Kartu</button>
                      <button onClick={() => openEditSantri(s)} className="px-2 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-800/30 rounded-lg text-[10px] font-bold">Edit</button>
                      <button onClick={() => deleteSantri(s.id_santri)} className="px-2 py-1 bg-red-950/40 text-red-400 border border-red-900/40 rounded-lg text-[10px] font-bold">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 1. Santri Modal */}
        {isSantriOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-md flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 font-sans">{editSantriId ? "Edit Data Santri" : "Registrasi Santri Baru"}</h3>
                <button onClick={() => setIsSantriOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveSantri} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Lengkap Santri</label>
                  <input 
                    type="text" 
                    required 
                    value={santriForm.nama_santri}
                    onChange={(e) => setSantriForm({ ...santriForm, nama_santri: e.target.value })}
                    placeholder="Misal: Ahmad Rayhan" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-500/80 mb-1">Kelas Santri</label>
                    <select 
                      value={santriForm.kelas}
                      onChange={(e) => setSantriForm({ ...santriForm, kelas: e.target.value })}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-emerald-400 focus:outline-none"
                    >
                      {db.kelas_list.map(cls => (
                        <option key={cls.id_kelas} value={cls.nama_kelas}>{cls.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 mb-1">Kode ID Barcode (Bisa Diketik / Pindai Fisik)</label>
                    <div className="flex gap-1">
                      <input 
                        type="text" 
                        value={santriForm.barcode}
                        onChange={(e) => setSantriForm({ ...santriForm, barcode: e.target.value })}
                        placeholder="Scan atau ketik barcode..."
                        className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500/50"
                      />
                      <button 
                        type="button" 
                        onClick={() => setIsFormScanOpen(true)}
                        title="Pindai barcode lewat kamera"
                        className="p-2 bg-amber-500 border border-amber-600 text-emerald-950 rounded-xl hover:bg-amber-600 transition-all flex items-center justify-center cursor-pointer"
                      >
                        <LucideIcon name="camera" className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setSantriForm({ ...santriForm, barcode: generateBarcode() })}
                        title="Buat barcode acak"
                        className="p-2 bg-emerald-900 border border-emerald-800 text-amber-400 rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center cursor-pointer"
                      >
                        <LucideIcon name="refresh-cw" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-500/80 mb-1">Nama Wali Santri</label>
                    <input 
                      type="text" 
                      required 
                      value={santriForm.nama_wali}
                      onChange={(e) => setSantriForm({ ...santriForm, nama_wali: e.target.value })}
                      placeholder="Bpk. Slamet" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 mb-1">WhatsApp Orang Tua/Wali</label>
                    <input 
                      type="text" 
                      required 
                      value={santriForm.wa_wali}
                      onChange={(e) => setSantriForm({ ...santriForm, wa_wali: e.target.value })}
                      placeholder="Contoh: 62812345678" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-500/80 mb-1">Alamat / Asal Santri</label>
                  <input 
                    type="text" 
                    value={santriForm.alamat}
                    onChange={(e) => setSantriForm({ ...santriForm, alamat: e.target.value })}
                    placeholder="Misal: Cirebon, Jawa Barat" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-500/80 mb-1">Setoran Awal Tabungan (Rp)</label>
                    <input 
                      type="number" 
                      required 
                      value={santriForm.saldo_utama}
                      onChange={(e) => setSantriForm({ ...santriForm, saldo_utama: Number(e.target.value) || 0 })}
                      placeholder="100000" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 mb-1">Limit Jajan Harian (Rp)</label>
                    <input 
                      type="number" 
                      required 
                      value={santriForm.limit_jajan}
                      onChange={(e) => setSantriForm({ ...santriForm, limit_jajan: Number(e.target.value) || 0 })}
                      placeholder="25000" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-500/80 mb-1">Limit Belanja Market Harian (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={santriForm.limit_belanja}
                    onChange={(e) => setSantriForm({ ...santriForm, limit_belanja: Number(e.target.value) || 0 })}
                    placeholder="50000" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-emerald-500/80 mb-1">Foto Profil Santri (Upload Berkas)</label>
                  <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/60 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-500/60 truncate max-w-[200px]">
                      {santriForm.foto_profil ? "✓ Berkas Foto Profil Terbaca!" : "Belum ada berkas foto dipilih"}
                    </span>
                    <input 
                      type="file" 
                      id="santri-file-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleSantriPhoto}
                    />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('santri-file-input')?.click()} 
                      className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-400 rounded-lg text-[10px] flex items-center gap-1 font-bold"
                    >
                      <LucideIcon name="upload" className="w-3.5 h-3.5" /> Pilih & Upload
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsSantriOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Santri</button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* 1b. Import Santri Modal */}
        {isImportSantriOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-2xl flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 font-sans flex items-center gap-1.5">
                  <LucideIcon name="upload" className="w-4 h-4 text-amber-500" />
                  <span>Import Data Santri via Excel</span>
                </h3>
                <button onClick={() => { setIsImportSantriOpen(false); setImportedSantriList([]); setImportSantriFile(null); }} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500 cursor-pointer">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-grow">
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/50 leading-relaxed text-gray-300">
                  <p className="font-bold text-emerald-400 mb-1">Panduan Pengisian Berkas Excel Santri:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-gray-400">
                    <li>Unduh file template Excel santri yang telah kami sediakan di bawah ini.</li>
                    <li>Lengkapi nama lengkap santri, kelas, nama wali, nomor WhatsApp wali, saldo awal tabungan, dan limit jajan harian.</li>
                    <li>Sistem akan mendeteksi kelas secara pintar. Jika kelas dikosongkan, santri akan dimasukkan ke kelas bawaan.</li>
                    <li>Kolom <span className="text-emerald-400 font-bold">WhatsApp Wali</span> sebaiknya diisi angka murni (misal: 081234567890).</li>
                    <li>Jika barcode dikosongkan, sistem akan otomatis men-generate kode barcode acak yang unik.</li>
                  </ol>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={downloadSantriTemplate}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <LucideIcon name="download" className="w-3.5 h-3.5" />
                      <span>Unduh Template Excel Santri</span>
                    </button>
                  </div>
                </div>

                {/* FILE UPLOADER */}
                <div className="border-2 border-dashed border-emerald-900 rounded-2xl p-6 text-center hover:bg-emerald-950/20 transition-all relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleImportSantriFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📊</span>
                    <p className="font-bold text-gray-200">
                      {importSantriFile ? importSantriFile.name : "Pilih atau Seret file Excel/CSV ke Sini"}
                    </p>
                    <p className="text-[10px] text-emerald-500/60">
                      Mendukung format file .xlsx, .xls, .csv hingga 5MB
                    </p>
                  </div>
                </div>

                {/* PREVIEW OF PARSED DATA */}
                {importedSantriList.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1 shrink-0">
                      <span className="font-bold text-emerald-400">Pratinjau Data Santri ({importedSantriList.length} baris):</span>
                      <span className="text-[10px] text-gray-400">*Mohon verifikasi sebelum menyimpan</span>
                    </div>
                    <div className="overflow-x-auto max-h-48 border border-emerald-950 rounded-xl">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-emerald-950 border-b border-emerald-900 text-emerald-500/70 uppercase font-bold text-[9px]">
                            <th className="py-2 px-3">No</th>
                            <th className="py-2 px-3">Barcode</th>
                            <th className="py-2 px-3">Nama Santri</th>
                            <th className="py-2 px-3">Kelas</th>
                            <th className="py-2 px-3">Wali Santri</th>
                            <th className="py-2 px-3">Alamat</th>
                            <th className="py-2 px-3 text-right">Saldo</th>
                            <th className="py-2 px-3 text-right">Limit Harian</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-950/20 bg-emerald-950/10">
                          {importedSantriList.map((row, i) => (
                            <tr key={i} className="hover:bg-emerald-950/20">
                              <td className="py-1.5 px-3 text-gray-500">{row.no}</td>
                              <td className="py-1.5 px-3 font-mono text-amber-500">{row.barcode}</td>
                              <td className="py-1.5 px-3 font-semibold text-gray-200">{row.nama_santri || <span className="text-red-400 italic">[Kosong - ERROR]</span>}</td>
                              <td className="py-1.5 px-3 text-emerald-400">{row.kelas}</td>
                              <td className="py-1.5 px-3 text-gray-300">{row.nama_wali || <span className="text-gray-600 italic">n/a</span>}</td>
                              <td className="py-1.5 px-3 text-gray-300 truncate max-w-[100px]">{row.alamat || <span className="text-gray-600 italic">n/a</span>}</td>
                              <td className="py-1.5 px-3 text-right text-emerald-400 font-bold font-mono">{formatRupiah(row.saldo_utama)}</td>
                              <td className="py-1.5 px-3 text-right text-amber-500 font-bold font-mono">{formatRupiah(row.limit_jajan)}</td>
                              <td className="py-1.5 px-3 text-center">
                                {row.isValid ? (
                                  <span className="text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded text-[8px] font-bold">SIAP</span>
                                ) : (
                                  <span className="text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded text-[8px] font-bold">ERROR</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex gap-3 pt-3 border-t border-emerald-950 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportSantriOpen(false);
                    setImportedSantriList([]);
                    setImportSantriFile(null);
                  }}
                  className="w-1/2 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl font-bold transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveImportedSantri}
                  disabled={importedSantriList.length === 0}
                  className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-emerald-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-center"
                >
                  Simpan & Import ke Database
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* ID Card Dialog */}
        {isIdCardOpen && previewSantri && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="credit-card" className="w-4 h-4" /> Preview Kartu Fisik Santri
                </h3>
                <button onClick={() => setIsIdCardOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              {/* Kartu Fisik Area */}
              <div id="print-area-id-card-wrapper" className="w-full flex justify-center">
                <div id="print-area-id-card" className="virtual-id-card w-[350px] aspect-[1.58/1] rounded-2xl p-4 flex flex-col justify-between shadow-2xl relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="arabic-brand text-xl font-bold text-white">ق</span>
                      <h4 className="text-[9px] font-extrabold text-amber-400 leading-none">{(db.settings.nama_pesantren || "PONPESQU").toUpperCase()}</h4>
                    </div>
                    <span className="text-[6px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">NFC READY</span>
                  </div>

                  <div className="flex items-center gap-3 my-2 z-10 text-xs">
                    <img 
                      id="card-photo" 
                      src={previewSantri.foto_profil || "https://placehold.co/150x180/02110e/f59e0b?text=Foto"} 
                      className="w-12 h-14 rounded-lg object-cover border border-amber-500/30 shadow-md"
                      alt="Santri"
                    />
                    <div className="flex-grow">
                      <h5 id="card-name" className="text-xs font-bold text-white uppercase">{previewSantri.nama_santri}</h5>
                      <p id="card-kelas" className="text-[8px] text-amber-400 font-semibold mt-0.5">{previewSantri.kelas}</p>
                      <p className="text-[7px] text-gray-300 mt-1">Wali: <span id="card-wali" className="text-gray-100 font-bold">{previewSantri.nama_wali || "-"}</span></p>
                      {previewSantri.alamat && (
                        <p className="text-[7px] text-gray-300">Asal: <span id="card-alamat" className="text-emerald-400 font-semibold">{previewSantri.alamat}</span></p>
                      )}
                      <p className="text-[7px] text-gray-300">Saku Limit: <span id="card-limit" className="text-amber-400 font-semibold">{formatRupiah(previewSantri.limit_jajan || 0)}</span></p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-emerald-900/40 pt-1.5 text-[7px] gap-2">
                    <span className="text-emerald-400 font-medium self-center leading-tight max-w-[140px]">Darul Ma'arif Islamic Boarding School</span>
                    <div id="barcode-placeholder" className="bg-white px-2 py-1.5 rounded flex flex-col items-center justify-center shrink-0 shadow-md">
                      <BarcodeSVG value={previewSantri.barcode} width={150} height={42} className="barcode-svg-card" />
                      <span className="text-[8px] font-mono font-bold tracking-[0.18em] text-black leading-none mt-1">{previewSantri.barcode}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setIsIdCardOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Tutup</button>
                <button onClick={() => window.print()} className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                  <LucideIcon name="printer" className="w-4 h-4" /> Cetak Kartu
                </button>
              </div>
            </div>
          </dialog>
        )}

        {/* Scan Simulator Dialog */}
        {isScanOpen && (
          <LiveBarcodeScanner
            title="Cari Santri via Barcode"
            subtitle="Arahkan kamera ke barcode ID Card santri"
            onScanSuccess={(decodedText) => {
              setSantriSearch(decodedText);
              setIsScanOpen(false);
              showToast(`Pindaian kartu terbaca: ${decodedText}`, "success");
            }}
            onClose={() => setIsScanOpen(false)}
            dummyOptions={db.santri.map(s => ({
              label: s.nama_santri,
              code: s.barcode,
              subLabel: s.kelas
            }))}
          />
        )}

        {isFormScanOpen && (
          <LiveBarcodeScanner
            title="Pindai Kartu Santri"
            subtitle="Arahkan kamera ke barcode ID Card santri"
            onScanSuccess={(decodedText) => {
              setSantriForm({ ...santriForm, barcode: decodedText.trim() });
              setIsFormScanOpen(false);
              showToast(`Barcode berhasil dimasukkan ke form: ${decodedText}`, "success");
            }}
            onClose={() => setIsFormScanOpen(false)}
            dummyOptions={db.santri.map(s => ({
              label: s.nama_santri,
              code: s.barcode,
              subLabel: s.kelas
            }))}
          />
        )}
      </section>
    );
  }

  if (activeTab === 'yayasan-tagihan') {
    const query = tagihanSearch.toLowerCase().trim();
    const filteredTagihan = db.tagihan.filter(t => {
      const matchesSearch = t.nama_santri.toLowerCase().includes(query) || t.nama_tagihan.toLowerCase().includes(query);
      const matchesStatus = (tagihanStatusFilter === 'ALL' || t.status_tagihan === tagihanStatusFilter);
      return matchesSearch && matchesStatus;
    });

    return (
      <section id="tab-yayasan-tagihan" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-500 mb-1 font-sans">Tagihan Syahryah (SPP) & Keuangan</h3>
            <p className="text-xs text-emerald-500/70">Buat tagihan berkala untuk kelas/individu/seluruh santri dan proses pembayaran instan potong saldo saku santri.</p>
          </div>
          <button onClick={() => setIsTagihanOpen(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md">
            <LucideIcon name="plus-circle" className="w-4 h-4" /> Buat Tagihan Baru
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Filter Tagihan */}
            <div className="glass-card p-3 rounded-xl flex items-center justify-between gap-4">
              <div className="relative flex-grow">
                <span className="absolute left-3 top-3 text-emerald-500/50 text-xs">🔍</span>
                <input 
                  type="text" 
                  value={tagihanSearch}
                  onChange={(e) => setTagihanSearch(e.target.value)}
                  placeholder="Cari nama santri..." 
                  className="w-full bg-emerald-950/40 border border-emerald-900/50 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              
              <select 
                value={tagihanStatusFilter}
                onChange={(e) => setTagihanStatusFilter(e.target.value)}
                className="bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 text-xs rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="BELUM_BAYAR">Belum Bayar</option>
                <option value="LUNAS">Lunas</option>
              </select>
            </div>

            <div className="glass-card p-5 rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider">
                    <th className="py-3">Santri / Kelas</th>
                    <th className="py-3">Nama Tagihan</th>
                    <th className="py-3 text-right">Nominal</th>
                    <th className="py-3 text-center">Status</th>
                    <th className="py-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/20">
                  {filteredTagihan.slice().reverse().map((t, index) => {
                    const isUnpaid = t.status_tagihan === "BELUM_BAYAR";
                    return (
                      <tr key={index} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-colors">
                        <td className="py-3">
                          <span className="font-bold text-gray-200 block">{t.nama_santri}</span>
                          <span className="text-[10px] text-emerald-500/60">{t.kelas}</span>
                        </td>
                        <td className="py-3 text-emerald-500/80">{t.nama_tagihan}</td>
                        <td className="py-3 text-right font-mono font-bold text-gray-200">{formatRupiah(t.nominal)}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isUnpaid ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {t.status_tagihan}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {isUnpaid ? (
                            <button onClick={() => payViaTabungan(t)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold">Potong Tabungan</button>
                          ) : (
                            <button onClick={() => openReceipt(t)} className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded text-[9px] font-semibold">Struk</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 glass-card p-5 rounded-2xl flex flex-col gap-4">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-emerald-950 pb-3">Riwayat Kas Yayasan</h4>
            <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar">
              {db.yayasan_kas_logs.slice().reverse().slice(0, 5).map((log, index) => (
                <div key={index} className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/30 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-200 block text-[11px] leading-tight">{log.keterangan}</span>
                    <span className="text-[9px] text-emerald-500/50">{log.tanggal}</span>
                  </div>
                  <span className="font-bold text-[11px] text-emerald-400">+ {formatRupiah(log.nominal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tagihan Modal */}
        {isTagihanOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="receipt" className="w-4 h-4" /> Buat Tagihan Baru (SPP / Lainnya)
                </h3>
                <button onClick={() => setIsTagihanOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveTagihan} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1 font-semibold">Metode Distribusi Tagihan</label>
                  <select 
                    value={tagihanForm.targetType}
                    onChange={(e) => setTagihanForm({ ...tagihanForm, targetType: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-emerald-400 focus:outline-none"
                  >
                    <option value="INDIVIDU">Per-Individu Santri</option>
                    <option value="KELAS">Satu Kelas Sekaligus</option>
                    <option value="SEMUA">Untuk Seluruh Santri Pondok</option>
                  </select>
                </div>

                {/* Field Individual Santri */}
                {tagihanForm.targetType === 'INDIVIDU' && (
                  <div>
                    <label className="block text-emerald-500/80 mb-1 font-semibold">Target Santri</label>
                    <select 
                      value={tagihanForm.targetSantriId}
                      onChange={(e) => setTagihanForm({ ...tagihanForm, targetSantriId: e.target.value })}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none"
                    >
                      {db.santri.map(s => (
                        <option key={s.id_santri} value={s.id_santri}>{s.nama_santri} ({s.kelas})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Field Kelas */}
                {tagihanForm.targetType === 'KELAS' && (
                  <div>
                    <label className="block text-emerald-500/80 mb-1 font-semibold">Target Kelas</label>
                    <select 
                      value={tagihanForm.targetKelas}
                      onChange={(e) => setTagihanForm({ ...tagihanForm, targetKelas: e.target.value })}
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-emerald-400 focus:outline-none"
                    >
                      {db.kelas_list.map(cls => (
                        <option key={cls.id_kelas} value={cls.nama_kelas}>{cls.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-emerald-500/80 mb-1 font-semibold">Nama/Deskripsi Tagihan</label>
                  <input 
                    type="text" 
                    required 
                    value={tagihanForm.nama_tagihan}
                    onChange={(e) => setTagihanForm({ ...tagihanForm, nama_tagihan: e.target.value })}
                    placeholder="Misal: Syahryah (SPP) Juli 2026" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1 font-semibold">Nominal Tagihan (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={tagihanForm.nominal}
                    onChange={(e) => setTagihanForm({ ...tagihanForm, nominal: Number(e.target.value) || 0 })}
                    placeholder="Misal: 150000" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsTagihanOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Keluarkan Tagihan</button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Receipt Dialog */}
        {isReceiptOpen && previewTagihan && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="bg-amber-50 text-emerald-950 p-6 rounded-2xl shadow-2xl relative font-mono text-xs flex flex-col gap-4 border border-amber-200 w-full">
              <div id="kuitansi-print-area-wrapper" className="w-full">
                <div id="kuitansi-print-area" className="p-3 bg-white text-black rounded border border-gray-300 w-full">
                  <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
                    <h2 className="text-xs font-bold uppercase leading-tight font-sans">YAYASAN DARUL MA'ARIF {(db.settings.nama_pesantren || "PONPESQU").toUpperCase()}</h2>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block mt-2">KUITANSI RESMI</span>
                  </div>
                  <div className="space-y-1 text-[10px] my-3 leading-relaxed">
                    <div className="flex justify-between"><span>No. Transaksi:</span><span className="font-bold">{previewTagihan.id_tagihan}</span></div>
                    <div className="flex justify-between"><span>Santri:</span><span className="font-bold uppercase">{previewTagihan.nama_santri}</span></div>
                    <div className="flex justify-between"><span>Keterangan:</span><span className="italic">{previewTagihan.nama_tagihan}</span></div>
                    <div className="flex justify-between"><span>Metode:</span><span className="font-bold text-emerald-700">{previewTagihan.metode_pembayaran}</span></div>
                  </div>
                  <div className="border-t border-b border-dashed border-gray-400 py-2 my-2 text-center">
                    <span className="text-xs font-bold block">{formatRupiah(previewTagihan.nominal)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setIsReceiptOpen(false)} className="w-1/2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold">Tutup</button>
                <button onClick={() => window.print()} className="w-1/2 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow">
                  <LucideIcon name="printer" className="w-4 h-4" /> Cetak PDF
                </button>
              </div>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'yayasan-akademik') {
    return (
      <section id="tab-yayasan-akademik" className="tab-content flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Manajemen Pengajar */}
          <div className="lg:col-span-7 glass-card p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-emerald-950/50 pb-3">
              <h3 className="text-sm font-bold text-amber-500 font-sans">Manajemen Pengajar & Asatidzah</h3>
              <button onClick={() => setIsTeacherOpen(true)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-lg text-[10px] font-bold">+ Pengajar Baru</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-950 text-emerald-500/60 uppercase text-[8px]">
                    <th className="py-2.5 px-1">Foto</th>
                    <th className="py-2.5">Pengajar</th>
                    <th className="py-2.5">Username</th>
                    <th className="py-2.5">No. WA / Alamat</th>
                    <th className="py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/20">
                  {db.asatidzah_kontak.map(tch => (
                    <tr key={tch.id_guru} className="hover:bg-emerald-950/10 text-xs">
                      <td className="py-2.5 px-1">
                        <img src={tch.foto_profil || "https://placehold.co/150x150/022c22/f59e0b?text=Ustadz"} className="w-8 h-8 rounded-full object-cover border border-amber-500/30" />
                      </td>
                      <td className="py-2.5">
                        <span className="font-bold text-gray-200 block">{tch.nama}</span>
                        <span className="text-[9px] text-emerald-500/60 font-semibold block">{tch.jabatan}</span>
                      </td>
                      <td className="py-2.5 font-mono text-emerald-400 font-bold">{tch.username || 'N/A'}</td>
                      <td className="py-2.5 text-xs text-gray-300">
                        <span className="block">+{tch.no_wa}</span>
                        <span className="text-[9px] text-emerald-500/50 block">{tch.alamat || '-'}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <button onClick={() => deleteTeacher(tch.id_guru)} className="px-2 py-1 bg-red-950/40 text-red-400 border border-red-900/30 rounded text-[9px] font-bold">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kanan: Kelas & Sholat */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Manajemen Kelas */}
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-xs font-bold text-amber-500">Manajemen Kelas & Wali</h3>
                <button onClick={() => setIsClassOpen(true)} className="px-2.5 py-1 bg-emerald-800 text-emerald-200 rounded-lg text-[9px] font-bold">+ Kelas</button>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                {db.kelas_list.map(cls => (
                  <div key={cls.id_kelas} className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl gap-3">
                    <div>
                      <strong className="text-xs text-gray-200 block">{cls.nama_kelas}</strong>
                      <span className="text-[10px] text-emerald-500/60 block">Wali: {cls.wali_kelas}</span>
                    </div>
                    <button onClick={() => deleteCustomClass(cls.id_kelas)} className="text-red-400 hover:text-red-300 p-1">
                      <LucideIcon name="trash-2" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Aturan Sholat */}
            <div className="glass-card p-5 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-xs font-bold text-amber-500 font-sans">Aturan Sholat Wajib & Sunnah</h3>
                <button onClick={() => setIsPrayerOpen(true)} className="px-2.5 py-1 bg-emerald-800 text-emerald-200 rounded-lg text-[9px] font-bold">+ Sholat</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {db.sholat_rules.map(rule => (
                  <div key={rule.id_sholat} className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-gray-100 font-bold block">{rule.nama}</strong>
                        <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-mono">{rule.tipe}</span>
                      </div>
                      <span className="text-[10px] text-emerald-500/60 block mt-0.5">Batas toleransi masbuq: {rule.toleransi} menit</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-mono font-bold">{rule.waktu} WIB</span>
                      <button onClick={() => deletePrayerRule(rule.id_sholat)} className="text-red-400 hover:text-red-300">
                        <LucideIcon name="trash-2" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 2. Teacher Add Modal */}
        {isTeacherOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-md flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 font-sans">
                  <LucideIcon name="user-plus" className="w-4 h-4" /> Registrasi Pengajar Baru
                </h3>
                <button onClick={() => setIsTeacherOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveTeacher} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1 font-semibold">Nama Lengkap Pengajar</label>
                  <input 
                    type="text" 
                    required 
                    value={teacherForm.nama}
                    onChange={(e) => setTeacherForm({ ...teacherForm, nama: e.target.value })}
                    placeholder="Misal: Ustadz Yusuf Al-Ayyubi" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1 font-semibold">Bidang Spesialisasi / Jabatan</label>
                  <input 
                    type="text" 
                    required 
                    value={teacherForm.jabatan}
                    onChange={(e) => setTeacherForm({ ...teacherForm, jabatan: e.target.value })}
                    placeholder="Misal: Wali Kelas / Guru Tahfidz" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-500/80 mb-1 font-semibold">No. WhatsApp</label>
                    <input 
                      type="text" 
                      required 
                      value={teacherForm.no_wa}
                      onChange={(e) => setTeacherForm({ ...teacherForm, no_wa: e.target.value })}
                      placeholder="Contoh: 6281234567" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 mb-1 font-semibold">Alamat Rumah</label>
                    <input 
                      type="text" 
                      required 
                      value={teacherForm.alamat}
                      onChange={(e) => setTeacherForm({ ...teacherForm, alamat: e.target.value })}
                      placeholder="Bandung, Jabar" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-500/80 mb-1 font-semibold">Username Login</label>
                    <input 
                      type="text" 
                      required 
                      value={teacherForm.username}
                      onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })}
                      placeholder="yusuf.murobbi" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 mb-1 font-semibold">Sandi Akun</label>
                    <input 
                      type="password" 
                      required 
                      value={teacherForm.pass}
                      onChange={(e) => setTeacherForm({ ...teacherForm, pass: e.target.value })}
                      placeholder="••••••••" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-emerald-500/80 mb-1 font-semibold">Foto Profil Pengajar (Upload)</label>
                  <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/60 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-500/60 truncate max-w-[200px]">
                      {teacherForm.foto_profil ? "✓ Foto Terunggah!" : "Belum ada foto"}
                    </span>
                    <input 
                      type="file" 
                      id="teacher-file-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleTeacherPhoto}
                    />
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('teacher-file-input')?.click()} 
                      className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-400 rounded-lg text-[10px] flex items-center gap-1 font-bold"
                    >
                      <LucideIcon name="upload" className="w-3.5 h-3.5" /> Pilih Foto
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsTeacherOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Pengajar</button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Class Modal */}
        {isClassOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="plus-circle" className="w-4 h-4" /> Tambah Kelas Baru
                </h3>
                <button onClick={() => setIsClassOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveCustomClass} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Kode / Nama Kelas</label>
                  <input 
                    type="text" 
                    required 
                    value={classForm.nama_kelas}
                    onChange={(e) => setClassForm({ ...classForm, nama_kelas: e.target.value })}
                    placeholder="Contoh: 10A - Aliyah" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Wali Kelas (Asatidzah)</label>
                  <select 
                    value={classForm.wali_kelas}
                    onChange={(e) => setClassForm({ ...classForm, wali_kelas: e.target.value })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-emerald-400 focus:outline-none"
                  >
                    {db.asatidzah_kontak.map(tch => (
                      <option key={tch.id_guru} value={tch.nama}>{tch.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsClassOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Kelas</button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Prayer Modal */}
        {isPrayerOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                  <LucideIcon name="plus-circle" className="w-4 h-4" /> Tambah Aturan Sholat
                </h3>
                <button onClick={() => setIsPrayerOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveCustomPrayer} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nama Sholat</label>
                  <input 
                    type="text" 
                    required 
                    value={prayerForm.nama}
                    onChange={(e) => setPrayerForm({ ...prayerForm, nama: e.target.value })}
                    placeholder="Contoh: Sholat MAGHRIB" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Tipe</label>
                  <select 
                    value={prayerForm.tipe}
                    onChange={(e) => setPrayerForm({ ...prayerForm, tipe: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  >
                    <option value="WAJIB">WAJIB</option>
                    <option value="SUNNAH">SUNNAH</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-500/80 mb-1">Waktu Mulai</label>
                    <input 
                      type="text" 
                      required 
                      value={prayerForm.waktu}
                      onChange={(e) => setPrayerForm({ ...prayerForm, waktu: e.target.value })}
                      placeholder="18:00" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-500/80 mb-1">Toleransi Batas (Menit)</label>
                    <input 
                      type="number" 
                      required 
                      value={prayerForm.toleransi}
                      onChange={(e) => setPrayerForm({ ...prayerForm, toleransi: Number(e.target.value) || 15 })}
                      placeholder="15" 
                      className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsPrayerOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Aturan</button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'yayasan-kas') {
    const filteredKasLogs = db.yayasan_kas_logs.filter(log => {
      const logDateOnly = log.tanggal.split(" ")[0];
      const matchesStart = !kasPrintStartDate || logDateOnly >= kasPrintStartDate;
      const matchesEnd = !kasPrintEndDate || logDateOnly <= kasPrintEndDate;
      const matchesType = kasPrintType === "ALL" || log.tipe === kasPrintType;
      return matchesStart && matchesEnd && matchesType;
    });

    const filteredDebit = filteredKasLogs.filter(l => l.tipe === "MASUK").reduce((sum, l) => sum + l.nominal, 0);
    const filteredKredit = filteredKasLogs.filter(l => l.tipe === "KELUAR").reduce((sum, l) => sum + l.nominal, 0);
    const filteredNet = filteredDebit - filteredKredit;

    const handlePrintKasReport = () => {
      setIsKasReportPrintOpen(true);
      setTimeout(() => {
        window.print();
        setIsKasReportPrintOpen(false);
      }, 300);
    };

    return (
      <section id="tab-yayasan-kas" className="tab-content flex flex-col gap-6">
        <div className="glass-card p-5 rounded-2xl flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-500 mb-1 font-sans">Buku Kas Utama Yayasan</h3>
            <p className="text-xs text-emerald-500/70">Kelola donasi, pemasukan syahriyah, dan mutasi saldo unit market.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsKasOpen(true)} className="px-4 py-2 bg-emerald-900 text-emerald-400 border border-emerald-800 rounded-xl text-xs font-bold transition-all">Input Mutasi Kas</button>
            <button onClick={() => setIsTransferOpen(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold shadow-md transition-all">Transfer Antar Kas Unit</button>
          </div>
        </div>

        {/* CONTROLS CARD FOR FILTERING AND PRINTING */}
        <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <LucideIcon name="printer" className="w-4 h-4" /> Penyaringan & Pencetakan Laporan Kas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-gray-300">
            <div>
              <label className="block text-emerald-500/80 mb-1">Tanggal Mulai</label>
              <input 
                type="date" 
                value={kasPrintStartDate} 
                onChange={(e) => setKasPrintStartDate(e.target.value)} 
                className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-emerald-500/80 mb-1">Tanggal Selesai</label>
              <input 
                type="date" 
                value={kasPrintEndDate} 
                onChange={(e) => setKasPrintEndDate(e.target.value)} 
                className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-emerald-500/80 mb-1">Jenis Aliran Kas</label>
              <select 
                value={kasPrintType} 
                onChange={(e) => setKasPrintType(e.target.value as any)} 
                className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="ALL">Semua Aliran Kas</option>
                <option value="MASUK">Pemasukan Saja (Debit)</option>
                <option value="KELUAR">Pengeluaran Saja (Kredit)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button 
                onClick={handlePrintKasReport}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <LucideIcon name="printer" className="w-4 h-4" /> Cetak Laporan Kas
              </button>
            </div>
          </div>

          {/* REAL-TIME FILTERED SUMMARY BADGES */}
          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/40">
              <span className="text-[9px] text-emerald-500/60 block uppercase font-mono">Total Debit (Masuk)</span>
              <span className="text-xs font-bold text-emerald-400">{formatRupiah(filteredDebit)}</span>
            </div>
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/40">
              <span className="text-[9px] text-emerald-500/60 block uppercase font-mono">Total Kredit (Keluar)</span>
              <span className="text-xs font-bold text-red-400">{formatRupiah(filteredKredit)}</span>
            </div>
            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-900/40">
              <span className="text-[9px] text-emerald-500/60 block uppercase font-mono font-bold">Arus Bersih</span>
              <span className={`text-xs font-bold ${filteredNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {filteredNet >= 0 ? '+' : ''}{formatRupiah(filteredNet)}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl overflow-x-auto">
          <h4 className="text-xs font-bold text-amber-400 uppercase mb-4">Mutasi Kas Yayasan (Tersaring: {filteredKasLogs.length} Transaksi)</h4>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px]">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 text-center">Tipe</th>
                <th className="py-3 px-3 text-right">Debit (Masuk)</th>
                <th className="py-3 px-3 text-right">Kredit (Keluar)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/20">
              {filteredKasLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-emerald-500/40 text-xs">Tidak ada transaksi kas yang sesuai dengan kriteria penyaringan.</td>
                </tr>
              ) : (
                filteredKasLogs.slice().reverse().map((log, index) => {
                  const isMasuk = log.tipe === "MASUK";
                  return (
                    <tr key={index} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-colors">
                      <td className="py-2.5 px-3 text-emerald-500/80 font-mono">{log.tanggal}</td>
                      <td className="py-2.5 px-3"><strong>{log.keterangan}</strong></td>
                      <td className="py-2.5 px-3 text-center">{log.tipe}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{isMasuk ? formatRupiah(log.nominal) : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-red-400 font-bold">{!isMasuk ? formatRupiah(log.nominal) : '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* HIDDEN FORMAL REPORT FOR PHYSICAL PRINTING */}
        <div id="print-area-kas-report" style={{ display: isKasReportPrintOpen ? 'block' : 'none' }} className="p-10 bg-white text-black font-sans leading-relaxed text-xs">
          {/* Letterhead */}
          <div className="text-center border-b-4 border-black pb-4 mb-6 relative">
            <h1 className="text-xl font-bold tracking-wider uppercase">{db.settings.bank_owner || ("YAYASAN DARUL MA'ARIF " + (db.settings.nama_pesantren || "PONPESQU").toUpperCase())}</h1>
            <h2 className="text-md font-bold text-gray-800">LAPORAN BUKU KAS UTAMA YAYASAN</h2>
            <p className="text-[10px] text-gray-500 mt-1">{db.settings.address || "Bandung, Jawa Barat"} • Telp: {db.settings.phone || "-"}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 mb-6 border border-gray-300 p-3 rounded-lg">
            <div>
              <p className="text-[10px] text-gray-500">Rentang Tanggal</p>
              <p className="font-semibold">{kasPrintStartDate || "-"} s/d {kasPrintEndDate || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Kategori Arus Kas</p>
              <p className="font-semibold">
                {kasPrintType === "ALL" ? "Semua Transaksi (Debit & Kredit)" : kasPrintType === "MASUK" ? "Hanya Pemasukan (Debit)" : "Hanya Pengeluaran (Kredit)"}
              </p>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse border border-gray-400 text-[10px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400 text-gray-700 font-bold">
                <th className="py-2 px-3 border-r border-gray-400">Tanggal</th>
                <th className="py-2 px-3 border-r border-gray-400">Keterangan</th>
                <th className="py-2 px-3 border-r border-gray-400 text-center">Tipe</th>
                <th className="py-2 px-3 border-r border-gray-400 text-right">Debit (Masuk)</th>
                <th className="py-2 px-3 text-right">Kredit (Keluar)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {filteredKasLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">Tidak ada data mutasi kas yang tercatat.</td>
                </tr>
              ) : (
                filteredKasLogs.slice().reverse().map((log, index) => {
                  const isMasuk = log.tipe === "MASUK";
                  return (
                    <tr key={index}>
                      <td className="py-2 px-3 border-r border-gray-300 font-mono">{log.tanggal}</td>
                      <td className="py-2 px-3 border-r border-gray-300"><strong>{log.keterangan}</strong></td>
                      <td className="py-2 px-3 border-r border-gray-300 text-center">{log.tipe}</td>
                      <td className="py-2 px-3 border-r border-gray-300 text-right font-semibold text-green-700">{isMasuk ? formatRupiah(log.nominal) : '-'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-red-700">{!isMasuk ? formatRupiah(log.nominal) : '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 border-t border-black pt-4">
            <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
              <span className="text-[9px] text-gray-500 block uppercase font-mono">Total Debit (Masuk)</span>
              <span className="text-xs font-bold text-green-700">{formatRupiah(filteredDebit)}</span>
            </div>
            <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
              <span className="text-[9px] text-gray-500 block uppercase font-mono">Total Kredit (Keluar)</span>
              <span className="text-xs font-bold text-red-700">{formatRupiah(filteredKredit)}</span>
            </div>
            <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
              <span className="text-[9px] text-gray-500 block uppercase font-mono font-bold">Saldo Akhir Tersaring</span>
              <span className={`text-xs font-bold ${filteredNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {filteredNet >= 0 ? '+' : ''}{formatRupiah(filteredNet)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-12 flex justify-between text-center text-[10px]">
            <div>
              <p className="text-gray-500">Disiapkan Oleh</p>
              <div className="h-16"></div>
              <p className="font-bold border-t border-black pt-1 w-36 mx-auto">Ust. Ridwan</p>
              <p className="text-gray-400">Admin Yayasan</p>
            </div>
            <div>
              <p className="text-gray-500">Mengetahui & Menyetujui</p>
              <div className="h-16"></div>
              <p className="font-bold border-t border-black pt-1 w-36 mx-auto">{db.settings.owner_name || "Kiai M. Hasan"}</p>
              <p className="text-gray-400">Pimpinan Yayasan</p>
            </div>
          </div>
        </div>

        {/* Kas Modal */}
        {isKasOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2 font-sans">
                  <LucideIcon name="landmark" className="w-4 h-4" /> Input Mutasi Kas Yayasan
                </h3>
                <button onClick={() => setIsKasOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={saveKasMutasi} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Tipe Aliran Kas</label>
                  <select 
                    value={kasForm.tipe}
                    onChange={(e) => setKasForm({ ...kasForm, tipe: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  >
                    <option value="MASUK">Pemasukan (Debit)</option>
                    <option value="KELUAR">Pengeluaran (Kredit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Rincian Deskripsi / Keterangan</label>
                  <input 
                    type="text" 
                    required 
                    value={kasForm.keterangan}
                    onChange={(e) => setKasForm({ ...kasForm, keterangan: e.target.value })}
                    placeholder="Contoh: Penerimaan Donasi Hamba Allah" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nominal Transaksi (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={kasForm.nominal}
                    onChange={(e) => setKasForm({ ...kasForm, nominal: Number(e.target.value) || 0 })}
                    placeholder="Rp..." 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsKasOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Catat Mutasi</button>
                </div>
              </form>
            </div>
          </dialog>
        )}

        {/* Transfer Modal */}
        {isTransferOpen && (
          <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-sm flex items-center justify-center">
            <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
                <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                  <LucideIcon name="refresh-cw" className="w-4 h-4" /> Mutasi Saldo Kas Antar Unit
                </h3>
                <button onClick={() => setIsTransferOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                  <LucideIcon name="x" className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={executeUnitTransfer} className="space-y-3 text-xs text-gray-300">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Arah Pengiriman Dana</label>
                  <select 
                    value={transferForm.direction}
                    onChange={(e) => setTransferForm({ ...transferForm, direction: e.target.value as any })}
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  >
                    <option value="YAYASAN_TO_MARKET">Dari KAS YAYASAN ➜ KAS MARKET</option>
                    <option value="MARKET_TO_YAYASAN">Dari KAS MARKET ➜ KAS YAYASAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Nominal Transfer (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    value={transferForm.nominal}
                    onChange={(e) => setTransferForm({ ...transferForm, nominal: Number(e.target.value) || 0 })}
                    placeholder="Rp..." 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Keterangan Transfer</label>
                  <input 
                    type="text" 
                    required 
                    value={transferForm.keterangan}
                    onChange={(e) => setTransferForm({ ...transferForm, keterangan: e.target.value })}
                    placeholder="Contoh: Subsidi Modal Awal Koperasi" 
                    className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsTransferOpen(false)} className="w-1/2 py-2 bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                  <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Kirim Saldo</button>
                </div>
              </form>
            </div>
          </dialog>
        )}
      </section>
    );
  }

  if (activeTab === 'yayasan-kiriman') {
    // Sync the selected student's state dynamically from DB
    const activeSelectedSantri = selectedSantriKiriman 
      ? db.santri.find(s => s.id_santri === selectedSantriKiriman.id_santri) || selectedSantriKiriman 
      : null;

    // Filter transaction history for selected student
    const historyList = activeSelectedSantri 
      ? (db.transaksi_tabungan || []).filter(tx => tx.id_santri === activeSelectedSantri.id_santri)
      : [];

    // Find autocompletes based on query
    const autocompleteMatches = kirimanSearch.trim().length >= 2 
      ? db.santri.filter(s => 
          s.nama_santri.toLowerCase().includes(kirimanSearch.toLowerCase()) ||
          s.id_santri.toLowerCase().includes(kirimanSearch.toLowerCase()) ||
          s.barcode.toLowerCase().includes(kirimanSearch.toLowerCase())
        ).slice(0, 5)
      : [];

    const handleKirimanSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const query = kirimanSearch.trim().toLowerCase();
      if (!query) {
        showToast("Ketik nama, NIS, atau scan barcode terlebih dahulu!", "error");
        return;
      }

      const found = db.santri.find(s => 
        s.id_santri.toLowerCase() === query || 
        s.barcode.toLowerCase() === query ||
        s.nama_santri.toLowerCase() === query
      );

      if (found) {
        setSelectedSantriKiriman(found);
        setKirimanSearch("");
        showToast(`Santri ${found.nama_santri} terpilih!`, "success");
      } else {
        // Try fuzzy find
        const fuzzy = db.santri.find(s => s.nama_santri.toLowerCase().includes(query));
        if (fuzzy) {
          setSelectedSantriKiriman(fuzzy);
          setKirimanSearch("");
          showToast(`Santri ${fuzzy.nama_santri} terpilih!`, "success");
        } else {
          showToast("Santri tidak ditemukan!", "error");
        }
      }
    };

    const handleExecuteKiriman = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeSelectedSantri) {
        showToast("Silakan pilih santri terlebih dahulu!", "error");
        return;
      }

      if (kirimanAmount <= 0) {
        showToast("Nominal transaksi harus di atas Rp 0!", "error");
        return;
      }

      const currentBalance = Number(activeSelectedSantri.saldo_utama) || 0;
      let newBalance = currentBalance;

      if (kirimanType === "MASUK") {
        newBalance = currentBalance + kirimanAmount;
      } else {
        if (currentBalance < kirimanAmount) {
          showToast("Saldo tabungan santri tidak mencukupi untuk pengurangan ini!", "error");
          return;
        }
        newBalance = currentBalance - kirimanAmount;
      }

      // 1. Update the student list
      const updatedSantriList = db.santri.map(s => {
        if (s.id_santri === activeSelectedSantri.id_santri) {
          return {
            ...s,
            saldo_utama: newBalance
          };
        }
        return s;
      });

      // 2. Generate transaction ID
      const newTx: TransaksiTabungan = {
        id_transaksi: `TX-TAB-${Date.now().toString().slice(-4)}`,
        id_santri: activeSelectedSantri.id_santri,
        nama_santri: activeSelectedSantri.nama_santri,
        kelas: activeSelectedSantri.kelas,
        tanggal: new Date().toISOString().replace('T', ' ').slice(0, 16),
        tipe: kirimanType === "MASUK" ? "DEPOSIT" : "PENARIKAN",
        nominal: kirimanAmount,
        keterangan: kirimanNote.trim() || (kirimanType === "MASUK" ? "Kiriman Wali via Yayasan" : "Penarikan/Penyesuaian Yayasan")
      };

      // 3. Append to kas logs as well if adding/reducing involves cash yayasan
      let updatedKasLogs = db.yayasan_kas_logs || [];
      let currentKasYayasan = db.kas_yayasan;

      // Sync and save
      const updatedDb: K_DB = {
        ...db,
        santri: updatedSantriList,
        transaksi_tabungan: [newTx, ...(db.transaksi_tabungan || [])]
      };

      await syncDbState(updatedDb);
      showToast(`Uang kiriman santri berhasil diubah! Saldo baru: ${formatRupiah(newBalance)}`, "success");
      
      // Reset form states
      setKirimanAmount(0);
      setKirimanNote("");
    };

    return (
      <section className="space-y-6 animate-fade-in pb-12">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-950/50 pb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">Manajemen Keuangan</span>
            <h1 className="text-xl font-extrabold text-gray-100 mt-2">Menu Kiriman Wali & Saku Santri</h1>
            <p className="text-xs text-emerald-500/70 mt-0.5">Tambah saldo tabungan langsung dari setoran wali santri, atau kurangi saldo untuk penyesuaian khusus.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMN 1: SCANNER & MANUAL SEARCH (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Viewfinder Mockup */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 space-y-4">
              <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                <LucideIcon name="scan-line" className="w-4 h-4 text-amber-500" /> Pemindai Kamera Depan
              </h3>

              <div className="relative">
                <LiveViewfinder 
                  colorTheme="amber"
                  placeholderText="[TEMPATKAN BARCODE ID CARD DI DEPAN LAYAR]"
                  className="h-[160px]"
                  onReset={() => showToast("Kamera didegradasi ulang secara berkala.", "info")}
                />
                <button 
                  onClick={() => setIsKirimanScanOpen(true)}
                  className="absolute inset-x-4 bottom-4 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer z-10 hover:scale-[1.02] active:scale-95 animate-pulse"
                >
                  <LucideIcon name="camera" className="w-4 h-4" /> Buka Kamera Pindai
                </button>
              </div>
            </div>

            {/* Manual Search and Matches List */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 space-y-4">
              <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider border-b border-emerald-950/50 pb-2 flex items-center gap-2">
                <LucideIcon name="search" className="w-4 h-4 text-amber-400" /> Pencarian Data Santri
              </h3>

              <form onSubmit={handleKirimanSearchSubmit} className="relative">
                <input 
                  type="text"
                  value={kirimanSearch}
                  onChange={(e) => setKirimanSearch(e.target.value)}
                  placeholder="Ketik nama, NIS, atau Scan Barcode..."
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 p-1 text-emerald-400 hover:text-amber-400 transition-colors"
                >
                  <LucideIcon name="arrow-right" className="w-4 h-4" />
                </button>
              </form>

              {/* Autocomplete Match dropdown */}
              {autocompleteMatches.length > 0 && (
                <div className="bg-[#021814] border border-emerald-900/60 rounded-xl overflow-hidden divide-y divide-emerald-950/50">
                  <div className="p-2 bg-emerald-950/40 text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Hasil Pencarian Terdekat</div>
                  {autocompleteMatches.map(s => (
                    <button
                      key={s.id_santri}
                      onClick={() => {
                        setSelectedSantriKiriman(s);
                        setKirimanSearch("");
                        showToast(`Santri ${s.nama_santri} terpilih!`, "success");
                      }}
                      className="w-full text-left p-3 hover:bg-emerald-950/50 flex items-center justify-between transition-colors cursor-pointer text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-100">{s.nama_santri}</p>
                        <p className="text-[9px] text-emerald-500/60">
                          Kelas: {s.kelas} • NIS: {s.id_santri}
                          {s.alamat && ` • Asal: ${s.alamat}`}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">{formatRupiah(s.saldo_utama)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* COLUMN 2: IDENTITAS & FORM KIRIMAN (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {activeSelectedSantri ? (
              <>
                {/* Identity Card */}
                <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-950/50 pb-2">
                    <LucideIcon name="id-card" className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">Identitas Santri</h3>
                  </div>

                  <div className="flex items-center gap-4 bg-emerald-950/20 p-4 rounded-xl border border-emerald-950/60">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-extrabold text-amber-400 text-lg">
                      {activeSelectedSantri.nama_santri.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-100 leading-tight">{activeSelectedSantri.nama_santri}</h4>
                      <p className="text-xs text-emerald-500/60 font-medium mt-0.5">
                        Kelas: {activeSelectedSantri.kelas}
                        {activeSelectedSantri.alamat && ` • Asal: ${activeSelectedSantri.alamat}`}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">NIS/No. ID: {activeSelectedSantri.id_santri}</p>
                    </div>
                  </div>

                  {/* Wali and Balance info */}
                  <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                    <div className="bg-emerald-950/10 border border-emerald-950/40 p-3 rounded-xl">
                      <span className="text-[9px] text-emerald-500/50 font-bold block uppercase">Wali Santri</span>
                      <strong className="text-gray-100 block mt-0.5">{activeSelectedSantri.nama_wali}</strong>
                      <span className="text-[9px] text-gray-400 font-mono">{activeSelectedSantri.wa_wali}</span>
                    </div>
                    <div className="bg-emerald-950/10 border border-emerald-950/40 p-3 rounded-xl">
                      <span className="text-[9px] text-emerald-500/50 font-bold block uppercase">Saldo Utama</span>
                      <strong className="text-sm text-amber-400 block mt-0.5 font-mono">{formatRupiah(activeSelectedSantri.saldo_utama)}</strong>
                      <span className="text-[9px] text-emerald-500/50">Limit Jajan: {formatRupiah(activeSelectedSantri.limit_jajan)}/hari</span>
                    </div>
                  </div>
                </div>

                {/* Form Kiriman (Add/Subtract) */}
                <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 space-y-4">
                  <div className="flex items-center gap-2 border-b border-emerald-950/50 pb-2">
                    <LucideIcon name="wallet" className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">Form Input Kiriman / Saldo</h3>
                  </div>

                  <form onSubmit={handleExecuteKiriman} className="space-y-4 text-xs text-gray-300">
                    <div>
                      <label className="block text-emerald-500/80 mb-1.5">Jenis Penyesuaian Dana</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setKirimanType("MASUK")}
                          className={`py-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                            kirimanType === "MASUK" 
                              ? "bg-amber-500 text-emerald-950 border-amber-500 shadow-md"
                              : "bg-emerald-950/40 border-emerald-900 text-emerald-500 hover:bg-emerald-950/60"
                          }`}
                        >
                          📥 Tambah (Kiriman)
                        </button>
                        <button
                          type="button"
                          onClick={() => setKirimanType("KELUAR")}
                          className={`py-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                            kirimanType === "KELUAR" 
                              ? "bg-amber-500 text-emerald-950 border-amber-500 shadow-md"
                              : "bg-emerald-950/40 border-emerald-900 text-emerald-500 hover:bg-emerald-950/60"
                          }`}
                        >
                          📤 Kurang (Koreksi)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-emerald-500/80 mb-1">Nominal Transaksi (Rp)</label>
                      <input 
                        type="number"
                        required
                        value={kirimanAmount || ""}
                        onChange={(e) => setKirimanAmount(Number(e.target.value) || 0)}
                        placeholder="Masukkan nominal Rp..."
                        className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-500/80 mb-1">Keterangan / Memo Transaksi</label>
                      <input 
                        type="text"
                        value={kirimanNote}
                        onChange={(e) => setKirimanNote(e.target.value)}
                        placeholder="Contoh: Kiriman orang tua via Bank Syariah"
                        className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                    >
                      <LucideIcon name="check-circle" className="w-4 h-4" /> Proses Konfirmasi Selesai
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="glass-card p-8 rounded-2xl border border-emerald-500/5 text-center flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
                <LucideIcon name="id-card" className="w-12 h-12 text-emerald-500/20 mb-3" />
                <p className="text-xs font-bold text-gray-400">Identitas Santri Belum Dimuat</p>
                <p className="text-[10px] text-emerald-500/50 mt-1 max-w-[200px] mx-auto">Silakan scan barcode atau cari nama santri di panel pencarian untuk memulai pengelolaan.</p>
              </div>
            )}

          </div>

          {/* COLUMN 3: RIWAYAT TRANSAKSI TABUNGAN (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/10 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-950/50 pb-2 justify-between">
                <div className="flex items-center gap-2">
                  <LucideIcon name="history" className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-gray-100 uppercase tracking-wider">Riwayat Transaksi Tabungan</h3>
                </div>
                {activeSelectedSantri && (
                  <span className="text-[9px] bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono text-emerald-400">
                    {historyList.length} Transaksi
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {activeSelectedSantri ? (
                  historyList.length > 0 ? (
                    historyList.slice().reverse().map(tx => (
                      <div key={tx.id_transaksi} className="p-3 bg-emerald-950/20 border border-emerald-500/5 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-mono text-emerald-500 bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                            {tx.id_transaksi}
                          </span>
                          <span className="text-gray-400 font-mono">{tx.tanggal}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-100 font-semibold">{tx.keterangan}</p>
                          <span className={`text-xs font-bold font-mono ${tx.tipe === "DEPOSIT" ? "text-emerald-400" : "text-red-400"}`}>
                            {tx.tipe === "DEPOSIT" ? "+" : "-"} {formatRupiah(tx.nominal)}
                          </span>
                        </div>
                        
                        <p className="text-[9px] text-gray-500 italic">Sistem Keuangan Yayasan</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-8 italic">Belum ada riwayat transaksi tabungan santri ini.</p>
                  )
                ) : (
                  <p className="text-xs text-gray-500 text-center py-8 italic">Pilih santri terlebih dahulu untuk melihat riwayat tabungan.</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {isKirimanScanOpen && (
          <LiveBarcodeScanner
            title="Cari Santri Kiriman via Barcode"
            subtitle="Arahkan kamera ke barcode ID Card santri"
            onScanSuccess={(decodedText) => {
              const found = db.santri.find(s => s.barcode.toLowerCase() === decodedText.trim().toLowerCase());
              if (found) {
                setSelectedSantriKiriman(found);
                setIsKirimanScanOpen(false);
                showToast(`Pindaian kartu terbaca: ${found.barcode}`, "success");
              } else {
                showToast(`Barcode "${decodedText}" tidak terdaftar!`, "error");
                setIsKirimanScanOpen(false);
              }
            }}
            onClose={() => setIsKirimanScanOpen(false)}
            dummyOptions={db.santri.map(s => ({
              label: s.nama_santri,
              code: s.barcode,
              subLabel: s.kelas
            }))}
          />
        )}
      </section>
    );
  }

  return null;
}
