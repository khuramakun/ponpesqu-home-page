import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { K_DB, ProdukMarket, StokMarket } from '../types';
import { LucideIcon } from './LucideIcon';

interface MarketStokTabProps {
  db: K_DB;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
}

export function MarketStokTab({
  db,
  syncDbState,
  showToast,
  showConfirm
}: MarketStokTabProps) {
  const products = db.produk_market || [];
  const stockLogs = db.stok_market || [];

  // --- CATALOG LIST STATE ---
  const [crudSearch, setCrudSearch] = useState("");
  const [crudCategoryFilter, setCrudCategoryFilter] = useState("ALL");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // --- EXCEL IMPORT/EXPORT STATE ---
  const [isImportProductOpen, setIsImportProductOpen] = useState(false);
  const [importedProductList, setImportedProductList] = useState<any[]>([]);
  const [importProductFile, setImportProductFile] = useState<File | null>(null);

  // --- STOCK ADJUSTMENT STATE ---
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustQty, setAdjustQty] = useState<number | "">("");
  const [adjustReason, setAdjustReason] = useState("Barang Kadaluarsa");

  // --- FAST INTAKE STATE ---
  const [fastBarcode, setFastBarcode] = useState("");
  const [fastUnitMode, setFastUnitMode] = useState<"PCS" | "BESAR">("PCS");

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);

  // --- FORM FIELDS ---
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("Makanan");
  const [prodUnit, setProdUnit] = useState("pcs");
  const [prodPriceBuy, setProdPriceBuy] = useState<number | "">("");
  const [prodPriceSell, setProdPriceSell] = useState<number | "">("");
  const [prodStock, setProdStock] = useState<number>(0);
  const [prodBarcode, setProdBarcode] = useState("");
  const [prodLargeUnit, setProdLargeUnit] = useState("");
  const [prodMultiplier, setProdMultiplier] = useState<number | "">("");
  const [prodMinStock, setProdMinStock] = useState<number>(10);
  const [prodPhoto, setProdPhoto] = useState("");

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  // --- AUTOMATIC SCANNER HANDLER ---
  const handleFastBarcodeChange = async (val: string) => {
    setFastBarcode(val);
    
    // Find matching product with scanned barcode
    const cleaned = val.trim();
    if (!cleaned) return;

    const matched = products.find(p => p.barcode === cleaned);
    if (matched) {
      // Process instant intake
      const multiplier = fastUnitMode === 'BESAR' && matched.multiplier ? Number(matched.multiplier) : 1;
      const unitLabel = fastUnitMode === 'BESAR' && matched.large_unit ? matched.large_unit : 'Pcs';

      const updatedDb = { ...db };
      const dbProducts = [...(updatedDb.produk_market || [])];
      const dbStockLogs = [...(updatedDb.stok_market || [])];

      const pIdx = dbProducts.findIndex(p => p.id_produk === matched.id_produk);
      if (pIdx > -1) {
        dbProducts[pIdx].stok += multiplier;

        dbStockLogs.push({
          id_log: `STK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          id_produk: matched.id_produk,
          tipe: "MASUK",
          jumlah: multiplier,
          keterangan: `Scanner barcode: Penerimaan cepat (+1 ${unitLabel})`,
          tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });

        updatedDb.produk_market = dbProducts;
        updatedDb.stok_market = dbStockLogs;

        await syncDbState(updatedDb);
        showToast(`Stok ${matched.nama_produk} otomatis ditambah +${multiplier} pcs!`, "success");
        setFastBarcode(""); // Reset input field so scanner is ready again
      }
    }
  };

  // --- FAST INTAKE CLICK HANDLER ---
  const handleQuickAddStock = async (product: ProdukMarket) => {
    const multiplier = fastUnitMode === 'BESAR' && product.multiplier ? Number(product.multiplier) : 1;
    const unitLabel = fastUnitMode === 'BESAR' && product.large_unit ? product.large_unit : 'Pcs';

    const updatedDb = { ...db };
    const dbProducts = [...(updatedDb.produk_market || [])];
    const dbStockLogs = [...(updatedDb.stok_market || [])];

    const pIdx = dbProducts.findIndex(p => p.id_produk === product.id_produk);
    if (pIdx === -1) return;

    dbProducts[pIdx].stok += multiplier;

    dbStockLogs.push({
      id_log: `STK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      id_produk: product.id_produk,
      tipe: "MASUK",
      jumlah: multiplier,
      keterangan: `Sentuhan instan: Penerimaan cepat (+1 ${unitLabel})`,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    updatedDb.produk_market = dbProducts;
    updatedDb.stok_market = dbStockLogs;

    await syncDbState(updatedDb);
    showToast(`Stok ${product.nama_produk} berhasil ditambah +${multiplier} pcs!`, "success");
  };

  // --- OPEN MODAL FOR NEW / EDIT ---
  const handleOpenModal = (id: string | null = null) => {
    if (id) {
      setEditProductId(id);
      const p = products.find(x => x.id_produk === id);
      if (p) {
        setProdName(p.nama_produk);
        setProdCategory(p.kategori);
        setProdUnit(p.satuan);
        setProdPriceBuy(p.harga_beli);
        setProdPriceSell(p.harga_jual);
        setProdStock(p.stok);
        setProdBarcode(p.barcode);
        setProdLargeUnit(p.large_unit || "");
        setProdMultiplier(p.multiplier || "");
        setProdMinStock(p.min_stock || 10);
        setProdPhoto(p.foto_url || "");
      }
    } else {
      setEditProductId(null);
      setProdName("");
      setProdCategory("Makanan");
      setProdUnit("pcs");
      setProdPriceBuy("");
      setProdPriceSell("");
      setProdStock(0);
      setProdBarcode('899' + Math.floor(100000000 + Math.random() * 900000000));
      setProdLargeUnit("");
      setProdMultiplier("");
      setProdMinStock(10);
      setProdPhoto("");
    }
    setIsModalOpen(true);
  };

  // --- SAVE PRODUCT TO DB ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prodName.trim()) {
      showToast("Nama produk tidak boleh kosong!", "error");
      return;
    }

    const updatedDb = { ...db };
    const dbProducts = [...(updatedDb.produk_market || [])];

    const payload: ProdukMarket = {
      id_produk: editProductId || `PRD-0${dbProducts.length + 1}`,
      nama_produk: prodName,
      kategori: prodCategory,
      satuan: prodUnit,
      harga_beli: Number(prodPriceBuy) || 0,
      harga_jual: Number(prodPriceSell) || 0,
      stok: Number(prodStock) || 0,
      barcode: prodBarcode.trim(),
      large_unit: prodLargeUnit.trim().toUpperCase() || undefined,
      multiplier: prodMultiplier !== "" ? Number(prodMultiplier) : undefined,
      min_stock: prodMinStock,
      foto_url: prodPhoto.trim() || undefined
    };

    if (editProductId) {
      const idx = dbProducts.findIndex(p => p.id_produk === editProductId);
      if (idx > -1) {
        dbProducts[idx] = payload;
        showToast(`Produk "${prodName}" berhasil diperbarui!`, 'success');
      }
    } else {
      dbProducts.push(payload);
      showToast(`Produk "${prodName}" berhasil ditambahkan!`, 'success');
    }

    updatedDb.produk_market = dbProducts;
    await syncDbState(updatedDb);
    setIsModalOpen(false);
  };

  // --- DELETE PRODUCT ---
  const handleDeleteProduct = (id: string) => {
    const p = products.find(x => x.id_produk === id);
    if (!p) return;

    showConfirm(`Apakah Bunda yakin ingin menghapus produk "${p.nama_produk}"?`, async (yes) => {
      if (yes) {
        const updatedDb = { ...db };
        updatedDb.produk_market = (updatedDb.produk_market || []).filter(x => x.id_produk !== id);
        await syncDbState(updatedDb);
        showToast("Produk berhasil dihapus dari katalog", "info");
      }
    });
  };

  // --- CLEAR LOGS ---
  const handleClearStockLogs = () => {
    showConfirm("Apakah Anda yakin ingin mengosongkan seluruh riwayat log mutasi stok?", async (yes) => {
      if (yes) {
        const updatedDb = { ...db };
        updatedDb.stok_market = [];
        await syncDbState(updatedDb);
        showToast("Riwayat stok dikosongkan.", "info");
      }
    });
  };

  // --- EXPORT PRODUCTS TO EXCEL ---
  const handleExportProductsExcel = () => {
    if (products.length === 0) {
      showToast("Tidak ada produk untuk diexport!", "error");
      return;
    }
    const exportData = products.map(p => ({
      "Barcode": p.barcode,
      "Nama Produk": p.nama_produk,
      "Kategori": p.kategori,
      "Harga Beli (Modal)": p.harga_beli,
      "Harga Jual": p.harga_jual,
      "Stok": p.stok,
      "Satuan Kecil": p.satuan,
      "Satuan Besar": p.large_unit || "",
      "Multiplier (Isi)": p.multiplier || "",
      "Min Stock": p.min_stock || 10,
      "Link Foto (Opsional)": p.foto_url || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Katalog Produk");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'katalog_produk_koperasi.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ Katalog produk berhasil diexport ke Excel!", "success");
  };

  // --- DOWNLOAD PRODUCT IMPORT TEMPLATE ---
  const downloadProductTemplate = () => {
    const templateData = [
      {
        "Barcode": "8991234567890",
        "Nama Produk": "Indomie Goreng Spesial",
        "Kategori": "Makanan",
        "Harga Beli (Modal)": 2800,
        "Harga Jual": 3500,
        "Stok": 40,
        "Satuan Kecil": "pcs",
        "Satuan Besar": "KARDUS",
        "Multiplier (Isi)": 40,
        "Min Stock": 10,
        "Link Foto (Opsional)": ""
      },
      {
        "Barcode": "8999876543210",
        "Nama Produk": "Teh Pucuk Harum 350ml",
        "Kategori": "Minuman",
        "Harga Beli (Modal)": 2700,
        "Harga Jual": 3500,
        "Stok": 24,
        "Satuan Kecil": "pcs",
        "Satuan Besar": "DUS",
        "Multiplier (Isi)": 24,
        "Min Stock": 12,
        "Link Foto (Opsional)": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Produk");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_produk.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Template import produk berhasil diunduh!", "success");
  };

  // --- PROCESS PRODUCT EXCEL FILE IMPORT ---
  const handleImportProductFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportProductFile(file);

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

          const barcode = getVal(["barcode", "kode barcode", "kode barang", "kode", "code"]);
          const nama = getVal(["nama produk", "nama_produk", "nama barang", "nama", "name"]);
          const kategori = getVal(["kategori", "category", "jenis"]);
          const hargaBeli = getVal(["harga beli (modal)", "harga beli", "harga_beli", "modal", "beli"]);
          const hargaJual = getVal(["harga jual", "harga_jual", "jual", "harga"]);
          const stok = getVal(["stok", "stock", "jumlah", "qty"]);
          const satuan = getVal(["satuan kecil", "satuan_kecil", "satuan", "unit"]);
          const largeUnit = getVal(["satuan besar", "satuan_besar", "large unit", "grosir"]);
          const multiplier = getVal(["multiplier (isi)", "multiplier", "isi per box", "isi per kardus", "isi"]);
          const minStock = getVal(["min stock", "min_stock", "stok minimum", "minimum"]);
          const fotoUrl = getVal(["link foto (opsional)", "link foto", "foto_url", "foto", "image"]);

          return {
            no: idx + 1,
            barcode: barcode ? String(barcode).trim() : '899' + Math.floor(100000000 + Math.random() * 900000000),
            nama_produk: nama ? String(nama).trim() : "",
            kategori: kategori ? String(kategori).trim() : "Makanan",
            harga_beli: hargaBeli !== undefined ? Number(hargaBeli) : 0,
            harga_jual: hargaJual !== undefined ? Number(hargaJual) : 0,
            stok: stok !== undefined ? Number(stok) : 0,
            satuan: satuan ? String(satuan).trim() : "pcs",
            large_unit: largeUnit ? String(largeUnit).trim().toUpperCase() : undefined,
            multiplier: multiplier !== undefined ? Number(multiplier) : undefined,
            min_stock: minStock !== undefined ? Number(minStock) : 10,
            foto_url: fotoUrl ? String(fotoUrl).trim() : undefined,
            isValid: !!nama
          };
        });

        setImportedProductList(mapped);
        showToast(`✓ Berhasil membaca ${mapped.length} baris data produk!`, "info");
      } catch (err) {
        console.error(err);
        showToast("Gagal memproses file Excel!", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // --- SAVE IMPORTED PRODUCTS TO DATABASE ---
  const saveImportedProducts = async () => {
    const validRows = importedProductList.filter(r => r.isValid);
    if (validRows.length === 0) {
      showToast("Tidak ada data produk valid untuk diimport!", "error");
      return;
    }

    const updatedDb = { ...db };
    const currentProducts = [...(updatedDb.produk_market || [])];
    let addedCount = 0;
    let updatedCount = 0;

    validRows.forEach(row => {
      // Check if product with this barcode or name already exists to prevent duplication
      const existingIdx = currentProducts.findIndex(p => p.barcode === row.barcode || p.nama_produk.toLowerCase().trim() === row.nama_produk.toLowerCase().trim());
      
      const payload: ProdukMarket = {
        id_produk: existingIdx > -1 ? currentProducts[existingIdx].id_produk : `PRD-0${currentProducts.length + addedCount + 1}`,
        nama_produk: row.nama_produk,
        kategori: row.kategori,
        satuan: row.satuan,
        harga_beli: row.harga_beli,
        harga_jual: row.harga_jual,
        stok: row.stok,
        barcode: row.barcode,
        large_unit: row.large_unit,
        multiplier: row.multiplier,
        min_stock: row.min_stock,
        foto_url: row.foto_url
      };

      if (existingIdx > -1) {
        currentProducts[existingIdx] = payload;
        updatedCount++;
      } else {
        currentProducts.push(payload);
        addedCount++;
      }
    });

    updatedDb.produk_market = currentProducts;
    await syncDbState(updatedDb);
    showToast(`✓ Import Berhasil! ${addedCount} produk baru ditambahkan, ${updatedCount} produk diperbarui!`, "success");
    setIsImportProductOpen(false);
    setImportedProductList([]);
    setImportProductFile(null);
  };

  // --- SAVE STOCK OPNAME ADJUSTMENT ---
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      showToast("Pilih produk terlebih dahulu!", "error");
      return;
    }
    const qty = Number(adjustQty);
    if (!qty || qty <= 0) {
      showToast("Jumlah penyesuaian harus lebih dari 0!", "error");
      return;
    }

    const matched = products.find(p => p.id_produk === adjustProductId);
    if (!matched) return;

    if (matched.stok < qty) {
      showToast(`Stok ${matched.nama_produk} tidak mencukupi (tersisa ${matched.stok} pcs)!`, "error");
      return;
    }

    const updatedDb = { ...db };
    const dbProducts = [...(updatedDb.produk_market || [])];
    const dbStockLogs = [...(updatedDb.stok_market || [])];

    const pIdx = dbProducts.findIndex(p => p.id_produk === adjustProductId);
    if (pIdx > -1) {
      dbProducts[pIdx].stok -= qty;

      dbStockLogs.push({
        id_log: `STK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        id_produk: adjustProductId,
        tipe: "KELUAR",
        jumlah: qty,
        keterangan: `Penyesuaian stok: ${adjustReason}`,
        tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16)
      });

      updatedDb.produk_market = dbProducts;
      updatedDb.stok_market = dbStockLogs;

      await syncDbState(updatedDb);
      showToast(`Stok ${matched.nama_produk} berhasil disesuaikan (berkurang -${qty} pcs)`, "success");
      setIsAdjustModalOpen(false);
      setAdjustProductId("");
      setAdjustQty("");
    }
  };

  // Filter products for catalog
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nama_produk.toLowerCase().includes(crudSearch.toLowerCase()) || p.barcode.includes(crudSearch);
    const matchesCategory = crudCategoryFilter === 'ALL' || p.kategori === crudCategoryFilter;
    const matchesLowStock = !showLowStockOnly || (p.stok <= (p.min_stock || 10));
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div className="flex flex-col gap-6 w-full text-xs text-gray-200">
      
      {/* 1. MAIN STOCK LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* LEFT COLUMN: MASTER CATALOG (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* CATALOG HEADER CARD */}
          <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <LucideIcon name="package" className="w-5 h-5 text-amber-500" />
                <span>Katalog Master & Stok Barang</span>
              </h2>
              <p className="text-xs text-emerald-500/70">Kelola master data barang koperasi, harga, barcode, dan stok minimum</p>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <LucideIcon name="plus-circle" className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          {/* TABLE CONTAINER & FILTER */}
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
                <div className="relative flex-grow max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50">🔍</span>
                  <input
                    type="text"
                    value={crudSearch}
                    onChange={(e) => setCrudSearch(e.target.value)}
                    placeholder="Cari nama atau barcode..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-xs focus:outline-none focus:border-amber-500 text-gray-200"
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={crudCategoryFilter}
                    onChange={(e) => setCrudCategoryFilter(e.target.value)}
                    className="bg-emerald-950 border border-emerald-900 text-[11px] rounded-xl px-3 py-1.5 focus:outline-none text-emerald-400 cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Sembako">Sembako</option>
                    <option value="Sabun">Sabun</option>
                    <option value="Rokok">Rokok</option>
                    <option value="Alat Tulis">Alat Tulis</option>
                    <option value="Kitab">Kitab</option>
                    <option value="Kebersihan">Kebersihan</option>
                  </select>

                  <button
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      showLowStockOnly
                        ? 'bg-red-500/10 border-red-500/50 text-red-400'
                        : 'bg-emerald-950 border-emerald-900 text-emerald-400 hover:bg-emerald-900/40'
                    }`}
                  >
                    <LucideIcon name="alert-triangle" className="w-3.5 h-3.5" />
                    <span>Stok Menipis</span>
                  </button>
                </div>
              </div>

              {/* Excel Import/Export & Stock Opname Action row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-900/30">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportProductsExcel}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900/60 text-emerald-400 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcon name="download" className="w-3.5 h-3.5" />
                    <span>Export Excel</span>
                  </button>
                  <button
                    onClick={() => setIsImportProductOpen(true)}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-900/60 text-emerald-400 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LucideIcon name="upload" className="w-3.5 h-3.5" />
                    <span>Import Excel / CSV</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (products.length === 0) {
                      showToast("Katalog produk kosong!", "error");
                      return;
                    }
                    setIsAdjustModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LucideIcon name="sliders" className="w-3.5 h-3.5" />
                  <span>Stock Opname (Barang Rusak/Hilang)</span>
                </button>
              </div>
            </div>

            {/* PRODUCT CATALOG TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] sm:text-xs text-gray-200">
                <thead>
                  <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider font-extrabold bg-emerald-950/10">
                    <th className="py-2.5 px-3">Barcode</th>
                    <th className="py-2.5 px-3">Nama Barang</th>
                    <th className="py-2.5 px-3 text-right">Harga Beli</th>
                    <th className="py-2.5 px-3 text-right">Harga Jual</th>
                    <th className="py-2.5 px-3 text-center">Satuan Besar / Set</th>
                    <th className="py-2.5 px-3 text-center">Total Stok</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/20">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-emerald-500/40">Tidak ada produk ditemukan</td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const lowStock = p.stok <= (p.min_stock || 10);
                      return (
                        <tr key={p.id_produk} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-amber-500 font-bold">{p.barcode}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-emerald-950 border border-emerald-900/60 flex items-center justify-center overflow-hidden shrink-0">
                                {p.foto_url ? (
                                  <img src={p.foto_url} alt={p.nama_produk} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span>📦</span>
                                )}
                              </div>
                              <div>
                                <span className="font-bold block text-gray-100">{p.nama_produk}</span>
                                <span className="text-[9px] text-emerald-500/50">Kategori: {p.kategori}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-300 font-mono">{formatRupiah(p.harga_beli)}</td>
                          <td className="py-2.5 px-3 text-right text-emerald-400 font-bold font-mono">{formatRupiah(p.harga_jual)}</td>
                          <td className="py-2.5 px-3 text-center text-[10px]">
                            {p.large_unit && p.multiplier ? (
                              <span className="bg-emerald-900/30 border border-emerald-800 text-emerald-400 px-2 py-1 rounded-lg inline-block whitespace-nowrap">
                                1 {p.large_unit} ({p.multiplier} pcs)
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`font-bold px-2 py-1 rounded inline-block whitespace-nowrap ${
                              lowStock 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {p.stok} pcs
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => handleOpenModal(p.id_produk)}
                                className="px-2 py-1 bg-emerald-950 border border-emerald-900/60 hover:bg-emerald-900 text-amber-400 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <LucideIcon name="edit" className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id_produk)}
                                className="px-2 py-1 bg-emerald-950 border border-emerald-900/60 hover:bg-red-950/60 text-red-400 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <LucideIcon name="trash-2" className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-[10px] text-emerald-500/50 font-semibold">
              Menampilkan {filteredProducts.length} dari {products.length} produk terdaftar
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FAST STOCK INTAKE (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* FAST INTAKE CARD */}
          <div className="glass-card p-5 rounded-2xl flex flex-col gap-4 self-start w-full">
            <div className="border-b border-emerald-900 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
                <LucideIcon name="box" className="w-5 h-5 text-emerald-400" />
                <span>Penerimaan Barang Cepat</span>
              </h3>
              <p className="text-[10px] text-emerald-500/70 mt-0.5">Tambah stok barang logistik instan lewat scanner / klik</p>
            </div>

            {/* BARCODE SCANNER INPUT FIELD */}
            <div>
              <label className="block text-[11px] text-emerald-500/80 mb-1.5 font-bold">
                PINDAI BARCODE / KETIK MANUAL
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">⚡</span>
                <input
                  type="text"
                  value={fastBarcode}
                  onChange={(e) => handleFastBarcodeChange(e.target.value)}
                  placeholder="Arahkan laser scanner ke barcode..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-emerald-950 border-2 border-emerald-900 focus:border-amber-500 text-xs text-amber-400 font-mono focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* SELECT INTAKE UNIT */}
            <div>
              <label className="block text-[11px] text-emerald-500/80 mb-1.5 font-bold">
                1. PILIH SATUAN MASUK
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFastUnitMode("PCS")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    fastUnitMode === 'PCS'
                      ? 'border-emerald-500 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/5'
                      : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-500 hover:bg-emerald-950/30'
                  }`}
                >
                  <span className="text-xs">PCS / ECERAN</span>
                  <span className="text-[9px] opacity-70">(+1 Pcs)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFastUnitMode("BESAR")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    fastUnitMode === 'BESAR'
                      ? 'border-emerald-500 bg-amber-500/10 text-amber-400 shadow-md shadow-amber-500/5'
                      : 'border-emerald-900/60 bg-emerald-950/20 text-emerald-500 hover:bg-emerald-950/30'
                  }`}
                >
                  <span className="text-xs">SATUAN BESAR</span>
                  <span className="text-[9px] opacity-70">(Sesuai Setelan)</span>
                </button>
              </div>
            </div>

            {/* INSTANT CLICK ITEMS */}
            <div>
              <label className="block text-[11px] text-emerald-500/80 mb-1.5 font-bold">
                2. KLIK BARANG UNTUK INPUT INSTAN
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <div className="text-[10px] text-emerald-500/40 text-center py-4">Belum ada barang terdaftar</div>
                ) : (
                  products.map(p => {
                    const labelSatuan = fastUnitMode === 'BESAR' ? (p.large_unit || "PCS") : "PCS";
                    const multiplierLabel = fastUnitMode === 'BESAR' && p.multiplier ? `+${p.multiplier} pcs` : "+1 pcs";
                    return (
                      <div
                        key={p.id_produk}
                        onClick={() => handleQuickAddStock(p)}
                        className="p-2 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex justify-between items-center cursor-pointer hover:border-amber-500/60 hover:bg-emerald-950/60 transition-all text-gray-200"
                      >
                        <div className="min-w-0 flex-grow pr-2">
                          <span className="text-[11px] font-bold block truncate text-gray-100">{p.nama_produk}</span>
                          <span className="text-[9px] text-emerald-500/50 block font-mono">Stok: {p.stok} pcs</span>
                        </div>
                        <span className="text-[9px] bg-emerald-900 border border-emerald-800 text-emerald-400 px-2 py-1 rounded-lg font-bold shrink-0">
                          {multiplierLabel} ({labelSatuan})
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LOG HISTORY MUTASI STOK AT THE BOTTOM */}
      <div className="glass-card p-4 rounded-2xl w-full mt-2">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 font-extrabold">
              <LucideIcon name="bar-chart-2" className="w-4 h-4 text-amber-500" />
              <span>Log Riwayat Mutasi / Alur Masuk Barang</span>
            </h3>
            <p className="text-[10px] text-emerald-500/70">Catatan alur penerimaan logistik barang masuk dan penyesuaian</p>
          </div>
          <button
            onClick={handleClearStockLogs}
            className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-md hover:bg-red-500/20 font-bold cursor-pointer transition-colors"
          >
            Bersihkan Log
          </button>
        </div>

        <div className="overflow-x-auto max-h-44 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[11px] text-gray-200">
            <thead>
              <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider font-extrabold bg-emerald-950/10">
                <th className="py-2 px-3">Waktu Mutasi</th>
                <th className="py-2 px-3">Barcode</th>
                <th className="py-2 px-3">Nama Produk</th>
                <th className="py-2 px-3 text-center">Tipe</th>
                <th className="py-2 px-3 text-center">Kuantitas</th>
                <th className="py-2 px-3">Detail Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/10">
              {stockLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-emerald-500/40">Belum ada catatan mutasi stok</td>
                </tr>
              ) : (
                [...stockLogs].reverse().map((log, i) => {
                  const p = products.find(x => x.id_produk === log.id_produk) || { nama_produk: "Produk Terhapus", barcode: "-" };
                  return (
                    <tr key={log.id_log || i} className="hover:bg-emerald-950/10 border-b border-emerald-950/10 transition-colors">
                      <td className="py-1.5 px-3 text-emerald-500/80 font-mono text-[9px]">{log.tanggal}</td>
                      <td className="py-1.5 px-3 font-mono text-amber-500/80 text-[10px]">{p.barcode}</td>
                      <td className="py-1.5 px-3 font-semibold">{p.nama_produk}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          log.tipe === 'MASUK'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {log.tipe}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-emerald-400 font-mono">+{log.jumlah} pcs</td>
                      <td className="py-1.5 px-3 text-emerald-500/60 font-semibold">{log.keterangan}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODAL: TAMBAH / EDIT MASTER PRODUK (Sesuai Image 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1500] flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card p-6 rounded-2xl border border-amber-500/20 max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-4 border-b border-emerald-900 pb-2">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                <LucideIcon name="package" className="w-5 h-5 text-amber-500" />
                <span>{editProductId ? "Edit Produk Koperasi" : "Tambah Produk Baru"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-emerald-900/50 rounded-lg text-emerald-500 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs text-gray-200">
              
              {/* BARCODE INPUT ROW */}
              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">
                  Barcode / Kode Barang (Pindai Otomatis Terisi)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    placeholder="Tembak scanner di sini atau input manual..."
                    className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-mono text-amber-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setProdBarcode('899' + Math.floor(100000000 + Math.random() * 900000000))}
                    title="Ganti Barcode Acak"
                    className="px-3 bg-emerald-900 hover:bg-emerald-800 border border-emerald-800 text-amber-400 rounded-xl font-bold transition-colors cursor-pointer text-xs"
                  >
                    🎲 Acak
                  </button>
                </div>
              </div>

              {/* NAMA BARANG */}
              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">Nama Barang</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Contoh: Indomie Goreng Spesial"
                  className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* KATEGORI ROW */}
              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">Kategori</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-emerald-400 cursor-pointer"
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                  <option value="Sembako">Sembako</option>
                  <option value="Sabun">Sabun</option>
                  <option value="Rokok">Rokok</option>
                  <option value="Alat Tulis">Alat Tulis</option>
                  <option value="Kitab">Kitab</option>
                  <option value="Kebersihan">Kebersihan</option>
                </select>
              </div>

              {/* PRICES ROW */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-emerald-500/80 mb-1.5 font-semibold">Beli Per PCS (Modal Rp)</label>
                  <input
                    type="number"
                    value={prodPriceBuy}
                    onChange={(e) => setProdPriceBuy(e.target.value === "" ? "" : Number(e.target.value))}
                    min="0"
                    placeholder="Contoh: 2600"
                    required
                    className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1.5 font-semibold">Jual Per PCS (Eceran Rp)</label>
                  <input
                    type="number"
                    value={prodPriceSell}
                    onChange={(e) => setProdPriceSell(e.target.value === "" ? "" : Number(e.target.value))}
                    min="0"
                    placeholder="Contoh: 3500"
                    required
                    className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SATUAN BESAR & MULTIPLIER ROW */}
              <div className="grid grid-cols-2 gap-4 bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/40">
                <div>
                  <label className="block text-emerald-500/70 mb-1 font-semibold">Satuan Besar (Grosir)</label>
                  <input
                    type="text"
                    value={prodLargeUnit}
                    onChange={(e) => setProdLargeUnit(e.target.value)}
                    placeholder="KARDUS / SLOP / RENTENG"
                    className="w-full bg-emerald-950 border border-emerald-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none text-amber-400 placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/70 mb-1 font-semibold">Multiplier (Isi per Satuan)</label>
                  <input
                    type="number"
                    value={prodMultiplier}
                    onChange={(e) => setProdMultiplier(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Misal: 40 atau 10"
                    className="w-full bg-emerald-950 border border-emerald-900 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* INITIAL STOCK & MINIMUM STOCK ROW */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-emerald-500/80 mb-1.5 font-semibold">
                    {editProductId ? "Stok Sekarang (Total PCS)" : "Stok Awal (Total PCS)"}
                  </label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(Math.max(0, Number(e.target.value)))}
                    min="0"
                    placeholder="Contoh: 159"
                    required
                    className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1.5 font-semibold">Batas Minimum Stok</label>
                  <input
                    type="number"
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(Math.max(1, Number(e.target.value)))}
                    min="1"
                    placeholder="Contoh: 10"
                    required
                    className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* PRODUCT IMAGE LINK */}
              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">Foto Produk Link (URL - Opsional)</label>
                <input
                  type="text"
                  value={prodPhoto}
                  onChange={(e) => setProdPhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/... atau kosongkan"
                  className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-3 border-t border-emerald-900">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer text-center"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL: STOCK OPNAME ADJUSTMENT (BARANG RUSAK/HILANG) */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[1500] flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl border border-amber-500/20 max-w-md w-full relative">
            <div className="flex justify-between items-center mb-4 border-b border-emerald-900 pb-2">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                <LucideIcon name="sliders" className="w-4 h-4 text-amber-400" />
                <span>Pencatatan Barang Rusak / Hilang</span>
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 hover:bg-emerald-900/50 rounded-lg text-emerald-500 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs text-gray-200">
              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">1. PILIH PRODUK</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  required
                  className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-amber-400 cursor-pointer"
                >
                  <option value="">-- Pilih Barang di Koperasi --</option>
                  {products.map(p => (
                    <option key={p.id_produk} value={p.id_produk}>
                      {p.nama_produk} (Stok: {p.stok} {p.satuan}) - [{p.barcode}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">2. JUMLAH YANG BERKURANG (PCS)</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value === "" ? "" : Number(e.target.value))}
                  min="1"
                  placeholder="Masukkan kuantitas rusak / hilang..."
                  required
                  className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">3. ALASAN PENYESUAIAN STOK</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-emerald-950 border border-emerald-900 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-emerald-400 cursor-pointer"
                >
                  <option value="Barang Kadaluarsa / Expired">Barang Kadaluarsa / Expired</option>
                  <option value="Barang Rusak / Pecah / Bocor">Barang Rusak / Pecah / Bocor</option>
                  <option value="Dimakan Hama (Tikus/Semut)">Dimakan Hama (Tikus/Semut)</option>
                  <option value="Hilang / Selisih Fisik Toko">Hilang / Selisih Fisik Toko</option>
                  <option value="Konsumsi Internal Pondok / Tamu">Konsumsi Internal Pondok / Tamu</option>
                  <option value="Penyesuaian Stock Opname Tahunan">Penyesuaian Stock Opname Tahunan</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3 border-t border-emerald-900">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="w-1/2 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-center"
                >
                  Simpan Pengurangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: IMPORT PRODUK VIA EXCEL */}
      {isImportProductOpen && (
        <div className="fixed inset-0 bg-black/85 z-[1500] flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-2xl border border-amber-500/30 max-w-2xl w-full relative max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-3 border-b border-emerald-900 pb-2 shrink-0">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-1.5">
                <LucideIcon name="upload" className="w-5 h-5 text-amber-500" />
                <span>Import Katalog Produk via Excel</span>
              </h3>
              <button
                onClick={() => {
                  setIsImportProductOpen(false);
                  setImportedProductList([]);
                  setImportProductFile(null);
                }}
                className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1 flex-grow">
              <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/50 leading-relaxed text-gray-300">
                <p className="font-bold text-emerald-400 mb-1">Panduan Pengisian Berkas Excel:</p>
                <ol className="list-decimal pl-4 space-y-1 text-gray-400">
                  <li>Unduh file template Excel yang telah disediakan di bawah.</li>
                  <li>Isi nama barang, kategori, harga beli, harga jual, dan stok awal.</li>
                  <li>Jika barcode tidak diisi, sistem akan membuatkan barcode acak secara otomatis.</li>
                  <li>Kolom <span className="text-emerald-400 font-bold">Kategori</span> harus berupa salah satu dari: <span className="italic">Makanan, Minuman, Sembako, Sabun, Rokok, Alat Tulis, Kitab, Kebersihan</span>.</li>
                </ol>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={downloadProductTemplate}
                    className="px-3 py-1.5 bg-amber-500 text-emerald-950 rounded-lg font-bold hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <LucideIcon name="download" className="w-3.5 h-3.5" />
                    <span>Unduh Template Excel Produk</span>
                  </button>
                </div>
              </div>

              {/* FILE UPLOADER */}
              <div className="border-2 border-dashed border-emerald-900 rounded-2xl p-6 text-center hover:bg-emerald-950/20 transition-all relative">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleImportProductFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📊</span>
                  <p className="font-bold text-gray-200">
                    {importProductFile ? importProductFile.name : "Pilih atau Seret file Excel/CSV ke Sini"}
                  </p>
                  <p className="text-[10px] text-emerald-500/60">
                    Mendukung format file .xlsx, .xls, .csv hingga 5MB
                  </p>
                </div>
              </div>

              {/* PREVIEW OF PARSED DATA */}
              {importedProductList.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1 shrink-0">
                    <span className="font-bold text-emerald-400">Pratinjau Data Produk ({importedProductList.length} baris):</span>
                    <span className="text-[10px] text-gray-400">*Mohon verifikasi sebelum menyimpan</span>
                  </div>
                  <div className="overflow-x-auto max-h-48 border border-emerald-950 rounded-xl">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-emerald-950 border-b border-emerald-900 text-emerald-500/70 uppercase font-bold text-[9px]">
                          <th className="py-2 px-3">No</th>
                          <th className="py-2 px-3">Barcode</th>
                          <th className="py-2 px-3">Nama Produk</th>
                          <th className="py-2 px-3">Kategori</th>
                          <th className="py-2 px-3 text-right">Modal</th>
                          <th className="py-2 px-3 text-right">Harga Jual</th>
                          <th className="py-2 px-3 text-center">Stok</th>
                          <th className="py-2 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/20 bg-emerald-950/10">
                        {importedProductList.map((row, i) => (
                          <tr key={i} className="hover:bg-emerald-950/20">
                            <td className="py-1.5 px-3 text-gray-500">{row.no}</td>
                            <td className="py-1.5 px-3 font-mono text-amber-500">{row.barcode}</td>
                            <td className="py-1.5 px-3 font-semibold text-gray-200">{row.nama_produk || <span className="text-red-400 italic">[Kosong - ERROR]</span>}</td>
                            <td className="py-1.5 px-3 text-emerald-400">{row.kategori}</td>
                            <td className="py-1.5 px-3 text-right text-gray-300 font-mono">{formatRupiah(row.harga_beli)}</td>
                            <td className="py-1.5 px-3 text-right text-emerald-400 font-bold font-mono">{formatRupiah(row.harga_jual)}</td>
                            <td className="py-1.5 px-3 text-center text-amber-400 font-bold font-mono">{row.stok} pcs</td>
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
            <div className="flex gap-3 pt-3 border-t border-emerald-900 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsImportProductOpen(false);
                  setImportedProductList([]);
                  setImportProductFile(null);
                }}
                className="w-1/2 py-2.5 bg-emerald-950/60 hover:bg-emerald-950 text-emerald-500 border border-emerald-900 rounded-xl font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveImportedProducts}
                disabled={importedProductList.length === 0}
                className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-emerald-950 font-bold rounded-xl shadow-lg transition-all cursor-pointer text-center"
              >
                Simpan & Import ke Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
