"use client";

import React, { useState, useEffect } from "react";
import { 
  Coffee, 
  Moon, 
  Sun, 
  LogOut, 
  Package, 
  Bell,
  BookOpen,
  BarChart3,
  Settings,
  AlertTriangle,
  Megaphone,
  X,
  ArrowUpRight,
  Power,
  Share2
} from "lucide-react";
import { getAnnouncement, Announcement } from "@/lib/announcementService";
import { subscribeToStocks } from "@/lib/stockService";
import { BRANCH_REGIONS } from "@/lib/userService";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userRole, setUserRole] = useState<string>("waiter");
  const [userFullName, setUserFullName] = useState<string>("Personel");
  const [allowedMenus, setAllowedMenus] = useState<string[] | null>(null);

  // Bölge State'leri
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");
  const [allowedRegions, setAllowedRegions] = useState<string[] | null>(null);
  const [showRegionSwitcher, setShowRegionSwitcher] = useState(false);

  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  const [criticalCount, setCriticalCount] = useState(0);
  const [criticalItems, setCriticalItems] = useState<{ id: string; name: string; quantity: number; unit: string }[]>([]);
  const [sktWarnings, setSktWarnings] = useState<{ id: string; name: string; category: string; daysLeft: number }[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [annDismissed, setAnnDismissed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSharePage = async () => {
    const shareData = {
      title: "Değirmen Envanter",
      text: "Değirmen Kafe Stok ve Envanter Yönetim Paneli",
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage("Kopyalandı! Sayfa linkini dilediğiniz yerde paylaşabilirsiniz. 📋");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage("Kopyalandı! Sayfa linkini dilediğiniz yerde paylaşabilirsiniz. 📋");
        setTimeout(() => setToastMessage(null), 3000);
      } catch (copyErr) {
        console.error("Paylaşım hatası:", copyErr);
      }
    }
  };

  const handleSwitchRegion = (regionId: string) => {
    const activeUser = sessionStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      const regionName = BRANCH_REGIONS.find(r => r.id === regionId)?.name || regionId;
      
      const updatedUser = {
        ...parsed,
        selectedRegion: regionId,
        selectedRegionName: regionName
      };
      
      sessionStorage.setItem("activeUser", JSON.stringify(updatedUser));
      window.location.reload();
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Giriş yapan kullanıcının bilgilerini al
    const activeUser = sessionStorage.getItem("activeUser");
    let activeRegion = "degirmen-kafe";
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      setUserFullName(parsed.fullName || parsed.name || parsed.username || "Personel");
      setAllowedMenus(parsed.allowedMenus || null);
      
      const reg = parsed.selectedRegion || "degirmen-kafe";
      activeRegion = reg;
      setSelectedRegion(reg);
      setSelectedRegionName(parsed.selectedRegionName || "Değirmen Kafe");
      setAllowedRegions(parsed.allowedRegions || null);
    }

    // Gerçek zamanlı saat ve tarih güncelleyici
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTimeStr(`${hours}:${minutes} ${ampm}`);

      const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      setDateStr(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 60000); // 60 saniyede bir güncellensin (dakika)

    // Duyuru çek
    getAnnouncement().then(setAnnouncement);

    // Gerçek zamanlı Firestore stok analizi (kritik limit + SKT)
    const unsubscribe = subscribeToStocks(activeRegion, (currentStock) => {
      const critCount = currentStock.filter(item => item.quantity <= item.minLimit).length;
      setCriticalCount(critCount);

      const critItems = currentStock
        .filter(item => item.quantity <= item.minLimit)
        .map(item => ({ id: item.id, name: item.name, quantity: item.quantity, unit: item.unit }));
      setCriticalItems(critItems);

      const warnings: typeof sktWarnings = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      currentStock.forEach(item => {
        if (item.expDate) {
          const exp = new Date(item.expDate);
          exp.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 30) {
            warnings.push({ id: item.id, name: item.name, category: item.category, daysLeft: diffDays });
          }
        }
      });
      warnings.sort((a, b) => a.daysLeft - b.daysLeft);
      setSktWarnings(warnings);
    });

    return () => {
      unsubscribe();
      clearInterval(clockInterval);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Modülleri dinamik olarak yetkiye göre oluşturalım
  const modules = [
    { label: "Stok Kontrolü", active: true, path: "/dashboard/stok" },
    { label: "Stok Sayım", active: true, path: "/dashboard/stok-sayim" },
    { label: "Reçeteler", active: true, path: "/dashboard/receteler" },
    { label: "Sipariş Ver", active: true, path: "/dashboard/siparis" },
  ];

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Tüm Şube Stokları ve Aylık Stok Takibi yetkisini admin veya yoneticiye verelim
  if (userRole === "admin" || userRole === "yonetici") {
    modules.push({ label: "Tüm Şube Stokları", active: true, path: "/dashboard/tum-bolgeler-stok" });
    modules.push({ label: "Aylık Stok Takibi", active: true, path: "/dashboard/aylik-stok-takibi" });
  }

  // Ayarlar sadece admin
  if (userRole === "admin") {
    modules.push({ label: "Ayarlar", active: true, path: "/dashboard/ayarlar" });
  }

  const totalWarnings = criticalCount + sktWarnings.length;

  // Kısıtlı menü filtrelemesi (allowedMenus tanımlı ise sadece listedeki menüleri göster)
  const visibleModules = allowedMenus && allowedMenus.length > 0
    ? modules.filter(m => allowedMenus.includes(m.path))
    : modules;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* 1. ÜST BÖLGE (HEADER) */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        
        {/* Sol Taraf: Marka */}
        <div className="flex items-center gap-3 w-1/2">
          <div>
            <h1 className="font-black text-base tracking-tight leading-none text-[var(--foreground)]">
              {selectedRegionName}
            </h1>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5 block">Kontrol Paneli</span>
          </div>

          {/* Bölge Değiştirici Buton */}
          {(userRole === "admin" || userRole === "yonetici" || (allowedRegions && allowedRegions.length > 1)) && (
            <button
              onClick={() => setShowRegionSwitcher(true)}
              className="ml-2 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-extrabold rounded-lg shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Bölge Değiştir
            </button>
          )}
        </div>

        {/* Sağ Taraf: Aksiyon Butonları, Saat Dilimi & Çıkış */}
        <div className="flex items-center justify-end gap-4 w-1/2 relative">
          
          {/* Bildirim Çanı */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                showNotifDropdown 
                  ? "bg-zinc-800 text-white" 
                  : "hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)]"
              }`}
              title="Bildirimler"
            >
              <Bell className="w-5 h-5" />
              {totalWarnings > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 border border-[var(--card)] rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Bildirim Açılır Kapanır Kutusu (Dropdown) - Sınıflandırılmış / Kategorisel Model */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-12 w-80 bg-zinc-950/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-50 text-left animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="text-xs font-black text-zinc-200 uppercase tracking-wider">Bildirim Paneli</span>
                  <button 
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-[10px] text-zinc-500 hover:text-white font-bold"
                  >
                    Kapat
                  </button>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto no-scrollbar pr-1">
                  
                  {/* KATEGORİ 1: ÜRÜN BİLDİRİMLERİ (Kritik Stok & SKT) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-orange-500 tracking-widest border-b border-white/5 pb-1">
                      <span>📦 ÜRÜN BİLDİRİMLERİ</span>
                      <span className="ml-auto px-1.5 py-0.2 bg-orange-500/10 text-orange-400 rounded-md">
                        {criticalItems.length + sktWarnings.length}
                      </span>
                    </div>
                    {criticalItems.length === 0 && sktWarnings.length === 0 ? (
                      <p className="text-[9px] text-zinc-500 italic pl-1 py-1">Kritik stok veya SKT uyarısı yok.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {criticalItems.map(item => (
                          <div key={`crit-${item.id}`} className="flex items-start gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-[10px]">
                              <p className="font-bold text-zinc-200">{item.name}</p>
                              <p className="text-red-400 mt-0.5">Kritik sınırda! Kalan: {item.quantity} {item.unit}</p>
                            </div>
                          </div>
                        ))}
                        {sktWarnings.map(item => (
                          <div key={`skt-${item.id}`} className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[10px]">
                              <p className="font-bold text-zinc-200">{item.name}</p>
                              <p className="text-amber-400 mt-0.5">Son kullanma tarihine {item.daysLeft} gün kaldı!</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* KATEGORİ 2: DUYURU BİLDİRİMLERİ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500 tracking-widest border-b border-white/5 pb-1">
                      <span>📢 DUYURU BİLDİRİMLERİ</span>
                      <span className="ml-auto px-1.5 py-0.2 bg-blue-500/10 text-blue-400 rounded-md">
                        {announcement ? 1 : 0}
                      </span>
                    </div>
                    {announcement ? (
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px]">
                        <p className="font-black text-zinc-200">{announcement.title}</p>
                        <p className="text-zinc-400 mt-0.5">{announcement.message}</p>
                      </div>
                    ) : (
                      <p className="text-[9px] text-zinc-500 italic pl-1 py-1">Yeni duyuru bulunmuyor.</p>
                    )}
                  </div>

                  {/* KATEGORİ 3: SİSTEM VE BAKIM BİLDİRİMLERİ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-emerald-500 tracking-widest border-b border-white/5 pb-1">
                      <span>🛠️ SİSTEM VE BAKIM BİLDİRİMLERİ</span>
                      <span className="ml-auto px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 rounded-md">1</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0 animate-ping" />
                      <div>
                        <p className="font-black text-zinc-200">Tüm Servisler Aktif</p>
                        <p className="text-zinc-400 mt-0.5">Sistem sorunsuz çalışıyor. Planlı bir bakım çalışması bulunmamaktadır.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSharePage}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            title="Sayfayı Paylaş"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="h-6 w-[1px] bg-[var(--border)]"></div>

          {/* Görsel 2 Saat Dilimi */}
          <div className="text-right select-none pr-1">
            <div className="text-xs font-black tracking-tight text-[var(--foreground)] leading-none">
              {timeStr}
            </div>
            <div className="text-[8px] font-bold text-zinc-400 mt-1.5 uppercase tracking-widest">
              {dateStr}
            </div>
          </div>

          {/* Çıkış Butonu (Görsel 2 Kapama / Power Butonu Modeli) */}
          <button 
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-full bg-zinc-950 dark:bg-zinc-900 border border-white/5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 flex items-center justify-center transition-all duration-300 shadow hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            title="Çıkış Yap"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DUYURU BANNER */}
      {announcement && !annDismissed && (() => {
        const styles: Record<string, { barColor: string; bgColor: string; borderColor: string; textColor: string; label: string }> = {
          info:     { barColor: "#3b82f6", bgColor: "rgba(59,130,246,0.08)",  borderColor: "rgba(59,130,246,0.25)",  textColor: "#93c5fd", label: "BİLGİ"  },
          warning:  { barColor: "#f59e0b", bgColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)", textColor: "#fcd34d", label: "UYARI"  },
          critical: { barColor: "#ef4444", bgColor: "rgba(239,68,68,0.08)",  borderColor: "rgba(239,68,68,0.25)",  textColor: "#fca5a5", label: "KRİTİK" },
        };
        const s = styles[announcement.type] ?? styles.info;
        return (
          <div style={{ background: s.bgColor, borderBottom: `1px solid ${s.borderColor}`, position: "relative", width: "100%" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: s.barColor, borderRadius: "0 2px 2px 0" }} />
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
              <Megaphone style={{ color: s.textColor }} className="w-4 h-4 shrink-0" />
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shrink-0"
                style={{ color: s.textColor, background: s.bgColor, border: `1px solid ${s.borderColor}` }}
              >
                {s.label}
              </span>
              <span className="text-sm font-bold truncate" style={{ color: s.textColor }}>{announcement.title}</span>
              <span className="text-sm text-zinc-400 hidden sm:block shrink-0">— {announcement.message}</span>
              <button
                onClick={() => setAnnDismissed(true)}
                className="ml-auto text-xs font-bold text-zinc-500 hover:text-zinc-300"
              >
                Kapat
              </button>
            </div>
          </div>
        );
      })()}


      {/* 2. ORTA BÖLGE (MAIN) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col items-center justify-center gap-8">
        
        {/* Karşılama Alanı */}
        <div className="text-center flex flex-col items-center gap-4 animate-fadeIn -mt-10">
          {/* Logo size increased and dark mode invert-adjustment applied */}
          <div className="w-[30rem] h-[30rem] flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain logo-invert-dark" />
          </div>
          
          {/* Görsel 2 Karşılama Stili */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 my-2">
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-[var(--foreground)] leading-none">
              Merhaba,
            </h2>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-3xl border-2 border-dashed border-emerald-500 bg-emerald-500/5 shadow-inner">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                +
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-500 tracking-tight leading-none">
                {userFullName}
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#ea580c] text-center max-w-xl">
            Barista Ürün Yönetim, Reçete, Stok Kontrol Paneli
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto text-xs">
            Erişmek istediğiniz cafe modülünü seçin. Kartların üzerine gelerek detayları görebilirsiniz.
          </p>
        </div>

        {/* SKT UYARI ALANI (Tüm Kullanıcılar Görür) */}
        {sktWarnings.length > 0 && (
          <div className="w-full max-w-4xl bg-amber-500/5 border border-amber-500/20 rounded-3xl p-5 space-y-3 animate-pulse">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>DİKKAT: Son Tüketim Tarihi (SKT) Yaklaşan Hammaddeler!</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sktWarnings.map(w => (
                <div 
                  key={w.id} 
                  className={`p-3 rounded-2xl border text-xs flex flex-col justify-between gap-1.5 ${
                    w.daysLeft < 0 
                      ? "bg-red-500/10 border-red-500/30 text-red-400 font-black animate-pulse" 
                      : "bg-[var(--card)] border-[var(--border)] text-zinc-300 font-semibold"
                  }`}
                >
                  <div>
                    <div className="truncate font-bold">{w.name}</div>
                    <div className="text-[9px] text-zinc-500 uppercase">{w.category}</div>
                  </div>
                  <div className="text-[10px] font-bold">
                    {w.daysLeft < 0 ? (
                      <span className="text-red-500">Tarihi Geçti ({Math.abs(w.daysLeft)} Gün Önce!)</span>
                    ) : (
                      <span className="text-amber-500">Son {w.daysLeft} Gün Kaldı!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dinamik Kartlar Grid (Görseldeki Asimetrik Cutout Tasarımı) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full justify-items-center py-6 max-w-5xl">
          {visibleModules.map((item, idx) => {
            // Alternate styles: steel (index 0, 2, 4...) and peach (index 1, 3...)
            const isSteel = idx % 2 === 0;
            
            if (isSteel) {
              // Deep Charcoal Blue Card layout with Neon Glow (No borders)
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    if (item.path !== "#") router.push(item.path);
                  }}
                  className="relative w-full max-w-[290px] h-[190px] bg-[#264653] hover:bg-[#345e70] dark:bg-[#1a3039] dark:hover:bg-[#203c48] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(231,111,81,0.12)] hover:shadow-[0_0_30px_rgba(231,111,81,0.45)] hover:-translate-y-1 select-none overflow-hidden group"
                >
                  {/* Top-Left Cutout (Concave Corner for Arrow Button) */}
                  <div className="absolute top-0 left-0 w-14 h-14 bg-[var(--background)] rounded-br-[2rem] transition-colors duration-300">
                    <div className="absolute top-0 left-0 w-9 h-9 bg-[#264653] group-hover:bg-[#345e70] dark:bg-[#1a3039] dark:group-hover:bg-[#203c48] text-[#e76f51] flex items-center justify-center rounded-xl shadow-sm transition-colors duration-300">
                      <ArrowUpRight className="w-4 h-4 -rotate-90" />
                    </div>
                  </div>

                  {/* Bottom-Right Cutout (Concave Corner for Text Label) */}
                  <div className="absolute bottom-0 right-0 w-28 h-10 bg-[var(--background)] rounded-tl-[1.5rem] transition-colors duration-300">
                    <div className="absolute bottom-0 right-0 px-3 py-1.5 bg-[#264653] group-hover:bg-[#345e70] dark:bg-[#1a3039] dark:group-hover:bg-[#203c48] text-[9px] font-black uppercase text-[#e76f51] tracking-widest rounded-lg transition-colors duration-300">
                      DEĞİRMEN
                    </div>
                  </div>

                  {/* Centered Large Menu Title */}
                  <div className="text-center z-10 px-4 mt-2">
                    <span 
                      style={{ fontFamily: "'Getai Grotesk', sans-serif" }}
                      className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-[#e76f51] leading-tight block drop-shadow-sm"
                    >
                      {item.label}
                    </span>
                  </div>

                </div>
              );
            } else {
              // Yanmış Şeftali Card layout with Neon Glow (No borders)
              return (
                <div 
                  key={idx}
                  onClick={() => {
                    if (item.path !== "#") router.push(item.path);
                  }}
                  className="relative w-full max-w-[290px] h-[190px] bg-[#e76f51] hover:bg-[#eb8870] dark:bg-[#a6442d] dark:hover:bg-[#c25137] rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(231,111,81,0.12)] hover:shadow-[0_0_30px_rgba(231,111,81,0.45)] hover:-translate-y-1 select-none overflow-hidden group"
                >
                  {/* Top-Right Cutout (Concave Corner for Arrow Button) */}
                  <div className="absolute top-0 right-0 w-14 h-14 bg-[var(--background)] rounded-bl-[2rem] transition-colors duration-300">
                    <div className="absolute top-0 right-0 w-9 h-9 bg-[#e76f51] group-hover:bg-[#eb8870] dark:bg-[#a6442d] dark:group-hover:bg-[#c25137] text-[#264653] dark:text-zinc-950 flex items-center justify-center rounded-xl shadow-sm transition-colors duration-300">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Bottom-Left Cutout (Concave Corner for Text Label) */}
                  <div className="absolute bottom-0 left-0 w-28 h-10 bg-[var(--background)] rounded-tr-[1.5rem] transition-colors duration-300">
                    <div className="absolute bottom-0 left-0 px-3 py-1.5 bg-[#e76f51] group-hover:bg-[#eb8870] dark:bg-[#a6442d] dark:group-hover:bg-[#c25137] text-[9px] font-black uppercase text-[#264653] dark:text-zinc-950 tracking-widest rounded-lg transition-colors duration-300">
                      {item.label === "Sipariş Ver" ? "SİPARİŞ" : item.label === "Tüm Şube Stokları" ? "ANALİZ" : "CAFE"}
                    </div>
                  </div>

                  {/* Centered Large Menu Title */}
                  <div className="text-center z-10 px-4 mt-2">
                    <span 
                      style={{ fontFamily: "'Getai Grotesk', sans-serif" }}
                      className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-[#264653] dark:text-zinc-950 leading-tight block drop-shadow-sm"
                    >
                      {item.label}
                    </span>
                  </div>

                </div>
              );
            }
          })}
        </div>

      </main>

      {/* 3. ALT BÖLGE (FOOTER) */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>
          <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        </div>
      </footer>

      {/* Bölge Değiştirici Modalı */}
      {showRegionSwitcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-[440px] bg-[var(--card)] border border-[var(--border)] rounded-[2.5rem] p-8 shadow-2xl relative space-y-6">
            
            {/* Kapat Butonu */}
            <button
              onClick={() => setShowRegionSwitcher(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[var(--foreground)]/10 text-zinc-400 hover:text-[var(--foreground)] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <h2 className="text-lg font-black tracking-tight text-[var(--foreground)]">Aktif Çalışma Bölgesi</h2>
              <p className="text-xs text-zinc-500">
                Geçiş yapmak istediğiniz şubeyi seçin. Stok verileriniz seçilen şubeye göre filtrelenecektir.
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {(() => {
                let userRegions = BRANCH_REGIONS;
                if (allowedRegions && allowedRegions.length > 0 && userRole !== "admin" && userRole !== "yonetici") {
                  userRegions = BRANCH_REGIONS.filter(r => allowedRegions.includes(r.id));
                }
                return userRegions.map((region) => {
                  const isCurrent = region.id === selectedRegion;
                  return (
                    <button
                      key={region.id}
                      disabled={isCurrent}
                      onClick={() => handleSwitchRegion(region.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                        isCurrent 
                          ? "bg-orange-500/10 border-orange-500/35 text-orange-400 cursor-not-allowed" 
                          : "bg-[var(--background)]/40 border-[var(--border)] text-zinc-300 hover:bg-orange-500/5 hover:border-orange-500/20 hover:text-orange-400 cursor-pointer hover:-translate-y-0.5"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{region.name}</span>
                        <span className="text-[9px] text-zinc-500">{isCurrent ? "Şu Anki Aktif Şubeniz" : "Geçiş Yapmak İçin Tıklayın"}</span>
                      </div>
                      {!isCurrent && (
                        <div className="w-7 h-7 rounded-lg bg-[var(--foreground)]/5 group-hover:bg-orange-500/20 flex items-center justify-center text-zinc-500 group-hover:text-orange-400 transition-all">
                          →
                        </div>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Toast Bildirim */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md animate-slideUp">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
