export interface Santri {
  id_santri: string;
  nama_santri: string;
  kelas: string;
  barcode: string;
  saldo_utama: number;
  nama_wali?: string;
  wa_wali?: string;
  limit_jajan?: number;
  limit_belanja?: number;
  foto_profil?: string;
  alamat?: string;
}

export interface Keluhan {
  id_keluhan: string;
  nama_wali: string;
  isi: string;
  status: "BARU" | "SELESAI";
  jawaban: string;
  tanggal?: string;
}

export interface LaporanPerkembangan {
  id_laporan: string;
  tanggal: string;
  pengirim: string;
  tipe: string;
  sasaran: string;
  subjek: string;
  isi: string;
  status: string;
}

export interface AsatidzahKontak {
  id_guru: string;
  nama: string;
  jabatan: string;
  no_wa: string;
  alamat?: string;
  username: string;
  pass: string;
  foto_profil?: string;
}

export interface Kelas {
  id_kelas: string;
  nama_kelas: string;
  wali_kelas: string;
}

export interface SholatRule {
  id_sholat: string;
  nama: string;
  tipe: "WAJIB" | "SUNNAH";
  waktu: string;
  toleransi: number;
}

export interface UserManajemen {
  id_user: string;
  nama: string;
  role: "Admin Yayasan" | "Admin Tabungan" | "Admin Market" | "Pengajar" | "Admin Keamanan" | "Admin Media";
  email: string;
  username: string;
  pass: string;
  wa_number?: string;
}

export interface KasLog {
  tanggal: string;
  tipe: "MASUK" | "KELUAR";
  nominal: number;
  keterangan: string;
}

export interface TransaksiTabungan {
  id_transaksi: string;
  id_santri: string;
  nama_santri: string;
  kelas: string;
  tipe: "DEPOSIT" | "PENARIKAN";
  nominal: number;
  tanggal: string;
  keterangan: string;
}

export interface Tagihan {
  id_tagihan: string;
  id_santri: string;
  nama_santri: string;
  kelas: string;
  nama_tagihan: string;
  nominal: number;
  status_tagihan: "BELUM_BAYAR" | "LUNAS";
  metode_pembayaran: string;
  tanggal_bayar: string;
}

export interface Settings {
  shop_name: string;
  owner_name: string;
  address: string;
  phone: string;
  bank_name: string;
  bank_account: string;
  bank_owner: string;
  logo_url: string;
  nama_pesantren?: string;
  kiai_pass?: string;
}

export interface AbsensiKelas {
  tanggal: string;
  kelas: string;
  id_santri: string;
  status: "HADIR" | "IZIN" | "SAKIT" | "ALFA";
  locked: boolean;
}

export interface AbsensiSholat {
  tanggal: string;
  sholat: string;
  id_santri: string;
  status: "TEPAT_WAKTU" | "MASBUQ" | "TIDAK_HADIR";
  locked: boolean;
}

export interface Perizinan {
  id_izin: string;
  id_santri: string;
  tipe: "SAKIT" | "IZIN";
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string;
  status: "BARU" | "DISETUJUI";
}

export interface ProdukMarket {
  id_produk: string;
  nama_produk: string;
  kategori: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  satuan: string;
  barcode: string;
  foto_url?: string;
  min_stock?: number;
  large_unit?: string;
  multiplier?: number;
}

export interface StokMarket {
  id_log: string;
  id_produk: string;
  tipe: "MASUK" | "KELUAR";
  jumlah: number;
  keterangan: string;
  tanggal: string;
}

export interface TransaksiMarketItem {
  id_produk: string;
  nama_produk?: string;
  qty: number;
  harga?: number;
  unit?: string;
  multiplier?: number;
  harga_jual?: number;
  harga_beli?: number;
}

export interface TransaksiMarket {
  id_transaksi: string;
  tanggal: string;
  id_santri?: string | null;
  nama_santri: string;
  total: number;
  profit?: number;
  kas_masuk: number;
  metode_pembayaran: "TABUNGAN" | "TUNAI" | "MUTASI_KAS";
  items: TransaksiMarketItem[];
}

export interface PelanggaranSantri {
  id_pelanggaran: string;
  id_santri: string;
  nama_santri: string;
  kelas: string;
  kategori: "RINGAN" | "SEDANG" | "BERAT";
  detail_pelanggaran: string;
  hukuman: string;
  tanggal: string;
  dicatat_oleh: string;
}

export interface IzinKeamanan {
  id_izin_khusus: string;
  id_santri: string;
  nama_santri: string;
  kelas: string;
  tipe_izin: "JAJAN" | "BELANJA";
  nominal_disetujui: number;
  is_no_limit?: boolean;
  tanggal: string;
  keterangan: string;
  dicatat_oleh: string;
}

export interface LoginLog {
  id_log: string;
  tanggal: string;
  nama: string;
  role: string;
  ip_address: string;
}

export interface HomepageNewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  category?: string;
}

export interface HomepageProgram {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: string;
  image?: string;
}

export interface HomepagePsbSettings {
  is_open: boolean;
  registration_url: string;
  year_academic?: string;
  quota_total?: number;
  quota_accepted?: number;
  quota_remaining?: number;
  quota_alert_text?: string;
  requirements_umum?: string[];
  requirements_khusus?: string[];
  documents?: string[];
  steps?: { step_num: number; title: string; desc: string }[];
  contact_putra_nama?: string;
  contact_putra_phone?: string;
  contact_putri_nama?: string;
  contact_putri_phone?: string;
  contact_email?: string;
  contact_hours?: string;
}

export interface HomepageCard {
  title: string;
  description: string;
  icon: string;
}

export interface HomepageData {
  pesantren_name: string;
  logo_url?: string;
  hero_title: string;
  hero_subtitle: string;
  hero_btn_text: string;
  hero_image: string;
  cards: HomepageCard[];
  about_title: string;
  about_subtitle: string;
  about_description: string;
  about_stats_1: string;
  about_stats_2: string;
  about_image: string;
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  news?: HomepageNewsItem[];
  programs?: HomepageProgram[];
  psb_settings?: HomepagePsbSettings;
}

export interface K_DB {
  kas_market: number;
  kas_yayasan: number;
  santri: Santri[];
  keluhan: Keluhan[];
  laporan_perkembangan: LaporanPerkembangan[];
  asatidzah_kontak: AsatidzahKontak[];
  kelas_list: Kelas[];
  sholat_rules: SholatRule[];
  users_manajemen: UserManajemen[];
  yayasan_kas_logs: KasLog[];
  market_kas_logs: KasLog[];
  transaksi_tabungan: TransaksiTabungan[];
  tagihan: Tagihan[];
  settings: Settings;
  absensi_kelas?: AbsensiKelas[];
  absensi_sholat?: AbsensiSholat[];
  perizinan?: Perizinan[];
  tutup_absen_kelas?: Record<string, boolean>;
  tutup_absen_sholat?: Record<string, boolean>;
  produk_market?: ProdukMarket[];
  stok_market?: StokMarket[];
  transaksi_market?: TransaksiMarket[];
  pelanggaran_santri?: PelanggaranSantri[];
  izin_keamanan?: IzinKeamanan[];
  login_logs?: LoginLog[];
  homepage?: HomepageData;
}
