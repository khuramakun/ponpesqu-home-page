import React, { useState, useEffect } from 'react';
import { K_DB, TransaksiMarket } from '../types';
import { LucideIcon } from './LucideIcon';
import { MarketPosTab } from './MarketPosTab';
import { MarketStokTab } from './MarketStokTab';
import { MarketLaporanTab } from './MarketLaporanTab';
import { MarketPengaturanTab } from './MarketPengaturanTab';

interface MarketPanelProps {
  db: K_DB;
  activeUser: { nama: string; role: string } | null;
  activeTab: string;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
  switchTab: (tabId: string) => void;
}

export function MarketPanel({
  db,
  activeUser,
  activeTab,
  syncDbState,
  showToast,
  showConfirm,
  switchTab
}: MarketPanelProps) {
  // Local active sub-tabs inside Market Panel (pos, produk, stok, laporan, pengaturan)
  const [marketTab, setMarketTab] = useState("pos");
  const products = db.produk_market || [];
  
  // Real-time digital clock
  const [timeStr, setTimeStr] = useState("00:00:00");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Modal print receipt states
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptTx, setReceiptTx] = useState<TransaksiMarket | null>(null);
  const [receiptCash, setReceiptCash] = useState(0);
  const [receiptChange, setReceiptChange] = useState(0);

  // PDF report stats (active on printed pages)
  const [isPdfPrintOpen, setIsPdfPrintOpen] = useState(false);

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const handleOpenReceipt = (tx: TransaksiMarket, cash: number, change: number) => {
    setReceiptTx(tx);
    setReceiptCash(cash);
    setReceiptChange(change);
    setIsReceiptOpen(true);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleOpenPDFReport = () => {
    setIsPdfPrintOpen(true);
    setTimeout(() => {
      window.print();
      setIsPdfPrintOpen(false);
    }, 200);
  };

  const handleResetDatabase = () => {
    showConfirm("Apakah Anda yakin ingin mereset seluruh database Market ke bawaan default? Tindakan ini tidak dapat dibatalkan.", async (yes) => {
      if (yes) {
        const updatedDb = { ...db };
        updatedDb.kas_market = 1250000;
        updatedDb.kas_yayasan = 5800000;
        updatedDb.produk_market = [
          { id_produk: "PRD-001", nama_produk: "Susu Ultra Milk 250ml", kategori: "Minuman", harga_beli: 5200, harga_jual: 6500, stok: 45, satuan: "pcs", barcode: "899100110201", foto_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop", min_stock: 10, large_unit: "KARDUS", multiplier: 40 },
          { id_produk: "PRD-002", nama_produk: "Roti Kasur Sari Roti", kategori: "Makanan", harga_beli: 11000, harga_jual: 13500, stok: 12, satuan: "pcs", barcode: "899100110202", foto_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop", min_stock: 5, large_unit: "PACK", multiplier: 10 },
          { id_produk: "PRD-003", nama_produk: "Buku Tulis Sinar Dunia 38", kategori: "ATK", harga_beli: 3000, harga_jual: 4000, stok: 120, satuan: "pcs", barcode: "899100110203", foto_url: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=150&auto=format&fit=crop", min_stock: 20, large_unit: "PACK", multiplier: 10 },
          { id_produk: "PRD-004", nama_produk: "Kitab Safinatun Najah (Saku)", kategori: "Kitab", harga_beli: 6000, harga_jual: 8500, stok: 15, satuan: "pcs", barcode: "899100110204", foto_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=150&auto=format&fit=crop", min_stock: 3, large_unit: "SLOP", multiplier: 10 },
          { id_produk: "PRD-005", nama_produk: "Sabun Mandi Lifebuoy", kategori: "Kebersihan", harga_beli: 3200, harga_jual: 4500, stok: 24, satuan: "pcs", barcode: "899100110205", foto_url: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=150&auto=format&fit=crop", min_stock: 5, large_unit: "DUS", multiplier: 24 }
        ];
        updatedDb.stok_market = [
          { id_log: "STK-0001", id_produk: "PRD-001", tipe: "MASUK", jumlah: 50, keterangan: "Kulakan Grosir Sejahtera", tanggal: "2026-07-09 08:30" },
          { id_log: "STK-0002", id_produk: "PRD-004", tipe: "MASUK", jumlah: 10, keterangan: "Pengadaan Kitab Yayasan", tanggal: "2026-07-09 09:12" }
        ];
        updatedDb.transaksi_market = [
          { id_transaksi: "TX-MKT-001", tanggal: "2026-07-10 10:15", id_santri: "SNT-001", nama_santri: "Ahmad Rayhan", total: 13000, profit: 2600, kas_masuk: 13000, metode_pembayaran: "TABUNGAN", items: [{ id_produk: "PRD-001", qty: 2, harga: 6500, unit: "PCS", multiplier: 1, harga_jual: 6500, harga_beli: 5200 }] }
        ];
        await syncDbState(updatedDb);
        showToast("Database pondok market berhasil direset!", "success");
      }
    });
  };

  const handleLogout = () => {
    showConfirm("Bunda yakin ingin keluar dari sesi aplikasi ponpesqu?", (yes) => {
      if (yes) {
        window.location.reload();
      }
    });
  };

  // Re-sync CSS variables on printed receipts/reports automatically
  useEffect(() => {
    const handleBeforePrint = () => {
      if (isReceiptOpen) {
        document.body.classList.add("printing-receipt");
        document.body.classList.remove("printing-report");
      } else {
        document.body.classList.add("printing-report");
        document.body.classList.remove("printing-receipt");
      }
    };
    const handleAfterPrint = () => {
      document.body.classList.remove("printing-receipt", "printing-report");
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [isReceiptOpen]);

  const shopSettings = db.settings || { shop_name: "Koperasi Pesantren Darul Ma'arif", owner_name: "Kiai M. Hasan", address: "", phone: "" };
  const nib_number = (shopSettings as any).nib_number || "NIB-9120101901831";
  const slogan = (shopSettings as any).slogan || "Belanja Berkah, Pondok Kuat, Santri Mandiri!";

  return (
    <div className="flex-grow flex flex-col w-full min-h-screen text-gray-100">
      
      {/* Top Bar Navigation & Brand */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 pb-4 border-b border-emerald-950/50">
        <div className="flex items-center gap-3">
          <img 
            src={db.settings?.logo_url || "https://placehold.co/150x150/022c22/f59e0b?text=🕌"} 
            alt="Logo Pesantren" 
            className="w-10 h-10 rounded-xl object-cover border border-amber-500/20 shadow-lg shadow-emerald-950/50 shrink-0 animate-fade-in" 
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">ponpesqu</h1>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono font-bold">MARKET v1.1</span>
            </div>
            <p className="text-xs text-emerald-500/70 font-semibold">Kantin & Koperasi Cashless Modern</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-400">
            <LucideIcon name="clock" className="w-4 h-4" />
            <span>{timeStr}</span>
          </div>

          <div className="flex gap-2 text-xs">
            <div className="bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span>Kas Toko: <strong className="text-amber-400 font-bold">{formatRupiah(db.kas_market || 0)}</strong></span>
            </div>
            <div className="bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Kas Yayasan: <strong className="text-emerald-400 font-bold">{formatRupiah(db.kas_yayasan || 0)}</strong></span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-900/40 rounded-lg text-xs text-red-400 transition-all flex items-center gap-1 cursor-pointer font-bold"
          >
            <LucideIcon name="log-out" className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Global Barcode Detector Indicator Bar */}
      <div className="glass-card px-4 py-2.5 rounded-xl text-xs font-bold flex justify-between items-center mb-6 shadow-sm border-gold select-none">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-emerald-400">Koneksi Scanner Bluetooth / USB Siap Otomatis (Instan Tanpa Klik)</span>
        </span>
        <span className="text-amber-400 font-semibold font-mono">Menunggu input pindaian...</span>
      </div>

      {/* Main layout grids */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left Column Sidebar */}
        <aside className="lg:col-span-2 flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 shrink-0">
          {[
            { id: "pos", label: "Mesin Kasir", icon: "shopping-cart" },
            { id: "stok", label: "Manajemen Stok", icon: "boxes" },
            { id: "laporan", label: "Kas & Laporan", icon: "bar-chart-3" },
            { id: "pengaturan", label: "Pengaturan", icon: "settings" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMarketTab(tab.id)}
              className={`flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all w-full min-w-[120px] shrink-0 cursor-pointer ${
                marketTab === tab.id
                  ? 'bg-amber-500 text-emerald-950 shadow-md shadow-amber-500/10'
                  : 'text-emerald-500 hover:bg-emerald-950/30'
              }`}
            >
              <LucideIcon name={tab.icon} className="w-5 h-5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Center Main Panel Content */}
        <main className="lg:col-span-10 flex flex-col gap-6">
          {marketTab === 'pos' && (
            <MarketPosTab
              db={db}
              activeUser={activeUser}
              syncDbState={syncDbState}
              showToast={showToast}
              showConfirm={showConfirm}
              onPrintReceipt={handleOpenReceipt}
            />
          )}

          {marketTab === 'stok' && (
            <MarketStokTab
              db={db}
              syncDbState={syncDbState}
              showToast={showToast}
              showConfirm={showConfirm}
            />
          )}

          {marketTab === 'laporan' && (
            <MarketLaporanTab
              db={db}
              syncDbState={syncDbState}
              showToast={showToast}
              onOpenPDFReport={handleOpenPDFReport}
            />
          )}

          {marketTab === 'pengaturan' && (
            <MarketPengaturanTab
              db={db}
              activeUser={activeUser}
              syncDbState={syncDbState}
              showToast={showToast}
              showConfirm={showConfirm}
              onLogout={handleLogout}
              onResetDb={handleResetDatabase}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-card border-t border-emerald-900 px-4 py-2 flex justify-around items-center z-[500] shadow-xl">
        {[
          { id: "pos", label: "Kasir", icon: "shopping-cart" },
          { id: "stok", label: "Stok", icon: "boxes" },
          { id: "laporan", label: "Laporan", icon: "bar-chart-3" },
          { id: "pengaturan", label: "Toko", icon: "settings" }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setMarketTab(item.id)}
            className={`mobile-tab-btn flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
              marketTab === item.id ? 'text-amber-500 font-extrabold' : 'text-emerald-500/70 font-semibold'
            }`}
          >
            <LucideIcon name={item.icon} className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 2. RECEIPT MODAL OVERLAY */}
      {isReceiptOpen && receiptTx && (
        <div className="fixed inset-0 bg-black/90 z-[1500] flex items-center justify-center p-4">
          <div className="bg-amber-50 text-emerald-950 p-5 rounded-2xl shadow-2xl relative font-mono text-xs flex flex-col gap-3 max-w-xs w-full border border-amber-200">
            <div className="receipt-container p-2 bg-white" id="print-receipt-area" style={{ fontFamily: 'monospace', color: 'black' }}>
              <div className="text-center border-b border-dashed border-black pb-2 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-tight">{shopSettings.shop_name}</h2>
                <p className="text-[10px] font-bold mt-0.5">{slogan}</p>
                <p className="text-[9px] text-gray-500">NIB: {nib_number}</p>
                <p className="text-[9px] leading-relaxed">{shopSettings.address || "Bandung, Jawa Barat"}</p>
                <p className="text-[9px]">Telp: {shopSettings.phone}</p>
              </div>

              <div className="text-[10px] space-y-0.5 mb-2 font-semibold">
                <div>No: {receiptTx.id_transaksi}</div>
                <div>Waktu: {receiptTx.tanggal}</div>
                <div>Pembeli: {receiptTx.nama_santri}</div>
              </div>

              <div className="border-t border-dashed border-black pt-2 space-y-1 mb-2">
                {receiptTx.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>{it.nama_produk} ({it.qty} {it.unit || 'pcs'})</span>
                    <span>{formatRupiah((it.harga_jual || 0) * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black pt-2 space-y-0.5 font-bold">
                <div className="flex justify-between text-xs">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(receiptTx.total)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-normal text-gray-700">
                  <span>BAYAR ({receiptTx.metode_pembayaran}):</span>
                  <span>{formatRupiah(receiptCash)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                  <span>KEMBALI:</span>
                  <span>{formatRupiah(receiptChange)}</span>
                </div>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-black mt-3 text-[10px] text-gray-600">
                ~ JAZAKUMULLAH KHAIRAN ~<br />
                ponpesqu Smart Market System
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="w-1/2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold cursor-pointer font-sans"
              >
                Selesai
              </button>
              <button
                onClick={handlePrintReceipt}
                className="w-1/2 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer font-sans"
              >
                <LucideIcon name="printer" className="w-3.5 h-3.5" /> Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. WINDOW-PRINT-READY PDF TEMPLATE HIDDEN BY DEFAULT (Sesuai Patokan HTML) */}
      <div id="print-pdf-report-container" style={{ display: isPdfPrintOpen ? 'block' : 'none' }} className="p-10 bg-white text-black font-sans">
        <div className="text-center mb-6 border-b-4 border-double border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider">{shopSettings.shop_name}</h1>
          <p className="text-xs font-bold my-1">Pengawas Utama: {shopSettings.owner_name}</p>
          <p className="text-xs my-0.5">NIB / Izin Pondok: {nib_number}</p>
          <p className="text-xs my-1">Alamat: {shopSettings.address || "Bandung"} | Telp: {shopSettings.phone}</p>
        </div>
        
        <div className="mb-5 flex justify-between items-end">
          <div>
            <h2 className="text-base font-bold uppercase">Laporan Keuangan & Penjualan Market</h2>
            <p className="text-[10px] text-gray-600">Sistem ponpesqu - Laporan Terintegrasi</p>
          </div>
          <div className="text-right text-[10px]">
            <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
            <div>Status Dokumen: <span className="text-green-600 font-bold">VALID / ASLI</span></div>
          </div>
        </div>

        <table className="w-full border-collapse mb-6 text-xs">
          <thead>
            <tr className="border-y-2 border-black bg-gray-100 font-bold">
              <th className="p-2 text-left">WAKTU</th>
              <th className="p-2 text-left">ID TX</th>
              <th className="p-2 text-left">RINCIAN TRANSAKSI</th>
              <th className="p-2 text-right">OMSET</th>
              <th className="p-2 text-right">LABA BERSIH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {(db.transaksi_market || []).slice().reverse().map((tx, idx) => {
              const details = tx.items.map(it => `${it.nama_produk} (${it.qty} ${it.unit || 'pcs'})`).join(", ");
              const profit = tx.profit !== undefined ? tx.profit : tx.items.reduce((sum, it) => {
                const p = products.find(x => x.id_produk === it.id_produk);
                if (p) return sum + ((p.harga_jual - p.harga_beli) * it.qty);
                return sum;
              }, 0);

              return (
                <tr key={tx.id_transaksi || idx}>
                  <td className="p-2 text-[11px]">{tx.tanggal}</td>
                  <td className="p-2 text-[11px] font-bold">{tx.id_transaksi}</td>
                  <td className="p-2 text-[11px]">{details}</td>
                  <td className="p-2 text-[11px] text-right">{formatRupiah(tx.total)}</td>
                  <td className="p-2 text-[11px] text-right text-emerald-700 font-bold">{formatRupiah(profit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end gap-8 text-xs border-t border-black pt-3 font-bold">
          <div className="text-right leading-relaxed">
            <div>Total Omset Terhitung:</div>
            <div className="text-green-700">Total Laba Bersih Market:</div>
          </div>
          <div className="text-right leading-relaxed font-bold">
            <div>{formatRupiah((db.transaksi_market || []).reduce((sum, tx) => sum + tx.total, 0))}</div>
            <div className="text-green-700">
              {formatRupiah((db.transaksi_market || []).reduce((sum, tx) => {
                if (tx.profit !== undefined) return sum + tx.profit;
                return sum + tx.items.reduce((s, it) => {
                  const p = products.find(x => x.id_produk === it.id_produk);
                  if (p) return s + ((p.harga_jual - p.harga_beli) * it.qty);
                  return s;
                }, 0);
              }, 0))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between text-xs">
          <div className="text-center w-40">
            <p>Kasir Operator</p>
            <div className="h-16"></div>
            <p className="border-t border-black pt-1 font-bold">Ummi Halimah</p>
          </div>
          <div className="text-center w-40">
            <p>Murobbi (Kiai)</p>
            <div className="h-16"></div>
            <p className="border-t border-black pt-1 font-bold">{shopSettings.owner_name}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
