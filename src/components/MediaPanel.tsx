import React, { useState } from 'react';
import { K_DB, HomepageData, HomepageCard, HomepageNewsItem, HomepageProgram, HomepagePsbSettings } from '../types';
import { LucideIcon } from './LucideIcon';

interface MediaPanelProps {
  db: K_DB;
  syncDbState: (updated: K_DB) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showConfirm: (msg: string, callback: (yes: boolean) => void) => void;
}

export function MediaPanel({ db, syncDbState, showToast, showConfirm }: MediaPanelProps) {
  const defaultHomepage: HomepageData = {
    pesantren_name: "Pesantren Database",
    logo_url: "https://placehold.co/150x150/022c22/f59e0b?text=🕌",
    hero_title: "Database Pondok Pesantren Terpercaya",
    hero_subtitle: "Kelola data santri dengan mudah, cepat, dan akurat.",
    hero_btn_text: "Cari Data Santri",
    hero_image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=1200&auto=format&fit=crop",
    cards: [
      { title: "Pencarian Santri", description: "Cari data santri dengan cepat dan aktual.", icon: "search" },
      { title: "Profil Pesantren", description: "Informasi lengkap tentang pondok pesantren.", icon: "landmark" },
      { title: "Aman & Terpercaya", description: "Sistem yang aman dan terproteksi.", icon: "shield" }
    ],
    about_title: "Tentang Pesantren Kami",
    about_subtitle: "Membangun Generasi Islami yang Berakhlak Mulia",
    about_description: "Pesantren Al-Hikmah. Pondok pesantren kami berkomitmen untuk mendidik santri menjadi generasi yang beriman, berilmu, dan berakhlak mulia.",
    about_stats_1: "500+ Santri Aktif",
    about_stats_2: "25+ Tahun Berdiri",
    about_image: "https://images.unsplash.com/photo-1590076241141-919f43273772?q=80&w=800&auto=format&fit=crop",
    contact_address: "Bandung, Jawa Barat",
    contact_phone: "6281234567890",
    contact_email: "info@ponpesqu.com",
    programs: [
      {
        id: "prog-001",
        title: "Tahfidz Al-Qur'an",
        description: "Program Tahfidz Al-Qur'an merupakan program unggulan Pondok Pesantren Al-Hidayah yang dirancang khusus untuk mencetak para penghafal Al-Qur'an.",
        icon: "book-open"
      },
      {
        id: "prog-002",
        title: "Kitab Kuning",
        description: "Program Kajian Kitab Kuning merupakan program inti di Pondok Pesantren Al-Hidayah yang dirancang untuk membekali para santri dengan pemahaman agama klasik.",
        icon: "book"
      },
      {
        id: "prog-003",
        title: "Khitobah",
        description: "Program Khitobah merupakan kegiatan rutin di Pondok Pesantren Al-Hidayah yang bertujuan melatih kemampuan public speaking santri.",
        icon: "mic"
      }
    ],
    psb_settings: {
      is_open: true,
      registration_url: "https://forms.gle/psb-online-alhidayah",
      year_academic: "2026/2027",
      quota_total: 191,
      quota_accepted: 186,
      quota_remaining: 5,
      quota_alert_text: "Peringatan! Kuota pendaftaran tersisa sedikit (5 kursi). Segera daftar sebelum kehabisan!",
      requirements_umum: [
        "Lulusan MTs/SMP atau sederajat",
        "Usia maksimal 18 tahun per 1 Juli 2026",
        "Sehat jasmani dan rohani",
        "Bersedia tinggal di asrama (mukim)",
        "Mendapat izin dari orang tua/wali",
        "Berkelakuan baik"
      ],
      requirements_khusus: [
        "Mampu membaca Al-Qur'an dengan baik (akan diuji saat seleksi)",
        "Hafalan minimal Juz 30 (bagian program Tahfidz)"
      ],
      documents: [
        "Fotokopi Kartu Keluarga (KK)",
        "Pas foto berwarna 3x4 (background merah)"
      ],
      steps: [
        { step_num: 1, title: "Registrasi Akun", desc: "Calon santri membuat akun di sistem pendaftaran online dengan mengisi data diri dan email aktif." },
        { step_num: 2, title: "Isi Formulir Pendaftaran", desc: "Calon santri mengisi formulir pendaftaran lengkap dengan data pribadi, orang tua, dan program pilihan." },
        { step_num: 3, title: "Upload Berkas", desc: "Upload foto berwarna dan Kartu Keluarga (KK) dalam format yang ditentukan." },
        { step_num: 4, title: "Verifikasi Admin", desc: "Admin akan memverifikasi kelengkapan dan keabsahan data." }
      ],
      contact_putra_nama: "Ust. H. Faisal",
      contact_putra_phone: "+62 857-3743-5155",
      contact_putri_nama: "Ust. Iwan Hidayat",
      contact_putri_phone: "+62 812-3540-7745",
      contact_email: "ma'had.alhidayah.jembrana@gmail.com",
      contact_hours: "Senin - Jumat: 08.00 - 15.00 WITA\nSabtu: 08.00 - 12.00 WITA"
    }
  };

  const hpData = db.homepage || defaultHomepage;

  // Form states initialized with existing database value or defaults
  const [heroTitle, setHeroTitle] = useState(hpData.hero_title);
  const [heroSubtitle, setHeroSubtitle] = useState(hpData.hero_subtitle);
  const [heroBtnText, setHeroBtnText] = useState(hpData.hero_btn_text);
  const [heroImage, setHeroImage] = useState(hpData.hero_image);

  // Cards
  const [card1, setCard1] = useState<HomepageCard>(hpData.cards?.[0] || defaultHomepage.cards[0]);
  const [card2, setCard2] = useState<HomepageCard>(hpData.cards?.[1] || defaultHomepage.cards[1]);
  const [card3, setCard3] = useState<HomepageCard>(hpData.cards?.[2] || defaultHomepage.cards[2]);

  // About & Stats
  const [aboutTitle, setAboutTitle] = useState(hpData.about_title);
  const [aboutSubtitle, setAboutSubtitle] = useState(hpData.about_subtitle);
  const [aboutDescription, setAboutDescription] = useState(hpData.about_description);
  const [aboutStats1, setAboutStats1] = useState(hpData.about_stats_1);
  const [aboutStats2, setAboutStats2] = useState(hpData.about_stats_2);
  const [aboutImage, setAboutImage] = useState(hpData.about_image);

  // Contacts
  const [contactAddress, setContactAddress] = useState(hpData.contact_address);
  const [contactPhone, setContactPhone] = useState(hpData.contact_phone);
  const [contactEmail, setContactEmail] = useState(hpData.contact_email);

  // News items state
  const [newsList, setNewsList] = useState<HomepageNewsItem[]>(hpData.news || []);

  // News form states
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<HomepageNewsItem | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsCategory, setNewsCategory] = useState("PENGUMUMAN");
  const [newsImage, setNewsImage] = useState("");
  const [newsDate, setNewsDate] = useState("");

  // UI Active Section Tab
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'cards' | 'about' | 'contact' | 'news' | 'program' | 'psb'>('hero');

  // Programs State
  const [programsList, setProgramsList] = useState<HomepageProgram[]>(hpData.programs || defaultHomepage.programs || []);
  const [isProgModalOpen, setIsProgModalOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<HomepageProgram | null>(null);
  const [progTitle, setProgTitle] = useState("");
  const [progDescription, setProgDescription] = useState("");
  const [progIcon, setProgIcon] = useState("book-open");

  // PSB settings State
  const [psbIsOpen, setPsbIsOpen] = useState<boolean>(hpData.psb_settings?.is_open ?? true);
  const [psbRegistrationUrl, setPsbRegistrationUrl] = useState<string>(hpData.psb_settings?.registration_url || "");
  const [psbYearAcademic, setPsbYearAcademic] = useState<string>(hpData.psb_settings?.year_academic || "2026/2027");
  const [psbQuotaTotal, setPsbQuotaTotal] = useState<number>(hpData.psb_settings?.quota_total ?? 191);
  const [psbQuotaAccepted, setPsbQuotaAccepted] = useState<number>(hpData.psb_settings?.quota_accepted ?? 186);
  const [psbQuotaRemaining, setPsbQuotaRemaining] = useState<number>(hpData.psb_settings?.quota_remaining ?? 5);
  const [psbQuotaAlertText, setPsbQuotaAlertText] = useState<string>(hpData.psb_settings?.quota_alert_text || "");
  const [psbRequirementsUmum, setPsbRequirementsUmum] = useState<string>((hpData.psb_settings?.requirements_umum || defaultHomepage.psb_settings?.requirements_umum || []).join("\n"));
  const [psbRequirementsKhusus, setPsbRequirementsKhusus] = useState<string>((hpData.psb_settings?.requirements_khusus || defaultHomepage.psb_settings?.requirements_khusus || []).join("\n"));
  const [psbDocuments, setPsbDocuments] = useState<string>((hpData.psb_settings?.documents || defaultHomepage.psb_settings?.documents || []).join("\n"));
  const [psbContactPutraNama, setPsbContactPutraNama] = useState<string>(hpData.psb_settings?.contact_putra_nama || "Ust. H. Faisal");
  const [psbContactPutraPhone, setPsbContactPutraPhone] = useState<string>(hpData.psb_settings?.contact_putra_phone || "+62 857-3743-5155");
  const [psbContactPutriNama, setPsbContactPutriNama] = useState<string>(hpData.psb_settings?.contact_putri_nama || "Ust. Iwan Hidayat");
  const [psbContactPutriPhone, setPsbContactPutriPhone] = useState<string>(hpData.psb_settings?.contact_putri_phone || "+62 812-3540-7745");
  const [psbContactEmail, setPsbContactEmail] = useState<string>(hpData.psb_settings?.contact_email || "ma'had.alhidayah.jembrana@gmail.com");
  const [psbContactHours, setPsbContactHours] = useState<string>(hpData.psb_settings?.contact_hours || "Senin - Jumat: 08.00 - 15.00 WITA\nSabtu: 08.00 - 12.00 WITA");
  const [psbSteps, setPsbSteps] = useState<{ step_num: number; title: string; desc: string }[]>(
    hpData.psb_settings?.steps || defaultHomepage.psb_settings?.steps || []
  );

  // Image Upload helper
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Ukuran gambar terlalu besar! Maksimum 2MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
        showToast("✓ Gambar berhasil dimuat!", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveNewsListToDb = async (updatedNews: HomepageNewsItem[]) => {
    const updatedHomepage: HomepageData = {
      pesantren_name: db.settings.nama_pesantren || db.settings.shop_name || hpData.pesantren_name,
      logo_url: db.settings.logo_url || hpData.logo_url || "",
      hero_title: heroTitle.trim() || defaultHomepage.hero_title,
      hero_subtitle: heroSubtitle.trim() || defaultHomepage.hero_subtitle,
      hero_btn_text: heroBtnText.trim() || defaultHomepage.hero_btn_text,
      hero_image: heroImage || defaultHomepage.hero_image,
      cards: [
        { title: card1.title.trim() || "Pencarian Santri", description: card1.description.trim() || "", icon: card1.icon },
        { title: card2.title.trim() || "Profil Pesantren", description: card2.description.trim() || "", icon: card2.icon },
        { title: card3.title.trim() || "Aman & Terpercaya", description: card3.description.trim() || "", icon: card3.icon }
      ],
      about_title: aboutTitle.trim() || defaultHomepage.about_title,
      about_subtitle: aboutSubtitle.trim() || defaultHomepage.about_subtitle,
      about_description: aboutDescription.trim() || defaultHomepage.about_description,
      about_stats_1: aboutStats1.trim() || defaultHomepage.about_stats_1,
      about_stats_2: aboutStats2.trim() || defaultHomepage.about_stats_2,
      about_image: aboutImage || defaultHomepage.about_image,
      contact_address: contactAddress.trim() || defaultHomepage.contact_address,
      contact_phone: contactPhone.trim() || defaultHomepage.contact_phone,
      contact_email: contactEmail.trim() || defaultHomepage.contact_email,
      news: updatedNews,
      programs: programsList,
      psb_settings: {
        is_open: psbIsOpen,
        registration_url: psbRegistrationUrl,
        year_academic: psbYearAcademic,
        quota_total: Number(psbQuotaTotal) || 0,
        quota_accepted: Number(psbQuotaAccepted) || 0,
        quota_remaining: Number(psbQuotaRemaining) || 0,
        quota_alert_text: psbQuotaAlertText,
        requirements_umum: psbRequirementsUmum.split('\n').map(line => line.trim()).filter(Boolean),
        requirements_khusus: psbRequirementsKhusus.split('\n').map(line => line.trim()).filter(Boolean),
        documents: psbDocuments.split('\n').map(line => line.trim()).filter(Boolean),
        steps: psbSteps,
        contact_putra_nama: psbContactPutraNama,
        contact_putra_phone: psbContactPutraPhone,
        contact_putri_nama: psbContactPutriNama,
        contact_putri_phone: psbContactPutriPhone,
        contact_email: psbContactEmail,
        contact_hours: psbContactHours
      }
    };

    const updatedDb: K_DB = {
      ...db,
      homepage: updatedHomepage
    };

    try {
      await syncDbState(updatedDb);
      showToast("✓ Perubahan berita berhasil disimpan ke server!", "success");
    } catch (err) {
      showToast("Gagal menyimpan berita ke server!", "error");
    }
  };

  const openAddNewsModal = () => {
    setEditingNews(null);
    setNewsTitle("");
    setNewsContent("");
    setNewsCategory("PENGUMUMAN");
    setNewsImage("");
    setNewsDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    setIsNewsModalOpen(true);
  };

  const openEditNewsModal = (item: HomepageNewsItem) => {
    setEditingNews(item);
    setNewsTitle(item.title);
    setNewsContent(item.content);
    setNewsCategory(item.category || "PENGUMUMAN");
    setNewsImage(item.image || "");
    setNewsDate(item.date || "");
    setIsNewsModalOpen(true);
  };

  const handleSubmitNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) {
      showToast("Judul dan isi berita wajib diisi!", "error");
      return;
    }

    let updatedList = [...newsList];
    if (editingNews) {
      updatedList = updatedList.map(n => n.id === editingNews.id ? {
        ...n,
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
        image: newsImage,
        date: newsDate
      } : n);
    } else {
      const newNews: HomepageNewsItem = {
        id: "news-" + Date.now().toString(),
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
        image: newsImage,
        date: newsDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      };
      updatedList = [...updatedList, newNews];
    }

    setNewsList(updatedList);
    setIsNewsModalOpen(false);
    saveNewsListToDb(updatedList);
  };

  const handleDeleteNews = (id: string) => {
    showConfirm("Apakah Anda yakin ingin menghapus berita ini?", (yes) => {
      if (!yes) return;
      const updatedList = newsList.filter(n => n.id !== id);
      setNewsList(updatedList);
      saveNewsListToDb(updatedList);
    });
  };

  const handleSubmitProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim() || !progDescription.trim()) {
      showToast("Judul dan deskripsi program wajib diisi!", "error");
      return;
    }

    let updatedList = [...programsList];
    if (editingProg) {
      updatedList = updatedList.map(p => p.id === editingProg.id ? {
        ...p,
        title: progTitle.trim(),
        description: progDescription.trim(),
        icon: progIcon
      } : p);
    } else {
      const newProg: HomepageProgram = {
        id: "prog-" + Date.now().toString(),
        title: progTitle.trim(),
        description: progDescription.trim(),
        icon: progIcon
      };
      updatedList = [...updatedList, newProg];
    }

    setProgramsList(updatedList);
    setIsProgModalOpen(false);
    showToast("✓ Program diperbarui di daftar sementara! Silakan klik 'Simpan Perubahan' di atas jika sudah selesai.", "info");
  };

  const handleSave = async () => {
    showConfirm("Simpan semua perubahan tampilan homepage ke server?", async (yes) => {
      if (!yes) return;

      const updatedHomepage: HomepageData = {
        pesantren_name: db.settings.nama_pesantren || db.settings.shop_name || hpData.pesantren_name,
        logo_url: db.settings.logo_url || hpData.logo_url || "",
        hero_title: heroTitle.trim() || defaultHomepage.hero_title,
        hero_subtitle: heroSubtitle.trim() || defaultHomepage.hero_subtitle,
        hero_btn_text: heroBtnText.trim() || defaultHomepage.hero_btn_text,
        hero_image: heroImage || defaultHomepage.hero_image,
        cards: [
          { title: card1.title.trim() || "Pencarian Santri", description: card1.description.trim() || "", icon: card1.icon },
          { title: card2.title.trim() || "Profil Pesantren", description: card2.description.trim() || "", icon: card2.icon },
          { title: card3.title.trim() || "Aman & Terpercaya", description: card3.description.trim() || "", icon: card3.icon }
        ],
        about_title: aboutTitle.trim() || defaultHomepage.about_title,
        about_subtitle: aboutSubtitle.trim() || defaultHomepage.about_subtitle,
        about_description: aboutDescription.trim() || defaultHomepage.about_description,
        about_stats_1: aboutStats1.trim() || defaultHomepage.about_stats_1,
        about_stats_2: aboutStats2.trim() || defaultHomepage.about_stats_2,
        about_image: aboutImage || defaultHomepage.about_image,
        contact_address: contactAddress.trim() || defaultHomepage.contact_address,
        contact_phone: contactPhone.trim() || defaultHomepage.contact_phone,
        contact_email: contactEmail.trim() || defaultHomepage.contact_email,
        news: newsList,
        programs: programsList,
        psb_settings: {
          is_open: psbIsOpen,
          registration_url: psbRegistrationUrl,
          year_academic: psbYearAcademic,
          quota_total: Number(psbQuotaTotal) || 0,
          quota_accepted: Number(psbQuotaAccepted) || 0,
          quota_remaining: Number(psbQuotaRemaining) || 0,
          quota_alert_text: psbQuotaAlertText,
          requirements_umum: psbRequirementsUmum.split('\n').map(line => line.trim()).filter(Boolean),
          requirements_khusus: psbRequirementsKhusus.split('\n').map(line => line.trim()).filter(Boolean),
          documents: psbDocuments.split('\n').map(line => line.trim()).filter(Boolean),
          steps: psbSteps,
          contact_putra_nama: psbContactPutraNama,
          contact_putra_phone: psbContactPutraPhone,
          contact_putri_nama: psbContactPutriNama,
          contact_putri_phone: psbContactPutriPhone,
          contact_email: psbContactEmail,
          contact_hours: psbContactHours
        }
      };

      const updatedDb: K_DB = {
        ...db,
        homepage: updatedHomepage
      };

      try {
        await syncDbState(updatedDb);
        showToast("✓ Berhasil menyimpan semua konfigurasi Homepage!", "success");
      } catch (err) {
        showToast("Gagal menyimpan perubahan ke server!", "error");
      }
    });
  };

  const handleReset = () => {
    showConfirm("Kembalikan konfigurasi homepage ke bawaan asli?", (yes) => {
      if (!yes) return;
      setHeroTitle(defaultHomepage.hero_title);
      setHeroSubtitle(defaultHomepage.hero_subtitle);
      setHeroBtnText(defaultHomepage.hero_btn_text);
      setHeroImage(defaultHomepage.hero_image);
      setCard1(defaultHomepage.cards[0]);
      setCard2(defaultHomepage.cards[1]);
      setCard3(defaultHomepage.cards[2]);
      setAboutTitle(defaultHomepage.about_title);
      setAboutSubtitle(defaultHomepage.about_subtitle);
      setAboutDescription(defaultHomepage.about_description);
      setAboutStats1(defaultHomepage.about_stats_1);
      setAboutStats2(defaultHomepage.about_stats_2);
      setAboutImage(defaultHomepage.about_image);
      setContactAddress(defaultHomepage.contact_address);
      setContactPhone(defaultHomepage.contact_phone);
      setContactEmail(defaultHomepage.contact_email);
      setProgramsList(defaultHomepage.programs || []);
      setPsbIsOpen(defaultHomepage.psb_settings?.is_open ?? true);
      setPsbRegistrationUrl(defaultHomepage.psb_settings?.registration_url || "");
      setPsbYearAcademic(defaultHomepage.psb_settings?.year_academic || "2026/2027");
      setPsbQuotaTotal(defaultHomepage.psb_settings?.quota_total ?? 191);
      setPsbQuotaAccepted(defaultHomepage.psb_settings?.quota_accepted ?? 186);
      setPsbQuotaRemaining(defaultHomepage.psb_settings?.quota_remaining ?? 5);
      setPsbQuotaAlertText(defaultHomepage.psb_settings?.quota_alert_text || "");
      setPsbRequirementsUmum((defaultHomepage.psb_settings?.requirements_umum || []).join("\n"));
      setPsbRequirementsKhusus((defaultHomepage.psb_settings?.requirements_khusus || []).join("\n"));
      setPsbDocuments((defaultHomepage.psb_settings?.documents || []).join("\n"));
      setPsbContactPutraNama(defaultHomepage.psb_settings?.contact_putra_nama || "Ust. H. Faisal");
      setPsbContactPutraPhone(defaultHomepage.psb_settings?.contact_putra_phone || "+62 857-3743-5155");
      setPsbContactPutriNama(defaultHomepage.psb_settings?.contact_putri_nama || "Ust. Iwan Hidayat");
      setPsbContactPutriPhone(defaultHomepage.psb_settings?.contact_putri_phone || "+62 812-3540-7745");
      setPsbContactEmail(defaultHomepage.psb_settings?.contact_email || "ma'had.alhidayah.jembrana@gmail.com");
      setPsbContactHours(defaultHomepage.psb_settings?.contact_hours || "Senin - Jumat: 08.00 - 15.00 WITA\nSabtu: 08.00 - 12.00 WITA");
      setPsbSteps(defaultHomepage.psb_settings?.steps || []);
      showToast("Form dikembalikan ke bawaan (klik 'Simpan' untuk memperbarui server)", "info");
    });
  };

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-6 border border-emerald-500/10 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-emerald-950/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <span className="animate-spin inline-block" style={{ animationDuration: '8s' }}>
              <LucideIcon name="globe" className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-gray-100">Portal Media Hub & Homepage Editor</h2>
          </div>
          <p className="text-xs text-emerald-500/70">Sesuaikan tampilan awal portal web pesantren Anda kapan saja demi kenyamanan wali dan publik.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleReset}
            className="flex-1 md:flex-initial px-4 py-2 bg-emerald-950/30 hover:bg-emerald-950/80 text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          >
            <LucideIcon name="rotate-ccw" className="w-4 h-4" />
            <span>Reset Bawaan</span>
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 md:flex-initial px-5 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
          >
            <LucideIcon name="save" className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* Editor Sub-Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-emerald-950/30 p-1.5 rounded-2xl border border-emerald-900/30">
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'hero' ? 'bg-amber-500 text-emerald-950' : 'text-emerald-500 hover:bg-emerald-950/40'}`}
        >
          <LucideIcon name="layout" className="w-4 h-4" />
          <span>Hero & Identitas</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cards')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'cards' ? 'bg-amber-500 text-emerald-950' : 'text-emerald-500 hover:bg-emerald-950/40'}`}
        >
          <LucideIcon name="grid" className="w-4 h-4" />
          <span>Kartu Fitur</span>
        </button>
        <button
          onClick={() => setActiveSubTab('about')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'about' ? 'bg-amber-500 text-emerald-950' : 'text-emerald-500 hover:bg-emerald-950/40'}`}
        >
          <LucideIcon name="info" className="w-4 h-4" />
          <span>Tentang Kami & Foto</span>
        </button>
        <button
          onClick={() => setActiveSubTab('contact')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'contact' ? 'bg-amber-500 text-emerald-950' : 'text-emerald-500 hover:bg-emerald-950/40'}`}
        >
          <LucideIcon name="phone" className="w-4 h-4" />
          <span>Kontak & Footer</span>
        </button>
        <button
          onClick={() => setActiveSubTab('news')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'news' ? 'bg-amber-500 text-emerald-950' : 'text-emerald-500 hover:bg-emerald-950/40'}`}
        >
          <LucideIcon name="newspaper" className="w-4 h-4" />
          <span>Kelola Berita</span>
        </button>
        <button
          onClick={() => setActiveSubTab('program')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'program' ? 'bg-amber-500 text-emerald-950' : 'text-emerald-500 hover:bg-emerald-950/40'}`}
        >
          <LucideIcon name="star" className="w-4 h-4" />
          <span>Kelola Program</span>
        </button>
        <button
          onClick={() => setActiveSubTab('psb')}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${activeSubTab === 'psb' ? 'bg-amber-500 text-emerald-950' : 'text-emerald-500 hover:bg-emerald-950/40'}`}
        >
          <LucideIcon name="user-plus" className="w-4 h-4" />
          <span>Kelola PSB</span>
        </button>
      </div>

      {/* Editor Content Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form fields */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* TAB 1: HERO & IDENTITAS */}
          {activeSubTab === 'hero' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950 pb-2 mb-2">Identitas & Logo Pesantren</h3>
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-[#022c22] border border-amber-500/20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                  {db.settings.logo_url ? (
                    <img src={db.settings.logo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-lg">🕌</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-400 block">{db.settings.nama_pesantren || db.settings.shop_name || "Pesantren"}</span>
                  <span className="text-[10px] text-gray-400 block leading-relaxed mt-0.5">
                    Nama dan Logo Pesantren diatur secara eksklusif oleh <strong>Abah Kiai</strong> melalui menu Pengaturan Kiai untuk menjaga keaslian identitas pondok.
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950 pb-2 pt-2 mb-2">Hero Section Utama</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Hero Title (Judul Besar)</label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Contoh: Database Pondok Pesantren Terpercaya"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Hero Subtitle (Deskripsi Pendek)</label>
                  <textarea
                    rows={2}
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    placeholder="Tulis penjelasan singkat mengenai fitur portal"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Teks Tombol Aksi</label>
                    <input
                      type="text"
                      value={heroBtnText}
                      onChange={(e) => setHeroBtnText(e.target.value)}
                      placeholder="Contoh: Cari Data Santri"
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Unggah Gambar Hero (Rekomendasi 16:9)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, setHeroImage)}
                      className="w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-emerald-900/50 file:text-emerald-400 hover:file:bg-emerald-900 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Atau Gunakan Gambar Hero URL</label>
                  <input
                    type="text"
                    value={heroImage.startsWith('data:') ? '[Gambar Hasil Unggahan File]' : heroImage}
                    onChange={(e) => {
                      if (!e.target.value.includes('[Gambar')) {
                        setHeroImage(e.target.value);
                      }
                    }}
                    placeholder="URL gambar hero pesantren"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KARTU FITUR */}
          {activeSubTab === 'cards' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950 pb-2 mb-2">Tiga Kartu Sorotan Layanan</h3>
              
              {/* Card 1 */}
              <div className="bg-[#021d17]/50 border border-emerald-950 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-amber-400 tracking-wider">KARTU SOROTAN 1</span>
                  <div className="flex gap-1.5">
                    {['search', 'landmark', 'shield', 'book', 'users'].map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setCard1({ ...card1, icon: ic })}
                        className={`p-1.5 rounded-lg border transition-all ${card1.icon === ic ? 'bg-amber-500 text-emerald-950 border-amber-500' : 'bg-[#02211a] text-emerald-400 border-emerald-900'}`}
                      >
                        <LucideIcon name={ic} className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-emerald-500/80 mb-1">Judul Kartu 1</label>
                    <input
                      type="text"
                      value={card1.title}
                      onChange={(e) => setCard1({ ...card1, title: e.target.value })}
                      placeholder="Judul"
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-500/80 mb-1">Deskripsi Kartu 1</label>
                    <input
                      type="text"
                      value={card1.description}
                      onChange={(e) => setCard1({ ...card1, description: e.target.value })}
                      placeholder="Penjelasan singkat"
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#021d17]/50 border border-emerald-950 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-amber-400 tracking-wider">KARTU SOROTAN 2</span>
                  <div className="flex gap-1.5">
                    {['search', 'landmark', 'shield', 'book', 'users'].map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setCard2({ ...card2, icon: ic })}
                        className={`p-1.5 rounded-lg border transition-all ${card2.icon === ic ? 'bg-amber-500 text-emerald-950 border-amber-500' : 'bg-[#02211a] text-emerald-400 border-emerald-900'}`}
                      >
                        <LucideIcon name={ic} className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-emerald-500/80 mb-1">Judul Kartu 2</label>
                    <input
                      type="text"
                      value={card2.title}
                      onChange={(e) => setCard2({ ...card2, title: e.target.value })}
                      placeholder="Judul"
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-500/80 mb-1">Deskripsi Kartu 2</label>
                    <input
                      type="text"
                      value={card2.description}
                      onChange={(e) => setCard2({ ...card2, description: e.target.value })}
                      placeholder="Penjelasan singkat"
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#021d17]/50 border border-emerald-950 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-amber-400 tracking-wider">KARTU SOROTAN 3</span>
                  <div className="flex gap-1.5">
                    {['search', 'landmark', 'shield', 'book', 'users'].map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setCard3({ ...card3, icon: ic })}
                        className={`p-1.5 rounded-lg border transition-all ${card3.icon === ic ? 'bg-amber-500 text-emerald-950 border-amber-500' : 'bg-[#02211a] text-emerald-400 border-emerald-900'}`}
                      >
                        <LucideIcon name={ic} className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-emerald-500/80 mb-1">Judul Kartu 3</label>
                    <input
                      type="text"
                      value={card3.title}
                      onChange={(e) => setCard3({ ...card3, title: e.target.value })}
                      placeholder="Judul"
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-500/80 mb-1">Deskripsi Kartu 3</label>
                    <input
                      type="text"
                      value={card3.description}
                      onChange={(e) => setCard3({ ...card3, description: e.target.value })}
                      placeholder="Penjelasan singkat"
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT & PHOTO */}
          {activeSubTab === 'about' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950 pb-2 mb-2">Profil & Tentang Pesantren</h3>
              <div>
                <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Judul Section Profil</label>
                <input
                  type="text"
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  placeholder="Contoh: Tentang Pesantren Kami"
                  className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Slogan / Subtitle Profil</label>
                <input
                  type="text"
                  value={aboutSubtitle}
                  onChange={(e) => setAboutSubtitle(e.target.value)}
                  placeholder="Contoh: Membangun Generasi Islami"
                  className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Paragraf Deskripsi Profil</label>
                <textarea
                  rows={4}
                  value={aboutDescription}
                  onChange={(e) => setAboutDescription(e.target.value)}
                  placeholder="Tulis visi misi atau komitmen pesantren secara mendetail..."
                  className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white"
                />
              </div>

              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950 pb-2 pt-2 mb-2">Statistik Prestasi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Statistik 1 (Jumlah Santri/Alumni)</label>
                  <input
                    type="text"
                    value={aboutStats1}
                    onChange={(e) => setAboutStats1(e.target.value)}
                    placeholder="Contoh: 500+ Santri Aktif"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Statistik 2 (Usia Pesantren)</label>
                  <input
                    type="text"
                    value={aboutStats2}
                    onChange={(e) => setAboutStats2(e.target.value)}
                    placeholder="Contoh: 25+ Tahun Berdiri"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Unggah Gambar Samping (Rekomendasi 4:3)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, setAboutImage)}
                    className="w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-emerald-900/50 file:text-emerald-400 hover:file:bg-emerald-900 focus:outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Atau Gambar Samping URL</label>
                  <input
                    type="text"
                    value={aboutImage.startsWith('data:') ? '[Gambar Hasil Unggahan File]' : aboutImage}
                    onChange={(e) => {
                      if (!e.target.value.includes('[Gambar')) {
                        setAboutImage(e.target.value);
                      }
                    }}
                    placeholder="URL gambar profil samping"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & FOOTER */}
          {activeSubTab === 'contact' && (
            <div className="space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950 pb-2 mb-2">Informasi Kontak & Footer</h3>
              <div>
                <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Alamat Lengkap Pesantren</label>
                <input
                  type="text"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  placeholder="Contoh: Bandung, Jawa Barat"
                  className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">No HP / WhatsApp Resmi</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Contoh: 6281234567890"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Email Resmi</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Contoh: info@ponpesqu.com"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NEWS MANAGEMENT */}
          {activeSubTab === 'news' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-emerald-950 pb-2 mb-2">
                <h3 className="text-sm font-bold text-gray-200">Manajemen Kabar & Berita Homepage</h3>
                <button 
                  type="button"
                  onClick={openAddNewsModal}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all shadow-md"
                >
                  <LucideIcon name="plus" className="w-3.5 h-3.5" />
                  <span>Tambah Berita Baru</span>
                </button>
              </div>

              <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                {newsList.map((item, index) => (
                  <div key={item.id || index} className="p-3 bg-emerald-950/25 border border-emerald-900/30 rounded-xl flex gap-3 items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-emerald-900/40" />
                      ) : (
                        <div className="w-12 h-12 bg-emerald-950 rounded-lg shrink-0 flex items-center justify-center text-xs text-emerald-400 border border-emerald-900/40">
                          🕌
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="inline-block text-[9px] bg-emerald-900/40 text-[#10b981] font-bold px-2 py-0.5 rounded-full border border-emerald-900/50 mb-1">
                          {item.category || "UMUM"}
                        </span>
                        <h4 className="text-xs font-bold text-gray-100 truncate">{item.title}</h4>
                        <span className="text-[10px] text-emerald-500/50 font-mono block mt-0.5">{item.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => openEditNewsModal(item)}
                        className="p-1.5 bg-emerald-900/30 hover:bg-emerald-900/60 text-amber-400 rounded-lg border border-emerald-900/40 transition-colors"
                        title="Edit Berita"
                      >
                        <LucideIcon name="pencil" className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteNews(item.id)}
                        className="p-1.5 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-lg border border-red-900/20 transition-colors"
                        title="Hapus Berita"
                      >
                        <LucideIcon name="trash-2" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {newsList.length === 0 && (
                  <div className="text-center py-12 bg-[#021d17]/10 rounded-2xl border border-emerald-950/40 text-xs text-gray-500 italic">
                    Belum ada kabar/berita yang diterbitkan. Klik tombol di atas untuk menambah.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: PROGRAM MANAGEMENT */}
          {activeSubTab === 'program' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-emerald-950 pb-2 mb-2">
                <h3 className="text-sm font-bold text-gray-200">Manajemen Program Unggulan</h3>
                <button 
                  type="button"
                  onClick={() => {
                    setEditingProg(null);
                    setProgTitle("");
                    setProgDescription("");
                    setProgIcon("book-open");
                    setIsProgModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold rounded-xl text-[10px] flex items-center gap-1.5 transition-all shadow-md"
                >
                  <LucideIcon name="plus" className="w-3.5 h-3.5" />
                  <span>Tambah Program Baru</span>
                </button>
              </div>

              <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                {programsList.map((prog, index) => (
                  <div key={prog.id || index} className="p-3 bg-emerald-950/25 border border-emerald-900/30 rounded-xl flex gap-3 items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      <div className="w-10 h-10 bg-emerald-900/50 rounded-xl shrink-0 flex items-center justify-center text-amber-400 border border-emerald-800/40">
                        <LucideIcon name={prog.icon || "book-open"} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-gray-100 truncate">{prog.title}</h4>
                        <p className="text-[10px] text-emerald-500/60 line-clamp-1 mt-0.5">{prog.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button 
                        type="button"
                        onClick={() => {
                          setEditingProg(prog);
                          setProgTitle(prog.title);
                          setProgDescription(prog.description);
                          setProgIcon(prog.icon || "book-open");
                          setIsProgModalOpen(true);
                        }}
                        className="p-1.5 bg-emerald-900/30 hover:bg-emerald-900/60 text-amber-400 rounded-lg border border-emerald-900/40 transition-colors"
                        title="Edit Program"
                      >
                        <LucideIcon name="pencil" className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          showConfirm("Apakah Anda yakin ingin menghapus program ini?", (yes) => {
                            if (!yes) return;
                            const updated = programsList.filter(p => p.id !== prog.id);
                            setProgramsList(updated);
                            showToast("✓ Program dihapus dari daftar sementara. Jangan lupa klik 'Simpan Perubahan'!", "info");
                          });
                        }}
                        className="p-1.5 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded-lg border border-red-900/20 transition-colors"
                        title="Hapus Program"
                      >
                        <LucideIcon name="trash-2" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {programsList.length === 0 && (
                  <div className="text-center py-12 bg-[#021d17]/10 rounded-2xl border border-emerald-950/40 text-xs text-gray-500 italic">
                    Belum ada program unggulan yang ditambahkan. Klik tombol di atas untuk menambah.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: PSB SETTINGS */}
          {activeSubTab === 'psb' && (
            <div className="space-y-4 animate-fadeIn max-h-[550px] overflow-y-auto pr-1">
              <h3 className="text-sm font-bold text-gray-200 border-b border-emerald-950 pb-2 mb-2">Konfigurasi Pendaftaran Santri Baru</h3>
              
              <div className="p-4 bg-emerald-950/30 border border-emerald-900/40 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-200">Status Pendaftaran</h4>
                  <p className="text-[10px] text-emerald-500/50 mt-0.5">Aktifkan untuk membuka tombol pendaftaran di homepage, atau nonaktifkan untuk menutup pendaftaran.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPsbIsOpen(!psbIsOpen)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    psbIsOpen 
                      ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400" 
                      : "bg-red-950 text-red-400 border border-red-900/30 hover:bg-red-900/20"
                  }`}
                >
                  {psbIsOpen ? "✓ Pendaftaran DIBUKA" : "✕ Pendaftaran DITUTUP"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Tahun Akademik</label>
                  <input
                    type="text"
                    value={psbYearAcademic}
                    onChange={(e) => setPsbYearAcademic(e.target.value)}
                    placeholder="Contoh: TP. 2026/2027"
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">URL Link Pendaftaran (Google Form, etc.)</label>
                  <input
                    type="text"
                    value={psbRegistrationUrl}
                    onChange={(e) => setPsbRegistrationUrl(e.target.value)}
                    placeholder="Contoh: https://forms.gle/..."
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Total Kuota</label>
                  <input
                    type="number"
                    value={psbQuotaTotal}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPsbQuotaTotal(val);
                      setPsbQuotaRemaining(Math.max(0, val - psbQuotaAccepted));
                    }}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Sudah Diterima</label>
                  <input
                    type="number"
                    value={psbQuotaAccepted}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPsbQuotaAccepted(val);
                      setPsbQuotaRemaining(Math.max(0, psbQuotaTotal - val));
                    }}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Sisa Kursi (Sisa Kuota)</label>
                  <input
                    type="number"
                    value={psbQuotaRemaining}
                    onChange={(e) => setPsbQuotaRemaining(Number(e.target.value))}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Teks Peringatan Kuota Menipis</label>
                <input
                  type="text"
                  value={psbQuotaAlertText}
                  onChange={(e) => setPsbQuotaAlertText(e.target.value)}
                  placeholder="Contoh: Peringatan! Kuota tersisa sedikit. Segera mendaftar!"
                  className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Persyaratan Umum (1 Per Baris)</label>
                  <textarea
                    rows={4}
                    value={psbRequirementsUmum}
                    onChange={(e) => setPsbRequirementsUmum(e.target.value)}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white resize-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Persyaratan Khusus (1 Per Baris)</label>
                  <textarea
                    rows={4}
                    value={psbRequirementsKhusus}
                    onChange={(e) => setPsbRequirementsKhusus(e.target.value)}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white resize-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Dokumen Siapkan (1 Per Baris)</label>
                  <textarea
                    rows={4}
                    value={psbDocuments}
                    onChange={(e) => setPsbDocuments(e.target.value)}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white resize-none font-sans"
                  />
                </div>
              </div>

              <h4 className="text-xs font-bold text-gray-200 border-t border-emerald-950 pt-3 mt-1 mb-1 flex items-center gap-1">
                <LucideIcon name="phone" className="w-4 h-4 text-amber-500" />
                <span>Kontak Panitia & Jam Pelayanan</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Panitia Putra</span>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Nama Panitia Putra</label>
                    <input
                      type="text"
                      value={psbContactPutraNama}
                      onChange={(e) => setPsbContactPutraNama(e.target.value)}
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">No. HP Putra</label>
                    <input
                      type="text"
                      value={psbContactPutraPhone}
                      onChange={(e) => setPsbContactPutraPhone(e.target.value)}
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3 p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Panitia Putri</span>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Nama Panitia Putri</label>
                    <input
                      type="text"
                      value={psbContactPutriNama}
                      onChange={(e) => setPsbContactPutriNama(e.target.value)}
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">No. HP Putri</label>
                    <input
                      type="text"
                      value={psbContactPutriPhone}
                      onChange={(e) => setPsbContactPutriPhone(e.target.value)}
                      className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Email Panitia</label>
                  <input
                    type="email"
                    value={psbContactEmail}
                    onChange={(e) => setPsbContactEmail(e.target.value)}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400/80 mb-1.5 font-semibold">Jam Pelayanan</label>
                  <textarea
                    rows={2}
                    value={psbContactHours}
                    onChange={(e) => setPsbContactHours(e.target.value)}
                    className="w-full bg-[#02211a] border border-emerald-900/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 transition-all text-white resize-none font-sans"
                  />
                </div>
              </div>

              {/* Alur Pendaftaran (Steps) Management */}
              <h4 className="text-xs font-bold text-gray-200 border-t border-emerald-950 pt-3 mt-1 mb-1 flex items-center gap-1">
                <LucideIcon name="git-commit" className="w-4 h-4 text-amber-500" />
                <span>Alur Pendaftaran (Langkah demi Langkah)</span>
              </h4>

              <div className="space-y-3 bg-[#011a14] border border-emerald-900/30 p-3.5 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Langkah Pendaftaran ({psbSteps.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNum = psbSteps.length > 0 ? Math.max(...psbSteps.map(s => s.step_num)) + 1 : 1;
                      setPsbSteps([...psbSteps, { step_num: nextNum, title: "Langkah Baru", desc: "Deskripsi singkat langkah pendaftaran" }]);
                    }}
                    className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-900 text-amber-400 font-bold rounded-lg text-[9px] flex items-center gap-1 transition-all"
                  >
                    <LucideIcon name="plus" className="w-3 h-3" />
                    <span>Tambah Alur</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {psbSteps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-[#02211a]/55 border border-emerald-950 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-amber-500 text-emerald-950 font-extrabold w-5 h-5 rounded-full flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const updated = [...psbSteps];
                              updated[idx] = { ...step, title: e.target.value };
                              setPsbSteps(updated);
                            }}
                            placeholder="Judul Langkah"
                            className="bg-transparent border-b border-emerald-900/40 focus:border-amber-500/60 px-1 text-xs font-bold text-gray-100 focus:outline-none w-full max-w-[180px] sm:max-w-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Re-order buttons */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              const updated = [...psbSteps];
                              const temp = updated[idx];
                              updated[idx] = updated[idx - 1];
                              updated[idx - 1] = temp;
                              const reassigned = updated.map((s, i) => ({ ...s, step_num: i + 1 }));
                              setPsbSteps(reassigned);
                            }}
                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                            title="Naikkan"
                          >
                            <LucideIcon name="arrow-up" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === psbSteps.length - 1}
                            onClick={() => {
                              if (idx === psbSteps.length - 1) return;
                              const updated = [...psbSteps];
                              const temp = updated[idx];
                              updated[idx] = updated[idx + 1];
                              updated[idx + 1] = temp;
                              const reassigned = updated.map((s, i) => ({ ...s, step_num: i + 1 }));
                              setPsbSteps(reassigned);
                            }}
                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                            title="Turunkan"
                          >
                            <LucideIcon name="arrow-down" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = psbSteps.filter((_, i) => i !== idx)
                                .map((s, i) => ({ ...s, step_num: i + 1 }));
                              setPsbSteps(updated);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 ml-1"
                            title="Hapus"
                          >
                            <LucideIcon name="trash-2" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={step.desc}
                        onChange={(e) => {
                          const updated = [...psbSteps];
                          updated[idx] = { ...step, desc: e.target.value };
                          setPsbSteps(updated);
                        }}
                        placeholder="Deskripsi langkah pendaftaran..."
                        className="w-full bg-[#011410] border border-emerald-950/60 rounded-lg px-2 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-emerald-800 resize-none font-sans"
                      />
                    </div>
                  ))}

                  {psbSteps.length === 0 && (
                    <div className="text-center py-6 text-[10px] text-gray-500 italic">
                      Belum ada alur pendaftaran. Klik 'Tambah Alur' untuk menambah.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Live Mini Preview Column (Interactive visual feedback!) */}
        <div className="lg:col-span-5 flex flex-col">
          <span className="text-[11px] font-bold text-emerald-500/80 mb-2 uppercase tracking-widest block font-mono">Live Interactive Mini Preview</span>
          <div className="flex-grow rounded-2xl overflow-hidden border border-emerald-500/20 bg-[#021310] shadow-inner p-4 relative flex flex-col gap-4">
            
            {/* Header Brand preview */}
            <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🕌</span>
                <span className="text-xs font-bold text-gray-200 tracking-tight">{db.settings.nama_pesantren || db.settings.shop_name || "Pesantren"}</span>
              </div>
              <span className="text-[8px] bg-[#022c22] border border-emerald-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">MASUK</span>
            </div>

            {/* Hero Area preview */}
            <div className="rounded-xl overflow-hidden relative min-h-[140px] flex items-end p-3 shadow-md">
              <img 
                src={heroImage || defaultHomepage.hero_image} 
                alt="Hero Preview" 
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021310] via-transparent to-transparent" />
              <div className="relative z-10 w-full">
                <h4 className="text-[11px] font-extrabold text-white leading-tight mb-1 max-w-[90%]">{heroTitle || "Tanpa Judul"}</h4>
                <p className="text-[8px] text-gray-300 line-clamp-2 leading-relaxed mb-2">{heroSubtitle || "Tanpa deskripsi"}</p>
                <div className="inline-block px-2.5 py-1 bg-emerald-500 text-[#02110e] text-[8px] font-extrabold rounded-lg">
                  {heroBtnText || "Aksi"}
                </div>
              </div>
            </div>

            {/* Cards Preview */}
            <div className="grid grid-cols-3 gap-2">
              {[card1, card2, card3].map((cd, index) => (
                <div key={index} className="bg-[#02211a] border border-emerald-950/80 p-2 rounded-lg text-center flex flex-col items-center justify-center">
                  <div className="w-5 h-5 bg-[#032e24] rounded-full flex items-center justify-center text-amber-400 border border-emerald-900/60 mb-1">
                    <LucideIcon name={cd.icon} className="w-2.5 h-2.5" />
                  </div>
                  <h5 className="text-[9px] font-bold text-gray-200 line-clamp-1">{cd.title || "Kartu"}</h5>
                  <p className="text-[7px] text-emerald-500/60 line-clamp-2 leading-tight mt-0.5">{cd.description || "Penjelasan"}</p>
                </div>
              ))}
            </div>

            {/* About Preview */}
            <div className="bg-[#021d17]/40 border border-emerald-950/60 p-2.5 rounded-xl flex items-center gap-3">
              <div className="flex-grow">
                <h5 className="text-[10px] font-extrabold text-white line-clamp-1">{aboutTitle}</h5>
                <span className="text-[7px] text-amber-400 block mb-1 line-clamp-1">{aboutSubtitle}</span>
                <p className="text-[7px] text-gray-300 line-clamp-3 leading-normal">{aboutDescription}</p>
                <div className="flex gap-2 mt-1.5 border-t border-emerald-950/30 pt-1.5">
                  <span className="text-[7px] font-mono text-emerald-400 font-bold bg-[#032e24] px-1 rounded">{aboutStats1}</span>
                  <span className="text-[7px] font-mono text-emerald-400 font-bold bg-[#032e24] px-1 rounded">{aboutStats2}</span>
                </div>
              </div>
              {aboutImage && (
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-emerald-900 shrink-0 bg-[#022c22]">
                  <img src={aboutImage} alt="About Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Footer preview */}
            <div className="border-t border-emerald-950/40 pt-2 mt-auto text-center">
              <p className="text-[7px] text-emerald-500/50">{contactAddress} • {contactPhone} • {contactEmail}</p>
            </div>

          </div>
        </div>

      </div>

      {/* News Add/Edit Dialog modal */}
      {isNewsModalOpen && (
        <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-md flex items-center justify-center">
          <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                <LucideIcon name={editingNews ? "pencil" : "plus"} className="w-4 h-4" /> 
                {editingNews ? "Edit Berita" : "Tambah Berita Baru"}
              </h3>
              <button onClick={() => setIsNewsModalOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                <LucideIcon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNews} className="space-y-4 text-xs text-gray-300">
              <div>
                <label className="block text-emerald-500/80 mb-1">Judul Berita</label>
                <input 
                  type="text" 
                  required 
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="Contoh: Pembukaan PSB Tahun Ajaran Baru..." 
                  className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-500/80 mb-1">Kategori / Label</label>
                  <select 
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-amber-400 focus:outline-none"
                  >
                    <option value="PENGUMUMAN">PENGUMUMAN</option>
                    <option value="KEGIATAN">KEGIATAN</option>
                    <option value="PRESTASI">PRESTASI</option>
                    <option value="UMUM">UMUM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-emerald-500/80 mb-1">Tanggal Berita</label>
                  <input 
                    type="text" 
                    required
                    value={newsDate}
                    onChange={(e) => setNewsDate(e.target.value)}
                    placeholder="Contoh: 12 Juli 2026" 
                    className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1">Isi Berita</label>
                <textarea 
                  required 
                  rows={5}
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="Tulis detail isi berita lengkap disini..." 
                  className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1.5 font-semibold">Unggah Gambar Berita (Rekomendasi 16:10)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e, setNewsImage)}
                  className="w-full text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-emerald-900/50 file:text-emerald-400 hover:file:bg-emerald-900 focus:outline-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1">Atau Gunakan URL Gambar Berita</label>
                <input 
                  type="text" 
                  value={newsImage.startsWith('data:') ? '[Gambar Hasil Unggahan File]' : newsImage}
                  onChange={(e) => {
                    if (!e.target.value.includes('[Gambar')) {
                      setNewsImage(e.target.value);
                    }
                  }}
                  placeholder="Contoh: https://images.unsplash.com/..." 
                  className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsNewsModalOpen(false)} className="w-1/2 py-2 bg-[#02211a] text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Berita</button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Program Add/Edit Dialog modal */}
      {isProgModalOpen && (
        <dialog open className="backdrop:bg-[#02110e]/80 fixed inset-0 z-50 bg-transparent focus:outline-none p-4 w-full max-w-md flex items-center justify-center">
          <div className="glass-card p-6 rounded-3xl border border-amber-500/30 flex flex-col gap-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-emerald-950/50 pb-2">
              <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
                <LucideIcon name={editingProg ? "pencil" : "plus"} className="w-4 h-4" /> 
                {editingProg ? "Edit Program" : "Tambah Program Baru"}
              </h3>
              <button onClick={() => setIsProgModalOpen(false)} className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-500">
                <LucideIcon name="x" className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProgram} className="space-y-4 text-xs text-gray-300">
              <div>
                <label className="block text-emerald-500/80 mb-1">Nama Program</label>
                <input 
                  type="text" 
                  required 
                  value={progTitle}
                  onChange={(e) => setProgTitle(e.target.value)}
                  placeholder="Contoh: Madrasah Diniyah (Madin)..." 
                  className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1">Ikon Program</label>
                <select 
                  value={progIcon}
                  onChange={(e) => setProgIcon(e.target.value)}
                  className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-amber-400 focus:outline-none"
                >
                  <option value="book-open">Buku Terbuka (Pendidikan)</option>
                  <option value="star">Bintang (Keunggulan)</option>
                  <option value="award">Medali / Penghargaan</option>
                  <option value="heart">Hati (Kemanusiaan / Akhlak)</option>
                  <option value="users">Orang Banyak (Sosial / Jamaah)</option>
                  <option value="shield">Perisai (Keamanan / Disiplin)</option>
                  <option value="check-circle">Centang Bulat (Kepatuhan / Mutu)</option>
                  <option value="globe">Bola Dunia (Internasional / Umum)</option>
                  <option value="home">Kubah / Rumah (Asrama)</option>
                </select>
              </div>

              <div>
                <label className="block text-emerald-500/80 mb-1">Deskripsi Singkat Program</label>
                <textarea 
                  required 
                  rows={4}
                  value={progDescription}
                  onChange={(e) => setProgDescription(e.target.value)}
                  placeholder="Tulis penjelasan singkat program, kurikulum, atau sasaran program..." 
                  className="w-full bg-[#02211a] border border-emerald-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsProgModalOpen(false)} className="w-1/2 py-2 bg-[#02211a] text-emerald-500 border border-emerald-900 rounded-xl text-xs font-semibold">Batal</button>
                <button type="submit" className="w-1/2 py-2 bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs font-bold rounded-xl shadow-md">Simpan Program</button>
              </div>
            </form>
          </div>
        </dialog>
      )}

    </div>
  );
}
