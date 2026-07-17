import React, { useState, useRef } from 'react';
import { K_DB, HomepageData } from '../types';
import { LucideIcon } from './LucideIcon';

interface HomepageViewProps {
  db: K_DB;
  onEnterLogin: () => void;
}

export function HomepageView({ db, onEnterLogin }: HomepageViewProps) {
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
    contact_email: "info@ponpesqu.com"
  };

  const hp = db.homepage || defaultHomepage;
  // Page sub-views state: 'home', 'program', 'psb'
  const [activeSubPage, setActiveSubPage] = useState<"home" | "program" | "psb">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search feature state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // News detail state
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const selectedNews = (hp.news || []).find(n => n.id === selectedNewsId);

  const searchSectionRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const newsSectionRef = useRef<HTMLDivElement>(null);
  const contactSectionRef = useRef<HTMLDivElement>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (ref: React.RefObject<HTMLDivElement | null>) => {
    setSelectedNewsId(null);
    setActiveSubPage("home");
    setTimeout(() => {
      scrollToRef(ref);
    }, 100);
  };

  const handleProgramClick = () => {
    setSelectedNewsId(null);
    setActiveSubPage("program");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePsbClick = () => {
    setSelectedNewsId(null);
    setActiveSubPage("psb");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = db.santri.filter(s => 
      s.nama_santri.toLowerCase().includes(query) || 
      s.id_santri.toLowerCase().includes(query) ||
      s.kelas.toLowerCase().includes(query)
    );

    setSearchResults(results);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#f1f6f4] text-[#0f2d24] selection:bg-[#10b981]/20 selection:text-[#064e3b] font-sans">
      
      {/* HEADER / NAVIGATION (Fully responsive with no mobile/laptop overflow) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-[#e1eae6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
          
          {/* Logo Brand left */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer min-w-0 max-w-[65%] sm:max-w-xs md:max-w-sm" 
            onClick={() => { setSelectedNewsId(null); setActiveSubPage("home"); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <div className="w-10 h-10 bg-[#064e3b] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#064e3b]/10 overflow-hidden shrink-0">
              {db.settings.logo_url ? (
                <img src={db.settings.logo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl">🕌</span>
              )}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-sm sm:text-base md:text-md lg:text-lg font-bold text-[#064e3b] tracking-tight leading-tight line-clamp-2 md:line-clamp-1 truncate-none">
                {db.settings.nama_pesantren || db.settings.shop_name || hp.pesantren_name}
              </span>
              <span className="block text-[8px] sm:text-[9px] text-[#10b981] font-mono tracking-widest uppercase mt-0.5">PORTAL INFORMASI</span>
            </div>
          </div>

          {/* Navigation Links Middle (Hidden on mobile & tablets, shown on xl) */}
          <nav className="hidden xl:flex items-center gap-5 xl:gap-8 text-sm font-semibold text-[#4a6b5e]">
            <button 
              onClick={() => { setSelectedNewsId(null); setActiveSubPage("home"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`py-1 transition-all ${activeSubPage === "home" && selectedNewsId === null ? 'text-[#064e3b] border-b-2 border-[#10b981]' : 'hover:text-[#064e3b]'}`}
            >
              Beranda
            </button>
            <button 
              onClick={() => handleNavClick(aboutSectionRef)}
              className="hover:text-[#064e3b] hover:border-b-2 hover:border-[#10b981]/50 py-1 transition-all whitespace-nowrap"
            >
              Profil Pesantren
            </button>
            <button 
              onClick={() => handleNavClick(searchSectionRef)}
              className="hover:text-[#064e3b] hover:border-b-2 hover:border-[#10b981]/50 py-1 transition-all whitespace-nowrap"
            >
              Data Santri
            </button>
            <button 
              onClick={handleProgramClick}
              className={`py-1 transition-all whitespace-nowrap ${activeSubPage === "program" ? 'text-[#064e3b] border-b-2 border-[#10b981]' : 'hover:text-[#064e3b] hover:border-b-2 hover:border-[#10b981]/50'}`}
            >
              Program
            </button>
            <button 
              onClick={() => handleNavClick(newsSectionRef)}
              className={`py-1 transition-all whitespace-nowrap ${selectedNewsId !== null ? 'text-[#064e3b] border-b-2 border-[#10b981]' : 'hover:text-[#064e3b] hover:border-b-2 hover:border-[#10b981]/50'}`}
            >
              Berita
            </button>
            <button 
              onClick={() => handleNavClick(contactSectionRef)}
              className="hover:text-[#064e3b] hover:border-b-2 hover:border-[#10b981]/50 py-1 transition-all whitespace-nowrap"
            >
              Kontak
            </button>
          </nav>

          {/* Top Right Actions (Hidden on mobile/tablet, shown on xl) */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            <button 
              onClick={handlePsbClick}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeSubPage === "psb" 
                  ? "bg-[#10b981]/15 text-[#064e3b] border-[#10b981] shadow-sm" 
                  : "bg-white hover:bg-[#e6f2ee] text-[#064e3b] border-[#d1ded9]"
              }`}
            >
              <LucideIcon name="user-plus" className="w-4 h-4 text-[#10b981]" />
              <span>Pendaftaran Santri Baru</span>
            </button>
            <button 
              onClick={onEnterLogin}
              className="px-4 sm:px-6 py-2 bg-[#064e3b] hover:bg-[#043327] text-white text-xs sm:text-sm font-bold rounded-full shadow-lg shadow-[#064e3b]/15 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <LucideIcon name="log-in" className="w-4 h-4" />
              <span>Masuk Portal</span>
            </button>
          </div>

          {/* Mobile and Tablet Menu Toggle buttons (Shown on xl:hidden) */}
          <div className="flex xl:hidden items-center gap-2.5">
            <button 
              onClick={onEnterLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#064e3b] hover:bg-[#043327] text-white rounded-full text-xs font-bold shadow-md shadow-[#064e3b]/10 active:scale-95 transition-all whitespace-nowrap"
              title="Masuk Portal"
            >
              <LucideIcon name="log-in" className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-9 h-9 flex items-center justify-center rounded-full active:scale-95 transition-all duration-300 ${
                mobileMenuOpen 
                  ? "bg-amber-500 text-[#064e3b] shadow-md shadow-amber-500/20 rotate-90" 
                  : "bg-[#064e3b]/10 text-[#064e3b] hover:bg-[#064e3b]/20"
              }`}
              aria-label="Toggle Menu"
            >
              <LucideIcon name={mobileMenuOpen ? "x" : "menu"} className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-[#e1eae6] animate-fadeIn shadow-inner">
            <div className="px-4 py-4 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 pb-2">
                <button 
                  onClick={() => { setMobileMenuOpen(false); handlePsbClick(); }}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold text-center border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    activeSubPage === "psb" 
                      ? "bg-[#10b981]/10 text-[#064e3b] border-[#10b981]" 
                      : "bg-[#f1f6f4] text-[#4a6b5e] border-[#e1eae6]"
                  }`}
                >
                  <LucideIcon name="user-plus" className="w-5 h-5 text-[#10b981]" />
                  <span>Pendaftaran</span>
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onEnterLogin(); }}
                  className="py-3 px-3 rounded-2xl text-xs font-bold text-center bg-[#064e3b] text-white flex flex-col items-center justify-center gap-1.5 shadow-sm hover:bg-[#043327] transition-all"
                >
                  <LucideIcon name="log-in" className="w-5 h-5 text-amber-400" />
                  <span>Masuk Portal</span>
                </button>
              </div>

              <div className="border-t border-[#f1f6f4] my-2" />

              <nav className="flex flex-col gap-1 text-sm font-semibold text-[#4a6b5e]">
                <button 
                  onClick={() => { setMobileMenuOpen(false); setSelectedNewsId(null); setActiveSubPage("home"); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors ${
                    activeSubPage === "home" && selectedNewsId === null 
                      ? 'bg-[#10b981]/10 text-[#064e3b]' 
                      : 'hover:bg-[#f1f6f4] text-[#4a6b5e]'
                  }`}
                >
                  <span>Beranda</span>
                  <LucideIcon name="chevron-right" className="w-4 h-4 opacity-50" />
                </button>

                <button 
                  onClick={() => { setMobileMenuOpen(false); handleNavClick(aboutSectionRef); }}
                  className="w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between hover:bg-[#f1f6f4] transition-colors"
                >
                  <span>Profil Pesantren</span>
                  <LucideIcon name="chevron-right" className="w-4 h-4 opacity-50" />
                </button>

                <button 
                  onClick={() => { setMobileMenuOpen(false); handleNavClick(searchSectionRef); }}
                  className="w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between hover:bg-[#f1f6f4] transition-colors"
                >
                  <span>Data Santri</span>
                  <LucideIcon name="chevron-right" className="w-4 h-4 opacity-50" />
                </button>

                <button 
                  onClick={() => { setMobileMenuOpen(false); handleProgramClick(); }}
                  className={`w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors ${
                    activeSubPage === "program" 
                      ? 'bg-[#10b981]/10 text-[#064e3b]' 
                      : 'hover:bg-[#f1f6f4]'
                  }`}
                >
                  <span>Program Unggulan</span>
                  <LucideIcon name="chevron-right" className="w-4 h-4 opacity-50" />
                </button>

                <button 
                  onClick={() => { setMobileMenuOpen(false); handleNavClick(newsSectionRef); }}
                  className="w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between hover:bg-[#f1f6f4] transition-colors"
                >
                  <span>Berita & Kegiatan</span>
                  <LucideIcon name="chevron-right" className="w-4 h-4 opacity-50" />
                </button>

                <button 
                  onClick={() => { setMobileMenuOpen(false); handleNavClick(contactSectionRef); }}
                  className="w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between hover:bg-[#f1f6f4] transition-colors"
                >
                  <span>Hubungi Kami</span>
                  <LucideIcon name="chevron-right" className="w-4 h-4 opacity-50" />
                </button>
              </nav>
            </div>
          </div>
        )}
      </header>

      {activeSubPage === "program" ? (
        /* PROGRAM UNGGULAN VIEW */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn bg-[#f1f6f4]">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#4a6b5e] mb-6 border-b border-[#e1eae6]/60 pb-3">
            <button 
              onClick={() => { setActiveSubPage("home"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-[#064e3b] hover:underline font-bold transition-all text-[#10b981]"
            >
              Beranda
            </button>
            <span className="text-[#a1b8af]">/</span>
            <span className="text-[#064e3b] font-medium">Program Unggulan</span>
          </nav>

          {/* Title */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#064e3b] tracking-tight">Program Unggulan</h1>
            <p className="text-emerald-600/90 text-2xl font-serif mt-1 font-semibold" style={{ fontFamily: 'Noto Sans Arabic, Scheherazade New, serif' }}>البرامج المتميزة</p>
            <p className="text-xs sm:text-sm text-[#4a6b5e] max-w-2xl mx-auto leading-relaxed mt-2">
              Berbagai program unggulan yang kami sediakan untuk membentuk generasi yang berilmu, beramal, dan berakhlak mulia
            </p>
          </div>

          {/* Teal Banner Block */}
          <div className="bg-[#064e3b] text-white py-12 px-6 sm:px-10 rounded-3xl text-center shadow-lg shadow-emerald-950/10 mb-16 space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Program Unggulan Pondok Pesantren {db.settings.nama_pesantren || db.settings.shop_name || hp.pesantren_name}</h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-3xl mx-auto leading-relaxed">
              Kami menyediakan berbagai program yang dirancang untuk mengembangkan potensi santri secara holistik, mencakup aspek spiritual, intelektual, dan keterampilan hidup.
            </p>
          </div>

          {/* Program Inti Section */}
          <div className="text-center space-y-2 mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#064e3b]">Program Inti</h2>
            <div className="w-16 h-1 bg-amber-500 mx-auto my-3 rounded" />
            <p className="text-xs sm:text-sm text-[#4a6b5e] max-w-2xl mx-auto leading-relaxed">
              Program wajib yang menjadi fondasi pendidikan di Pondok Pesantren {db.settings.nama_pesantren || db.settings.shop_name || hp.pesantren_name}
            </p>
          </div>

          {/* Program Inti Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-6">
            {(hp.programs || []).map((prog, index) => (
              <div key={prog.id || index} className="bg-white border border-[#e5eeea] rounded-3xl p-6 sm:p-8 pt-12 shadow-sm relative text-center flex flex-col items-center hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-[#064e3b] text-white rounded-full flex items-center justify-center absolute -top-7 left-1/2 -translate-x-1/2 border-4 border-[#f1f6f4] shadow-md">
                  <LucideIcon name={prog.icon || "book-open"} className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#064e3b] mb-3 mt-2">{prog.title}</h3>
                <p className="text-xs sm:text-sm text-[#4a6b5e]/90 leading-relaxed text-justify sm:text-center">
                  {prog.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : activeSubPage === "psb" ? (
        /* PENDAFTARAN SANTRI BARU (PSB) VIEW */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn bg-[#f1f6f4]">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#4a6b5e] mb-6 border-b border-[#e1eae6]/60 pb-3">
            <button 
              onClick={() => { setActiveSubPage("home"); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
              className="hover:text-[#064e3b] hover:underline font-bold transition-all text-[#10b981]"
            >
              Beranda
            </button>
            <span className="text-[#a1b8af]">/</span>
            <span className="text-[#064e3b] font-medium">Pendaftaran</span>
          </nav>

          {/* Title */}
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#064e3b] tracking-tight">Pendaftaran Santri Baru</h1>
            <p className="text-emerald-600/80 text-xl font-serif" style={{ fontFamily: 'Noto Sans Arabic, Scheherazade New, serif' }}>تسجيل الطلاب الجدد</p>
            <p className="text-xs sm:text-sm text-[#4a6b5e] leading-relaxed">
              Informasi persyaratan dan alur pendaftaran Pondok Pesantren {db.settings.nama_pesantren || db.settings.shop_name || hp.pesantren_name}
            </p>
          </div>

          {/* Big Green Banner Card */}
          <div className="bg-[#064e3b] text-white rounded-3xl p-6 sm:p-8 relative shadow-lg mb-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-base sm:text-xl font-extrabold flex items-center justify-center gap-2">
                <LucideIcon name="calendar" className="w-5 h-5 text-amber-400" />
                <span>Pendaftaran Santri Baru {hp.psb_settings?.year_academic || "TP. 2026/2027"}</span>
              </h2>
              {hp.psb_settings?.is_open ? (
                <p className="text-xs sm:text-sm text-emerald-100/85">
                  Pendaftaran dibuka mulai - sampai dengan - atau sampai kuota terpenuhi.
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-red-200 font-bold bg-red-900/40 border border-red-500/30 px-4 py-1.5 rounded-full inline-block mt-1">
                  Pendaftaran Ditutup
                </p>
              )}
            </div>

            {/* Stats Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
              <div className="bg-white/10 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-center border border-white/10 flex flex-col justify-center">
                <span className="text-emerald-300 font-normal text-[10px] uppercase tracking-wider mb-0.5">Total Kuota</span>
                <span>{hp.psb_settings?.quota_total || 191} Santri</span>
              </div>
              <div className="bg-white/10 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-center border border-white/10 flex flex-col justify-center">
                <span className="text-emerald-300 font-normal text-[10px] uppercase tracking-wider mb-0.5">Sudah Diterima</span>
                <span>{hp.psb_settings?.quota_accepted || 186} Santri</span>
              </div>
              <div className="bg-amber-500/20 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-center border border-amber-500/30 text-amber-300 flex flex-col justify-center">
                <span className="text-amber-400 font-normal text-[10px] uppercase tracking-wider mb-0.5">Sisa Kuota</span>
                <span>{hp.psb_settings?.quota_remaining || 5} Santri</span>
              </div>
            </div>

            {/* Santri Putra & Putri mini indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2 border-t border-white/10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <LucideIcon name="user" className="w-4 h-4 text-emerald-300" />
                  <span className="font-bold">Santri Putra</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-mono text-emerald-300">Target: 80 | Sisa: 2</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <LucideIcon name="user" className="w-4 h-4 text-emerald-300" />
                  <span className="font-bold">Santri Putri</span>
                </div>
                <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-mono text-emerald-300">Target: 111 | Sisa: 3</span>
              </div>
            </div>

            {/* Warning Alert */}
            {hp.psb_settings?.quota_alert_text && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 max-w-3xl mx-auto">
                <LucideIcon name="alert-triangle" className="w-4 h-4 shrink-0" />
                <span>{hp.psb_settings.quota_alert_text}</span>
              </div>
            )}
          </div>

          {/* Requirements & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-10">
            {/* Persyaratan */}
            <div className="bg-white border border-[#e5eeea] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-[#e1eae6] pb-3 flex items-center gap-2">
                <LucideIcon name="clipboard-list" className="w-5 h-5 text-[#10b981]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#064e3b]">Persyaratan Pendaftaran</h2>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#064e3b]">Persyaratan Umum</h3>
                <ul className="space-y-2 text-xs text-[#4a6b5e]">
                  {(hp.psb_settings?.requirements_umum || []).map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <LucideIcon name="check" className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-[#f1f6f4]">
                <h3 className="text-xs sm:text-sm font-bold text-[#064e3b]">Persyaratan Khusus</h3>
                <ul className="space-y-2 text-xs text-[#4a6b5e]">
                  {(hp.psb_settings?.requirements_khusus || []).map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <LucideIcon name="check" className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-[#f1f6f4]">
                <h3 className="text-xs sm:text-sm font-bold text-[#064e3b]">Dokumen yang Harus Disiapkan</h3>
                <ul className="space-y-2 text-xs text-[#4a6b5e]">
                  {(hp.psb_settings?.documents || []).map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <LucideIcon name="check" className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 text-[#855c1d] rounded-2xl text-[11px] leading-relaxed flex items-start gap-2">
                <LucideIcon name="alert-circle" className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>Semua dokumen akan diverifikasi saat pendaftaran ulang. Dokumen yang tidak lengkap dapat menyebabkan pembatalan penerimaan.</span>
              </div>
            </div>

            {/* Alur */}
            <div className="bg-white border border-[#e5eeea] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-[#e1eae6] pb-3 flex items-center gap-2">
                <LucideIcon name="git-pull-request" className="w-5 h-5 text-[#10b981]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#064e3b]">Alur Pendaftaran</h2>
              </div>

              <div className="space-y-5 relative pl-4 border-l-2 border-[#10b981]/20 ml-2">
                {(hp.psb_settings?.steps || []).map((step, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[27px] top-0 w-5 h-5 rounded-full bg-[#064e3b] text-white flex items-center justify-center text-[10px] font-bold">
                      {step.step_num}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#064e3b]">{step.title}</h4>
                    <p className="text-[11px] text-[#4a6b5e] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 text-[#2557a7] rounded-2xl text-[11px] leading-relaxed flex items-start gap-2">
                <LucideIcon name="info" className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>Proses seleksi dan verifikasi membutuhkan waktu maksimal 2x24 jam. Harap cek dashboard secara berkala.</span>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="border border-emerald-800/10 bg-white/50 rounded-3xl p-6 sm:p-10 text-center shadow-sm max-w-4xl mx-auto space-y-4 mb-10">
            <h3 className="text-lg sm:text-xl font-extrabold text-[#064e3b]">Siap Mendaftar?</h3>
            <p className="text-xs sm:text-sm text-[#4a6b5e]">Klik tombol di bawah ini untuk memulai proses pendaftaran online</p>
            <div className="pt-2">
              {hp.psb_settings?.is_open ? (
                <a 
                  href={hp.psb_settings.registration_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 bg-[#064e3b] hover:bg-[#043327] text-white font-bold rounded-xl shadow-lg shadow-[#064e3b]/15 transition-all inline-flex items-center gap-2"
                >
                  <LucideIcon name="user-plus" className="w-4 h-4" />
                  <span>Daftar Santri Baru</span>
                </a>
              ) : (
                <div className="bg-red-50 text-red-700 px-6 py-3 rounded-xl border border-red-200 text-sm font-bold inline-flex items-center gap-2">
                  <LucideIcon name="lock" className="w-4 h-4" />
                  <span>Pendaftaran Saat Ini Sedang Ditutup</span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 pt-2 flex items-center justify-center gap-1.5">
              <LucideIcon name="shield-alert" className="w-3.5 h-3.5 text-amber-500" />
              <span>Pastikan Anda telah membaca dan memahami persyaratan serta alur pendaftaran sebelum memulai.</span>
            </p>
          </div>

          {/* Contact Panitia */}
          <div className="bg-[#064e3b] text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2 border-b border-white/10 pb-2.5">
              <LucideIcon name="phone" className="w-5 h-5 text-amber-400" />
              <span>Kontak Panitia Pendaftaran</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">Panitia Putra</span>
                <span className="text-xs font-bold block">{hp.psb_settings?.contact_putra_nama}</span>
                <a href={`https://wa.me/${hp.psb_settings?.contact_putra_phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  <LucideIcon name="phone-call" className="w-3.5 h-3.5" />
                  <span>{hp.psb_settings?.contact_putra_phone}</span>
                </a>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">Panitia Putri</span>
                <span className="text-xs font-bold block">{hp.psb_settings?.contact_putri_nama}</span>
                <a href={`https://wa.me/${hp.psb_settings?.contact_putri_phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                  <LucideIcon name="phone-call" className="w-3.5 h-3.5" />
                  <span>{hp.psb_settings?.contact_putri_phone}</span>
                </a>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">Email</span>
                <span className="text-xs font-bold block truncate" title={hp.psb_settings?.contact_email}>{hp.psb_settings?.contact_email}</span>
                <span className="text-[10px] text-gray-300 block">Hubungi via Email Resmi</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">Jam Pelayanan</span>
                <span className="text-xs font-bold block whitespace-pre-line leading-relaxed">{hp.psb_settings?.contact_hours}</span>
              </div>
            </div>
          </div>
        </div>
      ) : selectedNews ? (
        /* NEWS DETAIL LAYOUT matching provided screenshot */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn bg-[#f1f6f4]">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-[#4a6b5e] mb-6 overflow-hidden whitespace-nowrap text-ellipsis border-b border-[#e1eae6]/60 pb-3">
            <button 
              onClick={() => setSelectedNewsId(null)} 
              className="hover:text-[#064e3b] hover:underline font-bold shrink-0 transition-all text-[#10b981]"
            >
              Beranda
            </button>
            <span className="text-[#a1b8af] shrink-0">/</span>
            <button 
              onClick={() => setSelectedNewsId(null)} 
              className="hover:text-[#064e3b] hover:underline font-bold shrink-0 transition-all text-[#10b981]"
            >
              Berita
            </button>
            <span className="text-[#a1b8af] shrink-0">/</span>
            <span className="text-[#064e3b] font-medium truncate">{selectedNews.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Main content (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-[#e5eeea] rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
              
              {/* Category tag if exists */}
              {selectedNews.category && (
                <span className="inline-block bg-[#10b981]/10 text-[#064e3b] border border-[#10b981]/20 text-[10px] sm:text-xs font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider">
                  {selectedNews.category}
                </span>
              )}

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#064e3b] leading-snug tracking-tight">
                {selectedNews.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#4a6b5e] border-b border-[#e1eae6] pb-4">
                <span className="flex items-center gap-1.5">
                  <LucideIcon name="calendar" className="w-4 h-4 text-[#10b981]" />
                  {selectedNews.date}
                </span>
                <span className="text-[#a1b8af] hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <LucideIcon name="user" className="w-4 h-4 text-[#10b981]" />
                  tree
                </span>
                <span className="text-[#a1b8af] hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <LucideIcon name="eye" className="w-4 h-4 text-[#10b981]" />
                  {Math.abs(selectedNews.title.length * 3 + 24) || 174} dilihat
                </span>
              </div>

              {/* Main Image */}
              <div className="aspect-[16/10] bg-emerald-950 rounded-2xl overflow-hidden border border-[#e1eae6] shadow-sm relative">
                {selectedNews.image ? (
                  <img 
                    src={selectedNews.image} 
                    alt={selectedNews.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🕌
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="text-sm sm:text-base text-[#204439] leading-relaxed whitespace-pre-line font-normal space-y-4 pt-2">
                {selectedNews.content}
              </div>

              {/* Share and Back button */}
              <div className="flex flex-col sm:flex-row justify-between items-center border-t border-[#e1eae6] pt-6 mt-8 gap-4">
                <button 
                  onClick={() => setSelectedNewsId(null)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#f1f6f4] hover:bg-[#e6f2ee] text-[#064e3b] font-bold rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-[#d1ded9]"
                >
                  <LucideIcon name="arrow-left" className="w-4 h-4" />
                  Kembali ke Beranda
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("✓ Tautan berita berhasil disalin!");
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#f1f6f4] text-[#064e3b] rounded-xl border border-[#d1ded9] text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
                >
                  <LucideIcon name="copy" className="w-4 h-4" />
                  <span>Bagikan Berita</span>
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Sidebar Section 1: Berita Terbaru */}
              <div className="bg-white border border-[#e5eeea] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <h2 className="text-sm sm:text-base font-extrabold text-[#064e3b] border-b border-[#e1eae6] pb-2.5 flex items-center gap-2">
                  <LucideIcon name="newspaper" className="w-4 h-4 text-[#10b981]" />
                  Berita Terbaru
                </h2>
                <div className="divide-y divide-[#f1f6f4]">
                  {(hp.news || []).slice(0, 5).map((item, index) => (
                    <div 
                      key={item.id || index} 
                      onClick={() => { setSelectedNewsId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="py-3.5 first:pt-0 last:pb-0 group cursor-pointer space-y-1.5"
                    >
                      <h3 className="text-xs sm:text-sm font-bold text-[#064e3b] group-hover:text-[#10b981] transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-[10px] text-[#4a6b5e] font-mono flex items-center gap-1">
                        <LucideIcon name="calendar" className="w-3.5 h-3.5 text-[#10b981]" />
                        {item.date}
                      </span>
                    </div>
                  ))}
                  {(hp.news || []).length === 0 && (
                    <p className="text-xs text-gray-500 italic py-4">Belum ada berita terbaru.</p>
                  )}
                </div>
              </div>

              {/* Sidebar Section 2: Berita Terkait (excluding current item) */}
              <div className="bg-white border border-[#e5eeea] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                <h2 className="text-sm sm:text-base font-extrabold text-[#064e3b] border-b border-[#e1eae6] pb-2.5 flex items-center gap-2">
                  <LucideIcon name="link-2" className="w-4 h-4 text-[#10b981]" />
                  Berita Terkait
                </h2>
                <div className="space-y-4">
                  {(hp.news || []).filter(item => item.id !== selectedNews.id).slice(0, 3).map((item, index) => (
                    <div 
                      key={item.id || index} 
                      onClick={() => { setSelectedNewsId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="flex gap-3 items-start group cursor-pointer"
                    >
                      <div className="w-16 h-12 rounded-lg bg-emerald-950 overflow-hidden shrink-0 border border-[#e1eae6]">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white">🕌</div>
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-xs font-bold text-[#064e3b] group-hover:text-[#10b981] transition-colors leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <span className="text-[9px] text-[#4a6b5e] font-mono flex items-center gap-1">
                          <LucideIcon name="calendar" className="w-3 h-3 text-[#10b981]" />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(hp.news || []).filter(item => item.id !== selectedNews.id).length === 0 && (
                    <p className="text-xs text-gray-500 italic py-2">Belum ada berita terkait lainnya.</p>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : (
        <>
          {/* HERO SECTION (Screenshot Match: Left text, Right mosque vector/image banner) */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#e6f2ee] via-[#f1f6f4] to-[#ffffff] pt-12 pb-20 sm:py-24 lg:py-28 border-b border-[#e1eae6]">
        {/* Soft elegant backgrounds decorations */}
        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-[#10b981]/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-16 left-[-10%] w-[30%] h-[50%] bg-[#10b981]/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10b981]/10 text-[#064e3b] rounded-full text-xs font-bold tracking-wide border border-[#10b981]/15">
                <span className="pulse-dot"></span>
                <span>Portal Sistem Terpadu</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#064e3b] leading-tight tracking-tight font-sans">
                {hp.hero_title}
              </h1>
              <p className="text-base sm:text-lg text-[#4a6b5e] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {hp.hero_subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
                <button 
                  onClick={() => scrollToRef(searchSectionRef)}
                  className="px-8 py-3.5 bg-[#064e3b] hover:bg-[#043327] text-white font-bold rounded-xl shadow-xl shadow-[#064e3b]/15 transition-all flex items-center justify-center gap-2.5"
                >
                  <LucideIcon name="search" className="w-5 h-5" />
                  <span>{hp.hero_btn_text}</span>
                </button>
                <button 
                  onClick={() => scrollToRef(aboutSectionRef)}
                  className="px-8 py-3.5 bg-[#ffffff] hover:bg-[#f8fbf9] text-[#064e3b] border border-[#d1ded9] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <LucideIcon name="info" className="w-5 h-5" />
                  <span>Tentang Kami</span>
                </button>
              </div>
            </div>

            {/* Right Column Pesantren Photo Container with Frame */}
            <div className="lg:col-span-6 relative flex justify-center">
              <div className="relative w-full max-w-lg lg:max-w-none">
                {/* Visual shadow glow back of image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#10b981]/20 to-[#064e3b]/10 rounded-3xl transform rotate-2 scale-105 filter blur-lg opacity-40" />
                
                {/* Main Image Frame matching Screenshot style */}
                <div className="relative border-4 border-white shadow-2xl rounded-3xl overflow-hidden aspect-[4/3] bg-emerald-950">
                  <img 
                    src={hp.hero_image} 
                    alt="Pesantren" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                  />
                  {/* Subtle glass overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Micro Float Indicator on image (stats count) */}
                <div className="absolute -bottom-6 -left-6 bg-white border border-[#e1eae6] rounded-2xl p-4 shadow-xl hidden sm:flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#10b981]/15 text-[#064e3b] rounded-xl flex items-center justify-center">
                    <LucideIcon name="users" className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-lg font-extrabold text-[#064e3b] -mb-1">{hp.about_stats_1.split(' ')[0]}</span>
                    <span className="text-[10px] text-[#4a6b5e] font-semibold">Santri Aktif Terdaftar</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* THREE FOCUS HIGHLIGHT CARDS (Screenshot Match: Three card widgets below hero) */}
      <section className="py-12 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {hp.cards.map((card, index) => (
              <div 
                key={index}
                className="bg-[#fcfdfd] border border-[#eef4f1] rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:border-[#10b981]/30 transition-all group cursor-pointer"
                onClick={() => {
                  if (card.icon === 'search') scrollToRef(searchSectionRef);
                  else if (card.icon === 'landmark') scrollToRef(aboutSectionRef);
                  else scrollToRef(contactSectionRef);
                }}
              >
                <div className="w-12 h-12 bg-[#10b981]/10 text-[#064e3b] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#10b981] group-hover:text-white transition-all">
                  <LucideIcon name={card.icon} className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#064e3b] mb-2 group-hover:text-[#10b981] transition-all">{card.title}</h3>
                <p className="text-xs sm:text-sm text-[#4a6b5e] leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT THE PESANTREN SECTION (Screenshot Match: About Section with stats & image on right) */}
      <section ref={aboutSectionRef} className="py-16 sm:py-24 bg-[#f8fbf9] border-t border-b border-[#e5eeea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Text */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-[#10b981] uppercase tracking-widest block font-mono">PROFIL SEJARAH</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#064e3b] leading-tight tracking-tight">
                {hp.about_title}
              </h2>
              <h3 className="text-base sm:text-lg font-bold text-[#10b981] -mt-2">
                {hp.about_subtitle}
              </h3>
              <p className="text-sm sm:text-base text-[#4a6b5e] leading-relaxed whitespace-pre-line">
                {hp.about_description}
              </p>

              {/* Statistics row */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-white border border-[#e1eae6] rounded-xl p-4 shadow-sm text-center">
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#064e3b] mb-1">{hp.about_stats_1}</span>
                  <span className="text-[11px] text-[#4a6b5e] font-semibold uppercase tracking-wider">Pendidikan</span>
                </div>
                <div className="bg-white border border-[#e1eae6] rounded-xl p-4 shadow-sm text-center">
                  <span className="block text-2xl sm:text-3xl font-extrabold text-[#064e3b] mb-1">{hp.about_stats_2}</span>
                  <span className="text-[11px] text-[#4a6b5e] font-semibold uppercase tracking-wider">Dedikasi</span>
                </div>
              </div>
            </div>

            {/* Right Photo */}
            <div className="lg:col-span-6">
              <div className="relative border-4 border-white shadow-xl rounded-3xl overflow-hidden aspect-[4/3] bg-emerald-950">
                <img 
                  src={hp.about_image} 
                  alt="Pesantren Detail" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SEARCH SANTRI SECTION (Interactive Public Student Search Widget!) */}
      <section ref={searchSectionRef} className="py-16 bg-white border-b border-[#e1eae6]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <span className="text-xs font-bold text-[#10b981] uppercase tracking-widest block font-mono">LAYANAN PUBLIK</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#064e3b]">Pencarian Data Santri Aktif</h2>
            <p className="text-xs sm:text-sm text-[#4a6b5e] max-w-lg mx-auto leading-relaxed">
              Ketikkan Nama Lengkap atau Nomor Induk Santri (ID) untuk melacak status dan detail kelas yang bersangkutan secara real-time.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-8 bg-[#f1f6f4] p-1.5 rounded-2xl border border-[#d1ded9]">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama santri atau ID (contoh: Ahmad, SNT-001)..."
              className="flex-grow bg-transparent border-0 px-4 py-2.5 text-xs sm:text-sm text-[#064e3b] focus:ring-0 focus:outline-none placeholder-[#829e94]"
            />
            <button 
              type="submit"
              className="px-5 sm:px-6 py-2.5 bg-[#064e3b] hover:bg-[#043327] text-white text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <LucideIcon name="search" className="w-4 h-4" />
              <span>Cari</span>
            </button>
          </form>

          {/* Search results display */}
          <div className="max-w-xl mx-auto">
            {hasSearched && searchResults.length > 0 && (
              <div className="space-y-3 animate-fadeIn">
                <span className="text-[11px] font-bold text-[#4a6b5e] block mb-2">Hasil Pencarian ({searchResults.length}):</span>
                {searchResults.map((s, idx) => (
                  <div key={idx} className="bg-[#fcfdfd] border border-[#e5eeea] rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#10b981]/10 rounded-full flex items-center justify-center text-[#064e3b] font-bold text-sm">
                        {s.nama_santri.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#064e3b]">{s.nama_santri}</h4>
                        <span className="text-[10px] text-[#4a6b5e] font-mono block">ID: {s.id_santri} • Kelas: {s.kelas}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-[10px] bg-emerald-100 text-[#064e3b] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">AKTIF</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasSearched && searchResults.length === 0 && (
              <div className="text-center py-6 bg-[#fdfaf5] border border-amber-100 rounded-2xl text-amber-800 text-xs flex flex-col items-center justify-center gap-2 animate-fadeIn">
                <LucideIcon name="alert-circle" className="w-5 h-5 text-amber-500" />
                <span>Santri dengan nama atau ID "<strong>{searchQuery}</strong>" tidak ditemukan. Pastikan ejaan benar.</span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* NEWS & BERITA SECTION */}
      <section ref={newsSectionRef} className="py-16 sm:py-24 bg-[#f8fbf9] border-t border-b border-[#e5eeea]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold text-[#10b981] uppercase tracking-widest block font-mono">INFORMASI TERKINI</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#064e3b]">Kabar & Berita Pesantren</h2>
            <p className="text-xs sm:text-sm text-[#4a6b5e] max-w-lg mx-auto leading-relaxed">
              Ikuti terus perkembangan, kegiatan harian, dan pengumuman resmi dari Pondok Pesantren kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(hp.news && hp.news.length > 0 ? hp.news : []).map((n, idx) => (
              <article 
                key={n.id || idx} 
                onClick={() => { setSelectedNewsId(n.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-white border border-[#eef4f1] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col group h-full cursor-pointer"
              >
                <div className="aspect-[16/10] bg-emerald-950 overflow-hidden relative">
                  {n.image ? (
                    <img 
                      src={n.image} 
                      alt={n.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-900 text-emerald-400 font-mono text-xs">
                      🕌 {db.settings.nama_pesantren || db.settings.shop_name || hp.pesantren_name}
                    </div>
                  )}
                  {n.category && (
                    <span className="absolute top-4 left-4 bg-[#064e3b] text-[#10b981] border border-[#10b981]/20 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {n.category}
                    </span>
                  )}
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-[#4a6b5e] font-mono flex items-center gap-1">
                      <LucideIcon name="calendar" className="w-3.5 h-3.5 text-[#10b981]" />
                      {n.date}
                    </span>
                    <h3 className="text-base font-bold text-[#064e3b] leading-snug group-hover:text-[#10b981] transition-all line-clamp-2">
                      {n.title}
                    </h3>
                    <p className="text-xs text-[#4a6b5e] leading-relaxed line-clamp-3 whitespace-pre-line">
                      {n.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {(!hp.news || hp.news.length === 0) && (
              <div className="col-span-full py-12 text-center text-sm text-gray-500 italic">
                Belum ada berita yang dipublikasikan.
              </div>
            )}
          </div>
        </div>
      </section>
        </>
      )}

      {/* CONTACT & FOOTER SECTION */}
      <section ref={contactSectionRef} className="bg-[#031d15] text-[#86a89c] pt-16 pb-12 border-t border-emerald-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-emerald-950/50 pb-12">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white/10 shrink-0">
                {db.settings.logo_url ? (
                  <img src={db.settings.logo_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-lg">🕌</span>
                )}
              </div>
              <span className="text-base font-bold text-white tracking-wide">
                {db.settings.nama_pesantren || db.settings.shop_name || hp.pesantren_name}
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              Sistem Portal Manajemen Terpadu mempermudah koordinasi keuangan cashless, perizinan keamanan, tabungan wali santri, dan laporan perkembangan asatidzah secara transparan.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Hubungi Kami</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <LucideIcon name="map-pin" className="w-4 h-4 text-[#10b981]" />
                <span>{hp.contact_address}</span>
              </li>
              <li className="flex items-center gap-2">
                <LucideIcon name="phone" className="w-4 h-4 text-[#10b981]" />
                <span>+{hp.contact_phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <LucideIcon name="mail" className="w-4 h-4 text-[#10b981]" />
                <span>{hp.contact_email}</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider uppercase">Akses Cepat</h4>
            <div className="flex flex-col gap-2 text-xs">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-left hover:text-white transition-all">↑ Kembali ke Atas</button>
              <button onClick={onEnterLogin} className="text-left hover:text-white transition-all flex items-center gap-1.5 text-amber-400 font-bold">
                <LucideIcon name="lock" className="w-3.5 h-3.5" />
                <span>Sesi Manajemen Staff</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copy */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs gap-4">
          <p>© 2026 {db.settings.nama_pesantren || db.settings.shop_name || hp.pesantren_name}. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-[#064e3b] text-white text-[10px] rounded font-semibold border border-emerald-800">Verified System</span>
            <span className="text-[10px] font-mono">v3.2.0</span>
          </div>
        </div>
      </section>

    </div>
  );
}
