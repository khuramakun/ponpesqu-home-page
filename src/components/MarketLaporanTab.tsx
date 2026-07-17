import React, { useState } from 'react';
import { K_DB, TransaksiMarket } from '../types';
import { LucideIcon } from './LucideIcon';

interface MarketLaporanTabProps {
  db: K_DB;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenPDFReport: () => void;
}

export function MarketLaporanTab({
  db,
  syncDbState,
  showToast,
  onOpenPDFReport
}: MarketLaporanTabProps) {
  const transactions = db.transaksi_market || [];
  const products = db.produk_market || [];

  // --- FILTERS STATE ---
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'ALL' | 'TABUNGAN' | 'TUNAI' | 'MUTASI_KAS'>('ALL');

  const filteredTransactions = transactions.filter(tx => {
    const txDate = tx.tanggal.slice(0, 10);
    const matchesStart = filterStartDate ? txDate >= filterStartDate : true;
    const matchesEnd = filterEndDate ? txDate <= filterEndDate : true;
    const matchesMethod = filterPaymentMethod === 'ALL' || tx.metode_pembayaran === filterPaymentMethod;
    return matchesStart && matchesEnd && matchesMethod;
  });

  // --- STATS CALCULATIONS ---
  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + (tx.total || 0), 0);
  const totalProfit = filteredTransactions.reduce((sum, tx) => {
    if (tx.profit !== undefined) return sum + tx.profit;
    // fallback calculate
    const txProfit = tx.items.reduce((pSum, item) => {
      const p = products.find(x => x.id_produk === item.id_produk);
      if (p) return pSum + ((p.harga_jual - p.harga_beli) * item.qty);
      return pSum;
    }, 0);
    return sum + txProfit;
  }, 0);
  const totalTransactionsCount = filteredTransactions.length;
  const totalItemsSold = filteredTransactions.reduce((sum, tx) => {
    return sum + tx.items.reduce((iSum, item) => iSum + item.qty, 0);
  }, 0);

  // --- FUND TRANSFERS STATE ---
  const [direction, setDirection] = useState<"MARKET_TO_YAYASAN" | "YAYASAN_TO_MARKET">("MARKET_TO_YAYASAN");
  const [transferAmount, setTransferAmount] = useState<number | "">("");
  const [transferNote, setTransferNote] = useState("");

  const formatRupiah = (num: number) => {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
  };

  const handlePrintPDFLocal = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const shopSettings = db.settings || { shop_name: "Koperasi Pesantren Darul Ma'arif", owner_name: "Kiai M. Hasan", address: "", phone: "" };
    const nib_number = (shopSettings as any).nib_number || "NIB-9120101901831";
    const slogan = (shopSettings as any).slogan || "Belanja Berkah, Pondok Kuat, Santri Mandiri!";

    let tableRows = '';
    [...filteredTransactions].reverse().forEach((tx, index) => {
      const details = tx.items.map(it => `${it.nama_produk} (${it.qty} ${it.unit || 'pcs'})`).join(", ");
      const profit = tx.profit !== undefined ? tx.profit : tx.items.reduce((sum, it) => {
        const p = products.find(x => x.id_produk === it.id_produk);
        if (p) return sum + ((p.harga_jual - p.harga_beli) * it.qty);
        return sum;
      }, 0);

      tableRows += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${tx.tanggal}</td>
          <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">${tx.id_transaksi}</td>
          <td style="border: 1px solid #ddd; padding: 8px;"><strong>${tx.nama_santri}</strong><br><small style="color: #666;">${details}</small></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;"><span style="font-weight: bold; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${tx.metode_pembayaran}</span></td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${formatRupiah(tx.total)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; color: #15803d;">${formatRupiah(profit)}</td>
        </tr>
      `;
    });

    const sumTotal = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
    const sumProfit = filteredTransactions.reduce((sum, tx) => {
      if (tx.profit !== undefined) return sum + tx.profit;
      return sum + tx.items.reduce((s, it) => {
        const p = products.find(x => x.id_produk === it.id_produk);
        if (p) return s + ((p.harga_jual - p.harga_beli) * it.qty);
        return s;
      }, 0);
    }, 0);

    const dateFilterDesc = (filterStartDate || filterEndDate) ? 
      `Periode: ${filterStartDate || 'Awal'} s/d ${filterEndDate || 'Akhir'}` : 
      'Periode: Semua Tanggal';
    const methodFilterDesc = filterPaymentMethod !== 'ALL' ? `Metode: ${filterPaymentMethod}` : 'Metode: Semua';

    printWindow.document.write(`
      <html>
        <head>
          <title>LAPORAN MUTASI & PENJUALAN MARKET</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 4px double #000; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .header p { margin: 4px 0; font-size: 12px; }
            .meta-section { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { border: 1px solid #000; padding: 10px; background-color: #f3f4f6; font-weight: bold; text-align: left; }
            .total-box { display: flex; justify-content: flex-end; gap: 40px; font-size: 12px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; }
            .sig-box { text-align: center; width: 180px; }
            .sig-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shopSettings.shop_name}</h1>
            <p><strong>Pengawas Utama: ${shopSettings.owner_name}</strong></p>
            <p>NIB / Izin Pondok: ${nib_number} | Slogan: ${slogan}</p>
            <p>Alamat: ${shopSettings.address || "Bandung, Jawa Barat"} | Telp: ${shopSettings.phone}</p>
          </div>

          <div class="meta-section">
            <div>
              <h2 style="margin: 0; font-size: 14px; text-transform: uppercase;">Laporan Keuangan & Penjualan Market</h2>
              <p style="margin: 3px 0 0 0; color: #666; font-weight: bold;">${dateFilterDesc} | ${methodFilterDesc}</p>
            </div>
            <div style="text-align: right;">
              <div>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
              <div style="color: #15803d; font-weight: bold; margin-top: 3px;">DOKUMEN VALID / ASLI</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>ID TX</th>
                <th>RINCIAN TRANSAKSI</th>
                <th style="text-align: center;">METODE</th>
                <th style="text-align: right;">OMSET</th>
                <th style="text-align: right;">LABA BERSIH</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #888;">Tidak ada data transaksi yang sesuai filter.</td></tr>'}
            </tbody>
          </table>

          <div class="total-box">
            <div style="text-align: right; line-height: 1.5;">
              <div>Total Omset Terhitung:</div>
              <div style="color: #15803d;">Total Laba Bersih Market:</div>
            </div>
            <div style="text-align: right; line-height: 1.5;">
              <div>${formatRupiah(sumTotal)}</div>
              <div style="color: #15803d;">${formatRupiah(sumProfit)}</div>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <p>Kasir Operator</p>
              <div class="sig-line">Ummi Halimah</div>
            </div>
            <div class="sig-box">
              <p>Murobbi (Kiai)</p>
              <div class="sig-line">${shopSettings.owner_name}</div>
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleKasTransfer = async () => {
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) {
      showToast("Masukkan nominal transfer dana yang valid!", "error");
      return;
    }

    const updatedDb = { ...db };
    const marketCash = updatedDb.kas_market || 0;
    const yayasanCash = updatedDb.kas_yayasan || 0;

    if (direction === 'MARKET_TO_YAYASAN') {
      if (marketCash < amount) {
        showToast(`Kas Market tidak cukup untuk melakukan transfer!`, "error");
        return;
      }
      updatedDb.kas_market = marketCash - amount;
      updatedDb.kas_yayasan = yayasanCash + amount;
      showToast(`Mutasi sukses! ${formatRupiah(amount)} dipindahkan ke KAS YAYASAN.`, "success");
    } else {
      if (yayasanCash < amount) {
        showToast(`Kas Yayasan tidak cukup untuk melakukan subsidi modal ke Market!`, "error");
        return;
      }
      updatedDb.kas_yayasan = yayasanCash - amount;
      updatedDb.kas_market = marketCash + amount;
      showToast(`Subsidi sukses! ${formatRupiah(amount)} dipindahkan ke KAS MARKET.`, "success");
    }

    // Register a ledger entry of type MUTASI_KAS
    const dbTransactions = [...(updatedDb.transaksi_market || [])];
    const newTxId = `TX-TRF-${Date.now().toString().slice(-4)}`;
    dbTransactions.push({
      id_transaksi: newTxId,
      tanggal: new Date().toISOString().replace('T', ' ').substring(0, 16),
      nama_santri: direction === 'MARKET_TO_YAYASAN' ? "Setor ke Yayasan" : "Terima dari Yayasan",
      total: amount,
      profit: 0,
      kas_masuk: direction === 'YAYASAN_TO_MARKET' ? amount : -amount,
      metode_pembayaran: "MUTASI_KAS",
      items: [{
        id_produk: "MUTASI",
        nama_produk: transferNote || "Pemindahan Saldo Kas Antar Unit",
        qty: 1,
        harga_jual: amount,
        harga_beli: amount,
        unit: "MUTASI",
        multiplier: 1
      }]
    });

    // Also register inside yayasan_kas_logs and market_kas_logs for absolute financial reports integration!
    const dbYayasanLogs = [...(updatedDb.yayasan_kas_logs || [])];
    const dbMarketLogs = [...(updatedDb.market_kas_logs || [])];

    if (direction === 'MARKET_TO_YAYASAN') {
      dbYayasanLogs.push({
        tanggal: new Date().toISOString().split('T')[0],
        tipe: "MASUK",
        nominal: amount,
        keterangan: `Terima setoran dari Unit Koperasi: ${transferNote || "Setoran Profit"}`
      });
      dbMarketLogs.push({
        tanggal: new Date().toISOString().split('T')[0],
        tipe: "KELUAR",
        nominal: amount,
        keterangan: `Setor profit market ke Yayasan: ${transferNote || "Penyetoran"}`
      });
    } else {
      dbYayasanLogs.push({
        tanggal: new Date().toISOString().split('T')[0],
        tipe: "KELUAR",
        nominal: amount,
        keterangan: `Subsidi kas ke Unit Koperasi: ${transferNote || "Subsidi Modal"}`
      });
      dbMarketLogs.push({
        tanggal: new Date().toISOString().split('T')[0],
        tipe: "MASUK",
        nominal: amount,
        keterangan: `Terima subsidi modal dari Yayasan: ${transferNote || "Subsidi"}`
      });
    }

    updatedDb.transaksi_market = dbTransactions;
    updatedDb.yayasan_kas_logs = dbYayasanLogs;
    updatedDb.market_kas_logs = dbMarketLogs;

    await syncDbState(updatedDb);

    setTransferAmount("");
    setTransferNote("");
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Waktu,ID Transaksi,Metode,Total Belanja,Debit,Kredit,Keterangan\n";
    filteredTransactions.forEach(tx => {
      const isDebit = tx.kas_masuk > 0;
      const desc = tx.items[0]?.nama_produk || tx.nama_santri;
      csvContent += `"${tx.tanggal}","${tx.id_transaksi}","${tx.metode_pembayaran}","${tx.total}","${isDebit ? Math.abs(tx.kas_masuk) : ''}","${!isDebit ? Math.abs(tx.kas_masuk) : ''}","${desc}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_Market_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Laporan disimpan ke CSV!", "success");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider block font-bold">Omset Total</span>
          <span className="text-lg font-extrabold text-amber-400 block mt-1">{formatRupiah(totalRevenue)}</span>
          <span className="text-[10px] text-emerald-500/40">Seluruh Penjualan</span>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider block font-bold">Laba Kotor</span>
          <span className="text-lg font-extrabold text-emerald-400 block mt-1">{formatRupiah(totalProfit)}</span>
          <span className="text-[10px] text-emerald-500/40">Penjualan - Harga Beli</span>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider block font-bold">Transaksi</span>
          <span className="text-lg font-extrabold text-gray-200 block mt-1">{totalTransactionsCount} Tx</span>
          <span className="text-[10px] text-emerald-500/40">Struk Tercetak</span>
        </div>
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-[10px] text-emerald-500/70 uppercase tracking-wider block font-bold">Terjual (Qty)</span>
          <span className="text-lg font-extrabold text-amber-500 block mt-1">{totalItemsSold} pcs</span>
          <span className="text-[10px] text-emerald-500/40">Total Item Produk</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        {/* Left: Fund Transfer */}
        <div className="lg:col-span-5 glass-card p-5 rounded-2xl flex flex-col gap-4 self-start">
          <div>
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <LucideIcon name="arrow-left-right" className="w-4 h-4" /> Transfer Saldo Antar Kas
            </h3>
            <p className="text-[11px] text-emerald-500/70">Pemindahan dana kas operasional antara Yayasan & Unit Koperasi</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-emerald-950/30 p-3 rounded-xl border border-emerald-950/50">
            <div className="text-center">
              <span className="text-[10px] text-emerald-500/60 block font-bold">Kas Market</span>
              <span className="text-sm font-bold text-amber-400">{formatRupiah(db.kas_market || 0)}</span>
            </div>
            <div className="text-center border-l border-emerald-950/50">
              <span className="text-[10px] text-emerald-500/60 block font-bold">Kas Yayasan</span>
              <span className="text-sm font-bold text-emerald-400">{formatRupiah(db.kas_yayasan || 0)}</span>
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-200">
            <div>
              <label className="block text-[11px] text-emerald-500/80 mb-1">Arah Pengiriman Dana</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs text-emerald-400 focus:outline-none"
              >
                <option value="MARKET_TO_YAYASAN">Dari KAS MARKET ➜ KAS YAYASAN</option>
                <option value="YAYASAN_TO_MARKET">Dari KAS YAYASAN ➜ KAS MARKET</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-emerald-500/80 mb-1">Nominal Transfer (Rp)</label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value === "" ? "" : Number(e.target.value))}
                min="1000"
                placeholder="Rp..."
                className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-emerald-500/80 mb-1">Keterangan Mutasi</label>
              <input
                type="text"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                placeholder="Contoh: Setoran Profit Bulanan / Subsidi Modal"
                className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <button
              onClick={handleKasTransfer}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LucideIcon name="send" className="w-4 h-4" />
              <span>Kirim / Mutasi Saldo</span>
            </button>
          </div>
        </div>

        {/* Right: Ledger Mutasi */}
        <div className="lg:col-span-7 glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-gray-100">Mutasi Ledger Kas & Penjualan Market</h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintPDFLocal}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LucideIcon name="printer" className="w-3.5 h-3.5" /> PDF Laporan
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1 bg-emerald-900/50 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LucideIcon name="download" className="w-3.5 h-3.5" /> CSV (Excel)
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20 mb-4 text-xs">
              <div>
                <label className="block text-[9px] text-emerald-500/60 font-semibold mb-1 uppercase">Dari Tanggal</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full bg-emerald-950/60 border border-emerald-900/60 text-[11px] px-2 py-1 rounded-lg text-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] text-emerald-500/60 font-semibold mb-1 uppercase">Sampai Tanggal</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-emerald-950/60 border border-emerald-900/60 text-[11px] px-2 py-1 rounded-lg text-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] text-emerald-500/60 font-semibold mb-1 uppercase">Metode</label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value as any)}
                  className="w-full bg-emerald-950/60 border border-emerald-900/60 text-[11px] px-2 py-1 rounded-lg text-amber-400 focus:outline-none"
                >
                  <option value="ALL">Semua Metode</option>
                  <option value="TABUNGAN">Tabungan</option>
                  <option value="TUNAI">Cash/Tunai</option>
                  <option value="MUTASI_KAS">Mutasi Kas</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs text-gray-200">
                <thead>
                  <tr className="border-b border-emerald-950 text-emerald-500/70 uppercase text-[9px] tracking-wider font-extrabold">
                    <th className="py-2.5 px-3">Tanggal / Waktu</th>
                    <th className="py-2.5 px-3">Deskripsi / Trx</th>
                    <th className="py-2.5 px-3 text-center">Metode</th>
                    <th className="py-2.5 px-3 text-right">Debit (Masuk)</th>
                    <th className="py-2.5 px-3 text-right">Kredit (Keluar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/10">
                  {[...filteredTransactions].reverse().map((tx, idx) => {
                    const isDebit = tx.kas_masuk > 0;
                    return (
                      <tr key={tx.id_transaksi || idx} className="hover:bg-emerald-950/20 border-b border-emerald-950/10 transition-colors">
                        <td className="py-2.5 px-3 text-emerald-500/80 font-mono text-[10px]">{tx.tanggal}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold block text-gray-100">{tx.id_transaksi}</span>
                          <span className="text-[10px] text-emerald-500/60 block truncate">
                            {tx.items[0]?.nama_produk || tx.nama_santri}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 border border-emerald-900 text-amber-500 font-extrabold">
                            {tx.metode_pembayaran}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">{isDebit ? formatRupiah(Math.abs(tx.kas_masuk)) : '-'}</td>
                        <td className="py-2.5 px-3 text-right text-red-400 font-bold">{!isDebit ? formatRupiah(Math.abs(tx.kas_masuk)) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
