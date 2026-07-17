import React, { useState, useEffect } from 'react';
import { K_DB, Santri, ProdukMarket, TransaksiMarket } from '../types';
import { LucideIcon } from './LucideIcon';
import { LiveBarcodeScanner } from './LiveBarcodeScanner';

interface MarketPosTabProps {
  db: K_DB;
  activeUser: { nama: string; role: string } | null;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
  onPrintReceipt: (tx: TransaksiMarket, cash: number, change: number) => void;
}

interface CartItem {
  id_produk: string;
  nama_produk: string;
  unit: string;
  multiplier: number;
  harga_jual: number;
  harga_beli: number;
  qty: number;
}

export function MarketPosTab({
  db,
  activeUser,
  syncDbState,
  showToast,
  showConfirm,
  onPrintReceipt
}: MarketPosTabProps) {
  const products = db.produk_market || [];
  const santriList = db.santri || [];

  // --- STATE ---
  const [posSearch, setPosSearch] = useState("");
  const [kasirUnitMode, setKasirUnitMode] = useState<"PCS" | "GROSIR">("PCS");
  const [posCategory, setPosCategory] = useState("ALL");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Buyer
  const [buyerSearch, setBuyerSearch] = useState("");
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Santri | { id_santri: null; nama_santri: string; kelas: string; barcode: string; foto_profil?: string; saldo_utama?: number } | null>(null);

  // Checkout
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "TABUNGAN" | null>(null);
  const [checkoutCash, setCheckoutCash] = useState<number | "">("");

  // Barcode scanner simulation modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState<"product" | "santri">("product");

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const playScannerBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.log("AudioContext error", e);
    }
  };

  // Handle global keydown scan simulation
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 50) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === "Enter") {
        if (buffer.length >= 3) {
          e.preventDefault();
          handleScannedBarcode(buffer.trim());
          buffer = "";
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, santriList, cart, kasirUnitMode]);

  const handleScannedBarcode = (code: string) => {
    playScannerBeep();
    showToast(`Pindaian Barcode Terbaca: ${code}`, "info");

    const matchedProd = products.find(p => p.barcode === code);
    const matchedSantri = santriList.find(s => s.barcode === code);

    if (matchedProd) {
      handleAddToCart(matchedProd);
    } else if (matchedSantri) {
      handleSelectSantri(matchedSantri);
    } else {
      showToast(`Barcode ${code} tidak dikenali!`, "error");
    }
  };

  // Add to cart helper
  const handleAddToCart = (p: ProdukMarket) => {
    const multiplier = kasirUnitMode === 'GROSIR' && p.multiplier ? Number(p.multiplier) : 1;
    const isSellingLargeUnit = multiplier > 1;
    const displayUnitName = isSellingLargeUnit ? (p.large_unit || "GROSIR") : "PCS";

    if (p.stok < multiplier) {
      showToast(`Stok ${p.nama_produk} tidak mencukupi untuk jualan 1 ${displayUnitName}!`, "error");
      return;
    }

    const existingIndex = cart.findIndex(item => item.id_produk === p.id_produk && item.unit === displayUnitName);

    if (existingIndex > -1) {
      const updated = [...cart];
      const nextTotalReq = (updated[existingIndex].qty + 1) * multiplier;
      if (nextTotalReq > p.stok) {
        showToast(`Stok ${p.nama_produk} tidak mencukupi!`, "error");
        return;
      }
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      setCart(prev => [...prev, {
        id_produk: p.id_produk,
        nama_produk: p.nama_produk,
        unit: displayUnitName,
        multiplier: multiplier,
        harga_jual: p.harga_jual * multiplier,
        harga_beli: p.harga_beli * multiplier,
        qty: 1
      }]);
    }
    showToast(`1 ${displayUnitName} ${p.nama_produk} dimasukkan!`, "success");
  };

  const handleUpdateQty = (index: number, offset: number) => {
    const updated = [...cart];
    const item = updated[index];
    const p = products.find(x => x.id_produk === item.id_produk);
    if (!p) return;

    const nextQty = item.qty + offset;
    if (nextQty <= 0) {
      updated.splice(index, 1);
      setCart(updated);
      return;
    }

    if (nextQty * item.multiplier > p.stok) {
      showToast("Batas kuantitas melebihi sisa stok toko!", "error");
      return;
    }

    item.qty = nextQty;
    setCart(updated);
  };

  const handleRemoveFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      showConfirm("Bunda yakin ingin mengosongkan keranjang belanja?", (yes) => {
        if (yes) {
          setCart([]);
          showToast("Keranjang dibersihkan!", "info");
        }
      });
    }
  };

  // Santri select
  const handleSelectSantri = (s: Santri) => {
    setSelectedBuyer(s);
    setPaymentMethod("TABUNGAN");
    setBuyerSearch("");
    setShowBuyerDropdown(false);
    showToast(`Santri ${s.nama_santri} terpilih.`);
  };

  const handleSelectGuest = () => {
    setSelectedBuyer({
      id_santri: null,
      nama_santri: "Pembeli Umum",
      kelas: "Non-Santri",
      barcode: "-",
      foto_profil: "",
      saldo_utama: 0
    });
    setPaymentMethod("TUNAI");
    setBuyerSearch("");
    setShowBuyerDropdown(false);
    showToast("Pembeli umum terpilih.");
  };

  const handleRemoveBuyer = () => {
    setSelectedBuyer(null);
    setPaymentMethod(null);
  };

  // Calculations
  const cartTotal = cart.reduce((sum, item) => sum + (item.harga_jual * item.qty), 0);
  const checkoutChange = checkoutCash !== "" ? checkoutCash - cartTotal : 0;

  const handleProcessCheckout = async () => {
    if (cart.length === 0) {
      showToast("Keranjang belanja kosong!", "error");
      return;
    }
    if (!selectedBuyer) {
      showToast("Silakan tentukan Pembeli / Santri terlebih dahulu!", "error");
      return;
    }
    if (!paymentMethod) {
      showToast("Pilih metode pembayaran!", "error");
      return;
    }

    const numericCash = checkoutCash === "" ? 0 : Number(checkoutCash);
    if (paymentMethod === 'TUNAI' && numericCash < cartTotal) {
      showToast("Uang tunai yang diterima kurang!", "error");
      return;
    }

    const updatedDb = { ...db };
    const dbProducts = [...(updatedDb.produk_market || [])];
    const dbSantriList = [...(updatedDb.santri || [])];
    const dbTransactions = [...(updatedDb.transaksi_market || [])];
    const dbStockLogs = [...(updatedDb.stok_market || [])];

    if (paymentMethod === 'TABUNGAN') {
      if (!selectedBuyer.id_santri) {
        showToast("Pembeli umum tidak dapat membayar menggunakan metode Tabungan!", "error");
        return;
      }

      const santriIdx = dbSantriList.findIndex(s => s.id_santri === selectedBuyer.id_santri);
      if (santriIdx === -1) return;

      const s = dbSantriList[santriIdx];
      if (s.saldo_utama < cartTotal) {
        showToast(`Pembayaran gagal! Saldo tabungan tidak cukup.`, "error");
        return;
      }

      // Enforce Daily Market Spending Limit
      const today = new Date().toISOString().slice(0, 10);
      const todayMarketSpent = dbTransactions
        .filter(t => t.id_santri === selectedBuyer.id_santri && t.tanggal.startsWith(today))
        .reduce((sum, t) => sum + t.total, 0);

      const activeBelanjaIzin = (updatedDb.izin_keamanan || [])
        .find(iz => iz.id_santri === selectedBuyer.id_santri && iz.tipe_izin === "BELANJA" && iz.tanggal === today);

      const standardLimit = s.limit_belanja || 50000;
      const finalLimit = activeBelanjaIzin ? activeBelanjaIzin.nominal_disetujui : standardLimit;
      const isNoLimit = activeBelanjaIzin?.is_no_limit === true;
      const isOverride = !!activeBelanjaIzin;

      if (!isNoLimit && (todayMarketSpent + cartTotal > finalLimit)) {
        showToast(
          `Gagal! Transaksi sebesar ${formatRupiah(cartTotal)} melebihi sisa batas belanja harian market (Batas Harian: ${formatRupiah(finalLimit)}${isOverride ? " [Izin Keamanan]" : ""}, Sudah belanja hari ini: ${formatRupiah(todayMarketSpent)}). Hubungi Admin Keamanan jika ingin berbelanja lebih!`,
          "error"
        );
        return;
      }

      s.saldo_utama -= cartTotal;
    }

    // Process Stock deductions
    let totalProfit = 0;
    cart.forEach(item => {
      const pIdx = dbProducts.findIndex(p => p.id_produk === item.id_produk);
      if (pIdx > -1) {
        const prod = dbProducts[pIdx];
        const qtyToDeduct = item.qty * item.multiplier;
        prod.stok = Math.max(0, prod.stok - qtyToDeduct);

        const profitPerUnit = item.harga_jual - item.harga_beli;
        totalProfit += profitPerUnit * item.qty;

        dbStockLogs.push({
          id_log: `STK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          id_produk: item.id_produk,
          tipe: "KELUAR",
          jumlah: qtyToDeduct,
          keterangan: `Penjualan POS #${selectedBuyer.nama_santri}`,
          tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });
      }
    });

    updatedDb.kas_market = (updatedDb.kas_market || 0) + cartTotal;

    const newTxId = `TX-MKT-${Date.now().toString().slice(-4)}`;
    const newTx: TransaksiMarket = {
      id_transaksi: newTxId,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
      id_santri: selectedBuyer.id_santri,
      nama_santri: selectedBuyer.nama_santri,
      total: cartTotal,
      profit: totalProfit,
      kas_masuk: cartTotal,
      metode_pembayaran: paymentMethod,
      items: cart.map(c => ({
        id_produk: c.id_produk,
        nama_produk: c.nama_produk,
        qty: c.qty,
        unit: c.unit,
        multiplier: c.multiplier,
        harga_jual: c.harga_jual,
        harga_beli: c.harga_beli
      }))
    };

    dbTransactions.unshift(newTx);

    updatedDb.produk_market = dbProducts;
    updatedDb.santri = dbSantriList;
    updatedDb.transaksi_market = dbTransactions;
    updatedDb.stok_market = dbStockLogs;

    await syncDbState(updatedDb);

    showToast("Pembayaran sukses! Struk dicetak.", "success");
    onPrintReceipt(newTx, paymentMethod === 'TUNAI' ? numericCash : cartTotal, paymentMethod === 'TUNAI' ? checkoutChange : 0);

    // Reset fields
    setCart([]);
    setSelectedBuyer(null);
    setPaymentMethod(null);
    setCheckoutCash("");
  };

  const handlePOSSearch = (val: string) => {
    setPosSearch(val);
    const code = val.trim();
    const matched = products.find(p => p.barcode === code);
    if (matched) {
      if (matched.stok === 0) {
        showToast(`Stok ${matched.nama_produk} sedang kosong.`, "error");
      } else {
        handleAddToCart(matched);
      }
      setPosSearch("");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nama_produk.toLowerCase().includes(posSearch.toLowerCase()) || p.barcode.includes(posSearch);
    const matchesCategory = posCategory === 'ALL' || p.kategori === posCategory;
    return matchesSearch && matchesCategory;
  });

  const matchingSantri = buyerSearch.trim() !== ""
    ? santriList.filter(s => 
        s.nama_santri.toLowerCase().includes(buyerSearch.toLowerCase()) || 
        s.barcode.includes(buyerSearch) ||
        (s.alamat && s.alamat.toLowerCase().includes(buyerSearch.toLowerCase()))
      )
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Left: Product Grid */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="glass-card p-4 rounded-2xl flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50">🔍</span>
            <input
              type="text"
              value={posSearch}
              onChange={(e) => handlePOSSearch(e.target.value)}
              placeholder="Tembak scanner fisik atau ketik barcode produk..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-sm focus:outline-none focus:border-amber-500 text-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 p-1.5 bg-emerald-950/30 rounded-xl border border-emerald-900/30">
            <button
              onClick={() => setKasirUnitMode("PCS")}
              className={`py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                kasirUnitMode === 'PCS'
                  ? 'border-emerald-500 bg-amber-500/10 text-amber-400'
                  : 'border-transparent text-emerald-500 hover:bg-emerald-950/30'
              }`}
            >
              📦 Pcs (Eceran)
            </button>
            <button
              onClick={() => setKasirUnitMode("GROSIR")}
              className={`py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                kasirUnitMode === 'GROSIR'
                  ? 'border-emerald-500 bg-amber-500/10 text-amber-400'
                  : 'border-transparent text-emerald-500 hover:bg-emerald-950/30'
              }`}
            >
              📦 Satuan Grosir
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center">
            <button
              onClick={() => {
                setScannerType("product");
                setIsScannerOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-900/40 hover:bg-emerald-900/70 border border-emerald-800/40 rounded-xl text-xs flex items-center gap-1.5 transition-colors text-amber-400 cursor-pointer"
            >
              <LucideIcon name="scan" className="w-4 h-4" />
              <span>Simulasi Scan Barcode</span>
            </button>

            <select
              value={posCategory}
              onChange={(e) => setPosCategory(e.target.value)}
              className="bg-emerald-950 border border-emerald-900 text-xs rounded-xl px-3 py-1.5 text-emerald-400 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="ATK">ATK</option>
              <option value="Kitab">Kitab</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Sabun">Sabun</option>
              <option value="Rokok">Rokok</option>
            </select>
          </div>
        </div>

        {/* Product Catalogue Grid */}
        <div className="glass-card p-4 rounded-2xl flex-grow flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
              <LucideIcon name="layout-grid" className="w-4 h-4" /> Etalase Produk
            </h3>
            <span className="text-[11px] text-emerald-500/60 font-mono">
              Menampilkan {filteredProducts.length} produk
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[460px] pr-1">
            {filteredProducts.map(p => {
              const multiplier = kasirUnitMode === 'GROSIR' && p.multiplier ? Number(p.multiplier) : 1;
              const lowStock = p.stok <= (p.min_stock || 10);
              const outOfStock = p.stok === 0;
              const displayPrice = p.harga_jual * multiplier;

              return (
                <div
                  key={p.id_produk}
                  onClick={() => !outOfStock && handleAddToCart(p)}
                  className={`p-3 rounded-xl flex flex-col justify-between transition-all cursor-pointer select-none bg-emerald-950/30 border ${
                    outOfStock
                      ? 'border-red-950 opacity-50 cursor-not-allowed'
                      : lowStock
                        ? 'border-amber-500/30 hover:border-amber-500/60'
                        : 'border-emerald-900/40 hover:border-emerald-700/60'
                  }`}
                >
                  <div>
                    <div className="relative w-full h-24 mb-2 rounded-lg overflow-hidden bg-emerald-950 border border-emerald-900 flex items-center justify-center">
                      {p.foto_url ? (
                        <img src={p.foto_url} alt={p.nama_produk} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl text-emerald-800">📦</span>
                      )}
                      <span className="absolute top-1 left-1 text-[9px] bg-emerald-900/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        {p.kategori}
                      </span>
                      {outOfStock && (
                        <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-400 text-xs font-bold">HABIS</span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-gray-100 truncate">{p.nama_produk}</h4>
                    <span className="text-[9px] text-emerald-500/50 block font-mono">BC: {p.barcode}</span>
                    {p.large_unit && p.multiplier && (
                      <div className="text-[9px] text-emerald-500/70 font-semibold mt-0.5">
                        1 {p.large_unit} = {p.multiplier} pcs
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-950/50">
                    <span className="text-xs font-extrabold text-amber-400">{formatRupiah(displayPrice)}</span>
                    <span className={`text-[10px] ${lowStock ? 'text-amber-500 font-bold' : 'text-emerald-500/70'}`}>
                      {p.stok} pcs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Customer Section */}
        <div className="glass-card p-4 rounded-2xl border border-amber-500/10">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              👤 Pembeli / Santri
            </h3>
            <button
              onClick={() => {
                setScannerType("santri");
                setIsScannerOpen(true);
              }}
              className="text-[10px] text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md transition-colors border border-amber-500/20 flex items-center gap-1 cursor-pointer"
            >
              <LucideIcon name="scan" className="w-3 h-3" /> Scan Kartu
            </button>
          </div>

          {!selectedBuyer ? (
            <div className="flex flex-col gap-2 relative">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50">👤</span>
                <input
                  type="text"
                  value={buyerSearch}
                  onChange={(e) => {
                    setBuyerSearch(e.target.value);
                    setShowBuyerDropdown(true);
                  }}
                  placeholder="Cari nama santri..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-sm focus:outline-none focus:border-amber-500 text-gray-200"
                />
              </div>

              {showBuyerDropdown && matchingSantri.length > 0 && (
                <div className="absolute z-50 w-full mt-11 bg-emerald-950 border border-emerald-900 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                  {matchingSantri.map(s => (
                    <div
                      key={s.id_santri}
                      onClick={() => handleSelectSantri(s)}
                      className="p-2 hover:bg-emerald-900/60 cursor-pointer text-xs flex justify-between items-center border-b border-emerald-900/40 text-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-900 border border-emerald-800 flex items-center justify-center overflow-hidden shrink-0">
                          {s.foto_profil ? <img src={s.foto_profil} className="w-full h-full object-cover" /> : "👤"}
                        </div>
                        <div>
                          <span className="font-bold">{s.nama_santri}</span>
                          <span className="text-[9px] text-emerald-500/50 block">
                            {s.kelas}
                            {s.alamat && ` • 📍 ${s.alamat}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-500 font-mono">{s.barcode}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center py-2">
                <span className="text-[11px] text-emerald-500/50">
                  Atau pilih <button onClick={handleSelectGuest} className="text-amber-500 hover:underline font-bold cursor-pointer">Pembeli Umum / Tunai</button>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-900/40 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-900 border border-emerald-800 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedBuyer.foto_profil ? <img src={selectedBuyer.foto_profil} className="w-full h-full object-cover" /> : "👤"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-100">{selectedBuyer.nama_santri}</h4>
                  <p className="text-[11px] text-emerald-500/70">
                    {selectedBuyer.kelas}
                    {selectedBuyer.alamat && ` • Asal: ${selectedBuyer.alamat}`}
                    {` • ID: ${selectedBuyer.barcode}`}
                  </p>
                  {selectedBuyer.id_santri && (
                    <div className="flex flex-col gap-1 mt-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                          Saldo: {formatRupiah(selectedBuyer.saldo_utama || 0)}
                        </span>
                        <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/20 font-mono">
                          Limit Jajan: {formatRupiah(selectedBuyer.limit_jajan || 25000)}
                        </span>
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20 font-mono">
                          Limit Belanja: {formatRupiah(selectedBuyer.limit_belanja || 50000)}
                        </span>
                      </div>

                      {/* Active Izin Belanja Keamanan Info */}
                      {(() => {
                        const today = new Date().toISOString().slice(0, 10);
                        const activeBelanjaIzin = (db.izin_keamanan || []).find(iz => iz.id_santri === selectedBuyer.id_santri && iz.tipe_izin === "BELANJA" && iz.tanggal === today);
                        if (activeBelanjaIzin) {
                          return (
                            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[9px] text-amber-300 leading-tight flex flex-col gap-0.5 mt-1 animate-pulse">
                              <span className="font-bold flex items-center gap-1">
                                🔔 IZIN BELANJA KHUSUS AKTIF
                              </span>
                              <span>
                                Aturan hari ini: <strong>{activeBelanjaIzin.is_no_limit ? "NO LIMIT (BEBAS BELANJA)" : `Maksimal ${formatRupiah(activeBelanjaIzin.nominal_disetujui)}`}</strong>
                              </span>
                              <span className="opacity-80">Alasan: "{activeBelanjaIzin.keterangan}"</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleRemoveBuyer}
                className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500/70 hover:text-red-400 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Cart Container */}
        <div className="glass-card p-4 rounded-2xl flex-grow flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-emerald-950/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                🛒 Keranjang Belanja
              </h3>
              <button onClick={handleClearCart} className="text-[10px] text-red-400/80 hover:text-red-400 font-bold cursor-pointer">
                Kosongkan
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-emerald-700">
                <span className="text-3xl mb-1">🛒</span>
                <p className="text-xs">Keranjang masih kosong.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {cart.map((item, index) => (
                  <div key={`${item.id_produk}-${item.unit}`} className="flex justify-between items-center bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/30 text-xs text-gray-200">
                    <div className="flex-grow max-w-[50%]">
                      <span className="font-bold truncate block">{item.nama_produk}</span>
                      <div className="text-[10px] text-emerald-500/50">
                        Unit: <span className="font-bold text-emerald-400">{item.unit}</span>
                      </div>
                      <span className="text-[10px] text-amber-500 font-bold">{formatRupiah(item.harga_jual)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-950 px-2 py-1 rounded-lg border border-emerald-900">
                      <button onClick={() => handleUpdateQty(index, -1)} className="text-emerald-500 hover:text-amber-500 cursor-pointer">
                        ✕
                      </button>
                      <span className="w-6 text-center font-bold">{item.qty}</span>
                      <button onClick={() => handleUpdateQty(index, 1)} className="text-emerald-500 hover:text-amber-500 cursor-pointer">
                        ＋
                      </button>
                    </div>
                    <div className="text-right pl-2">
                      <span className="font-extrabold text-amber-400 block">{formatRupiah(item.harga_jual * item.qty)}</span>
                      <button onClick={() => handleRemoveFromCart(index)} className="text-[9px] text-red-400/80 hover:underline cursor-pointer">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-950/50 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-emerald-500/80">Subtotal</span>
              <span className="text-sm font-semibold text-gray-300">{formatRupiah(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-extrabold text-amber-400">
              <span>TOTAL BELANJA</span>
              <span>{formatRupiah(cartTotal)}</span>
            </div>

            <div className="payment-input-group">
              <label className="block text-[10px] font-bold text-emerald-500/80 mb-1" htmlFor="checkout-cash">Uang Diterima / Bayar</label>
              <input
                id="checkout-cash"
                type="number"
                value={checkoutCash}
                onChange={(e) => setCheckoutCash(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Masukkan nominal nominal pembayaran..."
                className="w-full px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-900 text-sm focus:outline-none focus:border-amber-500 text-gray-200"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[5000, 10000, 20000, 50000].map(val => (
                  <button
                    key={val}
                    onClick={() => setCheckoutCash(val)}
                    className="py-1 bg-emerald-900/40 border border-emerald-800 text-[10px] rounded-lg text-emerald-400 hover:bg-emerald-900/80 cursor-pointer font-bold"
                  >
                    {val / 1000}K
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-500/80 font-bold">Kembalian</span>
              <span className={`font-extrabold text-sm ${checkoutChange < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {checkoutChange < 0 ? `Kurang ${formatRupiah(Math.abs(checkoutChange))}` : formatRupiah(checkoutChange)}
              </span>
            </div>

            {/* Pay Methods */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setPaymentMethod("TUNAI")}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'TUNAI'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'border-emerald-800 text-emerald-500 hover:bg-emerald-950/30'
                }`}
              >
                💵 Tunai (Cash)
              </button>
              <button
                onClick={() => setPaymentMethod("TABUNGAN")}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentMethod === 'TABUNGAN'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                    : 'border-emerald-800 text-emerald-500 hover:bg-emerald-950/30'
                }`}
              >
                💳 Tabungan (Cashless)
              </button>
            </div>

            <button
              onClick={handleProcessCheckout}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <LucideIcon name="check-circle" className="w-5 h-5" />
              <span>Bayar Sekarang (Konfirmasi Selesai)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulasi scan barcode modal */}
      {isScannerOpen && (
        <LiveBarcodeScanner
          title={scannerType === 'product' ? 'Pemindaian Barcode Produk' : 'Pemindaian ID Card Santri'}
          subtitle={scannerType === 'product' ? 'Arahkan kamera ke barcode produk toko' : 'Arahkan kamera ke barcode kartu santri'}
          onScanSuccess={(decodedText) => {
            handleScannedBarcode(decodedText);
            setIsScannerOpen(false);
          }}
          onClose={() => setIsScannerOpen(false)}
          dummyOptions={scannerType === 'product' 
            ? products.map(p => ({ label: p.nama_produk, code: p.barcode, subLabel: `Stok: ${p.stok}` }))
            : santriList.map(s => ({ label: s.nama_santri, code: s.barcode, subLabel: s.kelas }))
          }
        />
      )}
    </div>
  );
}
