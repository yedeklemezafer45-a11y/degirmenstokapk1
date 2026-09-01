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
import { BRANCH_REGIONS, getDynamicRegions, BranchRegion } from "@/lib/userService";
import { isProductAllowedForRegion } from "@/lib/stockStore";
import { useRouter } from "next/navigation";
import { 
  getLatestShiftHandover, 
  getActiveShiftStatus, 
  saveShiftHandover, 
  ShiftHandover, 
  ActiveShiftStatus 
} from "@/lib/shiftService";

export default function DashboardPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userRole, setUserRole] = useState<string>("waiter");
  const [userFullName, setUserFullName] = useState<string>("Personel");
  const [username, setUsername] = useState<string>("");
  const [allowedMenus, setAllowedMenus] = useState<string[] | null>(null);

  // Vardiya (Shift) Handover State'leri
  const [latestHandover, setLatestHandover] = useState<ShiftHandover | null>(null);
  const [activeShiftStatus, setActiveShiftStatus] = useState<ActiveShiftStatus | null>(null);
  const [showBlurWarning, setShowBlurWarning] = useState(false);
  const [handoverNote, setHandoverNote] = useState("");
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  // Bölge State'leri
  const [selectedRegion, setSelectedRegion] = useState("degirmen-kafe");
  const [selectedRegionName, setSelectedRegionName] = useState("Değirmen Kafe");
  const [allowedRegions, setAllowedRegions] = useState<string[] | null>(null);
  const [activeRegions, setActiveRegions] = useState<BranchRegion[]>(BRANCH_REGIONS);
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
      const regionName = activeRegions.find(r => r.id === regionId)?.name || regionId;
      
      const updatedUser = {
        ...parsed,
        selectedRegion: regionId,
        selectedRegionName: regionName
      };
      
      sessionStorage.setItem("activeUser", JSON.stringify(updatedUser));
      window.location.reload();
    }
  };

  const fetchShiftInfo = async (regionId: string, currentUsername: string) => {
    try {
      const latest = await getLatestShiftHandover(regionId);
      setLatestHandover(latest);

      // Önceki vardiyayı kapatan kişi mevcut kullanıcı değilse ve veri girişi yapmadıysa blur uyarısı
      if (latest && !latest.hasDataEntry && latest.closedBy !== currentUsername) {
        setShowBlurWarning(true);
      } else {
        setShowBlurWarning(false);
      }

      const activeStatus = await getActiveShiftStatus(regionId);
      setActiveShiftStatus(activeStatus);
    } catch (err) {
      console.error("fetchShiftInfo error:", err);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNote.trim()) {
      alert("Lütfen bir sonraki vardiyadaki arkadaşınız için bir not bırakın.");
      return;
    }

    setIsSubmittingHandover(true);
    try {
      const hasEntry = activeShiftStatus ? activeShiftStatus.hasDataEntry : false;
      await saveShiftHandover(
        selectedRegion,
        username,
        userFullName,
        handoverNote.trim(),
        hasEntry
      );

      setHandoverNote("");
      setToastMessage("Vardiya başarıyla kapatıldı! 📋");
      setTimeout(() => setToastMessage(null), 3000);

      await fetchShiftInfo(selectedRegion, username);
    } catch (err) {
      console.error("handleCloseShift error:", err);
      alert("Vardiya kapatılırken hata oldu!");
    } finally {
      setIsSubmittingHandover(false);
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
    let activeUsername = "";
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      setUserFullName(parsed.fullName || parsed.name || parsed.username || "Personel");
      setUsername(parsed.username || "");
      setAllowedMenus(parsed.allowedMenus || null);
      
      const reg = parsed.selectedRegion || "degirmen-kafe";
      activeRegion = reg;
      setSelectedRegion(reg);
      setSelectedRegionName(parsed.selectedRegionName || "Değirmen Kafe");
      setAllowedRegions(parsed.allowedRegions || null);
      activeUsername = parsed.username || "";
    }

    getDynamicRegions().then(setActiveRegions);

    fetchShiftInfo(activeRegion, activeUsername);

    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTimeStr(`${hours}:${minutes}`);

      const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      setDateStr(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    };
    updateClock();
    const clockInterval = setInterval(updateClock, 60000); // 60 saniyede bir güncellensin (dakika)

    // Duyuru çek
    getAnnouncement().then(setAnnouncement);

    // Gerçek zamanlı Firestore stok analizi (kritik limit + SKT)
    const unsubscribe = subscribeToStocks(activeRegion, (currentStock) => {
      const allowedStock = currentStock.filter(item => {
        if (activeRegion === "degirmen-kafe" && (item.category === "Soft İçecek Ürünleri" || item.category === "Pastalar")) {
          return false;
        }
        return isProductAllowedForRegion(activeRegion, item);
      });

      const critCount = allowedStock.filter(item => item.quantity <= item.minLimit).length;
      setCriticalCount(critCount);

      const critItems = allowedStock
        .filter(item => item.quantity <= item.minLimit)
        .map(item => ({ id: item.id, name: item.name, quantity: item.quantity, unit: item.unit }));
      setCriticalItems(critItems);

      const warnings: typeof sktWarnings = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      allowedStock.forEach(item => {
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
    { 
      label: "STOK KONTROLÜ", 
      bullets: [
        "DEPO GİRDİ / ÇIKTI İŞLEMLERİ",
        "ANLIK ŞUBE STOK TAKİBİ",
        "KRİTİK LİMİT & SKT UYARILARI"
      ],
      active: true, 
      path: "/dashboard/stok",
      colorGradient: "from-blue-400 via-indigo-400 to-purple-400"
    },
    { 
      label: "STOK SAYIM", 
      bullets: [
        "FİZİKİ DÖNEM STOK SAYIMI",
        "GRAMAJ & LİTRE HESAPLAMA",
        "SAYIM RAPORU & PDF ÇIKTISI"
      ],
      active: true, 
      path: "/dashboard/stok-sayim",
      colorGradient: "from-emerald-400 via-teal-400 to-cyan-400"
    },
    { 
      label: "REÇETELER", 
      bullets: [
        "TÜM KAHVE & İÇECEK LİSTESİ",
        "GRAMAJ VE HAZIRLANIŞ TARİFİ",
        "BARİSTA STANDARTLARI"
      ],
      active: true, 
      path: "/dashboard/receteler",
      colorGradient: "from-amber-400 via-orange-400 to-rose-400"
    },
    { 
      label: "SİPARİŞ VER", 
      bullets: [
        "GENEL MALZEME SİPARİŞİ",
        "SOFT İÇECEK AYRI SEPETİ",
        "TEK TIKLA WHATSAPP İLETİMİ"
      ],
      active: true, 
      path: "/dashboard/siparis",
      colorGradient: "from-cyan-400 via-sky-400 to-blue-500"
    },
  ];

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Tüm Şube Stokları ve Aylık Stok Takibi yetkisini admin veya yoneticiye verelim
  if (userRole === "admin" || userRole === "yonetici") {
    modules.push({ 
      label: "TÜM ŞUBELER", 
      bullets: [
        "TÜM ŞUBELERİN ANLIK STOKLARI",
        "ŞUBELER ARASI STOK KIYASLAMA",
        "MERKEZİ ENVANTER RAPORU"
      ],
      active: true, 
      path: "/dashboard/tum-bolgeler-stok",
      colorGradient: "from-fuchsia-400 via-pink-400 to-rose-400"
    });
    modules.push({ 
      label: "AYLIK STOK TAKİBİ", 
      bullets: [
        "DÖNEM SONU SAYIM RAPORLARI",
        "ÖMÜR BOYU KALICI ARŞİV",
        "DÖNEMLER ARASI FARK ANALİZİ"
      ],
      active: true, 
      path: "/dashboard/aylik-stok-takibi",
      colorGradient: "from-purple-400 via-violet-400 to-indigo-400"
    });
  }

  // Ayarlar sadece admin
  if (userRole === "admin") {
    modules.push({ 
      label: "AYARLAR", 
      bullets: [
        "STOK LİSTESİ",
        "REÇETE KONTROLÜ",
        "STK TAKİP VS AYARLAR KISMI"
      ],
      active: true, 
      path: "/dashboard/ayarlar",
      colorGradient: "from-violet-400 via-indigo-400 to-cyan-400"
    });
  }

  const totalWarnings = criticalCount + sktWarnings.length;

  const visibleModules = allowedMenus && allowedMenus.length > 0
    ? modules.filter(m => allowedMenus.includes(m.path))
    : modules;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 relative">
      
      {/* Blur warning modal outside the main layout container */}
      {showBlurWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-950/95 border border-red-500/30 rounded-[2.5rem] p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-red-500 tracking-tight">UYARI: Nöbet Devir Hatası!</h2>
              <p className="text-sm text-zinc-300 leading-relaxed font-semibold">
                Önceki vardiyadaki personel, vardiya sonunda **depodan alınan ürünlerin veri girişini yapmadı!**
              </p>
              <p className="text-xs text-zinc-500">
                Lütfen sisteme devam etmeden önce bu durumu not edin ve gerekiyorsa yöneticinize bildirin.
              </p>
            </div>
            <button
              onClick={() => setShowBlurWarning(false)}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer uppercase tracking-wider text-xs"
            >
              Anladım, Devam Et
            </button>
          </div>
        </div>
      )}

      {/* Main page content wrapped in blur styling if warning active */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ${showBlurWarning ? "filter blur-md pointer-events-none" : ""}`}>
        {/* 1. ÜST BÖLGE (HEADER) */}
        <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        
        {/* Sol Taraf: Marka */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <h1 className="font-black text-xs sm:text-base tracking-tight leading-none text-[var(--foreground)] truncate" title={selectedRegionName}>
              {selectedRegionName}
            </h1>
            <span className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1 sm:mt-1.5 block">Kontrol Paneli</span>
          </div>

          {/* Bölge Değiştirici Buton */}
          {(userRole === "admin" || userRole === "yonetici" || (allowedRegions && allowedRegions.length > 1)) && (
            <button
              onClick={() => setShowRegionSwitcher(true)}
              className="ml-1 sm:ml-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[9px] sm:text-[10px] font-extrabold rounded-lg shadow-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider shrink-0"
            >
              Bölge Değiştir
            </button>
          )}
        </div>

        {/* Sağ Taraf: Aksiyon Butonları, Saat Dilimi & Çıkış */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-4 shrink-0 relative">
          
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

          <div className="hidden sm:block h-6 w-[1px] bg-[var(--border)]"></div>

          {/* Görsel 2 Saat Dilimi */}
          <div className="hidden sm:block text-right select-none pr-1">
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

          {/* Bildirim Açılır Kapanır Kutusu (Dropdown) - Sınıflandırılmış / Kategorisel Model */}
          {showNotifDropdown && (
            <div className="absolute right-0 top-14 w-80 bg-zinc-950/95 border border-white/10 backdrop-blur-xl rounded-2xl p-4 shadow-2xl z-50 text-left animate-fadeIn">
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

        {/* Vardiya Notları & Nöbet Devri Paneli */}
        <div className="w-full max-w-4xl bg-[var(--card)] border border-[var(--border)] rounded-[2rem] p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-6 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
            
            {/* Sol Kolon: Son Vardiya Notu */}
            <div className="flex-1 pb-6 md:pb-0 md:pr-6 space-y-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Son Vardiya Notu
                </h3>
              </div>

              {latestHandover ? (
                <div className="bg-[var(--background)]/60 border border-[var(--border)] rounded-2xl p-4 space-y-3">
                  <p className="text-xs italic text-zinc-750 dark:text-zinc-300 font-medium">
                    "{latestHandover.note}"
                  </p>
                  
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border)]/65 text-[10px] text-zinc-500 font-semibold">
                    <div className="flex justify-between">
                      <span>Kapatan:</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold">{latestHandover.closedByName} (@{latestHandover.closedBy})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kapatma Zamanı:</span>
                      <span className="text-zinc-700 dark:text-zinc-300 font-bold">{latestHandover.closedAt}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vardiya Sonu Veri Girişi:</span>
                      {latestHandover.hasDataEntry ? (
                        <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                          ✓ Yapıldı
                        </span>
                      ) : (
                        <span className="text-red-500 font-extrabold flex items-center gap-1">
                          ✗ Yapılmadı!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Henüz kaydedilmiş bir vardiya notu bulunmamaktadır.</p>
              )}
            </div>

            {/* Sağ Kolon: Vardiyayı Kapat */}
            <form onSubmit={handleCloseShift} className="flex-1 pt-6 md:pt-0 md:pl-6 space-y-4">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Power className="w-5 h-5 text-red-500" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Vardiyayı Kapat (Nöbet Devri)
                  </h3>
                </div>
                
                {/* Mevcut Vardiya Durumu */}
                <div className="text-[10px] font-bold">
                  {activeShiftStatus?.hasDataEntry ? (
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-xl border border-emerald-500/20">
                      ✓ Veri Girişi Yapıldı
                    </span>
                  ) : (
                    <span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded-xl border border-orange-500/20">
                      ⚠️ Depodan Giriş Yapılmadı
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  placeholder="Bir sonraki vardiyadaki arkadaşınız için not bırakın... (Örn: 'Yulaf sütü bitti, 2. değirmenin ince ayarı biraz kaçıyor')"
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 h-20 resize-none font-medium placeholder-zinc-500"
                />

                <button
                  type="submit"
                  disabled={isSubmittingHandover}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  {isSubmittingHandover ? "Kaydediliyor..." : "Vardiyayı Kapat ve Devret"}
                </button>
              </div>
            </form>

          </div>
        </div>

        {/* Dinamik Kartlar Grid (Klasör Tasarımı) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full justify-items-center py-6 max-w-6xl">
          {visibleModules.map((item, idx) => {
            const seqNumber = String(idx + 1).padStart(2, "0");

            return (
              <div 
                key={idx}
                onClick={() => {
                  if (item.path !== "#") router.push(item.path);
                }}
                className="relative w-full max-w-[320px] h-[340px] rounded-[2.75rem] border-[5px] border-black bg-white shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between group select-none"
              >
                {/* 1. ÜST BEYAZ ALAN: LOGO VE BAŞLIK */}
                <div className="w-full h-[110px] bg-white flex items-center justify-end pr-5 pt-3 relative">
                  <div className="flex items-center gap-2 select-none">
                    <div className="w-14 h-14 flex items-center justify-center">
                      <img 
                        src="/logo.png" 
                        alt="Değirmen Kafe" 
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" 
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black tracking-tight text-zinc-950 leading-tight">
                        DEĞİRMEN<br />KAFE
                      </div>
                      <div className="text-[11px] font-semibold italic text-[#1d3557] tracking-tight font-serif mt-0.5">
                        Bilişim Paneli
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ALT SİYAH GÖVDE (KLASÖR KESİMİ VE SEKMELİ YAPI) */}
                <div className="relative flex-1 bg-[#0d0d10] rounded-b-[2.35rem] px-6 py-5 flex flex-col justify-between text-left">
                  
                  {/* Klasör Üst Sekme Çıkıntısı (Folder Tab) */}
                  <div className="absolute -top-7 left-0 h-8 w-[62%] bg-[#0d0d10] rounded-t-2xl flex items-center px-6">
                    <span className={`text-xs sm:text-sm font-black tracking-wider bg-gradient-to-r ${item.colorGradient} bg-clip-text text-transparent uppercase truncate`}>
                      {item.label}
                    </span>
                  </div>
                  
                  {/* Sekme sağ geçiş kavisi */}
                  <div className="absolute -top-7 left-[62%] w-5 h-7 overflow-hidden pointer-events-none">
                    <div className="w-10 h-10 rounded-bl-2xl bg-white -mt-3 -ml-5" />
                  </div>

                  {/* Maddeler / Alt Açıklamalar */}
                  <div className="mt-3 space-y-2">
                    {item.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2 text-[11px] font-extrabold text-zinc-400 tracking-wide uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                        <span className="truncate">{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* Alt Kısım: SIRA NUMARASI */}
                  <div className="flex items-baseline gap-2 pt-4 border-t border-zinc-900 select-none">
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                      {seqNumber}
                    </span>
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                      SIRA
                    </span>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* 3. ALT BÖLGE (FOOTER) */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>
          <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        </div>
      </footer>

      </div>

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
                let userRegions = activeRegions;
                if (allowedRegions && allowedRegions.length > 0 && userRole !== "admin" && userRole !== "yonetici") {
                  userRegions = activeRegions.filter(r => allowedRegions.includes(r.id));
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
