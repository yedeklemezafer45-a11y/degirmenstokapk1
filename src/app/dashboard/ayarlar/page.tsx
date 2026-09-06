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
  Boxes,
  Users
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
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 flex flex-col justify-center items-center space-y-8 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest">
            <Boxes className="w-3.5 h-3.5" />
            Yönetim & Yapılandırma
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            Sistem Ayarları Modülleri
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
            Yapılandırmak istediğiniz ayar grubunu seçin. Tüm modüller anlık olarak canlı sistemle senkronizedir.
          </p>
        </div>

        {/* İkon Tabanlı Modern UI/UX Kartlar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl justify-items-stretch">
          
          {[
            {
              id: "stok-kontrolu",
              title: "Stok Listesi Kontrolü",
              description: "Hammadde tanımlama, kategori yönetimi, asgari stok ve birim ayarları.",
              path: "/dashboard/ayarlar/stok-kontrolu",
              icon: Boxes,
              badge: "ENVANTER",
              iconBg: "bg-orange-500/10 text-orange-500 border-orange-500/20",
              glowColor: "rgba(249, 115, 22, 0.2)"
            },
            {
              id: "recete-kontrolu",
              title: "Reçeteler Listesi Kontrolü",
              description: "Barista hazırlık rehberi, standart gramajlar ve yeni içecek reçete kataloğu.",
              path: "/dashboard/ayarlar/recete-kontrolu",
              icon: BookOpen,
              badge: "REÇETE",
              iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
              glowColor: "rgba(16, 185, 129, 0.2)"
            },
            {
              id: "skt-kontrolu",
              title: "SKT Takip Kontrolü",
              description: "Son tüketim tarihi kritik eşikleri, uyarı süreleri ve parti takibi.",
              path: "/dashboard/ayarlar/skt-kontrolu",
              icon: Calendar,
              badge: "GIDA GÜVENLİĞİ",
              iconBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
              glowColor: "rgba(244, 63, 94, 0.2)"
            },
            {
              id: "personel-yetkileri",
              title: "Yetki & Personel Ayarları",
              description: "Kullanıcı hesapları, şube erişimleri, şifreler ve rol bazlı menü izinleri.",
              path: "/dashboard/ayarlar/personel-yetkileri",
              icon: Users,
              badge: "GÜVENLİK",
              iconBg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
              glowColor: "rgba(168, 85, 247, 0.2)"
            },
            {
              id: "islem-gecmisi",
              title: "Kullanıcı İşlem Geçmişi",
              description: "Sistemde yapılan sayım, sipariş ve stok devir hareketlerinin denetim kayıtları.",
              path: "/dashboard/ayarlar/islem-gecmisi",
              icon: History,
              badge: "DENETİM LOGU",
              iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
              glowColor: "rgba(59, 130, 246, 0.2)"
            },
            {
              id: "duyuru-yonetimi",
              title: "Duyuru Yönetimi",
              description: "Ana ekranda tüm personele gösterilen anlık sistem ve vardiya duyuruları.",
              path: "/dashboard/ayarlar/duyuru-yonetimi",
              icon: Megaphone,
              badge: "İLETİŞİM",
              iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
              glowColor: "rgba(245, 158, 11, 0.2)"
            },
            {
              id: "siparis-ayarlari",
              title: "Sipariş Menüsü Ayarları",
              description: "Sipariş verilebilir hammaddeler, koli/kutu birimleri ve WhatsApp şablonları.",
              path: "/dashboard/ayarlar/siparis-ayarlari",
              icon: ShoppingCart,
              badge: "TEDARİK",
              iconBg: "bg-teal-500/10 text-teal-500 border-teal-500/20",
              glowColor: "rgba(20, 184, 166, 0.2)"
            }
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => router.push(item.path)}
                className="group relative p-6 bg-[var(--card)] hover:bg-[var(--card)]/90 border border-[var(--border)] hover:border-orange-500/40 rounded-[2rem] flex flex-col justify-between space-y-5 transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer select-none overflow-hidden"
                style={{
                  boxShadow: `0 10px 30px -10px ${item.glowColor}`
                }}
              >
                {/* Background Ambient Glow on Hover */}
                <div 
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
                  style={{ background: item.glowColor }}
                />

                {/* Top Row: Prominent Icon + Tag Badge */}
                <div className="flex items-center justify-between z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${item.iconBg}`}>
                    <IconComp className="w-7 h-7" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl bg-[var(--background)] text-zinc-400 border border-[var(--border)] shadow-xs">
                    {item.badge}
                  </span>
                </div>

                {/* Middle Content: Title & Description */}
                <div className="space-y-2 z-10">
                  <h3 className="text-base font-black tracking-tight text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    Yapılandır
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[var(--background)] group-hover:bg-orange-500 group-hover:text-white border border-[var(--border)] flex items-center justify-center text-zinc-400 transition-all duration-300 group-hover:translate-x-1 shadow-sm">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}

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
