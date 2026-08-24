"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  LogOut, 
  Package, 
  ShieldAlert,
  BookOpen,
  Calendar,
  History,
  Megaphone,
  Music,
  ArrowUpRight,
  Share2,
  ShoppingCart,
  Check
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AyarlarPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [userRole, setUserRole] = useState<string>("waiter");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
        triggerToast("Sayfa linki kopyalandı! Paylaşmak istediğiniz yere yapıştırabilirsiniz. 📋");
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        triggerToast("Sayfa linki kopyalandı! Paylaşmak istediğiniz yere yapıştırabilirsiniz. 📋");
      } catch (copyErr) {
        console.error("Paylaşım hatası:", copyErr);
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Rol Kontrolü (Sadece Admin girebilir)
    const activeUser = sessionStorage.getItem("activeUser");
    if (activeUser) {
      const parsed = JSON.parse(activeUser);
      setUserRole(parsed.role || "waiter");
      if (parsed.role !== "admin") {
        window.location.href = "/dashboard";
      }
    } else {
      window.location.href = "/";
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme;
  };

  if (userRole !== "admin") {
    return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">Yetkilendiriliyor...</div>;
  }

  const settingsModules = [
    { label: "Stok Listesi Kontrolü", path: "/dashboard/ayarlar/stok-kontrolu", icon: <Package className="w-5 h-5" />, tag: "ENVANTER" },
    { label: "Reçeteler Listesi Kontrolü", path: "/dashboard/ayarlar/recete-kontrolu", icon: <BookOpen className="w-5 h-5" />, tag: "REÇETE" },
    { label: "SKT Takip Kontrolü", path: "/dashboard/ayarlar/skt-kontrolu", icon: <Calendar className="w-5 h-5" />, tag: "TAKİP" },
    { label: "Yetki & Personel Ayarları", path: "/dashboard/ayarlar/personel-yetkileri", icon: <ShieldAlert className="w-5 h-5" />, tag: "YETKİ" },
    { label: "Kullanıcı İşlem Geçmişi", path: "/dashboard/ayarlar/islem-gecmisi", icon: <History className="w-5 h-5" />, tag: "GÜNLÜK" },
    { label: "Duyuru Yönetimi", path: "/dashboard/ayarlar/duyuru-yonetimi", icon: <Megaphone className="w-5 h-5" />, tag: "DUYURU" },
    { label: "Sipariş Menüsü Ayarları", path: "/dashboard/ayarlar/siparis-ayarlari", icon: <ShoppingCart className="w-5 h-5" />, tag: "SİPARİŞ" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-xl hover:bg-[var(--foreground)]/5 text-zinc-500 hover:text-[var(--foreground)] transition-colors cursor-pointer mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/logo.png" alt="Değirmen Cafe Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Sistem Ayarları</h1>
            <p className="text-xs text-zinc-500">Yönetim Paneli Yapılandırması</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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
          <button 
            onClick={() => router.push("/")}
            className="p-2 rounded-xl hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Gövde - Ayarlar Kart Menüsü */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col justify-center items-center space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Ayarlar Modülleri</h2>
          <p className="text-sm text-zinc-500">Yapılandırmak istediğiniz ayar grubunu seçin.</p>
        </div>

        {/* Ayarlar İçindeki Özel Modül Kartları (Evernote Tasarımı) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full justify-items-center py-6 max-w-4xl">
          {settingsModules.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => router.push(item.path)}
              className="relative w-full max-w-[280px] bg-zinc-950/85 border border-zinc-800 hover:border-zinc-700/80 rounded-[2.5rem] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.6)] hover:-translate-y-1.5 select-none group animate-fadeIn"
            >
              {/* Floating Top-Right Notched Badge */}
              <span className="absolute -top-3 right-6 px-3.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[8px] font-black uppercase tracking-widest text-zinc-400 shadow-md">
                {item.tag}
              </span>

              {/* Header: Icon Box & Brand */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-orange-500/10 text-orange-400 shadow-inner">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">AYARLAR</span>
                    <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-1.5 h-1.5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Title */}
              <div className="mt-4">
                <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight group-hover:text-orange-400 transition-colors duration-300">
                  {item.label}
                </h3>
              </div>

              {/* Body Metrics Grid */}
              <div className="grid grid-cols-3 gap-1 py-3 my-2 border-t border-b border-zinc-900/80 text-center">
                <div>
                  <div className="text-[7px] text-zinc-500 uppercase font-black tracking-wider">Erişim</div>
                  <div className="text-[10px] font-extrabold text-zinc-300 mt-1">Yönetici</div>
                </div>
                <div className="border-l border-zinc-900/80">
                  <div className="text-[7px] text-zinc-500 uppercase font-black tracking-wider">Tür</div>
                  <div className="text-[10px] font-extrabold text-zinc-300 mt-1">Sistem</div>
                </div>
                <div className="border-l border-zinc-900/80">
                  <div className="text-[7px] text-zinc-500 uppercase font-black tracking-wider">Kapsam</div>
                  <div className="text-[10px] font-extrabold text-emerald-400 mt-1">Global</div>
                </div>
              </div>

              {/* Footer Content: CTA Button */}
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 leading-none">
                  YÖNETİCİ MODU
                </span>
                <button className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-750 text-zinc-950 font-black uppercase tracking-wider text-[8px] px-4.5 py-2 rounded-full transition-all duration-300 hover:scale-[1.03] cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                  Yapılandır
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border)] bg-[var(--card)] py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500">
        <div>
          <span>© 2026 Değirmen Cafe. Tüm hakları saklıdır.</span>
        </div>
      </footer>

      {/* Toast Bildirim */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-5 py-3 rounded-2xl text-xs font-bold shadow-xl backdrop-blur-md animate-slideUp">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
