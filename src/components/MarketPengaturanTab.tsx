import React, { useState } from 'react';
import { K_DB } from '../types';
import { LucideIcon } from './LucideIcon';

interface MarketPengaturanTabProps {
  db: K_DB;
  activeUser: { nama: string; role: string } | null;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
  onLogout: () => void;
  onResetDb: () => void;
}

export function MarketPengaturanTab({
  db,
  activeUser,
  syncDbState,
  showToast,
  showConfirm,
  onLogout,
  onResetDb
}: MarketPengaturanTabProps) {
  const settings = db.settings || { shop_name: "", owner_name: "", address: "", phone: "" };
  const complaints = db.keluhan || [];

  // --- SETTINGS FORM ---
  const [shopName, setShopName] = useState(settings.shop_name || "");
  const [ownerName, setOwnerName] = useState(settings.owner_name || "");
  const [nibNumber, setNibNumber] = useState((settings as any).nib_number || "NIB-9120101901831");
  const [slogan, setSlogan] = useState((settings as any).slogan || "Belanja Berkah, Pondok Kuat, Santri Mandiri!");
  const [address, setAddress] = useState(settings.address || "");
  const [phone, setPhone] = useState(settings.phone || "");

  // Change Password
  const [newPass, setNewPass] = useState("");

  const handleSaveSettings = async () => {
    const updatedDb = { ...db };
    updatedDb.settings = {
      ...updatedDb.settings,
      shop_name: shopName,
      owner_name: ownerName,
      address,
      phone
    };
    (updatedDb.settings as any).nib_number = nibNumber;
    (updatedDb.settings as any).slogan = slogan;

    await syncDbState(updatedDb);
    showToast("Pengaturan koperasi sukses diperbarui!", "success");
  };

  const handleReplyComplaint = async (index: number) => {
    const klh = complaints[index];
    const balasan = prompt(`Ketik balasan untuk keluhan Wali ${klh.nama_wali}:`);
    if (balasan !== null && balasan.trim() !== "") {
      const updatedDb = { ...db };
      const dbComplaints = [...(updatedDb.keluhan || [])];
      dbComplaints[index] = {
        ...dbComplaints[index],
        status: "SELESAI", // Or "DIJAWAB"
        jawaban: balasan
      };
      updatedDb.keluhan = dbComplaints;
      await syncDbState(updatedDb);
      showToast("Keluhan berhasil dibalas & diselesaikan!", "success");
    }
  };

  const handleDismissComplaint = (index: number) => {
    showConfirm("Tandai keluhan ini sebagai selesai diproses?", async (yes) => {
      if (yes) {
        const updatedDb = { ...db };
        const dbComplaints = [...(updatedDb.keluhan || [])];
        dbComplaints.splice(index, 1);
        updatedDb.keluhan = dbComplaints;
        await syncDbState(updatedDb);
        showToast("Keluhan diselesaikan", "info");
      }
    });
  };

  const handleSavePassword = async () => {
    if (!newPass.trim()) {
      showToast("Sandi baru tidak boleh kosong!", "error");
      return;
    }
    const updatedDb = { ...db };
    const dbUsers = [...(updatedDb.users_manajemen || [])];
    const activeIdx = dbUsers.findIndex(u => u.username === "halimah");
    if (activeIdx > -1) {
      dbUsers[activeIdx].pass = newPass;
      updatedDb.users_manajemen = dbUsers;
      await syncDbState(updatedDb);
      showToast("Sandi berhasil diperbarui!", "success");
      setNewPass("");
    } else {
      showToast("Pengguna tidak ditemukan di manajemen user!", "error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full text-xs text-gray-200">
      {/* Left Column: Store Settings */}
      <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
        <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
          <LucideIcon name="settings" className="w-5 h-5" /> Pengaturan Aplikasi (Otoritas Kiai / Yayasan)
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-emerald-500/80 mb-1 font-semibold">Nama Pondok Pesantren / Koperasi</label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-emerald-500/80 mb-1 font-semibold">Nama Pemilik / Pengasuh (Kiai)</label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-emerald-500/80 mb-1 font-semibold">NIB (Nomor Induk Berusaha) / Izin Pondok</label>
            <input
              type="text"
              value={nibNumber}
              onChange={(e) => setNibNumber(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-emerald-500/80 mb-1 font-semibold">Slogan Koperasi (Tampil di Struk)</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-emerald-500/80 mb-1 font-semibold">Alamat Lengkap Pesantren</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-emerald-500/80 mb-1 font-semibold">Nomor WhatsApp Yayasan</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-xs transition-colors shadow-md shadow-amber-500/10 mt-4 cursor-pointer"
          >
            Simpan Semua Pengaturan
          </button>
        </div>
      </div>

      {/* Right Column: Security & Credentials */}
      <div className="glass-card p-5 rounded-2xl flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-3 flex items-center gap-2">
            <LucideIcon name="shield-check" className="w-5 h-5" /> Keamanan Kredensial
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-emerald-500/80 mb-1 font-semibold">Sesi Pengguna Aktif</label>
              <p className="font-bold text-gray-300">
                {activeUser ? activeUser.nama : "Admin Market"} ({activeUser ? activeUser.role : "Super Admin"})
              </p>
            </div>
            <div>
              <label className="block text-emerald-500/80 mb-1 font-semibold">Ganti Sandi Baru</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Sandi baru..."
                  className="w-full bg-emerald-950/60 border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleSavePassword}
                  className="px-3 bg-amber-500 text-emerald-950 hover:bg-amber-600 rounded-xl font-bold transition-colors cursor-pointer shrink-0 text-xs"
                >
                  Simpan Sandi
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={onResetDb}
                className="w-full py-2 bg-emerald-950 hover:bg-[#1d0505] text-red-400 border border-red-950 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                🔄 Reset Database Ke Awal
              </button>
              <button
                onClick={onLogout}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                🚪 Logout Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
